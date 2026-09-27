// src/lib/money.js
/**
 * Convert a rupee string (e.g. "499.00") to paise integer (49900).
 * Throws if the format is invalid or has more than two decimal places.
 */
function toPaise(rupeeStr) {
  if (typeof rupeeStr !== 'string') {
    throw new Error('Amount must be a string');
  }
  // Ensure it matches optional digits, optional decimal with up to 2 digits
  if (!/^\d+(\.\d{1,2})?$/.test(rupeeStr)) {
    throw new Error('Invalid amount format');
  }
  const [whole, fraction = ''] = rupeeStr.split('.');
  const paise = parseInt(whole, 10) * 100 + parseInt((fraction + '00').slice(0, 2), 10);
  return paise;
}

/**
 * Convert integer paise to rupee string with two decimals.
 */
function toRupeeString(paise) {
  if (typeof paise !== 'number' || !Number.isInteger(paise)) {
    throw new Error('Paise must be an integer');
  }
  const rupees = (paise / 100).toFixed(2);
  return rupees;
}

module.exports = { toPaise, toRupeeString };
