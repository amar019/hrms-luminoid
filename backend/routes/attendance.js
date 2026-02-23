const express = require("express");
const {
  checkIn,
  checkOut,
  getAttendance,
  getTodayStatus,
  getAttendanceReport,
  getPayrollReport,
  markHolidayAttendance,
  editAttendance,
  deleteAttendance,
  runAutoCheckout,
} = require("../controllers/attendanceController");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/checkin", auth, checkIn);
router.post("/checkout", auth, checkOut);

// Specific routes MUST come before parameterized routes
router.get("/today", auth, getTodayStatus);
router.get(
  "/report",
  auth,
  authorize("HR", "ADMIN", "MANAGER"),
  getAttendanceReport,
);
router.get("/payroll", auth, authorize("HR", "ADMIN"), getPayrollReport);
router.post(
  "/mark-holiday",
  auth,
  authorize("HR", "ADMIN"),
  markHolidayAttendance,
);
router.post(
  "/auto-checkout",
  auth,
  authorize("HR", "ADMIN"),
  runAutoCheckout,
);

// Edit & delete routes (parameterized - must come after specific routes)
router.put('/:id', (req, res, next) => {
  console.log('PUT /:id route hit - ID:', req.params.id);
  next();
}, auth, authorize('HR', 'ADMIN'), editAttendance);

router.delete('/:id', auth, authorize('HR', 'ADMIN'), deleteAttendance);

// General get route (must be last)
router.get("/", auth, getAttendance);

module.exports = router;
