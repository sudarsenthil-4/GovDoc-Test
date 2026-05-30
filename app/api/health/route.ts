import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const body: {
    ok: true;
    service: "govdoc";
    uptimeSec: number;
    commit?: string;
    dirty?: true;
    warning?: string;
  } = {
    ok: true,
    service: "govdoc",
    uptimeSec: Math.round(process.uptime()),
  };
  const commit = process.env.GIT_COMMIT;
  if (commit) {
    body.commit = commit;
    if (commit.endsWith("-dirty")) {
      body.dirty = true;
      body.warning =
        "Deployed from a dirty working tree. Source is not reproducible from git.";
    }
  }
  return NextResponse.json(body);
}
