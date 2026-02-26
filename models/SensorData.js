const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  flowRate: Number,
  tissuePressure: Number,
  riskScore: Number,
  confidence: Number,
  riskLevel: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SensorData", sensorSchema);