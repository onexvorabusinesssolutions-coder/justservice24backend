const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/auth/signup
router.post('/signup',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('referralCode').optional().trim(),
  ],
  validate,
  ctrl.signup
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
);

// POST /api/auth/admin-login
router.post('/admin-login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.adminLogin
);

// GET /api/auth/me
router.get('/me', auth, ctrl.getMe);

// POST /api/auth/logout
router.post('/logout', auth, ctrl.logout);

// POST /api/auth/send-otp
router.post('/send-otp',
  [
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number is required'),
  ],
  validate,
  ctrl.sendOtp
);

// POST /api/auth/verify-otp
router.post('/verify-otp',
  [
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  ctrl.verifyOtp
);

// POST /api/auth/forgot-password
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  ],
  validate,
  ctrl.forgotPassword
);

// POST /api/auth/reset-password
router.post('/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('otp').notEmpty().withMessage('OTP is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  ctrl.resetPassword
);

// POST /api/auth/send-change-password-otp
router.post('/send-change-password-otp', auth, ctrl.sendChangePasswordOtp);

// POST /api/auth/change-password
router.post('/change-password', auth,
  [
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  ctrl.changePassword
);

// POST /api/auth/create-admin
router.post('/create-admin', ctrl.createAdmin);

module.exports = router;
