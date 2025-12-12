module.exports = function (err, req, res, next) {
  console.error(err.stack || err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error'
  });
};
