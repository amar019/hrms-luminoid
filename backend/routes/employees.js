const express = require('express');
const {
  createProfile,
  getProfile,
  updateProfile,
  getEmployeeDirectory,
  getOrgChart,
  getAllEmployees
} = require('../controllers/employeeController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getAllEmployees);
router.post('/profile', auth, createProfile);
router.get('/profile/:userId', auth, getProfile);
router.put('/profile/:userId', auth, authorize('HR', 'ADMIN', 'MANAGER', 'EMPLOYEE'), updateProfile);
router.put('/profile', auth, updateProfile);
router.get('/directory', auth, getEmployeeDirectory);
router.get('/org-chart', auth, authorize('HR', 'ADMIN', 'MANAGER'), getOrgChart);

module.exports = router;