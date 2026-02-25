const express = require('express');
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  assignEmployee,
  bulkAssignEmployees
} = require('../controllers/departmentController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, authorize('ADMIN'), createDepartment);
router.get('/', auth, getAllDepartments);
router.get('/:id', auth, getDepartmentById);
router.put('/:id', auth, authorize('ADMIN'), updateDepartment);
router.delete('/:id', auth, authorize('ADMIN'), deleteDepartment);
router.post('/assign', auth, authorize('ADMIN', 'HR'), assignEmployee);
router.post('/bulk-assign', auth, authorize('ADMIN', 'HR'), bulkAssignEmployees);

module.exports = router;
