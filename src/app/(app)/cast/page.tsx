import type { Metadata } from "next";
import Link from "next/link";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Comentario } from "@/componentes/comentario";
import { dataCurta } from "@/componentes/cartao-leitura";
import { Grafismo } from "@/componentes/grafismo";
import { catalogoDoPlay } from "@/dados/play";
import { milhar } from "@/dados/leituras";

export const metadata: Metadata = { title: "Cast — Agenda Cultural BR" };

/** Teto de exibição. O total real fica dito ao lado do corte, como sempre. */
const TETO_EXIBICAO = 60;

/**
 * Cast — os podcasts do acervo em seção própria (reformulação 2026-08: o cliente
 * reprovou o Play misturando streaming, podcast e notícia). O recorte é
 * `categoria === "podcasts"` do catálogo de mídias; cada episódio abre a página
 * do player que a fase 5 já construiu. COMPONENTE DE SERVIDOR (DP-F).
 */
export default function Cast() {
  const podcasts = catalogoDoPlay().filter((m) => m.categoria === "podcasts");
  const exibidos = podcasts.slice(0, TETO_EXIBICAO);

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-6xl desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Cast</h1>
          <span className="ml-auto shrink-0 rounded-full border border-black/15 px-2 py-0.5 text-xs font-semibold text-black/50">
            C2
          </span>
        </div>
        <p className="max-w-prose text-sm leading-snug">
          Os <strong>{milhar(podcasts.length)} podcasts</strong> do acervo em fila própria,
          por publicação — separados do streaming, que continua em Play.
        </p>
        <Comentario className="max-w-prose text-sm leading-snug text-black/60">
          O recorte é `categoria === "podcasts"` das {milhar(catalogoDoPlay().length)} mídias
          do catálogo unificado — mesma fonte, outra porta. O player declara que o acervo não
          traz o arquivo de áudio, e a ficha é o que existe.
        </Comentario>
      </header>

      {exibidos.length < podcasts.length ? (
        <p className="tipo-legenda text-tinta-2">
          Mostrando os {milhar(exibidos.length)} mais recentes de {milhar(podcasts.length)} —
          corte de exibição declarado.
        </p>
      ) : null}

      <div
        className="grid grid-cols-1 gap-4 desk:grid-cols-3"
        data-resultados-total={podcasts.length}
        data-resultados-exibidos={exibidos.length}
      >
        {exibidos.map((m) => (
          <Link key={m.slug} href={m.rota} className="flex flex-col gap-1.5 no-underline">
            <CapaDeCartao
              titulo={m.titulo}
              classe="midia"
              linguagens={m.linguagens}
              imagem={m.imagem}
              creditoImagem={m.creditoImagem}
              className="aspect-square w-full rounded-p"
            />
            <span className="tipo-micro text-tinta-3">
              Podcast · <strong className="font-display text-tinta">{dataCurta(m.dia)}</strong>
            </span>
            <span className="line-clamp-2 text-sm leading-snug font-semibold">{m.titulo}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
