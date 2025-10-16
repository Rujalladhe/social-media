const express = require("express");
const { createOrder } = require("../controllers/order-controller")
const router = express.Router();

// POST /orders
router.post("/", createOrder);

module.exports = router;
