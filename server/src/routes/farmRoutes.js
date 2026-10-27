
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getFarms,
  getFarmById,
  createFarm,
  updateFarm,
  deleteFarm
} = require("../controllers/farmController");

const router = express.Router();

// Every farm endpoint requires a valid JWT.
router.use(authMiddleware);

router.get("/", getFarms);
router.get("/:id", getFarmById);
router.post("/", createFarm);
router.put("/:id", updateFarm);
router.delete("/:id", deleteFarm);

module.exports = router;
