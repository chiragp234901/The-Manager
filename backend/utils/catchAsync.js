// backend/utils/catchAsync.js
// Wrapper for async route handlers to catch errors and pass to error middleware
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
