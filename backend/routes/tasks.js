const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

router.use(auth);

router.post('/', authorize('ADMIN', 'HR', 'MANAGER'), taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', authorize('ADMIN', 'HR', 'MANAGER'), taskController.deleteTask);

router.post('/:id/check-in', taskController.checkIn);
router.post('/:id/check-out', taskController.checkOut);
router.put('/:id/status', taskController.updateStatus);
router.post('/:id/comments', taskController.addComment);
router.post('/:id/attachments', taskController.addAttachment);
router.post('/:id/expenses', taskController.addExpense);
router.post('/:id/daily-update', taskController.addDailyUpdate);
router.post('/:id/duplicate', authorize('ADMIN', 'HR', 'MANAGER'), taskController.duplicateTask);

module.exports = router;
