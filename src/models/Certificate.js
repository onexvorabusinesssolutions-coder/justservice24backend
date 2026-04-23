const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },

  type: { type: String, enum: ['digital', 'delivery'], required: true },

  // Razorpay
  orderId:   { type: String },
  paymentId: { type: String },
  amount:    { type: Number, required: true }, // in rupees

  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

  // Delivery fields
  deliveryAddress: { type: String },
  km:              { type: Number },  // distance in km
  deliveryCharge:  { type: Number },  // km * 15

}, { timestamps: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
