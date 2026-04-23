const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: String,
  image: String,
  type: { type: String, enum: ['business', 'professional'], default: 'business' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  subCategories: [{
    name: { type: String, required: true },
    icon: String,
    image: String,
    isActive: { type: Boolean, default: true },
  }],
}, { timestamps: true });
module.exports = mongoose.model('Category', CategorySchema);
