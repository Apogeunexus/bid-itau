import type { Metadata } from "next";
import Link from "next/link";
import { CartaoLeitura } from "@/componentes/cartao-leitura";
import { Grafismo } from "@/componentes/grafismo";
import { leituras, milhar, secoesEditoriais, TOTAL_DE_CONTEUDOS } from "@/dados/leituras";

export const metadata: Metadata = { title: "Notícias — Agenda Cultural BR" };

/** Quantos destaques cada seção mostra no hub. O corte é declarado no link da seção. */
const DESTAQUES_POR_SECAO = 3;

/**
 * Notícias — o hub editorial da reformulação de 2026-08 («+Cultura» no site do
 * cliente): notícias, colunas, entrevistas e opinião, com contagem medida e os
 * mais recentes de cada seção. COMPONENTE DE SERVIDOR: `leituras.ts` varre o
 * grafo no build (DP-F) e cada cartão liga para a fonte no itaucultural.org.br.
 */
export default function Noticias() {
  const secoes = secoesEditoriais();
  const todas = leituras();

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-6xl desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Notícias</h1>
        </div>
        <p className="max-w-prose text-sm leading-snug">
          O lado editorial do acervo — <strong>{milhar(TOTAL_DE_CONTEUDOS)} conteúdos</strong>.
          Cada texto abre na fonte, no site do Itaú Cultural.
        </p>
      </header>

      {/* As seções como chips selecionáveis — o padrão de filtro da reformulação. */}
      <nav aria-label="Seções editoriais" className="flex flex-wrap gap-2">
        {secoes.map((s) => (
          <Link
            key={s.slug}
            href={`/noticias/${s.slug}/`}
            className="flex items-center gap-1.5 rounded-pilula border border-borda-forte px-3 py-1.5 text-sm font-semibold no-underline"
          >
            {s.rotulo}
            <span className="tipo-legenda text-tinta-3">{milhar(s.n)}</span>
          </Link>
        ))}
      </nav>

      {secoes.map((s) => {
        const destaques = todas
          .filter((i) => s.categorias.includes(i.categoria))
          .slice(0, DESTAQUES_POR_SECAO);
        return (
          <section key={s.slug} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="tipo-titulo-3 font-bold">{s.rotulo}</h2>
              <Link
                href={`/noticias/${s.slug}/`}
                className="ml-auto text-sm font-semibold text-tinta-2 no-underline"
              >
                ver as {milhar(s.n)} →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 desk:grid-cols-3">
              {destaques.map((leitura) => (
                <CartaoLeitura key={leitura.id} leitura={leitura} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
