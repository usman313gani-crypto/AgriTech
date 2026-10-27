
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require("../controllers/adminController");

const {
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/adminOrderController");

router.use(authMiddleware, adminMiddleware);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);

router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

router.get("/orders", getAllOrders);
router.patch("/orders/:id/status", updateOrderStatus);

module.exports = router;
