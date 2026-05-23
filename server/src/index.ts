import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { connectDB } from "./config/db";
import { initSocket } from "./socket/events";
import { seedDatabase } from "./seed";

// Routes
import authRoutes from "./routes/auth";
import requestRoutes from "./routes/requests";
import paymentRoutes from "./routes/payments";
import noticeRoutes from "./routes/notices";
import userRoutes from "./routes/users";
import eventRoutes from "./routes/events";
import pollRoutes from "./routes/polls";
import complaintRoutes from "./routes/complaints";

const app = express();
const httpServer = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/complaints", complaintRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files from the React client build directory
const clientDistPath = path.resolve(__dirname, "../../dist");
app.use(express.static(clientDistPath));

// Catch-all route to serve index.html for client-side routing
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// ── Bootstrap ────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "5000", 10);

(async () => {
  await connectDB();
  await seedDatabase();

  // Init Socket.io AFTER db is ready
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io listening on http://localhost:${PORT}`);
  });
})();
