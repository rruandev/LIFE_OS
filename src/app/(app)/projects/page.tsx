import { FocusBoundary } from "@/components/shell/FocusBoundary";
import { Projects } from "@/modules/projects/Projects";

export const metadata = { title: "Projects" };

export default function Page() {
  return (
    <FocusBoundary>
      <Projects />
    </FocusBoundary>
  );
}
