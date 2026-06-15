const path = require('path');
module.paths.push(path.join(__dirname, 'backend', 'node_modules'));

const mongoose = require('mongoose');
const dotenv = require('dotenv');

const ProjectTask = require('./backend/models/ProjectTask');
const Project = require('./backend/models/Project');
const ProjectDailyUpdate = require('./backend/models/ProjectDailyUpdate');
const User = require('./backend/models/User');

dotenv.config({ path: './backend/.env' });

async function clear() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected!');

    // 1. Delete seeded Projects
    const projectRes = await Project.deleteMany({ code: { $in: ['LMS', 'HRMS'] } });
    console.log(`Deleted ${projectRes.deletedCount} dummy Projects (LMS, HRMS).`);

    // 2. Delete seeded Project Tasks
    const tasksRes = await ProjectTask.deleteMany({});
    console.log(`Deleted ${tasksRes.deletedCount} Project Tasks.`);

    // 3. Delete seeded Daily Updates
    const updatesRes = await ProjectDailyUpdate.deleteMany({});
    console.log(`Deleted ${updatesRes.deletedCount} dummy ProjectDailyUpdates.`);

    // 4. Delete seeded Admin User if they match the default template
    const adminUser = await User.findOne({ email: 'admin@company.com', firstName: 'Admin', lastName: 'User' });
    if (adminUser) {
      await User.deleteOne({ _id: adminUser._id });
      console.log('Deleted seeded admin user (admin@company.com).');
    }

    console.log('Database cleaned successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
}

clear();
