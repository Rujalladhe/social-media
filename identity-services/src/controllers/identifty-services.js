const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const generateToken = require("../utils/genrateToken");
const logger = require("../utils/logger");
const { validateRegistration, validatelogin } = require("../utils/validation");

// User registration
const registerUser = async (req, res) => {
  logger.info("registration point hit ");
  try {
    // Validate schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Extract role (default to "user")
    const { email, username, password, role = "user",lat ,lng } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("user already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user with role
    user = new User({ username, password, email, role ,lat,lng});
    await user.save();

    logger.info("user saved successfully", user._id);

    // Generate tokens
    const { accessToken, refreshToken } = await generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
      role: user.role, 
      lat: user.lat,
      lng: user.lng // return role for frontend convenience
    });
  } catch (e) {
    logger.error("registration error occurred ", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// User login
const loginUser = async (req, res) => {
  logger.info("login endpoint hit ");
  try {
    const { error } = validatelogin(req.body);
    if (error) {
      logger.warn("validation error", error.details[0].message);
      return res.status(404).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("invalid user");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      logger.warn("invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateToken(user);

    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
      role: user.role, 
      lat: user.lat,    
    lng: user.lng// return role for frontend convenience
    });
  } catch (e) {
    logger.error("login error occurred", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Refresh token
const handleRefreshToken = async (req, res) => {
  logger.info("refresh token endpoint hit");
  try {
    const { token } = req.body;
    if (!token) {
      logger.warn("refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const storedToken = await RefreshToken.findOne({ token });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("invalid or expired refresh token");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("user not found");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);
    await RefreshToken.deleteOne({ _id: storedToken._id });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      role: user.role,
    });
  } catch (error) {
    logger.error("refresh token error occurred ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Logout
const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    if (!storedToken) {
      logger.warn("Invalid refresh token provided");
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    logger.info("Refresh token deleted for logout");

    res.json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (e) {
    logger.error("Error while logging out", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken: handleRefreshToken,
  logoutUser,
};
