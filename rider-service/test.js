// testRiderSocketClient.js
const { io } = require("socket.io-client");

// ======= CONFIG =======
const SERVER_URL = "http://localhost:5000"; // your socket server
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTAyOWY1MmExNjQzY2E1M2ZjMzgxNGIiLCJ1c2VybmFtZSI6InJpZGUyIiwicm9sZSI6InJpZGVyIiwibGF0IjoxMjMyMzIsImxuZyI6Nzg5MCwiaWF0IjoxNzYxNzg0NDY0LCJleHAiOjE3NjE3OTA0NjR9.AJyxe_K8n2Y-21CQyIJqUJqwQ3tF02R_VpkLRCdPaWU"; // e.g., from login response

// ======= CONNECT TO SOCKET SERVER =======
const socket = io(SERVER_URL, {
  auth: { token: JWT_TOKEN },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("[Socket] Connected to server");

  // Simulate rider location updates every 5 seconds
  setInterval(() => {
    const data = {
      latitude: 18.5204 + Math.random() * 0.01,
      longitude: 73.8567 + Math.random() * 0.01,
      available: true,
      token: JWT_TOKEN,
    };
    socket.emit("riderLocationUpdate", data);
    console.log("[Socket] Sent location:", data);
  }, 5000);
});

socket.on("disconnect", () => {
  console.log("[Socket] Disconnected from server");
});

socket.on("connect_error", (err) => {
  console.error("[Socket] Connection error:", err.message);
});
