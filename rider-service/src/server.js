const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Rider = require("./models/rider");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// MongoDB connection
mongoose.connect("mongodb+srv://rujalladhe21:4i5XD37NI99oVeTx@cluster0.tp2huqb.mongodb.net/?retryWrites=true&w=majority", {})
  .then(() => console.log("[Server] MongoDB connected"))
  .catch(err => console.error("[Server] MongoDB connection error:", err));

// Server listening
server.listen(3009, () => console.log("[Server] Rider Service running on port 3009"));

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("[Socket.IO] Client connected:", socket.id);

  // Authenticate rider on connection
  socket.on("authenticate", async ({ token }) => {
    try {
      if (!token) {
        socket.emit("error", { message: "Token missing" });
        return socket.disconnect();
      }

      const decoded = jwt.verify(token, "rujal ladhe");
      // Only allow riders
      if (!decoded || decoded.role !== "rider") {
        socket.emit("error", { message: "Unauthorized" });
        return socket.disconnect();
      }

      // Save riderId on socket
      socket.riderId = decoded.userId;

      // Check if rider exists in DB, create if not
      let rider = await Rider.findOne({ userId: socket.riderId });
      if (!rider) {
        rider = await Rider.create({ userId: socket.riderId, name: decoded.username });
        console.log("[Socket.IO] New rider created:", rider._id);
      } else {
        console.log("[Socket.IO] Rider authenticated:", rider._id);
      }

      socket.emit("authenticated", { riderId: rider._id });

    } catch (err) {
      console.error("[Socket.IO] Auth error:", err.message);
      socket.emit("error", { message: "Authentication failed" });
      socket.disconnect();
    }
  });

  // Location updates
  socket.on("locationUpdate", async ({ latitude, longitude, available }) => {
    if (!socket.riderId) {
      console.warn("[Socket.IO] Location update without authentication");
      return;
    }

    try {
      const rider = await Rider.findOneAndUpdate(
        { userId: socket.riderId },
        { latitude, longitude, available, lastUpdated: new Date() },
        { new: true }
      );

      if (!rider) {
        console.warn("[Socket.IO] Rider not found for update:", socket.riderId);
        return;
      }

      console.log(`[Socket.IO] Rider ${rider._id} location updated:`, latitude, longitude);

      // Broadcast to other clients (if needed)
      io.emit("riderUpdated", rider);

    } catch (err) {
      console.error("[Socket.IO] Error updating rider location:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("[Socket.IO] Client disconnected:", socket.id);
  });
});
