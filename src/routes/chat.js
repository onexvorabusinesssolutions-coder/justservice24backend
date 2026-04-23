const router = require('express').Router();
const ctrl = require('../controllers/chatController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Admin — pehle register karo taaki /:convId se conflict na ho
router.get('/admin/all', adminAuth, ctrl.getAllAdmin);
router.delete('/admin/:convId', adminAuth, ctrl.deleteConversationAdmin);

// User
router.get('/', auth, ctrl.getMyConversations);
router.post('/start', auth, ctrl.start);
router.get('/:convId', auth, ctrl.getOne);
router.post('/:convId/send', auth, ctrl.send);
router.delete('/:convId/messages/:msgId', auth, ctrl.deleteMessage);
router.delete('/:convId', auth, ctrl.deleteConversation);

module.exports = router;
