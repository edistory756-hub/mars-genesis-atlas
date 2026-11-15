import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MARS GENESIS — Exploring life's origins and humanity's future on Mars" },
      {
        name: "description",
        content:
          "MARS GENESIS explores Mars with real NASA data: surface maps, mission evidence, the origins of life and human survival.",
      },
      { property: "og:title", content: "MARS GENESIS" },
      {
        property: "og:description",
        content: "Explore Mars with real NASA data, starting with live Mars Trek maps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-horizon" />
      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col justify-center gap-8 px-4 py-16 sm:px-6">
        <p className="text-eyebrow">Research platform · Mars</p>
        <h1 className="text-5xl font-semibold leading-[1.02] sm:text-7xl">
          MARS
          <br />
          <span className="text-primary">GENESIS</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Where life might have begun, and how humans could survive there — built on real NASA data
          and cited sources.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/mars-explorer">
              Open Mars Explorer <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
