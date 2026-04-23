const mongoose = require('mongoose');
const SupportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  phone: String,
  email: String,
  subject: String,
  userType: String,
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  reply: String,
}, { timestamps: true });
module.exports = mongoose.model('Support', SupportSchema);
