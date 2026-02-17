require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if employee user exists
    const user = await User.findOne({ email: 'employee@company.com' });
    
    if (!user) {
      // console.log('❌ Employee user not found. Please run: node seed.js');
      process.exit(1);
    }

    // console.log('✅ Employee user found:', {
    //   email: user.email,
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   role: user.role,
    //   isActive: user.isActive
    // });

    // console.log('🔍 Stored password hash:', user.password.substring(0, 20) + '...');

    // Test password
    const isPasswordValid = await user.comparePassword('employee123');
    // console.log('✅ Password test (employee123):', isPasswordValid ? 'VALID' : 'INVALID');

    // Test manual bcrypt comparison
    const manualTest = await bcrypt.compare('employee123', user.password);
    // console.log('🔧 Manual bcrypt test:', manualTest ? 'VALID' : 'INVALID');

    // Test if password was double-hashed
    const testHash = await bcrypt.hash('employee123', 12);
    // console.log('🆕 New hash test:', testHash.substring(0, 20) + '...');

    // console.log('\n📝 Correct login credentials:');
    // console.log('Email: employee@company.com');
    // console.log('Password: employee123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testLogin();