/**
 * cursos-wire.ts — o vocabulário da vitrine de formação que os dois lados da
 * fronteira compartilham.
 *
 * `cursos.ts` alcança o grafo de 23 MB e por DP-F nenhum `"use client"` pode
 * importá-lo. Este arquivo não importa nada por valor: só tipos e funções puras
 * sobre o DTO já montado. É o mesmo contrato de `play-wire.ts`, sem a tupla —
 * são 54 itens, e o nome do campo repetido 54 vezes cabe no orçamento.
 */

export type FormatoCurso = "curso" | "oficina" | "pos" | "encontro" | "formacao";

/**
 * Formato derivado do TÍTULO (e do resumo, e da linguagem `oficinas` quando a
 * fonte a declara). Não é curadoria: a afirmação «isto é um mestrado» é
 * conferível lendo o título, o mesmo princípio de `prateleiras.ts`.
 */
export const ROTULOS_DE_FORMATO: Record<FormatoCurso, string> = {
  curso: "Curso",
  oficina: "Oficina",
  pos: "Pós-graduação",
  encontro: "Encontro",
  formacao: "Formação",
};

export function classificarFormato(
  titulo: string,
  resumo: string,
  linguagens: readonly string[],
): FormatoCurso {
  const s = `${titulo} ${resumo}`.toLowerCase();
  if (/doutorado|mestrado|especializa|c[áa]tedra/.test(s)) return "pos";
  if (/encontros?\s+de\s+professores?/.test(s)) return "encontro";
  if (/oficina|ateli[eê]/.test(s) || linguagens.includes("oficinas")) return "oficina";
  if (/\bcurso|cursos|\bead\b/.test(s)) return "curso";
  return "formacao";
}

export function textoTemGratuito(titulo: string, resumo: string): boolean {
  return /gratuit/.test(`${titulo} ${resumo}`.toLowerCase());
}

export function textoEstaCancelado(titulo: string, resumo: string): boolean {
  return /cancelad/.test(`${titulo} ${resumo}`.toLowerCase());
}

/** A mesma regra de `indice.ts`: busca sem acento, sem caixa, espaços colapsados. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export interface LinguagemDoCurso {
  id: string;
  rotulo: string;
  /** Nome do token CSS (`"--ic-lilas"`), nunca um hex. */
  cor: string;
}

export interface CursoNoCliente {
  slug: string;
  titulo: string;
  resumo: string;
  fonte: string;
  imagem: string;
  creditoImagem: string;
  imagemAlt: string;
  /** `AAAAMMDD` — comparável por `<`, sem fuso. */
  dia: number;
  formato: FormatoCurso;
  rotuloFormato: string;
  linguagens: LinguagemDoCurso[];
  gratuito: boolean;
  cancelado: boolean;
  libras: boolean;
  legenda: boolean;
}

export interface FacetaDeCurso {
  valor: string;
  rotulo: string;
  n: number;
  /** Só nas linguagens: o token de cor que veio no vocabulário (D-08). */
  cor?: string;
  /** Só nos formatos: a capa do item mais recente da faceta. */
  imagem?: string;
}

export interface RecursoDeCurso {
  campo: "libras" | "subtitle";
  rotulo: string;
  n: number;
}

export interface CatalogoDeCursos {
  total: number;
  itens: CursoNoCliente[];
  formatos: FacetaDeCurso[];
  linguagens: FacetaDeCurso[];
  destaque: CursoNoCliente;
  acessibilidade: RecursoDeCurso[];
}

export function correspondeABusca(curso: CursoNoCliente, consulta: string): boolean {
  const q = normalizarBusca(consulta);
  if (!q) return true;
  const haystack = normalizarBusca(
    [curso.titulo, curso.resumo, curso.rotuloFormato, ...curso.linguagens.map((l) => l.rotulo)].join(
      " ",
    ),
  );
  return haystack.includes(q);
}

/**
 * `AAAAMMDD` → data civil em pt-BR. `Date.UTC` para o dia da fonte não virar o
 * dia de ontem no fuso de quem abre a página.
 */
const FORMATADOR_DE_DIA = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function diaParaTexto(dia: number): string {
  if (!dia) return "";
  const s = String(dia).padStart(8, "0");
  return FORMATADOR_DE_DIA.format(
    new Date(Date.UTC(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)))),
  );
}

export function diaParaIso(dia: number): string {
  if (!dia) return "";
  const s = String(dia).padStart(8, "0");
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
