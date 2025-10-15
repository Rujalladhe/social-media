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

    // Keep exchange non-durable to match the existing broker setup
    await channel.assertExchange(exchange_name, "topic", { durable: false });
        logger.info("connected to rabbit mq");
        return channel ;


}
catch(e){
    logger.error(
        "error connecting to raabit mq ",e
    )


}
}
async function publishEvent(routingKey,message){
    if(!channel){
        await connectToRabbitMQ();
    }
    // Publish message
    channel.publish(
        exchange_name,
        routingKey,
        Buffer.from(JSON.stringify(message))
    )
    logger.info(`enevt published ${routingKey}`);

}
module.exports={connectToRabbitMQ,publishEvent};