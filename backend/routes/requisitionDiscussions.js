const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getDiscussion,
  addMessage
} = require('../controllers/requisitionDiscussionController');

router.get('/:requisitionId', auth, getDiscussion);
router.post('/:requisitionId/messages', auth, addMessage);

module.exports = router;
