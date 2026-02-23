const attendanceConfig = require("../config/attendanceConfig");

/**
 * Calculate attendance status based on check-in/out times and hours worked
 * @param {Date} checkIn - Check-in timestamp
 * @param {Date} checkOut - Check-out timestamp (optional)
 * @param {Number} breakTime - Break time in minutes
 * @returns {Object} { status, totalHours, isLate, lateByMinutes }
 */
function calculateAttendanceStatus(checkIn, checkOut = null, breakTime = 0) {
  const {
    FULL_DAY_HOURS,
    HALF_DAY_HOURS,
    LOP_THRESHOLD,
    LATE_GRACE_MINUTES,
    OFFICE_START_TIME
  } = attendanceConfig;

  const OFFICE_START_HOUR = OFFICE_START_TIME * 60; // in minutes
  
  let totalHours = 0;
  let status = "Absent";
  let isLate = false;
  let lateByMinutes = 0;

  // Check if employee arrived late
  if (checkIn) {
    const checkInTime = new Date(checkIn);
    const checkInMinutes = checkInTime.getHours() * 60 + checkInTime.getMinutes();
    lateByMinutes = checkInMinutes - OFFICE_START_HOUR;
    isLate = lateByMinutes > LATE_GRACE_MINUTES;
  }

  // Calculate hours if both check-in and check-out exist
  if (checkIn && checkOut) {
    const diffMs = checkOut - checkIn;
    let totalMinutes = diffMs / (1000 * 60);
    
    // Subtract break time
    if (breakTime > 0) {
      totalMinutes -= breakTime;
    }
    
    totalHours = Math.round((totalMinutes / 60) * 100) / 100;

    // Determine status based on hours worked
    if (totalHours < LOP_THRESHOLD) {
      status = "LOP";
    } else if (totalHours < HALF_DAY_HOURS) {
      status = "Half Day";
    } else if (totalHours >= FULL_DAY_HOURS) {
      status = isLate ? "Late" : "Present";
    } else {
      // Between 4-8 hours
      status = isLate ? "Late" : "Half Day";
    }
  } else if (checkIn && !checkOut) {
    // Only checked in
    status = isLate ? "Late" : "Present";
  }

  return {
    status,
    totalHours,
    isLate,
    lateByMinutes: Math.max(0, lateByMinutes)
  };
}

/**
 * Calculate payroll hours based on attendance status
 * @param {Number} totalHours - Total hours worked
 * @param {String} status - Attendance status
 * @returns {Object} { payrollHours, dayType }
 */
function calculatePayrollHours(totalHours, status) {
  let payrollHours = 0;
  let dayType = "LOP (No Pay)";

  if (status === "LOP" || totalHours < attendanceConfig.LOP_THRESHOLD) {
    payrollHours = 0;
    dayType = "LOP (No Pay)";
  } else if (totalHours < attendanceConfig.HALF_DAY_HOURS) {
    payrollHours = 0;
    dayType = "LOP (No Pay)";
  } else if (totalHours < attendanceConfig.FULL_DAY_HOURS) {
    payrollHours = 4;
    dayType = "Half Day";
  } else {
    payrollHours = 8; // Cap at 8 hours for standard pay
    dayType = "Full Day";
  }

  return { payrollHours, dayType };
}

/**
 * Calculate overtime hours
 * @param {Number} totalHours - Total hours worked
 * @returns {Number} Overtime hours
 */
function calculateOvertime(totalHours) {
  const { OVERTIME_THRESHOLD } = attendanceConfig;
  return totalHours > OVERTIME_THRESHOLD 
    ? Math.round((totalHours - OVERTIME_THRESHOLD) * 100) / 100 
    : 0;
}

module.exports = {
  calculateAttendanceStatus,
  calculatePayrollHours,
  calculateOvertime
};
