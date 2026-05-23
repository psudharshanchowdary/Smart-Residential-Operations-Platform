import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket?.id);
    // Authenticate and join user room
    socket?.emit("authenticate", { token });
  });

  socket.on("authenticated", ({ room }: { room: string }) => {
    console.log(`✅ Socket authenticated, joined room: ${room}`);
  });

  socket.on("auth_error", ({ message }: { message: string }) => {
    console.error("❌ Socket auth error:", message);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected");
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket manually disconnected");
  }
};

export const getSocket = (): Socket | null => socket;
