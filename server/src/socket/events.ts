import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
          process.env.CLIENT_ORIGIN || "http://localhost:8080",
          "http://127.0.0.1:8080",
          "http://localhost:8081",
          "http://127.0.0.1:8081",
          "http://localhost:5173",
          "http://127.0.0.1:5173"
        ];
        if (
          allowedOrigins.includes(origin) ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
        ) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client sends { token } right after connecting so we can assign them a room
    socket.on("authenticate", ({ token }: { token: string }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
          id: string;
          role: string;
          name: string;
        };

        const room = `user:${decoded.id}`;
        socket.join(room);

        // Admins join a special admin room too
        if (decoded.role === "admin") {
          socket.join("admin");
        }

        socket.emit("authenticated", { room, userId: decoded.id });
        console.log(`✅ Socket ${socket.id} joined room ${room}`);
      } catch {
        socket.emit("auth_error", { message: "Invalid token" });
        socket.disconnect();
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Export a getter so routes can emit events after init
export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
