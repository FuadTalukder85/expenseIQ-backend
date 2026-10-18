import { z } from "zod";

const createCategoryZodSchema = z.object({
  name: z.string({ required_error: "Category name is required" }).trim().min(1, "Category name cannot be empty"),
  taxRate: z
    .number({ required_error: "taxRate is required" })
    .min(0, "taxRate must be a non-negative number"),
  isActive: z.boolean().optional(),
});

const updateCategoryZodSchema = z.object({
  name: z.string().trim().min(1, "Category name cannot be empty").optional(),
  taxRate: z.number().min(0, "taxRate must be a non-negative number").optional(),
  isActive: z.boolean().optional(),
});

export const CategoryValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
};
