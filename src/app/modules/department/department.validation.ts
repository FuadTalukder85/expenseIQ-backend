import { z } from "zod";

const createDepartmentZodSchema = z.object({
  name: z.string({ required_error: "Department name is required" }).trim().min(1, "Department name cannot be empty"),
  monthlyBudget: z
    .number({ required_error: "Monthly budget is required" })
    .min(0, "Monthly budget must be a non-negative number"),
  headId: z.string().cuid().nullable().optional(),
});

const updateDepartmentZodSchema = z.object({
  name: z.string().trim().min(1, "Department name cannot be empty").optional(),
  monthlyBudget: z.number().min(0, "Monthly budget must be a non-negative number").optional(),
  headId: z.string().cuid().nullable().optional(),
});

export const DepartmentValidation = {
  createDepartmentZodSchema,
  updateDepartmentZodSchema,
};
