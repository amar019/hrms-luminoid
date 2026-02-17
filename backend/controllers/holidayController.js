const Holiday = require('../models/Holiday');
const User = require('../models/User');
const { sendHolidayNotification } = require('../utils/emailService');

const getHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), 0, 1);
    const endDate = new Date(year || new Date().getFullYear(), 11, 31);

    const holidays = await Holiday.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createHoliday = async (req, res) => {
  try {
    const holiday = new Holiday({
      ...req.body,
      createdBy: req.user.id
    });
    await holiday.save();
    res.status(201).json(holiday);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(holiday);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const testHolidayNotification = async (req, res) => {
  try {
    const { holidayId } = req.params;
    const holiday = await Holiday.findById(holidayId);
    
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    
    const employees = await User.find({ role: { $in: ['EMPLOYEE', 'MANAGER', 'HR'] } });
    await sendHolidayNotification(employees, holiday);
    
    res.json({ message: `Test notification sent to ${employees.length} employees` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  testHolidayNotification
};