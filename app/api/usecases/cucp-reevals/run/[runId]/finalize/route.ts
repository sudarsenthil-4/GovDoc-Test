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
  { params }: { params: Promise<{ runId: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { runId } = await params;
  const ok = resolveLevelDecision(runId, 3, { action: "approve" });
  if (!ok) return new NextResponse("Run not waiting for input on level 3", { status: 404 });
  return NextResponse.json({ ok: true });
}
