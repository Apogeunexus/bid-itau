import Link from "next/link";
import {
  CHAVE_EXPOSICOES_PERCORRIDAS,
  ConcluirMissao,
} from "@/componentes/base/concluir-missao";
import { ICONE_MAPA, ICONE_SETA } from "@/componentes/base/icones";
import { Grafismo } from "@/componentes/grafismo";
import { PalcoYoutube } from "@/componentes/palco";
import {
  irmaDaExposicao,
  type ExposicaoPermanente,
  type RelacionadoDaExposicao,
} from "@/dados/exposicoes-permanentes";

/**
 * exposicao-permanente.tsx — a ficha de um dos dois espaços da sede.
 *
 * COMPONENTE DE SERVIDOR. YouTube entra pelo palco (cliente) só depois do
 * toque. Não há «abrir na fonte»: esta página é o destino.
 */

export function ExposicaoPermanenteFicha({
  expo,
  relacionados,
}: {
  expo: ExposicaoPermanente;
  relacionados: RelacionadoDaExposicao[];
}) {
  const irma = irmaDaExposicao(expo.slug);
  const [videoPrincipal, ...outrosVideos] = expo.videos;

  return (
    <article className="museu-expo" data-exposicao={expo.slug}>
      <header className="museu-expo-abertura">
        <figure className="museu-expo-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expo.imagem}
            alt={expo.altImagem}
            decoding="async"
            className="museu-expo-hero-foto"
          />
          <figcaption className="museu-expo-hero-credito tipo-micro">
            Foto: {expo.creditoImagem}
          </figcaption>
        </figure>

        <p className="museu-expo-kicker tipo-micro">
          <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
          {expo.kicker}
        </p>
        <h1 className="museu-expo-titulo tipo-titulo-1">{expo.titulo}</h1>
        <p className="museu-expo-subtitulo tipo-destaque">{expo.subtitulo}</p>
        <p className="museu-expo-lead tipo-corpo">{expo.lead}</p>

        <dl className="museu-expo-visita">
          <div>
            <dt className="tipo-micro">Onde</dt>
            <dd className="tipo-detalhe">
              <span className="museu-expo-visita-linha">
                {ICONE_MAPA}
                {expo.visita.endereco}
              </span>
              <span className="tipo-legenda">
                {expo.visita.andares} · {expo.visita.cidade}
              </span>
            </dd>
          </div>
          <div>
            <dt className="tipo-micro">Entrada</dt>
            <dd className="tipo-detalhe">{expo.visita.entrada}</dd>
          </div>
        </dl>
      </header>

      {videoPrincipal ? (
        <PalcoYoutube
          id={videoPrincipal.id}
          titulo={videoPrincipal.titulo}
          poster={expo.imagem}
        />
      ) : null}

      {expo.galeria.length ? (
        <section className="museu-expo-secao" aria-labelledby="museu-expo-galeria-titulo">
          <h2 id="museu-expo-galeria-titulo" className="museu-expo-secao-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
            O espaço
          </h2>
          <ul className="museu-expo-galeria">
            {expo.galeria.map((foto) => (
              <li key={foto.arquivo}>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto.arquivo} alt={foto.alt} loading="lazy" decoding="async" />
                  <figcaption className="tipo-micro">Foto: {foto.credito}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {outrosVideos.length
        ? outrosVideos.map((video) => (
            <PalcoYoutube
              key={video.id}
              id={video.id}
              titulo={video.titulo}
              poster={expo.imagem}
            />
          ))
        : null}

      {expo.textos.map((texto) => (
        <section key={texto.titulo} className="museu-expo-secao museu-expo-texto">
          <h2 className="museu-expo-secao-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
            {texto.titulo}
          </h2>
          {texto.autor ? (
            <p className="museu-expo-autor tipo-detalhe">
              <strong>{texto.autor}</strong>
              {texto.cargo ? <span className="tipo-legenda"> — {texto.cargo}</span> : null}
            </p>
          ) : null}
          {texto.paragrafos.map((p) => (
            <p key={p.slice(0, 40)} className="materia-p">
              {p}
            </p>
          ))}
        </section>
      ))}

      {expo.percursos.length ? (
        <section className="museu-expo-secao" aria-labelledby="museu-expo-percurso-titulo">
          <h2 id="museu-expo-percurso-titulo" className="museu-expo-secao-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
            O percurso
            <span className="tipo-legenda text-tinta-2"> · {expo.percursos.length}</span>
          </h2>
          <ul className="museu-expo-percursos">
            {expo.percursos.map((passo, i) => (
              <li key={passo.titulo} className="museu-expo-passo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={passo.imagem}
                  alt={passo.altImagem}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <p className="tipo-micro museu-expo-passo-n">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="tipo-destaque">{passo.titulo}</h3>
                  {passo.texto ? <p className="tipo-corpo">{passo.texto}</p> : null}
                  <p className="tipo-micro museu-expo-passo-credito">Foto: {passo.creditoImagem}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {irma ? (
        <Link href={irma.rota} className="museu-expo-irma">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={irma.imagem} alt="" />
          <span>
            <span className="tipo-micro">{irma.kicker}</span>
            <span className="tipo-destaque">{irma.titulo}</span>
            <span className="tipo-legenda">{irma.subtitulo}</span>
          </span>
          <span aria-hidden>{ICONE_SETA}</span>
        </Link>
      ) : null}

      {relacionados.length ? (
        <section className="museu-expo-secao" aria-labelledby="museu-expo-segue-titulo">
          <h2 id="museu-expo-segue-titulo" className="museu-expo-secao-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
            Continua nisto
          </h2>
          <ul className="museu-expo-segue">
            {relacionados.map((item) => (
              <li key={item.rota}>
                <Link href={item.rota} className="museu-expo-segue-item">
                  <span className="tipo-micro">{item.rotulo}</span>
                  <span className="tipo-detalhe">{item.titulo}</span>
                  <span aria-hidden>{ICONE_SETA}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ConcluirMissao
        evento="museu.exposicao.percorrida"
        alvo={{ tipo: "exposicao", id: expo.slug }}
        chave={CHAVE_EXPOSICOES_PERCORRIDAS}
        titulo="Chegou à última sala?"
        rotulo="Marcar exposição como percorrida"
        rotuloFeito="Percorrida"
      />

      <p className="museu-expo-voltar tipo-legenda">
        <Link href="/museu/" className="underline decoration-borda-forte underline-offset-4">
          ← voltar ao museu
        </Link>
      </p>
    </article>
  );
}
