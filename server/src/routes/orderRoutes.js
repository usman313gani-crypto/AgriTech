
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createOrder,
  getMyOrders,
  getMyOrderById,
} = require("../controllers/orderController");

// All order routes require a valid login token.
router.use(authMiddleware);

router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/:id", getMyOrderById);

module.exports = router;
