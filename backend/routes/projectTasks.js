const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const projectTaskController = require('../controllers/projectTaskController');

router.use(auth);

router.post('/', projectTaskController.createTask);
router.get('/', projectTaskController.getTasks);
router.get('/my', projectTaskController.getMyTasks);
router.get('/export/excel', projectTaskController.exportTasksToExcel);
router.get('/:id', projectTaskController.getTaskById);
router.put('/:id', projectTaskController.updateTask);
router.delete('/:id', projectTaskController.deleteTask);
router.post('/:id/comments', projectTaskController.addComment);
router.post('/:id/remarks', projectTaskController.addRemark);
router.post('/:id/subtasks', projectTaskController.addSubtask);
router.put('/:id/subtasks/:subtaskId', projectTaskController.updateSubtask);
router.delete('/:id/subtasks/:subtaskId', projectTaskController.deleteSubtask);

module.exports = router;
