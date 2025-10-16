const Order = require("../models/order");
const sqs = require("../utils/sqsclient");

exports.createOrder = async (req, res) => {
  try {
    const { 
      userId, 
      items, 
      totalAmount, 
      pickupLocation, 
      deliveryLocation 
    } = req.body;

    // ✅ Validate required fields
    if (!userId || !items || !totalAmount || !pickupLocation || !deliveryLocation) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Save order in MongoDB
    const order = await Order.create({
      userId,
      items,
      totalAmount,
      pickupLocation,
      deliveryLocation,
    });

    // ✅ Send to AWS SQS (for Lambda trigger)
    const params = {
      MessageBody: JSON.stringify({
        orderId: order._id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        pickupLocation: order.pickupLocation,
        deliveryLocation: order.deliveryLocation,
        items: order.items,
      }),
      QueueUrl: process.env.SQS_QUEUE_URL,
    };

    await sqs.sendMessage(params).promise();

    console.log("✅ Order sent to SQS:", order._id);

    res.status(201).json({
      message: "Order created successfully and sent to SQS",
      order,
    });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};
