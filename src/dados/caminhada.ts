/**
 * caminhada.ts — o motor do feed de Descobrir (D-26).
 *
 * O feed NÃO é lista ordenada por relevância: é o resultado de uma caminhada a partir do
 * repertório da persona. Popularidade não entra em lugar nenhum deste arquivo.
 *
 * DP-F: roda NO BUILD, em componente de servidor. Sob `output: "export"` o navegador
 * recebe só `Cartao[]`. Nenhum arquivo com `"use client"` pode importar este módulo.
 * DP-G / D-47: toda leitura do acervo passa por `grafo.ts`.
 *
 * AS QUATRO MEDIÇÕES QUE ESCREVERAM ESTE ARQUIVO. Sem elas, cada decisão abaixo pareceria
 * arbitrária — com elas, cada uma é a única saída:
 *
 * M-1  47.258 das 47.259 arestas `semelhante_a` ligam duas entidades da MESMA classe.
 *      Caminhada que só siga aresta com motivo escrito é monoclasse por construção.
 *      → por isso as arestas estruturais entram, e por isso `motivo.ts` tem dois modos.
 * M-3  em 3 saltos as três personas convergem para quase o mesmo conjunto (Maria 4.026 ·
 *      Carlos 4.035 · Joana 4.039), com distribuição de classe quase idêntica. O feed
 *      deixa de distinguir a Maria do Carlos — que é justamente o que D-45 promete à
 *      banca.  → saltos 1 e 2; salto 3 só como reserva de classe vazia (DP-C).
 * M-4  com desempate por `id.localeCompare`, «Ademar Manarini» foi o primeiro cartão de
 *      pessoa das TRÊS personas.  → desempate por hash semeado pela persona (DP-D).
 *      Ordem alfabética de id não é desempate aceitável em lugar nenhum deste arquivo.
 * M-6  62% dos candidatos têm imagem local (2.835 de 4.606). Eram 22% quando este arquivo
 *      foi escrito, com 900 imagens baixadas; hoje são 2.382.  → ter imagem continua sendo
 *      critério de desempate, nunca de elegibilidade: exigir imagem ainda cortaria 38% do
 *      acervo, e a razão da regra nunca foi o tamanho do corte (ver `ordenarBalde`).
 */

import type {
  AvisoFeed,
  Cartao,
  DiagnosticoFeed,
  MotivoCartao,
  PassoCartao,
  ResultadoFeed,
} from "./cartao";
import {
  disposicoesPorIds,
  PESO_NUNCA_VI,
  PESO_SURPRESA,
  type ContextoPredicado,
  type Disposicao,
} from "./disposicoes";
import { GRAU_HUB, ocorrenciasDe, porId, porSlug, slugsPorTipo, vizinhos } from "./grafo";
import { capaDe } from "./imagem";
import { motivoDaAresta } from "./motivo";
import { personaPorId, type Persona } from "./personas";
import type { Aresta, ClasseEntidade, Entidade } from "./tipos";

// ---------------------------------------------------------------------------
// Classes e rotação
// ---------------------------------------------------------------------------

/**
 * O que vira cartão. Fora desta lista as classes são ESTRUTURAIS: `ocorrencia` e
 * `temporada` são níveis de DADO-02 e aparecem dentro da página do evento, não soltas no
 * feed; `linguagem`, `tema` e `territorio` são classificação; `repertorio` e
 * `pessoa-usuaria` são a própria pessoa. Todas continuam sendo ATRAVESSADAS — é por
 * dentro delas que a heterogeneidade aparece (M-2) — só não viram cartão.
 */
export const CLASSES_CARTAVEIS: readonly ClasseEntidade[] = [
  "evento",
  "conteudo",
  "pessoa",
  "obra",
  "termo",
  "midia",
  "coletivo",
  "instituicao",
  "trilha",
  "formacao",
  "publicacao",
  "espaco",
];

const CARTAVEL = new Set<ClasseEntidade>(CLASSES_CARTAVEIS);

/**
 * A caminhada ATRAVESSA estas entidades — aresta, busca e página seguem no
 * grafo — mas elas não viram cartão em Descobrir.
 *
 * «90-00: cuentos brasileños contemporâneos» é o caso que `motivo.ts` já
 * nomeou: no feed o título + «É de literatura» lê como banner gerado, não
 * como mediação. Sem imagem, sem tema, a pastilha de classe é o cartão
 * inteiro. Fica fora da rotação até o cartão ter o que mostrar além da tag.
 */
const FORA_DO_FEED = new Set<string>(["90-00-cuentos-brasilenos-contemporaneos"]);

function viraCartao(entidade: Entidade): boolean {
  return CARTAVEL.has(entidade.classe) && !FORA_DO_FEED.has(entidade.slug);
}

/**
 * DP-B — a rotação de classes do rodízio.
 *
 * Escolher sempre a classe com MAIS candidatos colapsa o feed em
 * `conteudo → midia → conteudo → midia` (medido): `conteudo` tem 1.805 entidades e
 * `midia` 529, e os dois baldes nunca esvaziam. A rotação é fixa e alterna os dois polos
 * do produto — acontecimento/agência (evento, pessoa, coletivo, instituição, formação,
 * espaço) e acervo/criação (conteúdo, obra, termo, mídia, trilha, publicação) — para o
 * feed nunca virar agenda nem virar catálogo.
 */
const ROTACAO: readonly ClasseEntidade[] = [
  "evento",
  "conteudo",
  "pessoa",
  "obra",
  "termo",
  "midia",
  "coletivo",
  "instituicao",
  "trilha",
  "formacao",
  "publicacao",
  "espaco",
];

/** Posição fixa e previsível do cartão de serendipidade (D-30). Nunca aleatória. */
export const POSICAO_SERENDIPIDADE = 5;

/** Posição fixa do destaque curado (D-29). Sobrepõe o rodízio, não é deslocado por ele. */
export const POSICAO_CURADO = 0;

/**
 * Teto de vizinhos lidos ao expandir um nó INTERMEDIÁRIO (T-02-03).
 *
 * As sementes nunca são capadas: é da semente de linguagem que sai toda a largura do
 * feed, e cortá-la em 200 mataria classes inteiras. Um nó intermediário com mais de 200
 * vizinhos já é concentrador por definição (GRAU_HUB = 60) e seus candidatos já entram
 * marcados como de segunda classe (DP-E) — ler os 3.000 seguintes não melhora o feed,
 * só faz o build demorar.
 */
const TETO_EXPANSAO = 200;

/** Quantos candidatos bastam para considerar uma classe em reserva já preenchida. */
const TETO_RESERVA = 12;

/** Quantos nós de 2 saltos varrer na busca de reserva antes de desistir (T-02-03). */
const TETO_VARREDURA_RESERVA = 2500;

// ---------------------------------------------------------------------------
// DP-D — o desempate semeado pela persona
// ---------------------------------------------------------------------------

/**
 * FNV-1a de 32 bits, dez linhas, sem dependência.
 *
 * É ele que faz o feed da Maria não começar pelo mesmo item que o do Carlos. Determinístico
 * (mesma persona, mesmo feed, sempre) e distinto entre personas, porque a semente é o id
 * da persona concatenado ao id da entidade.
 */
function hash32(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const semear = (personaId: string, id: string) => hash32(`${personaId}|${id}`);

// ---------------------------------------------------------------------------
// Sementes
// ---------------------------------------------------------------------------

/**
 * De onde a caminhada parte: as entidades que a persona já atravessou MAIS as entidades
 * de linguagem do repertório.
 *
 * As duas metades fazem trabalho diferente e as duas são necessárias. As entidades dão o
 * caminho fino — o termo do rap leva ao termo do slam por `semelhante_a`, com motivo
 * escrito pelo acervo. As linguagens dão a largura: `pertence_a` é a relação mais
 * frequente do grafo (13.000 arestas) e é dela que saem, num salto, conteúdo, evento,
 * pessoa, obra, mídia, coletivo, instituição, publicação, formação e trilha. Sem a
 * semente de linguagem o feed de qualquer persona seria monoclasse (M-1).
 */
export function sementesDaPersona(
  linguagens: readonly string[],
  entidades: readonly string[],
): Entidade[] {
  const saida = new Map<string, Entidade>();
  for (const id of entidades) {
    const e = porId(id);
    if (e) saida.set(e.id, e);
  }
  for (const slug of linguagens) {
    // A linguagem do repertório vem como id de vocabulário (`"musica"`), e a entidade de
    // linguagem no grafo tem esse mesmo valor como slug.
    const e = porSlug("linguagem", slug);
    if (e) saida.set(e.id, e);
  }
  return [...saida.values()];
}

// ---------------------------------------------------------------------------
// Candidato e expansão
// ---------------------------------------------------------------------------

export interface Candidato {
  entidade: Entidade;
  /** 1, 2 ou 3. O 3 é reserva de classe vazia (DP-C). */
  saltos: number;
  viaConcentrador: boolean;
  motivo: MotivoCartao;
  caminho: PassoCartao[];
}

/** Um salto resolvido: a frase e o registro do passo, os dois vindos da mesma aresta. */
export function resolverSalto(
  de: Entidade,
  para: Entidade,
  aresta: Aresta,
): { motivo: MotivoCartao; passo: PassoCartao } {
  // A orientação da FRASE é a da aresta, não a da travessia (ver motivo.ts). `atua_em` é
  // dirigida: dizer "o evento atua na pessoa" porque a travessia veio do outro lado
  // seria falso sobre uma pessoa real.
  const ladoDe = porId(aresta.de) ?? de;
  const ladoPara = porId(aresta.para) ?? para;
  const motivo = motivoDaAresta(aresta, ladoDe, ladoPara);
  const passo: PassoCartao = {
    deId: de.id,
    deTitulo: de.titulo,
    deClasse: de.classe,
    paraId: para.id,
    paraTitulo: para.titulo,
    paraClasse: para.classe,
    relacao: aresta.relacao,
    motivoTexto: motivo.texto,
    origemMotivo: motivo.origemMotivo,
  };
  if (aresta.papel) passo.papel = aresta.papel;
  return { motivo, passo };
}

interface No {
  entidade: Entidade;
  saltos: number;
  viaConcentrador: boolean;
  motivo: MotivoCartao;
  caminho: PassoCartao[];
}

export interface Expansao {
  sementes: Entidade[];
  repertorio: Set<string>;
  /** TODO id tocado pela caminhada, cartável ou estrutural. Base da serendipidade. */
  visitados: Set<string>;
  /** Só os cartáveis, de 1 e 2 saltos. */
  candidatos: Candidato[];
  /** Cartáveis de 3 saltos, achados na reserva. */
  reserva: Candidato[];
  /** Classes da rotação que ficaram sem nenhum candidato de 1 ou 2 saltos. */
  classesEmReserva: ClasseEntidade[];
}

/** A expansão é pura e cara. Uma vez por persona basta — o build chama várias vezes. */
const CACHE_EXPANSAO = new Map<string, Expansao>();

/**
 * DP-C — saltos 1 e 2, e o 3 só para preencher classe vazia.
 *
 * O que M-3 mediu é o motivo de o teto ser 2: em 3 saltos as três personas chegam a
 * ~4.030 candidatos com distribuição de classe quase idêntica. Alcance maior não é feed
 * melhor; é feed indistinguível.
 */
export function expandir(persona: Persona): Expansao {
  const cacheado = CACHE_EXPANSAO.get(persona.id);
  if (cacheado) return cacheado;

  const sementes = sementesDaPersona(
    persona.repertorio.linguagens,
    persona.repertorio.entidades,
  );
  const repertorio = new Set(sementes.map((e) => e.id));
  const visitados = new Set<string>(repertorio);
  const candidatos: Candidato[] = [];

  let fronteira: No[] = sementes.map((entidade) => ({
    entidade,
    saltos: 0,
    viaConcentrador: false,
    motivo: { texto: "", origemMotivo: "composto", relacao: null, procedenciaAresta: null },
    caminho: [],
  }));

  for (let salto = 1; salto <= 2; salto++) {
    const proxima: No[] = [];
    for (const no of fronteira) {
      const adjacencia = vizinhos(no.entidade.id);
      // DP-E: quem é o salto INTERMEDIÁRIO. A semente não conta — a pessoa já esteve lá.
      const intermediarioEhHub = no.saltos >= 1 && adjacencia.length > GRAU_HUB;
      const viaConcentrador = no.viaConcentrador || intermediarioEhHub;
      const teto = no.saltos === 0 ? adjacencia.length : Math.min(adjacencia.length, TETO_EXPANSAO);

      for (let i = 0; i < teto; i++) {
        const { aresta, entidade } = adjacencia[i];
        if (visitados.has(entidade.id)) continue;
        visitados.add(entidade.id);
        const { motivo, passo } = resolverSalto(no.entidade, entidade, aresta);
        const proximo: No = {
          entidade,
          saltos: salto,
          viaConcentrador,
          motivo,
          caminho: [...no.caminho, passo],
        };
        proxima.push(proximo);
        if (viraCartao(entidade)) candidatos.push(proximo);
      }
    }
    fronteira = proxima;
  }

  // --- Reserva de salto 3 (DP-C). Só para classe da rotação que ficou vazia. ---
  const porClasse = new Set(candidatos.map((c) => c.entidade.classe));
  const classesEmReserva = ROTACAO.filter((c) => !porClasse.has(c));
  const reserva: Candidato[] = [];

  if (classesEmReserva.length) {
    const alvo = new Set(classesEmReserva);
    const contagem = new Map<ClasseEntidade, number>(classesEmReserva.map((c) => [c, 0]));
    let varridos = 0;
    for (const no of fronteira) {
      if (varridos++ > TETO_VARREDURA_RESERVA) break;
      if (![...contagem.values()].some((n) => n < TETO_RESERVA)) break;
      const adjacencia = vizinhos(no.entidade.id);
      const viaConcentrador =
        no.viaConcentrador || (no.saltos >= 1 && adjacencia.length > GRAU_HUB);
      const teto = Math.min(adjacencia.length, TETO_EXPANSAO);
      for (let i = 0; i < teto; i++) {
        const { aresta, entidade } = adjacencia[i];
        if (!alvo.has(entidade.classe)) continue;
        if (FORA_DO_FEED.has(entidade.slug)) continue;
        if (visitados.has(entidade.id)) continue;
        if ((contagem.get(entidade.classe) ?? 0) >= TETO_RESERVA) continue;
        visitados.add(entidade.id);
        contagem.set(entidade.classe, (contagem.get(entidade.classe) ?? 0) + 1);
        const { motivo, passo } = resolverSalto(no.entidade, entidade, aresta);
        reserva.push({
          entidade,
          saltos: 3,
          viaConcentrador,
          motivo,
          caminho: [...no.caminho, passo],
        });
      }
    }
  }

  const expansao: Expansao = {
    sementes,
    repertorio,
    visitados,
    candidatos,
    reserva,
    classesEmReserva,
  };
  CACHE_EXPANSAO.set(persona.id, expansao);
  return expansao;
}

/** Todo id que a caminhada tocou. A serendipidade é escolhida FORA deste conjunto (D-30). */
export function alcancadosDaPersona(personaId: string): Set<string> {
  const persona = personaPorId(personaId);
  if (!persona) return new Set();
  return expandir(persona).visitados;
}

// ---------------------------------------------------------------------------
// Disposições (D-31)
// ---------------------------------------------------------------------------

const CONTEXTO_PREDICADO: ContextoPredicado = { ocorrenciasDe };

interface Filtragem {
  permitido: (entidade: Entidade) => boolean;
  avisos: AvisoFeed[];
  aplicadas: string[];
  surpresa: boolean;
}

/**
 * As de CORTE filtram o conjunto de candidatos antes do rodízio. As de PESO mexem na
 * ordenação — com a exceção de «quero conhecer algo que nunca vi», que D-31 define como o
 * inverso do repertório e que portanto exclui.
 *
 * A regra que impede o filtro de mentir: corte cujo predicado devolve `indeterminado`
 * para TODOS os candidatos não corta nada, e o motor devolve um aviso legível dizendo que
 * o acervo não declara aquele campo. A tela mostra o aviso. Cortar em cima de campo
 * inexistente esvaziaria o feed e faria parecer que o filtro funcionou.
 */
function montarFiltro(
  ids: readonly string[],
  persona: Persona,
  candidatos: readonly Candidato[],
): Filtragem {
  const disposicoes = disposicoesPorIds(ids);
  const avisos: AvisoFeed[] = [];
  const aplicadas: string[] = [];
  const cortesAtivos: Disposicao[] = [];

  for (const d of disposicoes) {
    aplicadas.push(d.id);
    if (d.tipo !== "corte" || !d.predicado) continue;
    const decisivo = candidatos.some(
      (c) => d.predicado!(c.entidade, CONTEXTO_PREDICADO) !== "indeterminado",
    );
    if (decisivo) {
      cortesAtivos.push(d);
    } else if (d.ausencia) {
      avisos.push({ origem: d.id, texto: d.ausencia });
    }
  }

  const nuncaVi = disposicoes.some((d) => d.id === PESO_NUNCA_VI);
  const doRepertorio = new Set(persona.repertorio.linguagens);

  const permitido = (entidade: Entidade): boolean => {
    if (nuncaVi && entidade.linguagens.some((l) => doRepertorio.has(l))) return false;
    for (const d of cortesAtivos) {
      if (d.predicado!(entidade, CONTEXTO_PREDICADO) === "corta") return false;
    }
    return true;
  };

  return {
    permitido,
    avisos,
    aplicadas,
    surpresa: disposicoes.some((d) => d.id === PESO_SURPRESA),
  };
}

// ---------------------------------------------------------------------------
// Ordenação dentro do balde (DP-D, DP-E)
// ---------------------------------------------------------------------------

function ordenarBalde(
  lista: Candidato[],
  personaId: string,
  surpresa: boolean,
): Candidato[] {
  return [...lista].sort((a, b) => {
    // «quero ser surpreendida» inverte a distância: o que está a 2 saltos vem antes.
    const sa = surpresa ? -a.saltos : a.saltos;
    const sb = surpresa ? -b.saltos : b.saltos;
    if (sa !== sb) return sa - sb;
    if (a.viaConcentrador !== b.viaConcentrador) return a.viaConcentrador ? 1 : -1;
    const ea = a.motivo.origemMotivo === "escrito" ? 0 : 1;
    const eb = b.motivo.origemMotivo === "escrito" ? 0 : 1;
    if (ea !== eb) return ea - eb;
    // O hash semeado pela persona. NUNCA `localeCompare` (M-4).
    const ha = semear(personaId, a.entidade.id);
    const hb = semear(personaId, b.entidade.id);
    if (ha !== hb) return ha - hb;
    // TER IMAGEM FOI REBAIXADO PARA ÚLTIMO CRITÉRIO (decisão do plano 02-02).
    //
    // O plano 02-01 travou «com imagem local antes de sem imagem» ACIMA do hash, e o
    // executor do 02-01 mediu a consequência e a registrou como pendência: o feed base da
    // Maria saía 11 de 12 COM imagem, num acervo em que 22% dos candidatos tinham imagem.
    // O critério foi escrito como desempate, mas os baldes têm centenas de candidatos
    // empatados em salto, concentrador e origem do motivo — e um desempate que decide
    // centenas de empates não é desempate, é seleção.
    //
    // O que ele selecionava: a parte do acervo que o Itaú Cultural digitalizou COM foto.
    // Ou seja, um filtro de beleza por cima de um ranqueamento que este arquivo inteiro faz
    // questão de manter honesto — e, de quebra, ele apagava do feed a capa sem imagem, que
    // foi desenhada para ser a textura visual dominante e aparecia uma vez em doze.
    //
    // A ESCASSEZ ACABOU E A DECISÃO NÃO MUDA. Com 2.382 imagens no lugar de 900, a cobertura
    // dos candidatos foi de 22% para 62% (M-6) e a das mídias de 443 para 518 de 529. Nada
    // disso é argumento para promover a regra de volta: ela não estava aqui embaixo porque
    // faltava foto, estava porque ordenar por «tem foto» é ordenar pelo que o acervo
    // fotografou, e o que o acervo fotografou não é o que a pessoa quer ver. Promovê-la
    // agora só tornaria o viés maior, porque agora ela teria mais empates para decidir.
    //
    // Abaixo do hash ele praticamente nunca dispara (só em colisão de FNV-1a), e continua
    // ali para que a ordem permaneça total e determinística.
    const ia = a.entidade.imagem ? 0 : 1;
    const ib = b.entidade.imagem ? 0 : 1;
    return ia - ib;
  });
}

// ---------------------------------------------------------------------------
// Serendipidade (D-30) e destaque curado (D-29)
// ---------------------------------------------------------------------------

const MOTIVO_SERENDIPIDADE = (titulo: string): MotivoCartao => ({
  texto:
    `Fora do seu repertório, de propósito. Nenhuma ligação do acervo liga «${titulo}» ao que ` +
    `você já atravessou — este cartão não veio da caminhada, veio de um sorteio determinístico ` +
    `entre o que ela NÃO alcançou.`,
  // Não houve aresta. Carimbar isto de «composto» afirmaria uma relação que não existe.
  origemMotivo: "sem-aresta",
  relacao: null,
  procedenciaAresta: "autorado",
});

function escolherSerendipidade(
  personaId: string,
  expansao: Expansao,
  permitido: (e: Entidade) => boolean,
): Candidato | null {
  const inicio = hash32(`${personaId}|serendipidade`) % ROTACAO.length;
  for (let k = 0; k < ROTACAO.length; k++) {
    const classe = ROTACAO[(inicio + k) % ROTACAO.length];
    let melhor: Entidade | null = null;
    let melhorChave = Number.POSITIVE_INFINITY;
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      if (!e) continue;
      if (FORA_DO_FEED.has(e.slug)) continue;
      if (expansao.visitados.has(e.id)) continue;
      if (!permitido(e)) continue;
      const chave = semear(personaId, e.id);
      if (chave < melhorChave) {
        melhorChave = chave;
        melhor = e;
      }
    }
    if (melhor) {
      return {
        entidade: melhor,
        // Zero saltos porque não houve travessia. É o que a asserção 7 verifica.
        saltos: 0,
        viaConcentrador: false,
        motivo: MOTIVO_SERENDIPIDADE(melhor.titulo),
        caminho: [],
      };
    }
  }
  return null;
}

/*
 * D-29 / D-35 · A NOTA DE CURADORIA SAIU DAQUI EM 2026-08-25, e saiu do dado, não só da
 * tela. A frase que declarava a procedência da trilha curada («Curadoria humana, escrita
 * pela curadoria…») é informação de bastidor: quem a produz e quem a lê é a Redação, que
 * assina a trilha e declara a procedência passo a passo (`redacao-trilha.tsx`). Deixá-la
 * no DTO faria o texto descer no payload de todo feed do app sem ninguém para renderizá-lo
 * — dado morto atravessando a fronteira RSC, que é justamente o que DP-F existe para
 * impedir. O que continua provando a procedência do cartão é o selo de motivo, com
 * `data-origem-motivo`, esse sim medido a cada aresta.
 */

// ---------------------------------------------------------------------------
// Rodízio (DP-B, D-27)
// ---------------------------------------------------------------------------

/**
 * Percorre a rotação tirando um candidato do balde de cada classe. Balde vazio é pulado,
 * e o pulo nunca pode resultar em duas classes iguais coladas: se a única opção repetir a
 * classe do vizinho, tenta antes o próximo balde não vazio. Só repete se de fato não
 * houver alternativa, que é a ressalva literal de D-27.
 */
function rodiziar(
  baldes: Map<ClasseEntidade, Candidato[]>,
  slots: (Candidato | null)[],
  inicio: number,
): void {
  let cursor = inicio;

  const escolher = (proibidas: Set<ClasseEntidade>): Candidato | null => {
    for (let k = 0; k < ROTACAO.length; k++) {
      const idx = (cursor + k) % ROTACAO.length;
      const classe = ROTACAO[idx];
      if (proibidas.has(classe)) continue;
      const balde = baldes.get(classe);
      if (!balde?.length) continue;
      cursor = idx + 1;
      return balde.shift() as Candidato;
    }
    return null;
  };

  for (let i = 0; i < slots.length; i++) {
    if (slots[i]) continue;
    const anterior = i > 0 ? slots[i - 1]?.entidade.classe : undefined;
    const seguinte = i + 1 < slots.length ? slots[i + 1]?.entidade.classe : undefined;
    const proibidas = new Set<ClasseEntidade>();
    if (anterior) proibidas.add(anterior);
    if (seguinte) proibidas.add(seguinte);

    // Ordem de relaxamento: primeiro tenta respeitar os dois vizinhos; depois só o
    // anterior; e só então repete — "quando houver alternativa" (D-27).
    const escolhido =
      escolher(proibidas) ??
      escolher(anterior ? new Set([anterior]) : new Set()) ??
      escolher(new Set());
    if (!escolhido) break;
    slots[i] = escolhido;
  }
}

// ---------------------------------------------------------------------------
// montarFeed
// ---------------------------------------------------------------------------

export interface OpcoesFeed {
  personaId: string;
  disposicoes?: readonly string[];
  limite?: number;
}

export function montarFeed({
  personaId,
  disposicoes = [],
  limite = 12,
}: OpcoesFeed): ResultadoFeed {
  const persona = personaPorId(personaId);
  if (!persona) {
    return { cartoes: [], avisos: [], diagnostico: diagnosticoVazio(personaId) };
  }

  const expansao = expandir(persona);
  const filtro = montarFiltro(disposicoes, persona, expansao.candidatos);

  const elegiveis = expansao.candidatos.filter((c) => filtro.permitido(c.entidade));
  const cortados = expansao.candidatos.length - elegiveis.length;

  // --- baldes por classe, cada um já ordenado por DP-D/DP-E ---
  const baldes = new Map<ClasseEntidade, Candidato[]>();
  for (const classe of ROTACAO) baldes.set(classe, []);
  for (const c of elegiveis) baldes.get(c.entidade.classe)?.push(c);
  // A reserva de 3 saltos entra DEPOIS de tudo que tem 1 ou 2, e só nas classes vazias.
  for (const c of expansao.reserva) {
    if (!filtro.permitido(c.entidade)) continue;
    baldes.get(c.entidade.classe)?.push(c);
  }
  for (const [classe, lista] of baldes) {
    baldes.set(classe, ordenarBalde(lista, persona.id, filtro.surpresa));
  }

  const usados = new Set<string>();
  const slots: (Candidato | null)[] = new Array(Math.max(0, limite)).fill(null);

  // --- D-29: o destaque curado sobrepõe o rodízio, em posição fixa ---
  const balideTrilha = baldes.get("trilha") ?? [];
  const curado = balideTrilha.length && limite > POSICAO_CURADO ? balideTrilha.shift()! : null;
  if (curado) {
    slots[POSICAO_CURADO] = curado;
    usados.add(curado.entidade.id);
  }

  // --- D-30: um cartão fora do alcance da caminhada, em posição fixa ---
  const serendipidade =
    limite > POSICAO_SERENDIPIDADE
      ? escolherSerendipidade(persona.id, expansao, filtro.permitido)
      : null;
  if (serendipidade) {
    slots[POSICAO_SERENDIPIDADE] = serendipidade;
    usados.add(serendipidade.entidade.id);
  }

  // --- DP-B: o resto do feed sai do rodízio ---
  for (const [classe, lista] of baldes) {
    baldes.set(
      classe,
      lista.filter((c) => !usados.has(c.entidade.id)),
    );
  }
  // Com «quero ser surpreendida» a rotação começa pela classe mais rara do feed, e não
  // por `evento` — é a metade "classe rara" do peso que D-31 pede.
  const inicio = filtro.surpresa ? indiceDaClasseMaisRara(baldes) : 0;
  rodiziar(baldes, slots, inicio);

  const escolhidos = slots.filter((s): s is Candidato => Boolean(s));
  const cartoes = escolhidos.map((c) =>
    paraCartao(c, c === curado ? "curado" : c === serendipidade ? "serendipidade" : undefined),
  );

  return {
    cartoes,
    avisos: filtro.avisos,
    diagnostico: {
      personaId,
      sementes: expansao.sementes.length,
      candidatosPorSalto: contarPor(
        [...expansao.candidatos, ...expansao.reserva],
        (c) => String(c.saltos),
      ),
      // Conta só 1 e 2 saltos, de propósito: é este número que prova que uma classe em
      // reserva estava mesmo vazia antes do salto 3 (asserção 9).
      candidatosPorClasse: contarPor(expansao.candidatos, (c) => c.entidade.classe),
      classesCobertas: [...new Set(cartoes.map((c) => c.classe))],
      classesEmReserva: [...expansao.classesEmReserva],
      motivosEscritos: cartoes.filter((c) => c.motivo.origemMotivo === "escrito").length,
      motivosCompostos: cartoes.filter((c) => c.motivo.origemMotivo === "composto").length,
      motivosSemAresta: cartoes.filter((c) => c.motivo.origemMotivo === "sem-aresta").length,
      cartoesViaConcentrador: cartoes.filter((c) => c.viaConcentrador).length,
      disposicoesAplicadas: filtro.aplicadas,
      cortadosPorDisposicao: cortados,
    },
  };
}

function indiceDaClasseMaisRara(baldes: Map<ClasseEntidade, Candidato[]>): number {
  let melhor = 0;
  let menor = Number.POSITIVE_INFINITY;
  ROTACAO.forEach((classe, i) => {
    const n = baldes.get(classe)?.length ?? 0;
    if (n > 0 && n < menor) {
      menor = n;
      melhor = i;
    }
  });
  return melhor;
}

function contarPor<T>(lista: readonly T[], chave: (item: T) => string): Record<string, number> {
  const saida: Record<string, number> = {};
  for (const item of lista) {
    const k = chave(item);
    saida[k] = (saida[k] ?? 0) + 1;
  }
  return saida;
}

/** Foto da entidade; se ela não tem, a do caminho da caminhada ou a reserva da classe. */
function imagemDoCandidato(candidato: Candidato): {
  imagem?: string;
  creditoImagem?: string;
} {
  const herdada = capaDe(candidato.entidade);
  if (herdada.imagem) return herdada;
  for (const passo of candidato.caminho) {
    for (const id of [passo.deId, passo.paraId]) {
      if (id === candidato.entidade.id) continue;
      const vizinha = porId(id);
      if (!vizinha) continue;
      const foto = capaDe(vizinha);
      if (foto.imagem) return foto;
    }
  }
  return {};
}

/** Candidato → DTO. É aqui que a `Entidade` para e o serializável começa (DP-F). */
export function paraCartao(candidato: Candidato, especial?: Cartao["especial"]): Cartao {
  const { entidade } = candidato;
  const foto = imagemDoCandidato(candidato);
  const cartao: Cartao = {
    id: entidade.id,
    classe: entidade.classe,
    titulo: entidade.titulo,
    slug: entidade.slug,
    linguagens: entidade.linguagens,
    procedencia: entidade.procedencia,
    motivo: candidato.motivo,
    saltos: candidato.saltos,
    viaConcentrador: candidato.viaConcentrador,
    caminho: candidato.caminho,
  };
  const resumo = entidade.resumo?.trim();
  if (resumo) cartao.resumo = resumo;
  if (foto.imagem) cartao.imagem = foto.imagem;
  if (foto.creditoImagem) cartao.creditoImagem = foto.creditoImagem;
  if (especial) cartao.especial = especial;
  return cartao;
}

function diagnosticoVazio(personaId: string): DiagnosticoFeed {
  return {
    personaId,
    sementes: 0,
    candidatosPorSalto: {},
    candidatosPorClasse: {},
    classesCobertas: [],
    classesEmReserva: [],
    motivosEscritos: 0,
    motivosCompostos: 0,
    motivosSemAresta: 0,
    cartoesViaConcentrador: 0,
    disposicoesAplicadas: [],
    cortadosPorDisposicao: 0,
  };
}

/** Reexportado para quem já depende de `caminhada.ts` não reabrir `grafo.ts`. */
export { ocorrenciasDe };
