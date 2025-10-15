// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const mediaRoutes = require("./routes/media-route");
const errorHandler = require("./middleware/errorhandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDel } = require("./eventHandlers/media-event-handlers");

const app = express();
const PORT = process.env.PORT || 3003;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

app.use(cors());
app.use(helmet());
app.use("/api/media", mediaRoutes);
app.use(express.json({ limit: "10mb" }));
app.use(errorHandler);

// Start server & RabbitMQ consumer
async function startServer() {
  await connectToRabbitMQ();

  // Subscribe to 'post.deleted' messages
  await consumeEvent("post.deleted", async (event) => {
    try {
      // Clean media IDs: remove brackets/quotes if any
      if (event.mediaIds && Array.isArray(event.mediaIds)) {
        event.mediaIds = event.mediaIds.map((id) => id.replace(/[\[\]"]/g, ""));
      }
      await handlePostDel(event); // call your existing handler
    } catch (err) {
      logger.error("Error processing post.deleted event", err);
    }
  });

  app.listen(PORT, () => {
    logger.info(`Media service running on port ${PORT}`);
  });
}

// Handle unhandled promise rejections
startServer();
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
