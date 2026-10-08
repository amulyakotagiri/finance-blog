/**
 * Savings Goal Calculator
 * Future value of regular deposits with optional interest.
 */

export interface SavingsInput {
  monthlyDeposit: number;
  annualInterestRate: number; // percent, e.g. 4.5
  years: number;
  initialAmount?: number;
}

export interface SavingsResult {
  futureValue: number;
  totalDeposits: number;
  totalInterest: number;
  isValid: boolean;
  errors: string[];
  assumptions: string[];
  methodology: string;
}

export function calculateSavings(input: SavingsInput): SavingsResult {
  const errors: string[] = [];
  const assumptions = [
    "Interest is compounded monthly.",
    "Deposits are assumed to be made at the end of each month.",
    "The interest rate is constant over the entire period.",
    "Taxes and fees are not included.",
    "This is an educational illustration only.",
  ];
  const methodology =
    "Future value of an ordinary annuity: FV = P × [((1 + r)^n − 1) / r] + initial × (1 + r)^n, where r is monthly rate and n is number of months.";

  const monthly = Number(input.monthlyDeposit);
  const rate = Number(input.annualInterestRate);
  const years = Number(input.years);
  const initial = Number(input.initialAmount ?? 0);

  if (!Number.isFinite(monthly) || monthly < 0) errors.push("Monthly deposit must be ≥ 0.");
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) errors.push("Annual interest rate must be between 0 and 100.");
  if (!Number.isFinite(years) || years <= 0 || years > 100) errors.push("Years must be between 0 and 100.");
  if (!Number.isFinite(initial) || initial < 0) errors.push("Initial amount must be ≥ 0.");

  if (errors.length > 0) {
    return {
      futureValue: 0,
      totalDeposits: 0,
      totalInterest: 0,
      isValid: false,
      errors,
      assumptions,
      methodology,
    };
  }

  const monthlyRate = rate / 100 / 12;
  const months = Math.round(years * 12);

  let futureValue: number;
  if (monthlyRate === 0) {
    futureValue = initial + monthly * months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    futureValue = initial * factor + monthly * ((factor - 1) / monthlyRate);
  }

  futureValue = Math.round(futureValue * 100) / 100;
  const totalDeposits = Math.round((initial + monthly * months) * 100) / 100;
  const totalInterest = Math.round((futureValue - totalDeposits) * 100) / 100;

  return {
    futureValue,
    totalDeposits,
    totalInterest,
    isValid: true,
    errors: [],
    assumptions,
    methodology,
  };
}
