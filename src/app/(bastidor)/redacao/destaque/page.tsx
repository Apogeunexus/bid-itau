import { RedacaoDestaque } from "@/componentes/redacao-destaque";
import { RedacaoNavegacao } from "@/componentes/redacao-navegacao";
import {
  CARIMBO_DA_DECISAO,
  COMO_SE_SABE_O_SUBSTITUIDO,
  CURADOR_AUTORADO,
  DATA_DE_REFERENCIA_DA_REDACAO,
  REGRA_DO_DESTAQUE_UNICO,
  SERENDIPIDADE_NAO_E_CURADORIA,
  catalogoParaArrastar,
  destaqueDoFeed,
} from "@/dados/redacao";

/**
 * Redação — o destaque do feed (E2). **A curadoria com poder de sobrepor o algoritmo.**
 *
 * PÁGINA DE SERVIDOR: `destaqueDoFeed()` monta o feed de verdade no build, pela mesma
 * `montarFeed` que o app público usa — não por uma simulação escrita na Redação. É isso que
 * faz o cartão substituído ser um fato e não uma ilustração: ele é a diferença entre duas
 * execuções da montagem oficial.
 *
 * Sob `output: "export"` (D-24) a montagem roda uma vez, na geração do artefato estático.
 */
export default function PaginaRedacaoDestaque() {
  return (
    <>
      <RedacaoNavegacao atual="/redacao/destaque/" />
      <RedacaoDestaque
        feed={destaqueDoFeed()}
        catalogo={catalogoParaArrastar()}
        curador={CURADOR_AUTORADO}
        carimbo={CARIMBO_DA_DECISAO}
        dataDeReferencia={DATA_DE_REFERENCIA_DA_REDACAO}
        regraDoDestaqueUnico={REGRA_DO_DESTAQUE_UNICO}
        serendipidadeNaoECuradoria={SERENDIPIDADE_NAO_E_CURADORIA}
        comoSeSabeOSubstituido={COMO_SE_SABE_O_SUBSTITUIDO}
      />
    </>
  );
}
