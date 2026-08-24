import { porSlug, slugsPorTipo } from "./grafo";
import { capaDe } from "./imagem";
import type { Entidade } from "./tipos";

/**
 * leituras.ts — o acervo editorial (classe `conteudo`, 1.805 registros) que serve o hub
 * de Notícias da reformulação de 2026-08. O molde é o de `play.ts`: módulo de BUILD,
 * alcança `grafo.ts` por valor, nenhum `"use client"` pode importá-lo (DP-F). As páginas
 * que ele serve são de servidor e não pagam chunk — por isso NÃO existe «fio» aqui.
 *
 * MEDIDO CONTRA O GRAFO (22/08/2026), nunca escrito à mão: 1.805 conteúdos em 22
 * categorias do CMS — noticias 1.127 · entrevista 120 · rumos 107 · agenda-cultural 97 ·
 * acervos 60 · icplay 60 · colunistas 56 · formacao 40 · opiniao 35 · publicacoes 18 ·
 * observatorio 15 · videos 11 · fotografia 11 · libras 10 · series 8 · visitas 4 ·
 * exposicoes 2 · infantil/podcasts/arte-e-acesso/ocupacao 1 cada · 20 SEM categoria.
 * Todos os 1.805 declaram `fonte`; 1.676 têm imagem local; os 20 sem categoria também
 * não declaram data nem resumo — entram como «Sem categoria», com o buraco dito.
 *
 * O SITE DO CLIENTE chama esse recorte de «+Cultura» (colunas, entrevistas, notícias,
 * opinião…). As SEÇÕES EDITORIAIS abaixo são as quatro que o cliente pediu como
 * submenu; o resto do acervo continua alcançável pela busca.
 */

const CONTEUDOS_ESPERADOS = 1805;

/** Categoria crua do CMS → português. ÚNICO lugar dessa tradução (molde de play.ts). */
const ROTULOS: Record<string, string> = {
  noticias: "Notícia",
  entrevista: "Entrevista",
  colunistas: "Coluna",
  opiniao: "Opinião",
  rumos: "Rumos",
  "agenda-cultural": "Agenda cultural",
  acervos: "Acervo",
  icplay: "IC Play",
  formacao: "Formação",
  publicacoes: "Publicação",
  "observatorio-itau-cultural": "Observatório",
  videos: "Vídeo",
  fotografia: "Fotografia",
  libras: "Libras",
  series: "Série",
  visitas: "Visita",
  exposicoes: "Exposição",
  infantil: "Infantil",
  podcasts: "Podcast",
  "arte-e-acesso": "Arte e acesso",
  ocupacao: "Ocupação",
  "": "Sem categoria",
};

export interface Leitura {
  id: string;
  slug: string;
  titulo: string;
  categoria: string;
  rotuloCategoria: string;
  resumo: string;
  imagem?: string;
  creditoImagem?: string;
  /** `imagemAlt` da fonte, quando o CMS descreveu a foto. */
  imagemAlt?: string;
  /** `AAAAMMDD` comparável; 0 quando a fonte não declara data — e o 0 é declarado. */
  dia: number;
  publicadoEm: string;
  fonte?: string;
  linguagens: string[];
}

/** Uma seção editorial do hub: o recorte que o cliente pediu como submenu. */
export interface SecaoEditorial {
  /** O segmento da rota: `/noticias/{slug}/`. */
  slug: string;
  rotulo: string;
  /** As categorias do CMS que compõem a seção. */
  categorias: string[];
  n: number;
}

interface Montado {
  itens: Leitura[];
  secoes: SecaoEditorial[];
}

let memo: Montado | null = null;

function quebrar(mensagem: string): never {
  throw new Error(`leituras.ts: ${mensagem}`);
}

function diaDe(publicadoEm: string): number {
  if (!publicadoEm) return 0;
  const n = Number(publicadoEm.slice(0, 10).replace(/-/g, ""));
  if (!Number.isInteger(n) || n < 19000101 || n > 21001231) {
    quebrar(`data de publicação irreconhecível: ${JSON.stringify(publicadoEm)}`);
  }
  return n;
}

/** As quatro seções do submenu do cliente + o restante agrupado. */
const DEFINICAO_DE_SECOES: Array<Omit<SecaoEditorial, "n">> = [
  { slug: "noticias", rotulo: "Notícias", categorias: ["noticias"] },
  { slug: "colunas", rotulo: "Colunas", categorias: ["colunistas"] },
  { slug: "entrevistas", rotulo: "Entrevistas", categorias: ["entrevista"] },
  { slug: "opiniao", rotulo: "Opinião", categorias: ["opiniao"] },
];

function montar(): Montado {
  const entidades: Entidade[] = [];
  for (const slug of slugsPorTipo("conteudo")) {
    const e = porSlug("conteudo", slug);
    if (e) entidades.push(e);
  }
  if (entidades.length !== CONTEUDOS_ESPERADOS) {
    quebrar(
      `montou ${entidades.length} conteúdos e o acervo declara ${CONTEUDOS_ESPERADOS}. ` +
        `O hub AFIRMA o número; corrija a afirmação junto com a medida.`,
    );
  }

  const itens: Leitura[] = entidades.map((e) => {
    const categoria = String(e.extra?.categoria ?? "");
    const rotulo = ROTULOS[categoria];
    if (rotulo === undefined) {
      quebrar(
        `o conteúdo «${e.slug}» tem categoria «${categoria}» sem rótulo em ROTULOS. ` +
          `Escreva o rótulo — a tela não mostra chave crua do CMS.`,
      );
    }
    const publicadoEm = typeof e.extra?.publicadoEm === "string" ? e.extra.publicadoEm : "";
    const capa = capaDe(e);
    return {
      id: e.id,
      slug: e.slug,
      titulo: e.titulo,
      categoria,
      rotuloCategoria: rotulo,
      resumo: e.resumo ?? "",
      imagem: capa.imagem,
      creditoImagem: capa.creditoImagem ?? e.creditoImagem,
      imagemAlt: typeof e.extra?.imagemAlt === "string" && e.extra.imagemAlt ? e.extra.imagemAlt : undefined,
      dia: diaDe(publicadoEm),
      publicadoEm,
      fonte: e.fonte,
      linguagens: e.linguagens,
    };
  });

  // Publicação decrescente, desempate por slug — determinístico, sem localeCompare.
  itens.sort((a, b) => b.dia - a.dia || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

  const secoes: SecaoEditorial[] = DEFINICAO_DE_SECOES.map((s) => ({
    ...s,
    n: itens.filter((i) => s.categorias.includes(i.categoria)).length,
  }));
  for (const s of secoes) {
    if (s.n === 0) quebrar(`a seção «${s.slug}» recorta ZERO conteúdos — seção vazia é beco (D-66)`);
  }

  return { itens, secoes };
}

function estado(): Montado {
  if (!memo) memo = montar();
  return memo;
}

/** Os 1.805, ordenados por publicação. Verdade de build; não atravessa a fronteira. */
export function leituras(): Leitura[] {
  return estado().itens;
}

/** As seções do submenu, com contagem medida. */
export function secoesEditoriais(): SecaoEditorial[] {
  return estado().secoes;
}

/** Uma seção pelo slug da rota, com os itens dela. */
export function secaoPorSlug(slug: string): { secao: SecaoEditorial; itens: Leitura[] } | null {
  const secao = estado().secoes.find((s) => s.slug === slug);
  if (!secao) return null;
  return { secao, itens: estado().itens.filter((i) => secao.categorias.includes(i.categoria)) };
}

export const TOTAL_DE_CONTEUDOS = CONTEUDOS_ESPERADOS;

/** Milhar com ponto, à mão — sem toLocaleString (a regra da casa desde a fase 2). */
export function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
