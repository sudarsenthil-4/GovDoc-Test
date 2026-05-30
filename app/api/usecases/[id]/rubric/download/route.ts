import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { loadCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { loadCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { loadRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";
import { buildCmgcRubricXlsx } from "@/lib/usecases/cmgc-pde/exporters/rubric-xlsx";
import { buildCucpRubricXlsx } from "@/lib/usecases/cucp-reevals/exporters/rubric-xlsx";
import { buildRowRubricXlsx } from "@/lib/usecases/row-appraisal/exporters/rubric-xlsx";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);
const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

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
  const url = new URL(req.url);
  const rubricId = url.searchParams.get("rubric") ?? undefined;

  let buf: Buffer;
  if (id === "cmgc-pde") {
    buf = await buildCmgcRubricXlsx(await loadCmgcRubric(rubricId));
  } else if (id === "cucp-reevals") {
    buf = await buildCucpRubricXlsx(await loadCucpRubric(rubricId));
  } else {
    buf = await buildRowRubricXlsx(await loadRowRubric(rubricId));
  }

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type": XLSX_CONTENT_TYPE,
      "content-disposition": `attachment; filename="${id}-rubric.xlsx"`,
    },
  });
}
