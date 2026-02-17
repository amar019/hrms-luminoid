const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  year: { type: Number, required: true },
  allocated: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  carryForward: { type: Number, default: 0 },
  lastAccrualDate: Date
}, { timestamps: true });

leaveBalanceSchema.index({ userId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

leaveBalanceSchema.virtual('available').get(function() {
  return this.allocated + this.carryForward - this.used - this.pending;
});

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);