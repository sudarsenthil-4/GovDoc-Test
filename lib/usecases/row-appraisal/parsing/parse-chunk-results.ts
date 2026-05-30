import type { EvaluationResult, Status } from "../types";
import { VALID_CATEGORIES } from "../data/valid-categories";

export function normalizeStatus(raw: string): Status {
  const s = raw.toLowerCase().replace(/[^\w/]/g, " ").trim();
  if (s.includes("pass")) return "✅ Pass";
  if (s.includes("warning")) return "⚠️ Warning";
  if (s.includes("n/a") || s === "n a") return "⚪ N/A";
  if (s.includes("fail")) return "❌ Fail";
  if (s.includes("error")) return "❌ Error";
  return "❌ Error";
}

function mapCategory(raw: string, expectedCategories: string[]): string | null {
  const trimmed = raw.trim();

  // 1. Exact match
  for (const valid of VALID_CATEGORIES) {
    if (valid === trimmed) return valid;
  }

  // 2. Case-insensitive exact match
  const lower = trimmed.toLowerCase();
  for (const valid of VALID_CATEGORIES) {
    if (valid.toLowerCase() === lower) return valid;
  }

  // 3. Longest-substring match (port of legacy lines 1037-1049)
  const candidates: string[] = [];
  for (const valid of VALID_CATEGORIES) {
    if (valid.toLowerCase().includes(lower) || lower.includes(valid.toLowerCase())) {
      candidates.push(valid);
    }
  }
  if (candidates.length > 0) {
    const expectedCandidates = candidates.filter((c) => expectedCategories.includes(c));
    if (expectedCandidates.length > 0) {
      return expectedCandidates.reduce((a, b) => (a.length >= b.length ? a : b));
    }
    return candidates.reduce((a, b) => (a.length >= b.length ? a : b));
  }

  return null;
}

function parseScore(scoreRaw: unknown): { score: number; valid: boolean } {
  if (typeof scoreRaw === "number" && Number.isInteger(scoreRaw) && scoreRaw >= 1 && scoreRaw <= 5) {
    return { score: scoreRaw, valid: true };
  }
  if (typeof scoreRaw === "string") {
    const trimmed = scoreRaw.trim();
    if (/^N\/A$/i.test(trimmed)) return { score: -1, valid: true };
    const m = trimmed.match(/^(-?\d+)$/);
    if (m && +m[1]! >= 1 && +m[1]! <= 5) return { score: +m[1]!, valid: true };
  }
  return { score: 0, valid: false };
}

export function parseChunkResults(
  responseContent: string,
  expectedCategories: string[],
): EvaluationResult[] {
  const results: EvaluationResult[] = [];
  let content = responseContent.trim();

  // Strip markdown fences
  if (content.startsWith("```json")) content = content.slice(7);
  if (content.startsWith("```")) content = content.slice(3);
  if (content.endsWith("```")) content = content.slice(0, -3);
  content = content.trim();

  if (!content) return results;

  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return results;
  }

  if (!Array.isArray(data)) return results;

  for (const item of data) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) continue;

    const record = item as Record<string, unknown>;
    const rawCategory = typeof record.category === "string" ? record.category : "";
    const mapped = mapCategory(rawCategory, expectedCategories);
    if (!mapped) continue;

    const { score, valid } = parseScore(record.score);
    const criteria_met = String(record.criteria_met ?? "Not specified").trim();
    const evidence = String(record.evidence ?? "No evidence")
      .trim()
      .replace(/\s+/g, " ");
    const status = !valid
      ? "❌ Error"
      : normalizeStatus(String(record.status ?? "❌ Fail").trim());
    const comments = String(record.comments ?? "").trim();

    results.push({ category: mapped, score, criteria_met, evidence, status, comments });
  }

  return results;
}
