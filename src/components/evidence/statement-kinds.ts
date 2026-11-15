import { Eye, HelpCircle, Lightbulb, FlaskConical, type LucideIcon } from "lucide-react";

import type { StatementKind } from "@/lib/evidence/records";

export interface StatementKindStyle {
  label: string;
  plural: string;
  description: string;
  icon: LucideIcon;
  /** Text colour for the kind's label and icon. */
  text: string;
  /** Left border + tinted background; border style differs per kind. */
  box: string;
}

export const STATEMENT_KINDS: Record<StatementKind, StatementKindStyle> = {
  observation: {
    label: "Observation",
    plural: "Observations",
    description: "What was measured or detected.",
    icon: Eye,
    text: "text-observation",
    box: "border-l-4 border-solid border-observation bg-observation/5",
  },
  interpretation: {
    label: "Interpretation",
    plural: "Scientific interpretation",
    description: "What NASA scientists conclude the measurements mean.",
    icon: Lightbulb,
    text: "text-interpretation",
    box: "border-l-4 border-double border-interpretation bg-interpretation/5",
  },
  hypothesis: {
    label: "Hypothesis",
    plural: "Hypotheses",
    description: "Possible explanations that remain untested or unresolved.",
    icon: FlaskConical,
    text: "text-hypothesis",
    box: "border-l-4 border-dashed border-hypothesis bg-hypothesis/5",
  },
  unknown: {
    label: "Unknown",
    plural: "Unknowns and limitations",
    description: "What is not known, or what this record cannot tell you.",
    icon: HelpCircle,
    text: "text-unknown",
    box: "border-l-4 border-dotted border-unknown bg-muted/40",
  },
};

export const STATEMENT_KIND_ORDER: StatementKind[] = ["observation", "interpretation", "hypothesis", "unknown"];
