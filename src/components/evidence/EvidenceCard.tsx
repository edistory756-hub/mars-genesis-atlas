import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, ImageOff, MapPinned, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatEvidenceDate,
  formatIsoDate,
  getPrimarySource,
  getSources,
} from "@/lib/evidence/library";
import { getEvidence } from "@/lib/evidence/records";
import {
  EVIDENCE_CATEGORIES,
  NOT_STATED,
  type EvidenceRecord,
  type EvidenceStatement,
  type KeyFinding,
  type StatementKind,
} from "@/lib/evidence/schema";
import { formatLat, formatLonEast180 } from "@/lib/mars/coords";
import { cn } from "@/lib/utils";
import { STATEMENT_KINDS } from "./statement-kinds";

const PLATFORM_LABEL = { rover: "Rover", lander: "Lander", orbiter: "Orbiter", helicopter: "Helicopter" } as const;

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
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None recorded.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((s, i) => {
            const sources = getSources(record, s.sourceIds);
            return (
              <li key={i} className={cn("rounded-r-md px-4 py-3", k.box)}>
                <span className="sr-only">{k.label}: </span>
                <p className="text-sm leading-relaxed">{s.text}</p>
                <details className="mt-1.5 text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none font-mono uppercase tracking-wider hover:text-foreground">
                    Source
                  </summary>
                  {s.quote && (
                    <blockquote className="mt-1.5 border-l border-border pl-3 italic">&ldquo;{s.quote}&rdquo;</blockquote>
                  )}
                  {sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-3 mt-1 inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
                    >
                      {source.publisher} <ExternalLink className="size-3" />
                    </a>
                  ))}
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function EvidenceImage({ record }: { record: EvidenceRecord }) {
  const [failed, setFailed] = useState(false);
  const image = record.image;
  if (!image) return null;
  const primary = getPrimarySource(record);
  return (
    <figure className="self-start overflow-hidden rounded-md border bg-background">
      {failed ? (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          <ImageOff className="size-5" />
          The source photo could not be loaded.
          <a href={primary.url} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
            View it at {primary.publisher}
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

function CoordinatesField({ record }: { record: EvidenceRecord }) {
  const { coordinates: c, coordinateAccuracy, coordinateLabel } = record;
  const region = record.location.region;
  if (coordinateAccuracy === "exact-sample" && c) {
    return (
      <span className="block">
        <span className="block font-semibold">{coordinateLabel}</span>
        <span className="mt-1 block text-muted-foreground">
          {formatLat(c.lat, 4)}, {formatLonEast180(c.lon, 4)} (Mars 2000, planetocentric)
        </span>
      </span>
    );
  }
  return (
    <span className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-2.5">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <span>
        <span className="block font-semibold">Exact sample coordinates not verified</span>
        <span className="mt-1 block text-muted-foreground">
          {c ? (
            <>
              {coordinateLabel}: {region ? `${region.name}, centre ` : ""}
              {formatLat(c.lat, 2)}, {formatLonEast180(c.lon, 2)}
              {region ? `, about ${Math.round(region.diameterKm)} km across` : ""} (Mars 2000, planetocentric).
              {region ? ` ${region.note}` : ""}
            </>
          ) : (
            <>
              {coordinateLabel}. {NOT_STATED}.
            </>
          )}
        </span>
      </span>
    </span>
  );
}

export function EvidenceCard({ record }: { record: EvidenceRecord }) {
  const { location, observationDate, publicationDate } = record;
  const primary = getPrimarySource(record);
  const onMap = Boolean(getEvidence(record.id));
  const platform = PLATFORM_LABEL[record.roverOrLander.type];
  return (
    <article id={record.id} aria-labelledby={`${record.id}-title`} className="scroll-mt-20 rounded-lg border bg-card shadow-panel">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b p-5 sm:p-6">
        <div className="min-w-0 max-w-3xl space-y-2">
          <p className="text-eyebrow">
            Evidence record · {record.roverOrLander.name}
            {record.sampleName ? ` · ${record.sampleName}` : ""}
          </p>
          <h2 id={`${record.id}-title`} className="text-2xl font-semibold leading-tight sm:text-3xl">
            {record.title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{record.summary.text}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onMap && (
            <Button asChild>
              <Link to="/mars-explorer" search={{ evidence: record.id }}>
                <MapPinned /> Show on Mars map
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <a href={primary.url} target="_blank" rel="noreferrer">
              NASA source <ExternalLink />
            </a>
          </Button>
        </div>
      </header>

      {/* Key figures */}
      {record.keyFindings.length > 0 && (
        <div className="grid grid-cols-1 border-b sm:grid-cols-3">
          {record.keyFindings.map((f) => (
            <KeyFigure key={f.id} finding={f} />
          ))}
        </div>
      )}

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Record fields */}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
          <Field label="Mission">{record.mission}</Field>
          <Field label={platform}>{record.roverOrLander.name}</Field>
          <Field label={record.instruments.length > 1 ? "Instruments" : "Instrument"}>
            {record.instruments.length ? record.instruments.join("; ") : NOT_STATED}
          </Field>
          <Field label="Category">{EVIDENCE_CATEGORIES[record.category]}</Field>
          <Field label="Location">
            <span className="block">{location.hierarchy.join(" › ")}</span>
            <span className="mt-1 block text-muted-foreground">{location.summary}</span>
          </Field>
          <Field label="Sample">
            <span className="block font-semibold">{record.sampleName ?? NOT_STATED}</span>
            {record.sampleContext && <span className="mt-1 block text-muted-foreground">{record.sampleContext}</span>}
          </Field>
          <Field label="Observation date">
            <span className="block">
              {formatEvidenceDate(observationDate)}
              {observationDate.precision && observationDate.precision !== "day" && (
                <span className="text-muted-foreground"> (exact date not stated)</span>
              )}
            </span>
            <span className="mt-1 block text-muted-foreground">{observationDate.note}</span>
          </Field>
          <Field label="Published">
            <span className="block">{formatEvidenceDate(publicationDate)}</span>
            <span className="mt-1 block text-muted-foreground">{publicationDate.note}</span>
          </Field>
          <Field label="Coordinates">
            <CoordinatesField record={record} />
          </Field>
          <Field label="Original source">
            <a href={primary.url} target="_blank" rel="noreferrer" className="break-all font-mono text-xs text-accent underline-offset-4 hover:underline">
              {primary.url}
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
                {s.publishedDate ? ` · ${formatIsoDate(s.publishedDate)}` : ""} · {s.supports}
                {s.reviewStatus === "not-reviewed" && (
                  <span className="ml-1.5 font-mono uppercase tracking-wider text-warning">Not reviewed here</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </footer>
    </article>
  );
}

function KeyFigure({ finding }: { finding: KeyFinding }) {
  const k = STATEMENT_KINDS[finding.kind];
  if (typeof finding.value === "number") {
    return (
      <div className="flex items-center gap-4 border-t p-5 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
        <span className={cn("font-display text-5xl font-semibold leading-none", k.text)}>{finding.value}</span>
        <span className="space-y-1">
          <StatementKindBadge kind={finding.kind} />
          <span className="block text-sm leading-snug">{finding.label}</span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col justify-center gap-1 border-t p-5 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <StatementKindBadge kind={finding.kind} />
      <p className="font-display text-lg font-semibold leading-snug">{finding.value}</p>
      {finding.detail && <p className="text-xs text-muted-foreground">{finding.detail}</p>}
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
