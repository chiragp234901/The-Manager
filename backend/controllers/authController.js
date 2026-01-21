import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/* ------------------------- Helper: Create JWT Token ------------------------ */
const createAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const createRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

/* ------------------------------- Register User ------------------------------ */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required." });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    
        res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        //sameSite: "lax",
        sameSite: "none",
        //secure: false,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
        message: "Registration successful",
        accessToken,
        user: { id: user._id, name: user.name, email: user.email },
        });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* --------------------------------- Login ---------------------------------- */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(400).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });

    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        //sameSite: "lax",
        sameSite: "none",
        //secure: false,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
        message: "Login successful",
        accessToken,
        user: { id: user._id, name: user.name, email: user.email },
        });

        } catch (err) {
            console.error("LOGIN ERROR:", err);
            res.status(500).json({ message: "Server error" });
        }
        };


/* ----------------------------- Refresh Token ------------------------------- */
export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token)
      return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = createAccessToken(decoded.id);

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

/* --------------------------------- Logout --------------------------------- */
export const logoutUser = (req, res) => {
  // Clear the refresh token cookie
  res
    .clearCookie("refreshToken", {
      httpOnly: true,
      //sameSite: "lax",
        sameSite: "none",
        //secure: false,
        secure: true,
    })
    .status(200)
    .json({ message: "Logged out successfully" });
};

/* ----------------------------- Get Current User ---------------------------- */
export const getMe = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    res.status(200).json(req.user);
  } catch (err) {
    console.error("GET ME ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
