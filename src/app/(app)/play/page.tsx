import { Play } from "@/componentes/play";
import {
  ACESSIBILIDADE_DAS_MIDIAS,
  catalogoNoFio,
  CORTE_DO_RESUMO,
  PONTE_COM_EVENTO,
  PROCEDENCIA_DAS_MIDIAS,
} from "@/dados/play";

/**
 * Página do Play (D-92). É ELA que toca `@/dados/play` — o módulo alcança o grafo de
 * 23 MB e por DP-F nenhum `"use client"` pode importá-lo por valor. O componente recebe
 * o DTO por propriedade, e o vocabulário posicional do fio vem de `play-wire.ts`, que
 * não importa nada por valor e por isso é seguro dos dois lados da fronteira.
 */
export default function PaginaPlay() {
  return (
    <Play
      catalogo={catalogoNoFio()}
      dimensoes={ACESSIBILIDADE_DAS_MIDIAS}
      ponte={PONTE_COM_EVENTO}
      corte={CORTE_DO_RESUMO}
      procedencia={PROCEDENCIA_DAS_MIDIAS}
    />
  );
}
