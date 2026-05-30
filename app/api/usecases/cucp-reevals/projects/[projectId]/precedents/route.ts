import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { loadPrecedents, deletePrecedent } from "@/lib/usecases/cucp-reevals/memory/store";
import type { Level } from "@/lib/usecases/cucp-reevals/memory/precedents";

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
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { projectId } = await params;
  try {
    const data = await loadPrecedents(projectId);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid projectId" }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { projectId } = await params;

  let body: { level?: unknown; index?: unknown };
  try {
    body = (await req.json()) as { level?: unknown; index?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { level, index } = body;
  if (level !== 1 && level !== 2 && level !== 3) {
    return NextResponse.json({ error: "level must be 1, 2, or 3" }, { status: 400 });
  }
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "index must be a non-negative integer" }, { status: 400 });
  }
  try {
    await deletePrecedent(projectId, level as Level, index);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid projectId" }, { status: 400 });
  }
}
