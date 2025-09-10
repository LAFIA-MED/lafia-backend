import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { errorHandler } from "./middleware/errorHandler";
import { config } from "./config/env";
import { hospitalRoutes } from "./routes/hospital";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/user";
import { chatRoutes } from "./routes/chat";
import { setupSocket } from "./utils/socketHandler";

const createApp = () => {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  app.use(helmet());
  app.use(
    cors({
      origin: config.allowedOrigins,
      credentials: true,
    })
  );
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });
  app.use(limiter);

  if (config.nodeEnv !== "test") {
    app.use(morgan("combined"));
  }
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  app.use("/auth", authRoutes);
  app.use("/hospitals", hospitalRoutes);
  app.use("/users", userRoutes);
  app.use("/chat", chatRoutes);

  setupSocket(io);
  app.use(/.*/, (req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use(errorHandler);

  return { app, httpServer };
};

export { createApp };
