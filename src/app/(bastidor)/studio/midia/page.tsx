import { StudioOrgMidia } from "@/componentes/studio-org-midia";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  declaracoesDasMidias,
  midiasDoAcervo,
  numerosDasMidias,
} from "@/dados/organizacao";

/**
 * Studio · Organização — O5 · Mídia (funcionalidades 147 e 148).
 *
 * PÁGINA DE SERVIDOR, pela mesma fronteira das outras: só ela chama `@/dados/organizacao`
 * por valor, no build (DP-F).
 *
 * AS 529 VÃO JUNTAS, e são catorze campos de primitivo cada — a fila de trabalho precisa
 * responder sem navegar, e uma rota por ativo geraria 529 páginas. A lista já chega
 * ORDENADA com as sem crédito na frente: a ordenação é do módulo e não do componente,
 * porque é ela que define qual é a fila, e fila é dado.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaStudioOrgMidia() {
  const numeros = numerosDasMidias();

  return (
    <StudioOrgMidia
      midias={midiasDoAcervo()}
      numeros={numeros}
      declaracoes={declaracoesDasMidias(numeros)}
      organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
      autor={GESTOR_DA_ORGANIZACAO}
      gestorEAutorado={GESTOR_E_AUTORADO}
      dataDeReferencia={DATA_DA_MEDIDA}
    />
  );
}
