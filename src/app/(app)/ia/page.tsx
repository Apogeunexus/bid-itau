import type { Metadata } from "next";
import { ConversaDaIa } from "@/componentes/ia-conversa";
import { cenariosResolvidos } from "@/dados/cenarios-ia";
import { cidadesComAcervo } from "@/dados/cidade";
import { porSlug } from "@/dados/grafo";
import {
  COMPANHIAS,
  GOSTOS,
  OPCOES_DE_DIAS,
  sugestoesDaEstrelinha,
} from "@/dados/estrelinha";

export const metadata: Metadata = { title: "Roteiros — Itaú Cultural" };

/**
 * IA — conversa que monta um roteiro sobre o acervo (reformulação 2026-08).
 *
 * COMPONENTE DE SERVIDOR: as opções e as sugestões descem por props (DP-F);
 * a conversa é cliente e só navega para a combinação pré-computada. A
 * declaração de que nenhum modelo é chamado fica no kicker — é produto, não
 * rodapé.
 */
export default function Ia() {
  const cidades = cidadesComAcervo();
  const sugestoes = sugestoesDaEstrelinha();
  // Resolvido AQUI, no servidor: a conversa é cliente e não alcança o grafo (DP-F).
  const cenarios = cenariosResolvidos((slug) => porSlug("evento", slug));

  return (
    <ConversaDaIa
      gostos={GOSTOS.map((g) => ({ slug: g.slug, rotulo: g.rotulo }))}
      companhias={COMPANHIAS.map((c) => ({ slug: c.slug, rotulo: c.rotulo }))}
      dias={[...OPCOES_DE_DIAS]}
      cidades={cidades.map((c) => ({
        slug: c.slug,
        rotulo: c.titulo,
        detalhe: `${c.total} registros`,
        total: c.total,
      }))}
      sugestoes={sugestoes}
      cenarios={cenarios}
    />
  );
}
