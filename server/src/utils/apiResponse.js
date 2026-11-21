/**
 * Standard API response envelope builders.
 */

export const sendSuccess = (res, data, meta = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
};

export const sendError = (res, message, statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      details,
    },
  });
};
