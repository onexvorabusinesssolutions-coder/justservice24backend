const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

router.get('/profile', auth, ctrl.getProfile);
router.put('/profile', auth, upload.single('avatar'), ctrl.updateProfile);
router.post('/fcm-token', auth, ctrl.saveFcmToken);
router.delete('/account', auth, ctrl.deleteAccount);

// Favourites
router.get('/favourites', auth, ctrl.getFavourites);
router.post('/favourites/:businessId', auth, ctrl.toggleFavourite);

// Public profile
router.get('/public/:id', ctrl.getPublicProfile);

module.exports = router;
