const Patient = require("../models/Patient");
const SensorData = require("../models/SensorData");
const Alert = require("../models/Alert");
const riskEngine = require("../services/riskEngine");
const { publishControl } = require("../config/mqtt");

let lastStopTime = 0;

const handleSensorSocket = (socket, io) => {

    socket.on("sensorData", async (data) => {

        try {

            /* ================= VALIDATION ================= */

            if (
                typeof data.fsr !== "number" ||
                typeof data.dripRate !== "number" ||
                typeof data.temperature !== "number"
            ) {
                console.warn("Invalid sensor packet received");
                return;
            }

            const fsr = data.fsr;
            const dripRate = data.dripRate;
            const temperature = data.temperature;

            /* ================= PATIENT ================= */

            let patient = await Patient.findOne();

            if (!patient) {
                patient = await Patient.create({
                    name: process.env.DEFAULT_PATIENT_NAME,
                    age: process.env.DEFAULT_PATIENT_AGE,
                    baselineFlow: process.env.DEFAULT_BASELINE_FLOW,
                    baselineTissue: process.env.DEFAULT_BASELINE_TISSUE
                });
            }

            const baseline = {
                flow: patient.baselineFlow,
                tissue: patient.baselineTissue
            };

            /* ================= RISK ================= */

            const riskResult = riskEngine.calculateRiskScore(
                {
                    flowRate: dripRate,
                    tissuePressure: fsr,
                    temperature: temperature
                },
                baseline
            );

            const riskScore = riskResult.score;
            const riskLevel = riskEngine.classifyRisk(riskScore);
            const riskReason = riskResult.reason;

            /* ================= AUTO STOP (THROTTLED) ================= */

            if (riskLevel === "HIGH RISK") {

                const now = Date.now();

                if (now - lastStopTime > 5000) { // 5 sec cooldown
                    publishControl({ action: "STOP" });
                    lastStopTime = now;
                    console.log("⚠️ Auto STOP triggered due to HIGH RISK");
                }
            }

            /* ================= CONFIDENCE ================= */

            const confidence = riskEngine.calculateConfidence({
                flowRate: dripRate,
                tissuePressure: fsr,
                temperature: temperature
            });

            /* ================= SAVE DATA ================= */

            await SensorData.create({
                patientId: patient._id,
                flowRate: dripRate,
                tissuePressure: fsr,
                riskScore,
                riskLevel,
                confidence
            });

            /* ================= ALERT ================= */

            if (riskLevel === "HIGH RISK") {
                await Alert.create({
                    patientId: patient._id,
                    severity: "HIGH",
                    message: riskReason || "IV Failure Likely"
                });
            }

            /* ================= EMIT ================= */

            io.emit("updateDashboard", {
                fsr,
                dripRate,
                temperature,
                flowRate: dripRate,
                riskScore,
                riskLevel,
                confidence,
                riskReason,
                status: data.status,
                fault: data.fault
            });

        } catch (error) {
            console.error("Sensor Processing Error:", error);
        }
    });
};

module.exports = handleSensorSocket;