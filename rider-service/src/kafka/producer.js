const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');

// ===== CONFIG =====
const JWT_SECRET = 'rujal ladhe'; // must match whatever you used to issue tokens
const PORT = 5000;

// ===== INIT =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const redis = new Redis({ host: '127.0.0.1', port: 6379 });

// ===== KAFKA =====
const kafka = new Kafka({
  clientId: 'rider-socket-producer',
  brokers: ['localhost:9092'],
});
const producer = kafka.producer();

// ===== Connect to Kafka =====
const connectKafka = async () => {
  await producer.connect();
  console.log('[Kafka] Producer connected');
};

// ===== SOCKET AUTH + MESSAGE HANDLER =====
io.use((socket, next) => {
  const token = socket.handshake.auth?.token; // coming from client
  if (!token) return next(new Error('No token provided'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`${JSON.stringify(decoded)} : ", decoded data`);
    socket.riderId = decoded.userId; // attach riderId to socket

    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] Rider connected: ${socket.riderId}`);

  socket.on('riderLocationUpdate', async (data) => {
    try {
      const message = {
        riderId: socket.riderId,
        latitude: data.latitude,
        longitude: data.longitude,
        available: data.available ?? true,
      };

      // Send to Kafka
      await producer.send({
        topic: 'rider-locations',
        messages: [{ value: JSON.stringify(message) }],
      });

      console.log(`[Kafka] Sent location for rider: ${socket.riderId}`);
    } catch (err) {
      console.error('[Kafka] Error sending location:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Rider disconnected: ${socket.riderId}`);
  });
});

// ===== REDIS TEST ROUTE =====
app.get('/rider/:id/location', async (req, res) => {
  try {
    const riderId = req.params.id;
    const location = await redis.hgetall(`rider:${riderId}`);

    if (!location || Object.keys(location).length === 0)
      return res.status(404).json({ message: 'No location found in Redis' });

    res.json({
      riderId,
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
      available: location.available === '1',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, async () => {
  await connectKafka();
  console.log(`[Server] Running on port ${PORT}`);
});
