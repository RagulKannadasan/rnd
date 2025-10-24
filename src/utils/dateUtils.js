/**
 * Format a date to dd/mm/yy format
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string in dd/mm/yy format
 */
export const formatDate = (date) => {
  if (!date || !(date instanceof Date)) {
    return 'Date not available';
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  
  return `${day}/${month}/${year}`;
};

/**
 * Format a date to dd/mm/yyyy format
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string in dd/mm/yyyy format
 */
export const formatDateFull = (date) => {
  if (!date || !(date instanceof Date)) {
    return 'Date not available';
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

const dateUtils = { formatDate, formatDateFull };
export default dateUtils;