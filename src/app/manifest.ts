import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Life OS",
    short_name: "Life OS",
    description: "Centro de comando pessoal.",
    start_url: "/",
    display: "standalone",
    background_color: "#090504",
    theme_color: "#090504",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
