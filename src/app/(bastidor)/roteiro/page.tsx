import { Roteiro } from "@/componentes/roteiro";
import { montarRoteiro } from "@/dados/roteiro";

/**
 * `/roteiro` — os cinco cenários do RFP como percurso clicável (D-76, D-77, D-78,
 * STUD-03, STUD-04).
 *
 * PÁGINA DE SERVIDOR, e é aqui que o acervo é lido. Sob `output: "export"` (D-24)
 * «servidor» quer dizer BUILD: `montarRoteiro()` atravessa `grafo.ts`, `trilha.ts`,
 * `cidade.ts`, `frase.ts`, `feeds.ts` e `alerta.ts` para derivar cada número que os cinco
 * cenários citam, e o que atravessa a fronteira RSC é um DTO só de primitivo.
 *
 * É ESTE ARQUIVO QUE SEGURA DP-F. `entidades.json` tem 9,4 MB e `arestas.json` 13,6 MB;
 * nenhum dos dois pode chegar ao navegador. `roteiro.tsx` importa `@/dados/roteiro`
 * APENAS POR TIPO, e o gate transitivo da fase 3 mede isso com o caminho nomeado.
 *
 * ELA VIVE NO GRUPO `(bastidor)` DE PROPÓSITO (D-78). O roteiro é ferramenta de
 * apresentação, e o layout do grupo já entrega o que D-67 pede: na visão app, o aviso de
 * superfície de desktop com o botão que troca a visão. Este arquivo não precisa saber
 * disso, e não sabe — só `aviso-desktop.tsx` ganhou a linha que faz o aviso NOMEAR o
 * roteiro em vez de dizer «Esta superfície».
 */
export default function PaginaRoteiro() {
  return <Roteiro roteiro={montarRoteiro()} />;
}
