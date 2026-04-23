const router = require('express').Router();
const ctrl = require('../controllers/certificateController');
const auth = require('../middleware/auth');

router.get('/price-info', ctrl.getPriceInfo);
router.get('/my', auth, ctrl.getMyCertificates);
router.post('/create-order', auth, ctrl.createOrder);
router.post('/verify-payment', auth, ctrl.verifyPayment);

module.exports = router;
