import { FocusBoundary } from "@/components/shell/FocusBoundary";
import { Opportunities } from "@/modules/opportunities/Opportunities";

export const metadata = { title: "Opportunities" };

export default function Page() {
  return (
    <FocusBoundary>
      <Opportunities />
    </FocusBoundary>
  );
}
