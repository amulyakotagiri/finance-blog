"use client";

import { useState } from "react";
import { calculateBudget } from "@/lib/calculators/budget";
import { CURRENCIES, formatMoney } from "@/lib/currency";

export function BudgetCalculator() {
  const [currency, setCurrency] = useState("INR");
  const [income, setIncome] = useState("40000");
  const [needs, setNeeds] = useState("50");
  const [wants, setWants] = useState("30");
  const [savings, setSavings] = useState("20");
  const [result, setResult] = useState(() =>
    calculateBudget({ monthlyIncome: 40000 })
  );

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    const r = calculateBudget({
      monthlyIncome: parseFloat(income) || 0,
      needsPercent: parseFloat(needs) || 0,
      wantsPercent: parseFloat(wants) || 0,
      savingsPercent: parseFloat(savings) || 0,
    });
    setResult(r);
  }

  const money = (n: number) => formatMoney(n, currency);

  return (
    <div className="border border-border rounded-md bg-card p-6">
      <h3 className="text-lg font-semibold mb-1">Budget calculator</h3>
      <p className="text-sm text-muted mb-6">
        Split take-home pay using the 50/30/20 guideline or your own percentages.
      </p>

      <form onSubmit={handleCalculate} className="space-y-4">
        <div>
          <label htmlFor="budget-currency" className="block text-sm font-medium mb-1">
            Currency
          </label>
          <select
            id="budget-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="income" className="block text-sm font-medium mb-1">
            Monthly take-home income
          </label>
          <input
            id="income"
            type="number"
            min="0"
            step="any"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="needs" className="block text-sm font-medium mb-1">
              Needs %
            </label>
            <input
              id="needs"
              type="number"
              min="0"
              max="100"
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="wants" className="block text-sm font-medium mb-1">
              Wants %
            </label>
            <input
              id="wants"
              type="number"
              min="0"
              max="100"
              value={wants}
              onChange={(e) => setWants(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="savings" className="block text-sm font-medium mb-1">
              Savings %
            </label>
            <input
              id="savings"
              type="number"
              min="0"
              max="100"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Calculate
        </button>
      </form>

      {result.errors.length > 0 && (
        <div
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-danger"
          role="alert"
        >
          {result.errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {result.isValid && (
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-accent-soft rounded-md">
              <p className="text-xs text-muted uppercase tracking-wide">Needs</p>
              <p className="text-lg font-semibold mt-1">{money(result.needs)}</p>
            </div>
            <div className="p-3 bg-accent-soft rounded-md">
              <p className="text-xs text-muted uppercase tracking-wide">Wants</p>
              <p className="text-lg font-semibold mt-1">{money(result.wants)}</p>
            </div>
            <div className="p-3 bg-accent-soft rounded-md">
              <p className="text-xs text-muted uppercase tracking-wide">Savings</p>
              <p className="text-lg font-semibold mt-1">{money(result.savings)}</p>
            </div>
          </div>
          {result.remaining !== 0 && (
            <p className="text-sm text-muted">
              Unallocated: {money(result.remaining)}
            </p>
          )}
        </div>
      )}

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer font-medium text-muted hover:text-foreground">
          Assumptions & methodology
        </summary>
        <ul className="mt-2 space-y-1 text-muted list-disc pl-5">
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
          <li>
            Currency is for display only. Amounts are not converted between currencies.
          </li>
        </ul>
      </details>
    </div>
  );
}