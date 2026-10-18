import { z } from "zod";

const updatePolicyZodSchema = z.object({
  thresholdAmount: z
    .number({ required_error: "thresholdAmount is required" })
    .min(0, "thresholdAmount must be non-negative"),
  departmentId: z.string().nullable().optional(),
});

export const PolicyValidation = {
  updatePolicyZodSchema,
};
