import { Acontece } from "@/componentes/acontece";
import { montarAgenda } from "@/dados/agenda";
import { montarMapaDaAgenda } from "@/dados/mapa-agenda";

/**
 * `/acontece` — AGEN-01, `docs/telas.md` tela 8.
 *
 * COMPONENTE DE SERVIDOR, e essa é a fronteira que a tela inteira depende (DP-F): é aqui,
 * no BUILD, que `montarAgenda` varre as 2.425 ocorrências do grafo de 23 MB. O que
 * atravessa para `<Acontece>` é o DTO de 192 KB, só primitivos, serializável pela
 * fronteira RSC. Nenhum componente de cliente desta rota conhece `@/dados/grafo`.
 *
 * A DATA DE REFERÊNCIA É AVALIADA UMA VEZ POR EXECUÇÃO DE BUILD, no escopo do módulo, e
 * desce por prop — nunca é lida dentro de um componente (T-03-04, e o mesmo padrão que
 * `evento/[slug]/page.tsx` fixou na fase 2). Sob `output: "export"` a página é
 * prerenderizada; um relógio de runtime faria o HTML exportado e a hidratação divergirem
 * e ainda vazaria o fuso de quem avalia.
 *
 * `toISOString().slice(0, 10)` e não uma data local: o grafo grava toda ocorrência com
 * deslocamento `-03:00` explícito, e a comparação de dia acontece por string ISO, do
 * mesmo jeito nos dois lados.
 */
const HOJE = new Date().toISOString().slice(0, 10);

export default function PaginaAcontece() {
  /* `montarMapaDaAgenda` corre AQUI, ao lado de `montarAgenda`, no mesmo escopo de
   * servidor e no mesmo build: é ele que resolve o id de cada evento da agenda, procura a
   * coordenada de cada um e MEDE a interseção entre «tem sessão datada» e «tem lugar».
   * Nada disso pode acontecer do lado do cliente — o módulo alcança os 23 MB do grafo.
   *
   * A MESMA constante `HOJE` alimenta os dois. Duas datas de referência diferentes na
   * mesma tela fariam a agenda e a declaração de interseção discordarem sobre o que é
   * passado, e a discordância seria de um dia, no caso mais fácil de não perceber. */
  return (
    <Acontece
      agenda={montarAgenda({ hoje: HOJE })}
      mapa={montarMapaDaAgenda({ hoje: HOJE })}
    />
  );
}
