const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: [
      'TASK_ASSIGNED', 'TASK_UPDATED', 'COMMENT_ADDED', 'MENTION', 'STATUS_CHANGED', 'PROGRESS_UPDATED',
      'SUBTASK_ASSIGNED', 'SUBTASK_UPDATED', 'SUBTASK_COMPLETED', 'SUBTASK_BLOCKED', 'SUBTASK_COMMENT_ADDED', 'SUBTASK_DUE_DATE_CHANGED'
    ],
    required: true 
  },
  task: { type: mongoose.Schema.Types.ObjectId, refPath: 'taskModel', required: true },
  taskModel: { type: String, enum: ['Task', 'ProjectTask', 'Subtask'], default: 'Task' },
  message: { type: String, required: true },
  read: { type: Boolean, default: false, index: true },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

