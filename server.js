require("dotenv").config();
const express = require("express");
const http = require("http");

const connectDB = require("./config/db");
const setupSocket = require("./config/socket");
const {setupMQTT} = require("./config/mqtt");
const dashboardRoutes = require("./routes/dashboardRoutes");
// const { setupMQTT } = require("./config/mqtt");
const controlRoutes = require("./routes/controlRoutes");

const app = express();
const server = http.createServer(app);

/* ================= CONFIG ================= */

connectDB();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

app.use("/", dashboardRoutes);
app.use("/api/control", controlRoutes);

/* ================= SOCKET ================= */

const io = setupSocket(server);
app.set("io", io);

/* ================= MQTT ================= */

setupMQTT(io);

/* ================= SERVER START ================= */

server.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);