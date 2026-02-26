const express = require("express");
const router = express.Router();
const { publishControl } = require("../config/mqtt");

router.post("/start", (req, res) => {

  const { dropsPerMinute } = req.body;

  if (!dropsPerMinute) {
    return res.status(400).json({ error: "Drip rate required" });
  }

  // 1️⃣ Send flow setpoint
  publishControl("iv/cmd/flow", dropsPerMinute);

  // 2️⃣ Send start command
  publishControl("iv/cmd/start", "1");

  res.json({ status: "IV Started with setpoint" });
});

router.post("/stop", (req, res) => {
  publishControl("iv/cmd/stop", "1");
  res.json({ status: "IV Stopped" });
});

router.post("/set-drip", (req, res) => {

  const { dropsPerMinute } = req.body;

  publishControl({
    action: "SET_DRIP",
    dropsPerMinute
  });

  // 🔥 NEW: Emit live update to dashboard
  req.app.get("io").emit("dripUpdated", {
    dripRate: dropsPerMinute
  });

  res.json({ status: "Drip Rate Updated" });
});

module.exports = router;