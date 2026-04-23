const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/response');

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return error(res, 'Access denied. No token provided.', 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Check token version for logout invalidation
    const user = await User.findById(decoded.id).select('tokenVersion isActive role');
    if (!user) return error(res, 'User not found.', 401);
    if (!user.isActive) return error(res, 'Account is deactivated.', 403);
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion)
      return error(res, 'Session expired. Please login again.', 401);
    req.user = { id: decoded.id, role: user.role, tokenVersion: user.tokenVersion };
    next();
  } catch {
    error(res, 'Invalid or expired token.', 401);
  }
};

module.exports = auth;
