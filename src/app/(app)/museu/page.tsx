import type { Metadata } from "next";
import { Museu } from "@/componentes/museu";

export const metadata: Metadata = { title: "Museu — Agenda Cultural BR" };

/**
 * Museu virtual — o hub museal. O recorte (5 eventos únicos, 22 espaços, 4
 * visitas) é medido em `museu.ts` no build; este arquivo só despacha. COMPONENTE
 * DE SERVIDOR (DP-F): `Museu` também é de servidor e é ele que toca o módulo
 * de dados. O clone de «Filmes e vídeos de artistas» fica de fora da vitrine.
 */
export default function PaginaMuseu() {
  return <Museu />;
}
