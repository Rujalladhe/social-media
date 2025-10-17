const Rider = require("../models/rider");

// Create a new rider (after registration)
const createRider = async (req, res) => {
  try {
    const { riderId, name } = req.body;
    console.log("[RiderController] Creating rider:", riderId, name);

    let rider = await Rider.findOne({ riderId });
    if (rider) {
      console.warn("[RiderController] Rider already exists:", riderId);
      return res.status(400).json({ success: false, message: "Rider already exists" });
    }

    rider = new Rider({ riderId, name });
    await rider.save();
    console.log("[RiderController] Rider saved successfully:", rider._id);

    res.status(201).json({ success: true, rider });
  } catch (error) {
    console.error("[RiderController] Error creating rider:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all available riders
const getRiders = async (req, res) => {
  try {
    const riders = await Rider.find({ available: true });
    console.log("[RiderController] Fetched available riders:", riders.length);
    res.json({ success: true, riders });
  } catch (error) {
    console.error("[RiderController] Error fetching riders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createRider, getRiders };
