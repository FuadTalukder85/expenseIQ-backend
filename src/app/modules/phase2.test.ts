import { describe, it, expect, vi } from "vitest";
import status from "http-status";
import { calculateExpenseAmounts } from "./expense/expense.calculation";

describe("Phase 2: Business Logic & Calculation Unit Tests", () => {
  it("should correctly compute taxAmount and netAmount matching hand calculations", () => {
    // Test 1: $120 gross, $0 discount, 15% tax rate
    // taxable = 120, tax = 120 * 0.15 = 18.00, net = 138.00
    const res1 = calculateExpenseAmounts({ amount: 120, discount: 0, taxRate: 15 });
    expect(res1.taxAmount).toBe(18.0);
    expect(res1.netAmount).toBe(138.0);

    // Test 2: $880 gross, $40 discount, 10% tax rate
    // taxable = 840, tax = 840 * 0.10 = 84.00, net = 924.00
    const res2 = calculateExpenseAmounts({ amount: 880, discount: 40, taxRate: 10 });
    expect(res2.taxAmount).toBe(84.0);
    expect(res2.netAmount).toBe(924.0);

    // Test 3: $450 gross, $0 discount, 5% tax rate
    // taxable = 450, tax = 450 * 0.05 = 22.50, net = 472.50
    const res3 = calculateExpenseAmounts({ amount: 450, discount: 0, taxRate: 5 });
    expect(res3.taxAmount).toBe(22.5);
    expect(res3.netAmount).toBe(472.5);

    // Test 4: $1250 gross, $50 discount, 0% tax rate
    // taxable = 1200, tax = 0.00, net = 1200.00
    const res4 = calculateExpenseAmounts({ amount: 1250, discount: 50, taxRate: 0 });
    expect(res4.taxAmount).toBe(0.0);
    expect(res4.netAmount).toBe(1200.0);
  });

  it("should reject discount greater than amount with 400 Bad Request", () => {
    expect(() => {
      calculateExpenseAmounts({ amount: 100, discount: 150, taxRate: 10 });
    }).toThrowError(/Discount cannot be greater than amount/);
  });

  it("should reject negative amount or negative discount", () => {
    expect(() => {
      calculateExpenseAmounts({ amount: -50, discount: 0, taxRate: 10 });
    }).toThrowError(/Amount must be a positive number/);

    expect(() => {
      calculateExpenseAmounts({ amount: 100, discount: -10, taxRate: 10 });
    }).toThrowError(/Discount cannot be negative/);
  });

  it("should reject negative taxRate", () => {
    expect(() => {
      calculateExpenseAmounts({ amount: 100, discount: 0, taxRate: -5 });
    }).toThrowError(/Tax rate cannot be negative/);
  });
});
