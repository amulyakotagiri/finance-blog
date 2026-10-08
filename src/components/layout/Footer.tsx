import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-3 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-2">Money Sense</p>
            <p className="text-muted leading-relaxed">
              Practical personal finance education for students and young adults.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">Explore</p>
            <ul className="space-y-1.5 text-muted">
              <li><Link href="/blog" className="hover:text-foreground">Articles</Link></li>
              <li><Link href="/tools" className="hover:text-foreground">Finance Tools</Link></li>
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">Legal</p>
            <ul className="space-y-1.5 text-muted">
              <li><Link href="/legal/disclaimer" className="hover:text-foreground">Financial Disclaimer</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-foreground">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-xs text-muted">
          <p>
            © {new Date().getFullYear()} Money Sense. Educational content only — not personalized financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
