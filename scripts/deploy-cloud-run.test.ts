import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

const SCRIPT = path.join(process.cwd(), "scripts/deploy-cloud-run.sh");

function dryRun(env: Record<string, string> = {}): string {
  return execFileSync("bash", [SCRIPT, "--dry-run"], {
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

describe("deploy-cloud-run.sh --dry-run", () => {
  it("renders the gcloud run deploy command with required SSE flags", () => {
    const out = dryRun();
    expect(out).toContain("gcloud run deploy govdoc");
    expect(out).toContain("--source .");
    expect(out).toContain("--region=us-central1");
    expect(out).toContain("--project=genai-poc-424806");
    expect(out).toContain("--no-cpu-throttling");
    expect(out).toContain("--cpu-boost");
    expect(out).toContain("--memory=2Gi");
    expect(out).toContain("--timeout=900s");
    expect(out).toContain("--concurrency=10");
    expect(out).toContain("--max-instances=5");
    expect(out).toContain("--service-account=govdoc-runtime@genai-poc-424806.iam.gserviceaccount.com");
  });

  it("wires every required secret", () => {
    const out = dryRun();
    expect(out).toContain("OPENAI_API_KEY=govdoc-openai:latest");
    expect(out).toContain("ANTHROPIC_API_KEY=govdoc-anthropic:latest");
    expect(out).toContain("GROQ_API_KEY=govdoc-groq:latest");
    expect(out).toContain("GOVDOC_DEV_USER=govdoc-dev-user:latest");
    expect(out).toContain("GOVDOC_DEV_PASS=govdoc-dev-pass:latest");
    expect(out).toContain("GOVDOC_SESSION_SECRET=govdoc-session-secret:latest");
  });

  it("sets inline env vars including GIT_COMMIT when in a git repo", () => {
    const out = dryRun();
    expect(out).toContain("NODE_ENV=production");
    expect(out).toContain("NEXT_TELEMETRY_DISABLED=1");
    expect(out).toContain("LOG_LEVEL=info");
    expect(out).toMatch(/GIT_COMMIT=[0-9a-f]{7,}/);
  });

  it("--help prints usage and exits 0", () => {
    const out = execFileSync("bash", [SCRIPT, "--help"], { encoding: "utf8" });
    expect(out).toMatch(/Usage:/);
    expect(out).toContain("--dry-run");
  });
});
