import { RedacaoAssinaturas } from "@/componentes/redacao-assinaturas";
import { RedacaoNavegacao } from "@/componentes/redacao-navegacao";
import {
  AUSENCIA_DO_FILTRO_DE_PERIODO,
  DIFERENCA_PARA_A_MODERACAO,
  fatiaAutorada,
} from "@/dados/redacao";

/**
 * Redação — «O que eu assinei» (E9). **A contrapartida da M9.**
 *
 * PÁGINA DE SERVIDOR: `fatiaAutorada()` varre o acervo por `grafo.ts` no build (D-47) e
 * entrega ao cliente uma lista de primitivo. O que a sessão assinou não passa por aqui —
 * mora no `localStorage` e é lido no cliente, porque não existe back-end (D-24).
 *
 * Sob `output: "export"` a varredura roda uma vez, na geração do artefato estático.
 */
export default function PaginaRedacaoAssinaturas() {
  return (
    <>
      <RedacaoNavegacao atual="/redacao/assinaturas/" />
      <RedacaoAssinaturas
        fatia={fatiaAutorada()}
        diferencaParaAModeracao={DIFERENCA_PARA_A_MODERACAO}
        ausenciaDoFiltroDePeriodo={AUSENCIA_DO_FILTRO_DE_PERIODO}
      />
    </>
  );
}
