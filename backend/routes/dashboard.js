const express = require('express');
const {
  getEmployeeDashboard,
  getManagerDashboard,
  getHRDashboard,
  exportLeaveReport
} = require('../controllers/dashboardController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/employee', auth, getEmployeeDashboard);
router.get('/manager', auth, authorize('MANAGER', 'HR', 'ADMIN'), getManagerDashboard);
router.get('/hr', auth, authorize('HR', 'ADMIN'), getHRDashboard);
router.get('/export', auth, authorize('HR', 'ADMIN'), exportLeaveReport);

module.exports = router;