import status from "http-status";
import AppError from "../../errors/AppError";

export interface ICalculationInput {
  amount: number;
  discount?: number;
  taxRate: number;
}

export interface ICalculationResult {
  amount: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  netAmount: number;
}

/**
 * Calculates netAmount and taxAmount based on the core business rules:
 * 1. netAmount = amount - discount + taxAmount
 * 2. taxAmount comes from category's taxRate snapshot: taxAmount = (amount - discount) * (taxRate / 100)
 * 3. Discount cannot be greater than amount.
 * 4. Negative values are strictly rejected.
 */
export const calculateExpenseAmounts = (input: ICalculationInput): ICalculationResult => {
  const { amount, taxRate } = input;
  const discount = input.discount || 0;

  if (amount <= 0) {
    throw new AppError(status.BAD_REQUEST, "Amount must be a positive number");
  }

  if (discount < 0) {
    throw new AppError(status.BAD_REQUEST, "Discount cannot be negative");
  }

  if (taxRate < 0) {
    throw new AppError(status.BAD_REQUEST, "Tax rate cannot be negative");
  }

  // Business Rule: "Discount greater than amount is rejected"
  if (discount > amount) {
    throw new AppError(status.BAD_REQUEST, "Discount cannot be greater than amount");
  }

  const taxableBase = amount - discount;
  const rawTax = (taxableBase * taxRate) / 100;
  const taxAmount = Number(rawTax.toFixed(2));
  const netAmount = Number((taxableBase + taxAmount).toFixed(2));

  return {
    amount: Number(amount.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    taxRate: Number(taxRate.toFixed(2)),
    taxAmount,
    netAmount,
  };
};
