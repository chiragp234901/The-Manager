import axios from "axios";

//const API = "http://localhost:5000/api";
const API = "https://the-manager-pz6x.onrender.com/api";
const axiosInstance = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Attach token (except for logout which doesn't need authentication)
axiosInstance.interceptors.request.use(
  (config) => {
    // Don't attach token for logout endpoint
    if (config.url && config.url.includes('/auth/logout')) {
      return config;
    }

    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Auto-refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept logout or refresh endpoint errors
    if (
      originalRequest.url?.includes('/auth/logout') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refresh = await axios.get(`${API}/auth/refresh`, {
          withCredentials: true,
        });

        const newToken = refresh.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Process queued requests
        processQueue(null, newToken);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        
        // Clear token and redirect to login
        localStorage.removeItem("accessToken");
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
