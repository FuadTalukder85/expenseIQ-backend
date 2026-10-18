import { Role } from "@prisma/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: "Invalid role. Allowed roles: EMPLOYEE, MANAGER, DEPT_HEAD, FINANCE, ADMIN" }),
  }),
  departmentId: z.string().min(1, "departmentId is required"),
  managerId: z.string().optional().nullable(),
});

export const AuthValidation = {
  loginSchema,
  registerSchema,
};
