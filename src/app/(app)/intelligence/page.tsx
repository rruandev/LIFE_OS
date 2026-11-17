import { ComingModule } from "@/components/shell/ComingModule";
import { getModule } from "@/lib/modules";

export const metadata = { title: getModule("intelligence").label };

export default function Page() {
  return <ComingModule id="intelligence" />;
}
