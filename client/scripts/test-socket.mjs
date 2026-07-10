import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3000";

// Thay token tùy test case
const token = "YOUR_ACCESS_TOKEN";

const socket = io(SERVER_URL, {
  auth: {
    token,
  },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("CONNECTED:", socket.id);

  // Test join room
  socket.emit("join_room", {
    sessionId: "YOUR_SESSION_ID",
  });
});

socket.on("connect_error", (error) => {
  console.log("CONNECTION ERROR:", error.message);
});

socket.on("error", (error) => {
  console.log("SOCKET ERROR:", error);
});

socket.on("disconnect", (reason) => {
  console.log("DISCONNECTED:", reason);
});
