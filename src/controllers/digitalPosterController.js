const DigitalPoster = require('../models/DigitalPoster');
const { success, error } = require('../utils/response');

// GET /api/digital-posters — public
exports.getAll = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const posters = await DigitalPoster.find(filter).sort({ createdAt: -1 });
    success(res, posters);
  } catch (e) {
    error(res, e.message);
  }
};

// --- ADMIN ---

// GET /api/digital-posters/admin/all
exports.getAllAdmin = async (req, res) => {
  try {
    const posters = await DigitalPoster.find().sort({ createdAt: -1 });
    success(res, posters);
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/digital-posters/admin
exports.create = async (req, res) => {
  try {
    const image = req.file?.path;
    const poster = await DigitalPoster.create({ ...req.body, image });
    success(res, poster, 'Digital poster created successfully', 201);
  } catch (e) {
    error(res, e.message);
  }
};

// PUT /api/digital-posters/admin/:id
exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = req.file.path;
    const poster = await DigitalPoster.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!poster) return error(res, 'Poster not found', 404);
    success(res, poster, 'Poster updated successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/digital-posters/admin/:id
exports.delete = async (req, res) => {
  try {
    await DigitalPoster.findByIdAndDelete(req.params.id);
    success(res, null, 'Poster deleted successfully');
  } catch (e) {
    error(res, e.message);
  }
};
