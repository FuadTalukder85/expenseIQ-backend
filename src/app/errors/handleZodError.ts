import status from "http-status";
import { ZodError } from "zod";
import { TErrorResponse, TErrorSources } from "../types/error.types";

export const handleZodError = (err: ZodError): TErrorResponse => {
  const statusCode = status.BAD_REQUEST;
  const message = "Validation Error";
  const errorSources: TErrorSources[] = [];

  err.issues.forEach((issue) => {
    errorSources.push({
      path: issue.path.join(" => "),
      message: issue.message,
    });
  });

  return {
    success: false,
    message,
    errorSources,
    statusCode,
  };
};
