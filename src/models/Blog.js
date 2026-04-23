const mongoose = require('mongoose');
const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  category: String,
  content: String,
  excerpt: String,
  image: String,
  author: { type: String, default: 'JustService Team' },
  tags: [String],
  isPublished: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Blog', BlogSchema);
