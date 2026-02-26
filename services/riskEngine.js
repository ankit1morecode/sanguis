/* =========================================================
   SANGUIN MEDICAL-GRADE RISK ENGINE
   Version 2.0
========================================================= */

const MAX_SCORE = 100;

/* =========================================================
   HARD FAILURE CONDITIONS
========================================================= */

function checkHardFailures(data) {
  const { flowRate, tissuePressure, temperature } = data;

  // Complete occlusion
  if (flowRate <= 1) {
    return { score: 100, reason: "Flow Occlusion Detected" };
  }

  // Extreme swelling
  if (tissuePressure >= 85) {
    return { score: 95, reason: "Severe Tissue Swelling" };
  }

  // High fever
  if (temperature >= 39.5) {
    return { score: 90, reason: "High Infection Risk" };
  }

  return null;
}

/* =========================================================
   GRADUAL RISK CALCULATION
========================================================= */

function calculateRiskScore(data, baseline) {
  const { flowRate, tissuePressure, temperature } = data;

  /* ---------- HARD FAIL CHECK ---------- */
  const hardFail = checkHardFailures(data);
  if (hardFail) {
    return {
      score: hardFail.score,
      reason: hardFail.reason
    };
  }

  let swellingRisk = 0;
  let temperatureRisk = 0;
  let flowRisk = 0;
  let correlationRisk = 0;

  /* ================= SWELLING (35%) ================= */

  if (tissuePressure > 70) swellingRisk = 35;
  else if (tissuePressure > 55) swellingRisk = 25;
  else if (tissuePressure > 40) swellingRisk = 15;

  /* ================= TEMPERATURE (25%) ================= */

  if (temperature > 38.5) temperatureRisk = 25;
  else if (temperature > 37.8) temperatureRisk = 15;
  else if (temperature > 37.3) temperatureRisk = 8;

  /* ================= FLOW DEVIATION (20%) ================= */

  const flowDeviation = Math.abs(flowRate - baseline.flow) / baseline.flow;
  flowRisk = Math.min(flowDeviation * 100 * 0.2, 20);

  /* ================= CORRELATION LOGIC (20%) ================= */

  // Swelling + low flow → infiltration
  if (tissuePressure > 55 && flowRate < baseline.flow * 0.7) {
    correlationRisk += 20;
  }

  // Swelling + fever → infection at IV site
  if (tissuePressure > 50 && temperature > 38) {
    correlationRisk += 15;
  }

  let total =
    swellingRisk +
    temperatureRisk +
    flowRisk +
    correlationRisk;

  total = Math.min(Math.round(total), MAX_SCORE);

  let reason = buildReason({
    swellingRisk,
    temperatureRisk,
    flowRisk,
    correlationRisk
  });

  return {
    score: total,
    reason
  };
}

/* =========================================================
   RISK CLASSIFICATION
========================================================= */

function classifyRisk(score) {
  if (score < 30) return "NORMAL";
  if (score < 65) return "WARNING";
  return "HIGH RISK";
}

/* =========================================================
   CONFIDENCE CALCULATION
========================================================= */

function calculateConfidence(data) {
  let confidence = 100;

  if (
    typeof data.flowRate !== "number" ||
    typeof data.tissuePressure !== "number" ||
    typeof data.temperature !== "number"
  ) {
    confidence -= 40;
  }

  if (Math.abs(data.flowRate - data.tissuePressure) > 60) {
    confidence -= 15;
  }

  return Math.max(confidence, 0);
}

/* =========================================================
   REASON BUILDER
========================================================= */

function buildReason(parts) {
  let reasons = [];

  if (parts.swellingRisk > 20)
    reasons.push("High Swelling");

  if (parts.temperatureRisk > 15)
    reasons.push("Elevated Temperature");

  if (parts.flowRisk > 15)
    reasons.push("Flow Deviation");

  if (parts.correlationRisk > 0)
    reasons.push("Multi-Sensor Correlation");

  return reasons.length > 0
    ? reasons.join(", ")
    : "Stable IV Condition";
}

module.exports = {
  calculateRiskScore,
  classifyRisk,
  calculateConfidence
};