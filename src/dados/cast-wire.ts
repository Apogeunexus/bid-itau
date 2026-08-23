/**
 * cast-wire.ts — o vocabulário do Cast na fronteira RSC.
 *
 * Mesmo papel de `play-wire.ts`, e a mesma regra: **zero import por valor**, só
 * `import type`. `cast.ts` alcança o grafo de 23 MB e por DP-F nenhum
 * `"use client"` pode importá-lo.
 *
 * O catálogo em si viaja no formato de `play-wire.ts` — mesmo empacotador
 * (`fioDeItens`) e mesmas fileiras (`prateleiras.ts`) das duas vitrines. O que
 * é só do Cast é o recorte por linguagem, que mora aqui.
 */

/** Uma linguagem artística contada sobre os podcasts, com a cor vinda do dado (D-08). */
export interface LinguagemDoCast {
  valor: string;
  rotulo: string;
  /** O NOME DO TOKEN CSS (`"--ic-lilas"`), nunca um hex. */
  cor: string;
  n: number;
}
