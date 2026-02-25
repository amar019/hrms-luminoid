const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: String,
  departmentHead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  location: String,
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  employeeCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
