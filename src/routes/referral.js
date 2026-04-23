const router = require('express').Router();
const ctrl = require('../controllers/referralController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// User
router.get('/my', auth, ctrl.getMy);
router.post('/redeem', auth, ctrl.redeem);
router.get('/redeem-history', auth, ctrl.getRedeemHistory);

// Admin
router.get('/admin/all', adminAuth, ctrl.getAllAdmin);
router.get('/admin/stats', adminAuth, ctrl.getStats);

module.exports = router;
