const socketIo = require("socket.io");
const handleSensorSocket = require("../controllers/sensorController");

const setupSocket = (server) => {

  const io = socketIo(server);

  io.on("connection", (socket) => {
    console.log("Device Connected");
    handleSensorSocket(socket, io);
  });

  return io;
};

module.exports = setupSocket;