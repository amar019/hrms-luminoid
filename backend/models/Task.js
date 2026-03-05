const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  department: { type: String, required: true },
  taskType: { type: String, required: true },
  category: String,
  
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  workLocation: { 
    type: String, 
    enum: ['OFFICE', 'REMOTE', 'CLIENT_SITE', 'FIELD', 'HYBRID'],
    default: 'OFFICE'
  },
  requireCheckIn: { type: Boolean, default: false },
  
  client: {
    name: String,
    phone: String,
    company: String,
    address: String,
    location: {
      lat: Number,
      lng: Number
    }
  },
  
  scheduledDate: { type: Date, required: true },
  dueDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  
  status: { 
    type: String, 
    enum: ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'],
    default: 'ASSIGNED'
  },
  
  checkIn: {
    time: Date,
    location: {
      lat: Number,
      lng: Number
    }
  },
  
  checkOut: {
    time: Date,
    location: {
      lat: Number,
      lng: Number
    }
  },
  
  outcome: String,
  notes: String,
  nextFollowUpDate: Date,
  orderValue: Number,
  orderDetails: String,
  
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  dailyUpdates: [{
    date: { type: Date, default: Date.now },
    progressPercent: Number,
    status: { type: String, enum: ['ON_TRACK', 'BLOCKED', 'NEED_HELP', 'COMPLETED'] },
    workDone: String,
    deliverables: String,
    issues: String,
    hoursSpent: Number,
    workLocation: { type: String, enum: ['OFFICE', 'REMOTE', 'CLIENT_SITE', 'FIELD'] },
    clientInteraction: Boolean,
    clientFeedback: String,
    nextDayPlan: String,
    // Sales specific
    visitOutcome: { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'ORDER_RECEIVED', 'DEMO_SCHEDULED', 'PROPOSAL_SENT'] },
    leadStatus: { type: String, enum: ['HOT', 'WARM', 'COLD', 'CONVERTED', 'LOST'] },
    orderReceived: Boolean,
    orderValue: Number,
    nextFollowUpDate: Date,
    // Development specific
    codeCommits: Number,
    bugsFixed: Number,
    testingStatus: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PASSED', 'FAILED'] },
    // HR specific
    interviewsConducted: Number,
    candidatesShortlisted: Number,
    onboardingCompleted: Number,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  attachments: [{
    name: String,
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
  }],
  
  activityLog: [{
    type: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }],
  
  tags: [String],
  
  travelDistance: Number,
  expenses: [{
    type: { type: String, enum: ['TRAVEL', 'FOOD', 'OTHER'] },
    amount: Number,
    receipt: String,
    description: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
