const mongoose = require('mongoose');
const DigitalPosterSchema = new mongoose.Schema({
  category: { type: String, required: true },
  label: { type: String, required: true },
  date: { type: String },
  image: String,
  bg: String,
  accent: String,
  emoji: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('DigitalPoster', DigitalPosterSchema);
