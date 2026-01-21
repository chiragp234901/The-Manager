// backend/config.js
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

export const MONGO_URI = process.env.MONGO_URI;
export const PORT = process.env.PORT;
export const JWT_SECRET = process.env.JWT_SECRET;
export const refreshTokenSecret= process.env.REFRESH_TOKEN_SECRET;
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const STORAGE_LIMIT = process.env.STORAGE_LIMIT || 5 * 1024 * 1024 * 1024; // 5GB default

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
