export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateEnv, EnvValidationError } = await import("./lib/env");
  try {
    validateEnv(process.env);
  } catch (e) {
    if (e instanceof EnvValidationError) {
      process.stderr.write(`[govdoc] env validation failed: ${e.message}\n`);
      process.exit(1);
    }
    throw e;
  }
}
