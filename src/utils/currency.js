/**
 * Currency formatting utilities for Pakistan (PKR)
 */

/**
 * Format a number as Pakistani Rupees
 * @param {number|string} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showSymbol = true,
    decimals = 2,
    locale = 'en-PK'
  } = options;

  const numAmount = parseFloat(amount) || 0;

  const formatted = numAmount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return showSymbol ? `Rs. ${formatted}` : formatted;
};

/**
 * Format a number with Pakistani number formatting (commas)
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Parse a formatted currency string back to a number
 * @param {string} formattedAmount - Formatted currency string (e.g., "Rs. 1,234.56")
 * @returns {number} Parsed number
 */
export const parseCurrency = (formattedAmount) => {
  if (typeof formattedAmount === 'number') return formattedAmount;

  // Remove currency symbol and commas
  const cleaned = String(formattedAmount)
    .replace(/Rs\.?\s*/g, '')
    .replace(/,/g, '');

  return parseFloat(cleaned) || 0;
};

/**
 * Currency symbol for Pakistan
 */
export const CURRENCY_SYMBOL = 'Rs.';

/**
 * Currency code for Pakistan
 */
export const CURRENCY_CODE = 'PKR';

/**
 * Locale for Pakistan
 */
export const LOCALE = 'en-PK';
