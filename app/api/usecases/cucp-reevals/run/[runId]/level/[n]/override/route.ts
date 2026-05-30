import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { resolveLevelDecision } from "@/lib/runs/level-rendezvous";
import type { L2OverridePayload, L3OverridePayload } from "@/lib/usecases/cucp-reevals/memory/staged";

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

function isL2Override(o: unknown): o is L2OverridePayload {
  if (!o || typeof o !== "object") return false;
  const r = o as Record<string, unknown>;
  return typeof r.fact_id === "string" && typeof r.new_category === "string" && typeof r.reason === "string";
}

function isL3Override(o: unknown): o is L3OverridePayload {
  if (!o || typeof o !== "object") return false;
  const r = o as Record<string, unknown>;
  return (
    typeof r.s_no === "string" &&
    (r.verdict === "Pass" || r.verdict === "Fail") &&
    (r.request_info === "Yes" || r.request_info === "No") &&
    typeof r.reason === "string"
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string; n: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { runId, n } = await params;
  const level = Number(n);
  if (level !== 1 && level !== 2 && level !== 3) {
    return NextResponse.json({ error: "n must be 1, 2, or 3" }, { status: 400 });
  }

  let body: { override?: unknown };
  try {
    body = (await req.json()) as { override?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (level === 1) {
    const o = body.override as Record<string, unknown> | undefined;
    if (!o || typeof o !== "object") {
      return NextResponse.json({ error: "override required" }, { status: 400 });
    }
    const reason = typeof o.reason === "string" ? o.reason.trim() : "";
    if (reason.length < 15 || reason.length > 1000) {
      return NextResponse.json({ error: "reason must be 15-1000 chars" }, { status: 400 });
    }
    let decision: { action: "override-fact" | "override-incident" | "override-field"; override: unknown };
    const kind = o.kind;
    if (kind === "fact-field") {
      const fieldOk = ["When", "Where", "Who", "What", "Why", "Magnitude"].includes(String(o.field));
      const factIdOk = typeof o.fact_id === "string" && /^fact_\d+$/.test(o.fact_id);
      const valueOk = typeof o.corrected_value === "string" && o.corrected_value.trim().length > 0 && o.corrected_value.length <= 500;
      if (!fieldOk || !factIdOk || !valueOk) {
        return NextResponse.json({ error: "fact-field payload invalid" }, { status: 400 });
      }
      decision = { action: "override-fact", override: o };
    } else if (kind === "firm-name" || kind === "narrative-pnw") {
      const valueOk = typeof o.corrected_value === "string" && o.corrected_value.trim().length > 0 && o.corrected_value.length <= 500;
      if (!valueOk) {
        return NextResponse.json({ error: "corrected_value invalid" }, { status: 400 });
      }
      const field = kind === "firm-name" ? "firm_name" : "narrative_pnw";
      decision = {
        action: "override-field",
        override: { field, corrected_value: o.corrected_value, reason },
      };
    } else if (kind === "specific-incident") {
      const descOk = typeof o.description === "string" && o.description.trim().length > 0 && o.description.length <= 500;
      if (!descOk) {
        return NextResponse.json({ error: "description invalid" }, { status: 400 });
      }
      decision = { action: "override-incident", override: o };
    } else {
      return NextResponse.json({ error: "unknown override kind" }, { status: 400 });
    }
    const ok = resolveLevelDecision(runId, 1, decision);
    if (!ok) return new NextResponse("Run not waiting for input on this level", { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const valid = level === 2 ? isL2Override(body.override) : isL3Override(body.override);
  if (!valid) {
    return NextResponse.json({ error: `override payload shape invalid for level ${level}` }, { status: 400 });
  }

  const ok = resolveLevelDecision(runId, level, { action: "override-and-rerun", override: body.override });
  if (!ok) return new NextResponse("Run not waiting for input on this level", { status: 404 });
  return NextResponse.json({ ok: true });
}
