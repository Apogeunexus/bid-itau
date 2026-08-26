import { ModeracaoReconciliacao } from "@/componentes/moderacao-reconciliacao";
import {
  CARIMBO_DA_DECISAO,
  MODERADOR_AUTORADO,
  PESSOAS_NA_BASE_COMPLETA,
  PESSOAS_NO_PROTOTIPO,
  REGRA_DA_RECONCILIACAO,
  VERBETE_E_AUTORIDADE_DA_ENCICLOPEDIA,
  propostasDeAgente,
} from "@/dados/moderacao";

/**
 * Moderação — reconciliação com a Enciclopédia (M6, funcionalidade 117).
 *
 * PÁGINA DE SERVIDOR. Os candidatos saem de casamento de nome NORMALIZADO contra o acervo,
 * usando `normalizar` — a mesma função do índice de busca do produto, e não uma segunda
 * normalização escrita aqui. Duas normalizações divergiriam no dia em que uma mudasse, e o
 * sintoma seria a moderação não achar o verbete que a busca acha.
 *
 * O DENOMINADOR VEM CONTADO, e não digitado: `PESSOAS_NO_PROTOTIPO` é medido sobre o grafo.
 * Uma reconciliação que erra liga o trabalho de uma pessoa ao verbete de outra, e o tamanho
 * do universo é o que dá a medida do risco.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaModeracaoReconciliacao() {
  return (
    <ModeracaoReconciliacao
      propostas={propostasDeAgente()}
      verbeteEAutoridade={VERBETE_E_AUTORIDADE_DA_ENCICLOPEDIA}
      regraDaReconciliacao={REGRA_DA_RECONCILIACAO}
      pessoasNoPrototipo={PESSOAS_NO_PROTOTIPO}
      pessoasNaBaseCompleta={PESSOAS_NA_BASE_COMPLETA}
      moderador={MODERADOR_AUTORADO}
      carimbo={CARIMBO_DA_DECISAO}
    />
  );
}
