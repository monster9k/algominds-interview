/**
 * Socket.IO Client Configuration
 * Manages real-time WebSocket connections for live features
 * Handles chat, live coding sessions, and real-time updates
 */
import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";

let socket: Socket | null = null;

/**
 * Initialize socket connection
 * Call this when user authenticates or app starts
 */
export function initializeSocket(token?: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(env.SOCKET_URL, {
    autoConnect: false,
    auth: {
      token, // Pass JWT token for authentication
    },
    transports: ["websocket", "polling"],
  });

  // Connection event handlers
  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 Socket connection error:", error);
  });

  // Connect the socket
  socket.connect();

  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Socket event listeners for different features
 */
export const socketEvents = {
  // Interview session events
  INTERVIEW_JOIN: "interview:join",
  INTERVIEW_LEAVE: "interview:leave",
  INTERVIEW_CODE_UPDATE: "interview:code_update",
  INTERVIEW_MESSAGE: "interview:message",

  // Chat events
  CHAT_MESSAGE: "chat:message",
  CHAT_TYPING: "chat:typing",

  // User presence
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
} as const;
