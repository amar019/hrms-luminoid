const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const activitySchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'DUE_DATE_CHANGE', 'COMMENT_ADD', 'ATTACHMENT_UPLOAD'
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const subtaskSchema = new mongoose.Schema({
  taskId: { type: String, unique: true }, // Generated sequentially (e.g. LMS-1-SUB-1)
  title: { type: String, required: true },
  description: { type: String },
  parentTask: { type: mongoose.Schema.Types.ObjectId, refPath: 'parentModel', required: true },
  parentType: { 
    type: String, 
    enum: ['PROJECT_TASK', 'GENERAL_TASK'], 
    required: true 
  },
  parentModel: {
    type: String,
    enum: ['ProjectTask', 'Task'],
    required: true
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Assignee
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Review', 'Completed', 'Blocked'],
    default: 'Pending'
  },
  dueDate: { type: Date, required: true },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  tags: [String],
  watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subtask' }],
  attachments: [{
    name: String,
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  isDeleted: { type: Boolean, default: false },
  comments: [commentSchema],
  activityLog: [activitySchema]
}, { timestamps: true });

// Pre-validate hook to automatically resolve ref path for parentTask
subtaskSchema.pre('validate', function(next) {
  if (this.parentType === 'PROJECT_TASK') {
    this.parentModel = 'ProjectTask';
  } else if (this.parentType === 'GENERAL_TASK') {
    this.parentModel = 'Task';
  }
  next();
});

// Pre-save hook to auto-generate sequential taskId (e.g., LMS-1-SUB-1 or GEN-ABCD-SUB-1)
subtaskSchema.pre('save', async function(next) {
  if (this.isNew && !this.taskId) {
    try {
      let baseId = 'TASK';
      if (this.parentType === 'PROJECT_TASK') {
        const ProjectTask = mongoose.model('ProjectTask');
        const parent = await ProjectTask.findById(this.parentTask);
        baseId = parent?.taskId || 'TASK';
      } else {
        const Task = mongoose.model('Task');
        const parent = await Task.findById(this.parentTask);
        baseId = `GEN-${parent ? parent._id.toString().slice(-4).toUpperCase() : 'TASK'}`;
      }

      const Subtask = mongoose.model('Subtask');
      const prefix = `${baseId}-SUB-`;
      const subtasks = await Subtask.find({ taskId: new RegExp(`^${prefix}`) }, 'taskId');
      
      let maxSeq = 0;
      subtasks.forEach(s => {
        if (s.taskId) {
          const parts = s.taskId.split('-SUB-');
          if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        }
      });
      
      this.taskId = `${prefix}${maxSeq + 1}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Subtask', subtaskSchema);
