/**
 * trilha.ts — a trilha de primeira vez, resolvida como CADEIA DE ARESTAS (D-36).
 *
 * A trilha não é uma lista de itens: é uma sequência de ligações. Cada passo tem de
 * onde veio, para onde vai e por quê, e o "por quê" é o `motivo` DA ARESTA, literal.
 * Um arquivo que devolvesse só os quatro nós já teria perdido o argumento da tela.
 *
 * D-37 — A PROCEDÊNCIA LIDA É A DA ARESTA, NUNCA A DA ENTIDADE.
 * As quatro entidades da cadeia são todas `ic` (vêm do acervo do Itaú Cultural: três
 * verbetes da Enciclopédia e um evento da agenda). As três ligações entre elas são
 * `autorado` — escritas para o protótipo. Ler `entidade.procedencia` e imprimir "ic"
 * ao lado de uma ponte que nós redigimos seria exatamente a mentira de procedência que
 * T-02-10 existe para impedir: passaríamos texto nosso por texto do IC. Por isso
 * `PassoTrilha.procedenciaAresta` vem de `aresta.procedencia` e de mais lugar nenhum.
 *
 * D-38 — O QUE O ACERVO NÃO PUBLICA É DITO, NÃO OMITIDO.
 * O último passo é `evento:cms:13787`, com 3 ocorrências datadas de 21 a 23.05.2026,
 * todas gratuitas. Nenhuma delas tem espaço: `espacoId` é `null` nas três, e é `null`
 * nas 2.425 ocorrências do grafo inteiro. Por isso `espacoDeclarado` é um campo que
 * EXISTE valendo `null`, em vez de um campo ausente — campo ausente vira bloco sumido
 * na tela, campo nulo declarado vira frase honesta. Derivar "Itaú Cultural, São Paulo"
 * da URL de origem seria dado fabricado usando o crachá do IC, e violaria DADO-05.
 *
 * DP-F: roda NO BUILD. Nenhum arquivo `"use client"` importa este módulo — o que
 * atravessa a fronteira é o DTO abaixo, só primitivos.
 * D-47: toda leitura do acervo passa por `grafo.ts`.
 */

import type { OrigemMotivo } from "./cartao";
import {
  ocorrenciasDe,
  porId,
  porSlug,
  slugsPorTipo,
  temporadasDe,
  vizinhos,
} from "./grafo";
import { motivoDaAresta } from "./motivo";
import type { ClasseEntidade, Entidade, Procedencia, Relacao } from "./tipos";

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------

/**
 * Classe → rota, restrito ao que a trilha pode alcançar. Espelha o mapa de
 * `cartao.tsx`, que não o exporta; duplicá-lo aqui em quatro linhas custa menos do que
 * abrir a fronteira de um componente de cliente para um módulo de dados.
 *
 * `termo` NÃO ESTÁ AQUI de propósito: `/termo/[slug]` não existe nesta fase. Os três
 * primeiros passos da trilha são termos e ficam sem link. Fabricar a rota para o passo
 * "parecer navegável" produziria 404 na demonstração ao vivo, que é pior do que um nó
 * sem link — e a navegabilidade que D-36 pede é a da ARESTA (de onde, para onde, por
 * quê), não a de um href.
 */
const ROTA_POR_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  evento: "/evento",
  pessoa: "/artista",
  coletivo: "/artista",
  obra: "/obra",
  instituicao: "/produtor",
  espaco: "/produtor",
  trilha: "/trilha",
};

// ---------------------------------------------------------------------------
// DTO — o que atravessa a fronteira servidor→cliente
// ---------------------------------------------------------------------------

/** Um nó da cadeia, achatado em primitivos. */
export interface NoTrilha {
  id: string;
  classe: ClasseEntidade;
  titulo: string;
  slug: string;
  resumo?: string;
  linguagens: string[];
  /** Procedência DA ENTIDADE. Nunca use este campo para rotular a ligação (D-37). */
  procedencia: Procedencia;
  fonte?: string;
  /** `null` quando a classe não tem rota nesta fase. */
  rota: string | null;
}

/** Uma sessão datada do último passo. */
export interface SessaoDaTrilha {
  id: string;
  /** ISO completo, como está no acervo derivado. */
  inicio: string;
  /** "21.05.2026" — o formato que a Enciclopédia usa em `dataDeclarada`. */
  dataCurta: string;
  /** "21 de maio de 2026" — para leitura em voz alta. */
  dataLonga: string;
  /** "20:00". */
  hora: string;
  gratuito: boolean;
  esgotado: boolean;
  /**
   * `null` DECLARADO quando o acervo não publica o espaço. Não é campo faltando:
   * é ausência medida, e a tela é obrigada a dizê-la em texto (D-38).
   */
  espacoDeclarado: string | null;
}

export interface TemporadaDaTrilha {
  id: string;
  titulo: string;
  inicio: string | null;
  fim: string | null;
  espacoDeclarado: string | null;
}

/** O destino do último passo, com tudo o que o acervo tem — e o que ele não tem. */
export interface DestinoFinal {
  evento: NoTrilha;
  sessoes: SessaoDaTrilha[];
  temporadas: TemporadaDaTrilha[];
  /** `true` quando TODAS as sessões declaram gratuidade. */
  todasGratuitas: boolean;
  /** Sempre `null` hoje, e medido: nenhuma das 2.425 ocorrências do grafo tem espaço. */
  espacoDeclarado: string | null;
  /** Quantas sessões ficaram sem espaço declarado. Alimenta a frase da tela. */
  sessoesSemEspaco: number;
  /**
   * Elenco vindo de arestas `atua_em`. VAZIO, e a ausência é estrutural: dos 129
   * eventos do grafo com ocorrência datada, zero têm aresta de agente. Autorar
   * `atua_em` para preencher seria afirmar que uma pessoa real atuou numa montagem —
   * afirmação factual falsa, de outra ordem que autorar uma ponte editorial entre dois
   * termos. A decisão de não autorar está travada desde o plano 02-01.
   */
  elenco: NoTrilha[];
  /** Quem realiza, por aresta `realiza`. Vazio pelo mesmo motivo. */
  realizadores: NoTrilha[];
}

/** Um passo: a ARESTA, não o item de lista (D-36). */
export interface PassoTrilha {
  /** 1-based. */
  ordem: number;
  de: NoTrilha;
  para: NoTrilha;
  /** `null` quando a ordem autorada põe dois nós em sequência sem aresta entre eles. */
  relacao: Relacao | null;
  /** Nunca vazio. Literal quando `origemMotivo === "escrito"`. */
  motivo: string;
  origemMotivo: OrigemMotivo;
  /** D-37 — a procedência DA ARESTA. `null` só quando não há aresta. */
  procedenciaAresta: Procedencia | null;
  /** Preenchido só no último passo, quando o destino é evento com ocorrência. */
  final: DestinoFinal | null;
}

export interface TrilhaResumo {
  id: string;
  titulo: string;
  slug: string;
  resumo?: string;
  procedencia: Procedencia;
  linguagens: string[];
}

export interface TrilhaCompleta extends TrilhaResumo {
  /** O que a entidade declara sobre a própria autoria, quando declara. */
  autoradaPorque: string | null;
  passos: PassoTrilha[];
  /** A linguagem do último nó — para onde a trilha leva. */
  linguagemDeDestino: string | null;
  /** Assinatura de quem curou (D-29), derivada da procedência da entidade. */
  assinatura: string;
  publicavel: boolean;
  /** Frase pronta quando não é publicável. `null` quando é. */
  motivoNaoPublicavel: string | null;
  /** Quantas das ligações são `autorado`. A tela mostra o número junto do rótulo. */
  ligacoesAutoradas: number;
}

// ---------------------------------------------------------------------------
// Datas — formatadas aqui, no servidor, sem `Date`
// ---------------------------------------------------------------------------

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * `new Date(iso)` aqui seria bug de fuso: as ocorrências vêm com offset `-03:00` e o
 * build pode rodar em qualquer TZ. Fatiar a string ISO é determinístico e devolve
 * exatamente a data que o acervo gravou.
 */
function fatiarIso(iso: string): { data: string; hora: string } {
  return { data: iso.slice(0, 10), hora: iso.slice(11, 16) };
}

function dataCurta(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : dataIso;
}

function dataLonga(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-");
  const nome = MESES[Number(mes) - 1];
  if (!ano || !nome || !dia) return dataIso;
  return `${Number(dia)} de ${nome} de ${ano}`;
}

// ---------------------------------------------------------------------------
// Nós
// ---------------------------------------------------------------------------

function paraNo(entidade: Entidade): NoTrilha {
  const base = ROTA_POR_CLASSE[entidade.classe];
  const no: NoTrilha = {
    id: entidade.id,
    classe: entidade.classe,
    titulo: entidade.titulo,
    slug: entidade.slug,
    linguagens: entidade.linguagens,
    procedencia: entidade.procedencia,
    rota: base ? `${base}/${entidade.slug}/` : null,
  };
  if (entidade.resumo) no.resumo = entidade.resumo;
  if (entidade.fonte) no.fonte = entidade.fonte;
  return no;
}

// ---------------------------------------------------------------------------
// A cadeia
// ---------------------------------------------------------------------------

/** Todas as trilhas do grafo, como resumo. */
export function trilhas(): TrilhaResumo[] {
  return slugsPorTipo("trilha")
    .map((slug) => porSlug("trilha", slug))
    .filter((e): e is Entidade => Boolean(e))
    .map((e) => {
      const r: TrilhaResumo = {
        id: e.id,
        titulo: e.titulo,
        slug: e.slug,
        procedencia: e.procedencia,
        linguagens: e.linguagens,
      };
      if (e.resumo) r.resumo = e.resumo;
      return r;
    });
}

export function trilhaPorSlug(slug: string): Entidade | undefined {
  return porSlug("trilha", slug);
}

/**
 * Os ids da cadeia, na ordem, e nesta ordem de preferência de fonte:
 *
 * 1. `extra.passos` — a ordem AUTORADA. É a fonte de verdade quando existe.
 * 2. as arestas `contextualiza` que saem da trilha, reordenadas pela cadeia
 *    `semelhante_a` que liga os alvos entre si. `contextualiza` não tem ordem própria;
 *    quem dá ordem é a cadeia.
 * 3. vazio — e aí a trilha não é publicável. A regra de D-38 existe para ser aplicada.
 */
function idsDaCadeia(trilha: Entidade): string[] {
  const passos = (trilha.extra as { passos?: unknown } | undefined)?.passos;
  if (Array.isArray(passos)) {
    const ids = passos.filter((p): p is string => typeof p === "string" && Boolean(porId(p)));
    if (ids.length >= 2) return ids;
  }

  // --- Reserva: reconstruir a ordem a partir das arestas ---
  const alvos = vizinhos(trilha.id, "contextualiza")
    .filter((v) => v.aresta.de === trilha.id)
    .map((v) => v.entidade.id);
  if (alvos.length < 2) return alvos;

  const conjunto = new Set(alvos);
  const proximo = new Map<string, string>();
  const temEntrada = new Set<string>();
  for (const id of alvos) {
    for (const { aresta, entidade } of vizinhos(id, "semelhante_a")) {
      if (aresta.de !== id) continue;
      if (!conjunto.has(entidade.id)) continue;
      if (!proximo.has(id)) proximo.set(id, entidade.id);
      temEntrada.add(entidade.id);
    }
  }

  const cabeca = alvos.find((id) => !temEntrada.has(id));
  if (!cabeca) return [...alvos].sort();

  const ordenados: string[] = [];
  const vistos = new Set<string>();
  let cursor: string | undefined = cabeca;
  while (cursor && !vistos.has(cursor)) {
    vistos.add(cursor);
    ordenados.push(cursor);
    cursor = proximo.get(cursor);
  }
  // Quem sobrou fora da cadeia entra no fim, para nenhum passo declarado sumir.
  for (const id of alvos) if (!vistos.has(id)) ordenados.push(id);
  return ordenados;
}

/**
 * A aresta que liga dois nós consecutivos, se existir.
 *
 * `vizinhos()` já devolve a adjacência ordenada por preferência de relação
 * (`semelhante_a` primeiro), então a primeira que casar é a mais explicativa das que
 * existem entre o par — e é dela que saem motivo, relação e procedência.
 */
function arestaEntre(a: string, b: string) {
  return vizinhos(a).find((v) => v.entidade.id === b);
}

/** A cadeia resolvida em passos. Vazia quando a trilha não declara cadeia. */
export function passosDaTrilha(trilhaId: string): PassoTrilha[] {
  const trilha = porId(trilhaId);
  if (!trilha || trilha.classe !== "trilha") return [];

  const ids = idsDaCadeia(trilha);
  if (ids.length < 2) return [];

  const passos: PassoTrilha[] = [];
  for (let i = 0; i < ids.length - 1; i++) {
    const de = porId(ids[i]);
    const para = porId(ids[i + 1]);
    if (!de || !para) continue;

    const ligacao = arestaEntre(de.id, para.id);
    const ultimo = i === ids.length - 2;

    if (!ligacao) {
      // Sem aresta não há ponte a mostrar, e inventar uma frase de ligação seria
      // afirmar uma relação que o grafo não tem. `sem-aresta` é o valor que 02-01
      // criou exatamente para este caso, e a tela o rotula como tal.
      passos.push({
        ordem: i + 1,
        de: paraNo(de),
        para: paraNo(para),
        relacao: null,
        motivo:
          `A ordem autorada da trilha põe «${de.titulo}» antes de «${para.titulo}», mas ` +
          `nenhuma ligação do acervo liga os dois. O passo aparece como declarado, sem ponte.`,
        origemMotivo: "sem-aresta",
        procedenciaAresta: null,
        final: ultimo ? destinoFinal(para) : null,
      });
      continue;
    }

    // A frase e a procedência saem da MESMA aresta, na orientação em que ela foi
    // gravada — nunca na orientação em que a leitura por acaso a atravessou.
    const ladoDe = porId(ligacao.aresta.de) ?? de;
    const ladoPara = porId(ligacao.aresta.para) ?? para;
    const motivo = motivoDaAresta(ligacao.aresta, ladoDe, ladoPara);

    passos.push({
      ordem: i + 1,
      de: paraNo(de),
      para: paraNo(para),
      relacao: ligacao.aresta.relacao,
      motivo: motivo.texto,
      origemMotivo: motivo.origemMotivo,
      procedenciaAresta: ligacao.aresta.procedencia,
      final: ultimo ? destinoFinal(para) : null,
    });
  }

  return passos;
}

// ---------------------------------------------------------------------------
// O último passo (D-38)
// ---------------------------------------------------------------------------

function destinoFinal(entidade: Entidade): DestinoFinal | null {
  if (entidade.classe !== "evento") return null;

  const ocorrencias = ocorrenciasDe(entidade.id);
  const sessoes: SessaoDaTrilha[] = ocorrencias.map((o) => {
    const { data, hora } = fatiarIso(o.inicio);
    const espaco = o.espacoId ? porId(o.espacoId) : undefined;
    return {
      id: o.id,
      inicio: o.inicio,
      dataCurta: dataCurta(data),
      dataLonga: dataLonga(data),
      hora,
      gratuito: o.gratuito,
      esgotado: o.esgotado,
      // `espacoId` nulo vira `espacoDeclarado` nulo, e não campo ausente.
      espacoDeclarado: espaco ? espaco.titulo : null,
    };
  });

  const temporadas: TemporadaDaTrilha[] = temporadasDe(entidade.id).map((t) => {
    const extra = t.extra as
      | { inicio?: string | null; fim?: string | null; espacoId?: string | null }
      | undefined;
    const espaco = extra?.espacoId ? porId(extra.espacoId) : undefined;
    return {
      id: t.id,
      titulo: t.titulo,
      inicio: extra?.inicio ?? null,
      fim: extra?.fim ?? null,
      espacoDeclarado: espaco ? espaco.titulo : null,
    };
  });

  // Elenco e realização por aresta, e só por aresta (D-41). Nenhum campo do evento é
  // lido como se fosse elenco.
  const elenco = vizinhos(entidade.id, "atua_em")
    .filter((v) => v.aresta.para === entidade.id)
    .map((v) => paraNo(v.entidade));
  const realizadores = vizinhos(entidade.id, "realiza")
    .filter((v) => v.aresta.para === entidade.id)
    .map((v) => paraNo(v.entidade));

  return {
    evento: paraNo(entidade),
    sessoes,
    temporadas,
    todasGratuitas: sessoes.length > 0 && sessoes.every((s) => s.gratuito),
    espacoDeclarado:
      sessoes.find((s) => s.espacoDeclarado)?.espacoDeclarado ??
      temporadas.find((t) => t.espacoDeclarado)?.espacoDeclarado ??
      null,
    sessoesSemEspaco: sessoes.filter((s) => !s.espacoDeclarado).length,
    elenco,
    realizadores,
  };
}

// ---------------------------------------------------------------------------
// Publicabilidade (D-38, T-02-11)
// ---------------------------------------------------------------------------

export interface Publicabilidade {
  publicavel: boolean;
  /** Frase pronta para a tela quando não for publicável. `null` quando for. */
  motivo: string | null;
}

/**
 * D-38 como código: uma trilha de primeira vez termina em algo a que se possa IR.
 * Cadeia sem passos, cadeia que não termina em evento e evento sem ocorrência datada
 * são os três casos em que a trilha não é publicável — e a tela mostra a frase em vez
 * de renderizar meia cadeia, que é a falha silenciosa que T-02-11 proíbe.
 */
export function trilhaEhPublicavel(trilhaId: string): Publicabilidade {
  const trilha = porId(trilhaId);
  if (!trilha || trilha.classe !== "trilha") {
    return { publicavel: false, motivo: "Esta trilha não existe no acervo." };
  }

  const passos = passosDaTrilha(trilhaId);
  if (!passos.length) {
    return {
      publicavel: false,
      motivo:
        "Esta trilha não declara cadeia de passos. Sem passos não há ponte a percorrer, " +
        "e uma trilha sem ponte é uma lista — por isso ela não é publicável.",
    };
  }

  const destino = passos[passos.length - 1].para;
  if (destino.classe !== "evento") {
    return {
      publicavel: false,
      motivo:
        `O último passo desta trilha é «${destino.titulo}», que é ${destino.classe} e não ` +
        "evento. Uma trilha de primeira vez precisa terminar em algo a que se possa ir, " +
        "com data — por isso ela não é publicável.",
    };
  }

  const final = passos[passos.length - 1].final;
  if (!final || !final.sessoes.length) {
    return {
      publicavel: false,
      motivo:
        `O último passo é o evento «${destino.titulo}», mas o acervo não publica nenhuma ` +
        "sessão datada para ele. Sem data não há para onde levar quem seguiu a trilha — " +
        "por isso ela não é publicável.",
    };
  }

  return { publicavel: true, motivo: null };
}

// ---------------------------------------------------------------------------
// A trilha inteira, pronta para a tela
// ---------------------------------------------------------------------------

/** D-29: quem assina a curadoria, derivado da procedência — nunca nome inventado. */
function assinaturaDaCuradoria(trilha: Entidade): string {
  return trilha.procedencia === "autorado"
    ? "Curadoria autorada para o protótipo Agenda Cultural BR, sobre entidades reais do acervo do Itaú Cultural."
    : "Curadoria com procedência declarada no acervo do Itaú Cultural.";
}

export function trilhaCompletaPorSlug(slug: string): TrilhaCompleta | null {
  const trilha = trilhaPorSlug(slug);
  if (!trilha) return null;

  const passos = passosDaTrilha(trilha.id);
  const { publicavel, motivo } = trilhaEhPublicavel(trilha.id);
  const ultimo = passos.length ? passos[passos.length - 1].para : null;
  const extra = trilha.extra as { autoradaPorque?: unknown } | undefined;

  const completa: TrilhaCompleta = {
    id: trilha.id,
    titulo: trilha.titulo,
    slug: trilha.slug,
    procedencia: trilha.procedencia,
    linguagens: trilha.linguagens,
    autoradaPorque:
      typeof extra?.autoradaPorque === "string" ? extra.autoradaPorque : null,
    passos,
    linguagemDeDestino: ultimo?.linguagens[0] ?? null,
    assinatura: assinaturaDaCuradoria(trilha),
    publicavel,
    motivoNaoPublicavel: motivo,
    ligacoesAutoradas: passos.filter((p) => p.procedenciaAresta === "autorado").length,
  };
  if (trilha.resumo) completa.resumo = trilha.resumo;
  return completa;
}
