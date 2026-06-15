const mongoose = require('mongoose');

const projectDiscussionSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Compound / specific indexes for the requirements
projectDiscussionSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('ProjectDiscussion', projectDiscussionSchema);
