const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  baselineFlow: Number,
  baselineTissue: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Patient", patientSchema);