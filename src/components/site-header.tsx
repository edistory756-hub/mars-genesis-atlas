import { Link } from "@tanstack/react-router";

const NAV = [
  { to: "/", label: "Home", short: "Home" },
  { to: "/mars-explorer", label: "Mars Explorer", short: "Map" },
  { to: "/nasa-evidence", label: "NASA Evidence", short: "Evidence" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span aria-hidden className="size-2.5 rounded-full bg-primary shadow-glow" />
          <span className="whitespace-nowrap font-display text-sm font-semibold tracking-[0.14em] sm:tracking-[0.22em]">MARS GENESIS</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="rounded-md px-2.5 py-1.5 text-sm sm:px-3 text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.short}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
