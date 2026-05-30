import { ComingSoon } from "@/components/work/coming-soon";
import { BookOpenCheck } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      title="Policy & Standards"
      blurb="Reference current standards and procedures."
      icon={BookOpenCheck}
      backHref="/workspace"
    />
  );
}
