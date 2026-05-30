import type { Rating } from "../rubric";
import type { OverrideStatus } from "../types";

export type OverrideRule = {
  id: string;
  name: string;
  trigger: string;
  description: string;
  blocks: string[];
  favor?: string;
};

export const OVERRIDE_RULES: readonly OverrideRule[] = [
  {
    id: "R1",
    name: "Early-stage design requires flexible procurement",
    trigger: "A1 = C",
    description: "Project is in conceptual stage (before PA&ED). Design-Bid-Build and Design-Sequencing both require advanced design completion before procurement.",
    blocks: ["Design-Bid-Build", "Design-Sequencing"],
  },
  {
    id: "R2",
    name: "Large projects exceed DBB scope",
    trigger: "A2 = C",
    description: "Project exceeds $75M construction capital. Projects of this scale typically require collaborative or design-build delivery methods.",
    blocks: ["Design-Bid-Build"],
  },
  {
    id: "R3",
    name: "Very complex projects need collaborative delivery",
    trigger: "A3 = C",
    description: "Very complex project with significant schedule complexity. Requires three-party collaboration (Department, Contractor, ICE) that DBB and Design-Sequencing do not provide.",
    blocks: ["Design-Bid-Build", "Design-Sequencing"],
  },
  {
    id: "R4",
    name: "Maximum schedule compression blocks DBB",
    trigger: "B1 = C AND B2 = C",
    description: "Project requires maximum fast-tracking and schedule compression. DBB has the longest delivery schedule and does not allow early work packages.",
    blocks: ["Design-Bid-Build"],
  },
  {
    id: "R5",
    name: "Performance specifications favor Design-Build",
    trigger: "C2 = C",
    description: "Project uses performance specifications for significant elements. Design-Build methods leverage ATCs (Alternative Technical Concepts) to meet performance outcomes.",
    blocks: [],
    favor: "Design-Build/Best-Value",
  },
  {
    id: "R6",
    name: "Limited funding blocks accelerated methods",
    trigger: "E3 = A",
    description: "Funding is secured for design phase only. Design-Build and Progressive Design-Build require construction capital commitment for procurement.",
    blocks: ["Design-Build/Best-Value", "Design-Build/Low-Bid", "Progressive Design-Build"],
  },
  {
    id: "R7",
    name: "High procurement cost limits Design-Build",
    trigger: "E4 = A",
    description: "Procurement cost would significantly limit competition. Design-Build has higher procurement costs including stipends for proposers.",
    blocks: ["Design-Build/Best-Value"],
  },
  {
    id: "R8",
    name: "No in-house design expertise blocks DBB",
    trigger: "F2 = C",
    description: "Specialized design expertise not available in-house. DBB requires the Department to own and complete the full design. DB and PDB transfer design ownership to the contractor.",
    blocks: ["Design-Bid-Build"],
  },
  {
    id: "R9",
    name: "Inadequate procurement expertise blocks complex methods",
    trigger: "F1 = A",
    description: "Department lacks resources or expertise for complex procurement. Design-Build and PDB require sophisticated two-phase procurement (RFQ + RFP).",
    blocks: ["Design-Build/Best-Value", "Design-Build/Low-Bid", "Progressive Design-Build"],
  },
];

export const FALLBACK_ORDER: readonly string[] = [
  "CM/GC",
  "Design-Build/Best-Value",
  "Design-Build/Low-Bid",
  "Progressive Design-Build",
  "Design-Sequencing",
  "Design-Bid-Build",
];

const TRIGGER_FNS: Record<string, (rl: Record<string, Rating>) => boolean> = {
  R1: (rl) => rl.A1 === "C",
  R2: (rl) => rl.A2 === "C",
  R3: (rl) => rl.A3 === "C",
  R4: (rl) => rl.B1 === "C" && rl.B2 === "C",
  R5: (rl) => rl.C2 === "C",
  R6: (rl) => rl.E3 === "A",
  R7: (rl) => rl.E4 === "A",
  R8: (rl) => rl.F2 === "C",
  R9: (rl) => rl.F1 === "A",
};

export function applyOverrides(
  recommended: string,
  runnerUp: string,
  ratingLookup: Record<string, Rating>,
): { recommended: string; runnerUp: string; overrideReasons: string[] } {
  const blocked = new Set<string>();
  const reasons: string[] = [];
  let favor: string | null = null;

  for (const rule of OVERRIDE_RULES) {
    const triggerFn = TRIGGER_FNS[rule.id];
    if (triggerFn && triggerFn(ratingLookup)) {
      for (const m of rule.blocks) blocked.add(m);
      reasons.push(rule.description);
      if (rule.favor) favor = rule.favor;
    }
  }

  // Apply favor (only if not blocked and different from current recommended)
  if (favor && !blocked.has(favor) && recommended !== favor) {
    runnerUp = recommended;
    recommended = favor;
  }

  // If recommended is blocked, try runnerUp first, else walk FALLBACK_ORDER
  if (blocked.has(recommended)) {
    if (runnerUp && !blocked.has(runnerUp)) {
      [recommended, runnerUp] = [runnerUp, recommended];
    } else {
      for (const method of FALLBACK_ORDER) {
        if (!blocked.has(method) && method !== recommended) {
          const old = recommended;
          recommended = method;
          runnerUp = old;
          break;
        }
      }
    }
  }

  // If runnerUp is blocked, find next available (always checked, including after a swap)
  if (blocked.has(runnerUp)) {
    for (const method of FALLBACK_ORDER) {
      if (!blocked.has(method) && method !== recommended) {
        runnerUp = method;
        break;
      }
    }
  }

  return { recommended, runnerUp, overrideReasons: reasons };
}

export function computeOverrideStatus(ratingLookup: Record<string, Rating>): OverrideStatus[] {
  return OVERRIDE_RULES.map((rule) => {
    const triggerFn = TRIGGER_FNS[rule.id];
    const triggered = triggerFn ? triggerFn(ratingLookup) : false;
    return {
      rule_id: rule.id,
      rule_name: rule.name,
      trigger_condition: rule.trigger,
      description: rule.description,
      triggered,
      blocks: [...rule.blocks],
      favors: rule.favor ?? "",
    };
  });
}
