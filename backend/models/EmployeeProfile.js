const mongoose = require('mongoose');

const employeeProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personalInfo: {
    phone: String,
    alternatePhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String
    },
    bloodGroup: String,
    maritalStatus: { type: String, enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] }
  },
  professionalInfo: {
    employeeId: String,
    designation: String,
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    workLocation: String,
    employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] },
    salary: {
      basic: Number,
      allowances: Number,
      deductions: Number,
      currency: { type: String, default: 'USD' }
    },
    skills: [String],
    certifications: [{
      name: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date,
      credentialId: String
    }]
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountType: { type: String, enum: ['SAVINGS', 'CURRENT'] }
  },
  documents: [{
    type: { type: String, enum: ['RESUME', 'ID_PROOF', 'ADDRESS_PROOF', 'EDUCATION', 'EXPERIENCE'] },
    fileName: String,
    filePath: String,
    uploadDate: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema);