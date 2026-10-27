
const mongoose = require("mongoose");

const farmSchema = new mongoose.Schema(
  {
    farmName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    area: {
      type: Number,
      required: true,
      min: 0.01
    },
    areaUnit: {
      type: String,
      enum: ["acre", "hectare"],
      default: "acre"
    },
    soilType: {
      type: String,
      enum: ["Clay", "Sandy", "Silt", "Loamy", "Black", "Red", "Other"],
      default: "Other"
    },
    cropsGrown: {
      type: [String],
      default: []
    },
    irrigationType: {
      type: String,
      enum: ["Rainfed", "Canal", "Borewell", "Drip", "Sprinkler", "Other"],
      default: "Other"
    },
    notes: {
      type: String,
      default: "",
      maxlength: 1000
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farm", farmSchema);
