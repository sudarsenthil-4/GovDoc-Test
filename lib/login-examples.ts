export type LoginExampleSegment = {
  text: string;
  tone?: "highlight" | "strong";
};

export type LoginExample = {
  caseId: string;
  filename: string;
  pageLabel: string;
  paragraphs: LoginExampleSegment[][];
  facts: [string, string][];
  reasoning: string[];
  crossReference: string;
  verdictPrefix: string;
  verdictEmphasis: string;
  verdictSuffix: string;
};

export const LOGIN_EXAMPLES: LoginExample[] = [
  {
    caseId: "CASE_47A",
    filename: "AGENCY_GRIEVANCE_2026-04.pdf",
    pageLabel: "Excerpt · Page 3 of 7",
    paragraphs: [
      [
        { text: "The complainant, a " },
        { text: "California resident", tone: "highlight" },
        { text: ", alleges that on " },
        { text: "March 14, 2026", tone: "highlight" },
        {
          text: ", the Department failed to process their application within the statutory window of ",
        },
        { text: "45 business days", tone: "highlight" },
        { text: " as required under Gov Code §11130." },
      ],
      [
        { text: "The Department's records indicate the application was received on " },
        { text: "January 22, 2026", tone: "highlight" },
        { text: ", placing the resolution deadline at " },
        { text: "March 26, 2026", tone: "highlight" },
        { text: " after the alleged non-action." },
      ],
      [
        { text: "On review, the file shows " },
        { text: "no acknowledgment letter", tone: "highlight" },
        { text: " issued between " },
        { text: "Jan 22", tone: "strong" },
        { text: " and " },
        { text: "Apr 04", tone: "strong" },
        { text: ", constituting a procedural breach under CCR Title 2 §15.04(b)." },
      ],
    ],
    facts: [
      ["Complainant", "CA Resident"],
      ["Filed", "Jan 22, 2026"],
      ["Deadline", "Mar 26, 2026"],
      ["Statute", "Gov Code §11130"],
      ["Cross-ref", "CCR §15.04(b)"],
    ],
    reasoning: ["Identify statutory window", "Check timeline", "Detect breach"],
    crossReference: "Cross-referencing Gov Code §11130 with CCR §15.04(b) - 1 violation found",
    verdictPrefix: "Procedural",
    verdictEmphasis: "breach confirmed.",
    verdictSuffix: "Recommend Tier-2 review.",
  },
  {
    caseId: "CASE_12B",
    filename: "PROCUREMENT_WAIVER_REVIEW_2026-02.pdf",
    pageLabel: "Excerpt · Page 5 of 9",
    paragraphs: [
      [
        { text: "The requestor seeks emergency procurement approval for " },
        { text: "bridge inspection services", tone: "highlight" },
        { text: " after storm damage reported on " },
        { text: "February 08, 2026", tone: "highlight" },
        { text: "." },
      ],
      [
        { text: "Policy requires a written justification describing " },
        { text: "immediate public safety risk", tone: "highlight" },
        { text: ", documented price reasonableness, and approval by the delegated authority." },
      ],
      [
        { text: "The packet includes the safety memo and approval signature, but " },
        { text: "price reasonableness is not documented", tone: "highlight" },
        { text: " before award notice " },
        { text: "PW-2286", tone: "strong" },
        { text: "." },
      ],
    ],
    facts: [
      ["Request", "Emergency waiver"],
      ["Service", "Bridge inspection"],
      ["Event", "Feb 08, 2026"],
      ["Missing", "Price support"],
      ["Notice", "PW-2286"],
    ],
    reasoning: ["Confirm emergency basis", "Verify approval chain", "Flag missing support"],
    crossReference: "Cross-referencing emergency waiver policy with procurement packet - 1 condition missing",
    verdictPrefix: "Conditional",
    verdictEmphasis: "approval hold.",
    verdictSuffix: "Request price support before release.",
  },
  {
    caseId: "CASE_88D",
    filename: "ROW_APPRAISAL_PACKET_2026-01.pdf",
    pageLabel: "Excerpt · Page 11 of 28",
    paragraphs: [
      [
        { text: "The appraisal identifies " },
        { text: "Parcel 18-042", tone: "highlight" },
        { text: " as a partial acquisition with temporary construction easement impacts." },
      ],
      [
        { text: "The valuation section references three comparable sales, but " },
        { text: "Comparable Sale 2", tone: "highlight" },
        { text: " lacks an adjustment explanation for access limitations and grade change." },
      ],
      [
        { text: "The reviewer note dated " },
        { text: "January 17, 2026", tone: "highlight" },
        { text: " requests support for the " },
        { text: "15 percent access adjustment", tone: "highlight" },
        { text: ", which is not present in the final package." },
      ],
    ],
    facts: [
      ["Parcel", "18-042"],
      ["Taking", "Partial"],
      ["Issue", "Adjustment support"],
      ["Comparable", "Sale 2"],
      ["Adjustment", "15 percent"],
    ],
    reasoning: ["Read appraisal summary", "Trace comparable support", "Identify missing rationale"],
    crossReference: "Cross-referencing appraisal checklist with comparable sale table - 1 support gap found",
    verdictPrefix: "Review",
    verdictEmphasis: "exception required.",
    verdictSuffix: "Return for adjustment rationale.",
  },
  {
    caseId: "CASE_31C",
    filename: "DBE_REEVALUATION_SUMMARY_2026-03.pdf",
    pageLabel: "Excerpt · Page 2 of 6",
    paragraphs: [
      [
        { text: "The firm reports " },
        { text: "three active NAICS classifications", tone: "highlight" },
        { text: " and submits updated ownership and control narratives for annual review." },
      ],
      [
        { text: "Revenue records show average receipts below the applicable cap, while the narrative confirms " },
        { text: "day-to-day operational control", tone: "highlight" },
        { text: " remains with the qualifying owner." },
      ],
      [
        { text: "No material ownership change is documented between " },
        { text: "March 2025", tone: "highlight" },
        { text: " and " },
        { text: "March 2026", tone: "highlight" },
        { text: ", and the file includes signed certification updates." },
      ],
    ],
    facts: [
      ["Program", "DBE review"],
      ["Classes", "3 active"],
      ["Revenue", "Below cap"],
      ["Control", "Owner retained"],
      ["Change", "None found"],
    ],
    reasoning: ["Check revenue threshold", "Review control narrative", "Confirm certification status"],
    crossReference: "Cross-referencing ownership narrative with revenue workbook - no blocking issue found",
    verdictPrefix: "Eligibility",
    verdictEmphasis: "appears supported.",
    verdictSuffix: "Proceed to reviewer confirmation.",
  },
];

export function getRandomLoginExample(): LoginExample {
  return LOGIN_EXAMPLES[Math.floor(Math.random() * LOGIN_EXAMPLES.length)] ?? LOGIN_EXAMPLES[0]!;
}
