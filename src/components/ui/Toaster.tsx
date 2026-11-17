"use client";

import { Bell, CircleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { dismissToast, useToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-center gap-2 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:top-auto lg:items-end"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            role={t.kind === "error" ? "alert" : "status"}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="surface pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-full py-2 pl-4 pr-2 text-[14px]"
          >
            {t.kind === "error" && <CircleAlert aria-hidden className="size-4 shrink-0 text-danger" />}
            {t.kind === "reminder" && <Bell aria-hidden className="size-4 shrink-0 text-ember" />}
            <span className="min-w-0 flex-1 truncate">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="press shrink-0 rounded-full bg-ember px-3 py-1.5 text-[13px] font-semibold text-on-ember"
                onClick={() => {
                  t.action!.run();
                  dismissToast(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Fechar aviso"
              className="press flex size-8 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-field"
              onClick={() => dismissToast(t.id)}
            >
              <X aria-hidden className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
