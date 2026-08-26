import { ObservatorioImpacto } from "@/componentes/observatorio-impacto";
import { TELAS, aferirDto, montarImpacto } from "@/dados/observatorio";

/**
 * `/observatorio/impacto` — G3, o impacto cultural e o par de D-90 (funcionalidade 103).
 *
 * PÁGINA DE SERVIDOR, e sob `output: "export"` isso quer dizer BUILD. `montarImpacto()`
 * atravessa `repertorio.ts`, que atravessa `grafo.ts` e os 23 MB do acervo; o que cruza a
 * fronteira RSC é o recorte desta tela, e só ele. `aferirDto()` mede o recorte contra o
 * teto de 61.440 bytes antes de deixá-lo atravessar — o DTO inteiro da superfície serviria
 * esta tela do mesmo jeito e custaria o triplo, porque o que não é exibido atravessa igual.
 */
export default function PaginaImpacto() {
  const tela = TELAS.find((t) => t.id === "impacto");
  if (!tela) throw new Error("observatorio: a tela «impacto» sumiu de TELAS.");

  const dados = montarImpacto();
  aferirDto("impacto", { dados, telas: TELAS });

  return <ObservatorioImpacto dados={dados} tela={tela} telas={TELAS} />;
}
