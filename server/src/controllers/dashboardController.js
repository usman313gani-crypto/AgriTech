
const Farm = require("../models/Farm");
const CropMonitoring = require("../models/CropMonitoring");

const getDashboardSummary = async (req, res) => {
  try {
    // Get the authenticated user's ID from the JWT middleware.
    const farmerId = req.auth.userId;

    const [totalFarms, totalCropRecords] = await Promise.all([
      Farm.countDocuments({ farmer: farmerId }),
      CropMonitoring.countDocuments({ farmer: farmerId }),
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        totalFarms,
        totalCropRecords,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load dashboard summary.",
    });
  }
};

module.exports = { getDashboardSummary };
