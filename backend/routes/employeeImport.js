const express = require('express');
const multer = require('multer');
const { importEmployees, downloadTemplate, exportEmployees } = require('../controllers/employeeImportController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `import-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                         'application/vnd.ms-excel', 
                         'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload Excel or CSV file.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Routes
router.post('/import', auth, authorize('ADMIN', 'HR'), upload.single('file'), importEmployees);
router.get('/template', auth, authorize('ADMIN', 'HR'), downloadTemplate);
router.get('/export', auth, authorize('ADMIN', 'HR'), exportEmployees);

module.exports = router;