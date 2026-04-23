const Category = require('../models/Category');
const { success, error } = require('../utils/response');

// GET /api/categories — public
exports.getAll = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    const cats = await Category.find(filter).sort({ order: 1, name: 1 });
    success(res, cats);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/categories/:id — public
exports.getById = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return error(res, 'Category not found', 404);
    success(res, cat);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/categories/totals — public
exports.getTotals = async (req, res) => {
  try {
    const cats = await Category.find();
    const totalCategories = cats.length;
    const totalSubCategories = cats.reduce((sum, c) => sum + c.subCategories.length, 0);
    success(res, { totalCategories, totalSubCategories });
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/categories/all — public (sari categories + subcategories)
exports.getAllWithSubs = async (req, res) => {
  try {
    const cats = await Category.find().sort({ order: 1, name: 1 });
    const business = cats.filter(c => c.type === 'business');
    const professional = cats.filter(c => c.type === 'professional');
    success(res, {
      totalCategories: cats.length,
      totalSubCategories: cats.reduce((sum, c) => sum + c.subCategories.length, 0),
      business: {
        total: business.length,
        categories: business,
      },
      professional: {
        total: professional.length,
        categories: professional,
      },
    });
  } catch (e) {
    error(res, e.message);
  }
};

// --- ADMIN ---

// GET /api/categories/admin/all
exports.getAllAdmin = async (req, res) => {
  try {
    const cats = await Category.find().sort({ order: 1, name: 1 });
    success(res, cats);
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/categories/admin
exports.create = async (req, res) => {
  try {
    const image = req.file?.path;
    const cat = await Category.create({ ...req.body, image });
    success(res, cat, 'Category created successfully', 201);
  } catch (e) {
    error(res, e.message);
  }
};

// PUT /api/categories/admin/:id
exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = req.file.path;
    const cat = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!cat) return error(res, 'Category not found', 404);
    success(res, cat, 'Category updated successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/categories/admin/:id
exports.delete = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    success(res, null, 'Category deleted successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/categories/admin/:id/subcategory
exports.addSubCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const image = req.file?.path;
    const cat = await Category.findByIdAndUpdate(
      req.params.id,
      { $push: { subCategories: { name, icon, image } } },
      { new: true }
    );
    success(res, cat, 'Sub-category added successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// PUT /api/categories/admin/:id/subcategory/:subId
exports.updateSubCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const cat = await Category.findById(req.params.id);
    if (!cat) return error(res, 'Category not found', 404);
    const sub = cat.subCategories.id(req.params.subId);
    if (!sub) return error(res, 'Sub-category not found', 404);
    if (name) sub.name = name;
    if (icon) sub.icon = icon;
    if (req.file) sub.image = req.file.path;
    await cat.save();
    success(res, cat, 'Sub-category updated successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/categories/admin/:id/subcategory/:subId
exports.deleteSubCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(
      req.params.id,
      { $pull: { subCategories: { _id: req.params.subId } } },
      { new: true }
    );
    success(res, cat, 'Sub-category deleted successfully');
  } catch (e) {
    error(res, e.message);
  }
};
