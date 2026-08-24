/**
 * museu.ts — o recorte museal do acervo, montado no BUILD.
 *
 * O acervo NÃO tem classe «museu». O que existe, MEDIDO: espaços com «museu» no
 * título, eventos cuja categoria do CMS é exposição/ocupação, e os conteúdos
 * editoriais de visita. Este módulo é a única porta desses três conjuntos — a
 * tela não varre o grafo de novo.
 *
 * DP-F: importa `@/dados/grafo` por valor. Nenhum `"use client"` pode importá-lo.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CAPAS_MUSEU } from "./capas-museu";
import { UNIDADES_FEDERATIVAS } from "./contorno-brasil";
import {
  EXPOSICOES_PERMANENTES,
  TOTAL_DE_PERMANENTES,
  type ExposicaoPermanente,
  type RelacionadoDaExposicao,
} from "./exposicoes-permanentes";
import { porSlug, slugsPorTipo } from "./grafo";
import { leituras } from "./leituras";
import { rotaDaEntidade } from "./rotas";
import type { Entidade } from "./tipos";

/** Os 22 espaços-museu no grafo. Afirmar o número; se o grafo mudar, o build cai. */
const ESPACOS_NO_GRAFO = 22;

/**
 * Os 5 eventos expositivos ÚNICOS. O sexto registro do recorte é clone de
 * «Filmes e vídeos de artistas» (`clonadoDe` / `extra.duplicataDe`) — entra no
 * Studio, não na vitrine. Mostrar os dois seria o mesmo cartaz duas vezes.
 */
const CARTAZ_ESPERADO = 5;

const VISITAS_ESPERADAS = 4;

/** A vitrine só lista quem tem fachada. MAP não tem foto livre do prédio — some. */
const ESPACOS_NA_VITRINE = 21;

const SIGLA_POR_ESTADO = new Map(UNIDADES_FEDERATIVAS.map((u) => [u.titulo, u.sigla]));

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export type CategoriaDoCartaz = "ocupacao" | "exposicoes" | "exposicoes-virtuais";

export type PorteDoCartaz = "alto" | "paisagem" | "faixa";

export interface CartazDoMuseu {
  slug: string;
  titulo: string;
  categoria: CategoriaDoCartaz;
  rotuloCategoria: string;
  rota: string;
  imagem?: string;
  creditoImagem?: string;
  altImagem: string;
  linguagens: string[];
  /** `AAAAMMDD`; 0 quando a fonte não declara. */
  dia: number;
  inicio: number;
  fim: number;
  /** `true` quando o CMS põe um fim-sentinela (≥ 2030) no lugar de uma data real. */
  aberto: boolean;
  online: boolean;
  meta: string;
  porte: PorteDoCartaz;
}

export interface EspacoDoMuseu {
  slug: string;
  titulo: string;
  rota: string;
  resumo: string;
  imagem: string;
  creditoImagem: string;
  altImagem: string;
  linguagens: string[];
  lugar: string;
}

export interface PortaDoMuseu {
  id: "permanentes" | "exposicoes" | "ocupacoes" | "visitas";
  rotulo: string;
  href: string;
  n: number;
}

export interface HubDoMuseu {
  permanentes: readonly ExposicaoPermanente[];
  cartaz: CartazDoMuseu[];
  espacos: EspacoDoMuseu[];
  portas: PortaDoMuseu[];
  visitas: number;
}

const ROTULO_CATEGORIA: Record<CategoriaDoCartaz, string> = {
  ocupacao: "Ocupação",
  exposicoes: "Exposição",
  "exposicoes-virtuais": "Exposição virtual",
};

function quebrar(mensagem: string): never {
  throw new Error(`museu.ts: ${mensagem}`);
}

function textoDe(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function diaDeIso(iso: string): number {
  if (!iso) return 0;
  const n = Number(iso.slice(0, 10).replace(/-/g, ""));
  if (!Number.isInteger(n) || n < 19000101 || n > 21001231) return 0;
  return n;
}

function categoriaDoEvento(e: Entidade): CategoriaDoCartaz | null {
  const c = textoDe(e.extra?.categoria);
  if (c === "ocupacao" || c === "exposicoes" || c === "exposicoes-virtuais") return c;
  return null;
}

function eClone(e: Entidade): boolean {
  if (e.clonadoDe) return true;
  return typeof e.extra?.duplicataDe === "string" && e.extra.duplicataDe.length > 0;
}

function periodoDe(extra: Record<string, unknown> | undefined): { inicio: string; fim: string } {
  const p = extra?.periodo;
  if (!p || typeof p !== "object") return { inicio: "", fim: "" };
  const o = p as Record<string, unknown>;
  return { inicio: textoDe(o.inicio), fim: textoDe(o.fim) };
}

/** `AAAAMMDD` → «22 nov 2023». Sem Intl, sem fuso — o dia é o que a fonte escreveu. */
export function dataCurtaDoMuseu(dia: number): string {
  if (!dia) return "";
  const s = String(dia);
  const mes = MESES[Number(s.slice(4, 6)) - 1] ?? "";
  return `${Number(s.slice(6, 8))} ${mes} ${s.slice(0, 4)}`;
}

function metaDoCartaz(entrada: {
  dia: number;
  inicio: number;
  fim: number;
  aberto: boolean;
  online: boolean;
}): string {
  const partes: string[] = [];
  if (entrada.fim && !entrada.aberto) partes.push(`Até ${dataCurtaDoMuseu(entrada.fim)}`);
  else if (entrada.inicio && entrada.aberto) partes.push(`Desde ${dataCurtaDoMuseu(entrada.inicio)}`);
  else if (entrada.dia) partes.push(`Publicado em ${dataCurtaDoMuseu(entrada.dia)}`);
  if (entrada.online) partes.push("On-line");
  return partes.join(" · ");
}

/**
 * O porte de cada cartaz, na ordem em que eles entram na grade.
 *
 * A referência empilha: um em pé à esquerda, dois paisagem à direita, o resto
 * em faixa. A regra é POSIÇÃO, não gosto — o primeiro da lista (já ordenada
 * por data) ganha o retrato, os dois seguintes fecham a coluna, e o que sobra
 * sangra na largura toda.
 */
function portesDoCartaz(n: number): PorteDoCartaz[] {
  if (n <= 0) return [];
  if (n === 1) return ["faixa"];
  if (n === 2) return ["alto", "paisagem"];
  const portes: PorteDoCartaz[] = ["alto", "paisagem", "paisagem"];
  for (let i = 3; i < n; i++) portes.push("faixa");
  return portes;
}

/**
 * Largura/altura do arquivo em `public/acervo`. Serve para o mosaico: o retrato
 * vai no slot em pé, o mais largo na faixa. Sem isto, a ocupação do Machado
 * (retrato 0,74) caía na faixa 15:7 e o rosto saía do quadro.
 *
 * 1,5 (paisagem) é o fallback quando o arquivo não está no disco — o mesmo
 * valor que a curadoria do hero usa como piso de razão larga.
 */
function razaoDaImagem(src: string | undefined): number {
  if (!src) return 1.5;
  const arquivo = src.replace(/^\/acervo\//, "");
  let b: Buffer;
  try {
    b = readFileSync(join(process.cwd(), "public", "acervo", arquivo));
  } catch {
    return 1.5;
  }
  if (b.length < 24) return 1.5;
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marcador = b[i + 1];
      if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
        const altura = b.readUInt16BE(i + 5);
        const largura = b.readUInt16BE(i + 7);
        return altura ? largura / altura : 1.5;
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
    return 1.5;
  }
  if (b[0] === 0x89 && b[1] === 0x50) {
    const largura = b.readUInt32BE(16);
    const altura = b.readUInt32BE(20);
    return altura ? largura / altura : 1.5;
  }
  return 1.5;
}

function lugarDoEspaco(e: Entidade): string {
  const cidade = textoDe(e.extra?.cidade);
  const estado = textoDe(e.extra?.estado);
  const pais = textoDe(e.extra?.pais);
  if (cidade && estado) {
    const sigla = SIGLA_POR_ESTADO.get(estado);
    return sigla ? `${cidade}, ${sigla}` : `${cidade}, ${estado}`;
  }
  if (cidade) return cidade;
  if (pais && pais !== "Brasil") return pais;
  return "";
}

function porChave(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

let memo: HubDoMuseu | null = null;

function montar(): HubDoMuseu {
  const brutos: Entidade[] = [];
  for (const slug of slugsPorTipo("evento")) {
    const e = porSlug("evento", slug);
    if (!e || eClone(e)) continue;
    if (categoriaDoEvento(e)) brutos.push(e);
  }

  if (brutos.length !== CARTAZ_ESPERADO) {
    quebrar(
      `montou ${brutos.length} eventos expositivos únicos e o acervo declara ${CARTAZ_ESPERADO}. ` +
        `A vitrine AFIRMA o número; corrija a afirmação junto com a medida.`,
    );
  }

  const semPorte: Omit<CartazDoMuseu, "porte">[] = brutos.map((e) => {
    const categoria = categoriaDoEvento(e);
    if (!categoria) quebrar(`o evento «${e.slug}» passou o recorte sem categoria`);
    const periodo = periodoDe(e.extra);
    const inicio = diaDeIso(periodo.inicio);
    const fim = diaDeIso(periodo.fim);
    const aberto = fim >= 20300101;
    const dia = diaDeIso(textoDe(e.extra?.publicadoEm));
    const online = categoria === "exposicoes-virtuais" || /on-?line/i.test(e.titulo);
    return {
      slug: e.slug,
      titulo: e.titulo,
      categoria,
      rotuloCategoria: ROTULO_CATEGORIA[categoria],
      rota: `/evento/${e.slug}/`,
      imagem: e.imagem,
      creditoImagem: e.creditoImagem,
      altImagem: textoDe(e.extra?.imagemAlt),
      linguagens: e.linguagens,
      dia,
      inicio,
      fim,
      aberto,
      online,
      meta: metaDoCartaz({ dia, inicio, fim, aberto, online }),
    };
  });

  /* Retrato no slot em pé, largo na faixa — a ordem da vitrine é a da FORMA,
     não a da data. Data continua na meta de cada cartaz. */
  const porRazao = [...semPorte].sort(
    (a, b) => razaoDaImagem(a.imagem) - razaoDaImagem(b.imagem) || porChave(a.slug, b.slug),
  );
  const portes = portesDoCartaz(porRazao.length);
  const cartaz: CartazDoMuseu[] = porRazao.map((item, i) => ({
    ...item,
    porte: portes[i] ?? "faixa",
  }));

  const noGrafo: Entidade[] = [];
  for (const slug of slugsPorTipo("espaco")) {
    const e = porSlug("espaco", slug);
    if (e && /museu/i.test(e.titulo)) noGrafo.push(e);
  }
  if (noGrafo.length !== ESPACOS_NO_GRAFO) {
    quebrar(
      `montou ${noGrafo.length} espaços-museu no grafo e o acervo declara ${ESPACOS_NO_GRAFO}. ` +
        `A lista AFIRMA o número; corrija a afirmação junto com a medida.`,
    );
  }

  const espacos: EspacoDoMuseu[] = [];
  for (const e of noGrafo) {
    const foto = CAPAS_MUSEU[e.slug];
    if (!foto) continue;
    if (!existsSync(join(process.cwd(), "public", "museus", foto.arquivo))) {
      quebrar(`foto de «${e.slug}» ausente em public/museus/${foto.arquivo}`);
    }
    espacos.push({
      slug: e.slug,
      titulo: e.titulo,
      rota: `/produtor/${e.slug}/`,
      resumo: e.resumo ?? "",
      imagem: `/museus/${foto.arquivo}`,
      creditoImagem: foto.credito,
      altImagem: `Fachada de ${e.titulo}. Foto: ${foto.credito}`,
      linguagens: e.linguagens,
      lugar: lugarDoEspaco(e),
    });
  }
  espacos.sort((a, b) => porChave(a.slug, b.slug));

  if (espacos.length !== ESPACOS_NA_VITRINE) {
    quebrar(
      `a vitrine montou ${espacos.length} espaços com foto e declara ${ESPACOS_NA_VITRINE}. ` +
        `MAP some de propósito; qualquer outro buraco é foto que faltou baixar.`,
    );
  }

  const visitas = leituras().filter((l) => l.categoria === "visitas").length;
  if (visitas !== VISITAS_ESPERADAS) {
    quebrar(
      `montou ${visitas} visitas editoriais e o acervo declara ${VISITAS_ESPERADAS}. ` +
        `O chip AFIRMA o número; corrija a afirmação junto com a medida.`,
    );
  }

  if (EXPOSICOES_PERMANENTES.length !== TOTAL_DE_PERMANENTES) {
    quebrar(
      `declara ${TOTAL_DE_PERMANENTES} exposições permanentes e o catálogo tem ${EXPOSICOES_PERMANENTES.length}.`,
    );
  }
  for (const expo of EXPOSICOES_PERMANENTES) {
    const arquivos = [
      expo.imagem,
      ...expo.galeria.map((g) => g.arquivo),
      ...expo.percursos.map((p) => p.imagem),
    ];
    for (const src of arquivos) {
      const rel = src.replace(/^\//, "");
      if (!existsSync(join(process.cwd(), "public", rel))) {
        quebrar(`foto de «${expo.slug}» ausente em public/${rel}`);
      }
    }
  }

  const nExposicoes = cartaz.filter((c) => c.categoria !== "ocupacao").length;
  const nOcupacoes = cartaz.filter((c) => c.categoria === "ocupacao").length;

  const portas: PortaDoMuseu[] = [
    {
      id: "permanentes",
      rotulo: "Permanentes",
      href: "#permanentes",
      n: TOTAL_DE_PERMANENTES,
    },
    {
      id: "exposicoes",
      rotulo: "Exposições",
      href: "/museu/exposicoes/",
      n: nExposicoes,
    },
    {
      id: "ocupacoes",
      rotulo: "Ocupações",
      href: "#cartaz",
      n: nOcupacoes,
    },
    {
      id: "visitas",
      rotulo: "Visitas guiadas",
      href: "/museu/exposicoes/",
      n: visitas,
    },
  ];

  return { permanentes: EXPOSICOES_PERMANENTES, cartaz, espacos, portas, visitas };
}

export function hubDoMuseu(): HubDoMuseu {
  if (!memo) memo = montar();
  return memo;
}

export const TOTAL_DE_ESPACOS_MUSEU = ESPACOS_NA_VITRINE;
export const TOTAL_DO_CARTAZ = CARTAZ_ESPERADO;

const TETO_RELACIONADOS = 6;

/** Matérias e eventos do acervo que falam do espaço — não da cátedra homônima. */
export function relacionadosDaExposicao(slug: string): RelacionadoDaExposicao[] {
  const trecho =
    slug === "espaco-olavo-setubal"
      ? /espaco-olavo-setubal/
      : /numismatica|filatelia|herculano/;
  const itens: RelacionadoDaExposicao[] = [];
  for (const classe of ["evento", "conteudo"] as const) {
    for (const s of slugsPorTipo(classe)) {
      if (/catedra/.test(s) || !trecho.test(s)) continue;
      const e = porSlug(classe, s);
      if (!e) continue;
      const rota = rotaDaEntidade(classe, s);
      if (!rota) continue;
      itens.push({
        titulo: e.titulo,
        rota,
        rotulo: classe === "evento" ? "Evento" : "Matéria",
      });
      if (itens.length >= TETO_RELACIONADOS) return itens;
    }
  }
  return itens;
}

/** Quantos espaços a lista mostra antes do «explorar todos». O resto continua na página. */
export const TETO_DA_LISTA_DE_ESPACOS = 5;
