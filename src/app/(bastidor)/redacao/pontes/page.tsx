import { RedacaoNavegacao } from "@/componentes/redacao-navegacao";
import { RedacaoPontes } from "@/componentes/redacao-pontes";
import {
  CARIMBO_DA_DECISAO,
  CURADOR_AUTORADO,
  FRONTEIRA_DA_AFIRMACAO,
  PESO_DA_AUTORIA,
  REGRA_DO_MOTIVO_DA_PONTE,
  RELACOES_DE_SENTIDO,
  catalogoParaArrastar,
} from "@/dados/redacao";

/**
 * Redação — arestas de sentido (E3). **Onde a curadoria afirma.**
 *
 * PÁGINA DE SERVIDOR, e é ela que toca `@/dados/redacao` por valor, no build. O componente
 * de cliente recebe DTOs de primitivo e importa aquele módulo apenas por tipo (DP-F). O
 * catálogo é o MESMO objeto que a tela da trilha recebe — `catalogoParaArrastar` é
 * memorizado, o recorte é um só, e duas listas diferentes de candidatos nas duas telas da
 * Redação fariam o curador ver acervos distintos conforme a rota.
 *
 * OS CONTADORES POR RELAÇÃO SÃO MEDIDOS, não digitados. Eles vêm de `meta.json`, escrito
 * pelo gerador do grafo: no dia em que `influenciou` deixar de ser zero, a tela muda sozinha.
 * Um número escrito à mão aqui passaria a mentir na primeira regeração — e o zero é
 * justamente o argumento desta tela.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaRedacaoPontes() {
  return (
    <>
      <RedacaoNavegacao atual="/redacao/pontes/" />
      <RedacaoPontes
        catalogo={catalogoParaArrastar()}
        relacoes={RELACOES_DE_SENTIDO}
        peso={PESO_DA_AUTORIA}
        curador={CURADOR_AUTORADO}
        carimbo={CARIMBO_DA_DECISAO}
        fronteira={FRONTEIRA_DA_AFIRMACAO}
        regraDoMotivo={REGRA_DO_MOTIVO_DA_PONTE}
      />
    </>
  );
}
