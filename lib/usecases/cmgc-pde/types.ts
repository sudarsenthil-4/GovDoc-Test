import type { Rating, DeliveryMethod } from "./rubric";

export type CmgcRating = {
  question_id: string;
  question_text: string;
  source_reasoning: string;
  missing_info_reasoning: string;
  selected_rating: Rating;
  confidence: number;
  missing_info: boolean;
};

export type CmgcEvaluation = {
  project_name: string;
  project_ea: string;
  district: string;
  evaluation_date: string;
  ratings: CmgcRating[];
  missing_questions: string[];
  summary: string;
};

export type OverrideStatus = {
  rule_id: string;
  rule_name: string;
  trigger_condition: string;
  description: string;
  triggered: boolean;
  blocks: string[];
  favors: string;
};

export type KeyDriver = {
  question_id: string;
  raw_score: number;
  rating: Rating;
  section: string;
  weighted_contribution: number;
};

export type RecommendationResult = {
  composite_score: number;
  section_scores: Record<string, number>;
  raw_scores: Record<string, number>;
  weighted_scores: Record<string, number>;
  override_status: OverrideStatus[];
  key_drivers: KeyDriver[];
  recommended_method: DeliveryMethod | string;
  recommended_score: number;
  runner_up_method: DeliveryMethod | string | null;
  runner_up_score: number | null;
  is_borderline: boolean;
  comparison_text: string;
  override_reasons: string[];
};

export type MethodScore = {
  method: DeliveryMethod | string;
  score: number;
  rank: number;
  blocked: boolean;
  block_reasons: string[];
  pros: string[];
  cons: string[];
  key_factors: string[];
  key_factors_reasoning?: string;
};

export type MultiMethodResult = {
  method_scores: MethodScore[];
  borderline_comparison: {
    is_close: boolean;
    score_gap: number;
    methods: {
      method: string;
      score: number;
      pros: string[];
      cons: string[];
      key_factors: string[];
    }[];
  } | null;
  override_status: OverrideStatus[];
};

export type CmgcRunResult = {
  evaluation: CmgcEvaluation;
  recommendation: RecommendationResult;
  multi_method: MultiMethodResult;
};
