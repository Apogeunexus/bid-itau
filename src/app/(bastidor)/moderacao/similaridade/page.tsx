import { ModeracaoSimilaridade } from "@/componentes/moderacao-similaridade";
import {
  CARIMBO_DA_DECISAO,
  FRASE_DA_REVISAO_HONESTA,
  MODERADOR_AUTORADO,
  panoramaDaSimilaridade,
} from "@/dados/moderacao";

/**
 * Moderação — revisão de similaridade (M4, funcionalidade 112).
 *
 * PÁGINA DE SERVIDOR, e o achatamento aqui é o mais agressivo da sessão: as 47.259 arestas
 * `semelhante_a` são varridas no build e o que atravessa a fronteira são **12 famílias com
 * três exemplos cada** — 6,3 KB. Mandar as arestas seria mandar 71% do grafo ao navegador.
 *
 * A CONTAGEM É DIRIGIDA. `semelhante_a` é registrada nos dois sentidos pelo gerador; contar
 * só as que SAEM de cada entidade evita contar cada ligação duas vezes e chegar a um total
 * que não existe. O número medido — 47.259 de 66.563, 71% do grafo — bate com o que a
 * ontologia afirma, por um caminho independente.
 *
 * A CAUDA NÃO SOME: 529 famílias e 28.352 arestas não cabem na tela, e o DTO carrega os dois
 * números para elas entrarem no contador de «sem revisão», que é onde precisam estar.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaModeracaoSimilaridade() {
  return (
    <ModeracaoSimilaridade
      panorama={panoramaDaSimilaridade()}
      fraseDaRevisaoHonesta={FRASE_DA_REVISAO_HONESTA}
      moderador={MODERADOR_AUTORADO}
      carimbo={CARIMBO_DA_DECISAO}
    />
  );
}
