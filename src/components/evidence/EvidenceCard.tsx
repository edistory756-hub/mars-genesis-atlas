import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, ImageOff, MapPinned, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getSource,
  type EvidenceRecord,
  type EvidenceStatement,
  type StatementKind,
} from "@/lib/evidence/records";
import { formatLat, formatLonEast180 } from "@/lib/mars/coords";
import { cn } from "@/lib/utils";
import { STATEMENT_KINDS } from "./statement-kinds";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function StatementKindBadge({ kind }: { kind: StatementKind }) {
  const k = STATEMENT_KINDS[kind];
  const Icon = k.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]", k.text)}>
      <Icon className="size-3.5" aria-hidden />
      {k.label}
    </span>
  );
}

function StatementList({ record, kind, items }: { record: EvidenceRecord; kind: StatementKind; items: EvidenceStatement[] }) {
  const k = STATEMENT_KINDS[kind];
  const Icon = k.icon;
  return (
    <section aria-labelledby={`${record.id}-${kind}`} className="space-y-3">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id={`${record.id}-${kind}`} className={cn("flex items-center gap-2 text-base font-semibold", k.text)}>
          <Icon className="size-4" aria-hidden />
          {k.plural}
        </h3>
        <p className="text-xs text-muted-foreground">{k.description}</p>
      </header>
      <ul className="space-y-2">
        {items.map((s, i) => {
          const source = getSource(record, s.sourceId);
          return (
            <li key={i} className={cn("rounded-r-md px-4 py-3", k.box)}>
              <span className="sr-only">{k.label}: </span>
              <p className="text-sm leading-relaxed">{s.text}</p>
              {(s.quote || source) && (
                <details className="mt-1.5 text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none font-mono uppercase tracking-wider hover:text-foreground">
                    Source
                  </summary>
                  {s.quote && (
                    <blockquote className="mt-1.5 border-l border-border pl-3 italic">&ldquo;{s.quote}&rdquo;</blockquote>
                  )}
                  {source && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
                    >
                      {source.publisher} <ExternalLink className="size-3" />
                    </a>
                  )}
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EvidenceImage({ record }: { record: EvidenceRecord }) {
  const [failed, setFailed] = useState(false);
  const image = record.image;
  if (!image) return null;
  return (
    <figure className="self-start overflow-hidden rounded-md border bg-background">
      {failed ? (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          <ImageOff className="size-5" />
          NASA's photo could not be loaded.
          <a href={record.primarySourceUrl} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
            View it on nasa.gov
          </a>
        </div>
      ) : (
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="aspect-[4/3] w-full object-cover"
        />
      )}
      <figcaption className="space-y-1 p-3 text-xs text-muted-foreground">
        <p className="text-foreground/90">{image.caption}</p>
        <p className="font-mono uppercase tracking-wider">Credit: {image.credit}</p>
      </figcaption>
    </figure>
  );
}

export function EvidenceCard({ record }: { record: EvidenceRecord }) {
  const { location, dates, findings, sample } = record;
  const loc = location.locator;
  return (
    <article id={record.id} aria-labelledby={`${record.id}-title`} className="scroll-mt-20 rounded-lg border bg-card shadow-panel">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b p-5 sm:p-6">
        <div className="min-w-0 space-y-2">
          <p className="text-eyebrow">Evidence record · {record.rover} · {sample.name}</p>
          <h2 id={`${record.id}-title`} className="text-2xl font-semibold leading-tight sm:text-3xl">
            {record.title}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/mars-explorer" search={{ evidence: record.id }}>
              <MapPinned /> Show on Mars map
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={record.primarySourceUrl} target="_blank" rel="noreferrer">
              NASA source <ExternalLink />
            </a>
          </Button>
        </div>
      </header>

      {/* Key figures */}
      <div className="grid grid-cols-1 border-b sm:grid-cols-3">
        <Figure value={String(findings.carbonMoleculesIdentified)} label="carbon-containing molecules identified" />
        <Figure value={String(findings.firstTimeOnMars)} label="detected for the first time on Mars" />
        <div className="flex flex-col justify-center gap-1 border-t p-5 sm:border-l sm:border-t-0">
          <StatementKindBadge kind="hypothesis" />
          <p className="font-display text-lg font-semibold leading-snug">Origin not established</p>
          <p className="text-xs text-muted-foreground">Biological or geological; either is possible.</p>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Record fields */}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
          <Field label="Mission">{record.mission}</Field>
          <Field label="Rover">{record.rover}</Field>
          <Field label="Instrument">{record.instrument}</Field>
          <Field label="Location">
            <span className="block">{location.hierarchy.join(" › ")}</span>
            <span className="mt-1 block text-muted-foreground">{location.summary}</span>
          </Field>
          <Field label="Sample">
            <span className="block font-semibold">{sample.name}</span>
            <span className="mt-1 block text-muted-foreground">{sample.context}</span>
          </Field>
          <Field label="Observation date">
            <span className="block">{dates.sampledOn ? formatDate(dates.sampledOn) : "Exact date not verified"}</span>
            <span className="mt-1 block text-muted-foreground">{dates.sampledSummary}</span>
          </Field>
          <Field label="Published">
            <span className="block">{formatDate(dates.findingsPublished)}</span>
            <span className="mt-1 block text-muted-foreground">{dates.findingsPublishedSummary}</span>
          </Field>
          <Field label="Coordinates">
            <span className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-2.5">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>
                <span className="block font-semibold">Exact sample coordinates not verified</span>
                <span className="mt-1 block text-muted-foreground">
                  Approximate locator: {loc.name}, centre {formatLat(loc.center.lat, 2)}, {formatLonEast180(loc.center.lon, 2)},
                  about {Math.round(loc.diameterKm)} km across (Mars 2000, planetocentric). {loc.note}
                </span>
              </span>
            </span>
          </Field>
          <Field label="Original source">
            <a href={record.primarySourceUrl} target="_blank" rel="noreferrer" className="break-all font-mono text-xs text-accent underline-offset-4 hover:underline">
              {record.primarySourceUrl}
            </a>
          </Field>
        </dl>

        <EvidenceImage record={record} />
      </div>

      {/* Statements, grouped and styled by kind */}
      <div className="grid gap-8 border-t p-5 sm:p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <StatementList record={record} kind="observation" items={record.observations} />
          <StatementList record={record} kind="interpretation" items={record.interpretations} />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <StatementList record={record} kind="hypothesis" items={record.hypotheses} />
          <StatementList record={record} kind="unknown" items={record.unknowns} />
        </div>
      </div>

      {/* Sources */}
      <footer className="border-t p-5 sm:p-6">
        <h3 className="mb-3 text-sm font-semibold">Sources</h3>
        <ol className="space-y-2 text-sm">
          {record.sources.map((s) => (
            <li key={s.id} className="grid gap-0.5">
              <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline">
                {s.title} <ExternalLink className="size-3 shrink-0" />
              </a>
              <span className="text-xs text-muted-foreground">
                {s.publisher}
                {s.published ? ` · ${formatDate(s.published)}` : ""} · {s.role}
              </span>
            </li>
          ))}
        </ol>
      </footer>
    </article>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-4 border-t p-5 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <span className="font-display text-5xl font-semibold leading-none text-observation">{value}</span>
      <span className="space-y-1">
        <StatementKindBadge kind="observation" />
        <span className="block text-sm leading-snug">{label}</span>
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-eyebrow pt-0.5">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}
