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

//connect to mongodb
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

app.use(cors());
app.use(helmet());

// Mount media routes BEFORE JSON parser so multipart/form-data isn't intercepted
app.use("/api/media", mediaRoutes);

// JSON parser for non-multipart routes (increase limit for safety)
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

//*** Homework - implement Ip based rate limiting for sensitive endpoints

// (moved above)

app.use(errorHandler);


async function startServer() {
  await connectToRabbitMQ()
  await consumeEvent('post.deleted',handlePostDel)

app.listen(PORT, () => {

  logger.info(`Media service running on port ${PORT}`);
});

}
//unhandled promise rejection
startServer()
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});