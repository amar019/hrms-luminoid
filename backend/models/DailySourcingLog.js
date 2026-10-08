const mongoose = require('mongoose');

const dailySourcingLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    employeeName: {
      type: String,
      required: true,
      trim: true
    },
    employeeId: {
      type: String,
      trim: true,
      default: ''
    },
    clientName: {
      type: String,
      required: [true, 'Client Name is required'],
      trim: true
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    submission: {
      type: Number,
      required: [true, 'Submission count is required'],
      min: [0, 'Submission cannot be negative'],
      default: 0
    },
    interview: {
      type: Number,
      required: [true, 'Interview count is required'],
      min: [0, 'Interview cannot be negative'],
      default: 0
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

dailySourcingLogSchema.index({ employee: 1, createdAt: -1 });
dailySourcingLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DailySourcingLog', dailySourcingLogSchema);
