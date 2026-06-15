const path = require('path');
module.paths.push(path.join(__dirname, 'backend', 'node_modules'));

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('./backend/models/Project');
const ProjectTask = require('./backend/models/ProjectTask');
const ProjectDailyUpdate = require('./backend/models/ProjectDailyUpdate');
const User = require('./backend/models/User');

dotenv.config({ path: './backend/.env' });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms-luminoid');
    console.log('Connected to DB');

    // Find or create default admin user
    let admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      admin = new User({
        email: 'admin@company.com',
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true
      });
      await admin.save();
      console.log('Created Default Admin User: admin@company.com / Password123!');
    }
    const adminId = admin._id;

    // Find or create default employee user
    let employee = await User.findOne({ role: 'EMPLOYEE' });
    if (!employee) {
      employee = new User({
        email: 'employee@company.com',
        password: 'Password123!',
        firstName: 'Emma',
        lastName: 'Employee',
        role: 'EMPLOYEE',
        isActive: true
      });
      await employee.save();
      console.log('Created Default Employee User: employee@company.com / Password123!');
    }
    const employeeId = employee._id;

    // Clear existing tracker tables
    await Project.deleteMany({ code: { $in: ['LMS', 'HRMS'] } });
    await ProjectTask.deleteMany({});
    await ProjectDailyUpdate.deleteMany({});
    console.log('Cleared existing Project Tracker data.');

    // 1. Seed Projects
    const lmsProject = new Project({
      name: 'Luminoid Core Platform',
      code: 'LMS',
      description: 'Main project for developing core modules including Attendance, Leave, and Organization Hub.',
      leader: adminId,
      members: [adminId, employeeId],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      status: 'Active',
      progressPercent: 25
    });
    await lmsProject.save();
    console.log('Created Project:', lmsProject.name);

    const hrmsProject = new Project({
      name: 'HR System Integration',
      code: 'HRMS',
      description: 'Integration workspace for third-party payroll and employee database synchronizations.',
      leader: adminId,
      members: [adminId],
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      priority: 'MEDIUM',
      status: 'Planning',
      progressPercent: 0
    });
    await hrmsProject.save();
    console.log('Created Project:', hrmsProject.name);

    // 2. Seed Tasks (ProjectTasks)
    const task1 = new ProjectTask({
      project: lmsProject._id,
      module: 'Work Management',
      title: 'Task Management Overhaul',
      description: 'Migrate to a simplified business-friendly work interface.',
      type: 'Full Stack',
      owner: employeeId,
      status: 'Completed',
      progressPercent: 100,
      priority: 'Critical',
      eta: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      notes: 'Completed database design and router integrations.'
    });
    await task1.save();

    const task2 = new ProjectTask({
      project: lmsProject._id,
      module: 'Work Management',
      title: 'Design Excel-style Task Tracker',
      description: 'Create an Excel-like task table with modern SaaS design.',
      type: 'Frontend',
      owner: employeeId,
      status: 'In Progress',
      progressPercent: 60,
      priority: 'High',
      eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Task table columns match the specified Excel spreadsheet tracker.'
    });
    await task2.save();

    const task3 = new ProjectTask({
      project: lmsProject._id,
      module: 'Organization',
      title: 'Setup database migrations',
      description: 'Setup schema and migrations for simple project tasks.',
      type: 'Backend',
      owner: adminId,
      status: 'Pending',
      progressPercent: 0,
      priority: 'Medium',
      eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });
    await task3.save();

    const task4 = new ProjectTask({
      project: lmsProject._id,
      module: 'Dashboard',
      title: 'Add performance metrics widgets',
      description: 'Render charts for project status, delayed/blocked tasks and team productivity.',
      type: 'Frontend',
      owner: employeeId,
      status: 'Blocked',
      progressPercent: 20,
      priority: 'Medium',
      eta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Delayed Task
      blocker: 'Dashboard wireframes are not finalized by the design team.'
    });
    await task4.save();

    console.log('Seeded project tasks successfully.');

    // 3. Seed Daily Updates
    const update1 = new ProjectDailyUpdate({
      userId: employeeId,
      projectId: lmsProject._id,
      taskId: task1._id,
      module: 'Work Management',
      workDone: 'Finished setup of backend models, controllers and Express API routes for Projects and ProjectTasks.',
      hoursWorked: 8,
      progressPercent: 100,
      tomorrowPlan: 'Start frontend implementation of Projects Hub and Dashboard cards.'
    });
    await update1.save();

    const update2 = new ProjectDailyUpdate({
      userId: employeeId,
      projectId: lmsProject._id,
      taskId: task2._id,
      module: 'Work Management',
      workDone: 'Designed the Task table columns and styled inline badges in emerald green.',
      hoursWorked: 5,
      progressPercent: 60,
      tomorrowPlan: 'Implement filtering and export capabilities.'
    });
    await update2.save();

    console.log('Seeded daily work updates successfully.');

    // Sync project progress percents
    const totalTasks = await ProjectTask.countDocuments({ project: lmsProject._id });
    const completedTasks = await ProjectTask.countDocuments({ project: lmsProject._id, status: 'Completed' });
    lmsProject.progressPercent = Math.round((completedTasks / totalTasks) * 100);
    await lmsProject.save();

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
