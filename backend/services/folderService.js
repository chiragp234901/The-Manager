// backend/services/folderService.js
// Business logic for folder operations
import Folder from "../models/Folder.js";
import File from "../models/File.js";

/**
 * Create a new folder
 */
export const createNewFolder = async (name, parentId, userId) => {
  let path = [];
  
  if (parentId && parentId !== "root") {
    const parentFolder = await Folder.findById(parentId);
    if (!parentFolder) {
      throw new Error("Parent folder not found");
    }
    path = [...parentFolder.path, parentId];
  }
  
  const folder = await Folder.create({
    name,
    parent: parentId && parentId !== "root" ? parentId : null,
    owner: userId,
    path,
  });
  
  return folder;
};

/**
 * Get folders by parent ID for a user
 */
export const getFoldersByParent = async (userId, parentId) => {
  let query = { owner: userId };
  
  if (!parentId || parentId === "root" || parentId === "null") {
    query.parent = null; // root folders
  } else {
    query.parent = parentId;
  }
  
  return await Folder.find(query);
};

/**
 * Rename a folder
 */
export const updateFolderName = async (folderId, userId, newName) => {
  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  
  if (!folder) {
    throw new Error("Folder not found");
  }
  
  folder.name = newName;
  await folder.save();
  
  return folder;
};

/**
 * Move folder to a new parent
 */
export const moveFolderToParent = async (folderId, userId, newParentId) => {
  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  
  if (!folder) {
    throw new Error("Folder not found");
  }
  
  let path = [];
  
  if (newParentId && newParentId !== "root") {
    const parentFolder = await Folder.findById(newParentId);
    if (!parentFolder) {
      throw new Error("New parent folder not found");
    }
    path = [...parentFolder.path, newParentId];
  }
  
  folder.parent = newParentId && newParentId !== "root" ? newParentId : null;
  folder.path = path;
  
  await folder.save();
  
  return folder;
};

/**
 * Delete folder and all its contents recursively
 */
export const removeFolder = async (folderId, userId) => {
  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  
  if (!folder) {
    throw new Error("Folder not found");
  }
  
  // Helper function to recursively get all subfolder IDs
  const getAllSubfolderIds = async (parentId) => {
    const subfolders = await Folder.find({ parent: parentId, owner: userId });
    let allIds = subfolders.map(f => f._id.toString());
    
    // Recursively get subfolders of each subfolder
    for (const subfolder of subfolders) {
      const childIds = await getAllSubfolderIds(subfolder._id);
      allIds = allIds.concat(childIds);
    }
    
    return allIds;
  };
  
  // Get all nested folder IDs
  const nestedFolderIds = await getAllSubfolderIds(folderId);
  const allFolderIds = [folderId, ...nestedFolderIds];
  
  // Delete all nested folders
  await Folder.deleteMany({ 
    _id: { $in: allFolderIds },
    owner: userId 
  });
  
  // Delete all files in all these folders
  await File.deleteMany({ 
    folder: { $in: allFolderIds },
    owner: userId 
  });
  
  return { message: "Folder and all contents deleted" };
};

/**
 * Get folder contents (subfolders and files)
 */
export const getFolderContents = async (folderId, userId) => {
  const folders = await Folder.find({
    parent: folderId || null,
    owner: userId,
  });
  
  const files = await File.find({
    folder: folderId || null,
    owner: userId,
  });
  
  return { folders, files };
};

/**
 * Share folder with another user
 */
export const shareFolderWithUser = async (folderId, userId, targetUserId, permission) => {
  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  
  if (!folder) {
    throw new Error("Folder not found");
  }
  
  // Check if already shared with this user
  const existingShare = folder.sharedWith.find(
    (share) => share.user.toString() === targetUserId
  );
  
  if (existingShare) {
    // Update permission if already shared
    existingShare.permission = permission;
  } else {
    // Add new share
    folder.sharedWith.push({ user: targetUserId, permission });
  }
  
  await folder.save();
  
  return folder;
};

/**
 * Generate public link for a folder
 */
export const makeFolderPublic = async (folderId, userId, clientUrl) => {
  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  
  if (!folder) {
    throw new Error("Folder not found");
  }
  
  folder.isPublic = true;
  folder.publicLink = `${clientUrl}/shared/folder/${folder._id}`;
  
  await folder.save();
  
  return folder;
};

/**
 * Get folder by ID with access control
 */
export const getFolderById = async (folderId, userId) => {
  const folder = await Folder.findById(folderId);
  
  if (!folder) {
    throw new Error("Folder not found");
  }
  
  // Public folder
  if (folder.isPublic) {
    return folder;
  }
  
  // Owner
  if (folder.owner.toString() === userId.toString()) {
    return folder;
  }
  
  // Shared with user
  const shared = folder.sharedWith.find(
    (u) => u.user.toString() === userId.toString()
  );
  
  if (shared) {
    return folder;
  }
  
  throw new Error("Access denied");
};

export default {
  createNewFolder,
  getFoldersByParent,
  updateFolderName,
  moveFolderToParent,
  removeFolder,
  getFolderContents,
  shareFolderWithUser,
  makeFolderPublic,
  getFolderById,
};
