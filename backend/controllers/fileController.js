// backend/controllers/fileController.js
import File from "../models/File.js";
import Folder from "../models/Folder.js";
import User from "../models/User.js";
import { cloudinary } from "../config.js";



/* -----------------------------------------------------------
   GET FILES IN FOLDER
------------------------------------------------------------*/
export const getFilesInFolder = async (req, res) => {
  try {
    const folderId = req.query.folder;

    let query = { owner: req.user._id, isDeleted: false };

    if (!folderId || folderId === "root") {
      query.folder = null; // root folder
    } else {
      query.folder = folderId;
    }

    const files = await File.find(query);

    res.status(200).json({ files });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch files", error: err.message });
  }
};




/* -----------------------------------------------------------
   UPLOAD FILE
------------------------------------------------------------*/
export const uploadFile = async (req, res) => {
  try {
    const { folderId } = req.body;

    if (!req.file)
      return res.status(400).json({ message: "No file received" });

    const uploaded = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
      folder: "drive_clone",
    });

    const extension = req.file.originalname.split(".").pop().toLowerCase();

    let type = "other";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) type = "image";
    if (["mp4", "mov", "avi", "mkv"].includes(extension)) type = "video";
    if (["pdf"].includes(extension)) type = "pdf";

    const file = await File.create({
      name: req.file.originalname,
      url: uploaded.secure_url,
      cloudinaryId: uploaded.public_id,
      size: req.file.size,
      type,
      extension,
      owner: req.user._id,
      folder: folderId || null,
    });

    return res.status(201).json(file);
  } catch (err) {
    return res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   RENAME FILE
------------------------------------------------------------*/
export const renameFile = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate filename
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "File name cannot be empty" });
    }

    if (name.length > 255) {
      return res.status(400).json({ message: "File name too long (max 255 characters)" });
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(name)) {
      return res.status(400).json({ message: "File name contains invalid characters" });
    }

    // Find file where user is owner OR has editor permission
    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 
          sharedWith: { 
            $elemMatch: { 
              user: req.user._id, 
              permission: "editor" 
            } 
          } 
        }
      ]
    });

    if (!file) return res.status(404).json({ message: "File not found or you don't have permission to rename it" });

    file.name = name.trim();
    await file.save();

    res.json(file);
  } catch (err) {
    res.status(500).json({ message: "Rename failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   MOVE FILE
------------------------------------------------------------*/
export const moveFile = async (req, res) => {
  try {
    const { newFolderId } = req.body;

    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!file) return res.status(404).json({ message: "File not found" });

    // Check if folder exists and belongs to user
    if (newFolderId) {
      const folder = await Folder.findOne({
        _id: newFolderId,
        owner: req.user._id
      });
      if (!folder) return res.status(404).json({ message: "Target folder not found or access denied" });
    }

    file.folder = newFolderId || null;
    await file.save();

    res.json(file);
  } catch (err) {
    res.status(500).json({ message: "Move failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   DELETE FILE
------------------------------------------------------------*/
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!file) return res.status(404).json({ message: "File not found" });

    // Soft delete - move to trash
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.json({ message: "File moved to trash" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   GET STORAGE USAGE
------------------------------------------------------------*/
export const getStorageUsage = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id });

    const used = files.reduce((acc, f) => acc + f.size, 0);

    const limit = process.env.STORAGE_LIMIT || 5 * 1024 * 1024 * 1024;

    res.json({ used, limit });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch usage", error: err.message });
  }
};

/* -----------------------------------------------------------
   GENERATE PUBLIC SHARE LINK
------------------------------------------------------------*/
export const generatePublicLink = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!file) return res.status(404).json({ message: "File not found" });

    file.isPublic = true;
    file.publicLink = `${process.env.CLIENT_URL}/shared/file/${file._id}`;

    await file.save();

    res.json({ file });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate link", error: err.message });
  }
};

/* -----------------------------------------------------------
   GET PUBLIC FILE (NO AUTH REQUIRED)
------------------------------------------------------------*/
export const getPublicFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      isPublic: true,
      isDeleted: false,
    }).populate('owner', 'name email');

    if (!file) {
      return res.status(404).json({ message: "File not found or not public" });
    }

    res.json({ file });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch file", error: err.message });
  }
};

/* -----------------------------------------------------------
   DOWNLOAD PUBLIC FILE
------------------------------------------------------------*/
export const downloadPublicFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      isPublic: true,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found or not public" });
    }

    // Return URL and filename for client to download
    res.json({
      url: file.url,
      filename: file.name,
      type: file.type
    });
  } catch (err) {
    res.status(500).json({ message: "Download failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   SHARE FILE WITH USER
------------------------------------------------------------*/
export const shareFile = async (req, res) => {
  try {
    const { userId, userEmail, permission } = req.body;

    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!file) return res.status(404).json({ message: "File not found" });

    let targetUserId = userId;

    // If email provided, find user by email
    if (userEmail && !userId) {
      const User = (await import("../models/User.js")).default;
      const targetUser = await User.findOne({ email: userEmail });
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found with that email" });
      }
      
      targetUserId = targetUser._id;
    }

    if (!targetUserId) {
      return res.status(400).json({ message: "User ID or email required" });
    }

    // Check if already shared
    const existingShare = file.sharedWith.find(
      (share) => share.user.toString() === targetUserId.toString()
    );

    if (existingShare) {
      return res.status(400).json({ message: "File already shared with this user" });
    }

    file.sharedWith.push({ user: targetUserId, permission });

    await file.save();

    res.json({ message: "File shared", file });
  } catch (err) {
    res.status(500).json({ message: "Sharing failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   GET SINGLE FILE (VIEW / DOWNLOAD)
   - Owner can always access
   - Shared users can access
   - Public links allowed
------------------------------------------------------------*/
export const getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) return res.status(404).json({ message: "File not found" });

    // Public file
    if (file.isPublic) return res.json(file);

    // Owner
    if (file.owner.toString() === req.user._id.toString())
      return res.json(file);

    // Shared with user
    const shared = file.sharedWith.find(
      (u) => u.user.toString() === req.user._id.toString()
    );

    if (shared) return res.json(file);

    return res.status(403).json({ message: "No access to file" });
  } catch (err) {
    res.status(500).json({ message: "Error loading file", error: err.message });
  }
};

/* -----------------------------------------------------------
   TRASH SYSTEM
------------------------------------------------------------*/
export const moveToTrash = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!file) return res.status(404).json({ message: "File not found" });

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.json({ message: "File moved to trash", file });
  } catch (err) {
    res.status(500).json({ message: "Failed to move to trash", error: err.message });
  }
};

export const restoreFromTrash = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: true,
    });

    if (!file) return res.status(404).json({ message: "File not found in trash" });

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.json({ message: "File restored", file });
  } catch (err) {
    res.status(500).json({ message: "Failed to restore file", error: err.message });
  }
};

export const getTrashFiles = async (req, res) => {
  try {
    const files = await File.find({
      owner: req.user._id,
      isDeleted: true,
    }).sort({ deletedAt: -1 });

    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trash", error: err.message });
  }
};

export const permanentlyDeleteFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: true,
    });

    if (!file) return res.status(404).json({ message: "File not found in trash" });

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(file.cloudinaryId, {
        resource_type: "auto",
      });
    } catch (cloudErr) {
      console.log("Cloudinary delete error:", cloudErr);
    }

    await file.deleteOne();

    res.json({ message: "File permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete permanently", error: err.message });
  }
};

export const emptyTrash = async (req, res) => {
  try {
    const files = await File.find({
      owner: req.user._id,
      isDeleted: true,
    });

    // Delete all from Cloudinary
    for (const file of files) {
      try {
        await cloudinary.uploader.destroy(file.cloudinaryId, {
          resource_type: "auto",
        });
      } catch (cloudErr) {
        console.log("Cloudinary delete error:", cloudErr);
      }
    }

    await File.deleteMany({
      owner: req.user._id,
      isDeleted: true,
    });

    res.json({ message: "Trash emptied", count: files.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to empty trash", error: err.message });
  }
};

/* -----------------------------------------------------------
   STARRED/FAVORITES
------------------------------------------------------------*/
export const toggleStar = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!file) return res.status(404).json({ message: "File not found" });

    file.isStarred = !file.isStarred;
    file.starredAt = file.isStarred ? new Date() : null;
    await file.save();

    res.json({ 
      message: file.isStarred ? "File starred" : "File unstarred", 
      file 
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle star", error: err.message });
  }
};

export const getStarredFiles = async (req, res) => {
  try {
    const files = await File.find({
      owner: req.user._id,
      isStarred: true,
      isDeleted: false,
    }).sort({ starredAt: -1 });

    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch starred files", error: err.message });
  }
};

/* -----------------------------------------------------------
   RECENT FILES
------------------------------------------------------------*/
export const getRecentFiles = async (req, res) => {
  try {
    const files = await File.find({
      owner: req.user._id,
      isDeleted: false,
    })
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recent files", error: err.message });
  }
};

/* -----------------------------------------------------------
   SEARCH
------------------------------------------------------------*/
export const searchFiles = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query required" });
    }

    const files = await File.find({
      owner: req.user._id,
      isDeleted: false,
      name: { $regex: q, $options: "i" },
    }).sort({ updatedAt: -1 });

    res.json({ files, query: q });
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   SHARED WITH ME
------------------------------------------------------------*/
export const getSharedWithMe = async (req, res) => {
  try {
    const files = await File.find({
      "sharedWith.user": req.user._id,
      isDeleted: false,
    })
      .populate("owner", "name email")
      .sort({ updatedAt: -1 });

    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch shared files", error: err.message });
  }
};

/* -----------------------------------------------------------
   DOWNLOAD FILE
------------------------------------------------------------*/
export const downloadFile = async (req, res) => {
  try {
    // Find file that is either owned by user OR shared with user
    const file = await File.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [
        { owner: req.user._id },
        { "sharedWith.user": req.user._id }
      ]
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Return the download URL and filename
    // Frontend will download directly from Cloudinary
    res.json({ 
      url: file.url,
      filename: file.name,
      type: file.type
    });
  } catch (err) {
    res.status(500).json({ message: "Download failed", error: err.message });
  }
};
