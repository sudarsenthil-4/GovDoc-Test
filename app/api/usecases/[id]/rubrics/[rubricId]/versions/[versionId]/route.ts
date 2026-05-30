import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { loadRubric, deleteVersion } from "@/lib/usecases/rubrics-store";

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
  { params }: { params: Promise<{ id: string; rubricId: string; versionId: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id, rubricId, versionId } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown use case" }, { status: 404 });
  }
  let content: unknown;
  try {
    content = await loadRubric(id, rubricId, versionId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }
  if (content === null) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }
  return NextResponse.json(content);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; rubricId: string; versionId: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id, rubricId, versionId } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown use case" }, { status: 404 });
  }
  try {
    await deleteVersion(id, rubricId, versionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = /Unknown version/i.test(msg) ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
