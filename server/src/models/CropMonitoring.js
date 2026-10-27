
const mongoose = require("mongoose");

const cropHistorySchema = new mongoose.Schema(
  {
    healthStatus: {
      type: String,
      enum: ["Healthy", "Needs Attention", "Critical"],
      required: true,
    },
    growthStage: {
      type: String,
      enum: [
        "Planted",
        "Germination",
        "Vegetative",
        "Flowering",
        "Harvesting",
      ],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    soilHealth: {
      ph: { type: Number, min: 0, max: 14, default: null },
      moisture: { type: Number, min: 0, max: 100, default: null },
      nitrogen: { type: Number, min: 0, default: null },
      phosphorus: { type: Number, min: 0, default: null },
      potassium: { type: Number, min: 0, default: null },
    },
    changedFields: {
      type: [String],
      default: [],
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: true }
);

const cropMonitoringSchema = new mongoose.Schema(
  {
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farm",
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    plantingDate: {
      type: Date,
      required: true,
    },
    growthStage: {
      type: String,
      enum: [
        "Planted",
        "Germination",
        "Vegetative",
        "Flowering",
        "Harvesting",
      ],
      default: "Planted",
    },
    healthStatus: {
      type: String,
      enum: ["Healthy", "Needs Attention", "Critical"],
      default: "Healthy",
    },
    soilHealth: {
      ph: { type: Number, min: 0, max: 14, default: null },
      moisture: { type: Number, min: 0, max: 100, default: null },
      nitrogen: { type: Number, min: 0, default: null },
      phosphorus: { type: Number, min: 0, default: null },
      potassium: { type: Number, min: 0, default: null },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    history: {
      type: [cropHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropMonitoring", cropMonitoringSchema);
