const Blog = require('../models/Blog');
const { success, error } = require('../utils/response');

const makeSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

// GET /api/blogs — public (published only)
exports.getPublished = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const [blogs, total] = await Promise.all([
      Blog.find(filter).select('-content').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
      Blog.countDocuments(filter),
    ]);
    success(res, { blogs, total, page: +page, limit: +limit });
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/blogs/:slug — public
exports.getBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate({ slug: req.params.slug, isPublished: true }, { $inc: { views: 1 } }, { new: true });
    if (!blog) return error(res, 'Blog not found', 404);
    success(res, blog);
  } catch (e) {
    error(res, e.message);
  }
};

// --- ADMIN ---

// GET /api/blogs/admin/all
exports.getAllAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    success(res, blogs);
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/blogs/admin
exports.create = async (req, res) => {
  try {
    const slug = makeSlug(req.body.title);
    const image = req.file?.path;
    const blog = await Blog.create({ ...req.body, slug, image });
    success(res, blog, 'Blog created successfully', 201);
  } catch (e) {
    error(res, e.message);
  }
};

// PUT /api/blogs/admin/:id
exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = req.file.path;
    const blog = await Blog.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!blog) return error(res, 'Blog not found', 404);
    success(res, blog, 'Blog updated successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/blogs/admin/:id
exports.delete = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    success(res, null, 'Blog deleted successfully');
  } catch (e) {
    error(res, e.message);
  }
};
