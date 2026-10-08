import Link from "next/link";

const nav = [
  { href: "/blog", label: "Articles" },
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight text-foreground hover:text-accent transition-colors">
          Money Sense
        </Link>
        <nav className="flex items-center gap-6 text-sm" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
