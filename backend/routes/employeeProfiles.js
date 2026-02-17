const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getAllProfiles
} = require('../controllers/employeeProfileController');
const { auth, authorize } = require('../middleware/auth');
const { upload } = require('../utils/s3Utils');

const router = express.Router();

router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);
router.post('/me/profile-image', auth, upload.single('profileImage'), uploadProfilePicture);
router.delete('/me/profile-image', auth, deleteProfilePicture);
router.get('/', auth, authorize('HR', 'ADMIN'), getAllProfiles);

module.exports = router;