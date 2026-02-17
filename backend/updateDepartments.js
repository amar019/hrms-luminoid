require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const updateDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Sample departments
    const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations'];
    
    // Get all users without departments
    const users = await User.find({ 
      $or: [
        { department: { $exists: false } },
        { department: null },
        { department: '' }
      ]
    });

    // console.log(`Found ${users.length} users without departments`);

    // Update users with random departments
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const randomDept = departments[Math.floor(Math.random() * departments.length)];
      
      // Assign specific departments based on role
      let department = randomDept;
      if (user.role === 'HR') department = 'HR';
      if (user.role === 'ADMIN') department = 'IT';
      
      await User.findByIdAndUpdate(user._id, { department });
      // console.log(`Updated ${user.firstName} ${user.lastName} (${user.email}) -> ${department}`);
    }

    // console.log('✅ All users updated with departments');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateDepartments();