import type { Metadata } from "next";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import { porSlug, slugsPorTipo } from "@/dados/grafo";
import { milhar } from "@/dados/leituras";
import type { Entidade } from "@/dados/tipos";

export const metadata: Metadata = { title: "Cursos — Agenda Cultural BR" };

/**
 * Cursos — as formações do acervo (classe `formacao`, a Escola Itaú Cultural) em
 * vitrine própria (reformulação 2026-08). COMPONENTE DE SERVIDOR (DP-F): a classe
 * inteira é varrida no build via `grafo.ts`. As 54 declaram fonte e resumo —
 * medido — e cada cartão abre a página do curso no site do cliente, porque a
 * formação não tem rota própria neste protótipo e um cartão sem saída seria beco.
 */
export default function Cursos() {
  const cursos: Entidade[] = [];
  for (const slug of slugsPorTipo("formacao")) {
    const e = porSlug("formacao", slug);
    if (e) cursos.push(e);
  }
  // Ordem estável por slug — a classe não declara data de início no acervo exportado.
  cursos.sort((a, b) => (a.slug < b.slug ? -1 : 1));

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-6xl desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Cursos</h1>
        </div>
        <p className="max-w-prose text-sm leading-snug">
          As <strong>{milhar(cursos.length)} formações</strong> da Escola Itaú Cultural no
          acervo — cursos e oficinas, com a inscrição na fonte.
        </p>
        <Comentario className="max-w-prose text-sm leading-snug text-tinta-2">
          A classe `formacao` inteira, varrida do acervo no build. O acervo exportado não
          declara período nem vagas — o que existe é título, resumo, linguagem e fonte, e é
          isso que a vitrine mostra, sem inventar campos.
        </Comentario>
      </header>

      <div className="grid grid-cols-1 gap-4 desk:grid-cols-3">
        {cursos.map((curso) => (
          <a
            key={curso.id}
            href={curso.fonte}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col gap-1.5 no-underline"
          >
            <CapaDeCartao
              titulo={curso.titulo}
              classe="formacao"
              linguagens={curso.linguagens}
              imagem={curso.imagem}
              creditoImagem={curso.creditoImagem}
              className="aspect-[3/2] w-full rounded-p"
            />
            <span className="line-clamp-2 text-sm leading-snug font-semibold">{curso.titulo}</span>
            {curso.resumo ? (
              <span className="line-clamp-2 tipo-legenda text-tinta-2">{curso.resumo}</span>
            ) : null}
            <SelosDeLinguagem ids={curso.linguagens} />
          </a>
        ))}
      </div>
    </div>
  );
}
