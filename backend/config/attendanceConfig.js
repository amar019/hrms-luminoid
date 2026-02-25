// Attendance Configuration
module.exports = {
  // Working hours thresholds
  FULL_DAY_HOURS: 8,
  HALF_DAY_HOURS: 4,
  LOP_THRESHOLD: 4,
  
  // Time settings
  OFFICE_START_TIME: 10, // 10 AM
  OFFICE_END_TIME: 18, // 6 PM
  LATE_GRACE_MINUTES: 0, // No grace period - late after 10 AM
  
  // Break time
  DEFAULT_BREAK_MINUTES: 60, // 1 hour lunch break
  
  // Auto checkout
  AUTO_CHECKOUT_TIME: { hour: 18, minute: 30 }, // 6:30 PM
  
  // Overtime
  OVERTIME_THRESHOLD: 8, // Hours after which overtime is calculated
  
  // Status priorities (for conflict resolution)
  STATUS_PRIORITY: {
    'LOP': 1,
    'Absent': 2,
    'Half Day': 3,
    'Late': 4,
    'Present': 5,
    'On Leave': 6
  }
};
