import { ComingSoon } from "@/components/work/coming-soon";
import { ScanText } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      title="OCR & Extract"
      blurb="Pull text and structure from scanned PDFs."
      icon={ScanText}
      backHref="/workspace"
    />
  );
}
