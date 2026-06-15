const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getAvailableRooms,
  getProjectDiscussions,
  sendMessage,
  editMessage,
  deleteMessage
} = require('../controllers/projectDiscussionController');

// All endpoints are protected by auth middleware
router.get('/rooms', auth, getAvailableRooms);
router.get('/:projectId/messages', auth, getProjectDiscussions);
router.post('/:projectId/messages', auth, sendMessage);
router.put('/messages/:messageId', auth, editMessage);
router.delete('/messages/:messageId', auth, deleteMessage);

module.exports = router;
