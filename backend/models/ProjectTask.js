const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const remarkSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const projectTaskSchema = new mongoose.Schema({
  taskId: { type: String, unique: true }, // e.g. LMS-1
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  module: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    required: true
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Review', 'Completed', 'Blocked'],
    default: 'Pending'
  },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  eta: { type: Date, required: true },
  blocker: { type: String },
  dependency: { type: String },
  impact: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  notes: { type: String },
  comments: [commentSchema],
  remarks: [remarkSchema],
  subtaskStats: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    blocked: { type: Number, default: 0 },
    overdue: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Performance Indexes
projectTaskSchema.index({ project: 1, status: 1 });
projectTaskSchema.index({ owner: 1, status: 1 });
projectTaskSchema.index({ assignedBy: 1 });
projectTaskSchema.index({ eta: 1 });

// Pre-save hook to auto-generate the sequential taskId (e.g. LMS-1, LMS-2, GEN-1)
projectTaskSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      if (!this.project) {
        // Query tasks where project is null or undefined
        const tasks = await mongoose.model('ProjectTask').find({
          $or: [
            { project: { $exists: false } },
            { project: null }
          ]
        }, 'taskId');

        let maxSeq = 0;
        tasks.forEach(t => {
          if (t.taskId) {
            const parts = t.taskId.split('-');
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        });

        this.taskId = `GEN-${maxSeq + 1}`;
        return next();
      }

      const Project = mongoose.model('Project');
      const projectDoc = await Project.findById(this.project);
      if (!projectDoc) {
        return next(new Error('Project not found'));
      }
      
      const code = projectDoc.code || 'TASK';
      const tasks = await mongoose.model('ProjectTask').find({ project: this.project }, 'taskId');
      
      let maxSeq = 0;
      tasks.forEach(t => {
        if (t.taskId) {
          const parts = t.taskId.split('-');
          const num = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      });
      
      this.taskId = `${code}-${maxSeq + 1}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('ProjectTask', projectTaskSchema);
