import { Play } from "@/componentes/play";
import {
  catalogoNoFioStreaming,
  CORTE_DO_RESUMO,
  dimensoesDoStreaming,
  PONTE_COM_EVENTO,
  PROCEDENCIA_DAS_MIDIAS,
} from "@/dados/play";

/**
 * Página do Play (D-92, revisada na reformulação de 2026-08 por decisão do
 * cliente): a vitrine passa a ser SÓ STREAMING — vídeo, série e playlist —
 * porque podcast tem porta própria em /cast e o editorial em /noticias. O
 * catálogo unificado continua inteiro em `catalogoDoPlay()` e nas 529 rotas do
 * player; o que mudou foi o recorte da vitrine, e as dimensões de
 * acessibilidade acompanham o denominador do recorte.
 *
 * É ELA que toca `@/dados/play` — o módulo alcança o grafo de 23 MB e por DP-F
 * nenhum `"use client"` pode importá-lo por valor.
 */
export default function PaginaPlay() {
  return (
    <Play
      catalogo={catalogoNoFioStreaming()}
      dimensoes={dimensoesDoStreaming()}
      ponte={PONTE_COM_EVENTO}
      corte={CORTE_DO_RESUMO}
      procedencia={PROCEDENCIA_DAS_MIDIAS}
    />
  );
}
