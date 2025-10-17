const io = require("socket.io-client");
const jwt = require("jsonwebtoken");

// Replace with JWT from identity service login
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGYxYTE3ZGU3NDUzMDI0MWE5NzQ1ZmIiLCJ1c2VybmFtZSI6InJpZGUxIiwicm9sZSI6InJpZGVyIiwibGF0IjoxMjMyMzIsImxuZyI6Nzg5MCwiaWF0IjoxNzYwNjY2MDIxLCJleHAiOjE3NjA2NzIwMjF9.Z5hecA8Jje1_e5oX7rIQ1n2FoSWh2NlI95z-X3ZGKo4";

// Connect to Rider service
const socket = io("http://localhost:3009");

socket.on("connect", () => {
  console.log("[Client] Connected to Rider Service:", socket.id);

  // Authenticate rider
  socket.emit("authenticate", { token });

  // Listen for authentication response
  socket.on("authenticated", (data) => {
    console.log("[Client] Authenticated as Rider:", data.riderId);

    // Send location updates every 10 sec
    setInterval(() => {
      const lat = 18.52 + Math.random() * 0.01;   // just for testing
      const long = 73.85 + Math.random() * 0.01;
      socket.emit("locationUpdate", { latitude: lat, longitude: long, available: true });
      console.log(`[Client] Sent location: ${lat}, ${long}`);
    }, 10000);
  });

  socket.on("riderUpdated", (rider) => {
    console.log("[Client] Rider Updated:", rider);
  });

  socket.on("error", (err) => {
    console.error("[Client] Error:", err);
  });
});

socket.on("disconnect", () => {
  console.log("[Client] Disconnected from server");
});
