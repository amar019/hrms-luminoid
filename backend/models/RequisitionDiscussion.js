const mongoose = require('mongoose');

const discussionMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const requisitionDiscussionSchema = new mongoose.Schema({
  requisition: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequisition', required: true, unique: true },
  messages: [discussionMessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('RequisitionDiscussion', requisitionDiscussionSchema);
