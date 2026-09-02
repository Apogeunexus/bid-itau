import { StudioOrgAlcance } from "@/componentes/studio-org-alcance";
import { COMUNIDADES } from "@/dados/comunidade";
import { EVENTOS_COM_LINK_NO_ACERVO } from "@/dados/ingressos";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  eventosParaPrograma,
  instituicaoInicial,
  instituicoesDoAcervo,
  numerosDaIntegracao,
} from "@/dados/organizacao";
import { MISSOES } from "@/dados/pontos";
import { RECOMPENSAS } from "@/dados/recompensas";

/**
 * Studio · Organização — O9 · Alcance consolidado (funcionalidade 152), na V2 dos três livros.
 *
 * PÁGINA DE SERVIDOR, pela fronteira de sempre (DP-F).
 *
 * ELA NÃO CALCULA ALCANCE, e a ausência de cálculo é a decisão: o que atravessa são os 300
 * eventos com quem os realiza, a linguagem e o território — arestas contáveis. Não existe
 * neste módulo nenhuma função que produza número de público, e não existir é o que impede a
 * tela de exibir um por engano.
 *
 * OS TAMANHOS DE CATÁLOGO ATRAVESSAM COMO NÚMERO, NUNCA COMO LISTA. O componente é de
 * cliente; mandar `RECOMPENSAS` ou `MISSOES` inteiros para ele poria o catálogo do programa
 * no pacote do navegador para exibir dois inteiros. `.length` aqui e um `number` na prop
 * mantêm a fronteira onde ela sempre esteve.
 *
 * O denominador de espaço vem de `numerosDaIntegracao()` em vez de literal digitado: é a
 * mesma contagem que a tela de importação usa, e as duas nunca discordam.
 */
export default function PaginaStudioOrgAlcance() {
  const instituicoes = instituicoesDoAcervo();
  const numeros = numerosDaIntegracao();

  return (
    <StudioOrgAlcance
      instituicoes={instituicoes}
      eventos={eventosParaPrograma()}
      inicial={instituicaoInicial(instituicoes)}
      ocorrencias={numeros.ocorrencias}
      ocorrenciasComEspaco={numeros.ocorrenciasComEspaco}
      catalogo={{
        eventosDoAcervo: numeros.eventos,
        eventosComLink: EVENTOS_COM_LINK_NO_ACERVO,
        recompensas: RECOMPENSAS.length,
        missoes: MISSOES.length,
        comunidades: COMUNIDADES.length,
      }}
      organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
      autor={GESTOR_DA_ORGANIZACAO}
      gestorEAutorado={GESTOR_E_AUTORADO}
      dataDeReferencia={DATA_DA_MEDIDA}
    />
  );
}
