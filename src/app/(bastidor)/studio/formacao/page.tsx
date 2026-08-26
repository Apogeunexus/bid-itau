import { StudioOrgFormacao } from "@/componentes/studio-org-formacao";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  declaracoesDasFormacoes,
  formacoesDoAcervo,
  numerosDasFormacoes,
  publicacoesDoAcervo,
} from "@/dados/organizacao";

/**
 * Studio · Organização — O4 · Formação (funcionalidades 144, 145 e 146).
 *
 * PÁGINA DE SERVIDOR, pela fronteira de sempre (DP-F). São 54 formações e 46 publicações,
 * achatadas em onze campos de primitivo cada — as duas listas juntas cabem folgadas, e a
 * troca entre oferta e biblioteca não pode ser navegação: é a mesma pergunta vista de dois
 * lados.
 *
 * O NÚMERO QUE A PÁGINA MEDE E QUE A TELA USA CONTRA SI MESMA: `numerosDasFormacoes()`
 * conta as marcações de dimensão das 54 e o total possível. É esse par que impede a tela de
 * comemorar «100% de ficha» sem dizer, na linha seguinte, quantos recursos existem de fato.
 */
export default function PaginaStudioOrgFormacao() {
  const numeros = numerosDasFormacoes();

  return (
    <StudioOrgFormacao
      formacoes={formacoesDoAcervo()}
      publicacoes={publicacoesDoAcervo()}
      numeros={numeros}
      declaracoes={declaracoesDasFormacoes(numeros)}
      organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
      autor={GESTOR_DA_ORGANIZACAO}
      gestorEAutorado={GESTOR_E_AUTORADO}
      dataDeReferencia={DATA_DA_MEDIDA}
    />
  );
}
