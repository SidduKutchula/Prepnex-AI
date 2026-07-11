/**
 * Wraps an async route handler to catch any unhandled promise rejections
 * and forwards them to the Express error handling middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
