"use client";

import { useAnimate, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, type ReactNode } from "react";
import { isActive, NAV_ORDER } from "@/lib/modules";

// Última tela visitada, para saber de que lado a próxima deve entrar.
let lastIndex = -1;

/**
 * Troca de tela deslizando, como no iPhone: a tela nova entra pelo lado para
 * onde a navegação andou. No celular desliza na horizontal (a barra é
 * horizontal); no computador, na vertical (a barra é vertical).
 */
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const index = NAV_ORDER.findIndex((href) => isActive(pathname, href));
    const previous = lastIndex;
    lastIndex = index;
    // Primeira carga: a página já vem pronta do servidor, sem animação.
    if (previous === -1 || previous === index || !scope.current) return;

    const direction = index > previous ? 1 : -1;
    const horizontal = window.matchMedia("(max-width: 1023px)").matches;
    const distance = reduce ? 0 : direction * (horizontal ? Math.min(window.innerWidth * 0.28, 120) : 44);

    animate(
      scope.current,
      horizontal ? { opacity: [0, 1], x: [distance, 0] } : { opacity: [0, 1], y: [distance, 0] },
      {
        type: "spring",
        stiffness: 240,
        damping: 28,
        mass: 0.9,
        opacity: { duration: 0.28, ease: "easeOut" },
      },
    );
  }, [pathname, animate, scope, reduce]);

  return <div ref={scope}>{children}</div>;
}
