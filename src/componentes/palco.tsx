"use client";

import { useState } from "react";
import { ICONE_EXTERNO, ICONE_TOCAR } from "@/componentes/base/icones";
import type { EspecieSpotify } from "@/dados/corpos-wire";

/**
 * palco.tsx — YouTube só depois do toque; Spotify como saída nomeada.
 *
 * O iframe não nasce no HTML: o portão de zero-rede mede o carregamento, e
 * um embed no DOM já seria requisição do protótipo. O clique da pessoa é o
 * mesmo estatuto que o link tinha — ela não sai da página.
 */

const ROTULO_SPOTIFY: Record<EspecieSpotify, string> = {
  playlist: "Ouvir a playlist no Spotify",
  album: "Ouvir o álbum no Spotify",
  track: "Ouvir a faixa no Spotify",
  episode: "Ouvir o episódio no Spotify",
  show: "Ouvir o programa no Spotify",
};

export function PalcoYoutube({
  id,
  titulo,
  poster,
}: {
  id: string;
  titulo: string;
  poster?: string;
}) {
  const [ligado, setLigado] = useState(false);

  if (!ligado) {
    return (
      <button
        type="button"
        className="palco-yt"
        data-palco="youtube"
        onClick={() => setLigado(true)}
        aria-label={`Reproduzir ${titulo}`}
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="palco-yt-foto" />
        ) : (
          <span className="palco-yt-fundo" aria-hidden />
        )}
        <span className="palco-yt-veu" aria-hidden />
        <span className="palco-yt-play">
          {ICONE_TOCAR}
          Reproduzir
        </span>
      </button>
    );
  }

  return (
    <div className="palco-yt palco-yt--ligado" data-palco="youtube-ligado">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
        title={titulo}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="palco-yt-frame"
      />
    </div>
  );
}

export function CtaSpotify({ url, especie }: { url: string; especie: EspecieSpotify }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="cta-spotify"
      data-saida="spotify"
    >
      {ICONE_EXTERNO}
      {ROTULO_SPOTIFY[especie]}
    </a>
  );
}
