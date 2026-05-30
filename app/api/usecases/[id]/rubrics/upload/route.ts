import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { createRubric, saveRubric, listRubrics } from "@/lib/usecases/rubrics-store";
import { validateRubricShape } from "@/lib/usecases/rubric-shape";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);
const MAX_BYTES = 256 * 1024;

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown use case" }, { status: 404 });
  }

  const form = await req.formData();
  const fileEntry = form.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "`file` is required" }, { status: 400 });
  }
  if (fileEntry.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 256 KB limit" }, { status: 400 });
  }

  const text = await fileEntry.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const shape = validateRubricShape(id, parsed);
  if (!shape.ok) {
    return NextResponse.json({ error: shape.error }, { status: 400 });
  }

  const mode = form.get("mode");
  if (mode !== "new-version" && mode !== "new-rubric") {
    return NextResponse.json(
      { error: "`mode` must be 'new-version' or 'new-rubric'" },
      { status: 400 },
    );
  }
  const rubricIdRaw = form.get("rubricId");
  if (typeof rubricIdRaw !== "string" || !rubricIdRaw) {
    return NextResponse.json({ error: "`rubricId` is required" }, { status: 400 });
  }
  const noteRaw = form.get("note");
  const note =
    typeof noteRaw === "string" && noteRaw.length > 0 ? noteRaw.slice(0, 280) : undefined;

  try {
    if (mode === "new-rubric") {
      const labelRaw = form.get("label");
      if (typeof labelRaw !== "string" || !labelRaw) {
        return NextResponse.json({ error: "`label` is required for new-rubric" }, { status: 400 });
      }
      const existing = await listRubrics(id);
      if (existing.some((r) => r.id === rubricIdRaw)) {
        return NextResponse.json({ error: "Rubric id already exists" }, { status: 400 });
      }
      await createRubric(id, { id: rubricIdRaw, label: labelRaw.slice(0, 80) });
      const { versionId } = await saveRubric(id, rubricIdRaw, parsed, {
        source: "upload",
        ...(note ? { note } : {}),
      });
      return NextResponse.json({ ok: true, rubricId: rubricIdRaw, versionId });
    }
    const { versionId } = await saveRubric(id, rubricIdRaw, parsed, {
      source: "upload",
      ...(note ? { note } : {}),
    });
    return NextResponse.json({ ok: true, rubricId: rubricIdRaw, versionId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }
}
