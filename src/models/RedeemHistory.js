const mongoose = require('mongoose');

const RedeemHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  coins: { type: Number, required: true },
  type: { type: String, enum: ['bonanza', 'lottery'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('RedeemHistory', RedeemHistorySchema);
