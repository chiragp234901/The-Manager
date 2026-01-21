import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

import {
  createFolder,
  renameFolder,
  deleteFolder,
  getFolderContents,
  moveFolder,
  shareFolder,
  generateFolderPublicLink,
  getSingleFolder,
  getFolders,
  toggleFolderStar,
  getStarredFolders,
} from "../controllers/folderController.js";

const router = express.Router();

/* -----------------------------------------------------------
   CREATE FOLDER
------------------------------------------------------------*/
router.post("/", verifyToken, createFolder);

/* -----------------------------------------------------------
   RENAME FOLDER
------------------------------------------------------------*/
router.put("/:id/rename", verifyToken, renameFolder);

/* -----------------------------------------------------------
   DELETE FOLDER (recursive)
------------------------------------------------------------*/
router.delete("/:id", verifyToken, deleteFolder);

/* -----------------------------------------------------------
   GET FOLDER CONTENTS (files + subfolders)
------------------------------------------------------------*/
router.get("/:id/contents", verifyToken, getFolderContents);

// root folder contents
//router.get("/", verifyToken, getFolderContents);

/* -----------------------------------------------------------
   MOVE FOLDER
------------------------------------------------------------*/
router.put("/:id/move", verifyToken, moveFolder);

/* -----------------------------------------------------------
   SHARE FOLDER
------------------------------------------------------------*/
router.post("/:id/share", verifyToken, shareFolder);

/* -----------------------------------------------------------
   PUBLIC LINK
------------------------------------------------------------*/
router.post("/:id/public", verifyToken, generateFolderPublicLink);

/* -----------------------------------------------------------
   GET SINGLE FOLDER (owner / shared / public)
------------------------------------------------------------*/
router.get("/:id", verifyToken, getSingleFolder);

// GET folders by parent (handles ?parent=)
router.get("/", verifyToken, getFolders);

// Starred folders
router.put("/:id/star", verifyToken, toggleFolderStar);
router.get("/starred/all", verifyToken, getStarredFolders);

export default router;


