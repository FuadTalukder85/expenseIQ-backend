import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PolicyService } from "./policy.service";

const getPolicy = catchAsync(async (req: Request, res: Response) => {
  const departmentId = req.query.departmentId as string | undefined;
  const result = await PolicyService.getPolicy(departmentId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Approval policy retrieved successfully",
    data: result,
  });
});

const getAllPolicies = catchAsync(async (_req: Request, res: Response) => {
  const result = await PolicyService.getAllPolicies();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "All approval policies retrieved successfully",
    data: result,
  });
});

const updatePolicy = catchAsync(async (req: Request, res: Response) => {
  const result = await PolicyService.updatePolicy(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Approval policy updated successfully",
    data: result,
  });
});

export const PolicyController = {
  getPolicy,
  getAllPolicies,
  updatePolicy,
};
