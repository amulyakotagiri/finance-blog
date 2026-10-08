import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Disclaimer",
  description: "Important information about the educational nature of content on Money Sense.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 prose">
      <h1>Financial Disclaimer</h1>
      <p>
        Money Sense provides general educational information about personal finance topics.
        Nothing on this website constitutes personalized financial, investment, tax, or legal advice.
      </p>
      <p>
        The content, tools, and calculators are illustrative only. They make simplifying assumptions
        that may not apply to your situation. Past performance of any investment type mentioned is
        not indicative of future results.
      </p>
      <p>
        You should consider your own financial circumstances, goals, and risk tolerance, and consult
        a qualified professional (financial advisor, accountant, or attorney) before making decisions
        that affect your money.
      </p>
      <p>
        We do not guarantee the accuracy, completeness, or timeliness of any information. We are not
        responsible for any actions you take based on content from this site.
      </p>
    </div>
  );
}
