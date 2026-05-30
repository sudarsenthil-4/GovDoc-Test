import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { getUseCase } from "@/lib/usecases/registry";
import { logger } from "@/lib/logger";

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
  { params }: { params: Promise<{ id: string; exporter: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id, exporter: exporterId } = await params;
  const useCase = getUseCase(id);
  if (!useCase) return new NextResponse("Unknown use case", { status: 404 });
  const exporter = useCase.exporters.find((e) => e.id === exporterId);
  if (!exporter) return new NextResponse("Unknown exporter", { status: 404 });

  let result: unknown;
  try {
    result = await req.json();
  } catch {
    return new NextResponse("Invalid result body", { status: 400 });
  }

  try {
    const bytes = await exporter.build(result);
    return new NextResponse(new Blob([new Uint8Array(bytes)]), {
      status: 200,
      headers: {
        "Content-Type": exporter.contentType,
        "Content-Disposition": `attachment; filename="${id}-${exporterId}.${guessExt(exporter.contentType)}"`,
      },
    });
  } catch (e) {
    logger.error({ id, exporterId, error: e instanceof Error ? e.message : String(e) }, "export failed");
    return new NextResponse("Export failed", { status: 500 });
  }
}

function guessExt(contentType: string): string {
  if (contentType.includes("spreadsheet")) return "xlsx";
  if (contentType.includes("wordprocessing")) return "docx";
  if (contentType.includes("json")) return "json";
  return "bin";
}
