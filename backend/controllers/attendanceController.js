const Attendance = require("../models/Attendance");
const User = require("../models/User");
const moment = require("moment-timezone");
const { sendHalfDayLOPNotification } = require("../utils/emailService");

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const checkIn = async (req, res) => {
  try {
    const { location } = req.body;
    const userId = req.user.id;

    const today = moment.tz("Asia/Kolkata").startOf("day").toDate();

    console.log("today:", today);
    console.log("today IST:", moment(today).tz("Asia/Kolkata").format());

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        message: "Location permission is required to check in",
      });
    }

    const OFFICE_LAT = Number(process.env.OFFICE_LAT);
    const OFFICE_LNG = Number(process.env.OFFICE_LNG);
    const ALLOWED_RADIUS = Number(process.env.ALLOWED_RADIUS_METERS);

    const distance = getDistanceInMeters(
      OFFICE_LAT,
      OFFICE_LNG,
      location.latitude,
      location.longitude,
    );

    if (distance > ALLOWED_RADIUS) {
      return res.status(403).json({
        message: "You are not within office premises",
        distance: Math.round(distance),
      });
    }

    let attendance = await Attendance.findOne({ userId, date: today });

    if (attendance?.checkIn) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    if (!attendance) {
      attendance = new Attendance({ userId, date: today });
    }

    attendance.checkIn = new Date();
    attendance.status = "Present";
    attendance.location = {
      checkInLocation: location,
    };

    await attendance.save();

    res.json({
      message: "Checked in successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markHolidayAttendance = async (req, res) => {
  try {
    const Holiday = require("../models/Holiday");
    const User = require("../models/User");

    const { date } = req.body;
    const targetDate = moment(date).startOf("day").toDate();

    // Check if it's a holiday
    const holiday = await Holiday.findOne({
      date: targetDate,
      type: { $in: ["FESTIVAL", "NATIONAL", "COMPANY"] },
    });

    if (!holiday) {
      return res
        .status(400)
        .json({ message: "No holiday found for this date" });
    }

    // Get all active users
    const users = await User.find({ isActive: true });
    let markedCount = 0;

    for (const user of users) {
      const existingAttendance = await Attendance.findOne({
        userId: user._id,
        date: targetDate,
      });

      if (!existingAttendance) {
        await Attendance.create({
          userId: user._id,
          date: targetDate,
          status: "Present",
          totalHours: 8,
          isManualEntry: true,
          notes: `Holiday: ${holiday.name}`,
          approvedBy: req.user.id,
        });
        markedCount++;
      }
    }

    res.json({
      message: `Holiday attendance marked for ${markedCount} employees`,
      holiday: holiday.name,
      date: targetDate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkOut = async (req, res) => {
  try {
    const { location } = req.body;
    const userId = req.user.id;
    const today = moment.tz("Asia/Kolkata").startOf("day").toDate();

    // 🔒 Location is mandatory
    if (!location?.latitude || !location?.longitude) {
      return res.status(400).json({
        message: "Location is required for check-out",
      });
    }

    // 🔐 GPS accuracy validation
    const maxAccuracy = Number(process.env.MAX_GPS_ACCURACY || 50);

    if (location.accuracy && location.accuracy > maxAccuracy) {
      return res.status(403).json({
        message: "GPS accuracy too low. Move to open area.",
      });
    }

    // 📍 Office coordinates
    const officeLat = Number(process.env.OFFICE_LAT);
    const officeLng = Number(process.env.OFFICE_LNG);
    const allowedRadius = Number(process.env.OFFICE_RADIUS_METERS || 100);

    const distance = getDistanceInMeters(
      officeLat,
      officeLng,
      location.latitude,
      location.longitude,
    );

    if (distance > allowedRadius) {
      return res.status(403).json({
        message: "Check-out allowed only within office premises",
        distance: Math.round(distance),
      });
    }

    // 🗂️ Fetch today's attendance
    const attendance = await Attendance.findOne({ userId, date: today });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        message: "You have not checked in today",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: "Already checked out today",
      });
    }

    // ⏱️ Save check-out
    attendance.checkOut = new Date();
    attendance.location.checkOutLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    };

    await attendance.save(); // pre-save hook calculates hours & status

    return res.json({
      message: "Checked out successfully",
      attendance,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({
      message: "Server error during check-out",
    });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (req.user.role === "EMPLOYEE") {
      filter.userId = req.user.id;
    } else if (userId) {
      filter.userId = userId;
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(filter)
      .populate("userId", "firstName lastName email")
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(filter);

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTodayStatus = async (req, res) => {
  try {
    const today = moment().startOf("day").toDate();
    let userId = req.user.id;

    // Allow managers/HR/Admin to query another user's today status via ?userId=
    if (
      req.query.userId &&
      ["MANAGER", "HR", "ADMIN"].includes(req.user.role)
    ) {
      userId = req.query.userId;
    }

    const attendance = await Attendance.findOne({
      userId,
      date: today,
    }).populate("userId", "firstName lastName email");

    res.json({
      user: attendance?.userId || null,
      hasCheckedIn: !!attendance?.checkIn,
      hasCheckedOut: !!attendance?.checkOut,
      checkInTime: attendance?.checkIn,
      checkOutTime: attendance?.checkOut,
      totalHours: attendance?.totalHours || 0,
      status: attendance?.status || "Absent",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const currentMonth = month || moment().month() + 1;
    const currentYear = year || moment().year();

    const startDate = moment(`${currentYear}-${currentMonth}-01`)
      .startOf("month")
      .toDate();
    const endDate = moment(`${currentYear}-${currentMonth}-01`)
      .endOf("month")
      .toDate();

    const filter = { date: { $gte: startDate, $lte: endDate } };
    if (userId) filter.userId = userId;

    const attendance = await Attendance.find(filter)
      .populate("userId", "firstName lastName email")
      .sort({ date: 1 });

    // Calculate summary
    const summary = attendance.reduce((acc, record) => {
      const status = record.status;
      acc[status] = (acc[status] || 0) + 1;
      acc.totalHours = (acc.totalHours || 0) + record.totalHours;
      return acc;
    }, {});

    res.json({ attendance, summary });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPayrollReport = async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const currentMonth = month || moment().month() + 1;
    const currentYear = year || moment().year();

    const startDate = moment(`${currentYear}-${currentMonth}-01`)
      .startOf("month")
      .toDate();
    const endDate = moment(`${currentYear}-${currentMonth}-01`)
      .endOf("month")
      .toDate();

    const filter = { date: { $gte: startDate, $lte: endDate } };
    if (userId) filter.userId = userId;

    const attendance = await Attendance.find(filter)
      .populate("userId", "firstName lastName email")
      .sort({ date: 1 });

    const payrollData = attendance.map((record) => {
      let payrollHours = record.totalHours;
      let dayType = "Full Day";

      if (record.totalHours < 4) {
        payrollHours = 0; // LOP - no pay
        dayType = "LOP (No Pay)";
      } else if (record.totalHours < 8) {
        payrollHours = 4; // Half day
        dayType = "Half Day";
      } else {
        payrollHours = 8; // Full day (cap at 8 hours)
        dayType = "Full Day";
      }

      return {
        userId: record.userId._id,
        userName: `${record.userId.firstName} ${record.userId.lastName}`,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        actualHours: record.totalHours,
        payrollHours,
        dayType,
        status: record.status,
      };
    });

    res.json({ payrollData });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getTodayStatus,
  getAttendanceReport,
  getPayrollReport,
  markHolidayAttendance,
};
