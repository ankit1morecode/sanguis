const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  patientId: mongoose.Schema.Types.ObjectId,
  severity: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Alert", alertSchema);