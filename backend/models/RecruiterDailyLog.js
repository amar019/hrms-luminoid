const mongoose = require('mongoose');

const recruiterDailyLogSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  requisition: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequisition' },
  profilesSourcedCount: { type: Number, default: 0 },
  callsConductedCount: { type: Number, default: 0 },
  interviewsScheduledCount: { type: Number, default: 0 },
  offersExtendedCount: { type: Number, default: 0 },
  notesWorkedOn: { type: String, required: true },
  blockers: { type: String },
  highlights: { type: String }
}, { timestamps: true });

recruiterDailyLogSchema.index({ recruiter: 1, date: -1 });

module.exports = mongoose.model('RecruiterDailyLog', recruiterDailyLogSchema);
