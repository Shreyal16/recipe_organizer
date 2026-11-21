import { sendError } from '../utils/apiResponse.js';

/**
 * 404 Not Found Middleware.
 */
export const notFound = (req, res, next) => {
  return sendError(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
};

export default notFound;
