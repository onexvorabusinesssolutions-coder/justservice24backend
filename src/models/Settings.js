const mongoose = require('mongoose');
const SettingsSchema = new mongoose.Schema({
  appName: { type: String, default: 'JustService' },
  appLogo: String,
  contactEmail: String,
  contactPhone: String,
  address: String,
  referralBonus: { type: Number, default: 1 },
  minRedeemAmount: { type: Number, default: 1 },
  maintenanceMode: { type: Boolean, default: false },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String,
  },
}, { timestamps: true });
module.exports = mongoose.model('Settings', SettingsSchema);
