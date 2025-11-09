const Rider = require('../models/rider');
const jwt = require('jsonwebtoken');

// Create a new rider (after registration)
const createRider = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.warn('[RiderController] Missing Authorization header');
      return res.status(401).json({ success: false, message: 'Missing Authorization header' });
    }

    // Accept either "Bearer <token>" or raw token
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;

    let payload;
    try {
      payload = jwt.verify(token, 'rujal ladhe');
    } catch (err) {
      console.error('[RiderController] Invalid token:', err.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Map common token claim names to the Rider model fields
    console.log('[RiderController] Token payload:', payload);
    const userId = payload.userId || payload.riderId || payload.id || payload.sub;
    const name = payload.name || payload.username || payload.fullName || payload.displayName;
    const latitude = payload.lat;
    const longitude = payload.lng;

    console.log('[RiderController] Creating rider:', userId, name);

    if (!userId || !name) {
      console.warn('[RiderController] Missing userId or name in token payload', { userId, name });
      return res
        .status(400)
        .json({ success: false, message: 'Token payload must contain userId and name' });
    }

    // Rider schema stores `userId` (linked to identity service)
    let rider = await Rider.findOne({ userId });
    if (rider) {
      console.warn('[RiderController] Rider already exists:', userId);
      return res.status(400).json({ success: false, message: 'Rider already exists' });
    }

    rider = new Rider({ userId, name, latitude, longitude, available: true });
    await rider.save();
    console.log('[RiderController] Rider saved successfully:', rider._id);

    res.status(201).json({ success: true, rider });
  } catch (error) {
    console.error('[RiderController] Error creating rider:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all available riders
const getRiders = async (req, res) => {
  try {
    const riders = await Rider.find({ available: true });
    console.log('[RiderController] Fetched available riders:', riders.length);
    res.json({ success: true, riders });
  } catch (error) {
    console.error('[RiderController] Error fetching riders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createRider, getRiders };
