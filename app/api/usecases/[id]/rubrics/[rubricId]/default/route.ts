import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { listRubrics, setDefaultRubric } from "@/lib/usecases/rubrics-store";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function PATCH(
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
    await setDefaultRubric(id, rubricId);
    const rubrics = await listRubrics(id);
    return NextResponse.json({ ok: true, rubrics });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("Unknown rubric") ? 404 : 400 },
    );
  }
}
