const express = require("express");
const router = express.Router();
const { publishControl } = require("../config/mqtt");

router.post("/start", (req, res) => {
  publishControl({ action: "START" });
  res.json({ status: "IV Started" });
});

router.post("/stop", (req, res) => {
  publishControl({ action: "STOP" });
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