
const CropMonitoring = require("../models/CropMonitoring");
const Farm = require("../models/Farm");
const User = require("../models/User");

const verifyFarmer = async (req, res) => {
  const user = await User.findById(req.auth.userId).select("role");

  if (!user || user.role !== "farmer") {
    res.status(403).json({
      success: false,
      message: "Only farmers can manage crop monitoring records.",
    });
    return false;
  }

  return true;
};

const allowedStages = [
  "Planted",
  "Germination",
  "Vegetative",
  "Flowering",
  "Harvesting",
];

const allowedHealthStatuses = [
  "Healthy",
  "Needs Attention",
  "Critical",
];

const allowedSoilFields = [
  "ph",
  "moisture",
  "nitrogen",
  "phosphorus",
  "potassium",
];

const validatePayload = (body, isUpdate = false) => {
  if (!isUpdate && (!body.cropName || !body.plantingDate || !body.farm)) {
    return "Farm, crop name, and planting date are required.";
  }

  if (
    body.cropName !== undefined &&
    (typeof body.cropName !== "string" || !body.cropName.trim())
  ) {
    return "Crop name cannot be empty.";
  }

  if (
    body.plantingDate !== undefined &&
    (
      Number.isNaN(Date.parse(body.plantingDate)) ||
      new Date(body.plantingDate) > new Date()
    )
  ) {
    return "Planting date must be a valid date that is not in the future.";
  }

  if (
    body.growthStage !== undefined &&
    !allowedStages.includes(body.growthStage)
  ) {
    return "Invalid growth stage.";
  }

  if (
    body.healthStatus !== undefined &&
    !allowedHealthStatuses.includes(body.healthStatus)
  ) {
    return "Invalid health status.";
  }

  if (
    body.notes !== undefined &&
    (typeof body.notes !== "string" || body.notes.length > 1000)
  ) {
    return "Notes must be text with at most 1000 characters.";
  }

  if (body.soilHealth !== undefined) {
    if (
      !body.soilHealth ||
      typeof body.soilHealth !== "object" ||
      Array.isArray(body.soilHealth)
    ) {
      return "Soil health must be an object.";
    }

    for (const key of Object.keys(body.soilHealth)) {
      if (!allowedSoilFields.includes(key)) {
        return `Unknown soil health field: ${key}.`;
      }

      const value = body.soilHealth[key];

      if (
        value !== null &&
        (
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          value < 0 ||
          (key === "ph" && value > 14) ||
          (key === "moisture" && value > 100)
        )
      ) {
        return `Invalid value for soil ${key}.`;
      }
    }
  }

  return null;
};

// Create a snapshot of the crop's current monitoring state.
const createHistoryEntry = (record, changedFields, farmerId) => ({
  healthStatus: record.healthStatus,
  growthStage: record.growthStage,
  notes: record.notes,
  soilHealth: {
    ph: record.soilHealth?.ph ?? null,
    moisture: record.soilHealth?.moisture ?? null,
    nitrogen: record.soilHealth?.nitrogen ?? null,
    phosphorus: record.soilHealth?.phosphorus ?? null,
    potassium: record.soilHealth?.potassium ?? null,
  },
  changedFields,
  changedAt: new Date(),
  changedBy: farmerId,
});

const getRecords = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    const records = await CropMonitoring.find({
      farmer: req.auth.userId,
    })
      .populate("farm", "farmName location")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: records });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not retrieve crop monitoring records.",
    });
  }
};

const getRecordById = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    const record = await CropMonitoring.findOne({
      _id: req.params.id,
      farmer: req.auth.userId,
    }).populate("farm", "farmName location");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Crop monitoring record not found.",
      });
    }

    return res.json({ success: true, data: record });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid record ID or request.",
    });
  }
};

const createRecord = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    const validationError = validatePayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const farm = await Farm.findOne({
      _id: req.body.farm,
      farmer: req.auth.userId,
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: "Farm not found or you do not own this farm.",
      });
    }

    const record = new CropMonitoring({
      farm: farm._id,
      farmer: req.auth.userId,
      cropName: req.body.cropName.trim(),
      plantingDate: req.body.plantingDate,
      growthStage: req.body.growthStage || "Planted",
      healthStatus: req.body.healthStatus || "Healthy",
      soilHealth: req.body.soilHealth || {},
      notes: req.body.notes || "",
    });

    record.history.push(
      createHistoryEntry(
        record,
        ["Initial record"],
        req.auth.userId
      )
    );

    await record.save();

    return res.status(201).json({
      success: true,
      message: "Crop monitoring record created successfully.",
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Could not create crop monitoring record.",
    });
  }
};

const updateRecord = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    const validationError = validatePayload(req.body, true);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const record = await CropMonitoring.findOne({
      _id: req.params.id,
      farmer: req.auth.userId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Crop monitoring record not found.",
      });
    }

    // Determine which monitored fields will actually change.
    const changedFields = [];

    if (
      req.body.healthStatus !== undefined &&
      req.body.healthStatus !== record.healthStatus
    ) {
      changedFields.push("healthStatus");
    }

    if (
      req.body.growthStage !== undefined &&
      req.body.growthStage !== record.growthStage
    ) {
      changedFields.push("growthStage");
    }

    if (
      req.body.notes !== undefined &&
      req.body.notes !== record.notes
    ) {
      changedFields.push("notes");
    }

    if (req.body.soilHealth !== undefined) {
      for (const key of Object.keys(req.body.soilHealth)) {
        const currentValue = record.soilHealth?.[key] ?? null;
        const newValue = req.body.soilHealth[key];

        if (newValue !== currentValue) {
          changedFields.push(`soilHealth.${key}`);
        }
      }
    }

    if (req.body.farm !== undefined) {
      const farm = await Farm.findOne({
        _id: req.body.farm,
        farmer: req.auth.userId,
      });

      if (!farm) {
        return res.status(404).json({
          success: false,
          message: "Farm not found or you do not own this farm.",
        });
      }

      record.farm = farm._id;
    }

    if (req.body.cropName !== undefined) {
      record.cropName = req.body.cropName.trim();
    }

    if (req.body.plantingDate !== undefined) {
      record.plantingDate = req.body.plantingDate;
    }

    if (req.body.growthStage !== undefined) {
      record.growthStage = req.body.growthStage;
    }

    if (req.body.healthStatus !== undefined) {
      record.healthStatus = req.body.healthStatus;
    }

    if (req.body.notes !== undefined) {
      record.notes = req.body.notes;
    }

    if (req.body.soilHealth !== undefined) {
      record.soilHealth = {
        ...(record.soilHealth?.toObject?.() || {}),
        ...req.body.soilHealth,
      };
    }

    // Save a snapshot only when monitored information has changed.
    if (changedFields.length > 0) {
      record.history.push(
        createHistoryEntry(
          record,
          changedFields,
          req.auth.userId
        )
      );
    }

    await record.save();

    return res.json({
      success: true,
      message: "Crop monitoring record updated successfully.",
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Could not update crop monitoring record.",
    });
  }
};

const getRecordHistory = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    const record = await CropMonitoring.findOne({
      _id: req.params.id,
      farmer: req.auth.userId,
    }).select("cropName history");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Crop monitoring record not found.",
      });
    }

    const history = [...record.history].sort(
      (a, b) => new Date(b.changedAt) - new Date(a.changedAt)
    );

    return res.json({
      success: true,
      data: {
        cropName: record.cropName,
        history,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid record ID or request.",
    });
  }
};

const deleteRecord = async (req, res) => {
  try {
    if (!(await verifyFarmer(req, res))) return;

    const record = await CropMonitoring.findOneAndDelete({
      _id: req.params.id,
      farmer: req.auth.userId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Crop monitoring record not found.",
      });
    }

    return res.json({
      success: true,
      message: "Crop monitoring record deleted successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid record ID or request.",
    });
  }
};

module.exports = {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getRecordHistory,
};
