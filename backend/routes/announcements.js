const express = require('express');
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getAnnouncements);
router.post('/', auth, authorize('ADMIN', 'HR'), createAnnouncement);
router.put('/:id', auth, authorize('ADMIN', 'HR'), updateAnnouncement);
router.delete('/:id', auth, authorize('ADMIN', 'HR'), deleteAnnouncement);

module.exports = router;