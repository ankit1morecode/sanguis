/* =========================================================
   SANGUIN DASHBOARD SOCKET CLIENT
   Clean Version – Structured & Maintainable
========================================================= */

const socket = io();

/* =========================================================
   DOM ELEMENTS
========================================================= */
socket.on("connect", () => {
  console.log("🟢 Socket Connected");
});
const el = {
  fsr: document.getElementById("fsrValue"),
  drip: document.getElementById("dripValue"),
  temp: document.getElementById("temperatureValue"),
  flow: document.getElementById("flowValue"),
  riskScore: document.getElementById("riskScore"),
  confidence: document.getElementById("confidence"),
  escalation: document.getElementById("escalation"),
  trendStatus: document.getElementById("trendStatus"),
  riskBadge: document.getElementById("riskLevel"),
  swellingFill: document.getElementById("swellingFill"),
  centerGlass: document.querySelector(".center-glass"),
  drop: document.querySelector(".drop"),
  dripInput: document.getElementById("dripInput"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  setDripBtn: document.getElementById("setDripBtn"),
  deviceStatus: document.getElementById("deviceStatus"),
  deviceFault: document.getElementById("deviceFault"),
};

/* =========================================================
   CHART INITIALIZATION
========================================================= */

let flowChart;
let riskMeter;

/* -------- FLOW ECG CHART -------- */

function initFlowChart() {
  const canvas = document.getElementById("flowChart");
  if (!canvas) return;

  flowChart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: "#00e0c6",
        borderWidth: 2,
        tension: 0,
        fill: false,
        pointRadius: 0
      }]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: false },
        y: { min: 0 }
      },
      plugins: { legend: { display: false } }
    }
  });
}

/* -------- RISK METER -------- */

function initRiskMeter() {
  const canvas = document.getElementById("riskMeter");
  if (!canvas) return;

  riskMeter = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      datasets: [{
        data: [0, 100],
        backgroundColor: ["#00e0c6", "rgba(255,255,255,0.1)"],
        borderWidth: 0
      }]
    },
    options: {
      rotation: -90,
      circumference: 180,
      cutout: "80%",
      plugins: { tooltip: { enabled: false } }
    }
  });
}

/* =========================================================
   UI UPDATE FUNCTIONS
========================================================= */

function updateSensorValues(data) {

  if (typeof data.fsr === "number")
    el.fsr.innerText = data.fsr.toFixed(1) + " N";

  if (typeof data.dripRate === "number")
    el.drip.innerText = data.dripRate.toFixed(0) + " drops/min";

  if (typeof data.temperature === "number")
    el.temp.innerText = data.temperature.toFixed(1) + " °C";

  if (typeof data.flowRate === "number")
    el.flow.innerText = data.flowRate.toFixed(1) + " ml/min";
}

function updateRiskSection(data) {

  if (typeof data.riskScore !== "number") return;

  el.riskScore.innerText = data.riskScore + "%";
  el.confidence.innerText = (data.confidence ?? 0) + "%";
  el.escalation.innerText = Math.min(data.riskScore + 10, 100) + "%";
  el.trendStatus.innerText = data.riskLevel || "UNKNOWN";

  applyRiskStyling(data.riskLevel, data.riskScore);
  updateMeter(data.riskScore);
}

function applyRiskStyling(level, score) {

  document.body.classList.remove("danger-mode");

  if (level === "HIGH RISK") {
    document.body.classList.add("danger-mode");
    el.riskScore.style.color = "#ef4444";
  }
  else if (level === "WARNING") {
    el.riskScore.style.color = "#facc15";
  }
  else {
    el.riskScore.style.color = "#00e0c6";
  }

  el.riskBadge.innerText = level;
}

function updateSwelling(fsr) {
  if (!el.swellingFill) return;

  const percent = Math.min(fsr, 100);
  el.swellingFill.style.width = percent + "%";

  if (fsr > 60) el.swellingFill.style.background = "#ef4444";
  else if (fsr > 40) el.swellingFill.style.background = "#facc15";
  else el.swellingFill.style.background = "#00e0c6";
}

function updateDripAnimation(rate) {
  if (!el.drop) return;

  const speed = Math.max(0.3, 3 - rate / 10);
  el.drop.style.animationDuration = speed + "s";
}

function updateFlowChart(flowRate) {
  if (!flowChart) return;

  const value = generateECG(flowRate);

  flowChart.data.labels.push("");
  flowChart.data.datasets[0].data.push(value);

  if (flowChart.data.labels.length > 60) {
    flowChart.data.labels.shift();
    flowChart.data.datasets[0].data.shift();
  }

  flowChart.update();
}

function updateMeter(score) {
  if (!riskMeter) return;
  riskMeter.data.datasets[0].data = [score, 100 - score];
  riskMeter.update();
}

/* =========================================================
   ECG GENERATOR
========================================================= */

function generateECG(base) {
  const spike = Math.random();
  if (spike > 0.96) return base + 20;
  if (spike > 0.92) return base - 15;
  return base + (Math.random() * 4 - 2);
}

/* =========================================================
   SOCKET EVENTS
========================================================= */

socket.on("updateDashboard", (data) => {
  console.log("📤 Received from server:", data);

  updateSensorValues(data);
  updateRiskSection(data);

  if (typeof data.fsr === "number")
    updateSwelling(data.fsr);

  if (typeof data.dripRate === "number")
    updateDripAnimation(data.dripRate);

  if (typeof data.flowRate === "number")
    updateFlowChart(data.flowRate);

  if (data.status)
    el.deviceStatus.innerText = data.status;

  if (data.fault) {
    el.deviceFault.innerText =
      data.fault === "YES" ? "FAULT DETECTED" : "NO FAULT";

    el.deviceFault.style.color =
      data.fault === "YES" ? "#ef4444" : "#00e0c6";
  }
});

/* =========================================================
   CONTROL PANEL
========================================================= */

if (el.startBtn) {
  el.startBtn.addEventListener("click", () => {

    const value = Number(el.dripInput.value);

    if (!value || value <= 0) {
      alert("Enter valid drip rate first");
      return;
    }

    fetch("/api/control/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropsPerMinute: value })
    });

  });
}

if (el.stopBtn){
  el.stopBtn.addEventListener("click", () => {
    fetch("/api/control/stop", { method: "POST" });
  });
}

if (el.setDripBtn) {
  el.setDripBtn.addEventListener("click", () => {
    const value = Number(el.dripInput.value);
    if (!value) return;

    fetch("/api/control/set-drip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropsPerMinute: value })
    });
  });
}

/* =========================================================
   SIMULATION MODE (Optional)
========================================================= */

// setInterval(() => {
//   socket.emit("sensorData", {
//     fsr: 30 + Math.random() * 40,
//     // dripRate: 10 + Math.random() * 20,
//     temperature: 36 + Math.random() * 2
//   });
// }, 200);

/* =========================================================
   INIT
========================================================= */

initFlowChart();
initRiskMeter();