require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis");
const mongoose = require("mongoose");

const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const orderRoutes = require("./routes/order-route");


const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("✅ Connected to MongoDB"))
  .catch((err) => {
    logger.error("❌ MongoDB connection error", err);
    process.exit(1);
  });

// Redis connection
const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on("connect", () => logger.info("✅ Connected to Redis"));
redisClient.on("error", (err) => logger.error("❌ Redis connection error", err));

app.use((req, res, next) => {
  req.redisClient = redisClient;
  next();
});

// Routes
app.use("/api/orders", orderRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
async function startServer() {
  try {
    
    app.listen(PORT, () => logger.info(`🚀 Order Service running on port ${PORT}`));
  } catch (err) {
    logger.error("❌ Failed to start Order Service", err);
    process.exit(1);
  }
}

startServer();
