import { RUBRIC_QUESTIONS, type Rating } from "../rubric";
import type { CmgcEvaluation, CmgcRating, CmgcRunResult } from "../types";
import { computeDeliveryRecommendation } from "./compute-recommendation";
import { scoreAllMethods } from "./score-all-methods";

/**
 * Build a baseline 25-rating fixture (all "B") with optional per-question overrides.
 * Used across M4-M7 tests.
 */
export function mockRatings(overrides: Partial<Record<string, Rating>> = {}): CmgcRating[] {
  return RUBRIC_QUESTIONS.map((q) => ({
    question_id: q.id,
    question_text: q.question,
    source_reasoning: `Mock evidence for ${q.id}`,
    missing_info_reasoning: "None — all evidence present.",
    selected_rating: (overrides[q.id] ?? "B") as Rating,
    confidence: 0.85,
    missing_info: false,
  }));
}

export function mockEvaluation(overrides: Partial<Record<string, "A" | "B" | "C">> = {}): CmgcEvaluation {
  return {
    project_name: "Test Project",
    project_ea: "0421000123",
    district: "04",
    evaluation_date: "2026-05-05",
    ratings: mockRatings(overrides),
    missing_questions: [],
    summary: "Mock evaluation summary.",
  };
}

export function mockRunResult(overrides: Partial<Record<string, "A" | "B" | "C">> = {}): CmgcRunResult {
  const evaluation = mockEvaluation(overrides);
  const recommendation = computeDeliveryRecommendation(evaluation.ratings);
  const multi_method = scoreAllMethods(evaluation.ratings);
  return { evaluation, recommendation, multi_method };
}
