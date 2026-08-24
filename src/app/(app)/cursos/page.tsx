import type { Metadata } from "next";
import { Cursos } from "@/componentes/cursos";
import { catalogoDeCursos } from "@/dados/cursos";

export const metadata: Metadata = {
  title: "Cursos — Itaú Cultural",
  description: "As formações da Escola Itaú Cultural — cursos, oficinas e pós-graduação.",
};

/**
 * Cursos — as formações do acervo (classe `formacao`) em vitrine de catálogo.
 *
 * COMPONENTE DE SERVIDOR (DP-F): `cursos.ts` varre o grafo no build. O cliente
 * recebe o DTO e recorta por busca, formato, linguagem e acessibilidade. Cada
 * cartão abre a ficha em `/cursos/[slug]`.
 */
export default function PaginaCursos() {
  return <Cursos catalogo={catalogoDeCursos()} />;
}
