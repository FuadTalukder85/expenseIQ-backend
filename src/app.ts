import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import qs from "qs";
import { envVars } from "./app/config/env";
import { prisma } from "./app/lib/prisma";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";
import { IndexRoutes } from "./app/routes";

const app: Application = express();

app.set("query parser", (str: string) => qs.parse(str));

// CORS configuration
const allowedOrigins = [envVars.CLIENT_URL, "http://localhost:3000", "http://localhost:5173"].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly fallback
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  }),
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logger
app.use((req: Request, res: Response, next) => {
  const startTime = performance.now();
  res.on("finish", () => {
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`⚡ [${req.method}] ${req.originalUrl} - ${duration}ms (Status: ${res.statusCode})`);
  });
  next();
});

// Root API Info
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "ExpenseIQ / FinFlow API is running successfully",
    version: "1.0.0",
  });
});

// Health check with DB connection check
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "Server is healthy and database is connected",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Service unavailable: Database connection failed",
      error: error instanceof Error ? error.message : "Database error",
    });
  }
});

// API Routes
app.use("/api/v1", IndexRoutes);

// Error Handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;
