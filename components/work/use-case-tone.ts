import type { UseCaseId } from "@/lib/usecases/types";

export type UseCaseTone = "blue" | "indigo" | "green";

type ToneClasses = {
  iconBg: string;
  iconFg: string;
  ring: string;
};

export const USE_CASE_TONE: Record<UseCaseId, UseCaseTone> = {
  "cmgc-pde": "indigo",
  "cucp-reevals": "blue",
  "row-appraisal": "green",
};

export const USE_CASE_FAMILY: Record<UseCaseId, string> = {
  "cmgc-pde": "Procurement & Contract",
  "cucp-reevals": "Certification & Eligibility",
  "row-appraisal": "Real Property & Appraisal",
};

export const TONE_CLASSES: Record<UseCaseTone, ToneClasses> = {
  blue: {
    iconBg: "bg-[oklch(0.94_0.04_254)]",
    iconFg: "text-[oklch(0.42_0.13_254)]",
    ring: "ring-[oklch(0.42_0.13_254)]/15",
  },
  indigo: {
    iconBg: "bg-[oklch(0.94_0.05_280)]",
    iconFg: "text-[oklch(0.45_0.15_280)]",
    ring: "ring-[oklch(0.45_0.15_280)]/15",
  },
  green: {
    iconBg: "bg-[oklch(0.94_0.05_150)]",
    iconFg: "text-[oklch(0.48_0.14_150)]",
    ring: "ring-[oklch(0.48_0.14_150)]/20",
  },
};
