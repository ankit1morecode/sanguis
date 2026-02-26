const mqtt = require("mqtt");

let client;

let latestData = {
  fsr: null,
  dripRate: null,
  temperature: null,
  status: null,
  fault: null
};

const setupMQTT = (io) => {

  client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    reconnectPeriod: 3000
  });

  client.on("connect", () => {
  console.log("✅ MQTT Connected");

  const topics = [
    "iv/temperature",
    "iv/flow",
    "iv/fsr",
    "iv/status",
    "iv/fault"
  ];

  client.subscribe(topics, (err, granted) => {
    if (err) {
      console.error("❌ Subscription Error:", err);
    } else {
      granted.forEach(sub => {
        console.log(`📡 Subscribed to ${sub.topic} (QoS ${sub.qos})`);
      });
    }
  });
});

  client.on("message", (topic, message) => {
    const value = message.toString();
    console.log(`📥 MQTT Message → ${topic}: ${value}`);
    switch (topic) {

      case "iv/temperature":
        latestData.temperature = Number(value);
        break;

      case "iv/flow":
        latestData.dripRate = Number(value);
        break;

      case "iv/fsr":
        latestData.fsr = Number(value);
        break;

      case "iv/status":
        latestData.status = value;
        break;

      case "iv/fault":
        latestData.fault = value;
        break;
    }

    // Emit to dashboard when core data available
      io.emit("updateDashboard", { ...latestData });
  });

};

module.exports = { setupMQTT };