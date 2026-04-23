const router = require('express').Router();
const ctrl = require('../controllers/adsetController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');

// Public
router.get('/', ctrl.getActive);

// Webhook (raw body needed - registered before json middleware in index.js)
router.post('/webhook', ctrl.razorpayWebhook);

// User
router.post('/create-order', auth, ctrl.createOrder);
router.get('/my', auth, ctrl.getMyAds);
router.post('/', auth, upload.single('image'), ctrl.create);

// Admin
router.get('/admin/all', adminAuth, ctrl.getAllAdmin);
router.patch('/admin/:id/status', adminAuth, ctrl.updateStatus);
router.delete('/admin/:id', adminAuth, ctrl.delete);

module.exports = router;
