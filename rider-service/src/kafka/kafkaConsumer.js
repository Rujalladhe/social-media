const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { Client } = require('@elastic/elasticsearch');
const Rider = require('../models/rider'); // Your Rider model
const logger = console;

// === MongoDB Setup ===
mongoose
  .connect(
    'mongodb+srv://rujalladhe21:4i5XD37NI99oVeTx@cluster0.tp2huqb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => logger.log('[MongoDB] Connected'))
  .catch((err) => logger.error('[MongoDB] Connection error:', err));

// === Redis Setup ===
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
});
redis.on('connect', () => logger.log('[Redis] Connected'));

// === Elasticsearch Setup ===
const esClient = new Client({ node: 'http://localhost:9200' });

async function setupElasticsearchIndex() {
  const indexName = 'riders';
  const exists = await esClient.indices.exists({ index: indexName });
  if (!exists) {
    await esClient.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            riderId: { type: 'keyword' },
            available: { type: 'boolean' },
            location: { type: 'geo_point' },
            updatedAt: { type: 'date' },
          },
        },
      },
    });
    logger.log(`[Elasticsearch] Created index: ${indexName}`);
  } else {
    logger.log('[Elasticsearch] Index already exists');
  }
}

// === Kafka Setup ===
const kafka = new Kafka({
  clientId: 'rider-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'rider-location-group' });

// === Main Consumer Logic ===
const run = async () => {
  await setupElasticsearchIndex();
  await consumer.connect();
  logger.log('[Kafka] Consumer connected');

  await consumer.subscribe({ topic: 'rider-locations', fromBeginning: false });
  logger.log('[Kafka] Subscribed to rider-locations topic');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        const { riderId, latitude, longitude, available } = data;

        // === Update MongoDB ===
        const rider = await Rider.findOneAndUpdate(
          { userId: riderId },
          { latitude, longitude, available },
          { new: true }
        );

        if (!rider) {
          logger.warn(`[MongoDB] Rider not found: ${riderId}`);
          return;
        }

        logger.log(`[MongoDB] Rider updated: ${riderId} | Lat: ${latitude}, Long: ${longitude}`);

        // === Update Redis Hash (for direct info access) ===
        await redis.hmset(`rider:${riderId}`, {
          latitude,
          longitude,
          available: available ? 1 : 0,
          updatedAt: new Date().toISOString(),
        });

        // === Update Redis GEO index ===
        await redis.geoadd(
          'riders:geo', // name of the geo index
          longitude, // lon first
          latitude, // lat second
          `rider:${riderId}` // unique member name
        );

        logger.log(`[Redis GEO] Updated Geo index for rider: ${riderId}`);

        // === Update Elasticsearch (for analytics or advanced geo search) ===
        await esClient.index({
          index: 'riders',
          id: riderId,
          body: {
            riderId,
            available,
            location: { lat: latitude, lon: longitude },
            updatedAt: new Date(),
          },
        });

        logger.log(`[Elasticsearch] Rider indexed: ${riderId}`);
      } catch (err) {
        logger.error('[Consumer] Error processing message:', err);
      }
    },
  });
};

run().catch((err) => logger.error('[Consumer] Fatal error:', err));
