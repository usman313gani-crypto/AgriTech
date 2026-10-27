
const mongoose = require("mongoose");
const Farm = require("../models/Farm");
const User = require("../models/User");

const allowedSoilTypes = [
  "Clay", "Sandy", "Silt", "Loamy", "Black", "Red", "Other"
];

const allowedIrrigationTypes = [
  "Rainfed", "Canal", "Borewell", "Drip", "Sprinkler", "Other"
];

const allowedAreaUnits = ["acre", "hectare"];

async function verifyFarmer(req, res) {
  const user = await User.findById(req.auth.userId).select("role");

  if (!user) {
    res.status(401).json({
      success: false,
      message: "User account not found."
    });
    return false;
  }

  if (user.role !== "farmer") {
    res.status(403).json({
      success: false,
      message: "Only farmer accounts can manage farm profiles."
    });
    return false;
  }

  return true;
}

function validateFarmInput(body, creating = false) {
  const errors = [];

  if (
    (creating || body.farmName !== undefined) &&
    (typeof body.farmName !== "string" ||
      !body.farmName.trim() ||
      body.farmName.trim().length > 100)
  ) {
    errors.push("Farm name is required and must be at most 100 characters.");
  }

  if (
    (creating || body.location !== undefined) &&
    (typeof body.location !== "string" ||
      !body.location.trim() ||
      body.location.trim().length > 200)
  ) {
    errors.push("Location is required and must be at most 200 characters.");
  }

  if (creating || body.area !== undefined) {
    const area = body.area;
    if (
      area === "" ||
      area === null ||
      area === undefined ||
      !Number.isFinite(Number(area)) ||
      Number(area) < 0.01
    ) {
      errors.push("Area must be a number greater than or equal to 0.01.");
    }
  }

  if (
    body.areaUnit !== undefined &&
    !allowedAreaUnits.includes(body.areaUnit)
  ) {
    errors.push("Area unit must be acre or hectare.");
  }

  if (
    body.soilType !== undefined &&
    !allowedSoilTypes.includes(body.soilType)
  ) {
    errors.push("Invalid soil type.");
  }

  if (
    body.irrigationType !== undefined &&
    !allowedIrrigationTypes.includes(body.irrigationType)
  ) {
    errors.push("Invalid irrigation type.");
  }

  if (
    body.cropsGrown !== undefined &&
    (!Array.isArray(body.cropsGrown) ||
      !body.cropsGrown.every(
        crop => typeof crop === "string" && crop.trim().length > 0
      ))
  ) {
    errors.push("Crops grown must be a list of non-empty crop names.");
  }

  if (
    body.notes !== undefined &&
    (typeof body.notes !== "string" || body.notes.length > 1000)
  ) {
    errors.push("Notes must be text of at most 1000 characters.");
  }

  return errors;
}

const getFarms = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    const farms = await Farm.find({ farmer: req.auth.userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: farms.length,
      farms
    });
  } catch (error) {
    console.error("Get farms error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch farm profiles."
    });
  }
};

const getFarmById = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid farm ID."
      });
    }

    const farm = await Farm.findOne({
      _id: req.params.id,
      farmer: req.auth.userId
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: "Farm profile not found."
      });
    }

    return res.status(200).json({ success: true, farm });
  } catch (error) {
    console.error("Get farm error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch farm profile."
    });
  }
};

const createFarm = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    const errors = validateFarmInput(req.body, true);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors.join(" ")
      });
    }

    const {
      farmName,
      location,
      area,
      areaUnit,
      soilType,
      cropsGrown,
      irrigationType,
      notes
    } = req.body;

    const farm = await Farm.create({
      farmName: farmName.trim(),
      location: location.trim(),
      area: Number(area),
      areaUnit,
      soilType,
      cropsGrown: cropsGrown?.map(crop => crop.trim()),
      irrigationType,
      notes,
      farmer: req.auth.userId
    });

    return res.status(201).json({
      success: true,
      message: "Farm profile created successfully.",
      farm
    });
  } catch (error) {
    console.error("Create farm error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create farm profile."
    });
  }
};

const updateFarm = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid farm ID."
      });
    }

    const errors = validateFarmInput(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors.join(" ")
      });
    }

    const allowedFields = [
      "farmName",
      "location",
      "area",
      "areaUnit",
      "soilType",
      "cropsGrown",
      "irrigationType",
      "notes"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.farmName !== undefined) {
      updates.farmName = updates.farmName.trim();
    }
    if (updates.location !== undefined) {
      updates.location = updates.location.trim();
    }
    if (updates.area !== undefined) {
      updates.area = Number(updates.area);
    }
    if (updates.cropsGrown !== undefined) {
      updates.cropsGrown = updates.cropsGrown.map(crop => crop.trim());
    }

    const farm = await Farm.findOneAndUpdate(
      { _id: req.params.id, farmer: req.auth.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: "Farm profile not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Farm profile updated successfully.",
      farm
    });
  } catch (error) {
    console.error("Update farm error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update farm profile."
    });
  }
};

const deleteFarm = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid farm ID."
      });
    }

    const farm = await Farm.findOneAndDelete({
      _id: req.params.id,
      farmer: req.auth.userId
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: "Farm profile not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Farm profile deleted successfully."
    });
  } catch (error) {
    console.error("Delete farm error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not delete farm profile."
    });
  }
};

module.exports = {
  getFarms,
  getFarmById,
  createFarm,
  updateFarm,
  deleteFarm
};
