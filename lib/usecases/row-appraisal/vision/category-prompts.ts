export type VisionPromptEntry = { prompt: string; pageRange: [number, number] };

const PROMPTS: Record<string, VisionPromptEntry> = {
  "Subject Assessor Map": {
    prompt: `You are analyzing PDF page images from a Caltrans Right of Way appraisal report.

TASK: Locate and score the SUBJECT ASSESSOR MAP section.

WHAT A SUBJECT ASSESSOR MAP LOOKS LIKE:
- It is a parcel map from the County Tax Assessor's office (also called "Assessor's Parcel Map" or "Assessor's Plat").
- Shows multiple neighboring parcels drawn as polygons with parcel numbers (e.g., "36", "40", "72Ac").
- Reference labels like "Assessor's Map Bk. 6 Pg. 27" or "Book X, Page Y" at the bottom/corner.
- The SUBJECT property is highlighted/outlined/colored differently from surrounding parcels.
- Typically appears early in the report (pages 4-8) BUT may also appear in appendix (pages 25-35).

NOT to be confused with:
- Aerial/satellite photos (those are Subject Photos or Comparable Map Sheets)
- Engineering R/W Appraisal Maps (those are on the last pages, show acquisition details with parcel numbers like 36674-1)
- Comparable parcel assessor maps (these show a COMPARABLE property, not the subject — labels will match comparable sale addresses, not subject APN)

SCORING CRITERIA:
- Score 1: No Subject Assessor Map anywhere in the pages provided.
- Score 2: Assessor map exists but subject is NOT outlined.
- Score 3: Subject outlined but the color is clearly NOT red (e.g., blue, yellow, green).
- Score 4: Subject outlined in RED but NO caption explaining the map.
- Score 5: Subject outlined in RED AND has a caption explaining the map.

INSTRUCTIONS:
1. Examine EACH page image thoroughly.
2. Look for a tax-assessor-style parcel map (polygonal parcel boundaries with parcel numbers).
3. Verify it's the SUBJECT's assessor map, not a comparable's.
4. Check outlining + color + caption.
5. If no assessor map exists in any of these pages → Score 1, but state which pages you examined.

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "score": <1-5>,
  "evidence": "Page X shows a tax assessor parcel map with subject parcel outlined in [color]. Caption says: '[exact text]'. OR 'No subject assessor map found in pages examined: [list].'",
  "comments": "Brief explanation of the score."
}`,
    pageRange: [1, 12],
  },
  "Subject Photos": {
    prompt: `You are analyzing PDF page images from a Caltrans Right of Way appraisal report.

TASK: Locate and score the SUBJECT PHOTOS section.

Subject Photos are ground-level photographs of the subject property, usually with captions describing direction, date, and any markings on the photos.

SCORING CRITERIA:
- Score 1: No photos of the subject at all.
- Score 2: Has at least 1 photo but no dates AND no RW lines denoted, OR missing photos of impacted substantial improvements.
- Score 3: Sufficient photos with dates and photographer, but captions do NOT mention the proposed acquisition.
- Score 4: Sufficient photos + captions mention BOTH direction AND proposed acquisition, but RW lines NOT denoted in captions.
- Score 5: All of Score 4 + captions explicitly reference 'existing right of way line', 'state's right of way line', 'current right of way line', or similar RW terminology.

CRITICAL RULES:
- 'utility easement' line ≠ RW line (does not count for Score 5).
- 'subparcel outline' ≠ RW line (does not count for Score 5).
- Must find explicit RW terminology in captions for Score 5.

Respond with ONLY a JSON object:
{
  "score": <1-5>,
  "evidence": "Page X-Y contain N photos. Caption examples: '...'. Dates present/absent. RW lines denoted: yes/no.",
  "comments": "Brief explanation."
}`,
    pageRange: [4, 12],
  },
  "Comparable Map Sheet": {
    prompt: `You are analyzing PDF page images from a Caltrans Right of Way appraisal report.

TASK: Locate and score the COMPARABLE MAP SHEET (the aerial/satellite map showing subject property relative to comparable sales).

SCORING CRITERIA:
- Score 1: No comparable map, or map is inaccurate.
- Score 2: Contains everything in Score 3 BUT north arrow is missing OR properties are miscolored (wrong colors).
- Score 3: Map shows subject relative to comparables + has north arrow + subject outlined in RED, sales in ORANGE, listings in GREEN.
- Score 4: All of Score 3 + parcel sizes and shapes are shown (not just point markers).

CRITICAL:
- Parcels OUTLINED = parcel boundary shapes traced on the map.
- Parcels marked with DOTS/PINS/BOXES/LABELS = NOT outlined (but acceptable as a form of identification).
- Wrong colors (e.g., colored boxes instead of red/orange/green) → Score 2.
- Correct colors + outlined + north arrow → Score 3.

Respond with ONLY a JSON object:
{
  "score": <1-5>,
  "evidence": "Page X shows an aerial map. Marking method: [dots/outlines/boxes]. Colors: subject=[color], sales=[color]. North arrow: present/absent.",
  "comments": "Brief explanation."
}`,
    pageRange: [25, 35],
  },
  "Appraisal Maps": {
    prompt: `You are analyzing PDF page images from a Caltrans Right of Way appraisal report.

TASK: Locate and score the APPRAISAL MAPS section (the official state/department Right of Way Appraisal Map — NOT the comparable data map).

SCORING CRITERIA:
- Score 1: No appraisal map at all.
- Score 3: Contains an appraisal map showing the entire proposed acquisition area.
- Score 5: Contains BOTH an appraisal map(s) AND an index map. The appraisal map shows the entire proposed acquisition.

CRITICAL:
- This is the engineering-style Right of Way Appraisal Map (usually at the very end of the report, last 1-3 pages).
- Do NOT confuse with the Comparable Data Map (which is a different rubric category).
- Look for 'APPRAISAL MAP', 'R/W APPRAISAL MAP', or 'RIGHT OF WAY APPRAISAL MAP' title.

Respond with ONLY a JSON object:
{
  "score": <1 | 3 | 5>,
  "evidence": "Page X contains the R/W Appraisal Map. Shows acquisition: yes/no. Index map present: yes/no.",
  "comments": "Brief explanation."
}`,
    pageRange: [30, 50],
  },
};

export function getVisionPromptForCategory(category: string): VisionPromptEntry | null {
  return PROMPTS[category] ?? null;
}
