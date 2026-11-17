import { ComingModule } from "@/components/shell/ComingModule";
import { getModule } from "@/lib/modules";

export const metadata = { title: getModule("growth").label };

export default function Page() {
  return <ComingModule id="growth" />;
}
