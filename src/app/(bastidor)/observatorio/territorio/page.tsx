import { ObservatorioTerritorio } from "@/componentes/observatorio-territorio";
import { LIMITES } from "@/dados/geo";
import { CONTORNO_DO_BRASIL, TELAS, aferirDto, montarTerritorio } from "@/dados/observatorio";

/**
 * `/observatorio/territorio` — G4, densidade, desertos e o método de cada coordenada
 * (funcionalidade 104).
 *
 * PÁGINA DE SERVIDOR. `montarTerritorio()` atravessa `geo.ts` — `densidadePorUf()` e o
 * índice de pinos — e reusa a ausência de coordenada de instituição já medida pela G6, em
 * vez de contar as instituições uma segunda vez. Duas contagens da mesma coisa é como a
 * superfície passa a dizer dois números para o mesmo fato.
 */
export default function PaginaTerritorio() {
  const tela = TELAS.find((t) => t.id === "territorio");
  if (!tela) throw new Error("observatorio: a tela «territorio» sumiu de TELAS.");

  const dados = montarTerritorio();
  aferirDto("territorio", { dados, telas: TELAS });

  return (
    <ObservatorioTerritorio
      dados={dados}
      viewBox={LIMITES.viewBox}
      contorno={CONTORNO_DO_BRASIL.d}
      rotuloContorno={CONTORNO_DO_BRASIL.rotulo}
      tela={tela}
      telas={TELAS}
    />
  );
}
