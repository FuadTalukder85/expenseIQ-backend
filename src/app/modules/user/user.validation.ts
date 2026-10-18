import { Role } from "@prisma/client";
import { z } from "zod";

const createUserZodSchema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(1, "Name cannot be empty"),
  email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
  password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(Role, { required_error: "Role is required" }),
  departmentId: z.string({ required_error: "departmentId is required" }),
  managerId: z.string().nullable().optional(),
});

const updateUserZodSchema = z.object({
  name: z.string().trim().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().optional(),
  managerId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
};
