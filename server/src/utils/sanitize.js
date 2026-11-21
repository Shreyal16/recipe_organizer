/**
 * Safely escapes characters that have special meaning in regular expressions.
 * Used before querying MongoDB with $regex.
 */
export const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Normalizes a string: trims whitespace and converts to lowercase.
 */
export const normalizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase();
};

export default {
  escapeRegex,
  normalizeString,
};
