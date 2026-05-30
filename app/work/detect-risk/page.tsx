import { ComingSoon } from "@/components/work/coming-soon";
import { AlertTriangle } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      title="Detect Risk"
      blurb="Surface compliance and policy red flags."
      icon={AlertTriangle}
      backHref="/workspace"
    />
  );
}
