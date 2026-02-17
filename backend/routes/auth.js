const express = require('express');
const { body } = require('express-validator');
const { register, login, refreshToken, logout, getCurrentUser } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').optional().isIn(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']),
  body('department').optional().trim(),
  body('designation').optional().trim(),
  body('joinDate').optional().isISO8601(),
  body('dateOfBirth').optional().isISO8601()
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], login);

router.post('/refresh', refreshToken);
router.post('/logout', auth, logout);
router.get('/me', auth, getCurrentUser);

module.exports = router;