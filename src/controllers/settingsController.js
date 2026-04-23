const Settings = require('../models/Settings');
const { success, error } = require('../utils/response');

// GET /api/settings — public
exports.get = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    success(res, settings);
  } catch (e) {
    error(res, e.message);
  }
};

// PUT /api/settings/admin — admin only
exports.update = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    Object.assign(settings, req.body);
    if (req.file) settings.appLogo = req.file.path;
    await settings.save();
    success(res, settings, 'Settings updated successfully');
  } catch (e) {
    error(res, e.message);
  }
};
