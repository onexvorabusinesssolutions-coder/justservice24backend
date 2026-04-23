const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Basic Info
  businessName: { type: String, required: true },
  businessType: String,
  personName: String,
  phone: String,
  whatsapp: String,
  email: String,
  tagline: String,
  description: String,
  website: String,
  facebook: String,
  instagram: String,
  twitter: String,
  linkedin: String,
  established: String,

  // Category
  category: String,
  subCategory: String,
  categories: [String],
  subCategories: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Location
  pincode: String,
  state: String,
  district: String,
  city: String,
  houseNo: String,
  landmark: String,
  address: String,

  // Delivery
  logistryEnabled: { type: Boolean, default: false },
  deliveryRange: String,

  // Media
  logo: String,
  images: [String],
  brochure: String,

  // Business Details
  paymentModes: [String],
  hours: { type: mongoose.Schema.Types.Mixed, default: {} },
  services: [{ name: String, price: String }],
  products: [{ name: String, price: String, discount: String, description: String, image: String }],

  // Stats
  totalClicks: { type: Number, default: 0 },
  totalCalls: { type: Number, default: 0 },
  totalEnquiries: { type: Number, default: 0 },

  // Ratings
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  reviewsList: [{ name: String, rating: Number, comment: String, date: String }],

  // Status
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isActive: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  profilePct: { type: Number, default: 40 },
}, { timestamps: true });

module.exports = mongoose.model('Business', BusinessSchema);
