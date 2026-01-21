import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    // total storage in bytes (default: 5 GB)
    storageLimit: {
      type: Number,
      default: 5 * 1024 * 1024 * 1024,
    },

    // used storage (sum of file sizes)
    storageUsed: {
      type: Number,
      default: 0,
    },

    // to relate all user's files (optional)
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],

    // to relate all user's folders (optional)
    folders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
