import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { deleteRubric, listRubrics } from "@/lib/usecases/rubrics-store";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; rubricId: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id, rubricId } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown rubric use case" }, { status: 404 });
  }
  try {
    await deleteRubric(id, rubricId);
    const rubrics = await listRubrics(id);
    return NextResponse.json({ ok: true, rubrics });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Refusal to delete the default is an expected 400, not a 500.
    const status = msg.includes("Cannot delete the default") ? 400 : msg.includes("Unknown rubric") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
