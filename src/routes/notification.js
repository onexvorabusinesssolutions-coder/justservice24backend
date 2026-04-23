const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// User
router.get('/my', auth, ctrl.getMy);
router.get('/unread-count', auth, ctrl.getUnreadCount);
router.patch('/read-all', auth, ctrl.markAllRead);
router.patch('/:id/read', auth, ctrl.markRead);
router.delete('/clear-all', auth, ctrl.clearAll);
router.delete('/:id', auth, ctrl.deleteOne);

// Admin
router.get('/admin/all', adminAuth, ctrl.getAllAdmin);
router.post('/admin', adminAuth, ctrl.create);
router.delete('/admin/:id', adminAuth, ctrl.delete);

module.exports = router;
