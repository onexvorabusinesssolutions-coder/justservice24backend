const router = require('express').Router();
const ctrl = require('../controllers/businessController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');

const multiUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: 'brochure', maxCount: 1 },
  { name: 'productImages', maxCount: 10 },
]);

// Public
router.get('/suggestions', ctrl.getSuggestions);
router.get('/', ctrl.getApproved);
router.get('/my', auth, ctrl.getMyBusinesses);
router.get('/:id', ctrl.getById);
router.get('/:id/reviews', ctrl.getReviews);

// User
router.post('/', auth, multiUpload, ctrl.create);
router.put('/:id', auth, multiUpload, ctrl.update);
router.post('/:id/review', auth, ctrl.addReview);
router.post('/:id/enquiry', ctrl.trackEnquiry);

// Admin
router.get('/admin/all', adminAuth, ctrl.getAllAdmin);
router.get('/admin/stats', adminAuth, ctrl.getAdminStats);
router.get('/admin/enquiries', adminAuth, ctrl.getEnquiriesAdmin);
router.patch('/admin/:id/status', adminAuth, ctrl.updateStatus);
router.delete('/admin/:id', adminAuth, ctrl.delete);

module.exports = router;
