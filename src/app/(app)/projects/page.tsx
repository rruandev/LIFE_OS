import { ComingModule } from "@/components/shell/ComingModule";
import { getModule } from "@/lib/modules";

export const metadata = { title: getModule("projects").label };

export default function Page() {
  return <ComingModule id="projects" />;
}
