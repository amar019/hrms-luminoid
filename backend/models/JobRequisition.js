const mongoose = require('mongoose');

const jobRequisitionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true }, // e.g. REQ-DEV-01
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  hiringManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hiringManagerName: { type: String }, // For manual entry or custom manager name
  leadRecruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recruiters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  targetHires: { type: Number, default: 1, min: 1 },
  fulfilledHires: { type: Number, default: 0, min: 0 },
  salaryRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  experienceYears: { type: String, default: '1-3 years' },
  location: { type: String, default: 'On-site' },
  employmentType: { 
    type: String, 
    enum: ['Full-Time', 'Part-Time', 'Contract', 'Internship'], 
    default: 'Full-Time' 
  },
  startDate: { type: Date, default: Date.now },
  targetCloseDate: { type: Date },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: ['Planning', 'Approved', 'Active', 'On Hold', 'Filled', 'Cancelled'], 
    default: 'Active' 
  },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('JobRequisition', jobRequisitionSchema);
