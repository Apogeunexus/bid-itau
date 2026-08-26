import { RedacaoNavegacao } from "@/componentes/redacao-navegacao";
import { RedacaoTesauro } from "@/componentes/redacao-tesauro";
import {
  CARIMBO_DA_DECISAO,
  CURADOR_AUTORADO,
  REGRA_DA_COR,
  REGRA_DAS_PROMOVIDAS,
  SEPARACAO_DA_APROVACAO,
  tesauro,
} from "@/dados/redacao";

/**
 * Redação — o tesauro (E4). **A camada 0 da ontologia, que hoje não tem dono.**
 *
 * PÁGINA DE SERVIDOR: `tesauro()` lê o vocabulário controlado e mede, no build, o ALCANCE de
 * cada item pela mesma adjacência que o motor de caminhada percorre. É esse número que a
 * tela mostra antes de oferecer uma fusão — oferecer primeiro e contar depois seria convidar
 * alguém a mexer às cegas na camada de que todas as outras telas dependem.
 *
 * Sob `output: "export"` (D-24) a medição roda uma vez, na geração do artefato estático.
 */
export default function PaginaRedacaoTesauro() {
  return (
    <>
      <RedacaoNavegacao atual="/redacao/tesauro/" />
      <RedacaoTesauro
        tesauro={tesauro()}
        curador={CURADOR_AUTORADO}
        carimbo={CARIMBO_DA_DECISAO}
        regraDasPromovidas={REGRA_DAS_PROMOVIDAS}
        regraDaCor={REGRA_DA_COR}
        separacaoDaAprovacao={SEPARACAO_DA_APROVACAO}
      />
    </>
  );
}
