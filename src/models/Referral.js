const mongoose = require('mongoose');
const ReferralSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCode: { type: String, sparse: true },
  referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalEarned: { type: Number, default: 0 },
  redeemed: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Referral', ReferralSchema);
