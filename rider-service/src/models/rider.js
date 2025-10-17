const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true }, // link to identity service
  name: { type: String, required: true },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  available: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const Rider = mongoose.model("Rider", riderSchema);
module.exports = Rider;
