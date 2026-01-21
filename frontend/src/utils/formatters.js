/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date to relative time string
 * @param {string|Date} dateString - Date to format
 * @returns {string} Relative time string (e.g., "Today", "3 days ago")
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
};

/**
 * Get emoji icon for file type
 * @param {string} type - File type
 * @returns {string} Emoji representing the file type
 */
export const getFileIcon = (type) => {
  const icons = {
    image: '🖼️',
    video: '🎥',
    pdf: '📄',
    document: '📝',
    spreadsheet: '📊',
    presentation: '📈',
    archive: '📦',
    code: '💻',
  };
  
  return icons[type] || '📎';
};
