/**
 * Handle errors gracefully with user feedback
 * @param {Error} error - The error object
 * @param {string} userMessage - User-friendly message
 * @param {Function} callback - Optional callback for additional handling
 */
export const handleError = (error, userMessage, callback) => {
  // Log to console only in development
  if (process.env.NODE_ENV === 'development') {
    console.error(userMessage, error);
  }

  // Show user-friendly alert (can be replaced with toast notifications later)
  if (userMessage) {
    // For now, use alert. In production, this should be a toast/notification
    alert(userMessage);
  }

  // Execute callback if provided
  if (callback && typeof callback === 'function') {
    callback(error);
  }
};

/**
 * Check if user is online
 */
export const checkOnlineStatus = () => {
  if (!navigator.onLine) {
    alert('No internet connection. Please check your network and try again.');
    return false;
  }
  return true;
};
