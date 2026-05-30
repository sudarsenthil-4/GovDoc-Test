import { ComingSoon } from "@/components/work/coming-soon";
import { Tag } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      title="Classify & Tag"
      blurb="Auto-label documents by type and topic."
      icon={Tag}
      backHref="/workspace"
    />
  );
}
