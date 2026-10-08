/**
 * Automated tests for finance calculators.
 * Run with: npm run test:calculators
 */
import { calculateBudget } from "../src/lib/calculators/budget";
import { calculateSavings } from "../src/lib/calculators/savings";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

console.log("Budget Calculator tests");
{
  const r = calculateBudget({ monthlyIncome: 4000 });
  assert(r.isValid, "valid income succeeds");
  assert(r.needs === 2000, "50% needs = 2000");
  assert(r.wants === 1200, "30% wants = 1200");
  assert(r.savings === 800, "20% savings = 800");
  assert(r.remaining === 0, "remaining is 0");
}

{
  const r = calculateBudget({ monthlyIncome: -100 });
  assert(!r.isValid, "negative income fails");
  assert(r.errors.length > 0, "errors reported");
}

{
  const r = calculateBudget({ monthlyIncome: 5000, needsPercent: 60, wantsPercent: 20, savingsPercent: 20 });
  assert(r.isValid, "custom percentages work");
  assert(r.needs === 3000, "custom needs correct");
}

console.log("\nSavings Calculator tests");
{
  const r = calculateSavings({ monthlyDeposit: 200, annualInterestRate: 0, years: 5, initialAmount: 1000 });
  assert(r.isValid, "zero interest valid");
  assert(r.futureValue === 1000 + 200 * 60, "zero interest = linear sum");
}

{
  const r = calculateSavings({ monthlyDeposit: 100, annualInterestRate: 6, years: 1 });
  assert(r.isValid, "positive interest valid");
  assert(r.futureValue > 1200, "interest increases value");
  assert(r.totalInterest > 0, "interest earned is positive");
}

{
  const r = calculateSavings({ monthlyDeposit: -10, annualInterestRate: 5, years: 2 });
  assert(!r.isValid, "negative deposit fails");
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
