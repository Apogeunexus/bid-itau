import type { Metadata } from "next";
import { NoticiasHub } from "@/componentes/noticias";

export const metadata: Metadata = { title: "Notícias — Agenda Cultural BR" };

/**
 * Notícias — a capa editorial. A página só despacha: o recorte e o desenho
 * moram em `noticias.tsx`, que é servidor e alcança `leituras.ts` (DP-F).
 */
export default function Noticias() {
  return <NoticiasHub />;
}
