const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const subtaskController = require('../controllers/subtaskController');

router.use(auth);

router.get('/', subtaskController.getSubtasks);
router.get('/my', (req, res, next) => {
  req.query.owner = req.user.id;
  next();
}, subtaskController.getSubtasks);

router.get('/analytics/dashboard', subtaskController.getDashboardAnalytics);
router.get('/:id', subtaskController.getSubtaskById);
router.post('/', subtaskController.createSubtask);
router.put('/:id', subtaskController.updateSubtask);
router.delete('/:id', subtaskController.deleteSubtask);
router.post('/:id/comments', subtaskController.addComment);
router.post('/:id/attachments', subtaskController.addAttachment);

module.exports = router;
