import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware factory to validate Express requests using Zod schemas.
 * @param {object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
export const validate = (schemas = {}) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendError(res, 'Request validation failed', 400, details);
      }
      return sendError(res, err.message || 'Validation error', 400);
    }
  };
};

export default validate;
