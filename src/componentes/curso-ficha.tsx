"use client";

import Link from "next/link";
import { ICONE_CONFERIDO, ICONE_MAIS, ICONE_SETA } from "@/componentes/base/icones";
import { CHAVE_LISTA_CURSOS, useMinhaLista } from "@/componentes/base/minha-lista";
import { Grafismo } from "@/componentes/grafismo";
import { CtaSpotify, PalcoYoutube } from "@/componentes/palco";
import {
  diaParaIso,
  diaParaTexto,
  type CursoNoCliente,
} from "@/dados/cursos-wire";
import type { AutorDoCorpo, BlocoCorpo, EspecieSpotify } from "@/dados/corpos-wire";

/**
 * curso-ficha.tsx — a página de uma formação. Cartaz, selos, o que a
 * formação promete, irmãs do mesmo formato. A inscrição de outro sistema
 * não vira botão: esta ficha é o destino.
 */

export interface CorpoDoCurso {
  blocos: BlocoCorpo[];
  autor?: AutorDoCorpo;
  youtubeId?: string;
  spotify?: { url: string; especie: EspecieSpotify };
}

export function CursoFicha({
  curso,
  irmas,
  irmasTotal,
  corpo,
}: {
  curso: CursoNoCliente;
  irmas: CursoNoCliente[];
  irmasTotal: number;
  corpo?: CorpoDoCurso;
}) {
  const lista = useMinhaLista(CHAVE_LISTA_CURSOS);
  const naLista = lista.slugs.includes(curso.slug);

  return (
    <article className="curso-ficha" data-curso={curso.slug} data-formato={curso.formato}>
      <header className="curso-ficha-abertura">
        <p className="tipo-micro curso-ficha-kicker">
          <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
          {curso.rotuloFormato}
          {curso.dia ? (
            <>
              {" · "}
              <time dateTime={diaParaIso(curso.dia)}>{diaParaTexto(curso.dia)}</time>
            </>
          ) : null}
        </p>
        <div className="curso-ficha-cartaz">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={curso.imagem}
            alt={curso.imagemAlt}
            decoding="async"
            className="curso-ficha-foto"
          />
          {curso.creditoImagem ? (
            <span className="curso-ficha-credito tipo-micro">Foto: {curso.creditoImagem}</span>
          ) : null}
        </div>
        <h1 className="curso-ficha-titulo tipo-titulo-1">{curso.titulo}</h1>
        <ul className="curso-ficha-selos">
          {curso.gratuito ? <li className="curso-ficha-selo">Gratuito</li> : null}
          {curso.libras ? <li className="curso-ficha-selo">Libras</li> : null}
          {curso.legenda ? <li className="curso-ficha-selo">Legendagem</li> : null}
          {curso.cancelado ? (
            <li className="curso-ficha-selo" data-aviso="sim">
              Cancelado
            </li>
          ) : null}
          {curso.linguagens.map((l) => (
            <li
              key={l.id}
              className="curso-ficha-selo curso-ficha-selo--lingua"
              style={{ "--cor-chip": `var(${l.cor})` } as React.CSSProperties}
            >
              {l.rotulo}
            </li>
          ))}
        </ul>
        <p className="curso-ficha-resumo tipo-destaque">{curso.resumo}</p>
        <button
          type="button"
          data-na-lista={naLista ? "sim" : "nao"}
          aria-pressed={naLista}
          onClick={() => lista.alternar(curso.slug)}
          className="curso-ficha-lista tipo-detalhe"
        >
          {naLista ? ICONE_CONFERIDO : ICONE_MAIS}
          {naLista ? "Na minha lista" : "Guardar na lista"}
        </button>
      </header>

      {corpo?.youtubeId ? (
        <PalcoYoutube id={corpo.youtubeId} titulo={curso.titulo} poster={curso.imagem} />
      ) : null}
      {corpo?.spotify ? <CtaSpotify url={corpo.spotify.url} especie={corpo.spotify.especie} /> : null}

      {corpo?.blocos.length ? (
        <div className="curso-ficha-corpo">
          {corpo.blocos
            .filter((b) => b.tipo === "p" || b.tipo === "h" || b.tipo === "citacao")
            .map((b, i) =>
              b.tipo === "h" ? (
                <h2 key={i} className="materia-h">
                  {b.texto}
                </h2>
              ) : b.tipo === "citacao" ? (
                <blockquote key={i} className="materia-citacao">
                  {b.texto}
                </blockquote>
              ) : (
                <p key={i} className="materia-p">
                  {b.texto}
                </p>
              ),
            )}
        </div>
      ) : null}

      {irmas.length ? (
        <section className="curso-ficha-irmas">
          <h2 className="tipo-titulo-3">
            <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
            Mais {curso.rotuloFormato.toLowerCase()}
            {irmasTotal > irmas.length ? (
              <span className="tipo-legenda text-tinta-2">
                {" "}
                · {irmas.length} de {irmasTotal}
              </span>
            ) : null}
          </h2>
          <ul>
            {irmas.map((i) => (
              <li key={i.slug}>
                <Link href={i.rota} className="curso-ficha-irma">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.imagem} alt="" className="curso-ficha-irma-foto" />
                  <span>
                    <span className="tipo-detalhe">{i.titulo}</span>
                    <span className="tipo-legenda text-tinta-2">{i.rotuloFormato}</span>
                  </span>
                  <span aria-hidden>{ICONE_SETA}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="tipo-legenda">
        <Link href="/cursos/" className="underline decoration-borda-forte underline-offset-4">
          ← voltar aos cursos
        </Link>
      </p>
    </article>
  );
}
