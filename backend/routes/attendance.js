const express = require('express');
const {
  checkIn,
  checkOut,
  getAttendance,
  getTodayStatus,
  getAttendanceReport,
  getPayrollReport,
  markHolidayAttendance
} = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/checkin', auth, checkIn);
router.post('/checkout', auth, checkOut);
router.get('/', auth, getAttendance);
router.get('/today', auth, getTodayStatus);
router.get('/report', auth, authorize('HR', 'ADMIN', 'MANAGER'), getAttendanceReport);
router.get('/payroll', auth, authorize('HR', 'ADMIN'), getPayrollReport);
router.post('/mark-holiday', auth, authorize('HR', 'ADMIN'), markHolidayAttendance);

module.exports = router;