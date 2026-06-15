const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  createDailyUpdate,
  updateProjectDailyUpdate,
  deleteProjectDailyUpdate,
  getProjectDailyUpdates,
  getProjectTimeline,
  getProjectAnalytics,
  getDashboardStats,
  getEmployeeDashboard,
  getProjectTasks,
  getEmployeePerformance
} = require('../controllers/projectController');

// Projects CRUD & Stats
router.get('/dashboard/stats', auth, getDashboardStats);
router.get('/dashboard/employee-performance', auth, getEmployeePerformance);
router.get('/employee/dashboard', auth, getEmployeeDashboard);

// Daily Updates
router.post('/daily-updates', auth, createDailyUpdate);
router.get('/daily-updates', auth, getProjectDailyUpdates);
router.put('/daily-updates/:id', auth, updateProjectDailyUpdate);
router.delete('/daily-updates/:id', auth, deleteProjectDailyUpdate);

router.post('/', auth, createProject);
router.get('/', auth, getProjects);
router.get('/:id', auth, getProjectById);
router.put('/:id', auth, updateProject);
router.delete('/:id', auth, deleteProject);
router.get('/:id/tasks', auth, getProjectTasks);
router.get('/:id/timeline', auth, getProjectTimeline);
router.get('/:id/analytics', auth, getProjectAnalytics);

module.exports = router;
