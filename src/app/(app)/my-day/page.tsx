import { FocusBoundary } from "@/components/shell/FocusBoundary";
import { MyDay } from "@/modules/my-day/MyDay";

export const metadata = { title: "My Day" };

export default function Page() {
  return (
    <FocusBoundary>
      <MyDay />
    </FocusBoundary>
  );
}
