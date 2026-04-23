const Notification = require('../models/Notification');
const User = require('../models/User');
const admin = require('../config/firebase');

const notify = async ({ userId = null, type, title, message, icon = '🔔', link = '', isPublic = false }) => {
  try {
    // 1. DB mein save karo
    await Notification.create({ userId, type, title, message, icon, link, isPublic });

    // 2. FCM push bhejo
    if (isPublic) {
      // Sab users ko bhejo
      const users = await User.find({ isActive: true, fcmToken: { $exists: true, $ne: null } }).select('fcmToken');
      const tokens = users.map(u => u.fcmToken).filter(Boolean);
      if (tokens.length > 0) {
        await sendMulticast(tokens, title, message, type);
      }
    } else if (userId) {
      // Specific user ko bhejo
      const user = await User.findById(userId).select('fcmToken');
      if (user?.fcmToken) {
        await sendPush(user.fcmToken, title, message, type);
      }
    }
  } catch (e) {
    console.error('Notification error:', e.message);
  }
};

// Single user ko push
const sendPush = async (token, title, body, type = '') => {
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: { type: type || '' },
      android: { priority: 'high', notification: { sound: 'default', channelId: 'justservice24_channel' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (e) {
    console.error('FCM push error:', e.message);
  }
};

// Multiple users ko push (max 500 per batch)
const sendMulticast = async (tokens, title, body, type = '') => {
  try {
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 500) {
      chunks.push(tokens.slice(i, i + 500));
    }
    for (const chunk of chunks) {
      await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: { type: type || '' },
        android: { priority: 'high', notification: { sound: 'default', channelId: 'justservice24_channel' } },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    }
  } catch (e) {
    console.error('FCM multicast error:', e.message);
  }
};

module.exports = notify;
module.exports.sendPush = sendPush;
module.exports.sendMulticast = sendMulticast;
