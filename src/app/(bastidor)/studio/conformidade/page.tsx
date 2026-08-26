import { StudioOrgConformidade } from "@/componentes/studio-org-conformidade";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  midiasDoAcervo,
} from "@/dados/organizacao";

/**
 * Studio · Organização — O10 · Conformidade da equipe (funcionalidade 168).
 *
 * PÁGINA DE SERVIDOR, pela fronteira de sempre (DP-F). O que ela lê do grafo é o acervo de
 * mídia — é dele que sai a parte da fila que não depende do produtor: os itens sem crédito,
 * que não publicam.
 *
 * A OUTRA METADE DA FILA NÃO VEM DAQUI, e não poderia: os registros do produtor moram no
 * `localStorage` do navegador, escritos pelo nível 7. O componente de cliente os lê pelo
 * contrato compartilhado, depois de montar — nunca no render, que faria o HTML exportado
 * divergir da página hidratada.
 */
export default function PaginaStudioOrgConformidade() {
  return (
    <StudioOrgConformidade
      midias={midiasDoAcervo()}
      organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
      autor={GESTOR_DA_ORGANIZACAO}
      gestorEAutorado={GESTOR_E_AUTORADO}
      dataDeReferencia={DATA_DA_MEDIDA}
    />
  );
}
