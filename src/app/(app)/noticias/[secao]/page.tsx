import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartaoLeitura } from "@/componentes/cartao-leitura";
import { Grafismo } from "@/componentes/grafismo";
import { milhar, secaoPorSlug, secoesEditoriais } from "@/dados/leituras";

/**
 * `/noticias/[secao]` — uma seção editorial do hub (reformulação 2026-08).
 * COMPONENTE DE SERVIDOR: quatro páginas estáticas, uma por seção do submenu
 * do cliente, listadas por publicação decrescente com o CORTE DECLARADO —
 * nunca um slice silencioso.
 */

/** Teto de exibição por página. O total real fica dito ao lado do corte. */
const TETO_EXIBICAO = 60;

export function generateStaticParams() {
  return secoesEditoriais().map((s) => ({ secao: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/noticias/[secao]">): Promise<Metadata> {
  const { secao } = await params;
  const dados = secaoPorSlug(secao);
  return { title: `${dados?.secao.rotulo ?? "Seção"} — Agenda Cultural BR` };
}

export default async function Secao({ params }: PageProps<"/noticias/[secao]">) {
  const { secao } = await params;
  const dados = secaoPorSlug(secao);
  if (!dados) notFound();

  const exibidos = dados.itens.slice(0, TETO_EXIBICAO);

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-6xl desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{dados.secao.rotulo}</h1>
        </div>
        <p className="max-w-prose text-sm leading-snug">
          {milhar(dados.secao.n)} conteúdos nesta seção, por data de publicação. Cada um abre
          na fonte, no site do Itaú Cultural.
        </p>
        <nav aria-label="Outras seções" className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/noticias/"
            className="rounded-pilula border border-borda-forte px-3 py-1 text-xs font-semibold no-underline"
          >
            ← todas as seções
          </Link>
          {secoesEditoriais()
            .filter((s) => s.slug !== dados.secao.slug)
            .map((s) => (
              <Link
                key={s.slug}
                href={`/noticias/${s.slug}/`}
                className="rounded-pilula border border-borda px-3 py-1 text-xs font-semibold text-tinta-2 no-underline"
              >
                {s.rotulo} · {milhar(s.n)}
              </Link>
            ))}
        </nav>
      </header>

      {exibidos.length < dados.secao.n ? (
        <p className="tipo-legenda text-tinta-2">
          Mostrando os {milhar(exibidos.length)} mais recentes de {milhar(dados.secao.n)} — o
          corte é de exibição, e o total está dito aqui em vez de escondido.
        </p>
      ) : null}

      <div
        className="grid grid-cols-1 gap-4 desk:grid-cols-3"
        data-resultados-total={dados.secao.n}
        data-resultados-exibidos={exibidos.length}
      >
        {exibidos.map((leitura) => (
          <CartaoLeitura key={leitura.id} leitura={leitura} />
        ))}
      </div>

    </div>
  );
}
