const router = require('express').Router();
const ctrl = require('../controllers/blogController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');

// Public
router.get('/', ctrl.getPublished);
router.get('/:slug', ctrl.getBySlug);

// Admin
router.get('/admin/all', adminAuth, ctrl.getAllAdmin);
router.post('/admin', adminAuth, upload.single('image'), ctrl.create);
router.put('/admin/:id', adminAuth, upload.single('image'), ctrl.update);
router.delete('/admin/:id', adminAuth, ctrl.delete);

module.exports = router;
