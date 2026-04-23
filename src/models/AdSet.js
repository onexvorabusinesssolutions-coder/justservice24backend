const mongoose = require('mongoose');
const AdSetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Customer billing details
  fullName: String,
  phone: String,
  email: String,
  address: String,
  pinCode: String,
  state: String,
  city: String,
  businessName: String,
  gstNumber: String,
  // Ad placement
  adPlacement: { type: String, enum: ['Dashboard', 'Category'], default: 'Dashboard' },
  bannerPosition: String,   // Top Banner / Middle Banner / Bottom Banner
  category: String,         // for Category tab
  subCategory: String,      // for Category tab
  duration: String,         // 1 Month / 3 Months
  amount: Number,
  // Ad image
  image: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'published', 'expired'], default: 'pending' },
  isActive: { type: Boolean, default: false },
  paymentId: String,
  orderId: String,
  paymentStatus: { type: String, enum: ['pending', 'captured', 'failed'], default: 'pending' },
  startDate: Date,
  endDate: Date,
}, { timestamps: true });
module.exports = mongoose.model('AdSet', AdSetSchema);
