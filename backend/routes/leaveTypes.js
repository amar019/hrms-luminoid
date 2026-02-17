const express = require('express');
const { body } = require('express-validator');
const {
  createLeaveType,
  getLeaveTypes,
  getLeaveType,
  updateLeaveType,
  deleteLeaveType
} = require('../controllers/leaveTypeController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const leaveTypeValidation = [
  body('name').trim().notEmpty(),
  body('accrualType').isIn(['MONTHLY', 'YEARLY']),
  body('accrualRate').isFloat({ min: 0 }),
  body('maxPerYear').isFloat({ min: 0 })
];

router.get('/', auth, getLeaveTypes);
router.get('/:id', auth, getLeaveType);
router.post('/', auth, authorize('ADMIN', 'HR'), leaveTypeValidation, createLeaveType);
router.put('/:id', auth, authorize('ADMIN', 'HR'), leaveTypeValidation, updateLeaveType);
router.delete('/:id', auth, authorize('ADMIN', 'HR'), deleteLeaveType);

module.exports = router;