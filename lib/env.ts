export const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GROQ_API_KEY",
  "GOVDOC_SESSION_SECRET",
] as const;

export type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

export class EnvValidationError extends Error {
  constructor(public readonly missing: RequiredEnvVar[], message: string) {
    super(message);
    this.name = "EnvValidationError";
  }
}

export function validateEnv(env: Record<string, string | undefined>): { ok: true } {
  const missing = REQUIRED_ENV_VARS.filter((k) => {
    const v = env[k];
    return v === undefined || v === "";
  });
  if (missing.length > 0) {
    throw new EnvValidationError(missing, `Missing required env vars: ${missing.join(", ")}`);
  }
  const secret = env.GOVDOC_SESSION_SECRET!;
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new EnvValidationError(
      ["GOVDOC_SESSION_SECRET"],
      "GOVDOC_SESSION_SECRET must be at least 32 bytes — generate with `openssl rand -hex 32`",
    );
  }
  return { ok: true };
}
