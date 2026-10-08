const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createSourcingLog,
  getSourcingLogs,
  updateSourcingLog,
  deleteSourcingLog,
  getSourcingStats
} = require('../controllers/dailySourcingLogController');

router.use(auth);

router.get('/stats', getSourcingStats);
router.get('/', getSourcingLogs);
router.post('/', createSourcingLog);
router.put('/:id', updateSourcingLog);
router.delete('/:id', deleteSourcingLog);

module.exports = router;
