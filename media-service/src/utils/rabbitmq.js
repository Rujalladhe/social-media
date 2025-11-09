const amqb = require('amqplib');
const logger = require('./logger');
let connection = null;
let channel = null;
const exchange_name = 'media_queue';
async function connectToRabbitMQ() {
  try {
    connection = await amqb.connect(process.env.RABBITMQ_url);
    channel = await connection.createChannel();

    // Attach error listeners early so channel/connection errors don't crash the process
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', err);
    });
    channel.on('error', (err) => {
      logger.error('RabbitMQ channel error', err);
    });
    channel.on('close', () => {
      logger.info('RabbitMQ channel closed');
    });

    // Keep exchange non-durable to match existing broker
    await channel.assertExchange(exchange_name, 'topic', { durable: false });
    logger.info('connected to rabbit mq');
    return channel;
  } catch (e) {
    logger.error('error connecting to raabit mq ', e);
  }
}
async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  channel.publish(exchange_name, routingKey, Buffer.from(JSON.stringify(message)));
  logger.info(`enevt published ${routingKey}`);
}
async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  // Use a durable, named queue so messages are retained until this service consumes them
  const queueName = `media_service.${routingKey}`;
  const q = await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(q.queue, exchange_name, routingKey);
  channel.consume(q.queue, async (msg) => {
    if (msg !== null) {
      const raw = msg.content.toString();
      logger.info('media-service: raw message received -> ' + raw);
      try {
        const content = JSON.parse(raw);
        // Await the handler so any async work is completed and errors can be caught
        await callback(content);
      } catch (err) {
        logger.error('media-service: failed to process message', err, raw);
      }
      channel.ack(msg);
    }
  });
  logger.info(`subscribed to ${routingKey}`); //(subsmiruber to event)
}
module.exports = { connectToRabbitMQ, publishEvent, consumeEvent };
