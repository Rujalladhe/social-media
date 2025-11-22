const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'dispatch-service-consumer',
  brokers: [process.env.KAFKA_BROKERS || 'kafka-service:9092'],
});

const consumer = kafka.consumer({ groupId: 'dispatch-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order.created', fromBeginning: false });

  console.log('🚀 Dispatch consumer running...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('📩 Received order event:', {
        partition,
        offset: message.offset,
        value: message.value.toString(),
      });
    },
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing consumer...');
  await consumer.disconnect();
  process.exit(0);
});

run().catch(console.error);