"use client";

import { useState } from "react";
import { calculateSavings } from "@/lib/calculators/savings";
import { CURRENCIES, formatMoney } from "@/lib/currency";

export function SavingsCalculator() {
  const [currency, setCurrency] = useState("INR");
  const [monthly, setMonthly] = useState("5000");
  const [rate, setRate] = useState("6");
  const [years, setYears] = useState("10");
  const [initial, setInitial] = useState("0");
  const [result, setResult] = useState(() =>
    calculateSavings({
      monthlyDeposit: 5000,
      annualInterestRate: 6,
      years: 10,
    })
  );

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    const r = calculateSavings({
      monthlyDeposit: parseFloat(monthly) || 0,
      annualInterestRate: parseFloat(rate) || 0,
      years: parseFloat(years) || 0,
      initialAmount: parseFloat(initial) || 0,
    });
    setResult(r);
  }

  const money = (n: number) => formatMoney(n, currency);

  return (
    <div className="border border-border rounded-md bg-card p-6">
      <h3 className="text-lg font-semibold mb-1">Savings goal calculator</h3>
      <p className="text-sm text-muted mb-6">
        Estimate the future value of regular monthly deposits with optional interest.
      </p>

      <form onSubmit={handleCalculate} className="space-y-4">
        <div>
          <label htmlFor="savings-currency" className="block text-sm font-medium mb-1">
            Currency
          </label>
          <select
            id="savings-currency"
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

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="monthly" className="block text-sm font-medium mb-1">
              Monthly deposit
            </label>
            <input
              id="monthly"
              type="number"
              min="0"
              step="any"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="initial" className="block text-sm font-medium mb-1">
              Starting amount
            </label>
            <input
              id="initial"
              type="number"
              min="0"
              step="any"
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="rate" className="block text-sm font-medium mb-1">
              Annual interest rate (%)
            </label>
            <input
              id="rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="years" className="block text-sm font-medium mb-1">
              Years
            </label>
            <input
              id="years"
              type="number"
              min="0.1"
              max="100"
              step="0.5"
              value={years}
              onChange={(e) => setYears(e.target.value)}
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
        <div className="mt-6 space-y-2">
          <div className="p-4 bg-accent-soft rounded-md">
            <p className="text-xs text-muted uppercase tracking-wide">
              Estimated future value
            </p>
            <p className="text-2xl font-semibold mt-1">
              {money(result.futureValue)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted">Total deposits</p>
              <p className="font-medium">{money(result.totalDeposits)}</p>
            </div>
            <div>
              <p className="text-muted">Estimated interest</p>
              <p className="font-medium">{money(result.totalInterest)}</p>
            </div>
          </div>
        </div>
      )}

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer font-medium text-muted hover:text-foreground">
          Assumptions & methodology
        </summary>
        <p className="mt-2 text-muted">{result.methodology}</p>
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