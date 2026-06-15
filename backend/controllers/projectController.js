const Project = require('../models/Project');
const ProjectDailyUpdate = require('../models/ProjectDailyUpdate');
const ProjectTask = require('../models/ProjectTask');
const User = require('../models/User');
const logger = require('../utils/logger');

// Helpers for checks
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

// === PROJECTS CRUDS ===
exports.createProject = async (req, res) => {
  try {
    if (!isElevatedRole(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    const project = new Project(req.body);
    await project.save();

    res.status(201).json(project);
  } catch (err) {
    logger.error('Error creating Project', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('leader', 'firstName lastName email designation profileImage')
      .populate('members', 'firstName lastName email designation profileImage')
      .lean();

    const taskStats = await ProjectTask.aggregate([
      {
        $group: {
          _id: "$project",
          openTasks: { $sum: { $cond: [{ $ne: ["$status", "Completed"] }, 1, 0] } },
          completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
        }
      }
    ]);

    const statsMap = new Map();
    taskStats.forEach(stat => {
      if (stat._id) statsMap.set(stat._id.toString(), stat);
    });

    const projectsWithStats = projects.map(project => {
      const stats = statsMap.get(project._id.toString()) || { openTasks: 0, completedTasks: 0 };
      return {
        ...project,
        openTasks: stats.openTasks,
        completedTasks: stats.completedTasks
      };
    });

    res.json(projectsWithStats);
  } catch (err) {
    logger.error('Error fetching Projects', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('leader', 'firstName lastName email designation profileImage')
      .populate('members', 'firstName lastName email designation profileImage')
      .lean();

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Access check: only elevated users, project leader, or members can access project details
    if (!isElevatedRole(req.user.role)) {
      const isLeader = project.leader && project.leader._id.toString() === req.user.id;
      const isMember = project.members && project.members.some(m => m._id.toString() === req.user.id);
      if (!isLeader && !isMember) {
        return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
      }
    }

    const openTasks = await ProjectTask.countDocuments({ project: project._id, status: { $ne: 'Completed' } });
    const completedTasks = await ProjectTask.countDocuments({ project: project._id, status: 'Completed' });

    res.json({
      ...project,
      openTasks,
      completedTasks
    });
  } catch (err) {
    logger.error('Error fetching Project by ID', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isLeader = project.leader.toString() === req.user.id;
    if (!isElevatedRole(req.user.role) && !isLeader) {
      return res.status(403).json({ error: 'Permission denied to edit project' });
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('leader', 'firstName lastName email profileImage')
      .populate('members', 'firstName lastName email profileImage');

    res.json(updated);
  } catch (err) {
    logger.error('Error updating Project', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// === DAILY UPDATES ===
exports.createDailyUpdate = async (req, res) => {
  try {
    const { projectId, taskId, module, taskType, workDone, hoursWorked, progressPercent, blockers, tomorrowPlan, remarks, date } = req.body;

    const targetDate = date ? new Date(date) : new Date();
    const startOfTarget = new Date(targetDate);
    startOfTarget.setHours(0, 0, 0, 0);
    const endOfTarget = new Date(targetDate);
    endOfTarget.setHours(23, 59, 59, 999);

    // Rule: One update per employee per task per day
    if (taskId) {
      const existingUpdate = await ProjectDailyUpdate.findOne({
        userId: req.user.id,
        taskId: taskId,
        date: { $gte: startOfTarget, $lte: endOfTarget }
      });
      if (existingUpdate) {
        return res.status(400).json({ error: 'You have already logged a daily update for this task today.' });
      }
    }

    // Create ProjectDailyUpdate log
    const updateLog = new ProjectDailyUpdate({
      userId: req.user.id,
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      module,
      taskType,
      workDone,
      hoursWorked: Number(hoursWorked),
      progressPercent: Number(progressPercent || 0),
      blockers,
      tomorrowPlan,
      remarks,
      date: targetDate
    });

    await updateLog.save();

    // Sync progress and status back to ProjectTask
    if (taskId) {
      const task = await ProjectTask.findById(taskId);
      if (task) {
        task.progressPercent = Number(progressPercent || 0);

        if (Number(progressPercent) === 100) {
          task.status = 'Completed';
        } else if (task.status === 'Pending') {
          task.status = 'In Progress';
        }

        if (blockers && blockers.trim()) {
          task.status = 'Blocked';
          task.blocker = blockers;
        } else if (task.status === 'Blocked') {
          // Unblock if update says progress continued and blocker is cleared
          task.status = 'In Progress';
          task.blocker = '';
        }

        await task.save();
      }
    }

    // Recalculate Project completion progress dynamically
    if (projectId) {
      const totalTasks = await ProjectTask.countDocuments({ project: projectId });
      if (totalTasks > 0) {
        const completedTasks = await ProjectTask.countDocuments({ project: projectId, status: 'Completed' });
        const progress = Math.round((completedTasks / totalTasks) * 100);
        await Project.findByIdAndUpdate(projectId, { progressPercent: progress });
      }
    }

    const populatedUpdate = await ProjectDailyUpdate.findById(updateLog._id)
      .populate('userId', 'firstName lastName email')
      .populate('projectId', 'name code')
      .populate('taskId', 'title taskId');

    res.status(201).json(populatedUpdate);
  } catch (err) {
    logger.error('Error creating Daily Update', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getProjectDailyUpdates = async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.taskId) filter.taskId = req.query.taskId;

    // Enforce security: Standard employees can only fetch their own daily updates unless they lead a project
    if (req.user.role === 'EMPLOYEE') {
      const ledProjects = await Project.find({ leader: req.user.id }).select('_id');
      const ledProjectIds = ledProjects.map(p => p._id.toString());

      if (ledProjectIds.length > 0) {
        filter.$or = [
          { userId: req.user.id },
          { projectId: { $in: ledProjectIds } }
        ];

        if (req.query.projectId) {
          if (ledProjectIds.includes(req.query.projectId.toString())) {
            filter.projectId = req.query.projectId;
            delete filter.$or;
          } else {
            filter.projectId = req.query.projectId;
            filter.userId = req.user.id;
            delete filter.$or;
          }
        }

        if (req.query.userId) {
          if (req.query.userId.toString() !== req.user.id.toString()) {
            filter.userId = req.query.userId;
            filter.projectId = { $in: ledProjectIds };
            delete filter.$or;
          } else {
            filter.userId = req.user.id;
            delete filter.$or;
          }
        }
      } else {
        filter.userId = req.user.id;
        if (req.query.projectId) filter.projectId = req.query.projectId;
      }
    } else if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        start.setHours(0,0,0,0);
        filter.date.$gte = start;
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23,59,59,999);
        filter.date.$lte = end;
      }
    } else if (req.query.date) {
      const targetDate = new Date(req.query.date);
      const start = new Date(targetDate);
      start.setHours(0,0,0,0);
      const end = new Date(targetDate);
      end.setHours(23,59,59,999);
      filter.date = { $gte: start, $lte: end };
    }

    const updates = await ProjectDailyUpdate.find(filter)
      .populate('userId', 'firstName lastName email designation profileImage')
      .populate('projectId', 'name code')
      .populate('taskId', 'title taskId')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.json(updates);
  } catch (err) {
    logger.error('Error fetching Daily Updates', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Timeline view sorted by date
exports.getProjectTimeline = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!isElevatedRole(req.user.role)) {
      const isLeader = project.leader && project.leader.toString() === req.user.id;
      const isMember = project.members && project.members.some(m => m.toString() === req.user.id);
      if (!isLeader && !isMember) {
        return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
      }
    }

    const filter = { projectId: id };

    // Check if elevated role or project leader
    const isLeaderOrAdmin = 
      ['ADMIN', 'HR', 'MANAGER'].includes(req.user.role) || 
      (project.leader && project.leader.toString() === req.user.id);

    if (!isLeaderOrAdmin) {
      filter.userId = req.user.id;
    }

    const updates = await ProjectDailyUpdate.find(filter)
      .populate('userId', 'firstName lastName email profileImage designation')
      .populate('taskId', 'title taskId')
      .sort({ date: -1, createdAt: -1 })
      .lean();
    res.json(updates);
  } catch (err) {
    logger.error('Error fetching timeline', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Project specific analytics (Project Leader Dashboard KPIs)
exports.getProjectAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!isElevatedRole(req.user.role)) {
      const isLeader = project.leader && project.leader.toString() === req.user.id;
      const isMember = project.members && project.members.some(m => m.toString() === req.user.id);
      if (!isLeader && !isMember) {
        return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
      }
    }

    const now = new Date();
    const totalTasks = await ProjectTask.countDocuments({ project: id });
    const completedTasks = await ProjectTask.countDocuments({ project: id, status: 'Completed' });
    const inProgressTasks = await ProjectTask.countDocuments({ project: id, status: 'In Progress' });
    const blockedTasks = await ProjectTask.countDocuments({ project: id, status: 'Blocked' });
    const delayedTasks = await ProjectTask.countDocuments({
      project: id,
      status: { $ne: 'Completed' },
      eta: { $lt: now }
    });

    const tasks = await ProjectTask.find({ project: id }).lean();
    const avgProgress = tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + (t.progressPercent || 0), 0) / tasks.length)
      : 0;

    const updates = await ProjectDailyUpdate.find({ projectId: id }).lean();
    const totalHours = updates.reduce((sum, u) => sum + (u.hoursWorked || 0), 0);

    // Submission rate today: % of project team members who submitted updates today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const submissionsToday = await ProjectDailyUpdate.find({
      projectId: id,
      date: { $gte: startOfToday, $lte: endOfToday }
    }).distinct('userId');

    const totalTeamMembers = (project.members?.length || 0) + 1; // Members + Leader
    const submissionRateToday = totalTeamMembers > 0
      ? Math.round((submissionsToday.length / totalTeamMembers) * 100)
      : 0;

    // Team productivity and employee contribution
    const employeeContributionsMap = {};
    updates.forEach(u => {
      const name = u.userId ? `${u.userId.firstName} ${u.userId.lastName}` : 'Unknown';
      if (!employeeContributionsMap[name]) {
        employeeContributionsMap[name] = { hours: 0, tasks: new Set() };
      }
      employeeContributionsMap[name].hours += u.hoursWorked || 0;
      if (u.taskId) {
        employeeContributionsMap[name].tasks.add(u.taskId.toString());
      }
    });

    const employeeContributions = Object.keys(employeeContributionsMap).map(name => ({
      name,
      hours: employeeContributionsMap[name].hours,
      tasksCount: employeeContributionsMap[name].tasks.size
    }));

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      delayedTasks,
      averageProgress: avgProgress,
      totalHours,
      submissionRateToday,
      employeeContributions
    });
  } catch (err) {
    logger.error('Error fetching analytics', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// === DASHBOARD STATS ===
exports.getDashboardStats = async (req, res) => {
  try {
    const total = await Project.countDocuments();
    const active = await Project.countDocuments({ status: 'Active' });
    const completed = await Project.countDocuments({ status: 'Completed' });
    
    // Delayed projects count: status is not Completed and end date has passed
    const delayed = await Project.countDocuments({
      status: { $ne: 'Completed' },
      endDate: { $lt: new Date() }
    });

    const projects = await Project.find().populate('leader', 'firstName lastName').lean();
    const leadersMap = new Map();
    projects.forEach(p => {
      if (p.leader) {
        leadersMap.set(p.leader._id.toString(), `${p.leader.firstName} ${p.leader.lastName}`);
      }
    });
    const leaders = Array.from(leadersMap.values());

    const projectProgress = projects.map(p => ({
      name: p.name,
      progress: p.progressPercent || 0
    }));

    const recentUpdates = await ProjectDailyUpdate.find()
      .populate('userId', 'firstName lastName profileImage')
      .populate('projectId', 'name code')
      .populate('taskId', 'title taskId')
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      totalProjects: total,
      activeProjects: active,
      completedProjects: completed,
      delayedProjects: delayed,
      projectLeaders: leaders,
      projectProgress,
      recentUpdates
    });
  } catch (err) {
    logger.error('Error fetching Dashboard stats', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Employee Dashboard
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    // My Projects (projects where user is leader or in members list)
    const myProjects = await Project.find({
      $or: [
        { leader: userId },
        { members: userId }
      ]
    }).populate('leader', 'firstName lastName').lean();

    // My Tasks
    const myTasks = await ProjectTask.find({ owner: userId })
      .populate('project', 'name code')
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .sort({ eta: 1 })
      .lean();

    const pendingTasks = myTasks.filter(t => t.status !== 'Completed');

    // Today's update status
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const updateToday = await ProjectDailyUpdate.findOne({
      userId,
      date: { $gte: startOfToday, $lte: endOfToday }
    }).lean();

    // Recent updates from this employee
    const recentUpdates = await ProjectDailyUpdate.find({ userId })
      .populate('projectId', 'name code')
      .populate('taskId', 'title taskId')
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();

    // Upcoming Deadlines (within next 7 days, not completed)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingDeadlines = myTasks.filter(t =>
      t.status !== 'Completed' &&
      t.eta &&
      new Date(t.eta) >= startOfToday &&
      new Date(t.eta) <= nextWeek
    );

    res.json({
      myProjects,
      myTasks,
      hasSubmittedUpdateToday: !!updateToday,
      pendingTasksCount: pendingTasks.length,
      recentUpdates,
      upcomingDeadlines
    });
  } catch (err) {
    logger.error('Error fetching Employee Dashboard stats', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProjectTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!isElevatedRole(req.user.role)) {
      const isLeader = project.leader && project.leader.toString() === req.user.id;
      const isMember = project.members && project.members.some(m => m.toString() === req.user.id);
      if (!isLeader && !isMember) {
        return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
      }
    }

    const tasks = await ProjectTask.find({ project: req.params.id })
      .populate('owner', 'firstName lastName email profileImage designation')
      .populate('assignedBy', 'firstName lastName email profileImage designation')
      .lean();
    res.json(tasks);
  } catch (err) {
    logger.error('Error fetching project tasks', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isLeader = project.leader.toString() === req.user.id;
    if (!isElevatedRole(req.user.role) && !isLeader) {
      return res.status(403).json({ error: 'Permission denied to delete project' });
    }

    // Delete related tasks and daily updates
    await ProjectTask.deleteMany({ project: req.params.id });
    await ProjectDailyUpdate.deleteMany({ projectId: req.params.id });

    // Delete project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and all related tasks/updates deleted successfully' });
  } catch (err) {
    logger.error('Error deleting Project', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// === UPDATE PROJECT DAILY UPDATE ===
exports.updateProjectDailyUpdate = async (req, res) => {
  try {
    const update = await ProjectDailyUpdate.findById(req.params.id);
    if (!update) return res.status(404).json({ error: 'Daily update not found' });

    // Access check: creator of the update, project leader, or elevated roles
    const isOwner = update.userId.toString() === req.user.id;
    if (!isOwner && !isElevatedRole(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied to edit this update log' });
    }

    const { module, taskType, workDone, hoursWorked, progressPercent, blockers, tomorrowPlan, date } = req.body;

    if (workDone) update.workDone = workDone;
    if (hoursWorked) update.hoursWorked = Number(hoursWorked);
    if (progressPercent !== undefined) update.progressPercent = Number(progressPercent);
    if (blockers !== undefined) update.blockers = blockers;
    if (tomorrowPlan !== undefined) update.tomorrowPlan = tomorrowPlan;
    if (module !== undefined) update.module = module;
    if (taskType !== undefined) update.taskType = taskType;
    if (date) update.date = new Date(date);

    await update.save();

    // Sync task progress and status if task is associated
    if (update.taskId) {
      const task = await ProjectTask.findById(update.taskId);
      if (task) {
        task.progressPercent = Number(progressPercent || 0);

        if (Number(progressPercent) === 100) {
          task.status = 'Completed';
        } else if (task.status === 'Pending') {
          task.status = 'In Progress';
        }

        if (blockers && blockers.trim()) {
          task.status = 'Blocked';
          task.blocker = blockers;
        } else if (task.status === 'Blocked') {
          task.status = 'In Progress';
          task.blocker = '';
        }

        await task.save();
        await syncProjectProgress(task.project);
      }
    }

    res.json({ message: 'Daily update updated successfully', update });
  } catch (err) {
    logger.error('Error updating Daily Update', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// === DELETE PROJECT DAILY UPDATE ===
exports.deleteProjectDailyUpdate = async (req, res) => {
  try {
    const update = await ProjectDailyUpdate.findById(req.params.id);
    if (!update) return res.status(404).json({ error: 'Daily update not found' });

    // Access check: creator of the update, or elevated roles
    const isOwner = update.userId.toString() === req.user.id;
    if (!isOwner && !isElevatedRole(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied to delete this update log' });
    }

    const projectId = update.projectId;
    const taskId = update.taskId;

    await ProjectDailyUpdate.findByIdAndDelete(req.params.id);

    // If task was associated, we sync progress percent back from the previous update
    if (taskId) {
      const lastUpdate = await ProjectDailyUpdate.findOne({ taskId }).sort({ date: -1, createdAt: -1 });
      const task = await ProjectTask.findById(taskId);
      if (task) {
        if (lastUpdate) {
          task.progressPercent = lastUpdate.progressPercent || 0;
          if (task.progressPercent === 100) {
            task.status = 'Completed';
          } else {
            task.status = 'In Progress';
          }
        } else {
          // If no updates are left, reset progress to 0 and status to Pending
          task.progressPercent = 0;
          task.status = 'Pending';
        }
        await task.save();
      }
    }

    if (projectId) {
      await syncProjectProgress(projectId);
    }

    res.json({ message: 'Daily update deleted successfully' });
  } catch (err) {
    logger.error('Error deleting Daily Update', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Employee Performance stats
exports.getEmployeePerformance = async (req, res) => {
  try {
    // 1. Fetch all active, non-deleted employees
    const employees = await User.find({ isDeleted: { $ne: true }, isActive: true, role: { $ne: 'ADMIN' } })
      .select('firstName lastName profileImage designation email role')
      .lean();

    // 2. Perform aggregation of tasks grouped by owner (assignee)
    const taskStats = await ProjectTask.aggregate([
      {
        $group: {
          _id: "$owner",
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] }
          },
          blockedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Blocked"] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
          },
          reviewTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Review"] }, 1, 0] }
          }
        }
      }
    ]);

    // 3. Map aggregation results back to employee list
    const statsMap = new Map();
    taskStats.forEach(stat => {
      if (stat._id) {
        statsMap.set(stat._id.toString(), stat);
      }
    });

    const result = employees.map(emp => {
      const stats = statsMap.get(emp._id.toString()) || {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        reviewTasks: 0,
        blockedTasks: 0
      };
      
      // Calculate completionPercentage safely
      const completionPercentage = stats.totalTasks > 0 
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0;

      return {
        employeeId: emp._id,
        name: `${emp.firstName} ${emp.lastName}`,
        designation: emp.designation || 'Employee',
        profileImage: emp.profileImage || '',
        email: emp.email || '',
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        inProgressTasks: stats.inProgressTasks,
        pendingTasks: stats.pendingTasks,
        reviewTasks: stats.reviewTasks,
        blockedTasks: stats.blockedTasks,
        completionPercentage
      };
    });

    // Sort by completionPercentage descending, then by completedTasks descending
    result.sort((a, b) => {
      if (b.completionPercentage !== a.completionPercentage) {
        return b.completionPercentage - a.completionPercentage;
      }
      return b.completedTasks - a.completedTasks;
    });

    res.json(result);
  } catch (err) {
    logger.error('Error fetching employee performance stats', err);
    res.status(500).json({ error: 'Server error' });
  }
};

