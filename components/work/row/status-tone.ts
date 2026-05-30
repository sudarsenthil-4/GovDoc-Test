export type RowStatus = "Pass" | "Warning" | "Fail" | "N/A" | "Error";

type ToneClasses = {
  cell: string;
  rowBorder: string;
};

// Theme-tokens-only palette — Pass/Warning/Fail/N/A read clearly against the
// cream background using only --primary / --destructive / --muted / --border.
// Status differentiation comes from text weight + left-border accent, not
// from saturated cell backgrounds. (Earlier caltrans hexes and emerald/rose
// variants both retired 2026-05-14 for theme consistency.)
export const STATUS_TONE: Record<RowStatus, ToneClasses> = {
  Pass:    { cell: "bg-card text-foreground font-semibold",                rowBorder: "border-l-4 border-l-primary" },
  Warning: { cell: "bg-card text-foreground font-semibold italic",         rowBorder: "border-l-4 border-l-muted-foreground" },
  Fail:    { cell: "bg-destructive/5 text-destructive font-semibold",      rowBorder: "border-l-4 border-l-destructive" },
  "N/A":   { cell: "bg-muted text-muted-foreground",                       rowBorder: "border-l-4 border-l-border" },
  Error:   { cell: "bg-destructive/5 text-destructive font-semibold",      rowBorder: "border-l-4 border-l-destructive" },
};

export function statusFromScore(score: number): RowStatus {
  if (score === -1) return "N/A";
  if (score === 0) return "Error";
  if (score >= 4) return "Pass";
  if (score === 3) return "Warning";
  return "Fail";
}
