import type { Metadata } from "next";
import { Cast } from "@/componentes/cast";
import { PreferenciaFaixa } from "@/componentes/preferencia-faixa";
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
const CATALOGO = catalogoNoFioCast();
const LINGUAGENS = linguagensDoCast();

/* Os 336 podcasts se dividem por PROGRAMA, e é essa a pergunta. Por tema não daria: 201
 * dos 336 não declaram nenhum, e um recorte que deixa dois terços de fora é uma promessa
 * que o acervo não paga. As fileiras somam 336 exatos e nenhum item aparece em duas. */
const PROGRAMAS = CATALOGO.prateleiras.map((p) => ({
  valor: p.valor,
  rotulo: p.rotulo,
  n: p.itens.length,
}));

/* Quantos podcasts NÃO declaram linguagem nenhuma.
 *
 * Contado item a item, e não somando as facetas: um podcast que declara literatura e
 * música entra nas duas, e a soma das facetas devolvia 286 de 336 — a tela dizia que 50
 * não declaravam quando são 100. Faceta conta declarações; a pergunta aqui é por ITENS. */

export default function PaginaCast() {
  return (
    <>
      <PreferenciaFaixa
        app="cast"
        pergunta="Que programa você quer ouvir?"
        opcoes={PROGRAMAS}
      />
      <Cast catalogo={CATALOGO} linguagens={LINGUAGENS} />
    </>
  );
}
