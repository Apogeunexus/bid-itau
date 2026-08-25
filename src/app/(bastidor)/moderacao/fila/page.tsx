import { ModeracaoFila } from "@/componentes/moderacao-fila";
import {
  ACOES_DA_MODERACAO,
  CARIMBO_DA_DECISAO,
  COMPONENTES_DO_SCORE,
  MODERADOR_AUTORADO,
  MODERADOR_E_AUTORADO,
  ESCOPOS_DE_CURADORIA,
  FRASE_DA_ASSIMETRIA,
  FRASE_DA_ATRIBUICAO,
  ITENS_POR_ORIGEM,
  LIMITES_DA_IA,
  ORIGENS_DECLARADAS,
  POR_QUE_RODIZIO_NA_IA,
  REGRA_DA_AMOSTRAGEM,
  REGRA_DO_SCORE,
  declaracoesDaModeracao,
  distribuicaoDeScore,
  filaDaModeracao,
  itemInicialDaFila,
  numerosDaModeracao,
} from "@/dados/moderacao";

/**
 * Moderação — a fila (tela 34, WEB-05; funcionalidades 108, 109, 122). **A resposta do protótipo à pergunta do
 * RFP sobre o limite da IA.**
 *
 * PÁGINA DE SERVIDOR. É ela, e só ela, que chama `@/dados/moderacao` por valor — no build. O
 * componente de cliente recebe DTOs de primitivo e importa aquele módulo apenas por tipo. É
 * essa fronteira, e nenhuma outra, que impede 23 MB de grafo de atravessar para o navegador
 * (DP-F). Um `import` por valor daqui para lá seria invisível no código e mediria 23 MB no
 * artefato.
 *
 * A FILA INTEIRA VAI JUNTO, e é decisão, não descuido: 60 itens já achatados em primitivo,
 * medidos em 56.615 bytes contra o teto de 61.440 do plano. É esse achatamento que permite
 * trocar de item e trocar de ESCOPO sem navegar — e trocar de escopo sem trocar de URL é o
 * que D-84 pede, porque é a mesma superfície servindo recortes diferentes.
 *
 * O CARIMBO DA DECISÃO SAI DAQUI. `CARIMBO_DA_DECISAO` deriva da data de referência do
 * build; ler o relógio do runtime no cliente faria o HTML exportado e a página hidratada
 * divergirem, e ainda exporia o fuso horário de quem avalia a proposta (T-05-16).
 *
 * Todos os textos longos — a regra do score, a regra da amostragem, a frase da assimetria,
 * as declarações de D-90 — vêm do MÓDULO e não escritos no componente: eles citam números
 * medidos sobre o dado, e um literal digitado na tela passaria a afirmar, na primeira
 * regeração do grafo, número que o acervo não sustenta.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaModeracaoFila() {
  return (
    <ModeracaoFila
      fila={filaDaModeracao()}
      numeros={numerosDaModeracao()}
      escopos={ESCOPOS_DE_CURADORIA}
      origens={ORIGENS_DECLARADAS}
      acoes={ACOES_DA_MODERACAO}
      componentesDoScore={COMPONENTES_DO_SCORE}
      regraDoScore={REGRA_DO_SCORE}
      regraDaAmostragem={REGRA_DA_AMOSTRAGEM}
      porQueRodizio={POR_QUE_RODIZIO_NA_IA}
      distribuicao={distribuicaoDeScore()}
      fraseDaAssimetria={FRASE_DA_ASSIMETRIA}
      fraseDaAtribuicao={FRASE_DA_ATRIBUICAO}
      declaracoes={declaracoesDaModeracao()}
      limites={LIMITES_DA_IA}
      moderador={MODERADOR_AUTORADO}
      moderadorEhAutorado={MODERADOR_E_AUTORADO}
      carimbo={CARIMBO_DA_DECISAO}
      itensPorOrigem={ITENS_POR_ORIGEM}
      itemInicial={itemInicialDaFila()}
    />
  );
}
