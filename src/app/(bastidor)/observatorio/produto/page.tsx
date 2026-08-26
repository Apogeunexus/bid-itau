import { ObservatorioProduto } from "@/componentes/observatorio-produto";
import { TELAS, aferirDto, montarProduto } from "@/dados/observatorio";

/**
 * `/observatorio/produto` — G2, os KPIs de produto (funcionalidade 102).
 *
 * PÁGINA DE SERVIDOR. Os três indicadores medidos saem da estrutura do grafo — o precomputo
 * de feeds, a caminhada e o repertório —, e nenhum depende de comportamento registrado. Os
 * três sem lastro são `null` com declaração, e a invariante de D-90 é conferida em
 * `montarProduto()` antes de qualquer um deles chegar aqui.
 */
export default function PaginaProduto() {
  const tela = TELAS.find((t) => t.id === "produto");
  if (!tela) throw new Error("observatorio: a tela «produto» sumiu de TELAS.");

  const dados = montarProduto();
  aferirDto("produto", { dados, telas: TELAS });

  return <ObservatorioProduto dados={dados} tela={tela} telas={TELAS} />;
}
