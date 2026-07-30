/**
 * Cấu hình Socket.IO Client
 * Quản lý các kết nối WebSocket thời gian thực cho các tính năng trực tiếp
 * Xử lý chat, phiên lập trình trực tiếp, và các cập nhật thời gian thực
 */
import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";

let socket: Socket | null = null;

/**
 * Khởi tạo kết nối socket
 * Gọi hàm này khi người dùng xác thực hoặc khi ứng dụng bắt đầu
 */
export function initializeSocket(token?: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(env.SOCKET_URL, {
    autoConnect: false,
    auth: {
      token, // Truyền JWT token để xác thực
    },
    transports: ["websocket", "polling"],
  });

  // Các hàm xử lý sự kiện kết nối — chỉ log ở dev, tránh rò rỉ noise/thông
  // tin kết nối ra console production.
  socket.on("connect", () => {
    if (import.meta.env.DEV) {
      console.log("✅ Socket connected:", socket?.id);
    }
  });

  socket.on("disconnect", (reason) => {
    if (import.meta.env.DEV) {
      console.log("❌ Socket disconnected:", reason);
    }
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 Socket connection error:", error);
  });

  // Kết nối socket
  socket.connect();

  return socket;
}

/**
 * Lấy phiên bản socket hiện tại
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Ngắt kết nối và dọn dẹp socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Các hàm lắng nghe sự kiện socket cho các tính năng khác nhau
 */
export const socketEvents = {
  // Sự kiện phiên phỏng vấn
  INTERVIEW_JOIN: "interview:join",
  INTERVIEW_LEAVE: "interview:leave",
  INTERVIEW_CODE_UPDATE: "interview:code_update",
  INTERVIEW_MESSAGE: "interview:message",

  // Sự kiện chat
  CHAT_MESSAGE: "chat:message",
  CHAT_TYPING: "chat:typing",

  // Sự hiện diện của người dùng
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
} as const;
