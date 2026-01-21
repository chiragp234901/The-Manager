import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login
  const login = async (email, password) => {
    const res = await axiosInstance.post("/auth/login", { email, password });

    localStorage.setItem("accessToken", res.data.accessToken);

    setUser(res.data.user);
  };

  // Register
  const register = async (name, email, password) => {
    const res = await axiosInstance.post("/auth/register", {
      name,
      email,
      password,
    });

    localStorage.setItem("accessToken", res.data.accessToken);

    setUser(res.data.user);
  };

  // Load logged in user
  const loadUser = async () => {
    try {
      const res = await axiosInstance.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const logout = async () => {
    // Clear local storage FIRST to prevent any other requests from using expired token
    localStorage.removeItem("accessToken");
    setUser(null);
    
    try {
      // Try to call the backend logout endpoint to clear the refresh token cookie
      // This is a best-effort call - if it fails, user is already logged out locally
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      // Silently catch errors - user is already logged out on frontend
      // This prevents 401 errors from appearing in console during logout
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
