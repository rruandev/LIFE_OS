import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

const tone = {
  info: { icon: Info, cls: "text-ink-2 border-line bg-field" },
  error: { icon: CircleAlert, cls: "text-danger border-danger/40 bg-danger/10" },
  ok: { icon: CircleCheck, cls: "text-ok border-ok/40 bg-ok/10" },
};

export function Notice({
  kind = "info",
  children,
}: {
  kind?: keyof typeof tone;
  children: ReactNode;
}) {
  const { icon: Icon, cls } = tone[kind];
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-item border px-4 py-3 text-[14px] leading-snug ${cls}`}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
