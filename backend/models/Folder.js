// backend/models/Folder.js
import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    // for fast breadcrumb navigation
    path: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
      },
    ],

    // sharing system (same as files)
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        permission: { type: String, enum: ["viewer", "editor"], default: "viewer" },
      },
    ],

    isPublic: {
      type: Boolean,
      default: false,
    },

    publicLink: {
      type: String,
      default: null,
    },

    // Trash system
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // Starred/favorites
    isStarred: {
      type: Boolean,
      default: false,
    },

    starredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Folder", folderSchema);
