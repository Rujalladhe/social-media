const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const Rider = require("./models/rider");
const rideRoute = require("./routes/ride-route");
const { connectProducer, sendRiderLocation } = require("./kafka/riderProducer");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// Middleware
app.use(express.json());

// Routes
app.use('/riders', rideRoute);

// MongoDB
mongoose
  .connect("mongodb+srv://rujalladhe21:4i5XD37NI99oVeTx@cluster0.tp2huqb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("[MongoDB] Connected"))

  .catch((err) => console.error("[MongoDB] Connection error:", err));

// Kafka Producer
connectProducer();

// Express Test Endpoint
app.get("/", (req, res) => res.send("Rider Service Running"));
io.on("connection", (socket) => {
  console.log("[Socket.IO] Rider connected:", socket.id);

  // Instead of registering a new rider, accept riderId from client
  socket.on("registerRider", async (data) => {
    const { riderId } = data; // client sends existing riderId
    try {
      const rider = await Rider.findById(riderId);
      if (!rider) {
        console.warn("[Socket.IO] Rider not found:", riderId);
        socket.emit("error", { message: "Rider not found" });
        return;
      }

      socket.riderId = rider._id; // save riderId for future updates
      console.log("[Socket.IO] Rider connected with ID:", rider._id);
      socket.emit("riderRegistered", { riderId: rider._id });
    } catch (err) {
      console.error("[Socket.IO] Error finding rider:", err);
      socket.emit("error", { message: "Registration failed" });
    }
  });

  // Location Updates
  socket.on("locationUpdate", async (data) => {
    if (!socket.riderId) {
      console.warn("[Socket.IO] Rider not registered yet");
      return;
    }

    const { latitude, longitude, available } = data;

    try {
      const rider = await Rider.findByIdAndUpdate(
        socket.riderId,
        { latitude, longitude, available },
        { new: true }
      );

      if (!rider) {
        console.warn("[MongoDB] Rider not found for update:", socket.riderId);
        return;
      }

      console.log("[MongoDB] Rider location updated:", rider._id, latitude, longitude);

      // Send to Kafka
      await sendRiderLocation({ riderId: rider._id, latitude, longitude, available });

      // Broadcast to all clients
      io.emit("riderUpdated", rider);
    } catch (err) {
      console.error("[Socket.IO] Error updating location:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("[Socket.IO] Rider disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3010;
server.listen(PORT, () => {
  console.log(`[Server] Rider service listening on port ${PORT}`);
});
