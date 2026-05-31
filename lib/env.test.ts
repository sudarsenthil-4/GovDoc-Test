import { describe, it, expect } from "vitest";
import { validateEnv, REQUIRED_ENV_VARS, EnvValidationError } from "./env";

describe("validateEnv", () => {
  const allPresent = Object.fromEntries(
    REQUIRED_ENV_VARS.map((k) => [k, k === "GOVDOC_SESSION_SECRET" ? "x".repeat(32) : "x"]),
  ) as Record<string, string>;

  it("returns ok when all required vars are present", () => {
    expect(validateEnv(allPresent)).toEqual({ ok: true });
  });

  it("throws EnvValidationError listing every missing var", () => {
    const env = { ...allPresent };
    delete env.OPENAI_API_KEY;
    delete env.GOVDOC_SESSION_SECRET;
    let err: unknown;
    try {
      validateEnv(env);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EnvValidationError);
    expect((err as EnvValidationError).missing).toEqual(["OPENAI_API_KEY", "GOVDOC_SESSION_SECRET"]);
    expect((err as Error).message).toContain("OPENAI_API_KEY");
    expect((err as Error).message).toContain("GOVDOC_SESSION_SECRET");
  });

  it("treats empty strings as missing", () => {
    const env = { ...allPresent, GROQ_API_KEY: "" };
    expect(() => validateEnv(env)).toThrow(/GROQ_API_KEY/);
  });

  it("rejects session secrets shorter than 32 bytes", () => {
    const env = { ...allPresent, GOVDOC_SESSION_SECRET: "tooshort" };
    expect(() => validateEnv(env)).toThrow(/GOVDOC_SESSION_SECRET.*32/);
  });

  it("REQUIRED_ENV_VARS matches the design doc inventory exactly", () => {
    expect(REQUIRED_ENV_VARS).toEqual([
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "GROQ_API_KEY",
      "GOVDOC_SESSION_SECRET",
    ]);
  });
});
