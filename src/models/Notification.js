const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = public/all
  type: {
    type: String,
    enum: ['new_user', 'new_business', 'business_approved', 'business_rejected',
           'new_message', 'new_enquiry', 'new_review', 'admin_broadcast'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: { type: String, default: '🔔' },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false }, // true = dikhega sabko
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
