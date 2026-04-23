const Notification = require('../models/Notification');
const User = require('../models/User');
const { success, error } = require('../utils/response');
const notify = require('../utils/notify');

// GET /api/notifications/my
exports.getMy = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { userId: req.user.id },
        { isPublic: true },
      ],
    }).sort({ createdAt: -1 }).limit(50);
    success(res, notifications);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      $or: [{ userId: req.user.id }, { isPublic: true }],
      isRead: false,
    });
    success(res, { count });
  } catch (e) {
    error(res, e.message);
  }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ userId: req.user.id }, { isPublic: true }], isRead: false },
      { isRead: true }
    );
    success(res, null, 'All notifications marked as read');
  } catch (e) {
    error(res, e.message);
  }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    success(res, null, 'Marked as read');
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/notifications/:id — user delete own notification
exports.deleteOne = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return error(res, 'Notification not found', 404);
    // Only allow deleting own or public notifications
    if (notif.userId && notif.userId.toString() !== req.user.id)
      return error(res, 'Unauthorized', 403);
    await Notification.findByIdAndDelete(req.params.id);
    success(res, null, 'Notification deleted');
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/notifications/clear-all — user clear all their notifications
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({
      $or: [{ userId: req.user.id }, { isPublic: true }],
    });
    success(res, null, 'All notifications cleared');
  } catch (e) {
    error(res, e.message);
  }
};

// --- ADMIN ---
exports.getAllAdmin = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    success(res, notifications);
  } catch (e) {
    error(res, e.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { type, targetUsers, title, message, icon, isPublic } = req.body;
    const sentCount = isPublic
      ? await User.countDocuments({ isActive: true })
      : (targetUsers?.length || 0);

    const notification = await Notification.create({ ...req.body, sentCount });

    // FCM push bhejo via notify utility
    await notify({
      userId: targetUsers?.[0] || null,
      type: type || 'general',
      title,
      message,
      icon: icon || '🔔',
      isPublic: isPublic || false,
    });

    success(res, notification, 'Notification sent successfully', 201);
  } catch (e) {
    error(res, e.message);
  }
};

exports.delete = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    success(res, null, 'Notification deleted');
  } catch (e) {
    error(res, e.message);
  }
};
