const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createDailyUpdate,
  getDailyUpdates,
  deleteDailyUpdate
} = require('../controllers/recruitmentDailyUpdateController');

router.post('/', auth, createDailyUpdate);
router.get('/', auth, getDailyUpdates);
router.delete('/:id', auth, deleteDailyUpdate);

module.exports = router;
