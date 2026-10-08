const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createRequisition,
  getRequisitions,
  getRequisitionById,
  updateRequisition,
  deleteRequisition,
  getDashboardStats,
  getEmployeeDashboard
} = require('../controllers/jobRequisitionController');

router.get('/dashboard/stats', auth, getDashboardStats);
router.get('/employee/dashboard', auth, getEmployeeDashboard);

router.post('/', auth, createRequisition);
router.get('/', auth, getRequisitions);
router.get('/:id', auth, getRequisitionById);
router.put('/:id', auth, updateRequisition);
router.delete('/:id', auth, deleteRequisition);

module.exports = router;
