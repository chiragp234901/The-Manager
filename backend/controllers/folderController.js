// backend/controllers/folderController.js
import Folder from "../models/Folder.js";
import File from "../models/File.js";

/* -----------------------------------------------------------
   CREATE FOLDER
------------------------------------------------------------*/
export const createFolder = async (req, res) => {
  try {
    const { name, parent } = req.body;

    let path = [];

    if (parent) {
      const parentFolder = await Folder.findOne({
        _id: parent,
        owner: req.user._id
      });
      if (!parentFolder)
        return res.status(404).json({ message: "Parent folder not found or access denied" });

      path = [...parentFolder.path, parent];
    }

    const folder = await Folder.create({
      name,
      parent: parent || null,
      owner: req.user._id,
      path,
    });

    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ message: "Folder creation failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   RENAME FOLDER
------------------------------------------------------------*/
export const renameFolder = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate folder name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Folder name cannot be empty" });
    }

    if (name.length > 255) {
      return res.status(400).json({ message: "Folder name too long (max 255 characters)" });
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(name)) {
      return res.status(400).json({ message: "Folder name contains invalid characters" });
    }

    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!folder) return res.status(404).json({ message: "Folder not found" });

    folder.name = name.trim();
    await folder.save();

    res.json(folder);
  } catch (err) {
    res.status(500).json({ message: "Folder rename failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   DELETE FOLDER (RECURSIVE)
------------------------------------------------------------*/
export const deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.id;

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user._id,
    });

    if (!folder) return res.status(404).json({ message: "Folder not found" });

    // delete all nested folders
    await Folder.deleteMany({ path: folderId });

    // delete this folder
    await Folder.deleteOne({ _id: folderId });

    await File.deleteMany({ folder: folderId });

    res.json({ message: "Folder and all contents deleted" });
  } catch (err) {
    res.status(500).json({ message: "Folder deletion failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   GET FOLDER CONTENTS (FILES + SUBFOLDERS)
------------------------------------------------------------*/
export const getFolderContents = async (req, res) => {
  try {
    const folderId = req.params.id || null;

    const folders = await Folder.find({
      parent: folderId,
      owner: req.user._id,
    });

    const files = await File.find({
      folder: folderId,
      owner: req.user._id,
    });

    res.json({ folders, files });
  } catch (err) {
    res.status(500).json({ message: "Failed to load contents", error: err.message });
  }
};

/* -----------------------------------------------------------
   MOVE FOLDER
------------------------------------------------------------*/
export const moveFolder = async (req, res) => {
  try {
    const { newParent } = req.body;

    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!folder) return res.status(404).json({ message: "Folder not found" });

    let path = [];

    if (newParent) {
      const parentFolder = await Folder.findOne({
        _id: newParent,
        owner: req.user._id
      });
      if (!parentFolder)
        return res.status(404).json({ message: "New parent folder not found or access denied" });

      path = [...parentFolder.path, newParent];
    }

    folder.parent = newParent || null;
    folder.path = path;

    await folder.save();

    res.json(folder);
  } catch (err) {
    res.status(500).json({ message: "Folder move failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   SHARE FOLDER
------------------------------------------------------------*/
export const shareFolder = async (req, res) => {
  try {
    const { userId, permission } = req.body;

    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!folder) return res.status(404).json({ message: "Folder not found" });

    folder.sharedWith.push({ user: userId, permission });
    await folder.save();

    res.json({ message: "Folder shared successfully", folder });
  } catch (err) {
    res.status(500).json({ message: "Sharing failed", error: err.message });
  }
};

/* -----------------------------------------------------------
   PUBLIC LINK
------------------------------------------------------------*/
export const generateFolderPublicLink = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!folder) return res.status(404).json({ message: "Folder not found" });

    folder.isPublic = true;
    folder.publicLink = `${process.env.CLIENT_URL}/shared/folder/${folder._id}`;

    await folder.save();

    res.json(folder);
  } catch (err) {
    res.status(500).json({ message: "Failed to generate public link", error: err.message });
  }
};

/* -----------------------------------------------------------
   GET SINGLE FOLDER (OWNER / SHARED / PUBLIC)
------------------------------------------------------------*/
export const getSingleFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) return res.status(404).json({ message: "Folder not found" });

    // public folder
    if (folder.isPublic) return res.json(folder);

    // owner
    if (folder.owner.toString() === req.user._id.toString()) return res.json(folder);

    // shared user
    const shared = folder.sharedWith.find(
      (u) => u.user.toString() === req.user._id.toString()
    );

    if (shared) return res.json(folder);

    return res.status(403).json({ message: "Access denied" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching folder", error: err.message });
  }
};

/* -----------------------------------------------------------
   GET FOLDERS BY PARENT
------------------------------------------------------------*/
export const getFolders = async (req, res) => {
  try {
    const parentId = req.query.parent;

    let query = { owner: req.user._id, isDeleted: false };

    if (!parentId || parentId === "root" || parentId === "null") {
      query.parent = null; // root folders
    } else {
      query.parent = parentId;
    }

    const folders = await Folder.find(query);

    res.status(200).json({ folders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch folders", error: err.message });
  }
};

/* -----------------------------------------------------------
   TRASH AND STARRED FOR FOLDERS
------------------------------------------------------------*/
export const toggleFolderStar = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!folder) return res.status(404).json({ message: "Folder not found" });

    folder.isStarred = !folder.isStarred;
    folder.starredAt = folder.isStarred ? new Date() : null;
    await folder.save();

    res.json({ 
      message: folder.isStarred ? "Folder starred" : "Folder unstarred", 
      folder 
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle star", error: err.message });
  }
};

export const getStarredFolders = async (req, res) => {
  try {
    const folders = await Folder.find({
      owner: req.user._id,
      isStarred: true,
      isDeleted: false,
    }).sort({ starredAt: -1 });

    res.json({ folders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch starred folders", error: err.message });
  }
};

