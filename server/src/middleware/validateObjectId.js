import mongoose from 'mongoose';
import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware factory to validate that a given request parameter is a valid MongoDB ObjectId.
 * @param {string} paramName - Parameter name in req.params (e.g. 'id', 'recipeId', 'itemId')
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, `Invalid ID format for parameter '${paramName}': must be a 24-character hexadecimal string`, 400);
    }
    next();
  };
};

export default validateObjectId;
