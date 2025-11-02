// consumer.js
const { Kafka } = require("kafkajs");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const Rider = require("../models/rider"); // Your Rider model
const logger = console; // Replace with your logger if you have one

// === MongoDB setup ===
mongoose.connect(
  "mongodb+srv://rujalladhe21:4i5XD37NI99oVeTx@cluster0.tp2huqb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
).then(() => logger.log("[MongoDB] Connected"))
  .catch((err) => logger.error("[MongoDB] Connection error:", err));

// === Redis setup ===
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

// === Kafka setup ===
const kafka = new Kafka({
  clientId: "rider-consumer",
  brokers: ["localhost:9092"], // Replace with your Kafka broker addresses
});

const consumer = kafka.consumer({ groupId: "rider-location-group" });

const run = async () => {
  await consumer.connect();
  logger.log("[Kafka] Consumer connected");

  await consumer.subscribe({ topic: "rider-locations", fromBeginning: false });
  logger.log("[Kafka] Subscribed to rider-locations topic");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        const { 
riderId, latitude, longitude, available } = data;

        // Update MongoDB
     const rider = await Rider.findOneAndUpdate(
  { userId: riderId },             // finds the document where userId == riderId
  { latitude, longitude, available }, // updates these fields
  { new: true }                     // returns the updated document instead of the old one
);

        if (!rider) {
          logger.warn(`[MongoDB] Rider not found: ${riderId}`);
          return;
        }

        logger.log(`[MongoDB] Rider updated: ${riderId} | Lat: ${latitude}, Long: ${longitude}`);

        // Update Redis for fast access
        await redis.hmset(`rider:${riderId}`, {
          latitude,
          longitude,
          available: available ? 1 : 0,
        });

        logger.log(`[Redis] Rider location updated: rider:${riderId}`);
      } catch (err) {
        logger.error("[Consumer] Error processing message:", err);
      }
    },
  });
};

run().catch((err) => logger.error("[Consumer] Fatal error:", err));
