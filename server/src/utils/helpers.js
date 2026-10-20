class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expected = true;
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, asyncHandler };