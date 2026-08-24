import type { Metadata } from "next";
import { Cursos } from "@/componentes/cursos";
import { catalogoDeCursos } from "@/dados/cursos";

export const metadata: Metadata = {
  title: "Cursos — Agenda Cultural BR",
  description:
    "As formações da Escola Itaú Cultural — cursos, oficinas e pós-graduação, com a inscrição na fonte.",
};

/**
 * Cursos — as formações do acervo (classe `formacao`) em vitrine de catálogo.
 *
 * COMPONENTE DE SERVIDOR (DP-F): `cursos.ts` varre o grafo no build. O cliente
 * recebe o DTO e recorta por busca, formato, linguagem e acessibilidade. Cada
 * cartão abre a página do curso no site do Itaú Cultural, porque a formação
 * não tem rota própria neste protótipo e um cartão sem saída seria beco.
 */
export default function PaginaCursos() {
  return <Cursos catalogo={catalogoDeCursos()} />;
}
