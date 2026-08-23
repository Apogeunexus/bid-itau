/**
 * duplicatas.ts — o motor de deduplicação em dois estágios (D-68, D-69, D-70, STUD-01).
 *
 * O QUE ESTA TELA PROVA, E POR QUE ELA É A MAIS IMPORTANTE DAS 37. Um deduplicador
 * genérico compara strings e chuta. Aqui a suspeita nasce do CRITÉRIO DE IDENTIDADE DA
 * ONTOLOGIA — mesmo título normalizado, mesmo agente realizador, mesma obra (D-22) —, que
 * é uma afirmação sobre o que faz duas linhas serem a mesma coisa no mundo, e não sobre
 * quão parecidos são dois textos. É essa diferença que a tela existe para tornar visível.
 *
 * A ORDEM DOS DOIS ESTÁGIOS É O ARGUMENTO. Primeiro a chave determinística, que é o
 * critério da ontologia aplicado literalmente: mesma chave, mesmo objeto. Só o que sobra
 * vai para o casamento probabilístico, que é heurística e se declara como tal, com score na
 * tela. Um sistema que começa pela similaridade é exatamente o que esta proposta não é —
 * ele funde «10ª Bienal de São Paulo» com «11ª Bienal de São Paulo» e nunca sabe que errou.
 *
 * DP-F: roda NO BUILD. Importa `grafo.ts`, que carrega 23 MB de JSON, e nenhum arquivo
 * `"use client"` pode importar este módulo por valor — só `import type`. O que atravessa a
 * fronteira para o navegador são os DTOs abaixo, que são SÓ PRIMITIVO. O gate transitivo da
 * fase 3 mede isso e falha com o caminho nomeado.
 *
 * D-16 e D-47: todo acesso ao acervo passa por `grafo.ts`. Nada aqui importa
 * `entidades.json` direto.
 *
 * ESTA API É CONGELADA para os planos 04-02 e 04-04, que a consomem sem esperar por este.
 * Eles podem ACRESCENTAR; renomear ou trocar a forma do que já existe quebra a onda 2.
 */

import { ocorrenciasDe, porId, porSlug, slugsPorTipo, vizinhos } from "./grafo";
import type { Entidade } from "./tipos";

// ---------------------------------------------------------------------------
// O critério, escrito por extenso — dado da tela, não prosa de comentário
// ---------------------------------------------------------------------------

/**
 * O critério de identidade da ontologia, em texto corrido e não em sigla.
 *
 * Ele é DADO e aparece no produto (D-68). Um critério que só existisse em comentário de
 * código seria indistinguível, para quem avalia, de um deduplicador que compara strings e
 * não explica nada.
 */
export const CRITERIO_DE_IDENTIDADE =
  "Dois registros são o mesmo evento quando têm o mesmo título normalizado, o mesmo " +
  "agente realizador e a mesma obra. O critério é o da ontologia, não uma medida " +
  "de parecença entre textos: ele afirma o que faz duas linhas serem a mesma coisa no " +
  "mundo, e por isso a suspeita que ele levanta é auditável campo a campo.";

export interface ComponenteDoCriterio {
  campo: string;
  rotulo: string;
  /** O acervo preenche este componente? Medido: só o título. */
  sustentado: boolean;
}

/**
 * Os três componentes do critério, separados para a tela poder marcar qual o acervo
 * preenche e qual ele deixa vazio.
 */
export const COMPONENTES_DO_CRITERIO: readonly ComponenteDoCriterio[] = [
  { campo: "titulo", rotulo: "mesmo título normalizado", sustentado: true },
  { campo: "agente", rotulo: "mesmo agente realizador", sustentado: false },
  { campo: "obra", rotulo: "mesma obra", sustentado: false },
];

// ---------------------------------------------------------------------------
// O grupo do traçador — fixado em constante, não escolhido a cada chamada
// ---------------------------------------------------------------------------

/**
 * O grupo que a tela mostra no traçador, FIXADO EM CONSTANTE de propósito.
 *
 * A regra que o produziu: **entre os grupos formados pelas 40 arestas
 * `duplicata_suspeita`, o de menor id em ordem lexicográfica**, sendo o id do grupo o
 * estágio seguido do menor id de entidade que ele contém. Medido em 2026-08-22: as 40
 * arestas formam 40 pares; os clones encenados têm id `evento:autorado:dup-NNN-*`, que
 * ordena antes de `evento:cms:*` e de `evento:enc:*`, e `dup-001-1025` é o menor de todos.
 *
 * POR QUE CONSTANTE E NÃO CÁLCULO A CADA CHAMADA. É a mesma disciplina de `EVENTO_DO_PAR`
 * em `alerta.ts`: um grupo escolhido por regra viva troca silenciosamente quando o grafo é
 * regerado, e o roteiro que a banca vai percorrer deixa de ser reproduzível entre um build
 * e o seguinte. Com a constante, uma regeração que mude o conjunto faz `grupoDoTracador`
 * LANÇAR com mensagem nomeada — quebrar alto em vez de trocar o roteiro em silêncio.
 */
export const GRUPO_DO_TRACADOR = "chave:evento:autorado:dup-001-1025";

/** Quantas arestas `duplicata_suspeita` o grafo tinha quando as constantes foram fixadas. */
export const ARESTAS_ENCENADAS_ESPERADAS = 40;

// ---------------------------------------------------------------------------
// O limiar do segundo estágio — e a medição que o justifica
// ---------------------------------------------------------------------------

/**
 * O limiar de similaridade de Jaccard acima do qual dois eventos viram par suspeito.
 *
 * **0,65, e o número tem justificativa medida, não gosto.** Contra o grafo de 2026-08-22:
 *
 * - dos 40 clones encenados, 27 têm chave IDÊNTICA ao original e são pegos pelo estágio 1;
 *   os 13 restantes — os de prefixo de produtor e sufixo de edição — só o estágio 2 alcança;
 * - o MENOR score entre esses 13 é **0,667**; o maior é **0,950**. O limiar precisa ficar
 *   abaixo de 0,667 para não perder nenhum;
 * - a 0,65 a fila tem **51 pares**. Baixar para 0,60 leva a fila a **103 pares** — o dobro —
 *   **sem capturar um único clone a mais**. O ganho seria zero e o custo, dobrar o trabalho
 *   humano.
 *
 * O limiar é exportado porque um número que decide o que entra na fila de uma pessoa tem de
 * ser auditável, e não constante enterrada no meio de uma função.
 */
export const LIMIAR_PROBABILISTICO = 0.65;

/** O limiar alternativo que foi medido e recusado, com o que ele custaria. */
export const LIMIAR_ALTERNATIVO_MEDIDO = {
  limiar: 0.6,
  pares: 103,
  clonesAMais: 0,
} as const;

// ---------------------------------------------------------------------------
// DTO — só primitivo. Nenhuma entidade inteira atravessa a fronteira.
// ---------------------------------------------------------------------------

/** Em qual dos dois estágios o grupo foi pego (D-69). */
export type EstagioDeDeduplicacao = "chave" | "probabilistico";

/**
 * Um registro de um grupo suspeito, já achatado para a tela.
 *
 * `entidades.json` tem 9,4 MB; nenhuma `Entidade` inteira passa daqui para o cliente. Os
 * campos abaixo são exatamente os que a tela compara, e nada além.
 */
export interface RegistroDuplicado {
  id: string;
  /** `a`, `b`, `c` — o valor de `data-lado`. Um grupo do acervo chega a ter três. */
  lado: string;
  titulo: string;
  slug: string;
  /** Rota da página do evento, para a tela levar de volta ao registro comparado. */
  rota: string;
  /** A chave de identidade LITERAL, para quem lê ver que a comparação é sobre um valor. */
  chaveIdentidade: string;
  procedencia: string;
  fonte: string | null;
  ocorrencias: number;
  /** O período declarado, já formatado, ou a declaração de que não há. */
  periodo: string;
  /** Nome legível da variação aplicada ao clone. `null` no original e no registro real. */
  variacao: string | null;
  clonadoDe: string | null;
}

/** Uma linha da comparação campo a campo (D-70). */
export interface CampoComparado {
  /** O valor de `data-campo`. */
  campo: string;
  rotulo: string;
  /** Um valor por registro, na mesma ordem de `registros`. */
  valores: string[];
  /** O valor de `data-divergente`, já decidido aqui e não na tela. */
  divergente: boolean;
}

/**
 * De onde o grupo veio, e a distinção é mais fina do que «nosso» contra «deles».
 *
 * - `encenado` — o grupo tem um clone E o original que ele viola. É uma das 40 duplicatas
 *   que plantamos de propósito, e o motor a encontrou.
 * - `acervo`   — nenhum registro é clone. **É o achado mais forte da tela:** o critério da
 *   ontologia encontrou duplicata de verdade num acervo de verdade, e não só as nossas.
 * - `cruzado`  — o grupo tem um clone, mas emparelhado com um evento que NÃO é o original
 *   dele. Medido: 5 dos 51 pares probabilísticos. Não é acerto nem duplicata real — é o
 *   segundo estágio fazendo o que heurística faz, e por isso ele é contado à parte em vez
 *   de inflar o número de clones capturados.
 */
export type OrigemDoGrupo = "encenado" | "acervo" | "cruzado";

export interface GrupoDeDuplicatas {
  /** `chave:<menor id>` ou `prob:<idA>+<idB>`. É o valor de `data-grupo`. */
  id: string;
  estagio: EstagioDeDeduplicacao;
  /** O rótulo em português que vai para a tela (D-69). */
  estagioRotulo: string;
  /** A frase que diz o que aquele estágio significa e por que a ordem importa. */
  estagioExplicacao: string;
  /** Só no estágio probabilístico. Três casas decimais. `null` no determinístico. */
  score: number | null;
  /**
   * `true` só quando o grupo tem um clone E o original que ele viola — nunca por o grupo
   * conter um clone qualquer. A definição frouxa daria 18 pares no estágio 2 em vez de 13,
   * inflando o número de clones capturados com 5 emparelhamentos que não são acerto.
   */
  encenado: boolean;
  origem: OrigemDoGrupo;
  /** A chave compartilhada, no estágio determinístico. `null` no probabilístico. */
  chave: string | null;
  registros: RegistroDuplicado[];
  campos: CampoComparado[];
  ocorrenciasEnvolvidas: number;
}

// ---------------------------------------------------------------------------
// Falha alta e nomeada
// ---------------------------------------------------------------------------

/** O dado saiu debaixo das constantes: quebrar alto, nunca devolver fila vazia calada. */
function romper(mensagem: string): never {
  throw new Error(
    `duplicatas.ts: ${mensagem}. As constantes GRUPO_DO_TRACADOR, ` +
      `ARESTAS_ENCENADAS_ESPERADAS e LIMIAR_PROBABILISTICO foram fixadas contra o grafo de ` +
      `2026-08-22; se o grafo foi regerado, refaça a medição pela regra declarada ao lado de ` +
      `cada constante em vez de relaxar esta conferência.`,
  );
}

// ---------------------------------------------------------------------------
// Helpers de leitura do acervo — tudo por grafo.ts (D-16, D-47)
// ---------------------------------------------------------------------------

/**
 * Os 300 eventos do grafo, resolvidos por slug.
 *
 * `grafo.ts` não expõe «todas as entidades» de propósito — quem varre array cru acaba
 * mostrando lista. `slugsPorTipo` + `porSlug` é a porta que ele abre para o caso em que a
 * pergunta é genuinamente sobre o conjunto inteiro de uma classe, que é o caso da
 * deduplicação: um estágio que só olhasse parte do acervo não deduplicaria coisa nenhuma.
 */
function eventos(): Entidade[] {
  const lista: Entidade[] = [];
  for (const slug of slugsPorTipo("evento")) {
    const e = porSlug("evento", slug);
    if (e) lista.push(e);
  }
  return lista.sort((a, b) => a.id.localeCompare(b.id));
}

/** "2024-06-20T17:00:00.000-03:00" → "20.06.2024". Fatia a ISO; nunca `new Date`. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : iso;
}

/**
 * O período declarado do evento, já formatado.
 *
 * Duas formas no acervo, e as duas são a fonte: o `periodo` do CMS, em ISO, e o
 * `locais[].data` da Enciclopédia, que é texto livre («1978», «05.11.1826»). Nenhuma das
 * duas é comparada com a outra — a fase 3 mediu que comparar `DD.MM.AAAA` com ISO por
 * string acusa 113 datas históricas de futuras. Aqui elas só são EXIBIDAS.
 */
function periodoDe(entidade: Entidade): string {
  const extra = entidade.extra as
    | { periodo?: { inicio?: string; fim?: string }; locais?: Array<{ data?: string | null }> }
    | undefined;

  const periodo = extra?.periodo;
  if (periodo?.inicio) {
    const inicio = dataCurta(periodo.inicio);
    const fim = periodo.fim ? dataCurta(periodo.fim) : inicio;
    return inicio === fim ? inicio : `${inicio} → ${fim}`;
  }

  const declaradas = (extra?.locais ?? [])
    .map((l) => String(l?.data ?? "").trim())
    .filter(Boolean);
  if (declaradas.length) return declaradas.join(" · ");

  return "não declarado no acervo";
}

/** "1304" → "1.304". Separador escrito à mão, para não depender do locale do runtime. */
export function comSeparador(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ---------------------------------------------------------------------------
// Montagem de um grupo
// ---------------------------------------------------------------------------

const LADOS = ["a", "b", "c", "d"];

function paraRegistro(entidade: Entidade, indice: number): RegistroDuplicado {
  return {
    id: entidade.id,
    lado: LADOS[indice] ?? String(indice),
    titulo: entidade.titulo,
    slug: entidade.slug,
    rota: `/evento/${entidade.slug}/`,
    chaveIdentidade: entidade.chaveIdentidade ?? "",
    procedencia: entidade.procedencia,
    fonte: entidade.fonte ?? null,
    ocorrencias: ocorrenciasDe(entidade.id).length,
    periodo: periodoDe(entidade),
    variacao: entidade.variacao ?? null,
    clonadoDe: entidade.clonadoDe ?? null,
  };
}

/**
 * As linhas da comparação campo a campo (D-70).
 *
 * A DIVERGÊNCIA É DECIDIDA AQUI, no build, e não na tela: a marca visual de primeira ordem
 * que o campo divergente recebe é consequência de um valor do DTO, não de uma comparação
 * refeita em JavaScript no navegador. Quem decide precisa VER a diferença; ir procurá-la é
 * o que a tela existe para evitar.
 */
function compararCampos(registros: RegistroDuplicado[]): CampoComparado[] {
  const linha = (
    campo: string,
    rotulo: string,
    valorDe: (r: RegistroDuplicado) => string,
  ): CampoComparado => {
    const valores = registros.map(valorDe);
    return { campo, rotulo, valores, divergente: new Set(valores).size > 1 };
  };

  return [
    linha("titulo", "Título", (r) => r.titulo),
    linha("chave-identidade", "Chave de identidade", (r) => r.chaveIdentidade),
    linha("procedencia", "Procedência", (r) => r.procedencia),
    linha("ocorrencias", "Ocorrências", (r) => comSeparador(r.ocorrencias)),
    linha("periodo", "Período declarado", (r) => r.periodo),
    linha("variacao", "Variação declarada", (r) => r.variacao ?? "—"),
  ];
}

const EXPLICACAO_CHAVE =
  "Primeiro estágio: a chave de identidade da ontologia, aplicada literalmente. Mesma " +
  "chave, mesmo objeto — não há score porque não há chute. Ele roda ANTES do casamento " +
  "probabilístico, e essa ordem é o argumento: um sistema que começa pela similaridade " +
  "nunca sabe se acertou.";

const EXPLICACAO_PROBABILISTICO =
  "Segundo estágio: casamento probabilístico, e só sobre o que a chave NÃO pegou. É " +
  "heurística, e por isso se declara como tal, com o score na tela. Ele existe porque a " +
  "chave é exata e a fonte não é — mas ele nunca decide sozinho, e o que ele levanta é " +
  "suspeita, não conclusão.";

function montarGrupo(
  entidades: Entidade[],
  estagio: EstagioDeDeduplicacao,
  score: number | null,
): GrupoDeDuplicatas {
  const ordenadas = [...entidades].sort((a, b) => a.id.localeCompare(b.id));
  const registros = ordenadas.map(paraRegistro);
  const id =
    estagio === "chave"
      ? `chave:${registros[0]?.id ?? ""}`
      : `prob:${registros[0]?.id ?? ""}+${registros[1]?.id ?? ""}`;

  const temClone = registros.some((r) => r.clonadoDe !== null);
  const parEncenado = registros.some(
    (r) => r.clonadoDe !== null && registros.some((o) => o.id === r.clonadoDe),
  );

  return {
    id,
    estagio,
    estagioRotulo: estagio === "chave" ? "chave determinística" : "casamento probabilístico",
    estagioExplicacao: estagio === "chave" ? EXPLICACAO_CHAVE : EXPLICACAO_PROBABILISTICO,
    score,
    encenado: parEncenado,
    origem: parEncenado ? "encenado" : temClone ? "cruzado" : "acervo",
    chave: estagio === "chave" ? (registros[0]?.chaveIdentidade ?? null) : null,
    registros,
    campos: compararCampos(registros),
    ocorrenciasEnvolvidas: registros.reduce((a, r) => a + r.ocorrencias, 0),
  };
}

// ---------------------------------------------------------------------------
// Os grupos encenados — as 40 arestas `duplicata_suspeita`
// ---------------------------------------------------------------------------

let CACHE_ENCENADOS: GrupoDeDuplicatas[] | null = null;

/**
 * Os grupos que as arestas `duplicata_suspeita` declaram — os 40 pares encenados.
 *
 * Percorridos por `vizinhos()`, como manda D-16: a aresta é que carrega o `motivo` da
 * suspeita, e varrer `arestas.json` por fora perderia exatamente isso.
 */
function gruposEncenados(): GrupoDeDuplicatas[] {
  if (CACHE_ENCENADOS) return CACHE_ENCENADOS;

  const vistos = new Set<string>();
  const grupos: GrupoDeDuplicatas[] = [];

  for (const evento of eventos()) {
    for (const { entidade } of vizinhos(evento.id, "duplicata_suspeita")) {
      const par = [evento.id, entidade.id].sort();
      const marca = par.join("+");
      if (vistos.has(marca)) continue;
      vistos.add(marca);

      const a = porId(par[0] as string);
      const b = porId(par[1] as string);
      if (!a || !b) romper(`uma ponta da aresta duplicata_suspeita «${marca}» não resolve`);

      // Mesma chave nos dois lados é o estágio 1; chave diferente é o que sobra para o 2.
      const mesmaChave = a.chaveIdentidade === b.chaveIdentidade;
      grupos.push(montarGrupo([a, b], mesmaChave ? "chave" : "probabilistico", null));
    }
  }

  if (grupos.length !== ARESTAS_ENCENADAS_ESPERADAS) {
    romper(
      `o grafo tem ${grupos.length} grupos encenados e a constante espera ` +
        `${ARESTAS_ENCENADAS_ESPERADAS}`,
    );
  }

  grupos.sort((x, y) => x.id.localeCompare(y.id));
  CACHE_ENCENADOS = grupos;
  return grupos;
}

/**
 * O grupo do traçador: o de menor id entre os grupos encenados, conferido contra a
 * constante em vez de recalculado a cada build.
 */
export function grupoDoTracador(): GrupoDeDuplicatas {
  const grupos = gruposEncenados();
  const menor = grupos[0];
  if (!menor) romper("nenhuma ligação duplicata_suspeita no acervo");
  if (menor.id !== GRUPO_DO_TRACADOR) {
    romper(
      `o menor grupo encenado agora é «${menor.id}» e a constante GRUPO_DO_TRACADOR diz ` +
        `«${GRUPO_DO_TRACADOR}»`,
    );
  }
  return menor;
}

// ---------------------------------------------------------------------------
// ESTÁGIO 1 — a chave determinística
// ---------------------------------------------------------------------------

let CACHE_POR_CHAVE: GrupoDeDuplicatas[] | null = null;

/**
 * Os grupos formados por chave de identidade IDÊNTICA.
 *
 * Este é o critério da ontologia aplicado literalmente: mesma chave, mesmo objeto. Não há
 * score porque não há chute — ou os dois registros afirmam a mesma identidade, ou não.
 *
 * Medido contra o grafo de 2026-08-22: **33 chaves com colisão**, sendo **27 grupos que
 * contêm um clone encenado** e **6 grupos inteiramente do acervo** — 5 pares e um trio,
 * 13 registros ao todo. Os 6 reais são o achado mais forte desta tela: o critério encontrou
 * duplicata de verdade num acervo de verdade, e não só as que nós plantamos. São eles
 * «(des)Construções» / «(Des)construções», «29º Salão Arte Pará», «(Individual de Selma
 * Bezerra)», «#Vivendoartisticamente» (×3), «"Folhas de Ouro" + Panfletagem na Feira» e
 * «13ª Bienal do Mercosul».
 */
export function gruposPorChave(): GrupoDeDuplicatas[] {
  if (CACHE_POR_CHAVE) return CACHE_POR_CHAVE;

  const porChave = new Map<string, Entidade[]>();
  for (const e of eventos()) {
    const chave = e.chaveIdentidade ?? "";
    if (!chave) continue;
    const lista = porChave.get(chave);
    if (lista) lista.push(e);
    else porChave.set(chave, [e]);
  }

  const grupos: GrupoDeDuplicatas[] = [];
  for (const membros of porChave.values()) {
    if (membros.length < 2) continue;
    grupos.push(montarGrupo(membros, "chave", null));
  }

  grupos.sort((x, y) => x.id.localeCompare(y.id));
  CACHE_POR_CHAVE = grupos;
  return grupos;
}

// ---------------------------------------------------------------------------
// ESTÁGIO 2 — o casamento probabilístico
// ---------------------------------------------------------------------------

/**
 * Os tokens do título normalizado.
 *
 * O título normalizado é o SEGUNDO campo da `chaveIdentidade`, e já vem normalizado pelo
 * gerador — caixa, acento e pontuação resolvidos lá, uma vez, para o produto inteiro. Ler
 * daqui em vez de renormalizar `titulo` na tela evita a segunda fonte de verdade da
 * normalização, que é onde este tipo de motor costuma divergir de si mesmo.
 */
function tokensDoTitulo(entidade: Entidade): Set<string> {
  const titulo = (entidade.chaveIdentidade ?? "").split("|")[1] ?? "";
  return new Set(titulo.split(" ").filter(Boolean));
}

/** Jaccard: interseção sobre união. Nada de biblioteca — são quatro linhas e uma medida. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersecao = 0;
  for (const t of a) if (b.has(t)) intersecao++;
  return intersecao / (a.size + b.size - intersecao);
}

let CACHE_PROBABILISTICO: GrupoDeDuplicatas[] | null = null;

/**
 * Os pares que o segundo estágio levanta — e SÓ sobre o que o primeiro não pegou.
 *
 * A exclusão é literal: par cujos dois lados têm a MESMA chave já é grupo do estágio 1, e
 * relistá-lo aqui faria a fila cobrar duas vezes o mesmo trabalho da pessoa que opera.
 *
 * Medido no limiar 0,65: **51 pares**, dos quais **13 são clones encenados com o seu
 * original** e **38 não são**. E é entre os 38 que mora o argumento de D-72: há pares que
 * um humano tem de SEPARAR, não fundir. «10ª Bienal de São Paulo» contra «11ª Bienal de São
 * Paulo» pontua 0,667; «Confira a agenda de julho…» contra «…de agosto…» pontua 0,778. Um
 * deduplicador automático funde os dois e nunca fica sabendo que errou. O Studio pergunta —
 * e é por isso que estes falsos positivos ficam na fila em vez de serem filtrados fora.
 */
export function paresProbabilisticos(): GrupoDeDuplicatas[] {
  if (CACHE_PROBABILISTICO) return CACHE_PROBABILISTICO;

  const lista = eventos();
  const tokens = lista.map(tokensDoTitulo);
  const grupos: GrupoDeDuplicatas[] = [];

  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i] as Entidade;
      const b = lista[j] as Entidade;
      // O que o estágio 1 pegou não volta para a fila.
      if (a.chaveIdentidade === b.chaveIdentidade) continue;

      // O limiar é comparado contra o score CRU. Arredondar antes de comparar deixaria
      // entrar um par de 0,6495 por ele virar 0,650 na exibição.
      const cru = jaccard(tokens[i] as Set<string>, tokens[j] as Set<string>);
      if (cru < LIMIAR_PROBABILISTICO) continue;

      grupos.push(montarGrupo([a, b], "probabilistico", Math.round(cru * 1000) / 1000));
    }
  }

  grupos.sort((x, y) => (y.score ?? 0) - (x.score ?? 0) || x.id.localeCompare(y.id));
  CACHE_PROBABILISTICO = grupos;
  return grupos;
}

// ---------------------------------------------------------------------------
// A fila inteira
// ---------------------------------------------------------------------------

let CACHE_FILA: GrupoDeDuplicatas[] | null = null;

/**
 * A fila que 04-02 renderiza: os dois estágios, nesta ordem.
 *
 * A ORDEM É PARTE DO ARGUMENTO, e por isso ela é fixada aqui e não deixada para a tela. O
 * determinístico vem primeiro porque ele é o critério e não a heurística; o probabilístico
 * vem depois, ordenado por score decrescente, e o id desempata. Nada aqui depende da ordem
 * em que a varredura encontrou os registros — a fila é a mesma em todo build.
 */
export function filaDeDuplicatas(): GrupoDeDuplicatas[] {
  if (CACHE_FILA) return CACHE_FILA;
  CACHE_FILA = [...gruposPorChave(), ...paresProbabilisticos()];
  return CACHE_FILA;
}

/** Um grupo da fila pelo id — a consulta que a navegação entre grupos de 04-02 usa. */
export function grupoPorId(id: string): GrupoDeDuplicatas | undefined {
  return filaDeDuplicatas().find((g) => g.id === id);
}

// ---------------------------------------------------------------------------
// Os números da deduplicação — 04-04 cita, 04-05 mede
// ---------------------------------------------------------------------------

export interface NumerosDaDeduplicacao {
  eventos: number;
  /** Quantos dos 300 eventos trazem AGENTE no critério de identidade. Medido: 0. */
  eventosComAgenteNaChave: number;
  /** Quantos trazem OBRA. Medido: 0. */
  eventosComObraNaChave: number;

  gruposPorChave: number;
  gruposPorChaveEncenados: number;
  gruposPorChaveDoAcervo: number;
  registrosEmGruposDoAcervo: number;

  paresProbabilisticos: number;
  paresProbabilisticosEncenados: number;
  /**
   * Tudo que NÃO é clone com o seu original — 38. É o número que o roteiro cita como «os
   * que vieram do acervo», e ele se divide em dois abaixo.
   */
  paresProbabilisticosNaoEncenados: number;
  /** Clone emparelhado com um evento que não é o original dele. Medido: 5 dos 38. */
  paresProbabilisticosCruzados: number;
  /** Pares em que nenhum dos dois lados é clone. Medido: 33 dos 38. */
  paresProbabilisticosDoAcervo: number;

  limiar: number;
  limiarAlternativo: typeof LIMIAR_ALTERNATIVO_MEDIDO;
  scoreMinimoEncenado: number;
  scoreMaximoEncenado: number;

  arestasEncenadas: number;
  registrosEncenados: number;
  ocorrenciasEncenadas: number;
  /**
   * Em quantos eventos os registros encenados colapsam. Medido: 40 — sempre 2 registros por
   * grupo. É o «N» de «mil registros colapsam em um evento com N ocorrências», contado em
   * vez de afirmado.
   */
  eventosDepoisDaFusaoEncenada: number;

  filaTotal: number;

  /**
   * A fila decomposta por origem, e a decomposição é o argumento da honestidade da tela:
   * quem olha precisa saber quanto disto plantamos e quanto o critério achou sozinho.
   *
   * Medido: 40 encenados + 39 do acervo + 5 cruzados = 84.
   */
  gruposEncenadosNaFila: number;
  /** Grupos em que NENHUM registro é clone — o critério os achou sozinho. Medido: 39. */
  gruposDoAcervoNaFila: number;
  /** Clone emparelhado com evento que não é o original dele. Medido: 5. */
  gruposCruzadosNaFila: number;
}

let CACHE_NUMEROS: NumerosDaDeduplicacao | null = null;

/**
 * O bloco de números da deduplicação, calculado sobre o dado e não transcrito à mão.
 *
 * 04-04 os cita no roteiro e 04-05 os mede contra a tela; se eles fossem literais digitados
 * num componente, a primeira regeração do grafo faria a apresentação afirmar número que o
 * dado não sustenta — que é exatamente a classe de defeito que este projeto argumenta contra.
 */
export function numerosDaDeduplicacao(): NumerosDaDeduplicacao {
  if (CACHE_NUMEROS) return CACHE_NUMEROS;

  const lista = eventos();
  let comAgente = 0;
  let comObra = 0;
  for (const e of lista) {
    const partes = (e.chaveIdentidade ?? "").split("|");
    if ((partes[2] ?? "").trim()) comAgente++;
    if ((partes[3] ?? "").trim()) comObra++;
  }

  const chave = gruposPorChave();
  const prob = paresProbabilisticos();
  const encenadosProb = prob.filter((g) => g.encenado);
  const scores = encenadosProb.map((g) => g.score ?? 0);
  const encenados = gruposEncenados();

  if (!scores.length) romper("o estágio probabilístico não capturou nenhum clone encenado");

  const naFila = [...chave, ...prob];
  const registrosEncenados = encenados.reduce((a, g) => a + g.registros.length, 0);

  // O COLAPSO É AFIRMAÇÃO DE TELA, então ele quebra alto se deixar de valer. «80 registros
  // viram 40 eventos» só é verdade enquanto todo grupo encenado tiver exatamente 2
  // registros; um trio numa regeração do grafo faria a apresentação afirmar um colapso que
  // o dado não sustenta, e é essa classe de defeito que o projeto inteiro argumenta contra.
  if (registrosEncenados !== encenados.length * 2) {
    romper(
      `o colapso encenado deixou de ser 2 para 1: ${registrosEncenados} registros em ` +
        `${encenados.length} grupos. Refaça o número na tela antes de apresentá-lo.`,
    );
  }

  CACHE_NUMEROS = {
    eventos: lista.length,
    eventosComAgenteNaChave: comAgente,
    eventosComObraNaChave: comObra,

    gruposPorChave: chave.length,
    gruposPorChaveEncenados: chave.filter((g) => g.encenado).length,
    gruposPorChaveDoAcervo: chave.filter((g) => g.origem === "acervo").length,
    registrosEmGruposDoAcervo: chave
      .filter((g) => g.origem === "acervo")
      .reduce((a, g) => a + g.registros.length, 0),

    paresProbabilisticos: prob.length,
    paresProbabilisticosEncenados: encenadosProb.length,
    paresProbabilisticosNaoEncenados: prob.length - encenadosProb.length,
    paresProbabilisticosCruzados: prob.filter((g) => g.origem === "cruzado").length,
    paresProbabilisticosDoAcervo: prob.filter((g) => g.origem === "acervo").length,

    limiar: LIMIAR_PROBABILISTICO,
    limiarAlternativo: LIMIAR_ALTERNATIVO_MEDIDO,
    scoreMinimoEncenado: Math.min(...scores),
    scoreMaximoEncenado: Math.max(...scores),

    arestasEncenadas: encenados.length,
    registrosEncenados: registrosEncenados,
    ocorrenciasEncenadas: encenados.reduce((a, g) => a + g.ocorrenciasEnvolvidas, 0),
    eventosDepoisDaFusaoEncenada: encenados.length,

    filaTotal: chave.length + prob.length,

    gruposEncenadosNaFila: naFila.filter((g) => g.origem === "encenado").length,
    gruposDoAcervoNaFila: naFila.filter((g) => g.origem === "acervo").length,
    gruposCruzadosNaFila: naFila.filter((g) => g.origem === "cruzado").length,
  };
  return CACHE_NUMEROS;
}

// ---------------------------------------------------------------------------
// O par que o humano tem de SEPARAR — a prova viva de D-72
// ---------------------------------------------------------------------------

/**
 * O par que demonstra por que nenhuma fusão acontece sozinha (D-72), FIXADO EM CONSTANTE
 * pela mesma razão que `GRUPO_DO_TRACADOR`.
 *
 * A regra que o produziu: **entre os pares probabilísticos em que nenhum dos dois lados é
 * clone, aquele cujos dois títulos diferem apenas por um numeral de edição e cujos períodos
 * declarados são de anos distintos.** «10ª Bienal de São Paulo» (1969) contra «11ª Bienal
 * de São Paulo» (1971) pontua **0,667** — acima do limiar, e ainda assim são dois eventos
 * diferentes, separados por dois anos.
 *
 * ELE NÃO É RUÍDO A FILTRAR: ele é o argumento. Um deduplicador automático funde este par e
 * nunca fica sabendo que apagou uma Bienal inteira do acervo. O que separa os dois não é uma
 * medida de parecença melhor — é um humano olhando o período declarado. Por isso o par fica
 * na fila, com o score na cara, e por isso a tela pergunta em vez de decidir.
 */
export const PAR_QUE_O_HUMANO_SEPARA = "prob:evento:enc:123881+evento:enc:123882";

/** A frase que o par carrega na tela. Produto, não comentário. */
export const FRASE_DE_D72 =
  "Nenhuma fusão acontece sozinha, e este par é a razão. Os dois registros passam do " +
  "limiar — o casamento probabilístico os aproxima — e ainda assim são eventos diferentes, " +
  "de edições e anos distintos. Um deduplicador automático funde os dois e nunca fica " +
  "sabendo que apagou uma edição inteira do acervo. O que os separa não é uma medida de " +
  "parecença melhor: é uma pessoa olhando o período declarado. Por isso a decisão é humana " +
  "e fica registrada — a suspeita é do sistema, a conclusão não.";

export function parQueOHumanoSepara(): GrupoDeDuplicatas {
  const grupo = grupoPorId(PAR_QUE_O_HUMANO_SEPARA);
  if (!grupo) {
    romper(
      `o par de D-72 «${PAR_QUE_O_HUMANO_SEPARA}» não está mais na fila probabilística`,
    );
  }
  return grupo;
}

// ---------------------------------------------------------------------------
// O que o acervo NÃO sustenta — declaração honesta, e é PRODUTO
// ---------------------------------------------------------------------------

/**
 * A frase que a tela mostra (D-68).
 *
 * O critério da ontologia tem três componentes e o acervo preenche UM. Nenhum dos 300
 * eventos traz agente realizador nem obra na chave de identidade: toda chave tem a forma
 * `evento|<título normalizado>||`, com os dois campos finais vazios. Isso não é defeito do
 * mock — é a fonte, e é exatamente por isso que existe um segundo estágio.
 *
 * ESCONDER ISSO SERIA O MESMO ERRO QUE A PROPOSTA ARGUMENTA CONTRA. A tela que declara o
 * limite do próprio dado é a que se pode auditar; a que não declara pede confiança — a
 * honestidade sobre o dado é o argumento, não a nota de rodapé sobre ele.
 */
export function declaracaoDoQueNaoSustenta(): string {
  const n = numerosDaDeduplicacao();
  return (
    `O critério tem três componentes e este acervo preenche ` +
    `um. Dos ${comSeparador(n.eventos)} eventos do acervo, ${n.eventosComAgenteNaChave} ` +
    `trazem agente realizador na chave de identidade e ${n.eventosComObraNaChave} trazem ` +
    `obra — toda chave tem a forma «evento|título normalizado||», com os dois campos finais ` +
    `vazios. O que de fato casou aqui foi o título normalizado, e só ele. Isso não é falha ` +
    `do protótipo: é a fonte, porque nenhum evento do CMS liga agente realizador nem obra ao ` +
    `registro. E é precisamente por isso que existe um segundo estágio — a chave é exata, e ` +
    `a fonte não é.`
  );
}
