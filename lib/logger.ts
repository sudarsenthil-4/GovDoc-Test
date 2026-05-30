import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "govdoc" },
  formatters: {
    level: (_label, number) => ({ level: number }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
