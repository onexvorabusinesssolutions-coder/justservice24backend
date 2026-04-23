const router = require('express').Router();
const ctrl = require('../controllers/settingsController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');

// Public
router.get('/', ctrl.get);

// Admin
router.put('/admin', adminAuth, upload.single('appLogo'), ctrl.update);

module.exports = router;
