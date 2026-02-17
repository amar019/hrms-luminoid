const express = require('express');
const multer = require('multer');
const {
  getExpenses,
  createExpense,
  updateExpense,
  approveRejectExpense
} = require('../controllers/expenseController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed!'));
    }
  }
});

router.get('/', auth, getExpenses);
router.post('/', auth, upload.single('receipt'), createExpense);
router.put('/:id', auth, upload.single('receipt'), updateExpense);
router.put('/:id/approve-reject', auth, authorize('MANAGER', 'HR', 'ADMIN'), approveRejectExpense);

module.exports = router;