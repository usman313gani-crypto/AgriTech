
const mongoose = require("mongoose");

const User = require("../models/User");
const Farm = require("../models/Farm");
const CropMonitoring = require("../models/CropMonitoring");

// GET /api/admin/stats
// Get dashboard statistics.
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalFarms, totalCrops] = await Promise.all([
      User.countDocuments(),
      Farm.countDocuments(),
      CropMonitoring.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalFarms,
        totalCrops,
      },
    });
  } catch (error) {
    console.error("Admin dashboard statistics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load admin dashboard statistics.",
    });
  }
};

// GET /api/admin/users
// Get users with optional role filtering and search.
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    // Filter by a valid role.
    if (role && ["farmer", "buyer", "admin"].includes(role)) {
      filter.role = role;
    }

    // Search by name, email, or phone.
    if (search && search.trim()) {
      const searchTerm = search.trim().slice(0, 100);

      // Escape special regex characters.
      const escapedSearch = searchTerm.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
        { phone: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name email phone address role createdAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Admin user listing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load users.",
    });
  }
};

// PATCH /api/admin/users/:id/role
// Change a user's role while protecting existing farmer records.
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate MongoDB ID.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Only farmer and buyer roles can be assigned here.
    if (!["farmer", "buyer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be farmer or buyer.",
      });
    }

    // Prevent changing your own role.
    if (String(id) === String(req.auth.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Admin roles cannot be changed through this endpoint.
    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin roles cannot be changed here.",
      });
    }

    // Prevent a farmer's existing records from becoming inaccessible.
    if (targetUser.role === "farmer" && role === "buyer") {
      const [farmCount, cropCount] = await Promise.all([
        Farm.countDocuments({ farmer: targetUser._id }),
        CropMonitoring.countDocuments({ farmer: targetUser._id }),
      ]);

      if (farmCount > 0 || cropCount > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot change this farmer's role because farm or crop records are linked to this account.",
          relatedRecords: {
            farms: farmCount,
            crops: cropCount,
          },
        });
      }
    }

    // Save the new role.
    targetUser.role = role;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Admin role update error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not update user role.",
    });
  }
};

// DELETE /api/admin/users/:id
// Delete a user only when doing so will not orphan farmer records.
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Prevent deleting your own account.
    if (String(id) === String(req.auth.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Never allow deletion of the last administrator.
    if (targetUser.role === "admin") {
      const adminCount = await User.countDocuments({
        role: "admin",
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "The last administrator cannot be deleted.",
        });
      }
    }

    // Protect farmer records from being left without their owner.
    if (targetUser.role === "farmer") {
      const [farmCount, cropCount] = await Promise.all([
        Farm.countDocuments({ farmer: targetUser._id }),
        CropMonitoring.countDocuments({ farmer: targetUser._id }),
      ]);

      if (farmCount > 0 || cropCount > 0) {
        return res.status(409).json({
          success: false,
          message:
            "This farmer has farm or crop records. Transfer or remove those records before deleting this account.",
          relatedRecords: {
            farms: farmCount,
            crops: cropCount,
          },
        });
      }
    }

    await User.deleteOne({ _id: targetUser._id });

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully.",
      deletedUserId: String(targetUser._id),
    });
  } catch (error) {
    console.error("Admin user deletion error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not delete user account.",
    });
  }
};
