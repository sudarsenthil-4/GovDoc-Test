import { ComingSoon } from "@/components/work/coming-soon";
import { ShieldCheck } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      title="Audit & Trace"
      blurb="Trace every change with full provenance."
      icon={ShieldCheck}
      backHref="/workspace"
    />
  );
}
