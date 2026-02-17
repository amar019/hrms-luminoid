const express = require('express');
const {
  getAssets,
  createAsset,
  assignAsset,
  returnAsset
} = require('../controllers/assetController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getAssets);
router.post('/', auth, authorize('HR', 'ADMIN'), createAsset);
router.put('/:id/assign', auth, authorize('HR', 'ADMIN'), assignAsset);
router.put('/:id/return', auth, authorize('HR', 'ADMIN'), returnAsset);

module.exports = router;