import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";

import { MONGO_URI, PORT } from "./config.js";

const app = express(); // Creates an Express Application

// Middlewares
app.use(express.json()); // Allows server to read JSON request bodies
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true })); // Client URL
app.use("/uploads", express.static("uploads")); // For uploded files destination

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);

// MongoDB Connection
mongoose
  .connect(MONGO_URI) // Connecting to the Database
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
