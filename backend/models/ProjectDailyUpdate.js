const mongoose = require('mongoose');

const projectDailyUpdateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectTask' }, // Optional
  module: { type: String }, // e.g. Attendance, Login
  taskType: { type: String }, // e.g. Frontend, Backend, both, testing, ui/ux
  workDone: { type: String, required: true },
  hoursWorked: { type: Number, required: true },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  blockers: { type: String },
  dependencies: { type: String },
  tomorrowPlan: { type: String },
  remarks: { type: String }, // Leader review remarks
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Performance Indexes
projectDailyUpdateSchema.index({ userId: 1, date: -1 });
projectDailyUpdateSchema.index({ projectId: 1, date: -1 });
projectDailyUpdateSchema.index({ taskId: 1, date: -1 });

module.exports = mongoose.model('ProjectDailyUpdate', projectDailyUpdateSchema);
