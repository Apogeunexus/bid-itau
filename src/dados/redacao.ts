/**
 * redacao.ts — o dado das duas telas de Redação: a fila de moderação (tela 34, D-82 a
 * D-84) e o editor de trilha curada (tela 35, D-85 e D-86).
 *
 * A PERGUNTA QUE ESTE MÓDULO EXISTE PARA RESPONDER é a mais difícil do RFP: onde a IA
 * **não** deve ser utilizada. A resposta não é uma frase de rodapé — é a forma do dado.
 * Um item de fila tem `origem`, e só os de `origem: "ia"` têm `score`. Um passo de trilha
 * tem `motivo`, e o motivo é o MESMO objeto que a tela pública mostra. Um score tem uma
 * regra escrita ao lado, e a regra é conferível item a item. Nada aqui é número solto.
 *
 * DP-F: roda NO BUILD. Alcança `grafo.ts` (23 MB de JSON) por `trilha.ts`, por `motivo.ts`
 * e diretamente. NENHUM arquivo `"use client"` pode importar este módulo por valor — o que
 * atravessa a fronteira são os DTOs abaixo, que são só primitivo. D-47: toda leitura do
 * acervo passa por `grafo.ts`, nunca por `entidades.json`.
 *
 * O QUE ESTE MÓDULO NÃO FAZ, E É O PONTO.
 *
 * 1. Ele NÃO reescreve a travessia da trilha. `passosParaEditor` é construído SOBRE
 *    `passosDaTrilha` e `trilhaCompletaPorSlug` de `trilha.ts`, e o campo `motivo` que ele
 *    devolve é o MESMO campo `PassoTrilha.motivo` que `/trilha/[slug]/` imprime no selo
 *    público. D-85 exige que as duas pontas concordem caractere a caractere; a única forma
 *    de garantir isso é elas lerem a mesma fonte, e não duas cópias que divergem na
 *    primeira edição. Uma segunda travessia escrita aqui seria exatamente o defeito.
 *
 * 2. Ele NÃO inventa item de fila. Cada item aponta para uma ENTIDADE REAL do acervo e
 *    mostra os campos dela. O que é autorado — e a tela diz que é, por
 *    `PROCEDENCIA_DA_ATRIBUICAO` — é a ATRIBUIÇÃO de origem e o score. A fila é encenada no
 *    mesmo sentido em que as 40 duplicatas da fase 4 são: o cenário é nosso, o dado não.
 *
 * 3. Ele NÃO sorteia score. `pontuar()` é uma função de cinco perguntas sobre a própria
 *    ficha da entidade, todas conferíveis a olho na tela. Um score sem regra auditável é o
 *    recomendador opaco contra o qual a proposta inteira se posiciona; publicar um número
 *    de confiança sem dizer de onde ele veio seria fazer, no protótipo, a coisa que o
 *    protótipo critica.
 */

import { contagens, porId, porSlug, slugsPorTipo, vizinhos } from "./grafo";
import { motivoDaAresta } from "./motivo";
import { DATA_DE_REFERENCIA } from "./alerta";
import { trilhaCompletaPorSlug, trilhaEhPublicavel, trilhas } from "./trilha";
import type { OrigemMotivo } from "./cartao";
import type { ClasseEntidade, Entidade, Procedencia, Relacao } from "./tipos";

// ---------------------------------------------------------------------------
// Autoria e carimbo — D-84, e o mesmo padrão de `ocorrencias-studio.ts`
// ---------------------------------------------------------------------------

/** A data de referência do build, reexportada. NUNCA o relógio do runtime (T-03-10). */
export const DATA_DE_REFERENCIA_DA_REDACAO = DATA_DE_REFERENCIA;

/**
 * A hora autorada do carimbo. Fixa pelo mesmo motivo que a data: ler `new Date()` no
 * cliente faria o HTML exportado divergir da página hidratada na primeira renderização, e
 * o carimbo ainda exporia o fuso horário de quem avalia a proposta.
 */
const HORA_DO_CARIMBO = "11:20";

/** "2026-08-22" → "22.08.2026". A mesma regra de `alerta.ts`, pelo mesmo motivo. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : iso;
}

/**
 * Quem decide. D-25: **não há autenticação neste protótipo**. O nome é autorado e a tela
 * diz que é — ele está aqui para mostrar que a decisão FICA REGISTRADA com autor e
 * carimbo (D-84), não para simular um login que o protótipo não tem.
 */
export const CURADOR_AUTORADO = "Redação · curadoria editorial (perfil autorado)";

export const CURADOR_E_AUTORADO =
  "Não há autenticação neste protótipo (D-25). O nome de quem decide é autorado e aparece " +
  "rotulado, em vez de simular um login: o que esta tela precisa provar é que toda decisão " +
  "fica registrada com autor e carimbo, e não que sabemos quem está do outro lado. O " +
  `carimbo é derivado da data de referência do build (${DATA_DE_REFERENCIA}), nunca do ` +
  "relógio de quem abre a página.";

/** O carimbo que uma decisão tomada AGORA na Redação recebe (D-84). */
export const CARIMBO_DA_DECISAO = `${dataCurta(DATA_DE_REFERENCIA)}, ${HORA_DO_CARIMBO.replace(
  ":",
  "h",
)}`;

// ---------------------------------------------------------------------------
// D-86 — os três limites da IA, por extenso
// ---------------------------------------------------------------------------

/**
 * Os três limites, escritos como produto e não como nota de rodapé. Eles vão para a tela
 * FORA de `<Comentario>`: continuam visíveis com o modo comentado desligado, porque são a
 * resposta do produto à pergunta do RFP, e não um comentário sobre o protótipo.
 */
export const LIMITES_DA_IA: readonly string[] = [
  "A IA não publica. Nenhuma sugestão vira dado público sem um humano aprovar, e a " +
    "aprovação fica registrada com nome e carimbo.",
  "A IA não define destaque editorial. O que ocupa a primeira posição de Descobrir é " +
    "escolha de curadoria assinada, nunca resultado de score.",
  "A IA não escreve verbete. Ela sugere um verbete que JÁ EXISTE no acervo, com a " +
    "procedência dele à vista; o texto continua sendo de quem o escreveu.",
];

// ---------------------------------------------------------------------------
// A regra do score — declarada, conferível, e a mesma para todos os itens de IA
// ---------------------------------------------------------------------------

export interface ComponenteDoScore {
  id: string;
  rotulo: string;
  /** O que a pergunta observa na ficha, em texto, para a tela imprimir ao lado. */
  observa: string;
  /** Cada componente vale o mesmo: 1/5. Peso desigual sem justificativa é score opaco. */
  peso: number;
}

/**
 * As cinco perguntas. Todas são sobre a FICHA DA PRÓPRIA ENTIDADE — nada de sinal de
 * comportamento, nada de popularidade, nada de modelo. É por isso que o número é
 * conferível a olho: quem abre o item vê os cinco componentes marcados ou não, e o score
 * é a fração deles.
 */
export const COMPONENTES_DO_SCORE: readonly ComponenteDoScore[] = [
  {
    id: "resumo",
    rotulo: "resumo com pelo menos 120 caracteres",
    observa: "campo `resumo` da entidade",
    peso: 0.2,
  },
  {
    id: "imagem",
    rotulo: "imagem declarada",
    observa: "campo `imagem` da entidade",
    peso: 0.2,
  },
  {
    id: "credito",
    rotulo: "crédito da imagem declarado",
    observa: "campo `creditoImagem` — imagem sem crédito não publica",
    peso: 0.2,
  },
  {
    id: "linguagens",
    rotulo: "pelo menos duas linguagens classificadas",
    observa: "campo `linguagens`, do vocabulário controlado",
    peso: 0.2,
  },
  {
    id: "fonte",
    rotulo: "URL de origem declarada",
    observa: "campo `fonte` — a procedência conferível do item",
    peso: 0.2,
  },
];

export const REGRA_DO_SCORE =
  "O score de confiança NÃO vem de modelo, de popularidade nem de sorteio: é a fração de " +
  "cinco perguntas objetivas respondidas pela própria ficha da entidade — resumo com pelo " +
  "menos 120 caracteres, imagem declarada, crédito da imagem declarado, pelo menos duas " +
  "linguagens classificadas e URL de origem declarada. Cada uma vale 0,2. O item abre com " +
  "as cinco marcadas ou não, e quem confere a conta chega ao mesmo número. Um score sem " +
  "regra à vista é o recomendador opaco que esta proposta recusa; por isso a regra vem " +
  "junto do número, e não numa documentação à parte.";

/** As cinco perguntas, aplicadas. Determinística e sem estado. */
function componentesAtendidos(e: Entidade): string[] {
  const atende: Record<string, boolean> = {
    resumo: (e.resumo ?? "").length >= 120,
    imagem: Boolean(e.imagem),
    credito: Boolean(e.creditoImagem),
    linguagens: e.linguagens.length >= 2,
    fonte: Boolean(e.fonte),
  };
  return COMPONENTES_DO_SCORE.filter((c) => atende[c.id]).map((c) => c.id);
}

function pontuar(e: Entidade): number {
  const atendidos = componentesAtendidos(e);
  // Arredondado a duas casas porque 3/5 em ponto flutuante é 0.6000000000000001, e um
  // score que imprime dezesseis dígitos na tela é ruído, não precisão.
  return Math.round((atendidos.length / COMPONENTES_DO_SCORE.length) * 100) / 100;
}

// ---------------------------------------------------------------------------
// DTO da fila
// ---------------------------------------------------------------------------

/**
 * As três origens de D-82.
 *
 * `score` existe **só** em `"ia"`, e nos outros dois é `null`. Não é economia de campo: é
 * a distinção que a tela existe para fazer. Produtor e ingestão **afirmam** — um produtor
 * declara que o evento é dele, o lote de ingestão declara de que sistema veio. A IA
 * **estima**, e estimativa sem intervalo de confiança à vista é a coisa que esta tela
 * recusa. Pôr um score nos três achataria as duas afirmações na estimativa e apagaria
 * justamente o argumento.
 */
export type OrigemDoItem = "produtor" | "ingestao" | "ia";

/**
 * A procedência da ATRIBUIÇÃO de origem e do score — de TODOS os itens, sem exceção.
 *
 * Constante de módulo e não campo por item de propósito. Como valor repetido, ela custava
 * 2,2 KB do orçamento de 60 KB para afirmar sessenta vezes a mesma coisa; como constante,
 * a tela a imprime UMA vez, no alto, onde a afirmação vale para a fila inteira. O que ela
 * afirma continua indispensável: a regra que atribuiu a origem e calculou o score foi
 * escrita por nós, e confundi-la com a procedência da entidade seria passar texto nosso
 * pelo crachá do Itaú Cultural — a mentira de procedência que T-02-10 existe para impedir.
 */
export const PROCEDENCIA_DA_ATRIBUICAO: Procedencia = "autorado";

export const FRASE_DA_ATRIBUICAO =
  "A fila é encenada: as entidades são reais e vêm do acervo, mas a ATRIBUIÇÃO de origem " +
  "— produtor, ingestão ou IA — e o score de confiança são autorados para o protótipo, por " +
  "regra determinística escrita ao lado de cada um. O acervo do Itaú Cultural não publica " +
  "quem submeteu um registro nem pontuação de confiança; inventar esses campos e exibi-los " +
  "sem rótulo seria vestir texto nosso com o crachá do IC.";

export interface OrigemDeclarada {
  id: OrigemDoItem;
  rotulo: string;
  /** A regra determinística que atribuiu esta origem. Vai para a tela, por extenso. */
  regra: string;
  /** `true` só na IA — é o único caso em que existe score. */
  temScore: boolean;
}

export const ORIGENS_DECLARADAS: readonly OrigemDeclarada[] = [
  {
    id: "produtor",
    rotulo: "produtor",
    regra:
      "Evento com id `evento:cms:*` — registrado pelo próprio produtor no CMS da agenda. " +
      "Ele afirma o que é dele; não há estimativa a pontuar.",
    temScore: false,
  },
  {
    id: "ingestao",
    rotulo: "ingestão automática",
    regra:
      "Evento com id `evento:enc:*` — entrou por lote automático da Enciclopédia Itaú " +
      "Cultural. A fonte declara de onde veio; também não há estimativa a pontuar.",
    temScore: false,
  },
  {
    id: "ia",
    rotulo: "sugestão de IA",
    regra:
      "Entidade de outra classe alcançada, a partir de um evento já na fila, por aresta " +
      "editorial (`aprofunda`, `fala_sobre`, `dialoga_com` ou `semelhante_a`). A IA " +
      "propõe publicá-la como aprofundamento daquele evento — e por ser proposta, e não " +
      "afirmação, ela vem com score de confiança visível (D-82).",
    temScore: true,
  },
];

export interface SugestaoDaIa {
  /** De qual item da fila a travessia partiu. */
  deId: string;
  deTitulo: string;
  relacao: Relacao;
  /**
   * O texto da aresta, lido por `motivoDaAresta` — o MESMO gerador de frase que o cartão
   * público usa. Não é frase escrita aqui para a ocasião.
   */
  motivo: string;
  origemMotivo: OrigemMotivo;
  procedenciaAresta: Procedencia;
}

export interface ItemDaFila {
  /** Chave estável do item na fila: `fila:{origem}:{entidadeId}`. */
  id: string;
  entidadeId: string;
  titulo: string;
  classe: ClasseEntidade;
  resumo: string | null;
  origem: OrigemDoItem;
  /** A procedência DA ENTIDADE — `ic`, `derivado` ou `autorado`. Nunca a da atribuição. */
  procedencia: Procedencia;
  fonte: string | null;
  linguagens: string[];
  /** `null` fora da IA, por decisão declarada em `OrigemDoItem`. */
  score: number | null;
  /** Ids de `COMPONENTES_DO_SCORE` atendidos. `null` fora da IA. */
  componentes: string[] | null;
  /** `null` fora da IA. */
  sugestao: SugestaoDaIa | null;
  /** Título do território que alcança este item, ou `null`. Alimenta o escopo territorial. */
  territorio: string | null;
  /** A rota pública da entidade, quando a classe tem uma nesta fase. */
  rota: string | null;
}

// ---------------------------------------------------------------------------
// Escopo do curador — D-84 e D-89
// ---------------------------------------------------------------------------

export type IdDoEscopo = "nacional" | "territorial" | "linguagem";

export interface Escopo {
  id: IdDoEscopo;
  rotulo: string;
  /** O que este recorte é, em texto de produto. */
  descricao: string;
  /**
   * O CAMPO do item que este escopo observa. É DADO, e não código, de propósito: o
   * componente de cliente não pode importar `itemNoEscopo` por valor (DP-F — este módulo
   * alcança o grafo), e reescrever a regra lá seria criar a segunda cópia que diverge em
   * silêncio. Mandando o NOME DO CAMPO, os dois lados despacham sobre a mesma decisão e
   * não há regra duplicada: há um despachante de três linhas de cada lado.
   */
  campo: "todos" | "territorio" | "linguagens";
  /** Quantos itens da fila este escopo alcança. MEDIDO, nunca estimado. */
  alcance: number;
}

/**
 * Rota por classe, restrito ao que a fila alcança. Espelha o mapa de `trilha.ts`, que não
 * o exporta. `termo`, `conteudo` e `midia` NÃO estão aqui: `/termo/[slug]` e
 * `/conteudo/[slug]` não existem nesta fase, e fabricar a rota para o item "parecer
 * navegável" produziria 404 na demonstração ao vivo.
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

function rotaDe(e: Entidade): string | null {
  const base = ROTA_POR_CLASSE[e.classe];
  return base ? `${base}/${e.slug}/` : null;
}

function territorioDe(e: Entidade): string | null {
  const t = vizinhos(e.id).find((v) => v.entidade.classe === "territorio");
  return t ? t.entidade.titulo : null;
}

// ---------------------------------------------------------------------------
// A escolha dos itens — determinística, por chave estável, e declarada
// ---------------------------------------------------------------------------

/** Quantos itens por origem. Declarado, e citado na tela. */
export const ITENS_POR_ORIGEM = 20;

/** O tamanho total da fila. Bem abaixo dos 84 grupos da fase 4, e percorrível ao vivo. */
export const TAMANHO_DA_FILA = ITENS_POR_ORIGEM * 3;

/**
 * O que a IA nunca propõe publicar, por mais que o grafo alcance.
 *
 * `repertorio` é a lista de salvos de uma pessoa e `pessoa-usuaria` é a própria pessoa —
 * as duas são alcançáveis por aresta editorial e nenhuma das duas é conteúdo editorial.
 * A distinção não é de gosto: é a fronteira entre o que o acervo publica e o que pertence
 * a alguém, e uma fila de moderação que a apaga já errou antes de qualquer decisão.
 */
const CLASSES_QUE_NAO_SE_PUBLICAM: readonly ClasseEntidade[] = [
  "repertorio",
  "pessoa-usuaria",
];

/** As relações que contam como SUGESTÃO EDITORIAL, e as que não contam. */
const RELACOES_EDITORIAIS: readonly Relacao[] = [
  "aprofunda",
  "fala_sobre",
  "dialoga_com",
  "semelhante_a",
];

export const REGRA_DA_AMOSTRAGEM =
  "Os candidatos de cada origem são ordenados pelo `id` da entidade — chave estável do " +
  "acervo, não `localeCompare` e não índice de array. Produtor e ingestão tomam um a cada N " +
  "com passo fixo sobre essa ordem. A IA usa RODÍZIO ENTRE AS FAIXAS DE SCORE: as faixas " +
  "são percorridas em ordem crescente e cada volta tira de cada faixa o próximo candidato " +
  "por id, até completar a cota. Duas gerações do grafo com o mesmo dado produzem a mesma " +
  "fila.";

export const POR_QUE_RODIZIO_NA_IA =
  "Amostragem proporcional traria a fila que a população tem — quase toda entre 0,6 e 1,0 — " +
  "e a tela nunca mostraria um item de confiança baixa, que é justamente o caso em que a " +
  "decisão humana pesa. O rodízio garante pelo menos um item de cada faixa, e a " +
  "distribuição da POPULAÇÃO INTEIRA fica declarada ao lado: quem lê a fila vê o recorte e " +
  "vê de onde ele foi tirado, em vez de tomar o recorte pela população.";

/** Comparação por ponto de código, estável entre plataformas — nunca `localeCompare`. */
function porIdEstavel(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Rodízio entre as faixas de score. Ver `POR_QUE_RODIZIO_NA_IA`.
 *
 * As faixas saem em ordem crescente de score e cada volta tira de cada uma o próximo
 * candidato por id. Determinístico e sem estado: a mesma lista devolve sempre a mesma
 * seleção, na mesma ordem.
 */
function rodizioPorFaixaDeScore<T extends { entidade: Entidade }>(
  ordenados: readonly T[],
  n: number,
): T[] {
  const faixas = new Map<number, T[]>();
  for (const c of ordenados) {
    const s = pontuar(c.entidade);
    const faixa = faixas.get(s);
    if (faixa) faixa.push(c);
    else faixas.set(s, [c]);
  }
  const chaves = [...faixas.keys()].sort((a, b) => a - b);
  const saida: T[] = [];
  let volta = 0;
  while (saida.length < n) {
    let tirouAlgo = false;
    for (const k of chaves) {
      if (saida.length >= n) break;
      const faixa = faixas.get(k) as T[];
      if (volta < faixa.length) {
        saida.push(faixa[volta]);
        tirouAlgo = true;
      }
    }
    // Sem isto, uma cota maior que a população inteira giraria para sempre.
    if (!tirouAlgo) break;
    volta += 1;
  }
  return saida;
}

/** Amostra com passo fixo. `n >= lista.length` devolve a lista inteira. */
function amostrar<T>(lista: readonly T[], n: number): T[] {
  if (lista.length <= n) return [...lista];
  const passo = Math.floor(lista.length / n);
  const saida: T[] = [];
  for (let i = 0; i < n; i++) saida.push(lista[i * passo]);
  return saida;
}

/**
 * Os eventos que o acervo publica, sem os 40 clones encenados da fase 4.
 *
 * Os clones são `procedencia: "autorado"` e existem para o Cenário 3 do Studio; deixá-los
 * entrar aqui poria o MESMO evento duas vezes na fila de Redação com origens diferentes, e
 * a tela passaria a demonstrar o problema da fase 4 em vez do desta.
 */
function eventosDoAcervo(): Entidade[] {
  const saida: Entidade[] = [];
  for (const slug of slugsPorTipo("evento")) {
    const e = porSlug("evento", slug);
    if (e && e.procedencia !== "autorado") saida.push(e);
  }
  return saida.sort(porIdEstavel);
}

function paraItem(
  e: Entidade,
  origem: OrigemDoItem,
  sugestao: SugestaoDaIa | null,
): ItemDaFila {
  const ehIa = origem === "ia";
  return {
    id: `fila:${origem}:${e.id}`,
    entidadeId: e.id,
    titulo: e.titulo,
    classe: e.classe,
    resumo: e.resumo ?? null,
    origem,
    procedencia: e.procedencia,
    fonte: e.fonte ?? null,
    linguagens: e.linguagens,
    score: ehIa ? pontuar(e) : null,
    componentes: ehIa ? componentesAtendidos(e) : null,
    sugestao,
    territorio: territorioDe(e),
    rota: rotaDe(e),
  };
}

let filaMemo: ItemDaFila[] | null = null;

/**
 * A fila de moderação (D-82). Sessenta itens: 20 de produtor, 20 de ingestão automática e
 * 20 de sugestão de IA — e o número está declarado em `ITENS_POR_ORIGEM`, na tela.
 */
interface CandidatoDeIa {
  entidade: Entidade;
  sugestao: SugestaoDaIa;
}

let candidatosIaMemo: CandidatoDeIa[] | null = null;

/**
 * Os candidatos da IA: travessia real, a partir dos eventos que já estão na fila.
 *
 * A IA não inventa entidade — ela alcança uma que JÁ EXISTE, por uma aresta que JÁ EXISTE,
 * e a frase que justifica a sugestão é a frase DA ARESTA, lida por `motivoDaAresta`, o
 * mesmo gerador que o cartão público usa. Uma frase escrita aqui para a ocasião seria a IA
 * «escrevendo verbete», que é exatamente o terceiro limite de D-86.
 */
function candidatosDeIa(): CandidatoDeIa[] {
  if (candidatosIaMemo) return candidatosIaMemo;

  const candidatos = new Map<string, CandidatoDeIa>();
  for (const evento of eventosDoAcervo()) {
    for (const v of vizinhos(evento.id)) {
      if (!RELACOES_EDITORIAIS.includes(v.aresta.relacao)) continue;
      // Um evento alcançado por aresta editorial já entra pela própria origem; deixá-lo
      // entrar de novo como sugestão de IA poria o mesmo item duas vezes na fila.
      if (v.entidade.classe === "evento") continue;
      // `repertorio` e `pessoa-usuaria` NÃO são candidatos a publicação. Um repertório é
      // a lista de salvos de uma pessoa; propor «publicar o Repertório de Carlos» numa
      // fila editorial é sugerir tornar público o que é de alguém. O grafo alcança os
      // dois por aresta editorial, e é aqui que a fila diz que alcance não é candidatura.
      if (CLASSES_QUE_NAO_SE_PUBLICAM.includes(v.entidade.classe)) continue;
      if (candidatos.has(v.entidade.id)) continue;

      const ladoDe = porId(v.aresta.de) ?? evento;
      const ladoPara = porId(v.aresta.para) ?? v.entidade;
      const m = motivoDaAresta(v.aresta, ladoDe, ladoPara);

      candidatos.set(v.entidade.id, {
        entidade: v.entidade,
        sugestao: {
          deId: evento.id,
          deTitulo: evento.titulo,
          relacao: v.aresta.relacao,
          motivo: m.texto,
          origemMotivo: m.origemMotivo,
          procedenciaAresta: v.aresta.procedencia,
        },
      });
    }
  }
  candidatosIaMemo = [...candidatos.values()].sort((a, b) =>
    porIdEstavel(a.entidade, b.entidade),
  );
  return candidatosIaMemo;
}

export interface FaixaDeScore {
  score: number;
  /** Quantos candidatos da POPULAÇÃO inteira caem nesta faixa. */
  naPopulacao: number;
  /** Quantos deles a fila mostra. */
  naFila: number;
}

/**
 * A distribuição de score da população inteira de candidatos da IA, ao lado da que a fila
 * mostra. As duas juntas, e nunca só a segunda: publicar o recorte sem a população é
 * deixar quem lê tomar um pelo outro.
 */
export function distribuicaoDeScore(): FaixaDeScore[] {
  const populacao = new Map<number, number>();
  for (const c of candidatosDeIa()) {
    const s = pontuar(c.entidade);
    populacao.set(s, (populacao.get(s) ?? 0) + 1);
  }
  const naFila = new Map<number, number>();
  for (const i of filaDaRedacao()) {
    if (i.score === null) continue;
    naFila.set(i.score, (naFila.get(i.score) ?? 0) + 1);
  }
  return [...populacao.keys()]
    .sort((a, b) => a - b)
    .map((score) => ({
      score,
      naPopulacao: populacao.get(score) ?? 0,
      naFila: naFila.get(score) ?? 0,
    }));
}

export function filaDaRedacao(): ItemDaFila[] {
  if (filaMemo) return filaMemo;

  const eventos = eventosDoAcervo();
  const produtores = eventos.filter((e) => e.id.includes(":cms:"));
  const ingeridos = eventos.filter((e) => e.id.includes(":enc:"));
  const ordenadosIa = candidatosDeIa();

  const fila = [
    ...amostrar(produtores, ITENS_POR_ORIGEM).map((e) => paraItem(e, "produtor", null)),
    ...amostrar(ingeridos, ITENS_POR_ORIGEM).map((e) => paraItem(e, "ingestao", null)),
    ...rodizioPorFaixaDeScore(ordenadosIa, ITENS_POR_ORIGEM).map((c) =>
      paraItem(c.entidade, "ia", c.sugestao),
    ),
  ];

  // --- Conferências que derrubam o build (falha alta e nomeada) ---
  const contadas = fila.reduce<Record<string, number>>((a, i) => {
    a[i.origem] = (a[i.origem] ?? 0) + 1;
    return a;
  }, {});
  for (const o of ORIGENS_DECLARADAS) {
    if (!contadas[o.id]) {
      throw new Error(
        `redacao.ts: a fila ficou SEM nenhum item de origem «${o.id}». A tela 34 existe ` +
          "para mostrar as três origens lado a lado; com uma faltando ela deixa de " +
          "demonstrar D-82 e passa a demonstrar duas. REVEJA a regra de atribuição de " +
          `origem — a contagem medida foi ${JSON.stringify(contadas)}.`,
      );
    }
  }
  const comScore = fila.filter((i) => i.score !== null);
  if (comScore.length !== (contadas.ia ?? 0)) {
    throw new Error(
      `redacao.ts: ${comScore.length} itens têm score e ${contadas.ia} são de IA. Score ` +
        "fora da IA achata a distinção entre afirmar e estimar, que é o argumento inteiro " +
        "de D-82.",
    );
  }
  if (comScore.some((i) => i.score === null || i.score < 0 || i.score > 1)) {
    throw new Error("redacao.ts: score fora da faixa 0..1.");
  }

  filaMemo = fila;
  return fila;
}

export function itemDaFilaPorId(id: string): ItemDaFila | undefined {
  return filaDaRedacao().find((i) => i.id === id);
}

/**
 * O item em que a tela ABRE. Fixado por regra, nunca sorteado a cada build.
 *
 * É o item de IA de MENOR score, com empate desfeito pelo `id`. Abrir num item de produtor
 * mostraria uma ficha correta e nenhuma das perguntas que a tela existe para fazer: sem
 * score, sem os cinco componentes, sem a frase da aresta que justificou a sugestão. O caso
 * de confiança baixa é justamente aquele em que a decisão humana pesa, e é com ele à vista
 * que a tela responde «onde a IA não deve ser utilizada» sem precisar de legenda.
 */
export function itemInicialDaFila(): string {
  const candidatos = filaDaRedacao().filter((i) => i.score !== null);
  const escolhido = candidatos
    .slice()
    .sort((a, b) => (a.score as number) - (b.score as number) || porIdEstavel(a, b))[0];
  return (escolhido ?? filaDaRedacao()[0]).id;
}

/**
 * Os três escopos de D-84, com o ALCANCE MEDIDO sobre a fila que existe.
 *
 * Eles são a resposta ao «como crescer sem reescrever» do RFP: a superfície é uma só e o
 * que muda é o recorte. Por isso o alcance é contado aqui, sobre o dado, e não escrito à
 * mão na tela — um número digitado passaria a mentir na primeira regeração do grafo.
 */
export function escoposDeCuradoria(): Escopo[] {
  const fila = filaDaRedacao();
  return [
    {
      id: "nacional",
      rotulo: "nacional",
      descricao:
        "A fila inteira, sem recorte. É o escopo de quem responde pela agenda do país.",
      campo: "todos",
      alcance: fila.length,
    },
    {
      id: "territorial",
      rotulo: "territorial",
      descricao:
        "Só os itens que o acervo situa em algum território. É o escopo de quem responde " +
        "por uma praça, e o recorte que permite uma redação regional operar a mesma tela.",
      campo: "territorio",
      alcance: fila.filter((i) => i.territorio !== null).length,
    },
    {
      id: "linguagem",
      rotulo: "por linguagem",
      descricao:
        "Só os itens com linguagem classificada no vocabulário controlado. É o escopo de " +
        "quem responde por uma área — música, artes visuais, literatura.",
      campo: "linguagens",
      alcance: fila.filter((i) => i.linguagens.length > 0).length,
    },
  ];
}

/** Congelada como `readonly` para o componente não poder reordenar o que a tela declara. */
export const ESCOPOS_DE_CURADORIA: readonly Escopo[] = escoposDeCuradoria();

/**
 * O recorte de um escopo, despachado sobre `Escopo.campo` — a MESMA decisão que o
 * componente de cliente despacha, porque o campo vem no DTO em vez de a regra ser copiada.
 */
export function itemNoEscopo(item: ItemDaFila, campo: Escopo["campo"]): boolean {
  if (campo === "territorio") return item.territorio !== null;
  if (campo === "linguagens") return item.linguagens.length > 0;
  return true;
}

// ---------------------------------------------------------------------------
// D-83 — as quatro ações, e a assimetria que É o conteúdo
// ---------------------------------------------------------------------------

export type AcaoDaRedacao = "aprovar" | "editar" | "vetar" | "devolver";

export interface AcaoDeclarada {
  id: AcaoDaRedacao;
  rotulo: string;
  /** `"obrigatorio"` só no veto. É essa assimetria que separa curadoria de moderação. */
  motivo: "obrigatorio" | "opcional" | "nenhum";
  nota: string;
}

export const ACOES_DA_REDACAO: readonly AcaoDeclarada[] = [
  {
    id: "aprovar",
    rotulo: "Aprovar",
    motivo: "nenhum",
    nota:
      "O item entra no acervo público com o nome de quem aprovou e o carimbo do momento. " +
      "Aprovar é a única porta pela qual uma sugestão de IA vira dado público.",
  },
  {
    id: "editar",
    rotulo: "Editar",
    motivo: "nenhum",
    nota:
      "Abre a ficha para correção antes de publicar. A edição fica registrada com autor e " +
      "carimbo, como qualquer outra decisão.",
  },
  {
    id: "vetar",
    rotulo: "Vetar",
    motivo: "obrigatorio",
    nota:
      "Barra o item, e EXIGE motivo escrito — o botão de confirmar não conclui com o campo " +
      "vazio. Um veto sem motivo registrado é moderação silenciosa: some da fila e ninguém " +
      "consegue dizer por quê. É a única ação em que o campo é obrigatório, e a diferença " +
      "é o argumento (D-83).",
  },
  {
    id: "devolver",
    rotulo: "Devolver",
    motivo: "opcional",
    nota:
      "Manda de volta a quem submeteu, com comentário OPCIONAL. Opcional aqui e " +
      "obrigatório no veto de propósito: devolver mantém a conversa aberta, vetar a " +
      "encerra — e só quem encerra deve explicação.",
  },
];

/** A frase que a tela imprime sobre a assimetria. Produto, não comentário. */
export const FRASE_DA_ASSIMETRIA =
  "Das quatro ações, só o veto exige motivo escrito. Devolver aceita comentário e não o " +
  "cobra; aprovar e editar não pedem nenhum. A assimetria é deliberada: vetar é a única " +
  "ação que encerra o assunto sem devolver a palavra a quem submeteu, e é por isso que ela " +
  "é a única que deve explicação por escrito.";

// ---------------------------------------------------------------------------
// D-90 — o que o acervo não sustenta na tela 34
// ---------------------------------------------------------------------------

export interface DeclaracaoDaRedacao {
  campo: string;
  texto: string;
}

/**
 * A tela 34 pede coisas que o acervo não tem, e o denominador de cada ausência é MEDIDO
 * aqui em vez de escrito à mão. Campo vazio sem frase é o beco que a fase 5 decidiu não
 * ter (D-90).
 */
export function declaracoesDaRedacao(): DeclaracaoDaRedacao[] {
  const fila = filaDaRedacao();
  const semTerritorio = fila.filter((i) => i.territorio === null).length;
  const semLinguagem = fila.filter((i) => i.linguagens.length === 0).length;
  const semResumo = fila.filter((i) => !i.resumo).length;
  return [
    {
      campo: "quem submeteu",
      texto:
        `O acervo não publica o autor da submissão de nenhum dos ${fila.length} itens: não ` +
        "há campo de submissor nas entidades do Itaú Cultural. A fila mostra a ORIGEM do " +
        "item, que o dado sustenta, e não o nome de quem o enviou, que ele não sustenta. " +
        "Inventar um nome aqui seria fabricar autoria — o oposto do que esta tela demonstra.",
    },
    {
      campo: "data de entrada na fila",
      texto:
        "Nenhuma entidade do acervo carrega data de submissão, então a fila não ordena por " +
        "«mais antigo primeiro». A ordem é a da regra de amostragem declarada, e a tela diz " +
        "isso em vez de exibir uma antiguidade que não existe.",
    },
    {
      campo: "território",
      texto:
        `${semTerritorio} dos ${fila.length} itens não têm território no acervo. Eles somem ` +
        "do escopo territorial e o número aparece ao lado do escopo, para o recorte menor " +
        "não parecer fila mais curta.",
    },
    {
      campo: "linguagem",
      texto:
        `${semLinguagem} dos ${fila.length} itens não têm linguagem classificada, e ${semResumo} ` +
        "não têm resumo. Nos dois casos o campo aparece declarado vazio, com a frase, em " +
        "vez de sumir da ficha.",
    },
  ];
}

// ---------------------------------------------------------------------------
// D-85 — os passos da trilha, LIDOS DE `trilha.ts` e não reescritos aqui
// ---------------------------------------------------------------------------

export interface PassoDoEditor {
  /** Chave estável do passo no editor. */
  chave: string;
  ordem: number;
  deId: string;
  deTitulo: string;
  deClasse: ClasseEntidade;
  paraId: string;
  paraTitulo: string;
  paraClasse: ClasseEntidade;
  relacao: Relacao | null;
  /**
   * **O MESMO campo `PassoTrilha.motivo` que `/trilha/[slug]/` imprime no selo público.**
   * Não é cópia, não é reformatação, não tem prefixo: é o objeto atravessando. É por
   * construção, e não por disciplina, que os dois textos batem caractere a caractere
   * (D-85) — e 05-08 compara os dois.
   */
  motivo: string;
  origemMotivo: OrigemMotivo;
  procedenciaAresta: Procedencia | null;
  /** `true` nos passos que vieram do acervo; o editor acrescenta passos com `false`. */
  doAcervo: boolean;
}

export interface TrilhaDoEditor {
  slug: string;
  titulo: string;
  resumo: string | null;
  assinatura: string;
  /** Publicabilidade pelas TRÊS regras que `trilhaEhPublicavel` já cobre. */
  publicavelNoAcervo: boolean;
  motivoNaoPublicavelNoAcervo: string | null;
  passos: PassoDoEditor[];
}

/**
 * Os passos de uma trilha, prontos para o editor.
 *
 * Construído SOBRE `passosDaTrilha`. A tentação seria reimplementar a travessia aqui, com
 * os campos que o editor quer; o custo disso não é código duplicado, é o selo público e o
 * campo do editor virarem duas strings diferentes na primeira vez que alguém mexer numa
 * das duas. D-85 diz que as duas pontas concordam, e concordância por cópia é concordância
 * até a próxima edição.
 */
export function passosParaEditor(slug: string): PassoDoEditor[] {
  const completa = trilhaCompletaPorSlug(slug);
  if (!completa) {
    throw new Error(
      `redacao.ts: nenhuma trilha do acervo responde por «${slug}». O editor de trilha da ` +
        "tela 35 abre sobre a trilha existente do grafo, e uma trilha ausente aqui " +
        "significa que a fonte mudou por baixo — melhor parar de compilar que abrir um " +
        "editor vazio que parece funcionar.",
    );
  }

  return completa.passos.map((p) => {
    // `PassoTrilha.motivo` é documentado como NUNCA VAZIO. Um motivo vazio chegando aqui
    // significa que `motivo.ts` ou `trilha.ts` mudaram por baixo, e o desfecho seria um
    // selo em branco publicado ao público. Parar de compilar é melhor.
    if (!p.motivo || !p.motivo.trim()) {
      throw new Error(
        `redacao.ts: o passo ${p.ordem} da trilha «${slug}» chegou com motivo vazio. ` +
          "`PassoTrilha.motivo` é documentado como nunca vazio e é ele que vira o selo " +
          "público em /trilha/[slug]/ (D-85). Um motivo vazio aqui publicaria um selo em " +
          "branco. CORRIJA a fonte em trilha.ts/motivo.ts — não relaxe esta conferência.",
      );
    }
    return {
      chave: `passo:${p.ordem}:${p.de.id}->${p.para.id}`,
      ordem: p.ordem,
      deId: p.de.id,
      deTitulo: p.de.titulo,
      deClasse: p.de.classe,
      paraId: p.para.id,
      paraTitulo: p.para.titulo,
      paraClasse: p.para.classe,
      relacao: p.relacao,
      motivo: p.motivo,
      origemMotivo: p.origemMotivo,
      procedenciaAresta: p.procedenciaAresta,
      doAcervo: true,
    };
  });
}

/** O slug da trilha que o editor abre. Fixado em constante, nunca sorteado a cada build. */
export function slugDaTrilhaDoEditor(): string {
  const todas = trilhas();
  if (!todas.length) {
    throw new Error(
      "redacao.ts: o grafo não tem nenhuma trilha. A tela 35 edita a trilha do traçador " +
        "da fase 2, e sem ela o editor não tem sobre o que abrir.",
    );
  }
  return todas[0].slug;
}

export function trilhaParaEditor(slug: string): TrilhaDoEditor {
  const completa = trilhaCompletaPorSlug(slug);
  if (!completa) {
    throw new Error(`redacao.ts: trilha «${slug}» não existe no grafo.`);
  }
  const pub = trilhaEhPublicavel(completa.id);
  return {
    slug: completa.slug,
    titulo: completa.titulo,
    resumo: completa.resumo ?? null,
    assinatura: completa.assinatura,
    publicavelNoAcervo: pub.publicavel,
    motivoNaoPublicavelNoAcervo: pub.motivo,
    passos: passosParaEditor(slug),
  };
}

/**
 * A QUARTA regra de publicabilidade, que é a deste plano.
 *
 * As três primeiras — cadeia vazia, cadeia que não termina em evento, evento sem sessão
 * datada — moram em `trilhaEhPublicavel` desde a fase 2 e são consumidas de lá, não
 * reimplementadas. Esta soma a de D-85: passo sem motivo não publica. Ela é a única que o
 * editor pode CRIAR, porque é a única que depende do que o curador acabou de fazer.
 */
export const REGRA_DO_MOTIVO_OBRIGATORIO =
  "Um passo sem motivo escrito impede a publicação da trilha inteira. O motivo não é nota " +
  "interna: é o texto que aparece ao público como selo do passo em Descobrir, e uma trilha " +
  "que publica um selo em branco entrega ao leitor uma ponte sem explicação. As outras três " +
  "regras de publicabilidade — cadeia vazia, cadeia que não termina em evento, evento sem " +
  "sessão datada — vêm de `trilhaEhPublicavel`, da fase 2, e não são reescritas aqui.";

// ---------------------------------------------------------------------------
// D-86 — a sugestão de próximo passo, e o que ela NÃO é
// ---------------------------------------------------------------------------

export interface SugestaoDeProximoPasso {
  entidadeId: string;
  titulo: string;
  classe: ClasseEntidade;
  relacao: Relacao;
  /** A frase DA ARESTA, por `motivoDaAresta`. Não é texto de modelo. */
  motivo: string;
  origemMotivo: OrigemMotivo;
  procedenciaAresta: Procedencia;
  /** De qual nó a travessia partiu — o último da cadeia. */
  aPartirDeId: string;
  aPartirDeTitulo: string;
  /** A regra determinística que produziu esta sugestão, para a tela imprimir ao lado. */
  regra: string;
}

export const REGRA_DA_SUGESTAO =
  "A sugestão de próximo passo é TRAVESSIA DO GRAFO, não modelo: a partir do último nó da " +
  "cadeia, o vizinho de maior preferência de relação que ainda não está na trilha, com a " +
  "frase da própria aresta como justificativa. É determinística — a mesma trilha produz " +
  "sempre a mesma sugestão — e é sempre descartável: nenhuma sugestão entra na trilha sem " +
  "um clique humano (D-86).";

export function sugestaoDeProximoPasso(slug: string): SugestaoDeProximoPasso | null {
  const passos = passosParaEditor(slug);
  if (!passos.length) return null;

  const ultimoId = passos[passos.length - 1].paraId;
  const jaNaTrilha = new Set<string>([passos[0].deId, ...passos.map((p) => p.paraId)]);
  const ultimo = porId(ultimoId);
  if (!ultimo) return null;

  // `vizinhos()` já devolve a adjacência ordenada por preferência de relação, então o
  // primeiro que não está na trilha É a escolha — não há segundo critério escondido.
  for (const v of vizinhos(ultimoId)) {
    if (jaNaTrilha.has(v.entidade.id)) continue;
    if (v.entidade.classe === "ocorrencia" || v.entidade.classe === "temporada") continue;
    const ladoDe = porId(v.aresta.de) ?? ultimo;
    const ladoPara = porId(v.aresta.para) ?? v.entidade;
    const m = motivoDaAresta(v.aresta, ladoDe, ladoPara);
    return {
      entidadeId: v.entidade.id,
      titulo: v.entidade.titulo,
      classe: v.entidade.classe,
      relacao: v.aresta.relacao,
      motivo: m.texto,
      origemMotivo: m.origemMotivo,
      procedenciaAresta: v.aresta.procedencia,
      aPartirDeId: ultimoId,
      aPartirDeTitulo: ultimo.titulo,
      regra: REGRA_DA_SUGESTAO,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// O catálogo de arrasto — e o peso dele, medido
// ---------------------------------------------------------------------------

export interface CandidatoDoCatalogo {
  id: string;
  titulo: string;
  classe: ClasseEntidade;
}

export interface CatalogoDeArrasto {
  itens: CandidatoDoCatalogo[];
  /** O grafo inteiro. É o denominador honesto da frase da tela. */
  total: number;
  /** Quantos passam na regra do recorte, ANTES do teto. */
  elegiveis: number;
  regra: string;
}

/** As classes que o catálogo varre. `ocorrencia` fica fora: ela não é passo de trilha. */
const CLASSES_DO_CATALOGO: readonly ClasseEntidade[] = [
  "pessoa",
  "coletivo",
  "instituicao",
  "espaco",
  "obra",
  "termo",
  "programa",
  "evento",
  "temporada",
  "conteudo",
  "midia",
  "publicacao",
  "formacao",
  "linguagem",
  "tema",
  "territorio",
  "trilha",
];
// `pessoa-usuaria` e `repertorio` ficam fora pelo mesmo motivo de
// `CLASSES_QUE_NAO_SE_PUBLICAM`: uma trilha curada não tem como passo a lista de salvos
// de alguém. `ocorrencia` também não está aqui — ela é uma sessão datada, não um nó de
// travessia.

/** Quantos candidatos viajam. Medido contra o teto de 60 KB do plano. */
export const TETO_DO_CATALOGO = 150;

/**
 * O grafo inteiro, CONTADO e não digitado. É o denominador da frase «N de 7.810» na tela,
 * e um número escrito à mão passaria a mentir na primeira regeração do grafo — que é
 * exatamente o defeito que a frase existe para não ter.
 */
export const TOTAL_DE_ENTIDADES = Object.values(contagens().porClasse).reduce(
  (a, b) => a + b,
  0,
);

function comPonto(n: number): string {
  return n.toLocaleString("pt-BR").replace(/ /g, " ");
}

export const REGRA_DO_CATALOGO =
  `O grafo tem ${comPonto(TOTAL_DE_ENTIDADES)} entidades e mandar todas ao navegador ` +
  "estoura o orçamento de 60 KB deste plano por uma ordem de grandeza. O catálogo recorta " +
  "por regra declarada — entidade " +
  "com resumo de pelo menos 60 caracteres e grau 2 ou mais no grafo, para o curador poder " +
  "julgar o candidato e para o passo ter ponte de onde sair — e depois amostra com passo " +
  "fixo sobre a ordem de `id`, atravessando todas as classes. A tela diz «N de " +
  `${comPonto(TOTAL_DE_ENTIDADES)}», e não «o grafo completo»: dizer «completo» sobre um ` +
  "recorte seria a mentira barata que esta obra recusa.";

let catalogoMemo: CatalogoDeArrasto | null = null;

export function catalogoParaArrastar(): CatalogoDeArrasto {
  if (catalogoMemo) return catalogoMemo;

  const todas: Entidade[] = [];
  for (const classe of CLASSES_DO_CATALOGO) {
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      if (e) todas.push(e);
    }
  }

  const elegiveis = todas
    .filter((e) => (e.resumo ?? "").length >= 60 && vizinhos(e.id).length >= 2)
    .sort(porIdEstavel);

  catalogoMemo = {
    itens: amostrar(elegiveis, TETO_DO_CATALOGO).map((e) => ({
      id: e.id,
      titulo: e.titulo,
      classe: e.classe,
    })),
    total: TOTAL_DE_ENTIDADES,
    elegiveis: elegiveis.length,
    regra: REGRA_DO_CATALOGO,
  };
  return catalogoMemo;
}

// ---------------------------------------------------------------------------
// Os números — o que a tela cita e o que 05-08 mede contra ela
// ---------------------------------------------------------------------------

/** 60 KB. O teto de DTO deste plano, medido a cada build. */
export const TETO_DO_DTO = 61440;

export interface NumerosDaRedacao {
  itensNaFila: number;
  itensPorOrigem: Record<OrigemDoItem, number>;
  itensComScore: number;
  scoreMinimo: number;
  scoreMaximo: number;
  componentesDoScore: number;
  escopos: Record<IdDoEscopo, number>;
  acoes: number;
  acoesQueExigemMotivo: number;
  limitesDaIa: number;
  passosDaTrilha: number;
  passosComMotivo: number;
  catalogoItens: number;
  catalogoElegiveis: number;
  catalogoTotal: number;
  bytesDoDto: number;
  tetoDoDto: number;
}

let numerosMemo: NumerosDaRedacao | null = null;

export function numerosDaRedacao(): NumerosDaRedacao {
  if (numerosMemo) return numerosMemo;

  const fila = filaDaRedacao();
  const catalogo = catalogoParaArrastar();
  const slug = slugDaTrilhaDoEditor();
  const passos = passosParaEditor(slug);
  const scores = fila.filter((i) => i.score !== null).map((i) => i.score as number);

  // O MESMO objeto que a página passa ao componente. Medir outra coisa mediria outra
  // coisa: foi assim que 05-01 descobriu, tarde, que o DTO dele tinha 148 KB.
  const bytes = JSON.stringify({ fila, cat: catalogo }).length;
  if (bytes > TETO_DO_DTO) {
    throw new Error(
      `redacao.ts: o DTO da fila mais o catálogo ficou com ${bytes} bytes, acima do teto ` +
        `declarado de ${TETO_DO_DTO} (60 KB, orçamento deste plano). REDUZA ` +
        `ITENS_POR_ORIGEM (${ITENS_POR_ORIGEM}) ou TETO_DO_CATALOGO (${TETO_DO_CATALOGO}) — ` +
        "não relaxe o teto: ele é o que impede as 7.810 entidades de irem para o navegador.",
    );
  }

  numerosMemo = {
    itensNaFila: fila.length,
    itensPorOrigem: {
      produtor: fila.filter((i) => i.origem === "produtor").length,
      ingestao: fila.filter((i) => i.origem === "ingestao").length,
      ia: fila.filter((i) => i.origem === "ia").length,
    },
    itensComScore: scores.length,
    scoreMinimo: Math.min(...scores),
    scoreMaximo: Math.max(...scores),
    componentesDoScore: COMPONENTES_DO_SCORE.length,
    escopos: {
      nacional: ESCOPOS_DE_CURADORIA[0].alcance,
      territorial: ESCOPOS_DE_CURADORIA[1].alcance,
      linguagem: ESCOPOS_DE_CURADORIA[2].alcance,
    },
    acoes: ACOES_DA_REDACAO.length,
    acoesQueExigemMotivo: ACOES_DA_REDACAO.filter((a) => a.motivo === "obrigatorio").length,
    limitesDaIa: LIMITES_DA_IA.length,
    passosDaTrilha: passos.length,
    passosComMotivo: passos.filter((p) => p.motivo.trim().length > 0).length,
    catalogoItens: catalogo.itens.length,
    catalogoElegiveis: catalogo.elegiveis,
    catalogoTotal: catalogo.total,
    bytesDoDto: bytes,
    tetoDoDto: TETO_DO_DTO,
  };
  return numerosMemo;
}
