// backend/services/fileService.js
// Business logic for file operations
import File from "../models/File.js";
import Folder from "../models/Folder.js";
import { cloudinary } from "../config.js";

/**
 * Get files in a specific folder for a user
 */
export const getFilesByFolder = async (userId, folderId) => {
  let query = { owner: userId };
  
  if (!folderId || folderId === "root") {
    query.folder = null; // root folder
  } else {
    query.folder = folderId;
  }
  
  return await File.find(query);
};

/**
 * Upload a new file
 */
export const createFile = async (fileData) => {
  return await File.create(fileData);
};

/**
 * Rename a file
 */
export const updateFileName = async (fileId, userId, newName) => {
  const file = await File.findOne({ _id: fileId, owner: userId });
  
  if (!file) {
    throw new Error("File not found");
  }
  
  file.name = newName;
  await file.save();
  
  return file;
};

/**
 * Move file to another folder
 */
export const moveFileToFolder = async (fileId, userId, newFolderId) => {
  const file = await File.findOne({ _id: fileId, owner: userId });
  
  if (!file) {
    throw new Error("File not found");
  }
  
  // Check if target folder exists
  if (newFolderId) {
    const folder = await Folder.findById(newFolderId);
    if (!folder) {
      throw new Error("Target folder not found");
    }
  }
  
  file.folder = newFolderId || null;
  await file.save();
  
  return file;
};

/**
 * Delete a file
 */
export const removeFile = async (fileId, userId) => {
  const file = await File.findOne({ _id: fileId, owner: userId });
  
  if (!file) {
    throw new Error("File not found");
  }
  
  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(file.cloudinaryId, {
      resource_type: "auto",
    });
  } catch (cloudErr) {
    console.log("Cloudinary delete error:", cloudErr);
  }
  
  await file.deleteOne();
  
  return { message: "File deleted" };
};

/**
 * Calculate storage usage for a user
 */
export const calculateStorageUsage = async (userId) => {
  const files = await File.find({ owner: userId });
  const used = files.reduce((acc, f) => acc + f.size, 0);
  
  return used;
};

/**
 * Share file with another user
 */
export const shareFileWithUser = async (fileId, userId, targetUserId, permission) => {
  const file = await File.findOne({ _id: fileId, owner: userId });
  
  if (!file) {
    throw new Error("File not found");
  }
  
  // Check if already shared with this user
  const existingShare = file.sharedWith.find(
    (share) => share.user.toString() === targetUserId
  );
  
  if (existingShare) {
    // Update permission if already shared
    existingShare.permission = permission;
  } else {
    // Add new share
    file.sharedWith.push({ user: targetUserId, permission });
  }
  
  await file.save();
  
  return file;
};

/**
 * Generate public link for a file
 */
export const makeFilePublic = async (fileId, userId, clientUrl) => {
  const file = await File.findOne({ _id: fileId, owner: userId });
  
  if (!file) {
    throw new Error("File not found");
  }
  
  file.isPublic = true;
  file.publicLink = `${clientUrl}/shared/file/${file._id}`;
  
  await file.save();
  
  return file;
};

/**
 * Get file by ID with access control
 */
export const getFileById = async (fileId, userId) => {
  const file = await File.findById(fileId);
  
  if (!file) {
    throw new Error("File not found");
  }
  
  // Public file
  if (file.isPublic) {
    return file;
  }
  
  // Owner
  if (file.owner.toString() === userId.toString()) {
    return file;
  }
  
  // Shared with user
  const shared = file.sharedWith.find(
    (u) => u.user.toString() === userId.toString()
  );
  
  if (shared) {
    return file;
  }
  
  throw new Error("No access to file");
};

export default {
  getFilesByFolder,
  createFile,
  updateFileName,
  moveFileToFolder,
  removeFile,
  calculateStorageUsage,
  shareFileWithUser,
  makeFilePublic,
  getFileById,
};
