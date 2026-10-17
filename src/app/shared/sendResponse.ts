import { Response } from "express";
import { IResponseData } from "../types/response.types";

export const sendResponse = <T>(res: Response, responseData: IResponseData<T>) => {
  const { statusCode, success, message, data, meta } = responseData;

  res.status(statusCode).json({
    success,
    statusCode,
    message,
    data,
    meta,
  });
};
