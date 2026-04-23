const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Business = require('../models/Business');
const AdSet = require('../models/AdSet');
const Support = require('../models/Support');
const Referral = require('../models/Referral');
const Notification = require('../models/Notification');
const { success, error } = require('../utils/response');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers, activeUsers,
      totalBusinesses, pendingBusinesses, approvedBusinesses, rejectedBusinesses,
      totalAdsets, pendingAdsets, activeAdsets,
      openTickets, totalNotifications,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      Business.countDocuments(),
      Business.countDocuments({ status: 'pending' }),
      Business.countDocuments({ status: 'approved' }),
      Business.countDocuments({ status: 'rejected' }),
      AdSet.countDocuments(),
      AdSet.countDocuments({ status: 'pending' }),
      AdSet.countDocuments({ status: 'approved', isActive: true }),
      Support.countDocuments({ status: 'open' }),
      Notification.countDocuments(),
    ]);

    // Revenue from adsets
    const revenueAgg = await AdSet.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    success(res, {
      totalUsers,
      activeUsers,
      totalBusinesses,
      pendingBusinesses,
      approvedBusinesses,
      rejectedBusinesses,
      totalAdsets,
      pendingAdsets,
      activeAdsets,
      openTickets,
      totalNotifications,
      totalRevenue: revenueAgg[0]?.total || 0,
      totalCategories: await require('../models/Category').countDocuments(),
    });
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, isActive } = req.query;
    const filter = { role: 'user' };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      User.find(filter).select('-otp -otpExpiry -password -resetPasswordToken -resetPasswordExpiry').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
      User.countDocuments(filter),
    ]);
    success(res, { users, total, page: +page, limit: +limit });
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-otp -otpExpiry -password -resetPasswordToken -resetPasswordExpiry');
    if (!user) return error(res, 'User not found', 404);

    // Get user's businesses and referral info
    const [businesses, referral] = await Promise.all([
      Business.find({ userId: req.params.id }).select('businessName status city createdAt'),
      Referral.findOne({ userId: req.params.id }).select('totalEarned balance redeemed'),
    ]);

    success(res, { user, businesses, referral });
  } catch (e) {
    error(res, e.message);
  }
};

// PATCH /api/admin/users/:id/toggle
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    if (user.role === 'admin') return error(res, 'Cannot deactivate admin', 403);
    user.isActive = !user.isActive;
    if (!user.isActive) user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate sessions on deactivate
    await user.save();
    success(res, { isActive: user.isActive }, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    if (user.role === 'admin') return error(res, 'Cannot delete admin', 403);
    await User.findByIdAndDelete(req.params.id);
    success(res, null, 'User deleted successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/admin/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return error(res, 'Current and new password are required', 400);
    if (newPassword.length < 6) return error(res, 'New password must be at least 6 characters', 400);

    const admin = await User.findById(req.user.id);
    if (!admin) return error(res, 'Admin not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return error(res, 'Current password is incorrect', 400);

    admin.password = await bcrypt.hash(newPassword, 12);
    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    await admin.save();

    success(res, null, 'Password changed successfully. Please login again.');
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/admin/dashboard — combined dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const [
      recentUsers, recentBusinesses, recentTickets, recentAdsets,
    ] = await Promise.all([
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name phone email createdAt isActive'),
      Business.find().sort({ createdAt: -1 }).limit(5).select('businessName status city createdAt'),
      Support.find().sort({ createdAt: -1 }).limit(5).select('subject status createdAt'),
      AdSet.find().sort({ createdAt: -1 }).limit(5).select('businessName status amount createdAt'),
    ]);
    success(res, { recentUsers, recentBusinesses, recentTickets, recentAdsets });
  } catch (e) {
    error(res, e.message);
  }
};
