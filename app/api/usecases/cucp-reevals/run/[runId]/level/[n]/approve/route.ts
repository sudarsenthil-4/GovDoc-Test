import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { resolveLevelDecision } from "@/lib/runs/level-rendezvous";

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
  { params }: { params: Promise<{ runId: string; n: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { runId, n } = await params;
  const level = Number(n);
  if (level !== 1 && level !== 2) {
    return NextResponse.json({ error: "Only levels 1-2 use this endpoint; level 3 uses /finalize" }, { status: 400 });
  }
  const ok = resolveLevelDecision(runId, level, { action: "approve" });
  if (!ok) return new NextResponse("Run not waiting for input on this level", { status: 404 });
  return NextResponse.json({ ok: true });
}
