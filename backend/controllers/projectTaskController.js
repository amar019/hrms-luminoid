const ProjectTask = require('../models/ProjectTask');
const Project = require('../models/Project');
const User = require('../models/User');
const logger = require('../utils/logger');
const XLSX = require('xlsx');

// Helper to check if user has access / elevated permissions
const isElevatedRole = (role) => ['ADMIN', 'HR', 'MANAGER'].includes(role);

// Helper to sync project progress percent dynamically
const syncProjectProgress = async (projectId) => {
  try {
    const totalTasks = await ProjectTask.countDocuments({ project: projectId });
    if (totalTasks === 0) {
      await Project.findByIdAndUpdate(projectId, { progressPercent: 0 });
      return;
    }
    const completedTasks = await ProjectTask.countDocuments({ project: projectId, status: 'Completed' });
    const progress = Math.round((completedTasks / totalTasks) * 100);
    await Project.findByIdAndUpdate(projectId, { progressPercent: progress });
  } catch (err) {
    logger.error('Error syncing project progress', err);
  }
};

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { owner } = req.body;
    if (!owner) {
      return res.status(400).json({ error: 'Owner is a required field.' });
    }

    const taskData = { ...req.body };
    if (!taskData.project || taskData.project === '' || taskData.project === 'general') {
      delete taskData.project;
    }

    // Set the assigner of the task to the logged-in user
    taskData.assignedBy = req.user.id;

    const task = new ProjectTask(taskData);
    await task.save();
    
    // Sync project progress percent
    if (taskData.project) {
      await syncProjectProgress(taskData.project);
    }

    res.status(201).json(task);
  } catch (err) {
    logger.error('Error creating project task', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get All Tasks (optional filter by project)
exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      if (req.query.project === 'none' || req.query.project === 'general') {
        filter.$or = [
          { project: { $exists: false } },
          { project: null }
        ];
      } else {
        filter.project = req.query.project;
      }
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const tasks = await ProjectTask.find(filter)
      .populate('project', 'name code')
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(tasks);
  } catch (err) {
    logger.error('Error fetching tasks', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get My Tasks
exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await ProjectTask.find({ owner: userId })
      .populate('project', 'name code')
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .sort({ eta: 1 })
      .lean();
    res.json(tasks);
  } catch (err) {
    logger.error('Error fetching my tasks', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await ProjectTask.findById(req.params.id)
      .populate({
        path: 'project',
        select: 'name code leader members',
        populate: {
          path: 'leader',
          select: 'firstName lastName email profileImage designation'
        }
      })
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .populate('comments.author', 'firstName lastName profileImage')
      .populate('remarks.author', 'firstName lastName profileImage');
      
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    // Fetch subtasks dynamically from unified Subtask collection
    const Subtask = require('../models/Subtask');
    const subtasks = await Subtask.find({ parentTask: task._id, isDeleted: { $ne: true } })
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation');

    const taskObj = task.toObject();
    taskObj.subtasks = subtasks;

    res.json(taskObj);
  } catch (err) {
    logger.error('Error fetching task details', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const task = await ProjectTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isAssigner = task.assignedBy && task.assignedBy.toString() === req.user.id;
    const project = task.project ? await Project.findById(task.project) : null;
    const isLeaderOrAdmin = 
      ['ADMIN', 'HR', 'MANAGER'].includes(req.user.role) || 
      (project && project.leader && project.leader.toString() === req.user.id);
    
    const isOwner = task.owner && task.owner.toString() === req.user.id;

    // Permissions check
    if (!isAssigner && !isLeaderOrAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to update this task.' });
    }

    const updatedData = { ...req.body };
    if (updatedData.project === '' || updatedData.project === 'general') {
      updatedData.project = null;
    }

    // Restrict assignee and any non-creator from modifying metadata fields
    if (!isAssigner) {
      const restrictedFields = ['title', 'description', 'module', 'type', 'impact', 'priority', 'eta', 'owner', 'assignedBy', 'project'];
      const attemptedUpdates = Object.keys(updatedData);
      const violates = attemptedUpdates.some(field => restrictedFields.includes(field));
      if (violates) {
        return res.status(403).json({ error: 'Access denied. Only the task creator/assigner can modify task metadata fields (Title, Description, Priority, Owner, etc.).' });
      }
    }

    // Restrict ETA updates to assigner / leaders, not assignee
    if (updatedData.eta && (!task.eta || new Date(updatedData.eta).getTime() !== new Date(task.eta).getTime())) {
      const canEditETA = isAssigner || (isLeaderOrAdmin && !isOwner);
      if (!canEditETA) {
        return res.status(403).json({ error: 'Only the assigner or project leader can modify the ETA due date.' });
      }
    }

    // Cascade complete subtasks if main task is marked Completed
    if (updatedData.status === 'Completed') {
      const Subtask = require('../models/Subtask');
      await Subtask.updateMany(
        { parentTask: req.params.id, isDeleted: { $ne: true } },
        { status: 'Completed' }
      );
      updatedData.progressPercent = 100;
    }

    const updatedTask = await ProjectTask.findByIdAndUpdate(req.params.id, updatedData, { new: true })
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .populate('comments.author', 'firstName lastName profileImage')
      .populate('remarks.author', 'firstName lastName profileImage');

    // Fetch subtasks dynamically from unified Subtask collection
    const Subtask = require('../models/Subtask');
    const subtasks = await Subtask.find({ parentTask: updatedTask._id, isDeleted: { $ne: true } })
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation');

    // Sync parent task stats & project progress in background
    const SubtaskSyncService = require('../services/subtaskSyncService');
    await SubtaskSyncService.syncParentTask(updatedTask._id, 'PROJECT_TASK');

    // Re-fetch parent task to get final updated subtaskStats
    const finalTask = await ProjectTask.findById(updatedTask._id)
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .populate('comments.author', 'firstName lastName profileImage')
      .populate('remarks.author', 'firstName lastName profileImage');

    const taskObj = finalTask.toObject();
    taskObj.subtasks = subtasks;

    res.json(taskObj);
  } catch (err) {
    logger.error('Error updating task', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await ProjectTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!isAssigner) {
      return res.status(403).json({ error: 'Access denied. Only the task creator/assigner can delete this task.' });
    }

    await ProjectTask.findByIdAndDelete(req.params.id);

    // Sync project progress percent
    await syncProjectProgress(task.project);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    logger.error('Error deleting task', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add Comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }
    const task = await ProjectTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.comments.push({
      author: req.user.id,
      text: text
    });
    await task.save();

    const populatedTask = await ProjectTask.findById(task._id)
      .populate('comments.author', 'firstName lastName profileImage');

    res.status(201).json(populatedTask.comments[populatedTask.comments.length - 1]);
  } catch (err) {
    logger.error('Error adding comment', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add Leader Remark
exports.addRemark = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Remark text cannot be empty.' });
    }
    
    // Check if user is elevated role or leader of project
    const task = await ProjectTask.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isProjectLeader = task.project && task.project.leader.toString() === req.user.id;
    if (!isElevatedRole(req.user.role) && !isProjectLeader) {
      return res.status(403).json({ error: 'Permission denied. Only Project Leaders or Admins can add remarks.' });
    }

    task.remarks.push({
      author: req.user.id,
      text: text
    });
    await task.save();

    const populatedTask = await ProjectTask.findById(task._id)
      .populate('remarks.author', 'firstName lastName profileImage');

    res.status(201).json(populatedTask.remarks[populatedTask.remarks.length - 1]);
  } catch (err) {
    logger.error('Error adding remark', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Export to Excel
exports.exportTasksToExcel = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    let projectCode = 'GEN';
    let tasks = [];
    
    if (projectId === 'general' || projectId === 'none') {
      tasks = await ProjectTask.find({
        $or: [
          { project: { $exists: false } },
          { project: null }
        ]
      }).populate('owner', 'firstName lastName email');
    } else {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      projectCode = project.code;
      tasks = await ProjectTask.find({ project: projectId }).populate('owner', 'firstName lastName email');
    }
    
    const data = tasks.map(t => {
      // Calculate Days Left
      let daysLeft = '-';
      if (t.eta) {
        const diffTime = new Date(t.eta) - new Date();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      return {
        'Task ID': t.taskId || 'N/A',
        'Module': t.module || 'General',
        'Title': t.title || '',
        'Type': t.type || '',
        'Owner': t.owner ? `${t.owner.firstName} ${t.owner.lastName}` : 'Unassigned',
        'Status': t.status || 'Pending',
        'Progress %': t.progressPercent || 0,
        'Priority': t.priority || 'Medium',
        'ETA': t.eta ? new Date(t.eta).toLocaleDateString() : '-',
        'Days Left': daysLeft,
        'Blocker': t.blocker || '',
        'Dependency': t.dependency || '',
        'Impact': t.impact || 'Medium',
        'Notes': t.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="project_${projectCode}_tasks.xlsx"`);
    res.send(buffer);
  } catch (err) {
    logger.error('Error exporting tasks to Excel', err);
    res.status(500).json({ error: 'Server error during export' });
  }
};

// Add Subtask
exports.addSubtask = async (req, res) => {
  try {
    const { title, owner, status, eta, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Subtask title is required' });
    }
    const task = await ProjectTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const Subtask = require('../models/Subtask');
    const subtask = new Subtask({
      title,
      description,
      parentTask: task._id,
      parentType: 'PROJECT_TASK',
      owner: owner || task.owner,
      assignedBy: req.user.id,
      status: status || 'Pending',
      dueDate: eta || new Date(),
      activityLog: [{
        type: 'CREATE',
        user: req.user.id,
        message: `Subtask created via parent task drawer`
      }]
    });

    await subtask.save();

    // Re-sync parent task status & progress
    const SubtaskSyncService = require('../services/subtaskSyncService');
    await SubtaskSyncService.syncParentTask(task._id, 'PROJECT_TASK');

    // Retrieve fresh parent task with attached subtasks
    const freshTask = await ProjectTask.findById(task._id)
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .populate('comments.author', 'firstName lastName profileImage')
      .populate('remarks.author', 'firstName lastName profileImage');

    const subtasks = await Subtask.find({ parentTask: task._id, isDeleted: { $ne: true } })
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation');

    // Send notifications
    const NotificationService = require('../services/notificationService');
    await NotificationService.notifySubtaskAssigned(subtask, req.user.id);

    const taskObj = freshTask.toObject();
    taskObj.subtasks = subtasks;

    res.status(201).json(taskObj);
  } catch (err) {
    logger.error('Error adding subtask', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update Subtask
exports.updateSubtask = async (req, res) => {
  try {
    const { title, owner, status, eta, description } = req.body;
    const task = await ProjectTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const Subtask = require('../models/Subtask');
    const subtask = await Subtask.findOne({ _id: req.params.subtaskId, parentTask: task._id, isDeleted: { $ne: true } });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    const changes = {};
    if (title !== undefined && title !== subtask.title) {
      subtask.title = title;
      changes.title = title;
    }
    if (description !== undefined && description !== subtask.description) {
      subtask.description = description;
      changes.description = description;
    }
    if (owner !== undefined && owner !== (subtask.owner ? subtask.owner.toString() : '')) {
      subtask.owner = owner || null;
      changes.owner = owner;
    }
    if (status !== undefined && status !== subtask.status) {
      subtask.status = status;
      changes.status = status;
    }
    if (eta !== undefined && eta !== subtask.dueDate) {
      subtask.dueDate = eta || null;
      changes.dueDate = eta;
    }

    subtask.activityLog.push({
      type: 'UPDATE',
      user: req.user.id,
      message: 'Subtask fields updated via parent task drawer'
    });

    await subtask.save();

    // Re-sync parent task status & progress
    const SubtaskSyncService = require('../services/subtaskSyncService');
    await SubtaskSyncService.syncParentTask(task._id, 'PROJECT_TASK');

    // Retrieve fresh parent task with attached subtasks
    const freshTask = await ProjectTask.findById(task._id)
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .populate('comments.author', 'firstName lastName profileImage')
      .populate('remarks.author', 'firstName lastName profileImage');

    const subtasks = await Subtask.find({ parentTask: task._id, isDeleted: { $ne: true } })
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation');

    // Send notifications based on changes
    const NotificationService = require('../services/notificationService');
    if (changes.status === 'Completed') {
      await NotificationService.notifySubtaskCompleted(subtask, req.user.id);
    } else if (changes.status === 'Blocked') {
      await NotificationService.notifySubtaskBlocked(subtask, req.user.id);
    } else if (changes.status) {
      await NotificationService.notifySubtaskUpdated(subtask, req.user.id, { status: changes.status });
    }

    if (changes.dueDate) {
      await NotificationService.notifySubtaskDueDateChanged(subtask, req.user.id);
    }

    if (changes.owner) {
      await NotificationService.notifySubtaskAssigned(subtask, req.user.id);
    }

    const taskObj = freshTask.toObject();
    taskObj.subtasks = subtasks;

    res.json(taskObj);
  } catch (err) {
    logger.error('Error updating subtask', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Delete Subtask
exports.deleteSubtask = async (req, res) => {
  try {
    const task = await ProjectTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const Subtask = require('../models/Subtask');
    const subtask = await Subtask.findOne({ _id: req.params.subtaskId, parentTask: task._id, isDeleted: { $ne: true } });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    subtask.isDeleted = true;
    subtask.activityLog.push({
      type: 'UPDATE',
      user: req.user.id,
      message: 'Subtask deleted via parent task drawer'
    });
    await subtask.save();

    // Re-sync parent task status & progress
    const SubtaskSyncService = require('../services/subtaskSyncService');
    await SubtaskSyncService.syncParentTask(task._id, 'PROJECT_TASK');

    // Retrieve fresh parent task with attached subtasks
    const freshTask = await ProjectTask.findById(task._id)
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .populate('comments.author', 'firstName lastName profileImage')
      .populate('remarks.author', 'firstName lastName profileImage');

    const subtasks = await Subtask.find({ parentTask: task._id, isDeleted: { $ne: true } })
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation');

    const taskObj = freshTask.toObject();
    taskObj.subtasks = subtasks;

    res.json(taskObj);
  } catch (err) {
    logger.error('Error deleting subtask', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
