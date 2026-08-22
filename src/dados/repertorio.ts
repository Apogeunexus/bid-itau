/**
 * repertorio.ts — o atravessado e o adjacente a UM salto (D-44).
 *
 * Esta é a tela de onde sai o indicador de ampliação de repertório, que é a métrica de
 * impacto cultural que o RFP pede. Por isso o número não pode ser escrito à mão em lugar
 * nenhum: `adjacente` é travessia no grafo, `linguagensNovas` é diferença de conjuntos
 * sobre essa travessia, e as duas coisas são recalculadas no build a cada geração.
 *
 * UM SALTO, E NÃO A CAMINHADA DE DOIS DO FEED. `caminhada.ts` responde "o que te
 * interessaria ver agora" e por isso vai a 2 saltos com rodízio de classe. Aqui a
 * pergunta é outra — "o que está encostado no que você já atravessou" — e a promessa do
 * critério 5 do ROADMAP é literal: adjacente a um passo, nunca a dez. Reusar a expansão
 * de 2 saltos aqui responderia a pergunta errada com o número certo, que é a pior
 * combinação.
 *
 * O QUE CONTA COMO ATRAVESSADO, e é decisão registrada: a união entre as linguagens que
 * o repertório DECLARA e as linguagens que as entidades atravessadas declaram. Contar só
 * as declaradas diria que a Maria nunca atravessou artes visuais, quando 4 das 10
 * entidades do repertório dela declaram artes visuais; contar só as das entidades
 * apagaria «cultura popular» e «teatro» do Carlos, que o repertório dele declara e
 * nenhuma entidade carrega. As duas metades são evidência de travessia e as duas entram —
 * e cada grupo diz na tela de qual das duas ele veio.
 *
 * DP-F: roda NO BUILD. Nenhum arquivo `"use client"` importa este módulo.
 * D-47: toda leitura do acervo passa por `grafo.ts`.
 */

import { CLASSES_CARTAVEIS, paraCartao, resolverSalto, type Candidato } from "./caminhada";
import type { Cartao } from "./cartao";
import { ocorrenciasDe, porId, porSlug, slugsPorTipo } from "./grafo";
import { vizinhos } from "./grafo";
import { PERSONAS, personaPorId } from "./personas";
import type { ClasseEntidade, Entidade } from "./tipos";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/**
 * Teto de itens adjacentes por linguagem. O plano pede entre 8 e 12; 10 mantém a lista
 * navegável no telefone sem que nenhuma linguagem alcançada suma da contagem — o teto é
 * POR LINGUAGEM justamente para `linguagensNovas` continuar completo. Um teto global
 * cortaria linguagens inteiras e faria a métrica de ampliação depender do tamanho da
 * lista, que é o oposto do que ela mede.
 */
const TETO_POR_LINGUAGEM = 10;

const CARTAVEL = new Set<ClasseEntidade>(CLASSES_CARTAVEIS);

/** Bucket de quem não declara linguagem nenhuma. Nomeado, não silencioso. */
const SEM_LINGUAGEM = "(sem linguagem declarada)";

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
// DP-D — o mesmo desempate semeado pela persona que `caminhada.ts` usa
// ---------------------------------------------------------------------------

/**
 * FNV-1a de 32 bits. É a MESMA função de `caminhada.ts`, reescrita aqui e não importada
 * porque lá ela é interna e `caminhada.ts` não é arquivo deste plano — dois executores
 * correm em paralelo sobre a fase e mexer no arquivo do outro é o jeito garantido de
 * perder trabalho. A duplicação é de dez linhas e está declarada; se um dia `caminhada.ts`
 * exportar `semear`, esta cópia sai.
 *
 * O que ela garante: Meu Repertório e Descobrir desempatam igual, então as duas telas não
 * mostram ordens que se contradizem para a mesma persona. E nunca `localeCompare` (M-4).
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
// DTO
// ---------------------------------------------------------------------------

export interface ItemAtravessado {
  id: string;
  classe: ClasseEntidade;
  titulo: string;
  slug: string;
  rota: string | null;
}

export interface GrupoAtravessado {
  /** Id do vocabulário controlado. A tela resolve rótulo e cor por `selo-linguagem`. */
  linguagemId: string;
  /** Quantas entidades do repertório declaram esta linguagem. É o peso visual (tela 21). */
  peso: number;
  /** 0 a 1, contra o maior grupo. Evita a tela recalcular o máximo. */
  pesoRelativo: number;
  /** `true` quando o próprio repertório declara a linguagem, e não só as entidades. */
  declaradaNoRepertorio: boolean;
  entidades: ItemAtravessado[];
}

export interface SalvoResolvido {
  ocorrenciaId: string;
  eventoId: string;
  eventoTitulo: string;
  rota: string | null;
  dataCurta: string;
  hora: string;
  gratuito: boolean;
  /** `null` DECLARADO: nenhuma das 2.425 ocorrências do grafo tem espaço. */
  espacoDeclarado: string | null;
}

export interface DiagnosticoRepertorio {
  entidadesNoRepertorio: number;
  entidadesNaoResolvidas: number;
  /** Vizinhos a 1 salto antes do teto por linguagem. */
  adjacentesBrutos: number;
  adjacentesExibidos: number;
  linguagensAtravessadas: number;
  linguagensNoAdjacente: number;
}

export interface RepertorioDaPersona {
  personaId: string;
  nome: string;
  /** Ids de linguagem que o repertório declara. */
  linguagensDeclaradas: string[];
  /** A união medida: declaradas + as que as entidades atravessadas declaram. */
  linguagensAtravessadas: string[];
  atravessado: GrupoAtravessado[];
  /** Exatamente um salto, sem nada que já esteja no repertório. */
  adjacente: Cartao[];
  /** Presentes no adjacente e ausentes do atravessado. A métrica de ampliação. */
  linguagensNovas: string[];
  salvos: SalvoResolvido[];
  diagnostico: DiagnosticoRepertorio;
}

// ---------------------------------------------------------------------------
// Índice de ocorrências salváveis
// ---------------------------------------------------------------------------

/**
 * Ocorrência → evento, para o cliente resolver o que foi salvo NESTA SESSÃO.
 *
 * A sessão guarda ids de ocorrência (D-42, `sessao.tsx`), e o navegador não tem o grafo:
 * sem este índice, Meu Repertório mostraria "4 salvos" sem conseguir nomear nenhum. O
 * índice é montado por `grafo.ts` (D-47), não lendo `ocorrencias.json` direto, e é
 * compacto de propósito — 129 eventos numa tabela e a data fatiada em 16 caracteres, o
 * que dá ~127 KB no HTML exportado contra ~522 KB de um índice ingênuo.
 */
export interface IndiceSalvaveis {
  /** `[slug, titulo]` por evento. O índice de ocorrência aponta para a posição aqui. */
  eventos: Array<[string, string]>;
  /**
   * Prefixo comum removido das chaves. As 2.425 ocorrências do grafo começam todas por
   * `"ocorrencia:derivado:"`, e repetir 20 caracteres 2.425 vezes custa 48 KB no HTML
   * exportado. O prefixo viaja uma vez e `chaveDeOcorrencia` o remove dos dois lados.
   */
  prefixo: string;
  /** `chave → [posiçãoDoEvento, "YYYY-MM-DDTHH:mm", gratuito?1:0]`. */
  ocorrencias: Record<string, [number, string, 0 | 1]>;
}

const PREFIXO_OCORRENCIA = "ocorrencia:derivado:";

/**
 * A chave de uma ocorrência dentro do índice. Exportada porque servidor e cliente
 * PRECISAM usar a mesma — duas implementações da mesma regra de chave é o jeito
 * clássico de a busca falhar em silêncio e o salvo sumir da tela.
 *
 * Id que não casa com o prefixo entra inteiro, em vez de ser fatiado errado.
 */
export function chaveDeOcorrencia(id: string, prefixo: string): string {
  return prefixo && id.startsWith(prefixo) ? id.slice(prefixo.length) : id;
}

let CACHE_INDICE: IndiceSalvaveis | null = null;

export function indiceDeSalvaveis(): IndiceSalvaveis {
  if (CACHE_INDICE) return CACHE_INDICE;

  const eventos: Array<[string, string]> = [];
  const ocorrencias: Record<string, [number, string, 0 | 1]> = {};

  for (const slug of slugsPorTipo("evento")) {
    const evento = porSlug("evento", slug);
    if (!evento) continue;
    const lista = ocorrenciasDe(evento.id);
    if (!lista.length) continue;
    const posicao = eventos.length;
    eventos.push([evento.slug, evento.titulo]);
    for (const o of lista) {
      ocorrencias[chaveDeOcorrencia(o.id, PREFIXO_OCORRENCIA)] = [
        posicao,
        o.inicio.slice(0, 16),
        o.gratuito ? 1 : 0,
      ];
    }
  }

  CACHE_INDICE = { eventos, prefixo: PREFIXO_OCORRENCIA, ocorrencias };
  return CACHE_INDICE;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rotaDe(entidade: Entidade): string | null {
  const base = ROTA_POR_CLASSE[entidade.classe];
  return base ? `${base}/${entidade.slug}/` : null;
}

function paraItem(entidade: Entidade): ItemAtravessado {
  return {
    id: entidade.id,
    classe: entidade.classe,
    titulo: entidade.titulo,
    slug: entidade.slug,
    rota: rotaDe(entidade),
  };
}

/** "2026-05-21" → "21.05.2026". Fatiar a ISO, nunca `new Date` — o build tem fuso. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : iso;
}

// ---------------------------------------------------------------------------
// O atravessado
// ---------------------------------------------------------------------------

function montarAtravessado(
  entidades: Entidade[],
  linguagensDeclaradas: readonly string[],
): GrupoAtravessado[] {
  const declaradas = new Set(linguagensDeclaradas);
  const grupos = new Map<string, ItemAtravessado[]>();

  // Toda linguagem que o repertório declara começa como grupo, mesmo sem entidade —
  // sumir com ela faria a tela dizer que o Carlos nunca atravessou teatro, quando o
  // repertório dele declara teatro. Peso zero é informação; grupo ausente é omissão.
  for (const id of declaradas) grupos.set(id, []);

  for (const entidade of entidades) {
    if (!entidade.linguagens.length) {
      const lista = grupos.get(SEM_LINGUAGEM) ?? [];
      lista.push(paraItem(entidade));
      grupos.set(SEM_LINGUAGEM, lista);
      continue;
    }
    for (const linguagem of entidade.linguagens) {
      const lista = grupos.get(linguagem) ?? [];
      lista.push(paraItem(entidade));
      grupos.set(linguagem, lista);
    }
  }

  const maior = Math.max(1, ...[...grupos.values()].map((l) => l.length));

  return [...grupos.entries()]
    .map(([linguagemId, lista]) => ({
      linguagemId,
      peso: lista.length,
      pesoRelativo: lista.length / maior,
      declaradaNoRepertorio: declaradas.has(linguagemId),
      entidades: lista,
    }))
    .sort(
      (a, b) =>
        b.peso - a.peso ||
        Number(b.declaradaNoRepertorio) - Number(a.declaradaNoRepertorio) ||
        a.linguagemId.localeCompare(b.linguagemId),
    );
}

// ---------------------------------------------------------------------------
// O adjacente — exatamente um salto
// ---------------------------------------------------------------------------

function montarAdjacente(
  personaId: string,
  sementes: Entidade[],
  noRepertorio: Set<string>,
): { cartoes: Cartao[]; brutos: number } {
  const vistos = new Set<string>(noRepertorio);
  const candidatos: Candidato[] = [];

  for (const semente of sementes) {
    for (const { aresta, entidade } of vizinhos(semente.id)) {
      // O que já está no repertório NÃO é adjacente: é o próprio ponto de partida.
      if (vistos.has(entidade.id)) continue;
      if (!CARTAVEL.has(entidade.classe)) continue;
      vistos.add(entidade.id);

      // O motivo sai da MESMA aresta que trouxe o candidato, na orientação em que ela
      // foi gravada. É o mesmo caminho do cartão do feed — dois vocabulários para a
      // mesma ideia é como o produto perde a legibilidade que a fase inteira defende.
      const { motivo, passo } = resolverSalto(semente, entidade, aresta);
      candidatos.push({
        entidade,
        // Um salto, sempre. A semente é o ponto de partida e não conta como
        // intermediário, então nenhum destes chega por concentrador (DP-E).
        saltos: 1,
        viaConcentrador: false,
        motivo,
        caminho: [passo],
      });
    }
  }

  // Balde por linguagem, com o teto POR LINGUAGEM (ver TETO_POR_LINGUAGEM).
  const baldes = new Map<string, Candidato[]>();
  for (const candidato of candidatos) {
    const chave = candidato.entidade.linguagens[0] ?? SEM_LINGUAGEM;
    const lista = baldes.get(chave) ?? [];
    lista.push(candidato);
    baldes.set(chave, lista);
  }

  const escolhidos: Candidato[] = [];
  for (const [, lista] of [...baldes.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const ordenada = [...lista].sort((a, b) => {
      const ea = a.motivo.origemMotivo === "escrito" ? 0 : 1;
      const eb = b.motivo.origemMotivo === "escrito" ? 0 : 1;
      if (ea !== eb) return ea - eb;
      // DIVERGE DO FEED, DE PROPÓSITO ATÉ ALGUÉM DECIDIR. Em `caminhada.ts` este mesmo
      // critério foi REBAIXADO para baixo do hash no plano 02-02, porque ordenar por «tem
      // foto» ordena pelo que o acervo fotografou. Aqui ele continua ACIMA do hash, onde
      // decide de verdade — e a regeneração das imagens (900 → 2.382) mostrou o tamanho
      // disso: sem uma linha de código mudar, as linguagens novas do Carlos foram de 6
      // para 8, só porque outros adjacentes passaram a ter foto.
      //
      // Não foi mexido aqui porque mudar a composição de Meu Repertório é decisão de
      // produto, não manutenção de dado. Está anotado em `.planning/WINDOWS.md`, janela 12.
      const ia = a.entidade.imagem ? 0 : 1;
      const ib = b.entidade.imagem ? 0 : 1;
      if (ia !== ib) return ia - ib;
      return semear(personaId, a.entidade.id) - semear(personaId, b.entidade.id);
    });
    escolhidos.push(...ordenada.slice(0, TETO_POR_LINGUAGEM));
  }

  // Ordem final entre baldes: o mesmo desempate semeado, para a lista não sair agrupada
  // por linguagem e virar catálogo — o adjacente precisa ler como o feed (D-27).
  escolhidos.sort((a, b) => semear(personaId, a.entidade.id) - semear(personaId, b.entidade.id));

  return { cartoes: escolhidos.map((c) => paraCartao(c)), brutos: candidatos.length };
}

// ---------------------------------------------------------------------------
// Salvos
// ---------------------------------------------------------------------------

function resolverSalvos(ids: readonly string[]): SalvoResolvido[] {
  const indice = indiceDeSalvaveis();
  const saida: SalvoResolvido[] = [];

  for (const id of ids) {
    const entrada = indice.ocorrencias[chaveDeOcorrencia(id, indice.prefixo)];
    if (!entrada) continue;
    const [posicao, inicio, gratuito] = entrada;
    const evento = indice.eventos[posicao];
    if (!evento) continue;
    const [slug, titulo] = evento;
    saida.push({
      ocorrenciaId: id,
      eventoId: `evento:${slug}`,
      eventoTitulo: titulo,
      rota: `/evento/${slug}/`,
      dataCurta: dataCurta(inicio),
      hora: inicio.slice(11, 16),
      gratuito: gratuito === 1,
      // Medido e declarado: nenhuma ocorrência do grafo tem espaço.
      espacoDeclarado: null,
    });
  }

  return saida.sort((a, b) => a.ocorrenciaId.localeCompare(b.ocorrenciaId));
}

// ---------------------------------------------------------------------------
// A função da tela
// ---------------------------------------------------------------------------

export function repertorioDe(personaId: string): RepertorioDaPersona {
  const persona = personaPorId(personaId) ?? PERSONAS[0];
  if (!persona) {
    return {
      personaId,
      nome: "—",
      linguagensDeclaradas: [],
      linguagensAtravessadas: [],
      atravessado: [],
      adjacente: [],
      linguagensNovas: [],
      salvos: [],
      diagnostico: {
        entidadesNoRepertorio: 0,
        entidadesNaoResolvidas: 0,
        adjacentesBrutos: 0,
        adjacentesExibidos: 0,
        linguagensAtravessadas: 0,
        linguagensNoAdjacente: 0,
      },
    };
  }

  const declaradas = persona.repertorio.linguagens;
  const brutas = persona.repertorio.entidades;
  const entidades = brutas
    .map((id) => porId(id))
    .filter((e): e is Entidade => Boolean(e));

  const atravessado = montarAtravessado(entidades, declaradas);
  const noRepertorio = new Set(entidades.map((e) => e.id));

  const { cartoes: adjacente, brutos } = montarAdjacente(
    persona.id,
    entidades,
    noRepertorio,
  );

  const linguagensAtravessadas = new Set<string>(declaradas);
  for (const e of entidades) for (const l of e.linguagens) linguagensAtravessadas.add(l);

  const linguagensNoAdjacente = new Set<string>();
  for (const c of adjacente) for (const l of c.linguagens) linguagensNoAdjacente.add(l);

  const linguagensNovas = [...linguagensNoAdjacente]
    .filter((l) => !linguagensAtravessadas.has(l))
    .sort();

  return {
    personaId: persona.id,
    nome: persona.nome,
    linguagensDeclaradas: [...declaradas],
    linguagensAtravessadas: [...linguagensAtravessadas].sort(),
    atravessado,
    adjacente,
    linguagensNovas,
    salvos: resolverSalvos(persona.repertorio.ocorrenciasSalvas),
    diagnostico: {
      entidadesNoRepertorio: entidades.length,
      entidadesNaoResolvidas: brutas.length - entidades.length,
      adjacentesBrutos: brutos,
      adjacentesExibidos: adjacente.length,
      linguagensAtravessadas: linguagensAtravessadas.size,
      linguagensNoAdjacente: linguagensNoAdjacente.size,
    },
  };
}
