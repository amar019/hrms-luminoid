const mongoose = require('mongoose');

const documentAcknowledgmentSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acknowledgedAt: { type: Date, default: Date.now },
  comments: String
}, { timestamps: true });

// Compound index to ensure one acknowledgment per user per file
documentAcknowledgmentSchema.index({ fileId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('DocumentAcknowledgment', documentAcknowledgmentSchema);