/**
 * Async handler to wrap async route handlers and catch errors
 * This eliminates the need for try/catch blocks in every controller function
 *
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
