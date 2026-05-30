export type Status = "✅ Pass" | "⚠️ Warning" | "❌ Fail" | "⚪ N/A" | "❌ Error";

export type EvaluationResult = {
  category: string;
  score: number;       // -1 = N/A, 0 = error, 1-5 valid
  criteria_met: string;
  evidence: string;
  status: Status;
  comments: string;
};

export type RowRunResult = {
  pdf_filename: string;
  markdown_asset: string;
  evaluation_results: EvaluationResult[];
  markdown_table: string;
  evaluation_date: string;
};
