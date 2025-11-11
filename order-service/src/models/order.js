const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },

  // 🗺️ Pickup location (e.g., restaurant or shop)
  pickupLocation: {
    address: String,
    latitude: Number,
    longitude: Number,
  },

  // 📍 Drop location (user delivery address)
  deliveryLocation: {
    address: String,
    latitude: Number,
    longitude: Number,
  },

  // 📦 Order status
  status: {
    type: String,
    default: 'PENDING', // PENDING -> ASSIGNED -> PICKED_UP -> DELIVERED
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
