import { StudioOcorrencias } from "@/componentes/studio-ocorrencias";
import {
  CARIMBO_DA_ALTERACAO,
  EVENTO_PADRAO_DO_STUDIO,
  FRASE_DAS_DUAS_METADES,
  FRASE_DE_D73,
  OPERADOR_DO_STUDIO,
  OPERADOR_E_AUTORADO,
  PREFIXO_DA_OCORRENCIA,
  declaracoesDoQueNaoSustenta,
  eventosDoStudio,
  historicoAutorado,
  horariosPropostos,
  numerosDoAcervo,
  parDoCenario4,
  salvamentosSemeados,
} from "@/dados/ocorrencias-studio";

/**
 * Studio — gestão de ocorrências (tela 32, STUD-02). **A outra metade do Cenário 4.**
 *
 * Página de SERVIDOR. É ela quem chama `@/dados/ocorrencias-studio` por valor, no build, e
 * passa adiante DTOs só de primitivo. O componente de cliente importa o módulo apenas por
 * tipo — é essa fronteira, e só ela, que impede 23 MB de grafo de atravessar (DP-F).
 *
 * OS 129 EVENTOS VÃO JUNTOS, COM AS SESSÕES DELES, e é decisão e não descuido. Trocar de
 * evento não navega: a URL não muda, o build não gera 129 páginas e quem opera não perde o
 * lugar. Para isso as sessões precisam estar no cliente, e por isso elas viajam ACHATADAS em
 * tupla — `[sufixo do id, "AAAA-MM-DDTHH:mm", gratuito]` —, com o prefixo comum mandado uma
 * vez só. Nenhuma `Ocorrencia` inteira e nenhuma `Entidade` atravessam (T-04-19).
 *
 * O HISTÓRICO NÃO NASCE VAZIO: as duas alterações autoradas vêm de `alerta.ts`, pela mão de
 * `historicoAutorado()`, que só as reformata. São as MESMAS que `/salvos` exibe do outro
 * lado, e é por isso que a propagação do Cenário 4 é crível sem servidor — uma fonte, duas
 * telas, nenhuma cópia.
 *
 * Todo texto que cita número — as quatro declarações honestas, a frase de D-73 — vem do
 * módulo, calculado sobre o dado. Um literal digitado aqui faria a apresentação afirmar, na
 * primeira regeração do grafo, número que o acervo não sustenta.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaStudioOcorrencias() {
  return (
    <StudioOcorrencias
      eventos={eventosDoStudio()}
      eventoPadrao={EVENTO_PADRAO_DO_STUDIO}
      prefixo={PREFIXO_DA_OCORRENCIA}
      semeados={salvamentosSemeados()}
      historicoAutorado={historicoAutorado()}
      propostas={horariosPropostos()}
      par={parDoCenario4()}
      numeros={numerosDoAcervo()}
      declaracoes={declaracoesDoQueNaoSustenta()}
      operador={OPERADOR_DO_STUDIO}
      operadorFrase={OPERADOR_E_AUTORADO}
      carimbo={CARIMBO_DA_ALTERACAO}
      fraseDeD73={FRASE_DE_D73}
      fraseDasDuasMetades={FRASE_DAS_DUAS_METADES}
    />
  );
}
