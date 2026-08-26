import { StudioOrgEditais } from "@/componentes/studio-org-editais";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  declaracoesDosEditais,
  vocabularioDoEdital,
} from "@/dados/organizacao";

/**
 * Studio · Organização — O6 · Editais e oportunidades (funcionalidades 46, 48 e 49).
 *
 * PÁGINA DE SERVIDOR. O que ela lê do grafo é pequeno e é o que importa: as 33 linguagens do
 * vocabulário controlado, e quais das 27 unidades da federação já têm registro no acervo.
 *
 * AS 27 SÃO CONSTANTE DO PAÍS, NÃO DO ACERVO, e é decisão: derivar a lista do grafo faria o
 * campo de critério oferecer só os 25 estados que o acervo já tem — e um edital que não pode
 * mirar Sergipe e Tocantins é o mecanismo exato pelo qual o deserto se perpetua. O módulo
 * compara as duas listas e devolve a diferença nomeada.
 */
export default function PaginaStudioOrgEditais() {
  const vocabulario = vocabularioDoEdital();

  return (
    <StudioOrgEditais
      vocabulario={vocabulario}
      declaracoes={declaracoesDosEditais(vocabulario)}
      organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
      autor={GESTOR_DA_ORGANIZACAO}
      gestorEAutorado={GESTOR_E_AUTORADO}
      dataDeReferencia={DATA_DA_MEDIDA}
    />
  );
}
