
const User = require("../models/User");

module.exports = async function adminMiddleware(req, res, next) {
  try {
    const user = await User.findById(req.auth.userId).select("role");

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges are required.",
      });
    }

    req.admin = user;
    next();
  } catch (error) {
    console.error("Admin authorization error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not verify admin permissions.",
    });
  }
};
