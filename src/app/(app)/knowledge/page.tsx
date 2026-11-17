import { FocusBoundary } from "@/components/shell/FocusBoundary";
import { Knowledge } from "@/modules/knowledge/Knowledge";

export const metadata = { title: "Knowledge" };

export default function Page() {
  return (
    <FocusBoundary>
      <Knowledge />
    </FocusBoundary>
  );
}
