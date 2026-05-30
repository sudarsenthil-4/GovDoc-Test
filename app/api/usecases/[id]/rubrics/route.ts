import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { listRubrics, createRubric } from "@/lib/usecases/rubrics-store";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
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
  const rubrics = await listRubrics(id);
  return NextResponse.json({ rubrics });
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
  let body: { id?: unknown; label?: unknown; cloneFrom?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.id !== "string" || typeof body.label !== "string") {
    return NextResponse.json(
      { error: "Body must include string `id` and `label`" },
      { status: 400 },
    );
  }
  const cloneFrom = typeof body.cloneFrom === "string" ? body.cloneFrom : undefined;
  try {
    const entry = await createRubric(id, { id: body.id, label: body.label, cloneFrom });
    return NextResponse.json({ ok: true, entry });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }
}
