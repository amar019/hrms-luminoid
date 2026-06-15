const { createNotification } = require('../controllers/notificationController');
const User = require('../models/User');

class NotificationService {
  static async notifySubtaskAssigned(subtask, creatorId) {
    if (subtask.owner && subtask.owner.toString() !== creatorId.toString()) {
      await createNotification(
        subtask.owner,
        'SUBTASK_ASSIGNED',
        subtask._id,
        `New subtask assigned to you: "${subtask.title}"`,
        creatorId,
        { subtaskId: subtask._id, parentTask: subtask.parentTask, parentType: subtask.parentType, taskModel: 'Subtask' }
      );
    }
  }

  static async notifySubtaskCompleted(subtask, updaterId) {
    // Notify the assigner or task creator
    const targetUserId = subtask.assignedBy;
    if (targetUserId && targetUserId.toString() !== updaterId.toString()) {
      await createNotification(
        targetUserId,
        'SUBTASK_COMPLETED',
        subtask._id,
        `Subtask completed: "${subtask.title}"`,
        updaterId,
        { subtaskId: subtask._id, parentTask: subtask.parentTask, parentType: subtask.parentType, taskModel: 'Subtask' }
      );
    }
  }

  static async notifySubtaskBlocked(subtask, updaterId) {
    // Notify the assigner or task creator
    const targetUserId = subtask.assignedBy;
    if (targetUserId && targetUserId.toString() !== updaterId.toString()) {
      await createNotification(
        targetUserId,
        'SUBTASK_BLOCKED',
        subtask._id,
        `⚠️ Subtask blocked: "${subtask.title}"`,
        updaterId,
        { subtaskId: subtask._id, parentTask: subtask.parentTask, parentType: subtask.parentType, taskModel: 'Subtask' }
      );
    }
  }

  static async notifySubtaskDueDateChanged(subtask, updaterId) {
    // Notify the assignee
    const targetUserId = subtask.owner;
    if (targetUserId && targetUserId.toString() !== updaterId.toString()) {
      await createNotification(
        targetUserId,
        'SUBTASK_DUE_DATE_CHANGED',
        subtask._id,
        `Due date updated for subtask: "${subtask.title}"`,
        updaterId,
        { subtaskId: subtask._id, parentTask: subtask.parentTask, parentType: subtask.parentType, taskModel: 'Subtask' }
      );
    }
  }

  static async notifySubtaskCommentAdded(subtask, comment, authorId) {
    // Notify mentioned users
    if (comment.mentions && comment.mentions.length > 0) {
      for (const mentionedId of comment.mentions) {
        if (mentionedId.toString() !== authorId.toString()) {
          await createNotification(
            mentionedId,
            'MENTION',
            subtask._id,
            `You were mentioned in a comment on subtask: "${subtask.title}"`,
            authorId,
            { subtaskId: subtask._id, parentTask: subtask.parentTask, parentType: subtask.parentType, taskModel: 'Subtask' }
          );
        }
      }
    }

    // Notify assignee (if not commenter)
    if (subtask.owner && subtask.owner.toString() !== authorId.toString() && !(comment.mentions && comment.mentions.some(m => m.toString() === subtask.owner.toString()))) {
      await createNotification(
        subtask.owner,
        'SUBTASK_COMMENT_ADDED',
        subtask._id,
        `New comment on subtask: "${subtask.title}"`,
        authorId,
        { subtaskId: subtask._id, parentTask: subtask.parentTask, parentType: subtask.parentType, taskModel: 'Subtask' }
      );
    }

    // Notify creator (if not commenter and not assignee)
    if (subtask.assignedBy && subtask.assignedBy.toString() !== authorId.toString() && subtask.assignedBy.toString() !== subtask.owner?.toString()) {
      await createNotification(
        subtask.assignedBy,
        'SUBTASK_COMMENT_ADDED',
        subtask._id,
        `New comment on subtask: "${subtask.title}"`,
        authorId,
        { subtaskId: subtask._id, parentTask: subtask.parentTask, parentType: subtask.parentType, taskModel: 'Subtask' }
      );
    }
  }

  static async notifySubtaskUpdated(subtask, updaterId, changes) {
    // Send dynamic notification when status, priority, or other main fields change
    const targetUserId = subtask.assignedBy;
    if (targetUserId && targetUserId.toString() !== updaterId.toString()) {
      const changedFields = Object.keys(changes).join(', ');
      await createNotification(
        targetUserId,
        'SUBTASK_UPDATED',
        subtask._id,
        `Subtask "${subtask.title}" updated (${changedFields})`,
        updaterId,
        { subtaskId: subtask._id, parentTask: subtask.parentTask, parentType: subtask.parentType, taskModel: 'Subtask' }
      );
    }
  }
}

module.exports = NotificationService;
