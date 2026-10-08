import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Money Sense — practical personal finance education.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight mb-6">About Money Sense</h1>
      <div className="prose">
        <p>
          Money Sense exists to make personal finance clearer for students and young adults.
          We focus on practical explanations of budgeting, saving, and investing — without jargon
          or unrealistic promises.
        </p>
        <p>
          Everything on this site is educational. We do not sell financial products, and we do not
          give personalized advice. Our goal is to help you understand concepts so you can make
          better decisions with the professionals and resources that fit your situation.
        </p>
        <p>
          Content is written and reviewed by humans. Calculators show their assumptions so you can
          judge whether the results apply to you.
        </p>
      </div>
    </div>
  );
}
