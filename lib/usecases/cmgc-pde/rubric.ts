export type Rating = "A" | "B" | "C";

export type RubricQuestion = {
  id: string;
  section: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
};

export const RUBRIC_QUESTIONS: readonly RubricQuestion[] = [
  // --- Section A: Project Scope & Characteristics (Table 3, A1-A10) ---
  {
    id: "A1",
    section: "A: Project Scope & Characteristics",
    question: "Where is the Project in the project development process?",
    option_a: "Detailed or final engineering stage (60% design or later).",
    option_b: "Preliminary design (30% design).",
    option_c: "Conceptual engineering stage (before PA&ED).",
  },
  {
    id: "A2",
    section: "A: Project Scope & Characteristics",
    question: "What is the size of the Project?",
    option_a: "Small project (less than $25 million construction capital cost).",
    option_b: "Medium size project (between $25 to $75 million construction capital cost).",
    option_c: "Large project (greater than $75 million construction capital cost).",
  },
  {
    id: "A3",
    section: "A: Project Scope & Characteristics",
    question: "What is the complexity of the Project?",
    option_a: "Relatively simple project with no need for specialized outside expertise.",
    option_b: "Project with more technically complex components and schedule complexity.",
    option_c: "Very complex project with significant schedule complexity (e.g., multiple phases, extensive third-party issues, and/or specialized expertise needed).",
  },
  {
    id: "A4",
    section: "A: Project Scope & Characteristics",
    question: "Does the Project involve significant impacts to highway users and local businesses/community during construction?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "A5",
    section: "A: Project Scope & Characteristics",
    question: "Does the Project present right of way limitations that would benefit from the Entity's assistance?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "A6",
    section: "A: Project Scope & Characteristics",
    question: "Does the Project present environmental permitting issues that would benefit from the Entity's assistance?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "A7",
    section: "A: Project Scope & Characteristics",
    question: "Does the Project present utility or third-party issues that would benefit from the Entity's assistance?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "A8",
    section: "A: Project Scope & Characteristics",
    question: "Does the Project present unique work restrictions (e.g., strict environmental windows, railroad restrictions) or traffic maintenance requirements that would benefit from the Entity's assistance?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "A9",
    section: "A: Project Scope & Characteristics",
    question: "Would the Project benefit by packaging features of work to allow early lock-in of construction materials/labor pricing?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "A10",
    section: "A: Project Scope & Characteristics",
    question: "Would the Project benefit by raising quality standards/benchmarks to minimize maintenance and achieve lower life-cycle cost?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  // --- Section B: Schedule Issues (Table 4, B1-B2) ---
  {
    id: "B1",
    section: "B: Schedule Issues",
    question: "Can time savings be realized through concurrent design and construction activities (fast-tracking)?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "B2",
    section: "B: Schedule Issues",
    question: "Can the schedule be compressed?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  // --- Section C: Opportunity for Innovation (Table 5, C1-C2) ---
  {
    id: "C1",
    section: "C: Opportunity for Innovation",
    question: "Will the Project scope allow for innovation (e.g., alternate designs, traffic management, construction means and methods, etc.)?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "C2",
    section: "C: Opportunity for Innovation",
    question: "Must the Project scope be primarily defined in terms of prescriptive specifications, or can performance specifications be used, or a combination of both?",
    option_a: "Primarily prescriptive specifications.",
    option_b: "Combination of prescriptive and performance specifications.",
    option_c: "Performance specifications for significant elements.",
  },
  // --- Section D: Quality Enhancement (Table 6, D1-D3) ---
  {
    id: "D1",
    section: "D: Quality Enhancement",
    question: "Will there be opportunities for the Entity to provide materials or methods that provide greater value than normally specified by the state on similar projects?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "D2",
    section: "D: Quality Enhancement",
    question: "Will there be the opportunity for realization of greater value due to designs tailored to Entity's area of expertise?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "D3",
    section: "D: Quality Enhancement",
    question: "Will warranties or maintenance agreements be used?",
    option_a: "No.",
    option_b: "Limited to short-term workmanship and materials.",
    option_c: "Much more than typical.",
  },
  // --- Section E: Cost Issues (Table 7, E1-E5) ---
  {
    id: "E1",
    section: "E: Cost Issues",
    question: "Will there be opportunities for the Entity to provide designs with lower initial construction costs than those typically specified by the state?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "E2",
    section: "E: Cost Issues",
    question: "Will there be opportunities for the Entity to provide alternate design concepts with lower lifecycle costs than those typically specified by the state?",
    option_a: "No more than typical.",
    option_b: "More than typical.",
    option_c: "Much more than typical.",
  },
  {
    id: "E3",
    section: "E: Cost Issues",
    question: "Is funding for the Project committed and available?",
    option_a: "Secured for design phase only or cannot support accelerated construction.",
    option_b: "Funding can accommodate fast-tracking to some extent.",
    option_c: "Funding will accommodate compressed schedule/fast-tracking.",
  },
  {
    id: "E4",
    section: "E: Cost Issues",
    question: "Will the cost of procurement affect the number of bidders?",
    option_a: "Procurement cost would significantly limit competition.",
    option_b: "Procurement cost could affect the number of bidders.",
    option_c: "Procurement cost would not be a significant issue given the size or complexity of the Project.",
  },
  {
    id: "E5",
    section: "E: Cost Issues",
    question: "Will Project budget control benefit from the use of formal contingencies?",
    option_a: "No benefit.",
    option_b: "A formal contingency may permit the Department to add Project scope or enhance quality within the constraints of its published budget.",
    option_c: "A formal contingency is required to allow the Department to maximize Project scope and quality within the constraints of its published budget.",
  },
  // --- Section F: Staffing Issues (Table 8, F1-F3) ---
  {
    id: "F1",
    section: "F: Staffing Issues",
    question: "Does the Department have the expertise and resources necessary for a complicated procurement process?",
    option_a: "Inadequate resources or expertise.",
    option_b: "Limited resources or expertise.",
    option_c: "Adequate resources and expertise.",
  },
  {
    id: "F2",
    section: "F: Staffing Issues",
    question: "Are resources available to complete the design?",
    option_a: "Resources are available to complete design.",
    option_b: "Resources are available for partial design.",
    option_c: "Specialized expertise, not available in-house, is required.",
  },
  {
    id: "F3",
    section: "F: Staffing Issues",
    question: "Are resources available to provide construction oversight?",
    option_a: "Resources are available.",
    option_b: "Full-time construction oversight could strain staff resources.",
    option_c: "Resources are unavailable.",
  },
] as const;

export const SECTION_WEIGHTS: Readonly<
  Record<"A" | "B" | "C" | "D" | "E" | "F", number>
> = {
  A: 0.30,
  B: 0.15,
  C: 0.12,
  D: 0.1,
  E: 0.20,
  F: 0.13,
};

export const RATING_VALUES: Readonly<Record<Rating, number>> = {
  A: 1,
  B: 2,
  C: 3,
};

export const ALL_METHODS = [
  "Design-Bid-Build",
  "Design-Sequencing",
  "Design-Build/Low-Bid",
  "Design-Build/Best-Value",
  "CM/GC",
  "Progressive Design-Build",
] as const;

export type DeliveryMethod = (typeof ALL_METHODS)[number];
