import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Life OS", template: "%s · Life OS" },
  description: "Centro de comando pessoal: rotina, projetos, conhecimento, finanças e metas.",
  appleWebApp: { capable: true, title: "Life OS", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090504" },
    { media: "(prefers-color-scheme: light)", color: "#ece8e4" },
  ],
};

// Aplica tema e preferências antes da primeira pintura, para a tela não piscar.
const boot = `try{var s=JSON.parse(localStorage.getItem("lifeos.settings")||"{}"),d=document.documentElement;if(s.theme==="light"||s.theme==="dark")d.dataset.theme=s.theme;if(s.solid)d.dataset.solid="true";d.dataset.sidebar=s.sidebar==="compact"?"compact":"expanded"}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
