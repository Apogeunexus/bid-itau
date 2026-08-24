import type { Metadata } from "next";
import { Cast } from "@/componentes/cast";
import { catalogoNoFioCast, linguagensDoCast } from "@/dados/cast";

export const metadata: Metadata = { title: "Cast — Itaú Cultural" };

/**
 * Página do Cast — os 336 podcasts do acervo em porta própria (reformulação de
 * 2026-08: o cliente reprovou o Play misturando streaming, podcast e notícia).
 *
 * 23/08: a tela virou APP DE ÁUDIO no molde do Spotify, do mesmo jeito que o
 * Play virou vitrine no molde da Netflix. Ver o cabeçalho de
 * `src/componentes/cast.tsx` para o que ela copia e o que se recusa a copiar.
 *
 * É ELA que toca `@/dados/cast` — o módulo alcança o grafo de 23 MB e por DP-F
 * nenhum `"use client"` pode importá-lo por valor.
 */
export default function PaginaCast() {
  return <Cast catalogo={catalogoNoFioCast()} linguagens={linguagensDoCast()} />;
}
