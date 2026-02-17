const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'OFFICE_SUPPLIES', 'TRAINING', 'OTHER'],
    required: true 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  expenseDate: { type: Date, required: true },
  description: String,
  receipt: {
    fileName: String,
    filePath: String
  },
  status: { 
    type: String, 
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REIMBURSED'],
    default: 'DRAFT'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedDate: Date,
  rejectionReason: String,
  reimbursementDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);