import { createFileRoute } from "@tanstack/react-router";

import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { STATEMENT_KINDS, STATEMENT_KIND_ORDER } from "@/components/evidence/statement-kinds";
import { EVIDENCE_LIBRARY } from "@/lib/evidence/library";
import { cn } from "@/lib/utils";

const OG_IMAGE = EVIDENCE_LIBRARY[0]?.image?.src;

export const Route = createFileRoute("/nasa-evidence")({
  head: () => ({
    meta: [
      { title: "NASA Evidence — MARS GENESIS" },
      {
        name: "description",
        content:
          "Verified NASA findings from Mars, starting with Curiosity's Mary Anning 3 sample: 21 organic molecules, seven new to Mars, origin not established.",
      },
      { property: "og:title", content: "NASA Evidence — MARS GENESIS" },
      {
        property: "og:description",
        content: "Curiosity's Mary Anning 3 sample: observations, interpretations and open questions, sourced from NASA.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(OG_IMAGE
        ? [
            { property: "og:image", content: OG_IMAGE },
            { name: "twitter:image", content: OG_IMAGE },
          ]
        : []),
    ],
  }),
  component: NasaEvidencePage,
});

function NasaEvidencePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6 space-y-3">
        <p className="text-eyebrow">Module 02 · Verified NASA findings</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">NASA Evidence</h1>
        <p className="max-w-2xl text-muted-foreground">
          Each record is built only from official sources and links back to them. What was measured, what scientists
          conclude, and what remains open are kept separate.
        </p>
      </header>

      <section aria-label="How to read these records" className="mb-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {STATEMENT_KIND_ORDER.map((kind) => {
          const k = STATEMENT_KINDS[kind];
          const Icon = k.icon;
          return (
            <div key={kind} className={cn("rounded-r-md px-3 py-2.5", k.box)}>
              <p className={cn("flex items-center gap-1.5 text-sm font-semibold", k.text)}>
                <Icon className="size-4" aria-hidden /> {k.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{k.description}</p>
            </div>
          );
        })}
      </section>

      <div className="space-y-10">
        {EVIDENCE_LIBRARY.map((r) => (
          <EvidenceCard key={r.id} record={r} />
        ))}
      </div>
    </main>
  );
}
