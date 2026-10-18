import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DepartmentService } from "./department.service";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.createDepartment(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Department created successfully",
    data: result,
  });
});

const getAllDepartments = catchAsync(async (_req: Request, res: Response) => {
  const result = await DepartmentService.getAllDepartments();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Departments retrieved successfully",
    data: result,
  });
});

const getDepartmentById = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.getDepartmentById(req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Department retrieved successfully",
    data: result,
  });
});

const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.updateDepartment(req.params.id as string, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Department updated successfully",
    data: result,
  });
});

const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.deleteDepartment(req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Department deleted successfully",
    data: result,
  });
});

export const DepartmentController = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
