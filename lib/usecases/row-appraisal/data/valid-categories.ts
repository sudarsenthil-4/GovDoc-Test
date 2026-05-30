export const VALID_CATEGORIES = [
  "Title Page", "Certificate of Appraiser", "Senior Review Certificate",
  "Subject Assessor Map", "Subject Photos", "RW 7-9", "Scope of Work",
  "General Assumptions & Limiting Conditions", "Introduction", "Area Description",
  "Parcel Description", "HABU Vacant", "HABU Improved", "HABU Reconciliation",
  "Construction in the Manner Proposed", "Methodology", "Sales Comparison Approach (If used)",
  "Income Approach (If used)", "Cost Approach (If Used)", "Reconciliation",
  "The Acquisition - Land", "Improvements", "After Analysis (if required)",
  "Cost to Cure", "Construction Contract Work", "Summary of Just Compensation",
  "Comparable Summary Page", "Comparable Map Sheet", "Comparable Data Sheets",
  "Appraisal Maps", "Appraisal Terms", "Delegations",
  "COS & HMDD",
  "Diary, Notice of Decision to Appraise & Loss of Business Goodwill",
] as const;

export type Category = (typeof VALID_CATEGORIES)[number];

export const DEPENDENCY_GROUPS = {
  DELEGATION: ["Title Page", "Certificate of Appraiser", "Senior Review Certificate", "Delegations"],
  HABU: ["HABU Vacant", "HABU Improved", "HABU Reconciliation"],
  APPROACHES: ["Methodology", "Sales Comparison Approach (If used)", "Income Approach (If used)", "Cost Approach (If Used)", "Reconciliation"],
  ACQUISITION: ["The Acquisition - Land", "Improvements", "After Analysis (if required)", "Cost to Cure", "Construction Contract Work"],
  DOCUMENTS: ["COS & HMDD", "Diary, Notice of Decision to Appraise & Loss of Business Goodwill"],
} as const;

export const VISION_FALLBACK_CATEGORIES = new Set<string>([
  "Subject Assessor Map", "Subject Photos", "Comparable Map Sheet", "Appraisal Maps",
]);
