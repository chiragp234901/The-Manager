// backend/routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getMe,
} from "../controllers/authController.js";

import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* -----------------------------------------------------------
   AUTH ROUTES
------------------------------------------------------------*/

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Logout - no auth required, just clear the cookie
router.post("/logout", logoutUser);

// Refresh token
router.get("/refresh", refreshAccessToken);

// Get current user profile
router.get("/me", verifyToken, getMe);

export default router;
