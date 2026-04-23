const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const validate = require('../middleware/validate');

router.get('/stats', adminAuth, ctrl.getStats);
router.get('/dashboard', adminAuth, ctrl.getDashboard);

// Users
router.get('/users', adminAuth, ctrl.getUsers);
router.get('/users/:id', adminAuth, ctrl.getUserById);
router.patch('/users/:id/toggle', adminAuth, ctrl.toggleUser);
router.delete('/users/:id', adminAuth, ctrl.deleteUser);

// Admin account
router.post('/change-password', adminAuth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
