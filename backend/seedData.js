require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const LeaveType = require('./models/LeaveType');
const User = require('./models/User');

const seedLeaveTypes = async () => {
  try {
    const leaveTypes = [
      {
        name: 'Annual Leave',
        description: 'Yearly vacation leave',
        accrualType: 'MONTHLY',
        accrualRate: 1, // 1 day per month = 12 days per year
        maxPerYear: 12,
        carryForward: true,
        maxCarryForward: 5,
        lopEnabled: false,
        color: '#28a745'
      },
      {
        name: 'Sick Leave',
        description: 'Medical leave for illness',
        accrualType: 'MONTHLY',
        accrualRate: 0.5, // 0.5 days per month = 6 days per year
        maxPerYear: 6,
        carryForward: false,
        maxCarryForward: 0,
        lopEnabled: false,
        color: '#dc3545'
      },
      {
        name: 'Casual Leave',
        description: 'Short-term personal leave',
        accrualType: 'YEARLY',
        accrualRate: 5, // 5 days per year
        maxPerYear: 5,
        carryForward: false,
        maxCarryForward: 0,
        lopEnabled: true,
        color: '#ffc107'
      },
      {
        name: 'Maternity Leave',
        description: 'Maternity leave for new mothers',
        accrualType: 'YEARLY',
        accrualRate: 90, // 90 days per year
        maxPerYear: 90,
        carryForward: false,
        maxCarryForward: 0,
        lopEnabled: false,
        color: '#e83e8c'
      }
    ];

    for (const leaveTypeData of leaveTypes) {
      const existing = await LeaveType.findOne({ name: leaveTypeData.name });
      if (!existing) {
        await LeaveType.create(leaveTypeData);
        console.log(`Created leave type: ${leaveTypeData.name}`);
      } else {
        console.log(`Leave type already exists: ${leaveTypeData.name}`);
      }
    }
  } catch (error) {
    console.error('Error seeding leave types:', error);
  }
};

const seedUsers = async () => {
  try {
    const users = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@company.com',
        password: 'admin123',
        role: 'ADMIN',
        department: 'IT',
        joinDate: new Date('2023-01-01'),
        isActive: true
      },
      {
        firstName: 'HR',
        lastName: 'Manager',
        email: 'hr@company.com',
        password: 'hr123',
        role: 'HR',
        department: 'Human Resources',
        joinDate: new Date('2023-01-01'),
        isActive: true
      },
      {
        firstName: 'Team',
        lastName: 'Manager',
        email: 'manager@company.com',
        password: 'manager123',
        role: 'MANAGER',
        department: 'Engineering',
        joinDate: new Date('2023-01-01'),
        isActive: true
      },
      {
        firstName: 'John',
        lastName: 'Employee',
        email: 'employee@company.com',
        password: 'employee123',
        role: 'EMPLOYEE',
        department: 'Engineering',
        joinDate: new Date('2023-06-01'),
        isActive: true
      }
    ];

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          ...userData,
          password: hashedPassword
        });
        console.log(`Created user: ${userData.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await seedLeaveTypes();
    await seedUsers();
    
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = { seedLeaveTypes, seedUsers };