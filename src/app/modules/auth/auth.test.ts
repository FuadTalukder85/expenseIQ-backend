import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { AuthValidation } from "./auth.validation";

describe("Phase 1: Auth Validation & Security Tests", () => {
  it("should fail validation if login email is invalid", () => {
    const invalidData = { email: "notanemail", password: "Password123!" };
    const result = AuthValidation.loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should pass validation with valid login credentials", () => {
    const validData = { email: "admin@expenseiq.com", password: "Password123!" };
    const result = AuthValidation.loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject register payload if role is invalid", () => {
    const invalidData = {
      name: "John Doe",
      email: "john@expenseiq.com",
      password: "Password123!",
      role: "SUPER_GOD_ROLE",
      departmentId: "dept_123",
    };
    const result = AuthValidation.registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should correctly hash and verify passwords with bcrypt", async () => {
    const plainPassword = "Password123!";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);

    const isMatch = await bcrypt.compare(plainPassword, hash);
    const isWrongMatch = await bcrypt.compare("WrongPassword", hash);

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });
});
