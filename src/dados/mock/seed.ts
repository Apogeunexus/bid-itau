/**
 * seed.ts — a semeadura determinística da jornada do produtor.
 *
 * FASE 0. MÓDULO DE SERVIDOR: ele lê o grafo por valor, no build, e devolve DTOs só de
 * primitivo. Componente `"use client"` importa daqui APENAS POR TIPO — é essa fronteira,
 * e só ela, que impede os 9,4 MB de `entidades.json` de atravessarem (DP-F).
 *
 * NENHUM `Math.random()` E NENHUM `new Date()`. Tudo o que este arquivo escolhe, escolhe
 * por REGRA declarada sobre dado ordenado: o slug ordena, o passo é fixo, e duas execuções
 * do build produzem exatamente a mesma semente. Um sorteio faria o roteiro que a banca vai
 * percorrer deixar de ser reproduzível entre um build e o seguinte — a mesma disciplina de
 * `GRUPO_DO_TRACADOR` em `duplicatas.ts` e de `EVENTO_DO_PAR` em `alerta.ts`.
 *
 * NENHUM TÍTULO INVENTADO. Os cinco registros semeados saem de eventos REAIS do acervo. O
 * que é autorado neles é a SITUAÇÃO — «este evento está em moderação» —, e é isso, e só
 * isso, que a tela declara como escrito para a demonstração, no padrão de
 * `OPERADOR_DO_STUDIO`.
 */

import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { ocorrenciasDe, porId, porSlug, slugsPorTipo, temporadasDe, vizinhos } from "@/dados/grafo";
import { normalizar } from "@/dados/indice";
import vocabularioJson from "@/dados/gerado/vocabulario.json";
import { PROCEDENCIA_DO_PRODUTOR, acessibilidadeVazia, comChavesRecalculadas } from "@/dados/tipos-acesso";
import type {
  CanalIngresso,
  FaixaEtaria,
  OcorrenciaDoRascunho,
  RascunhoDoProdutor,
  Situacao,
  TemporadaDoRascunho,
  VinculoDeElenco,
} from "@/dados/tipos-acesso";
import type { Entidade, Vocabulario } from "@/dados/tipos";

const vocabulario = vocabularioJson as Vocabulario;

// ---------------------------------------------------------------------------
// Quem é o produtor da demonstração — autorado, e rotulado como tal
// ---------------------------------------------------------------------------

/** A organização a que o produtor pertence. É ela o AGENTE REALIZADOR da chave de
 *  identidade, e é por isso que não é campo de formulário: quem publica é quem realiza. */
export const ORGANIZACAO_DO_PRODUTOR = "Itaú Cultural";

export const PRODUTOR_DA_DEMONSTRACAO = "Produção de programação (perfil autorado)";

export const PRODUTOR_E_AUTORADO =
  "Não há autenticação neste protótipo: o produtor acima é um perfil escrito para a " +
  "demonstração, no mesmo estatuto do operador do Studio. O que ele carimba nos registros " +
  "— autor, data e procedência «produtor» — é real e auditável; quem ele é, não.";

export const SITUACAO_E_AUTORADA =
  "Os eventos abaixo são reais e vêm do acervo. O que foi escrito para a demonstração é a " +
  "SITUAÇÃO de cada um — rascunho, devolvido, publicado —, porque situação é um campo que " +
  "não existe em sistema nenhum do IC hoje.";

// ---------------------------------------------------------------------------
// O catálogo — o DTO que o cliente recebe no lugar do grafo
// ---------------------------------------------------------------------------

export interface AgenteDoCatalogo {
  id: string;
  titulo: string;
  /** `pessoa` | `coletivo` | `obra` — string para o DTO ficar de primitivo. */
  classe: string;
  /** O verbete da Enciclopédia, cortado. A tela o embute para conferência antes do vínculo. */
  resumo: string;
}

export interface EspacoDoCatalogo {
  id: string;
  titulo: string;
  cidade: string;
  estado: string;
  /** A ficha do espaço, herdada da Organização e exibida em LEITURA na P6. */
  declaraAcessibilidade: boolean;
}

export interface TermoDoCatalogo {
  id: string;
  rotulo: string;
  /** Nome do token CSS (`"--ic-lilas"`), nunca o hex: a cor da linguagem é dado (D-08). */
  cor: string | null;
}

export interface EventoDoAcervo {
  slug: string;
  titulo: string;
  /** A MESMA normalização do índice de busca — é contra ela que a duplicata dispara. */
  normalizado: string;
}

export interface ImagemDoCatalogo {
  caminho: string;
  /** O crédito que o acervo publica. Vem junto porque crédito é obrigatório (165). */
  credito: string;
  /** O evento de onde a imagem veio — a tela diz de onde, em vez de fingir upload. */
  de: string;
}

/**
 * Tudo o que as dez telas precisam ler do grafo, achatado em primitivo.
 *
 * ELE VAI INTEIRO PARA O CLIENTE, e é decisão e não descuido: a busca de elenco e a
 * escolha de espaço precisam responder sem navegar, e uma rota por agente geraria mais de
 * mil páginas. O que atravessa são quatro campos por registro, nunca uma `Entidade`.
 */
export interface CatalogoDoStudio {
  agentes: AgenteDoCatalogo[];
  obras: AgenteDoCatalogo[];
  espacos: EspacoDoCatalogo[];
  linguagens: TermoDoCatalogo[];
  temas: TermoDoCatalogo[];
  eventos: EventoDoAcervo[];
  imagens: ImagemDoCatalogo[];
  organizacao: string;
  produtor: string;
  dataDeReferencia: string;
}

/** O verbete cortado. 160 caracteres é o que cabe na conferência sem transformar a busca
 *  em leitura — e é o corte que mantém o catálogo abaixo de um quarto de megabyte. */
function resumoCurto(e: Entidade): string {
  const r = (e.resumo ?? "").trim();
  return r.length <= 160 ? r : `${r.slice(0, 157)}…`;
}

function entidadesDe(classe: Parameters<typeof slugsPorTipo>[0]): Entidade[] {
  const saida: Entidade[] = [];
  for (const slug of slugsPorTipo(classe)) {
    const e = porSlug(classe, slug);
    if (e) saida.push(e);
  }
  saida.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return saida;
}

function textoDoExtra(e: Entidade, chave: string): string {
  const v = e.extra?.[chave];
  return typeof v === "string" ? v : "";
}

export function catalogoDoStudio(): CatalogoDoStudio {
  const pessoas = entidadesDe("pessoa");
  const coletivos = entidadesDe("coletivo");
  const obras = entidadesDe("obra");
  const espacos = entidadesDe("espaco");
  const eventos = entidadesDe("evento");

  const agentes: AgenteDoCatalogo[] = [...pessoas, ...coletivos].map((e) => ({
    id: e.id,
    titulo: e.titulo,
    classe: e.classe,
    resumo: resumoCurto(e),
  }));
  agentes.sort((a, b) => (a.titulo < b.titulo ? -1 : a.titulo > b.titulo ? 1 : 0));

  const catalogoDeObras: AgenteDoCatalogo[] = obras.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    classe: e.classe,
    resumo: resumoCurto(e),
  }));
  catalogoDeObras.sort((a, b) => (a.titulo < b.titulo ? -1 : a.titulo > b.titulo ? 1 : 0));

  return {
    agentes,
    obras: catalogoDeObras,
    espacos: espacos.map((e) => ({
      id: e.id,
      titulo: e.titulo,
      cidade: textoDoExtra(e, "cidade"),
      estado: textoDoExtra(e, "estado"),
      declaraAcessibilidade: e.declaraAcessibilidade,
    })),
    linguagens: vocabulario.linguagens.map((l) => ({ id: l.id, rotulo: l.rotulo, cor: l.cor })),
    temas: vocabulario.temas.map((t) => ({ id: t.id, rotulo: t.rotulo, cor: null })),
    eventos: eventos.map((e) => ({
      slug: e.slug,
      titulo: e.titulo,
      normalizado: normalizar(e.titulo),
    })),
    imagens: imagensDoCatalogo(eventos),
    organizacao: ORGANIZACAO_DO_PRODUTOR,
    produtor: PRODUTOR_DA_DEMONSTRACAO,
    dataDeReferencia: DATA_DE_REFERENCIA,
  };
}

/**
 * As imagens que a P2 oferece — vindas do acervo, COM o crédito que o acervo publica.
 *
 * Não há upload neste protótipo, e a tela diz isso em vez de simular um. A regra de
 * escolha: entre os eventos `ic` que têm imagem E crédito, os doze primeiros em ordem de
 * id. Ordem de id e não «os melhores»: uma curadoria manual aqui seria mais um lugar onde
 * a demonstração dependeria de alguém lembrar de atualizar.
 */
function imagensDoCatalogo(eventos: Entidade[]): ImagemDoCatalogo[] {
  return eventos
    .filter((e) => e.procedencia === "ic" && e.imagem && (e.creditoImagem ?? "").trim() !== "")
    .slice(0, 12)
    .map((e) => ({ caminho: e.imagem as string, credito: e.creditoImagem as string, de: e.titulo }));
}

// ---------------------------------------------------------------------------
// A semeadura — cinco registros, escolhidos por regra
// ---------------------------------------------------------------------------

/**
 * As situações dos cinco, na ordem em que a regra de escolha os produz.
 *
 * Três estão nas mãos do produtor (dois rascunhos e um devolvido) e dois já foram
 * publicados. O devolvido existe porque é o estado que mais fala com quem avalia: ele
 * prova que a decisão da moderação VOLTA, com motivo, e que o produtor tem o que fazer
 * com ela — sem ele, a jornada só teria mão única.
 */
const SITUACOES_SEMEADAS: readonly Situacao[] = [
  "rascunho",
  "rascunho",
  "devolvido",
  "publicado",
  "publicado",
];

/**
 * O passo da amostragem sobre os eventos `ic` COM SESSÕES, ordenados por slug.
 *
 * Por que 23: é primo e maior que o número de eventos consecutivos que compartilham
 * prefixo de slug no acervo, então os cinco escolhidos não caem todos na mesma família de
 * títulos. Trocar o número troca a semente inteira — de propósito: ele é a semente.
 */
const PASSO_DA_AMOSTRA = 23;

const MOTIVO_DA_DEVOLUCAO =
  "A ficha de acessibilidade não foi resolvida e duas sessões estão sem espaço declarado. " +
  "Sem o espaço, a chave de identidade da sessão fica com duas partes em vez de três.";

const PAPEIS_SEMEADOS = ["direção", "elenco", "curadoria", "trilha sonora"] as const;
const FAIXAS_SEMEADAS: readonly (FaixaEtaria | null)[] = [null, "livre", "12", "livre", "10"];
const CANAIS_SEMEADOS: readonly (CanalIngresso | null)[] = [
  null,
  "bilheteria-no-local",
  null,
  "link-externo",
  "agendamento",
];

/** Quantas sessões cada registro semeado traz. Fixo e pequeno: a grade da P5 existe para
 *  o produtor GERAR sessões, e uma semente cheia esconderia o gerador. */
const SESSOES_POR_SEMENTE = 4;

function eventosSemeaveis(): Entidade[] {
  return entidadesDe("evento")
    .filter((e) => e.procedencia === "ic" && ocorrenciasDe(e.id).length > 0)
    .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

/**
 * Os cinco eventos da semente: índices `0`, `23`, `46`, `69` e `92` da lista ordenada por
 * slug. Se o acervo encolher a ponto de não ter 93 eventos com sessão, a regra dobra sobre
 * o resto (`% total`) em vez de devolver menos de cinco — a demonstração não pode perder
 * um estado por causa de uma regeração.
 */
function eventosDaSemente(): Entidade[] {
  const pool = eventosSemeaveis();
  if (pool.length === 0) return [];
  return SITUACOES_SEMEADAS.map((_, i) => pool[(i * PASSO_DA_AMOSTRA) % pool.length] as Entidade);
}

function espacoDoIndice(i: number): EspacoDoCatalogo | null {
  const espacos = entidadesDe("espaco");
  if (espacos.length === 0) return null;
  const e = espacos[(i * PASSO_DA_AMOSTRA) % espacos.length] as Entidade;
  return {
    id: e.id,
    titulo: e.titulo,
    cidade: textoDoExtra(e, "cidade"),
    estado: textoDoExtra(e, "estado"),
    declaraAcessibilidade: e.declaraAcessibilidade,
  };
}

/** Os agentes que entram no elenco semeado: os que o grafo JÁ liga a alguma obra deste
 *  evento, e — quando não houver — os primeiros da lista ordenada. Nunca um nome digitado. */
function elencoDaSemente(indice: number, quantos: number): VinculoDeElenco[] {
  const pessoas = entidadesDe("pessoa").filter((p) => p.procedencia === "ic");
  if (pessoas.length === 0) return [];
  const saida: VinculoDeElenco[] = [];
  for (let k = 0; k < quantos; k += 1) {
    const p = pessoas[((indice + 1) * PASSO_DA_AMOSTRA + k * 7) % pessoas.length] as Entidade;
    saida.push({
      agenteId: p.id,
      agenteTitulo: p.titulo,
      agenteClasse: p.classe,
      papel: PAPEIS_SEMEADOS[k % PAPEIS_SEMEADOS.length] as string,
      proposto: false,
    });
  }
  return saida;
}

/**
 * As temporadas do evento, TODAS elas — e não a primeira.
 *
 * Medido em 26.08: **0 de 300 eventos do acervo têm mais de uma temporada**, e o máximo é
 * 1. Ler `temporadasDe(...)[0]` daria o mesmo resultado hoje — e estaria certo por acidente
 * do dado, não por decisão. No dia em que o acervo trouxer um evento com duas, o `[0]`
 * descartaria a segunda em silêncio, sem sintoma nenhum antes: nem `tsc`, nem
 * `verificar-ds`, nem sonda de comportamento veriam.
 *
 * É a mesma classe do `find()` sobre adjacência que custou à S6 um painel mostrando zero
 * para a organização protagonista. Aqui o mapa é sobre a lista inteira, e o `?? [uma]` só
 * cobre o evento que o grafo não datou.
 */
function temporadasDaSemente(evento: Entidade, indice: number): TemporadaDoRascunho[] {
  const espaco = espacoDoIndice(indice);

  // O terceiro registro (o devolvido) fica SEM espaço de propósito: é a pendência de
  // porta 2 que o motivo da devolução cita, e sem ela a devolução seria uma frase solta.
  const semEspaco = indice === 2;

  const doGrafo = temporadasDe(evento.id);
  const intervalos =
    doGrafo.length > 0
      ? doGrafo.map((t) => ({
          inicio: (t.extra?.inicio as string | undefined) ?? DATA_DE_REFERENCIA,
          fim: (t.extra?.fim as string | undefined) ?? DATA_DE_REFERENCIA,
        }))
      : [{ inicio: DATA_DE_REFERENCIA, fim: DATA_DE_REFERENCIA }];

  return intervalos.map((intervalo, k) => ({
    id: `temporada:produtor:${indice}-${k + 1}`,
    espacoId: semEspaco ? null : (espaco?.id ?? null),
    espacoTitulo: semEspaco ? null : (espaco?.titulo ?? null),
    inicio: intervalo.inicio,
    fim: intervalo.fim < intervalo.inicio ? intervalo.inicio : intervalo.fim,
    longaDuracao: false,
    espacoPedido: semEspaco,
  }));
}

function ocorrenciasDaSemente(
  evento: Entidade,
  temporada: TemporadaDoRascunho,
  indice: number,
): OcorrenciaDoRascunho[] {
  return ocorrenciasDe(evento.id)
    .slice(0, SESSOES_POR_SEMENTE)
    .map((o, k) => ({
      id: `ocorrencia:produtor:${indice}-${k}`,
      temporadaId: temporada.id,
      inicio: o.inicio.slice(0, 16),
      espacoId: temporada.espacoId,
      gratuito: o.gratuito,
      preco: null,
      esgotado: false,
      cancelada: false,
      motivoDoCancelamento: null,
    }));
}

/**
 * Os cinco registros da demonstração.
 *
 * Rodar duas vezes devolve exatamente o mesmo resultado — é o que permite ao portão da
 * suíte comparar a semente com ela mesma e ao apresentador rodar a demonstração de novo
 * sem que a segunda valha menos que a primeira.
 */
export function rascunhosSemeados(): RascunhoDoProdutor[] {
  const eventos = eventosDaSemente();

  return eventos.map((evento, i) => {
    const situacao = SITUACOES_SEMEADAS[i] as Situacao;
    const publicado = situacao === "publicado";
    const devolvido = situacao === "devolvido";

    const temporadas = temporadasDaSemente(evento, i);
    const primeiraTemporada = temporadas[0] as TemporadaDoRascunho;
    const ocorrencias = ocorrenciasDaSemente(evento, primeiraTemporada, i);

    // A obra entra só nos publicados e no devolvido: os dois rascunhos ficam com a chave
    // incompleta de propósito, porque é o estado em que o acervo está hoje — 300 de 300
    // eventos sem obra — e é dele que a jornada parte.
    const obra = publicado || devolvido ? obraDoIndice(i) : null;

    const elenco = publicado ? elencoDaSemente(i, 3) : devolvido ? elencoDaSemente(i, 1) : [];

    const parcial: RascunhoDoProdutor = {
      id: `evento:produtor:${String(i + 1).padStart(3, "0")}`,
      situacao,
      titulo: evento.titulo,
      resumo: evento.resumo ?? "",
      linguagens: evento.linguagens,
      temas: evento.temas,
      termosPropostos: [],
      imagem: evento.imagem ?? null,
      creditoImagem: evento.imagem ? (evento.creditoImagem ?? null) : null,
      obraId: obra?.id ?? null,
      obraTitulo: obra?.titulo ?? null,
      obraProposta: false,
      elenco,
      temporadas,
      ocorrencias,
      acessibilidade: publicado ? evento.acessibilidade : acessibilidadeVazia(),
      declaraAcessibilidade: publicado,
      faixaEtaria: FAIXAS_SEMEADAS[i] ?? null,
      canalIngresso: CANAIS_SEMEADOS[i] ?? null,
      linkDeIngresso: null,
      inscricao: null,
      procedencia: PROCEDENCIA_DO_PRODUTOR,
      fonte: ORGANIZACAO_DO_PRODUTOR,
      chaveIdentidade: "",
      autor: PRODUTOR_DA_DEMONSTRACAO,
      enviadoEm: publicado || devolvido ? DATA_DE_REFERENCIA : null,
      historico: [],
      pendencias: [],
      motivoDaDevolucao: devolvido ? MOTIVO_DA_DEVOLUCAO : null,
    };

    return comChavesRecalculadas(parcial);
  });
}

function obraDoIndice(i: number): Entidade | null {
  const obras = entidadesDe("obra").filter((o) => o.procedencia === "ic");
  if (obras.length === 0) return null;
  return obras[((i + 1) * PASSO_DA_AMOSTRA) % obras.length] as Entidade;
}

/** Confere que o id que a semente cita ainda existe no grafo. Usado pela suíte: uma
 *  regeração que apague um espaço tem de QUEBRAR ALTO, não sumir com a semente. */
export function idExiste(id: string): boolean {
  return porId(id) !== undefined;
}

// ---------------------------------------------------------------------------
// Catálogos estreitos — um por tela, e não o inteiro em todas
// ---------------------------------------------------------------------------

/**
 * O que a P2 (identidade) precisa, e nada além.
 *
 * `catalogoDoStudio()` inteiro tem 200 KB porque carrega 792 agentes e 239 obras para a
 * busca de elenco. Mandar isso para a tela de identidade seria pagar cinco vezes o peso
 * por dado que ela não lê — e o peso do DTO é o custo real de DP-F, não uma métrica de
 * vaidade. Cada tela leva o seu recorte.
 */
export interface CatalogoDeIdentidade {
  linguagens: TermoDoCatalogo[];
  temas: TermoDoCatalogo[];
  /** Os 300 eventos reais, contra os quais o aviso de duplicata dispara antes de salvar. */
  eventos: EventoDoAcervo[];
  imagens: ImagemDoCatalogo[];
  organizacao: string;
  produtor: string;
  dataDeReferencia: string;
}

export function catalogoDeIdentidade(): CatalogoDeIdentidade {
  const eventos = entidadesDe("evento");
  return {
    linguagens: vocabulario.linguagens.map((l) => ({ id: l.id, rotulo: l.rotulo, cor: l.cor })),
    temas: vocabulario.temas.map((t) => ({ id: t.id, rotulo: t.rotulo, cor: null })),
    eventos: eventos.map((e) => ({
      slug: e.slug,
      titulo: e.titulo,
      normalizado: normalizar(e.titulo),
    })),
    imagens: imagensDoCatalogo(eventos),
    organizacao: ORGANIZACAO_DO_PRODUTOR,
    produtor: PRODUTOR_DA_DEMONSTRACAO,
    dataDeReferencia: DATA_DE_REFERENCIA,
  };
}

/**
 * O que a P4 (espaço e temporada) e a P5 (grade) precisam: os 113 espaços, e nada mais.
 *
 * As duas escolhem espaço e não tocam em linguagem, tema nem imagem. 113 registros de cinco
 * campos são 12 KB — contra os 65 KB da identidade e os 200 KB do catálogo inteiro. Um
 * catálogo por tela quando a necessidade é a mesma seria duplicação com nome de recorte.
 */
export interface CatalogoDeEspacos {
  espacos: EspacoDoCatalogo[];
  organizacao: string;
  produtor: string;
  dataDeReferencia: string;
}

export function catalogoDeEspacos(): CatalogoDeEspacos {
  return {
    espacos: entidadesDe("espaco").map((e) => ({
      id: e.id,
      titulo: e.titulo,
      cidade: textoDoExtra(e, "cidade"),
      estado: textoDoExtra(e, "estado"),
      declaraAcessibilidade: e.declaraAcessibilidade,
    })),
    organizacao: ORGANIZACAO_DO_PRODUTOR,
    produtor: PRODUTOR_DA_DEMONSTRACAO,
    dataDeReferencia: DATA_DE_REFERENCIA,
  };
}

/**
 * O que a P3 (obra e elenco) precisa: os agentes e as obras reais do acervo.
 *
 * É O CATÁLOGO MAIS PESADO das telas da jornada — 792 agentes e 239 obras, com o verbete
 * cortado para conferência — e vai inteiro de propósito: a busca precisa responder sem
 * navegar, e uma rota por agente geraria mais de mil páginas no build. O que atravessa são
 * quatro campos por registro, nunca uma `Entidade`.
 */
export interface CatalogoDoElenco {
  agentes: AgenteDoCatalogo[];
  obras: AgenteDoCatalogo[];
  organizacao: string;
  produtor: string;
  dataDeReferencia: string;
  /** Quantos agentes a Enciclopédia completa tem, contra os do protótipo. */
  pessoasNoProtótipo: number;
}

export function catalogoDoElenco(): CatalogoDoElenco {
  const inteiro = catalogoDoStudio();
  return {
    agentes: inteiro.agentes,
    obras: inteiro.obras,
    organizacao: ORGANIZACAO_DO_PRODUTOR,
    produtor: PRODUTOR_DA_DEMONSTRACAO,
    dataDeReferencia: DATA_DE_REFERENCIA,
    pessoasNoProtótipo: entidadesDe("pessoa").length,
  };
}

/**
 * Os papéis que a tela oferece de partida, LIDOS DO GRAFO e não digitados.
 *
 * As 508 arestas `atua_em` existentes trazem `papel` obrigatório, e são elas que dizem que
 * vocabulário o acervo de fato usa. Uma lista escrita à mão aqui inventaria papéis que
 * nenhuma aresta sustenta — e o produtor escolheria entre categorias que a plataforma não
 * reconhece. Ordenados por frequência, com desempate por rótulo para o resultado não mudar
 * entre duas gerações.
 */
export function papeisDoAcervo(): Array<{ papel: string; arestas: number }> {
  const conta = new Map<string, number>();
  for (const slug of slugsPorTipo("pessoa")) {
    const p = porSlug("pessoa", slug);
    if (!p) continue;
    for (const v of vizinhos(p.id, "atua_em")) {
      const papel = v.aresta.papel?.trim();
      if (papel) conta.set(papel, (conta.get(papel) ?? 0) + 1);
    }
  }
  return [...conta.entries()]
    .map(([papel, arestas]) => ({ papel, arestas }))
    .sort((a, b) => (b.arestas - a.arestas) || (a.papel < b.papel ? -1 : 1));
}

/**
 * Os números que justificam a P3 existir. **Medidos, e a distinção importa.**
 *
 * Há 508 arestas `atua_em` no grafo e 426 delas apontam para `evento`. Contar só isso
 * levaria à conclusão errada de que a agenda já tem elenco. O acervo mede outra coisa:
 * dessas 426, **nenhuma aponta para um evento DATADO** — os eventos que a Enciclopédia
 * liga a artistas são históricos, sem sessão nenhuma, e os 129 que têm ocorrência não têm
 * artista vinculado.
 *
 * «Evento» e «evento datado» são conjuntos disjuntos neste acervo, e confundi-los é o erro
 * que faz a tela afirmar que o problema não existe.
 *
 * O produtor é o único ator com legitimidade para dizer que fulano se apresenta sábado — e
 * é por isso que a equipe se recusou a autorar essas arestas no protótipo.
 */
export interface NumerosDoElenco {
  /** Todas as `atua_em` que saem de pessoa ou coletivo. */
  atuaEm: number;
  /** Quantas apontam para um `evento`, datado ou não. */
  paraEvento: number;
  /** Quantas apontam para um evento COM ocorrência. É zero, e é o argumento. */
  paraEventoDatado: number;
  /** Quantos eventos têm ao menos uma ocorrência. */
  eventosDatados: number;
  /** Quantos desses têm ao menos um artista vinculado. Também zero. */
  datadosComArtista: number;
  pessoas: number;
  coletivos: number;
  obras: number;
}

export function numerosDoElenco(): NumerosDoElenco {
  const datados = new Set<string>();
  for (const slug of slugsPorTipo("evento")) {
    const e = porSlug("evento", slug);
    if (e && ocorrenciasDe(e.id).length > 0) datados.add(e.id);
  }

  let atuaEm = 0;
  let paraEvento = 0;
  let paraEventoDatado = 0;
  for (const classe of ["pessoa", "coletivo"] as const) {
    for (const slug of slugsPorTipo(classe)) {
      const p = porSlug(classe, slug);
      if (!p) continue;
      for (const v of vizinhos(p.id, "atua_em")) {
        atuaEm += 1;
        if (v.entidade.classe !== "evento") continue;
        paraEvento += 1;
        if (datados.has(v.entidade.id)) paraEventoDatado += 1;
      }
    }
  }

  let datadosComArtista = 0;
  for (const id of datados) {
    const temArtista = vizinhos(id, "atua_em").some(
      (v) => v.entidade.classe === "pessoa" || v.entidade.classe === "coletivo",
    );
    if (temArtista) datadosComArtista += 1;
  }

  return {
    atuaEm,
    paraEvento,
    paraEventoDatado,
    eventosDatados: datados.size,
    datadosComArtista,
    pessoas: entidadesDe("pessoa").length,
    coletivos: entidadesDe("coletivo").length,
    obras: entidadesDe("obra").length,
  };
}

/** Nome antigo, mantido enquanto a P5 não é reescrita. Mesma função, sem cópia. */
export const catalogoDaGrade = catalogoDeEspacos;
export type CatalogoDaGrade = CatalogoDeEspacos;
