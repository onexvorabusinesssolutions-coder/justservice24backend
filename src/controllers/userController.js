const User = require('../models/User');
const Business = require('../models/Business');
const { success, error } = require('../utils/response');

// GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-otp -otpExpiry -password -resetPasswordToken -resetPasswordExpiry');
    if (!user) return error(res, 'User not found', 404);
    success(res, user);
  } catch (e) {
    error(res, e.message);
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'email', 'address', 'occupation', 'gender', 'dob', 'maritalStatus'];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    if (req.file) updates.avatar = req.file.path;

    // Email uniqueness check
    if (updates.email) {
      const existing = await User.findOne({ email: updates.email, _id: { $ne: req.user.id } });
      if (existing) return error(res, 'Email already in use', 409);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-otp -otpExpiry -password -resetPasswordToken -resetPasswordExpiry');
    success(res, user, 'Profile updated successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/users/fcm-token
exports.saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return error(res, 'FCM token required', 400);
    await User.findByIdAndUpdate(req.user.id, { fcmToken });
    success(res, null, 'FCM token saved');
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/users/account
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isActive: false, $inc: { tokenVersion: 1 } });
    success(res, null, 'Account deactivated successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/users/public/:id — public profile
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar occupation createdAt');
    if (!user) return error(res, 'User not found', 404);
    success(res, user);
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/users/favourites/:businessId — toggle favourite
exports.toggleFavourite = async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findById(businessId);
    if (!business) return error(res, 'Business not found', 404);

    const user = await User.findById(req.user.id).select('favourites');
    const isFav = user.favourites.some(id => id.toString() === businessId);

    const update = isFav
      ? { $pull: { favourites: businessId } }
      : { $addToSet: { favourites: businessId } };

    await User.findByIdAndUpdate(req.user.id, update);
    success(res, { isFavourite: !isFav }, isFav ? 'Removed from favourites' : 'Added to favourites');
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/users/favourites — get my favourites
exports.getFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('favourites').populate({
      path: 'favourites',
      match: { status: 'approved', isActive: true },
      select: 'businessName logo city rating reviews businessType',
    });
    if (!user) return error(res, 'User not found', 404);
    success(res, user.favourites);
  } catch (e) {
    error(res, e.message);
  }
};
