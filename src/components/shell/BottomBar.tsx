"use client";

import { Ellipsis, LogOut, Settings, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { isSupabaseConfigured } from "@/lib/config";
import { MOBILE_PRIMARY, MODULES } from "@/lib/modules";
import { isActive } from "./Sidebar";

const primary = MODULES.filter((m) => MOBILE_PRIMARY.includes(m.id));
const rest = MODULES.filter((m) => !MOBILE_PRIMARY.includes(m.id));

export function BottomBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inRest = rest.some((m) => isActive(pathname, m.href)) || isActive(pathname, "/settings");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav
        aria-label="Módulos"
        className="glass fixed inset-x-3 z-30 flex items-stretch justify-between rounded-full p-1.5 lg:hidden"
        style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {primary.map((m) => {
          const active = isActive(pathname, m.href);
          return (
            <Link
              key={m.id}
              href={m.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] ${
                active ? "font-semibold text-on-ember" : "text-ink-2"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottombar-active"
                  className="absolute inset-0 rounded-full bg-ember"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <m.icon aria-hidden className="relative size-[22px]" strokeWidth={1.8} />
              <span className="relative">{m.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] ${
            inRest ? "bg-field font-semibold text-ink" : "text-ink-2"
          }`}
        >
          <Ellipsis aria-hidden className="size-[22px]" strokeWidth={1.8} />
          <span>Mais</span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Mais módulos">
            <motion.button
              type="button"
              aria-label="Fechar"
              className="absolute inset-0 bg-black/55"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="surface absolute inset-x-3 rounded-panel p-3"
              style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            >
              <div className="flex items-center justify-between px-3 pb-2 pt-1">
                <h2 className="text-[17px] font-semibold">Mais</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="flex size-10 items-center justify-center rounded-full bg-field text-ink-2"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>
              <ul>
                {rest.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={m.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(pathname, m.href) ? "page" : undefined}
                      className="flex min-h-14 items-center gap-3.5 rounded-item px-3 aria-[current=page]:bg-field"
                    >
                      <m.icon aria-hidden className="size-[22px] shrink-0 text-ink-2" strokeWidth={1.8} />
                      <span className="flex-1">
                        <span className="block font-medium">{m.label}</span>
                        <span className="block text-[13px] text-ink-3">{m.summary}</span>
                      </span>
                      {!m.ready && <span className="text-[12px] text-ink-3">{m.phase}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2 border-t border-line pt-3">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-field font-medium"
                >
                  <Settings aria-hidden className="size-5" strokeWidth={1.8} />
                  Configurações
                </Link>
                {isSupabaseConfigured && (
                  <form action={signOut} className="flex-1">
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-field font-medium"
                    >
                      <LogOut aria-hidden className="size-5" strokeWidth={1.8} />
                      Sair
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
