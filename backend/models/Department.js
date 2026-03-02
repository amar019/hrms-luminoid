const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: String,
  departmentHead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  location: String,
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  employeeCount: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },
  goals: [{
    title: String,
    description: String,
    targetDate: Date,
    progress: { type: Number, default: 0 },
    status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'ARCHIVED'], default: 'NOT_STARTED' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    milestones: [{
      title: String,
      completed: { type: Boolean, default: false },
      completedAt: Date
    }],
    comments: [{
      text: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }],
    activityLog: [{
      action: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
      details: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  documents: [{
    name: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
