
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getRecordHistory,
} = require("../controllers/cropMonitoringController");

router.use(authMiddleware);

// Get all crop monitoring records for the logged-in farmer
router.get("/", getRecords);

// Get crop monitoring history (keep this before the general ID route)
router.get("/:id/history", getRecordHistory);

// Get one crop monitoring record
router.get("/:id", getRecordById);

// Create a crop monitoring record
router.post("/", createRecord);

// Update a crop monitoring record
router.put("/:id", updateRecord);

// Delete a crop monitoring record
router.delete("/:id", deleteRecord);

module.exports = router;
