const s3 = require('../config/s3');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload profile image to S3
const uploadProfileImage = async (file, userId) => {
  const key = `profile-images/${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

// Delete profile image from S3
const deleteProfileImage = async (imageUrl) => {
  if (!imageUrl) return;
  
  try {
    const key = imageUrl.split('/').slice(-2).join('/'); // Extract key from URL
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting image from S3:', error);
  }
};

module.exports = {
  upload,
  uploadProfileImage,
  deleteProfileImage
};