import type { Metadata } from "next";
import Link from "next/link";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { porSlug, slugsPorTipo } from "@/dados/grafo";
import { milhar } from "@/dados/leituras";
import type { Entidade } from "@/dados/tipos";

export const metadata: Metadata = { title: "Museu — Agenda Cultural BR" };

/**
 * Museu virtual — o hub museal da reformulação de 2026-08. O acervo NÃO tem classe
 * «museu»; o que existe, MEDIDO no build: 22 espaços com «museu» no título (cada um
 * com página de produtor), 6 eventos expositivos (1 exposição, 2 virtuais, 3
 * ocupações) e 67 conteúdos museais (exposições, visitas, acervos, ocupação). O hub
 * reúne essas três portas com o denominador dito — nunca uma coleção inventada.
 * COMPONENTE DE SERVIDOR (DP-F).
 */
export default function Museu() {
  const museus: Entidade[] = [];
  for (const slug of slugsPorTipo("espaco")) {
    const e = porSlug("espaco", slug);
    if (e && /museu/i.test(e.titulo)) museus.push(e);
  }
  museus.sort((a, b) => (a.slug < b.slug ? -1 : 1));

  const expositivos: Entidade[] = [];
  for (const slug of slugsPorTipo("evento")) {
    const e = porSlug("evento", slug);
    if (e && /expos|ocupacao/.test(String(e.extra?.categoria ?? ""))) expositivos.push(e);
  }
  expositivos.sort((a, b) => (a.slug < b.slug ? -1 : 1));

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-6xl desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Museu virtual</h1>
          <span className="ml-auto shrink-0 rounded-full border border-borda px-2 py-0.5 text-xs font-semibold text-tinta-3">
            C2
          </span>
        </div>
        <p className="max-w-prose text-sm leading-snug">
          O que o acervo tem de museal, em três portas: <strong>{milhar(museus.length)} espaços-museu</strong>,{" "}
          <strong>{milhar(expositivos.length)} eventos expositivos</strong> e o acervo digital de{" "}
          <Link href="/museu/exposicoes/" className="font-semibold text-acao-tinta">
            exposições e visitas
          </Link>
          .
        </p>
        <Comentario className="max-w-prose text-sm leading-snug text-tinta-2">
          Não existe classe «museu» na ontologia — o recorte é medido: espaços com «museu» no
          título e eventos com categoria expositiva. O denominador fica na tela para o hub
          não parecer maior do que o acervo sustenta.
        </Comentario>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="tipo-titulo-3 font-bold">Em cartaz e ocupações</h2>
        <div className="grid grid-cols-1 gap-4 desk:grid-cols-3">
          {expositivos.map((e) => (
            <Link key={e.id} href={`/evento/${e.slug}/`} className="flex flex-col gap-1.5 no-underline">
              <CapaDeCartao
                titulo={e.titulo}
                classe="evento"
                linguagens={e.linguagens}
                imagem={e.imagem}
                creditoImagem={e.creditoImagem}
                className="aspect-[3/2] w-full rounded-p"
              />
              <span className="tipo-micro text-tinta-3">
                {String(e.extra?.categoria) === "ocupacao" ? "Ocupação" : "Exposição"}
              </span>
              <span className="line-clamp-2 text-sm leading-snug font-semibold">{e.titulo}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="tipo-titulo-3 font-bold">Espaços-museu do acervo</h2>
        <div className="grid grid-cols-1 gap-2 desk:grid-cols-2">
          {museus.map((m) => (
            <Link
              key={m.id}
              href={`/produtor/${m.slug}/`}
              className="cartao flex-row items-center gap-3 no-underline"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{m.titulo}</span>
                {m.resumo ? (
                  <span className="line-clamp-1 tipo-legenda text-tinta-2">{m.resumo}</span>
                ) : null}
              </span>
              <span aria-hidden className="text-acao-tinta">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
