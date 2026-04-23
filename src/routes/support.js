const router = require('express').Router();
const ctrl = require('../controllers/supportController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// User
router.post('/', auth, ctrl.create);
router.get('/my', auth, ctrl.getMyTickets);
router.patch('/my/:id/close', auth, ctrl.closeTicket);

// Admin
router.get('/admin/all', adminAuth, ctrl.getAllAdmin);
router.patch('/admin/:id', adminAuth, ctrl.updateStatus);
router.delete('/admin/:id', adminAuth, ctrl.delete);

module.exports = router;
