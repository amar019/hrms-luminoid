const express = require('express');
const { getBalances, initializeBalances } = require('../controllers/leaveBalanceController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/:userId?', auth, getBalances);
router.post('/initialize', auth, authorize('ADMIN', 'HR'), initializeBalances);

module.exports = router;