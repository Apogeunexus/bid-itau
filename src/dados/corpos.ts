/**
 * corpos.ts — o HTML das matérias coletadas, virado bloco tipado.
 *
 * O grafo traz chamada, não corpo. O corpo vive em `dados/bruto/materias/`
 * (53 JSON do coletor). Este módulo lê isso no BUILD, casa por slug, e devolve
 * parágrafos / YouTube / Spotify — nunca HTML cru (T-02-16).
 *
 * DP-F: usa `fs`. Nenhum `"use client"` importa daqui.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { AutorDoCorpo, BlocoCorpo, CorpoDaMateria, EspecieSpotify } from "./corpos-wire";

export type { AutorDoCorpo, BlocoCorpo, CorpoDaMateria, EspecieSpotify } from "./corpos-wire";

const PASTA = join(process.cwd(), "dados", "bruto", "materias");

const ENTIDADES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  aacute: "á",
  Aacute: "Á",
  eacute: "é",
  Eacute: "É",
  iacute: "í",
  Iacute: "Í",
  oacute: "ó",
  Oacute: "Ó",
  uacute: "ú",
  Uacute: "Ú",
  acirc: "â",
  Acirc: "Â",
  ecirc: "ê",
  Ecirc: "Ê",
  ocirc: "ô",
  Ocirc: "Ô",
  atilde: "ã",
  Atilde: "Ã",
  otilde: "õ",
  Otilde: "Õ",
  ntilde: "ñ",
  Ntilde: "Ñ",
  ccedil: "ç",
  Ccedil: "Ç",
  agrave: "à",
  Agrave: "À",
  egrave: "è",
  ograve: "ò",
  ugrave: "ù",
  auml: "ä",
  euml: "ë",
  iuml: "ï",
  ouml: "ö",
  uuml: "ü",
  Uuml: "Ü",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  laquo: "«",
  raquo: "»",
  middot: "·",
  bull: "•",
  deg: "°",
  trade: "™",
  copy: "©",
  reg: "®",
};

let memo: Map<string, CorpoDaMateria> | null = null;

function decodificar(cru: string): string {
  return cru
    .replace(/&([a-zA-Z]+);/g, (tudo, nome: string) => ENTIDADES[nome] ?? tudo)
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCodePoint(Number.parseInt(n, 16)));
}

function textoDe(html: string): string {
  const sem = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ");
  return decodificar(sem)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function youtubeIdDe(url: string): string | undefined {
  const m = url.match(
    /(?:youtube\.com\/(?:embed\/|watch\?[^"'\s]*v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m?.[1];
}

function spotifyDe(url: string): { url: string; especie: EspecieSpotify } | undefined {
  const m = url.match(
    /open\.spotify\.com\/(?:embed\/)?(playlist|album|track|episode|show)\/([A-Za-z0-9]+)/,
  );
  if (!m || !m[1] || !m[2]) return undefined;
  const especie = m[1] as EspecieSpotify;
  return { url: `https://open.spotify.com/${especie}/${m[2]}`, especie };
}

function atributo(tag: string, nome: string): string {
  const m = tag.match(new RegExp(`${nome}\\s*=\\s*["']([^"']+)["']`, "i"));
  return m?.[1] ?? "";
}

function extraiaBlocos(html: string): BlocoCorpo[] {
  const blocos: BlocoCorpo[] = [];
  const re =
    /<iframe\b[^>]*>[\s\S]*?<\/iframe>|<blockquote\b[^>]*>[\s\S]*?<\/blockquote>|<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>|<p\b[^>]*>[\s\S]*?<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const pedaco = m[0];
    if (/^<iframe/i.test(pedaco)) {
      const src = atributo(pedaco, "src") || atributo(pedaco, "data-src");
      const yt = youtubeIdDe(src);
      if (yt) {
        blocos.push({ tipo: "youtube", id: yt });
        continue;
      }
      const sp = spotifyDe(src);
      if (sp) {
        blocos.push({ tipo: "spotify", url: sp.url, especie: sp.especie });
        continue;
      }
      continue;
    }
    if (/^<blockquote/i.test(pedaco)) {
      const texto = textoDe(pedaco);
      if (texto) blocos.push({ tipo: "citacao", texto });
      continue;
    }
    if (/^<h[1-6]/i.test(pedaco)) {
      const texto = textoDe(pedaco);
      if (texto) blocos.push({ tipo: "h", texto });
      continue;
    }
    const texto = textoDe(pedaco);
    if (texto) blocos.push({ tipo: "p", texto });
  }
  return blocos;
}

interface Cru {
  slug?: unknown;
  content?: unknown;
  page?: { sections?: Array<{ contentHtml?: unknown }> };
  videoCover?: { url?: unknown; originalUrl?: unknown; title?: unknown };
  participants?: Array<{
    name?: unknown;
    columnist?: unknown;
    description?: unknown;
  }>;
}

function lerCru(arquivo: string): Cru | undefined {
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(arquivo, "utf8")) as unknown;
  } catch {
    return undefined;
  }
  if (!json || typeof json !== "object") return undefined;
  const raiz = json as { pageProps?: { content?: unknown }; content?: unknown };
  const content = raiz.pageProps?.content ?? raiz.content ?? raiz;
  if (!content || typeof content !== "object") return undefined;
  return content as Cru;
}

function monteDeArquivo(arquivo: string): CorpoDaMateria | undefined {
  const cru = lerCru(arquivo);
  if (!cru) return undefined;
  const slug = typeof cru.slug === "string" ? cru.slug : undefined;
  if (!slug) return undefined;

  const htmlPedacos: string[] = [];
  if (Array.isArray(cru.page?.sections)) {
    for (const s of cru.page.sections) {
      if (typeof s.contentHtml === "string" && s.contentHtml.trim()) {
        htmlPedacos.push(s.contentHtml);
      }
    }
  }
  if (!htmlPedacos.length && typeof cru.content === "string") {
    htmlPedacos.push(cru.content);
  }
  const html = htmlPedacos.join("\n");
  const blocos = extraiaBlocos(html);

  const capaVideo = cru.videoCover;
  const urlCapa =
    (typeof capaVideo?.url === "string" ? capaVideo.url : "") ||
    (typeof capaVideo?.originalUrl === "string" ? capaVideo.originalUrl : "");
  const ytCapa = youtubeIdDe(urlCapa);
  if (ytCapa && !blocos.some((b) => b.tipo === "youtube" && b.id === ytCapa)) {
    const titulo = typeof capaVideo?.title === "string" ? capaVideo.title : undefined;
    blocos.unshift({ tipo: "youtube", id: ytCapa, titulo });
  }

  // Links soltos no HTML (não-iframe) — entra no fim, sem duplicar.
  for (const m of html.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
    const yt = youtubeIdDe(m[0]);
    if (yt && !blocos.some((b) => b.tipo === "youtube" && b.id === yt)) {
      blocos.push({ tipo: "youtube", id: yt });
    }
    const sp = spotifyDe(m[0]);
    if (sp && !blocos.some((b) => b.tipo === "spotify" && b.url === sp.url)) {
      blocos.push({ tipo: "spotify", url: sp.url, especie: sp.especie });
    }
  }

  const colunista = Array.isArray(cru.participants)
    ? cru.participants.find((p) => p && p.columnist && typeof p.name === "string")
    : undefined;
  const autor =
    colunista && typeof colunista.name === "string"
      ? {
          nome: colunista.name,
          descricao: typeof colunista.description === "string" ? colunista.description : "",
        }
      : undefined;

  const primeiroYt = blocos.find((b): b is Extract<BlocoCorpo, { tipo: "youtube" }> => b.tipo === "youtube");
  const primeiroSp = blocos.find((b): b is Extract<BlocoCorpo, { tipo: "spotify" }> => b.tipo === "spotify");

  return {
    slug,
    blocos,
    autor,
    youtubeId: primeiroYt?.id,
    spotify: primeiroSp ? { url: primeiroSp.url, especie: primeiroSp.especie } : undefined,
  };
}

function montar(): Map<string, CorpoDaMateria> {
  const mapa = new Map<string, CorpoDaMateria>();
  if (!existsSync(PASTA)) return mapa;
  for (const nome of readdirSync(PASTA)) {
    if (!nome.endsWith(".json")) continue;
    const corpo = monteDeArquivo(join(PASTA, nome));
    if (!corpo) continue;
    if (!corpo.blocos.length && !corpo.autor) continue;
    mapa.set(corpo.slug, corpo);
  }
  return mapa;
}

function estado(): Map<string, CorpoDaMateria> {
  if (!memo) memo = montar();
  return memo;
}

export function corpoPorSlug(slug: string): CorpoDaMateria | undefined {
  return estado().get(slug);
}

export function totalDeCorpos(): number {
  return estado().size;
}
