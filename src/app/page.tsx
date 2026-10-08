import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero – clean editorial, no gradients or glass */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24">
          <p className="text-sm font-medium text-accent mb-3 tracking-wide uppercase">
            Personal Finance Education
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground max-w-2xl leading-[1.15]">
            Understand money.
            <br />
            Build better habits.
          </h1>
          <p className="mt-5 text-lg text-muted max-w-xl leading-relaxed">
            Clear explanations of budgeting, saving and investing written for students and young adults — no jargon, no hype.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Read articles
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent-soft transition-colors"
            >
              Try the tools
            </Link>
          </div>
        </div>
      </section>

      {/* Featured topics – simple list, not card grid */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
        <h2 className="text-xl font-semibold tracking-tight mb-8">Start here</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Budgeting basics",
              desc: "How to give every dollar a job without feeling restricted.",
              href: "/blog",
            },
            {
              title: "Emergency funds",
              desc: "Why three to six months of expenses matters and how to build one.",
              href: "/blog",
            },
            {
              title: "First investments",
              desc: "Index funds, risk, and what to ignore when starting out.",
              href: "/blog",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group block border border-border rounded-md p-5 bg-card hover:border-accent/40 transition-colors"
            >
              <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Tools teaser */}
      <section className="border-t border-border bg-accent-soft/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14">
          <h2 className="text-xl font-semibold tracking-tight mb-2">Interactive tools</h2>
          <p className="text-muted mb-6 max-w-lg">
            Simple calculators that show their assumptions clearly. No sign-up, no data stored.
          </p>
          <Link href="/tools" className="text-accent font-medium hover:underline underline-offset-2">
            Open finance tools →
          </Link>
        </div>
      </section>

      {/* Disclaimer strip */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <p className="text-xs text-muted leading-relaxed max-w-3xl">
            Money Sense provides educational information only. Nothing on this site is personalized financial, investment or tax advice. Always consider your own circumstances and consult a qualified professional when needed.
          </p>
        </div>
      </section>
    </div>
  );
}
