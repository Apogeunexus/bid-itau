import vocabularioJson from "./gerado/vocabulario.json";
import { porSlug, slugsPorTipo } from "./grafo";
import {
  classificarFormato,
  ROTULOS_DE_FORMATO,
  textoEstaCancelado,
  textoTemGratuito,
  type CatalogoDeCursos,
  type CursoNoCliente,
  type FacetaDeCurso,
  type FormatoCurso,
  type LinguagemDoCurso,
} from "./cursos-wire";
import type { Entidade, Vocabulario } from "./tipos";

/**
 * cursos.ts — as 54 formações da Escola Itaú Cultural (classe `formacao`).
 *
 * MÓDULO DE BUILD. Alcança `grafo.ts` por valor e por isso nenhum `"use client"`
 * pode importá-lo (DP-F). O que atravessa a fronteira é `catalogoDeCursos()`, um
 * DTO nomeado — 54 itens cabem com o nome do campo, ao contrário das 529 mídias
 * do Play, que precisaram de tupla.
 *
 * MEDIDO contra o grafo (2026-08): 54 formações, todas `ic`, todas com `fonte`,
 * `resumo`, `imagem` local e `extra.publicadoEm`. 24 declaram linguagem; 5 têm
 * Libras; 1 tem legendagem. Não há nota, preço, instrutor nem contagem de
 * inscritos no acervo — a tela não inventa nenhum dos quatro.
 */

const FORMACOES_ESPERADAS = 54;

const VOCABULARIO = vocabularioJson as Vocabulario;
const LINGUAGEM_POR_ID = new Map(VOCABULARIO.linguagens.map((l) => [l.id, l]));

let memo: CatalogoDeCursos | null = null;

function quebrar(mensagem: string): never {
  throw new Error(`cursos.ts: ${mensagem}`);
}

function diaDe(publicadoEm: string): number {
  const iso = publicadoEm.slice(0, 10);
  const n = Number(iso.replace(/-/g, ""));
  if (!Number.isInteger(n) || n < 19000101 || n > 21001231) {
    quebrar(`data de publicação irreconhecível: ${JSON.stringify(publicadoEm)}`);
  }
  return n;
}

function linguagensDe(ids: readonly string[]): LinguagemDoCurso[] {
  const saida: LinguagemDoCurso[] = [];
  for (const id of ids) {
    const l = LINGUAGEM_POR_ID.get(id);
    if (!l) continue;
    saida.push({ id: l.id, rotulo: l.rotulo, cor: l.cor });
  }
  return saida;
}

function deEntidade(e: Entidade): CursoNoCliente {
  const publicadoEm = typeof e.extra?.publicadoEm === "string" ? e.extra.publicadoEm : "";
  const imagemAlt = typeof e.extra?.imagemAlt === "string" ? e.extra.imagemAlt : "";
  if (!e.fonte) quebrar(`a formação «${e.slug}» não declara fonte — o cartão ficaria sem saída`);
  if (!e.imagem) quebrar(`a formação «${e.slug}» não tem imagem local — o acervo mede 54/54`);
  if (!e.resumo) quebrar(`a formação «${e.slug}» não declara resumo`);
  const formato = classificarFormato(e.titulo, e.resumo, e.linguagens);
  return {
    slug: e.slug,
    titulo: e.titulo,
    resumo: e.resumo,
    fonte: e.fonte,
    imagem: e.imagem,
    creditoImagem: e.creditoImagem ?? "",
    imagemAlt: imagemAlt || e.titulo,
    dia: diaDe(publicadoEm),
    formato,
    rotuloFormato: ROTULOS_DE_FORMATO[formato],
    linguagens: linguagensDe(e.linguagens),
    gratuito: textoTemGratuito(e.titulo, e.resumo),
    cancelado: textoEstaCancelado(e.titulo, e.resumo),
    libras: e.acessibilidade.libras,
    legenda: e.acessibilidade.subtitle,
  };
}

function montar(): CatalogoDeCursos {
  const itens: CursoNoCliente[] = [];
  for (const slug of slugsPorTipo("formacao")) {
    const e = porSlug("formacao", slug);
    if (e) itens.push(deEntidade(e));
  }
  if (itens.length !== FORMACOES_ESPERADAS) {
    quebrar(
      `montou ${itens.length} formações e o acervo declara ${FORMACOES_ESPERADAS}. ` +
        `A tela afirma o número; corrija a afirmação junto com a medida.`,
    );
  }

  itens.sort((a, b) => b.dia - a.dia || (a.slug < b.slug ? -1 : 1));

  const porFormato = new Map<FormatoCurso, CursoNoCliente[]>();
  for (const item of itens) {
    const lista = porFormato.get(item.formato);
    if (lista) lista.push(item);
    else porFormato.set(item.formato, [item]);
  }

  const formatos: FacetaDeCurso[] = [...porFormato.entries()]
    .map(([valor, lista]) => ({
      valor,
      rotulo: ROTULOS_DE_FORMATO[valor],
      n: lista.length,
      imagem: lista[0]?.imagem,
    }))
    .sort((a, b) => b.n - a.n || (a.rotulo < b.rotulo ? -1 : 1));

  const somaFormatos = formatos.reduce((acc, f) => acc + f.n, 0);
  if (somaFormatos !== itens.length) {
    quebrar(`os formatos somam ${somaFormatos} e as formações são ${itens.length} — a partição quebrou`);
  }

  const porLinguagem = new Map<string, { n: number; rotulo: string; cor: string }>();
  for (const item of itens) {
    for (const l of item.linguagens) {
      const atual = porLinguagem.get(l.id);
      if (atual) atual.n += 1;
      else porLinguagem.set(l.id, { n: 1, rotulo: l.rotulo, cor: l.cor });
    }
  }
  const linguagens: FacetaDeCurso[] = [...porLinguagem.entries()]
    .map(([valor, v]) => ({ valor, rotulo: v.rotulo, n: v.n, cor: v.cor }))
    .sort((a, b) => b.n - a.n || (a.rotulo < b.rotulo ? -1 : 1));

  const destaque = itens[0];
  if (!destaque) quebrar("o catálogo montou vazio");

  return {
    total: itens.length,
    itens,
    formatos,
    linguagens,
    destaque,
    acessibilidade: [
      {
        campo: "libras",
        rotulo: "Libras",
        n: itens.filter((i) => i.libras).length,
      },
      {
        campo: "subtitle",
        rotulo: "Legendagem",
        n: itens.filter((i) => i.legenda).length,
      },
    ],
  };
}

export function catalogoDeCursos(): CatalogoDeCursos {
  memo ??= montar();
  return memo;
}
