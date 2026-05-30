import { ComingSoon } from "@/components/work/coming-soon";
import { ClipboardList } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      title="Fill Forms"
      blurb="Auto-fill recurring forms from source data."
      icon={ClipboardList}
      backHref="/workspace"
    />
  );
}
