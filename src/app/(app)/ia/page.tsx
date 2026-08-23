import type { Metadata } from "next";
import { Comentario } from "@/componentes/comentario";
import { EntrevistaEstrelinha, RoteirosSalvos } from "@/componentes/entrevista-estrelinha";
import { Grafismo } from "@/componentes/grafismo";
import { cidadesComAcervo } from "@/dados/cidade";
import { COMPANHIAS, GOSTOS, OPCOES_DE_DIAS } from "@/dados/estrelinha";
import { milhar } from "@/dados/leituras";

export const metadata: Metadata = { title: "IA — Agenda Cultural BR" };

/**
 * IA — a estrelinha (reformulação 2026-08): entrevista de quatro perguntas e um
 * roteiro pré-computado por combinação. COMPONENTE DE SERVIDOR: as opções descem
 * por props (DP-F); a entrevista é cliente e só navega. A declaração de simulação
 * é PRODUTO — fica na tela nos dois modos, porque «IA amplia, nunca substitui a
 * mediação» é princípio do RFP e a transparência é o argumento.
 */
export default function Ia() {
  const cidades = cidadesComAcervo();

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Roteiros com IA ✦</h1>
          <span className="ml-auto shrink-0 rounded-full border border-borda px-2 py-0.5 text-xs font-semibold text-tinta-3">
            C2
          </span>
        </div>
        <p className="max-w-prose text-sm leading-snug">
          Quatro perguntas e a estrelinha monta um roteiro dia a dia sobre o acervo — com o
          percurso no mapa e o motivo de cada parada visível.
        </p>
        {/* PRODUTO, não comentário: a simulação declarada é o argumento. */}
        <p className="max-w-prose rounded-m border border-borda bg-superficie-2 px-3 py-2 text-sm leading-snug">
          <strong>Assistente simulado:</strong> nenhum modelo de IA é chamado. Cada
          combinação de respostas é uma página montada no build por regras determinísticas
          sobre o grafo — as regras ficam impressas no roteiro, e é isso que faz dele uma
          recomendação explicável em vez de uma caixa-preta.
        </p>
        <Comentario className="max-w-prose text-sm leading-snug text-tinta-2">
          São {milhar(cidades.length * OPCOES_DE_DIAS.length * GOSTOS.length)} combinações
          pré-computadas ({cidades.length} cidades × {OPCOES_DE_DIAS.length} janelas ×{" "}
          {GOSTOS.length} gostos) — o mesmo princípio dos 96 feeds de Descobrir: a resposta
          existe antes da pergunta, e por isso é conferível.
        </Comentario>
      </header>

      <EntrevistaEstrelinha
        gostos={GOSTOS.map((g) => ({ slug: g.slug, rotulo: g.rotulo }))}
        companhias={COMPANHIAS.map((c) => ({ slug: c.slug, rotulo: c.rotulo }))}
        dias={[...OPCOES_DE_DIAS]}
        cidades={cidades.map((c) => ({
          slug: c.slug,
          rotulo: c.titulo,
          detalhe: `${c.total} registros`,
        }))}
      />

      <section className="flex flex-col gap-2 border-t border-borda pt-4">
        <h2 className="tipo-titulo-3 font-bold">Seus roteiros salvos</h2>
        <RoteirosSalvos />
      </section>
    </div>
  );
}
