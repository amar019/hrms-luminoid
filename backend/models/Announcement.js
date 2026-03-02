const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  targetRoles: [{ type: String, enum: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] }],
  targetDepartments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  expiryDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);