const mongoose = require('mongoose');
const logger = require('../utils/logger');

class SubtaskSyncService {
  static async syncParentTask(parentTaskId, parentType) {
    try {
      const Subtask = mongoose.model('Subtask');
      // Rule 2: Cascade assignee inheritance from parent to subtasks
      let resolvedOwner = null;
      if (parentType === 'PROJECT_TASK') {
        const ProjectTask = mongoose.model('ProjectTask');
        const parent = await ProjectTask.findById(parentTaskId);
        if (parent) resolvedOwner = parent.owner;
      } else if (parentType === 'GENERAL_TASK') {
        const Task = mongoose.model('Task');
        const parent = await Task.findById(parentTaskId);
        if (parent) resolvedOwner = parent.assignedTo && parent.assignedTo[0];
      }

      if (resolvedOwner) {
        await Subtask.updateMany(
          { parentTask: parentTaskId, isDeleted: { $ne: true }, owner: { $ne: resolvedOwner } },
          { owner: resolvedOwner }
        );
      }

      const subtasks = await Subtask.find({ parentTask: parentTaskId, isDeleted: { $ne: true } });
      
      const total = subtasks.length;
      const completed = subtasks.filter(s => s.status === 'Completed').length;
      const pending = subtasks.filter(s => ['Pending', 'In Progress', 'Review'].includes(s.status)).length;
      const blocked = subtasks.filter(s => s.status === 'Blocked').length;
      
      // Calculate overdue subtasks
      const now = new Date();
      const overdue = subtasks.filter(s => s.dueDate && new Date(s.dueDate) < now && s.status !== 'Completed').length;

      const hasBlocked = blocked > 0;

      if (parentType === 'PROJECT_TASK') {
        const ProjectTask = mongoose.model('ProjectTask');
        
        const updateData = {
          subtaskStats: { total, completed, pending, blocked, overdue }
        };

        if (total > 0) {
          const progressPercent = Math.round((completed / total) * 100);
          let parentStatus = 'In Progress';
          if (progressPercent === 100) {
            parentStatus = 'Completed';
          } else if (progressPercent === 0) {
            parentStatus = 'Pending';
          }
          updateData.progressPercent = progressPercent;
          updateData.status = parentStatus;
        }

        if (hasBlocked) {
          updateData.blocker = 'Blocked by one or more subtasks';
        } else {
          // Only clear blocker if it was set by the subtask sync
          const parent = await ProjectTask.findById(parentTaskId);
          if (parent && parent.blocker === 'Blocked by one or more subtasks') {
            updateData.blocker = '';
          }
        }

        const updatedParent = await ProjectTask.findByIdAndUpdate(parentTaskId, updateData, { new: true });
        
        // Dynamic update to the project progress
        if (updatedParent && updatedParent.project) {
          // Dynamically sync project progress
          try {
            const totalTasks = await ProjectTask.countDocuments({ project: updatedParent.project });
            if (totalTasks > 0) {
              const completedTasks = await ProjectTask.countDocuments({ project: updatedParent.project, status: 'Completed' });
              const projectProgress = Math.round((completedTasks / totalTasks) * 100);
              const Project = mongoose.model('Project');
              await Project.findByIdAndUpdate(updatedParent.project, { progressPercent: projectProgress });
            }
          } catch (projErr) {
            logger.error('Error syncing project progress from subtask sync:', projErr);
          }
        }
      } else if (parentType === 'GENERAL_TASK') {
        const Task = mongoose.model('Task');
        
        const updateData = {};
        
        if (total > 0) {
          const progressPercent = Math.round((completed / total) * 100);
          let parentStatus = 'IN_PROGRESS';
          if (progressPercent === 100) {
            parentStatus = 'COMPLETED';
          } else if (progressPercent === 0) {
            parentStatus = 'ASSIGNED';
          }
          updateData.progressPercent = progressPercent;
          updateData.status = parentStatus;
        }

        // If subtasks are blocked, generic task could append warning to outcome/notes
        if (hasBlocked) {
          updateData.notes = `Blocked by one or more subtasks! ${updateData.notes || ''}`.trim();
        }

        if (Object.keys(updateData).length > 0) {
          await Task.findByIdAndUpdate(parentTaskId, updateData);
        }
      }
    } catch (err) {
      logger.error('Error in SubtaskSyncService.syncParentTask:', err);
    }
  }
}

module.exports = SubtaskSyncService;
