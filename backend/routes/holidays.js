const express = require('express');
const {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  testHolidayNotification
} = require('../controllers/holidayController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getHolidays);
router.post('/', auth, authorize('ADMIN', 'HR'), createHoliday);
router.put('/:id', auth, authorize('ADMIN', 'HR'), updateHoliday);
router.delete('/:id', auth, authorize('ADMIN', 'HR'), deleteHoliday);
router.post('/test-notification/:holidayId', auth, authorize('ADMIN', 'HR'), testHolidayNotification);

module.exports = router;