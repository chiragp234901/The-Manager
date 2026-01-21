// backend/routes/fileRoutes.js
import express from "express";
import multer from "multer";
import {
  getFilesInFolder,
  uploadFile,
  renameFile,
  deleteFile,
  moveFile,
  generatePublicLink,
  getPublicFile,
  downloadPublicFile,
  shareFile,
  getFile,
  getStorageUsage,
  moveToTrash,
  restoreFromTrash,
  getTrashFiles,
  permanentlyDeleteFile,
  emptyTrash,
  toggleStar,
  getStarredFiles,
  getRecentFiles,
  searchFiles,
  getSharedWithMe,
  downloadFile,
} from "../controllers/fileController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* -----------------------------------------------------------
   MULTER SETUP (TEMP STORAGE)
------------------------------------------------------------*/
const storage = multer.diskStorage({});
const upload = multer({ storage });

/* -----------------------------------------------------------
   ROUTES
------------------------------------------------------------*/


router.get("/", verifyToken, getFilesInFolder); // <-- handles ?folder=

// Upload file
router.post("/upload", verifyToken, upload.single("file"), uploadFile);

// Rename
router.put("/:id/rename", verifyToken, renameFile);

// Move file
router.put("/:id/move", verifyToken, moveFile);

// Delete file
router.delete("/:id", verifyToken, deleteFile);

// Share with user
router.post("/:id/share", verifyToken, shareFile);

// Generate public link
router.post("/:id/public", verifyToken, generatePublicLink);

// Get public file (NO AUTH REQUIRED)
router.get("/public/:id", getPublicFile);

// Download public file (NO AUTH REQUIRED)
router.get("/public/:id/download", downloadPublicFile);

// Get single file (owner/share/public)
router.get("/:id", verifyToken, getFile);

// Download file
router.get("/:id/download", verifyToken, downloadFile);

// Storage usage progress bar
router.get("/usage/me", verifyToken, getStorageUsage);

// Trash system
router.put("/:id/trash", verifyToken, moveToTrash);
router.put("/:id/restore", verifyToken, restoreFromTrash);
router.delete("/:id/permanent", verifyToken, permanentlyDeleteFile);
router.get("/trash/all", verifyToken, getTrashFiles);
router.delete("/trash/empty", verifyToken, emptyTrash);

// Starred/favorites
router.put("/:id/star", verifyToken, toggleStar);
router.get("/starred/all", verifyToken, getStarredFiles);

// Recent files
router.get("/recent/all", verifyToken, getRecentFiles);

// Search
router.get("/search/query", verifyToken, searchFiles);

// Shared with me
router.get("/shared/me", verifyToken, getSharedWithMe);

export default router;

