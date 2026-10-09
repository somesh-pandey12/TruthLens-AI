const ApiError = require('../utils/ApiError');

module.exports = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join('. ');
    return next(new ApiError(400, msg));
  }
  req.body = parsed.data;
  next();
};