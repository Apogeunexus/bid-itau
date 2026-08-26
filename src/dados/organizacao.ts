/**
 * organizacao.ts — o que as dez telas do nível 6 leem do grafo.
 *
 * MÓDULO DE SERVIDOR. Ele lê `@/dados/grafo` por valor, no build, e devolve DTOs só de
 * primitivo. Componente `"use client"` importa daqui APENAS POR TIPO — é essa fronteira,
 * e só ela, que impede os 9,4 MB de `entidades.json` de atravessarem para o navegador
 * (DP-F). Um `import` por valor do outro lado seria invisível no código e mediria megabytes
 * no artefato.
 *
 * NENHUM NÚMERO DIGITADO. Tudo o que este arquivo afirma sobre o acervo é CONTADO aqui,
 * sobre o grafo carregado — «113 espaços», «100% derivado», «2.425 sem espaço declarado».
 * Um literal digitado passaria a mentir na primeira regeração do grafo, e mentiria em
 * silêncio, que é a única forma de mentira que este produto não pode se permitir: o
 * argumento inteiro da proposta é que os números da tela são medidos.
 *
 * SEM RELÓGIO E SEM SORTEIO. A data é `DATA_DE_REFERENCIA`, fixada em `alerta.ts`.
 */

import { DATA_DE_REFERENCIA } from "./alerta";
import { ocorrenciasDe, porSlug, slugsPorTipo, vizinhos } from "./grafo";
import type { Entidade, MetodoCoordenada, Procedencia } from "./tipos";

/** Quem opera a superfície na demonstração. Autorado, e a tela diz que é — no mesmo
 *  padrão de `OPERADOR_DO_STUDIO` e de `PRODUTOR_DA_DEMONSTRACAO`. */
export const ORGANIZACAO_DA_DEMONSTRACAO = "Itaú Cultural";

export const GESTOR_DA_ORGANIZACAO = "Gestão institucional (perfil autorado)";

export const GESTOR_E_AUTORADO =
  "O perfil de quem opera esta tela é autorado para a demonstração: não há autenticação " +
  "real no protótipo. O que NÃO é autorado é o carimbo — toda escrita registra este " +
  "nome, porque §3 da ontologia proíbe escrita anônima, admin incluído.";

// ---------------------------------------------------------------------------
// O espaço, achatado em primitivo
// ---------------------------------------------------------------------------

export interface EspacoDoAcervo {
  id: string;
  slug: string;
  titulo: string;
  /** O verbete que a Enciclopédia publica. É ele que explica de ONDE o espaço foi
   *  inferido — e é por isso que a tela o mostra em vez de esconder a derivação. */
  resumo: string;
  cidade: string;
  estado: string;
  pais: string;
  /** O território a que o espaço está ligado por `situado_em`, quando há. */
  territorio: string | null;
  lat: number | null;
  lon: number | null;
  metodoCoordenada: MetodoCoordenada | null;
  procedencia: Procedencia;
  /** De qual entidade `ic` este nó derivado foi extraído. É a prova da inferência. */
  derivadoDe: string | null;
  declaraAcessibilidade: boolean;
}

function texto(e: Entidade, chave: string): string {
  const v = e.extra?.[chave];
  return typeof v === "string" ? v : "";
}

function entidadesDe(classe: Parameters<typeof slugsPorTipo>[0]): Entidade[] {
  const saida: Entidade[] = [];
  for (const slug of slugsPorTipo(classe)) {
    const e = porSlug(classe, slug);
    if (e) saida.push(e);
  }
  return saida;
}

/**
 * Os 113 espaços do acervo, em ordem de título.
 *
 * A LISTA INTEIRA VAI JUNTO, e é decisão e não descuido: são 113 registros de treze
 * campos de primitivo, e a tela precisa deixar trocar de espaço sem navegar. Uma rota por
 * espaço geraria 113 páginas e faria quem cadastra perder o lugar na lista a cada clique
 * — o mesmo raciocínio que a fila de duplicatas já fez para 84 grupos.
 *
 * Ordem por título e não por id: quem procura um espaço procura pelo nome.
 */
export function espacosDoAcervo(): EspacoDoAcervo[] {
  const espacos = entidadesDe("espaco").map((e) => {
    const territorio =
      vizinhos(e.id, "situado_em")
        .map((v) => v.entidade)
        .find((x) => x.classe === "territorio")?.titulo ?? null;

    return {
      id: e.id,
      slug: e.slug,
      titulo: e.titulo,
      resumo: (e.resumo ?? "").trim(),
      cidade: texto(e, "cidade"),
      estado: texto(e, "estado"),
      pais: texto(e, "pais"),
      territorio,
      lat: e.coordenada?.lat ?? null,
      lon: e.coordenada?.lon ?? null,
      metodoCoordenada: e.coordenada?.metodo ?? null,
      procedencia: e.procedencia,
      derivadoDe: e.derivadoDe ?? null,
      declaraAcessibilidade: e.declaraAcessibilidade,
    };
  });

  espacos.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  return espacos;
}

// ---------------------------------------------------------------------------
// Os números que explicam por que a tela existe
// ---------------------------------------------------------------------------

export interface NumerosDosEspacos {
  total: number;
  derivados: number;
  daFonte: number;
  declaramAcessibilidade: number;
  comCoordenada: number;
  /** Quantos espaços por método de derivação da coordenada, em ordem decrescente. */
  porMetodo: { metodo: string; quantos: number }[];
  /** O denominador que explica a tela: sessões que não dizem onde acontecem. */
  ocorrencias: number;
  ocorrenciasComEspaco: number;
  /** Quantos lugares distintos (cidade + estado) os 113 cobrem. */
  cidades: number;
}

/**
 * Conta, sobre o grafo, tudo o que a O2 afirma.
 *
 * `ocorrenciasComEspaco` é contado percorrendo os eventos e não lendo `ocorrencias.json`
 * direto: o arquivo é indexado por evento e a casa já decidiu que o acesso passa por
 * `grafo.ts` (D-47). São 300 eventos e 2.425 sessões — a conta roda uma vez, no build.
 */
export function numerosDosEspacos(): NumerosDosEspacos {
  const espacos = entidadesDe("espaco");

  const metodos = new Map<string, number>();
  for (const e of espacos) {
    if (!e.coordenada) continue;
    metodos.set(e.coordenada.metodo, (metodos.get(e.coordenada.metodo) ?? 0) + 1);
  }

  let ocorrencias = 0;
  let ocorrenciasComEspaco = 0;
  for (const evento of entidadesDe("evento")) {
    for (const o of ocorrenciasDe(evento.id)) {
      ocorrencias += 1;
      if (o.espacoId) ocorrenciasComEspaco += 1;
    }
  }

  const lugares = new Set(espacos.map((e) => `${texto(e, "cidade")}|${texto(e, "estado")}`));

  return {
    total: espacos.length,
    derivados: espacos.filter((e) => e.procedencia === "derivado").length,
    daFonte: espacos.filter((e) => e.procedencia === "ic").length,
    declaramAcessibilidade: espacos.filter((e) => e.declaraAcessibilidade).length,
    comCoordenada: espacos.filter((e) => e.coordenada).length,
    porMetodo: [...metodos.entries()]
      .map(([metodo, quantos]) => ({ metodo, quantos }))
      .sort((a, b) => b.quantos - a.quantos || a.metodo.localeCompare(b.metodo)),
    ocorrencias,
    ocorrenciasComEspaco,
    cidades: lugares.size,
  };
}

// ---------------------------------------------------------------------------
// As declarações — frases que CITAM os números, em vez de repeti-los à mão
// ---------------------------------------------------------------------------

export interface DeclaracaoDaTela {
  titulo: string;
  texto: string;
}

/**
 * O que a O2 declara sobre o próprio dado.
 *
 * As frases são montadas a partir de `numerosDosEspacos()` e não escritas com o número
 * dentro: assim elas continuam verdadeiras depois de uma regeração do grafo. É a mesma
 * disciplina de `declaracaoDoQueNaoSustenta()` em `duplicatas.ts`.
 */
export function declaracoesDosEspacos(n: NumerosDosEspacos): DeclaracaoDaTela[] {
  const saida: DeclaracaoDaTela[] = [
    {
      titulo: "Nenhum espaço do acervo vem da fonte",
      texto:
        `Os ${n.total} espaços são ${n.derivados} derivados e ${n.daFonte} da fonte. Todos ` +
        `foram INFERIDOS por regra a partir do campo territorial da Enciclopédia — o Itaú ` +
        `Cultural não publica um cadastro de espaços. É por isso que esta tela é a segunda ` +
        `maior conversão de procedência do sistema, atrás só das ocorrências.`,
    },
    {
      titulo: "Nenhum espaço declara acessibilidade",
      texto:
        `${n.declaramAcessibilidade} de ${n.total} espaços declaram a ficha. A funcionalidade ` +
        `de ficha de acessibilidade está no ar no app público e, do lado do espaço, não tem ` +
        `nenhum dado — e é a ficha do espaço que decide se alguém consegue chegar. Só a ` +
        `Organização pode declarar isso.`,
    },
    {
      titulo: "As sessões não dizem onde acontecem",
      texto:
        `${n.ocorrenciasComEspaco} de ${n.ocorrencias} ocorrências têm espaço declarado. Este é ` +
        `o denominador que explica a tela: enquanto não houver espaço cadastrado, o produtor ` +
        `não tem o que escolher, e a chave de identidade da sessão — temporada + início + ` +
        `espaço — fica sem um terço.`,
    },
  ];

  if (n.comCoordenada === n.total && n.porMetodo.length > 0) {
    const m = n.porMetodo[0];
    saida.push({
      titulo: "A coordenada é derivada, e continua",
      texto:
        `Os ${n.total} espaços têm coordenada, e ${m.quantos} deles por «${m.metodo}» — uma ` +
        `regra de deslocamento, não um endereço geocodificado. Cadastrar o endereço nesta ` +
        `tela troca o MÉTODO da derivação e não a procedência dela: latitude digitada não ` +
        `existe neste produto.`,
    });
  }

  return saida;
}

/** A data contra a qual tudo isto foi medido. Reexportada para a página carimbar a tela
 *  sem importar dois módulos — e para deixar explícito que a medida tem data. */
export const DATA_DA_MEDIDA = DATA_DE_REFERENCIA;
