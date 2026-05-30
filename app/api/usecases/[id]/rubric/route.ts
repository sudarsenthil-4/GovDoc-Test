import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import {
  saveRubric as multiSaveRubric,
  resetRubricContent,
  getDefaultRubricId,
  listRubrics,
} from "@/lib/usecases/rubrics-store";
import { loadCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { loadCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { loadRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

async function loadFor(id: string, rubricId: string | undefined): Promise<unknown> {
  if (id === "cmgc-pde") return loadCmgcRubric(rubricId);
  if (id === "cucp-reevals") return loadCucpRubric(rubricId);
  if (id === "row-appraisal") return loadRowRubric(rubricId);
  throw new Error(`Unknown id: ${id}`);
}

async function resolveRubricId(
  usecaseId: string,
  fromQuery: string | null,
): Promise<{ rubricId: string } | { error: NextResponse }> {
  if (!fromQuery) return { rubricId: await getDefaultRubricId(usecaseId) };
  const list = await listRubrics(usecaseId);
  if (!list.some((r) => r.id === fromQuery)) {
    return {
      error: NextResponse.json({ error: `Unknown rubric: ${fromQuery}` }, { status: 404 }),
    };
  }
  return { rubricId: fromQuery };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown rubric use case" }, { status: 404 });
  }
  const url = new URL(req.url);
  const resolved = await resolveRubricId(id, url.searchParams.get("rubric"));
  if ("error" in resolved) return resolved.error;
  const data = await loadFor(id, resolved.rubricId);
  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown rubric use case" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const url = new URL(req.url);
  const resolved = await resolveRubricId(id, url.searchParams.get("rubric"));
  if ("error" in resolved) return resolved.error;
  await multiSaveRubric(id, resolved.rubricId, body);
  const verified = await loadFor(id, resolved.rubricId);
  return NextResponse.json({ ok: true, rubric: verified });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown rubric use case" }, { status: 404 });
  }
  const url = new URL(req.url);
  const resolved = await resolveRubricId(id, url.searchParams.get("rubric"));
  if ("error" in resolved) return resolved.error;
  await resetRubricContent(id, resolved.rubricId);
  const data = await loadFor(id, resolved.rubricId);
  return NextResponse.json({ ok: true, rubric: data });
}
