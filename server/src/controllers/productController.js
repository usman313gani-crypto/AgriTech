
const Product = require("../models/Product");

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

// Support older category names so existing products remain manageable.
const CATEGORY_ALIASES = {
  fertilizer: "Fertilizers & Soil Products",
  fertilizers: "Fertilizers & Soil Products",
  pesticide: "Crop Protection",
  pesticides: "Crop Protection",
  equipment: "Equipment & Irrigation",
};

function normalizeCategory(category) {
  return String(category ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function resolveCategory(category) {
  const normalized = normalizeCategory(category);

  if (!normalized) return null;

  const alias = CATEGORY_ALIASES[normalized];

  if (alias) return alias;

  return (
    STANDARD_CATEGORIES.find(
      (item) => normalizeCategory(item) === normalized
    ) || null
  );
}

// GET /api/products
// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// GET /api/products/:id
// Get a single product
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// POST /api/products
// Create a product
const createProduct = async (req, res) => {
  try {
    const { name, category, price, description, imgUrl } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid name, category, and non-negative price are required.",
      });
    }

    const standardCategory = resolveCategory(category);

    if (!standardCategory) {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported category. Please select a category from the AgriTech marketplace.",
        allowedCategories: STANDARD_CATEGORIES,
      });
    }

    const product = await Product.create({
      name: name.trim(),
      category: standardCategory,
      price: Number(price),
      description:
        typeof description === "string" ? description.trim() : "",
      imgUrl: typeof imgUrl === "string" ? imgUrl.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Product validation failed.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// PUT /api/products/:id
// Update a product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const allowedFields = [
      "name",
      "category",
      "price",
      "description",
      "imgUrl",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "name") &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Product name cannot be empty",
      });
    }

    if (Object.prototype.hasOwnProperty.call(updates, "category")) {
      if (
        typeof updates.category !== "string" ||
        !updates.category.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Product category cannot be empty",
        });
      }

      const standardCategory = resolveCategory(updates.category);

      if (!standardCategory) {
        return res.status(400).json({
          success: false,
          message:
            "Unsupported category. Please select a category from the AgriTech marketplace.",
          allowedCategories: STANDARD_CATEGORIES,
        });
      }

      updates.category = standardCategory;
    }

    if (Object.prototype.hasOwnProperty.call(updates, "price")) {
      if (
        updates.price === "" ||
        updates.price === null ||
        !Number.isFinite(Number(updates.price)) ||
        Number(updates.price) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Price must be a non-negative number",
        });
      }

      updates.price = Number(updates.price);
    }

    for (const field of ["name", "description", "imgUrl"]) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        if (typeof updates[field] !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be a string`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Product validation failed.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// DELETE /api/products/:id
// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
