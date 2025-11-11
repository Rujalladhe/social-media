// src/controllers/orderController.js
const Order = require('../models/order');
const { Kafka } = require('kafkajs');

// --- Kafka Setup ---
const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['localhost:9092'], // Update to match your Docker or cluster setup
});

const producer = kafka.producer();

// Connect producer only once (lazy init)
let isKafkaConnected = false;
async function connectKafkaProducer() {
  if (!isKafkaConnected) {
    await producer.connect();
    console.log('✅ Kafka Producer connected');
    isKafkaConnected = true;
  }
}

// --- Controller: Create Order ---
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, totalAmount, pickupLocation, deliveryLocation } = req.body;

    // ✅ Validate required fields
    if (!userId || !items || !totalAmount || !pickupLocation || !deliveryLocation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Save order in MongoDB
    const order = await Order.create({
      userId,
      items,
      totalAmount,
      pickupLocation,
      deliveryLocation,
      status: 'CREATED',
    });

    // ✅ Prepare message payload for Kafka
    const orderEvent = {
      eventType: 'ORDER_CREATED',
      orderId: order._id.toString(),
      userId: order.userId,
      totalAmount: order.totalAmount,
      pickupLocation: order.pickupLocation,
      deliveryLocation: order.deliveryLocation,
      items: order.items,
      createdAt: new Date().toISOString(),
    };

    // ✅ Connect producer (if not already)
    await connectKafkaProducer();

    // ✅ Send to Kafka topic
    await producer.send({
      topic: 'order.created',
      messages: [{ value: JSON.stringify(orderEvent) }],
    });

    console.log('✅ Order event sent to Kafka:', orderEvent.orderId);

    // ✅ Response
    res.status(201).json({
      message: 'Order created successfully and event published to Kafka',
      order,
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};
