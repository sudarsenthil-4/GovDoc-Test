import type { Exporter } from "@/lib/usecases/types";

export const jsonExporter: Exporter = {
  id: "json",
  label: "Download full JSON state",
  contentType: "application/json",
  async build(result: unknown): Promise<Uint8Array> {
    const text = JSON.stringify(result, null, 2);
    return new TextEncoder().encode(text);
  },
};
