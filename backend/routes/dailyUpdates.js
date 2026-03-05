const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getDailyUpdates,
  createDailyUpdate,
  toggleLike,
  addComment,
  deleteUpdate,
  togglePin
} = require('../controllers/dailyUpdateController');

router.get('/', auth, getDailyUpdates);
router.post('/', auth, createDailyUpdate);
router.put('/:id', auth, require('../controllers/dailyUpdateController').updateDailyUpdate);
router.post('/:id/like', auth, toggleLike);
router.post('/:id/comment', auth, addComment);
router.delete('/:id', auth, deleteUpdate);
router.patch('/:id/pin', auth, togglePin);

module.exports = router;
