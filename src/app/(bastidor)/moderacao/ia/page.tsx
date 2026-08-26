import { ModeracaoIa } from "@/componentes/moderacao-ia";
import {
  APROVAR_E_A_UNICA_PORTA,
  CARIMBO_DA_DECISAO,
  COMPONENTES_DO_SCORE,
  LIMITES_DA_IA,
  MODERADOR_AUTORADO,
  POR_QUE_RODIZIO_NA_IA,
  REGRA_DO_SCORE,
  distribuicaoDeScore,
  sugestoesDaIa,
} from "@/dados/moderacao";

/**
 * Moderação — revisão da IA (M3, funcionalidade 111).
 *
 * PÁGINA DE SERVIDOR, e o recorte é feito AQUI: ela manda só os 20 itens de origem `ia`, e
 * não os 68. Mandar a fila inteira e filtrar no cliente pagaria 53 KB de DTO para exibir 20
 * itens — é o mesmo raciocínio que fez o Observatório recortar por tela.
 *
 * A REGRA DO SCORE VEM DO MÓDULO, por extenso, e fica ao lado do número na tela. Não é
 * documentação: é a diferença entre «confie neste número» e «confira este número». Um score
 * sem regra à vista é o recomendador opaco contra o qual a proposta inteira se posiciona.
 *
 * A DISTRIBUIÇÃO VAI COM A POPULAÇÃO JUNTO. Publicar o recorte sem o universo de onde ele
 * saiu é deixar quem lê tomar um pelo outro — e a fila usa rodízio entre faixas justamente
 * para que o caso de confiança baixa, onde a decisão humana pesa, não desapareça de vista.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaModeracaoIa() {
  return (
    <ModeracaoIa
      itens={sugestoesDaIa()}
      componentesDoScore={COMPONENTES_DO_SCORE}
      regraDoScore={REGRA_DO_SCORE}
      porQueRodizio={POR_QUE_RODIZIO_NA_IA}
      distribuicao={distribuicaoDeScore()}
      limites={LIMITES_DA_IA}
      fraseDaPorta={APROVAR_E_A_UNICA_PORTA}
      moderador={MODERADOR_AUTORADO}
      carimbo={CARIMBO_DA_DECISAO}
    />
  );
}
