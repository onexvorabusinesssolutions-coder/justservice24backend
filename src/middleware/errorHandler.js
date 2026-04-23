const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'ValidationError') return error(res, err.message, 422);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, `${field} already exists.`, 409);
  }
  error(res, err.message || 'Internal server error', err.status || 500);
};

module.exports = errorHandler;
