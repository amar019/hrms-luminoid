const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true }, // e.g. LMS
  description: { type: String },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: { type: Date },
  endDate: { type: Date },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'], 
    default: 'Planning' 
  },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
