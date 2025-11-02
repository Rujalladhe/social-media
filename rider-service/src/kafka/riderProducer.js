const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "rider-service",
  brokers: ["localhost:9092"], // Your Kafka broker
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log("[Kafka] Producer connected");
  } catch (err) {
    console.error("[Kafka] Producer connection error:", err);
  }
};

const sendRiderLocation = async (data) => {
  try {
    await producer.send({
      topic: "rider-locations",
      messages: [{ value: JSON.stringify(data) }],
    });
    console.log("[Kafka] Location sent:", data.riderId);
  } catch (err) {
    console.error("[Kafka] Error sending location:", err);
  }
};

module.exports = { connectProducer, sendRiderLocation };
