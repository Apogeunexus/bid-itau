import { StudioOrgPrograma } from "@/componentes/studio-org-programa";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  declaracoesDosProgramas,
  eventosParaPrograma,
  numerosDosProgramas,
} from "@/dados/organizacao";

/**
 * Studio · Organização — O3 · Programa (funcionalidade 143).
 *
 * PÁGINA DE SERVIDOR, pela fronteira de sempre (DP-F).
 *
 * O ZERO É CONTADO AQUI, e não escrito. `numerosDosProgramas()` pede a lista da classe
 * `programa` ao grafo e mede o tamanho dela. Escrever «0» na tela seria mais curto e pararia
 * de ser verdade no dia em que alguém povoasse a classe — e pararia em silêncio, que é o
 * único jeito de errar que este produto não pode se permitir.
 *
 * OS 300 EVENTOS VÃO JUNTOS, achatados em seis campos de primitivo. Eles são o que o
 * guarda-chuva reúne, e a busca precisa responder sem navegar.
 */
export default function PaginaStudioOrgPrograma() {
  const numeros = numerosDosProgramas();

  return (
    <StudioOrgPrograma
      eventos={eventosParaPrograma()}
      numeros={numeros}
      declaracoes={declaracoesDosProgramas(numeros)}
      organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
      autor={GESTOR_DA_ORGANIZACAO}
      gestorEAutorado={GESTOR_E_AUTORADO}
      dataDeReferencia={DATA_DA_MEDIDA}
    />
  );
}
