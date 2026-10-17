import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { envVars } from "../config/env";
import { logger } from "../utils/logger";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [envVars.CLIENT_URL, "http://localhost:3000", "http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user specific room for personal notifications
    socket.on("join_user", (userId: string) => {
      if (userId) {
        socket.join(`user_${userId}`);
        logger.info(`[Socket.IO] ${socket.id} joined user_${userId}`);
      }
    });

    // Join role specific rooms (e.g. manager, dept_head, finance, admin)
    socket.on("join_role", (role: string) => {
      if (role) {
        socket.join(`role_${role.toLowerCase()}`);
        logger.info(`[Socket.IO] ${socket.id} joined role_${role.toLowerCase()}`);
      }
    });

    // Join department specific room
    socket.on("join_department", (departmentId: string) => {
      if (departmentId) {
        socket.join(`dept_${departmentId}`);
        logger.info(`[Socket.IO] ${socket.id} joined dept_${departmentId}`);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  logger.info("[Socket.IO] WebSocket server successfully initialized");
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO is not initialized! Call initSocket(httpServer) first.");
  }
  return io;
};

/**
 * Helper to emit real-time notifications for ExpenseIQ
 */
export const NotificationSocketEvents = {
  sendToUser: (userId: string, event: string, payload: unknown) => {
    if (!io) return;
    io.to(`user_${userId}`).emit(event, payload);
  },
  sendToRole: (role: string, event: string, payload: unknown) => {
    if (!io) return;
    io.to(`role_${role.toLowerCase()}`).emit(event, payload);
  },
  sendToDepartment: (departmentId: string, event: string, payload: unknown) => {
    if (!io) return;
    io.to(`dept_${departmentId}`).emit(event, payload);
  },
};
