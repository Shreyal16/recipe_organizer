import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';

/**
 * Standard API rate limiter.
 * In development or testing, sets generous thresholds.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Max 300 requests per 15 minutes in dev/prod
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many requests from this IP, please try again after 15 minutes', 429);
  },
});

export default apiLimiter;
