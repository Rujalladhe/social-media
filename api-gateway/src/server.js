require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const logger = require("./utils/logger");
const proxy = require("express-http-proxy");
const errorHandler = require("./middleware/errorhandler");
const { validateToken } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;
const redisClient = new Redis(process.env.REDIS_URL);

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const ratelimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});
app.use(ratelimitOptions);

// Request Logging
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// Proxy Setup
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return req.originalUrl.replace(/^\/v1/, "/api");
    },

    proxyReqBodyDecorator: (bodyContent, srcReq) => {
      return JSON.stringify(bodyContent);
    },

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["Content-Length"] = Buffer.byteLength(
        JSON.stringify(srcReq.body)
      );
      return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },

    proxyErrorHandler: (err, res, next) => {
      logger.error(`Proxy error: ${err.message}`);
      res.status(500).json({
        message: "Internal server error",
        error: err.message,
      });
      next();
    },
  })
);

//setting proxy for the post routes 
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return req.originalUrl.replace(/^\/v1/, "/api");
    },

    proxyReqBodyDecorator: (bodyContent, srcReq) => {
      return JSON.stringify(bodyContent);
    },

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      proxyReqOpts.headers["Content-Length"] = Buffer.byteLength(
        
        JSON.stringify(srcReq.body)
      );
      return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from post service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },

    proxyErrorHandler: (err, res, next) => {
      logger.error(`Proxy error: ${err.message}`);
      res.status(500).json({
        message: "Internal server error",
        error: err.message,
      });
      next();
    },
  })
);
// Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(
    `Forwarding requests to Identity Service at ${process.env.IDENTITY_SERVICE_URL}`
  );
    logger.info(`post service is  running on port ${process.env.POST_SERVICE_URL}`);

});
