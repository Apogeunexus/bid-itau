import { ModeracaoDuplicatas } from "@/componentes/moderacao-duplicatas";
import {
  DUPLICATA_DO_ACERVO_E_REAL,
  NAO_HA_CASO_CRUZADO,
  O_ACERVO_NAO_PUBLICA_ORGANIZACAO,
  REGRA_DA_COMPETENCIA,
  duplicatasParaModeracao,
} from "@/dados/moderacao";

/**
 * Moderação — duplicatas entre organizações (M7, funcionalidade 113).
 *
 * PÁGINA DE SERVIDOR. Ela ESTENDE a deduplicação da fase 4 em vez de reimplementá-la:
 * `filaDeDuplicatas()` continua sendo a fonte, com os dois estágios, o limiar e a
 * comparação campo a campo que já estavam provados. O que esta tela acrescenta é o RECORTE
 * DE COMPETÊNCIA — quais grupos são da moderação e quais são do produtor.
 *
 * E o recorte devolve zero. Dos 84 grupos, nenhum junta fontes diferentes: o acervo deste
 * protótipo não tem uma única duplicata entre organizações. A tela declara isso com o
 * denominador em vez de abrir vazia, porque tela vazia não distingue «não há caso» de «a
 * busca não rodou» — e a diferença entre as duas é tudo o que ela tem para dizer hoje.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaModeracaoDuplicatas() {
  return (
    <ModeracaoDuplicatas
      panorama={duplicatasParaModeracao()}
      regraDaCompetencia={REGRA_DA_COMPETENCIA}
      naoHaCasoCruzado={NAO_HA_CASO_CRUZADO}
      acervoNaoPublicaOrganizacao={O_ACERVO_NAO_PUBLICA_ORGANIZACAO}
      duplicataDoAcervoEReal={DUPLICATA_DO_ACERVO_E_REAL}
    />
  );
}
