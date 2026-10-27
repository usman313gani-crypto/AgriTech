
const mongoose = require("mongoose");

const STANDARD_CATEGORIES = [
  "Fruits",
  "Vegetables",
  "Grains & Cereals",
  "Pulses & Legumes",
  "Spices",
  "Oilseeds",
  "Cotton & Fiber",
  "Flowers & Nursery Plants",
  "Fodder",
  "Seeds",
  "Fertilizers & Soil Products",
  "Crop Protection",
  "Equipment & Irrigation",
  "Other Agricultural Products",
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: {
        values: STANDARD_CATEGORIES,
        message: "Please select a supported agricultural category.",
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    imgUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
