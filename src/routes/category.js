const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');

// Public
router.get('/', ctrl.getAll);
router.get('/totals', ctrl.getTotals);
router.get('/all', ctrl.getAllWithSubs);
router.get('/:id', ctrl.getById);

// Admin
router.get('/admin/all', adminAuth, ctrl.getAllAdmin);
router.post('/admin', adminAuth, upload.single('image'), ctrl.create);
router.put('/admin/:id', adminAuth, upload.single('image'), ctrl.update);
router.delete('/admin/:id', adminAuth, ctrl.delete);
router.post('/admin/:id/subcategory', adminAuth, upload.single('image'), ctrl.addSubCategory);
router.put('/admin/:id/subcategory/:subId', adminAuth, upload.single('image'), ctrl.updateSubCategory);
router.delete('/admin/:id/subcategory/:subId', adminAuth, ctrl.deleteSubCategory);

module.exports = router;
