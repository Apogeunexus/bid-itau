/**
 * corpos-wire.ts — os tipos do corpo editorial. Sem `fs`, para o cliente
 * (palco, ficha de curso, player) poder nomear YouTube e Spotify.
 */

export type EspecieSpotify = "playlist" | "album" | "track" | "episode" | "show";

export type BlocoCorpo =
  | { tipo: "p"; texto: string }
  | { tipo: "h"; texto: string }
  | { tipo: "citacao"; texto: string }
  | { tipo: "youtube"; id: string; titulo?: string }
  | { tipo: "spotify"; url: string; especie: EspecieSpotify };

export interface AutorDoCorpo {
  nome: string;
  descricao: string;
}

export interface CorpoDaMateria {
  slug: string;
  blocos: BlocoCorpo[];
  autor?: AutorDoCorpo;
  youtubeId?: string;
  spotify?: { url: string; especie: EspecieSpotify };
}
