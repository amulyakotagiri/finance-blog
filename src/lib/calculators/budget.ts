/**
 * Budget Calculator
 * Simple 50/30/20 rule + custom category planner.
 * Assumptions are explicit. No personal data is stored.
 */

export interface BudgetInput {
  monthlyIncome: number;
  needsPercent?: number;   // default 50
  wantsPercent?: number;   // default 30
  savingsPercent?: number; // default 20
}

export interface BudgetResult {
  needs: number;
  wants: number;
  savings: number;
  totalAllocated: number;
  remaining: number;
  isValid: boolean;
  errors: string[];
  assumptions: string[];
}

export function calculateBudget(input: BudgetInput): BudgetResult {
  const errors: string[] = [];
  const assumptions = [
    "Uses the classic 50/30/20 guideline unless custom percentages are provided.",
    "Income is assumed to be after-tax take-home pay.",
    "Percentages must sum to 100%. Remaining amount is shown if they do not.",
    "This is an educational tool only and does not constitute financial advice.",
  ];

  const income = Number(input.monthlyIncome);
  if (!Number.isFinite(income) || income < 0) {
    errors.push("Monthly income must be a non-negative number.");
  }
  if (income > 1_000_000_000) {
    errors.push("Income value is unrealistically large.");
  }

  const needsP = input.needsPercent ?? 50;
  const wantsP = input.wantsPercent ?? 30;
  const savingsP = input.savingsPercent ?? 20;

  if ([needsP, wantsP, savingsP].some((p) => !Number.isFinite(p) || p < 0 || p > 100)) {
    errors.push("Percentages must be numbers between 0 and 100.");
  }

  const totalPercent = needsP + wantsP + savingsP;
  if (Math.abs(totalPercent - 100) > 0.01 && errors.length === 0) {
    // not an error, just informational
  }

  if (errors.length > 0) {
    return {
      needs: 0,
      wants: 0,
      savings: 0,
      totalAllocated: 0,
      remaining: 0,
      isValid: false,
      errors,
      assumptions,
    };
  }

  const needs = Math.round((income * needsP) / 100 * 100) / 100;
  const wants = Math.round((income * wantsP) / 100 * 100) / 100;
  const savings = Math.round((income * savingsP) / 100 * 100) / 100;
  const totalAllocated = needs + wants + savings;
  const remaining = Math.round((income - totalAllocated) * 100) / 100;

  return {
    needs,
    wants,
    savings,
    totalAllocated,
    remaining,
    isValid: true,
    errors: [],
    assumptions,
  };
}
