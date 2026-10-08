const mongoose = require('mongoose');

const interviewFeedbackSchema = new mongoose.Schema({
  interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roundName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  strengths: { type: String },
  concerns: { type: String },
  decision: { 
    type: String, 
    enum: ['Strong Pass', 'Pass', 'Neutral', 'Reject'],
    default: 'Pass'
  },
  createdAt: { type: Date, default: Date.now }
});

const candidateCommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const candidatePipelineSchema = new mongoose.Schema({
  candidateId: { type: String, unique: true }, // e.g. REQ-DEV-1 or CAND-101
  requisition: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequisition' },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  resumeUrl: { type: String },
  portfolioUrl: { type: String },
  currentCompany: { type: String },
  currentNoticePeriod: { type: String, default: '30 Days' },
  expectedSalary: { type: Number, default: 0 },
  
  assignedRecruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedInterviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  stage: {
    type: String,
    enum: [
      'Sourced',
      'Screening',
      'Technical Interview',
      'Managerial Round',
      'HR Round',
      'Offer Issued',
      'Hired',
      'Rejected',
      'Withdrawn'
    ],
    default: 'Sourced'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  blocker: { type: String },
  notes: { type: String },
  feedback: [interviewFeedbackSchema],
  comments: [candidateCommentSchema],
  subtaskStats: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  }
}, { timestamps: true });

candidatePipelineSchema.index({ requisition: 1, stage: 1 });
candidatePipelineSchema.index({ assignedRecruiter: 1, stage: 1 });

candidatePipelineSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      if (!this.requisition) {
        const candidates = await mongoose.model('CandidatePipeline').find({
          $or: [
            { requisition: { $exists: false } },
            { requisition: null }
          ]
        }, 'candidateId');

        let maxSeq = 0;
        candidates.forEach(c => {
          if (c.candidateId) {
            const parts = c.candidateId.split('-');
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        });

        this.candidateId = `CAND-${maxSeq + 1}`;
        return next();
      }

      const JobRequisition = mongoose.model('JobRequisition');
      const reqDoc = await JobRequisition.findById(this.requisition);
      if (!reqDoc) {
        return next(new Error('Job Requisition not found'));
      }
      
      const code = reqDoc.code || 'REQ';
      const candidates = await mongoose.model('CandidatePipeline').find({ requisition: this.requisition }, 'candidateId');
      
      let maxSeq = 0;
      candidates.forEach(c => {
        if (c.candidateId) {
          const parts = c.candidateId.split('-');
          const num = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      });
      
      this.candidateId = `${code}-CAND-${maxSeq + 1}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('CandidatePipeline', candidatePipelineSchema);
