const mongoose = require('mongoose');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
require('dotenv').config();

const createMissingProfiles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users who don't have an employee profile
    const users = await User.find({ isActive: true });
    // console.log(`Found ${users.length} active users`);

    let created = 0;
    for (const user of users) {
      const existingProfile = await EmployeeProfile.findOne({ userId: user._id });
      
      if (!existingProfile) {
        // console.log(`Creating profile for user: ${user.firstName} ${user.lastName} (${user.email})`);
        
        const employeeProfile = new EmployeeProfile({
          userId: user._id,
          personalInfo: {
            phone: '',
            alternatePhone: '',
            address: {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: ''
            },
            emergencyContact: {
              name: '',
              relationship: '',
              phone: '',
              email: ''
            },
            bloodGroup: '',
            maritalStatus: 'SINGLE'
          },
          professionalInfo: {
            employeeId: '',
            designation: user.designation || '',
            reportingManager: user.managerId || null,
            workLocation: '',
            employmentType: 'FULL_TIME',
            salary: {
              basic: 0,
              allowances: 0,
              deductions: 0,
              currency: 'USD'
            },
            skills: [],
            certifications: []
          },
          bankDetails: {
            accountNumber: '',
            bankName: '',
            ifscCode: '',
            accountType: 'SAVINGS'
          },
          documents: []
        });
        
        await employeeProfile.save();
        created++;
      }
    }

    // console.log(`Created ${created} employee profiles`);
    // console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
createMissingProfiles();