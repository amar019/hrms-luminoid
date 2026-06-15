const Subtask = require('../models/Subtask');
const ProjectTask = require('../models/ProjectTask');
const Task = require('../models/Task');
const User = require('../models/User');
const SubtaskSyncService = require('../services/subtaskSyncService');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// Helper to verify elevated access permissions
const isElevatedUser = (user) => ['ADMIN', 'HR', 'MANAGER'].includes(user.role);

// Validate permissions for Project Tasks
const checkProjectTaskPermission = async (user, parentTaskId, action) => {
  const pt = await ProjectTask.findById(parentTaskId);
  if (!pt) return false;

  // Task creator check (assigner)
  const isAssigner = pt.assignedBy && pt.assignedBy.toString() === user.id;
  return !!isAssigner;
};

// Validate permissions for General Tasks
const checkGeneralTaskPermission = async (user, parentTaskId, action) => {
  const t = await Task.findById(parentTaskId);
  if (!t) return false;

  // Task creator check (assigner)
  const isCreator = t.assignedBy && t.assignedBy.toString() === user.id;
  return !!isCreator;
};

// Get Subtasks list (with filtering, search, pagination)
exports.getSubtasks = async (req, res) => {
  try {
    const { parentTask, parentType, owner, status, priority, search, limit = 50, page = 1 } = req.query;
    const filter = { isDeleted: { $ne: true } };

    if (parentTask) filter.parentTask = parentTask;
    if (req.query.projectId) {
      const taskQuery = {};
      if (req.query.projectId === 'general') {
        taskQuery.$or = [
          { project: { $exists: false } },
          { project: null }
        ];
      } else {
        taskQuery.project = req.query.projectId;
      }
      const tasks = await ProjectTask.find(taskQuery).select('_id').lean();
      filter.parentTask = { $in: tasks.map(t => t._id) };
      filter.parentType = 'PROJECT_TASK';
    }
    if (parentType) filter.parentType = parentType;
    if (owner) filter.owner = owner;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const subtasks = await Subtask.find(filter)
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Subtask.countDocuments(filter);

    res.json({
      subtasks,
      total,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    logger.error('Error in getSubtasks:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Fetch subtask details by ID
exports.getSubtaskById = async (req, res) => {
  try {
    const subtask = await Subtask.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .populate('comments.author', 'firstName lastName email profileImage')
      .populate('activityLog.user', 'firstName lastName email profileImage');

    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });
    res.json(subtask);
  } catch (err) {
    logger.error('Error in getSubtaskById:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a Subtask
exports.createSubtask = async (req, res) => {
  try {
    const { parentTask, parentType, title, dueDate, priority, description, estimatedHours, tags } = req.body;

    if (!parentTask || !parentType || !title || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields (parentTask, parentType, title, dueDate).' });
    }

    // Resolve parent assignee automatically (Rule 2)
    let resolvedOwner = null;
    if (parentType === 'PROJECT_TASK') {
      const pt = await ProjectTask.findById(parentTask);
      if (!pt) {
        return res.status(404).json({ error: 'Parent Project Task not found.' });
      }
      resolvedOwner = pt.owner;
    } else {
      const t = await Task.findById(parentTask);
      if (!t) {
        return res.status(404).json({ error: 'Parent General Task not found.' });
      }
      resolvedOwner = t.assignedTo && t.assignedTo[0];
    }

    if (!resolvedOwner) {
      return res.status(400).json({ error: 'Parent task does not have an assigned employee to inherit.' });
    }

    // Permission check
    let hasPermission = false;
    if (parentType === 'PROJECT_TASK') {
      hasPermission = await checkProjectTaskPermission(req.user, parentTask, 'create');
    } else {
      hasPermission = await checkGeneralTaskPermission(req.user, parentTask, 'create');
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to add subtasks under this task.' });
    }

    const subtask = new Subtask({
      title,
      description,
      parentTask,
      parentType,
      owner: resolvedOwner,
      assignedBy: req.user.id,
      priority: priority || 'Medium',
      status: 'Pending',
      dueDate,
      estimatedHours: estimatedHours || 0,
      tags: tags || [],
      comments: [],
      activityLog: [{
        type: 'CREATE',
        user: req.user.id,
        message: `Subtask created by ${req.user.firstName} ${req.user.lastName}`
      }]
    });

    await subtask.save();

    // Trigger parent sync
    await SubtaskSyncService.syncParentTask(parentTask, parentType);

    // Send notification
    await NotificationService.notifySubtaskAssigned(subtask, req.user.id);

    res.status(201).json(subtask);
  } catch (err) {
    logger.error('Error in createSubtask:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update a Subtask
exports.updateSubtask = async (req, res) => {
  try {
    const subtask = await Subtask.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    // Validate update permissions
    // Elevates (Admin/HR/Manager/Leader) or Parent Task Owner or Subtask Creator can do any edit.
    // Subtask Assignee can only update status, comments, attachments, actualHours.
    const isAssigner = subtask.assignedBy.toString() === req.user.id;
    const isAssignee = subtask.owner.toString() === req.user.id;
    
    let hasFullAccess = false;
    if (subtask.parentType === 'PROJECT_TASK') {
      hasFullAccess = await checkProjectTaskPermission(req.user, subtask.parentTask, 'edit') || isAssigner;
    } else {
      hasFullAccess = await checkGeneralTaskPermission(req.user, subtask.parentTask, 'edit') || isAssigner;
    }

    const allowedForAssignee = ['status', 'actualHours', 'comments', 'attachments'];
    const updates = Object.keys(req.body).filter(u => u !== 'owner');
    const assigneeIsViolating = updates.some(u => !allowedForAssignee.includes(u));

    if (!hasFullAccess && (!isAssignee || assigneeIsViolating)) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to edit these subtask fields.' });
    }

    // Capture logs for key changes
    const logEntries = [];
    const changeNotifications = {};

    if (req.body.status && req.body.status !== subtask.status) {
      logEntries.push({
        type: 'STATUS_CHANGE',
        user: req.user.id,
        message: `Status updated from ${subtask.status} to ${req.body.status}`
      });
      changeNotifications.status = req.body.status;
    }

    if (req.body.dueDate && new Date(req.body.dueDate).getTime() !== new Date(subtask.dueDate).getTime()) {
      logEntries.push({
        type: 'DUE_DATE_CHANGE',
        user: req.user.id,
        message: `Due date changed from ${new Date(subtask.dueDate).toLocaleDateString()} to ${new Date(req.body.dueDate).toLocaleDateString()}`
      });
      changeNotifications.dueDate = req.body.dueDate;
    }

    if (req.body.priority && req.body.priority !== subtask.priority) {
      logEntries.push({
        type: 'UPDATE',
        user: req.user.id,
        message: `Priority changed from ${subtask.priority} to ${req.body.priority}`
      });
    }

    // Apply updates
    updates.forEach(u => {
      if (u !== 'comments' && u !== 'activityLog' && u !== 'attachments') {
        subtask[u] = req.body[u];
      }
    });

    if (logEntries.length > 0) {
      subtask.activityLog.push(...logEntries);
    } else {
      subtask.activityLog.push({
        type: 'UPDATE',
        user: req.user.id,
        message: 'Subtask fields updated'
      });
    }

    await subtask.save();

    // Trigger parent sync
    await SubtaskSyncService.syncParentTask(subtask.parentTask, subtask.parentType);

    // Send notifications based on changes
    if (changeNotifications.status === 'Completed') {
      await NotificationService.notifySubtaskCompleted(subtask, req.user.id);
    } else if (changeNotifications.status === 'Blocked') {
      await NotificationService.notifySubtaskBlocked(subtask, req.user.id);
    } else if (changeNotifications.status) {
      await NotificationService.notifySubtaskUpdated(subtask, req.user.id, { status: changeNotifications.status });
    }

    if (changeNotifications.dueDate) {
      await NotificationService.notifySubtaskDueDateChanged(subtask, req.user.id);
    }



    res.json(subtask);
  } catch (err) {
    logger.error('Error in updateSubtask:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Soft Delete a Subtask
exports.deleteSubtask = async (req, res) => {
  try {
    const subtask = await Subtask.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    // Permissions check: must be elevated user, task owner or subtask creator
    const isAssigner = subtask.assignedBy.toString() === req.user.id;
    let hasPermission = false;

    if (subtask.parentType === 'PROJECT_TASK') {
      hasPermission = await checkProjectTaskPermission(req.user, subtask.parentTask, 'delete') || isAssigner;
    } else {
      hasPermission = await checkGeneralTaskPermission(req.user, subtask.parentTask, 'delete') || isAssigner;
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to delete this subtask.' });
    }

    subtask.isDeleted = true;
    subtask.activityLog.push({
      type: 'UPDATE',
      user: req.user.id,
      message: 'Subtask deleted (soft delete)'
    });
    await subtask.save();

    // Trigger parent sync
    await SubtaskSyncService.syncParentTask(subtask.parentTask, subtask.parentType);

    res.json({ message: 'Subtask deleted successfully' });
  } catch (err) {
    logger.error('Error in deleteSubtask:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add Comment to Subtask
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const subtask = await Subtask.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    // Access check: only subtask assignee, creator, or users with parent task edit access
    const isAssigner = subtask.assignedBy.toString() === req.user.id;
    const isAssignee = subtask.owner.toString() === req.user.id;
    
    let hasAccess = isAssigner || isAssignee;
    if (!hasAccess) {
      if (subtask.parentType === 'PROJECT_TASK') {
        hasAccess = await checkProjectTaskPermission(req.user, subtask.parentTask, 'edit');
      } else {
        hasAccess = await checkGeneralTaskPermission(req.user, subtask.parentTask, 'edit');
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to comment on this subtask.' });
    }

    // Mentions parsing (@username)
    const mentionRegex = /@(\w+)/g;
    const mentionsList = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentionsList.push(match[1]);
    }

    const mentionedUsers = await User.find({
      $or: [
        { firstName: { $in: mentionsList } },
        { lastName: { $in: mentionsList } }
      ]
    });

    const comment = {
      author: req.user.id,
      text: text,
      mentions: mentionedUsers.map(u => u._id)
    };

    subtask.comments.push(comment);
    subtask.activityLog.push({
      type: 'COMMENT_ADD',
      user: req.user.id,
      message: `Comment added by ${req.user.firstName} ${req.user.lastName}`
    });

    await subtask.save();

    // Trigger notifications
    await NotificationService.notifySubtaskCommentAdded(subtask, comment, req.user.id);

    const populated = await Subtask.findById(subtask._id)
      .populate('comments.author', 'firstName lastName profileImage');

    res.status(201).json(populated.comments[populated.comments.length - 1]);
  } catch (err) {
    logger.error('Error in addComment:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Attach File Upload Url reference to Subtask
exports.addAttachment = async (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Attachment name and URL are required.' });

    const subtask = await Subtask.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    // Access check: only subtask assignee, creator, or users with parent task edit access
    const isAssigner = subtask.assignedBy.toString() === req.user.id;
    const isAssignee = subtask.owner.toString() === req.user.id;
    
    let hasAccess = isAssigner || isAssignee;
    if (!hasAccess) {
      if (subtask.parentType === 'PROJECT_TASK') {
        hasAccess = await checkProjectTaskPermission(req.user, subtask.parentTask, 'edit');
      } else {
        hasAccess = await checkGeneralTaskPermission(req.user, subtask.parentTask, 'edit');
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to attach files to this subtask.' });
    }

    subtask.attachments.push({ name, url, uploadDate: new Date() });
    subtask.activityLog.push({
      type: 'ATTACHMENT_UPLOAD',
      user: req.user.id,
      message: `Attachment uploaded: "${name}"`
    });

    await subtask.save();
    res.status(201).json(subtask.attachments[subtask.attachments.length - 1]);
  } catch (err) {
    logger.error('Error in addAttachment:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Dashboard Analytics for Subtasks
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { projectId } = req.query;
    
    // Filter matching active subtasks
    const matchQuery = { isDeleted: { $ne: true } };

    if (projectId) {
      // Find all parent tasks linked to this project
      const tasks = await ProjectTask.find({ project: projectId }).select('_id');
      matchQuery.parentTask = { $in: tasks.map(t => t._id) };
      matchQuery.parentType = 'PROJECT_TASK';
    }

    const totalSubtasks = await Subtask.countDocuments(matchQuery);
    const completedSubtasks = await Subtask.countDocuments({ ...matchQuery, status: 'Completed' });
    const pendingSubtasks = await Subtask.countDocuments({ ...matchQuery, status: { $in: ['Pending', 'In Progress', 'Review'] } });
    const blockedSubtasks = await Subtask.countDocuments({ ...matchQuery, status: 'Blocked' });
    
    const now = new Date();
    const overdueSubtasks = await Subtask.countDocuments({ 
      ...matchQuery, 
      dueDate: { $lt: now }, 
      status: { $ne: 'Completed' } 
    });

    // Employee workload aggregation
    const workloadAgg = await Subtask.aggregate([
      { $match: matchQuery },
      { $group: {
          _id: '$owner',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ['$status', ['Pending', 'In Progress', 'Review']] }, 1, 0] } },
          blocked: { $sum: { $cond: [{ $eq: ['$status', 'Blocked'] }, 1, 0] } }
      } }
    ]);

    // Populate user names for workloads
    const employeeWorkloads = [];
    for (const record of workloadAgg) {
      if (record._id) {
        const emp = await User.findById(record._id).select('firstName lastName profileImage designation');
        if (emp) {
          const completionRate = record.total > 0 ? Math.round((record.completed / record.total) * 100) : 0;
          employeeWorkloads.push({
            employee: emp,
            total: record.total,
            completed: record.completed,
            pending: record.pending,
            blocked: record.blocked,
            completionRate
          });
        }
      }
    }

    // Average completion time calculation in Hours
    const completedTasks = await Subtask.find({ ...matchQuery, status: 'Completed' });
    let totalTimeMs = 0;
    let counted = 0;
    completedTasks.forEach(s => {
      if (s.createdAt && s.updatedAt) {
        totalTimeMs += (new Date(s.updatedAt) - new Date(s.createdAt));
        counted++;
      }
    });

    const averageCompletionTimeHours = counted > 0 ? (totalTimeMs / (1000 * 60 * 60 * counted)).toFixed(1) : 0;

    res.json({
      total: totalSubtasks,
      completed: completedSubtasks,
      pending: pendingSubtasks,
      blocked: blockedSubtasks,
      overdue: overdueSubtasks,
      employeeWorkloads,
      averageCompletionTimeHours: parseFloat(averageCompletionTimeHours)
    });
  } catch (err) {
    logger.error('Error in getDashboardAnalytics:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
