import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { ZodError } from "zod";
import { envVars } from "../config/env";
import AppError from "../errors/AppError";
import { handlePrismaError } from "../errors/handlePrismaError";
import { handleZodError } from "../errors/handleZodError";
import { TErrorResponse, TErrorSources } from "../types/error.types";
import { logger } from "../utils/logger";

interface PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;
}

const isPrismaError = (err: unknown): err is PrismaClientKnownRequestError => {
  return (
    err instanceof Error &&
    "code" in err &&
    typeof (err as PrismaClientKnownRequestError).code === "string" &&
    (err as PrismaClientKnownRequestError).code.startsWith("P")
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export const globalErrorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (envVars.NODE_ENV === "development") {
    logger.error("Error caught by Global Error Handler:", err);
  }

  let errorSources: TErrorSources[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = "Internal Server Error";
  let stack: string | undefined = undefined;

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode as number;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (isPrismaError(err)) {
    const prismaError = handlePrismaError(err);
    statusCode = prismaError.statusCode as number;
    message = prismaError.message;
    errorSources = [...prismaError.errorSources];
    stack = err.stack;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSources = [{ path: "", message: err.message }];
  } else if (err instanceof Error) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    message = err.message;
    stack = err.stack;
    errorSources = [{ path: "", message: err.message }];
  }

  const errorResponse: TErrorResponse = {
    success: false,
    message,
    errorSources,
    error: envVars.NODE_ENV === "development" ? err : undefined,
    stack: envVars.NODE_ENV === "development" ? stack : undefined,
  };

  res.status(statusCode).json(errorResponse);
};
