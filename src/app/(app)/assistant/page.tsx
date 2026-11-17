import { ComingModule } from "@/components/shell/ComingModule";
import { getModule } from "@/lib/modules";

export const metadata = { title: getModule("assistant").label };

export default function Page() {
  return <ComingModule id="assistant" />;
}
