import type { Metadata } from "next";
import { BudgetCalculator } from "@/components/tools/BudgetCalculator";
import { SavingsCalculator } from "@/components/tools/SavingsCalculator";

export const metadata: Metadata = {
  title: "Finance Tools",
  description:
    "Free personal finance calculators: budget planner and savings goal estimator. Clear assumptions, no data stored.",
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Finance tools</h1>
        <p className="mt-2 text-muted max-w-xl">
          Simple calculators that show their math and assumptions. Nothing is stored on our servers.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <BudgetCalculator />
        <SavingsCalculator />
      </div>

      <p className="mt-10 text-xs text-muted max-w-2xl leading-relaxed">
        These tools are for educational purposes only. Results are estimates based on the inputs and assumptions you provide. They are not financial advice.
      </p>
    </div>
  );
}
