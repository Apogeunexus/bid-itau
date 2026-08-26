/**
 * tipos-acesso.ts — o contrato compartilhado dos níveis de acesso.
 *
 * FASE 0. Escrito pela S7 (Studio · produtor) e HERDADO pela S3 (Moderação): tudo o que
 * atravessa a fronteira entre os dois níveis mora aqui, e nenhuma das duas sessões o
 * redeclara na própria pasta.
 *
 * POR QUE ESTE ARQUIVO EXISTE EM VEZ DE UMA EDIÇÃO EM `tipos.ts`. A ontologia é contrato
 * de outra sessão. As quatro adições que a jornada do produtor exige — `Situacao`,
 * `faixaEtaria`, `canalIngresso`, `inscricao` — e a extensão de `Procedencia` com
 * `"produtor"` entram aqui por EXTENSÃO, sem tocar o arquivo de origem. A consolidação em
 * `tipos.ts` está registrada como PEDIDO-01 em `.planning/PAINEL.md`; até ser atendida, as
 * duas formas convivem sem quebrar nada, porque toda extensão é aditiva.
 *
 * ELE PODE SER IMPORTADO POR VALOR NO CLIENTE, e isso é requisito e não acaso (DP-F):
 * nenhum import de valor sai daqui a não ser `normalizar`, que é uma função de string sem
 * dependência de dado. `Acessibilidade`, `Entidade`, `Ocorrencia`, `Procedencia` e
 * `EntradaDeHistorico` entram como `import type` e são apagados na compilação — nenhum
 * byte dos 9,4 MB de `entidades.json` atravessa por causa deste arquivo.
 *
 * SEM RELÓGIO E SEM SORTEIO. Nada aqui lê `new Date()` nem `Math.random()`: o HTML
 * exportado e a página hidratada precisam coincidir, e um id sorteado ou um carimbo lido
 * do relógio fariam os dois divergirem na primeira renderização.
 */

import type {
  Acessibilidade,
  DimensaoAcessibilidade,
  Entidade,
  Ocorrencia,
  Procedencia,
} from "./tipos";
import type { EntradaDeHistorico } from "./ocorrencias-studio";
import { normalizar } from "./indice";

export type { EntradaDeHistorico };

// ---------------------------------------------------------------------------
// Situação — o estado do registro. §12 da ontologia: sem ela não há jornada.
// ---------------------------------------------------------------------------

/**
 * Onde o registro está na cadeia de decisão.
 *
 * É O TIPO MAIS IMPORTANTE DESTE ARQUIVO. Sem `Situacao` o Studio é um formulário: o
 * produtor preenche, aperta um botão e nada muda de lugar. Com ela, o mesmo registro é
 * lido por dois níveis diferentes — o produtor vê «enviado», o moderador vê «na fila» — e
 * é essa leitura dupla que prova que os oito níveis se conversam.
 *
 * - `rascunho`      — só o produtor vê; nada saiu do Studio
 * - `em-moderacao`  — enviado; a decisão agora é da S3, e o produtor não edita
 * - `devolvido`     — a moderação pediu correção, com motivo; volta a ser editável
 * - `publicado`     — está no acervo, com procedência `produtor`
 * - `suspenso`      — estava publicado e foi retirado; o histórico permanece
 */
export type Situacao =
  | "rascunho"
  | "em-moderacao"
  | "devolvido"
  | "publicado"
  | "suspenso";

/** A ordem em que as situações aparecem em qualquer agrupamento. Não é alfabética: é a
 *  ordem da jornada, e uma lista ordenada por outro critério faria o painel contar a
 *  história fora de ordem. */
export const SITUACOES: readonly Situacao[] = [
  "devolvido",
  "rascunho",
  "em-moderacao",
  "publicado",
  "suspenso",
];

export const ROTULO_DA_SITUACAO: Record<Situacao, string> = {
  rascunho: "rascunho",
  "em-moderacao": "em moderação",
  devolvido: "devolvido",
  publicado: "publicado",
  suspenso: "suspenso",
};

/** O que a situação significa PARA QUEM ESTÁ NA TELA — quem decide agora, e o que dá para
 *  fazer. Um selo colorido sem esta frase deixa o produtor sem saber se é a vez dele. */
export const EXPLICACAO_DA_SITUACAO: Record<Situacao, string> = {
  rascunho: "Só você vê. Nada saiu do Studio ainda.",
  "em-moderacao": "A decisão é da moderação. Enquanto está na fila, o registro não é editável.",
  devolvido: "A moderação pediu correção e disse o motivo. Voltou a ser editável.",
  publicado: "Está no acervo, com procedência «produtor» e o seu nome no carimbo.",
  suspenso: "Foi retirado do ar depois de publicado. O histórico continua registrado.",
};

/** As situações em que o produtor pode escrever. Fora delas a decisão é de outro nível, e
 *  a tela desabilita em vez de deixar salvar e descartar depois. */
export const SITUACOES_EDITAVEIS: readonly Situacao[] = ["rascunho", "devolvido"];

export function editavel(situacao: Situacao): boolean {
  return SITUACOES_EDITAVEIS.includes(situacao);
}

// ---------------------------------------------------------------------------
// Procedência — §3 da ontologia: cada papel humano é um valor de procedência
// ---------------------------------------------------------------------------

/**
 * `Procedencia` com os papéis humanos que o PRD §6 prevê em produção.
 *
 * A descoberta central do documento de ontologia é que os níveis de acesso NÃO são uma
 * camada de segurança sobre o modelo: eles são o vocabulário de procedência. Cada escrita
 * carimba quem escreveu, e «quem escreveu» é exatamente o conjunto de papéis.
 *
 * A S7 usa só `"produtor"`. Os outros três entram já declarados para que a S1, a S3 e a
 * S5 não precisem reabrir este tipo — e para que a extensão seja UMA, e não quatro.
 */
export type ProcedenciaDePapel =
  | Procedencia
  | "produtor"
  | "parceiro"
  | "curador"
  | "ia";

/** O que a S7 carimba, sempre. Nunca digitável: é sistema, como `chaveIdentidade`. */
export const PROCEDENCIA_DO_PRODUTOR = "produtor" as const;

export const FRASE_DA_PROCEDENCIA =
  "Procedência é carimbo do sistema, não campo de formulário: ela registra QUEM escreveu, " +
  "e um valor que a pessoa pudesse escolher deixaria de registrar isso.";

// ---------------------------------------------------------------------------
// As três portas para fora do Studio — §8 da ontologia, §5 do PRD
// ---------------------------------------------------------------------------

/** Para qual nível a falta escala. Vocabulário fechado: três portas, nem uma a mais. */
export type Porta = "moderacao" | "organizacao" | "editor";

export interface DescricaoDaPorta {
  porta: Porta;
  /** Quem resolve, com o número da funcionalidade — o avaliador confere no catálogo. */
  nivel: string;
  /** O estado que o registro assume enquanto espera. */
  estado: string;
  /** O que o produtor ainda pode fazer sem esperar. Nenhuma porta é beco sem saída. */
  saida: string;
}

export const PORTAS: Record<Porta, DescricaoDaPorta> = {
  moderacao: {
    porta: "moderacao",
    nivel: "Moderador (117)",
    estado: "proposta aguardando reconciliação",
    saida: "seguir sem ela — a proposta fica no elenco marcada, e não bloqueia o envio",
  },
  organizacao: {
    porta: "organizacao",
    nivel: "Organização (142)",
    estado: "aguardando cadastro do espaço",
    saida: "pedir à organização e seguir — a temporada fica sem espaço declarado, e a tela diz",
  },
  editor: {
    porta: "editor",
    nivel: "Editor / Curador (130)",
    estado: "termo proposto, em análise",
    saida: "seguir com os termos que já estão no vocabulário",
  },
};

export interface Pendencia {
  porta: Porta;
  texto: string;
}

/** Nenhuma das três bloqueia o envio, e isso é decisão de produto e não frouxidão: uma
 *  porta que travasse a jornada faria o produtor esperar por um nível que ele não controla,
 *  e a demonstração pararia no meio. Elas aparecem NOMEADAS na revisão, com o responsável. */
export const NENHUMA_PORTA_BLOQUEIA =
  "Nenhuma das três pendências impede o envio. Elas seguem junto, nomeadas, com o nível " +
  "responsável por cada uma — quem decide sabe o que ainda falta e de quem depende.";

// ---------------------------------------------------------------------------
// As adições de contrato — §12 da ontologia
// ---------------------------------------------------------------------------

/**
 * Classificação indicativa. Vocabulário fechado, na ordem da tabela do MJ.
 *
 * POR QUE ELE PRECISA EXISTIR: a disposição «vou com criança» está no ar com
 * `campoLido: null` (`disposicoes.ts:147`) porque o acervo não declara faixa etária em
 * campo nenhum. O filtro público está visível e desligado, e é este campo que o liga.
 */
export const FAIXAS_ETARIAS = ["livre", "10", "12", "14", "16", "18"] as const;
export type FaixaEtaria = (typeof FAIXAS_ETARIAS)[number];

export const ROTULO_DA_FAIXA: Record<FaixaEtaria, string> = {
  livre: "livre para todos os públicos",
  "10": "não recomendado para menores de 10 anos",
  "12": "não recomendado para menores de 12 anos",
  "14": "não recomendado para menores de 14 anos",
  "16": "não recomendado para menores de 16 anos",
  "18": "não recomendado para menores de 18 anos",
};

/**
 * Por onde se consegue entrar. O acervo só tem o booleano `gratuito`, e 0 de 300 eventos
 * declaram ingresso — o corte de gratuidade do público não recorta nada hoje.
 */
export const CANAIS_DE_INGRESSO = [
  "link-externo",
  "bilheteria-no-local",
  "agendamento",
] as const;
export type CanalIngresso = (typeof CANAIS_DE_INGRESSO)[number];

export const ROTULO_DO_CANAL: Record<CanalIngresso, string> = {
  "link-externo": "link externo de venda",
  "bilheteria-no-local": "bilheteria no local",
  agendamento: "agendamento pela instituição",
};

/** Os dois campos novos de `Ocorrencia`. Extensão aditiva: nenhum registro existente
 *  deixa de tipar por causa deles, porque os dois são opcionais. */
export interface CamposDeIngresso {
  /** Por onde se entra. `null` = não declarado, e a tela diz que não foi declarado. */
  canalIngresso?: CanalIngresso | null;
  /** O que fazer quando não há bilheteria: a instrução de inscrição, em texto puro. */
  inscricao?: string | null;
}

/** `Ocorrencia` com os dois campos que §12 pede. Enquanto PEDIDO-01 não é atendido, é este
 *  o tipo que o Studio grava e a Moderação lê. */
export type OcorrenciaDeclarada = Ocorrencia & CamposDeIngresso;

/** `Entidade` com a faixa etária que §12 pede. Mesma disciplina: aditivo e opcional. */
export type EntidadeClassificada = Entidade & { faixaEtaria?: FaixaEtaria | null };

// ---------------------------------------------------------------------------
// Acessibilidade — as 8 dimensões, com rótulo em português
// ---------------------------------------------------------------------------

export interface DimensaoComRotulo {
  chave: DimensaoAcessibilidade;
  rotulo: string;
}

/** As oito, na ordem em que `tipos.ts` as declara. A ordem é do contrato e não do gosto:
 *  duas telas que listassem as mesmas oito em ordens diferentes fariam quem confere achar
 *  que são fichas diferentes. */
export const DIMENSOES_DE_ACESSIBILIDADE: readonly DimensaoComRotulo[] = [
  { chave: "audio_description", rotulo: "audiodescrição" },
  { chave: "libras", rotulo: "Libras" },
  { chave: "descriptive_subtitle", rotulo: "legenda descritiva" },
  { chave: "closed_caption", rotulo: "closed caption" },
  { chave: "open_caption", rotulo: "legenda aberta" },
  { chave: "simultaneous_translation", rotulo: "tradução simultânea" },
  { chave: "stenotypy", rotulo: "estenotipia" },
  { chave: "subtitle", rotulo: "legenda" },
];

/** Ficha zerada. Note que `declaraAcessibilidade` NÃO mora aqui: as oito em `false` são
 *  «não oferece» e «não declarou» ao mesmo tempo, e é exatamente essa ambiguidade que o
 *  campo separado existe para desfazer (D-43). */
export function acessibilidadeVazia(): Acessibilidade {
  return {
    audio_description: false,
    libras: false,
    descriptive_subtitle: false,
    closed_caption: false,
    open_caption: false,
    simultaneous_translation: false,
    stenotypy: false,
    subtitle: false,
  };
}

export function algumaDimensaoMarcada(a: Acessibilidade): boolean {
  return DIMENSOES_DE_ACESSIBILIDADE.some((d) => a[d.chave]);
}

export const FRASE_DO_ATO_DE_DECLARAR =
  "«Declaro que não oferece» é um ATO, e por isso tem peso igual ao de salvar: sem ele, " +
  "oito caixas desmarcadas seriam lidas como «não declarou», e a plataforma se proibiu de " +
  "interpretar silêncio.";

// ---------------------------------------------------------------------------
// O rascunho do produtor — o registro que a jornada escreve
// ---------------------------------------------------------------------------

/** Um vínculo de elenco. `papel` é OBRIGATÓRIO porque a aresta `atua_em` o exige — o tipo
 *  obriga, e a tela obriga junto, senão a validação vira decoração. */
export interface VinculoDeElenco {
  agenteId: string;
  /** Denormalizado de propósito: o cliente não tem o grafo para resolver o id. */
  agenteTitulo: string;
  /** `pessoa` | `coletivo`. String e não `ClasseEntidade` para o DTO ficar de primitivo. */
  agenteClasse: string;
  papel: string;
  /** `true` quando o agente não existe na Enciclopédia e foi proposto — porta 1. */
  proposto: boolean;
}

export interface TemporadaDoRascunho {
  id: string;
  espacoId: string | null;
  espacoTitulo: string | null;
  /** AAAA-MM-DD. */
  inicio: string;
  /** AAAA-MM-DD. */
  fim: string;
  /** Exposição e ocupação: vigência própria, sem grade de sessões diárias (162). */
  longaDuracao: boolean;
  /** `true` quando o espaço foi pedido à Organização e ainda não existe — porta 2. */
  espacoPedido: boolean;
}

export interface OcorrenciaDoRascunho {
  id: string;
  temporadaId: string;
  /** AAAA-MM-DDTHH:mm — a sessão tem hora, a temporada não. */
  inicio: string;
  espacoId: string | null;
  gratuito: boolean;
  preco: number | null;
  esgotado: boolean;
  /** Cancelada é diferente de removida: o histórico e o alerta dependem dela existir. */
  cancelada: boolean;
  /** Obrigatório quando `cancelada` — cancelamento sem motivo não dispara alerta útil. */
  motivoDoCancelamento: string | null;
}

/**
 * O registro completo que o produtor escreve, do rascunho ao envio.
 *
 * SÓ PRIMITIVO, ARRAY E OBJETO LITERAL. Nenhuma `Entidade` mora aqui, e é isso que o
 * torna serializável em `localStorage` e transportável como DTO do servidor para o cliente
 * sem violar DP-F.
 */
export interface RascunhoDoProdutor {
  /** `"evento:produtor:<seq>"` — `seq` determinístico, nunca sorteado. */
  id: string;
  situacao: Situacao;

  // ato 1 — identidade
  titulo: string;
  resumo: string;
  /** Ids do vocabulário controlado. Rótulo digitado livre vira proposta — porta 3. */
  linguagens: string[];
  temas: string[];
  /** Termos digitados fora do vocabulário, aguardando o Editor. */
  termosPropostos: string[];
  imagem: string | null;
  /** OBRIGATÓRIO quando `imagem !== null`: imagem sem crédito não valida (165). */
  creditoImagem: string | null;

  // ato 2-3 — obra e elenco
  obraId: string | null;
  obraTitulo: string | null;
  /** `true` quando a obra foi proposta à moderação e ainda não existe — porta 1. */
  obraProposta: boolean;
  elenco: VinculoDeElenco[];

  // ato 4-5 — espaço e temporada
  temporadas: TemporadaDoRascunho[];

  // ato 6 — ocorrências
  ocorrencias: OcorrenciaDoRascunho[];

  // ato 7 — acessibilidade
  acessibilidade: Acessibilidade;
  /** O ATO de preencher a ficha, não o conteúdo dela (D-43). */
  declaraAcessibilidade: boolean;

  // ato 8 — comercial e classificação
  faixaEtaria: FaixaEtaria | null;
  canalIngresso: CanalIngresso | null;
  /** URL quando o canal é link externo; instrução em texto puro quando é inscrição. */
  linkDeIngresso: string | null;
  inscricao: string | null;

  // carimbos — sistema, nunca digitáveis
  procedencia: typeof PROCEDENCIA_DO_PRODUTOR;
  /** A organização a que o produtor pertence. É ela o agente realizador da chave. */
  fonte: string;
  /** Calculada, nunca digitada. Ver `chaveDoEvento`. */
  chaveIdentidade: string;
  autor: string;
  /** AAAA-MM-DD — sempre `DATA_DE_REFERENCIA`, nunca o relógio de quem avalia. */
  enviadoEm: string | null;
  historico: EntradaDeHistorico[];
  pendencias: Pendencia[];
  /** O motivo que a moderação escreveu ao devolver. Só em `devolvido`. */
  motivoDaDevolucao: string | null;
}

// ---------------------------------------------------------------------------
// A cadeia de identidade — §6 da ontologia
// ---------------------------------------------------------------------------

export interface ComponenteDaChave {
  campo: string;
  rotulo: string;
  /** O valor que este rascunho dá ao componente. String vazia = não preenchido. */
  valor: string;
  sustentado: boolean;
}

const SEM_VALOR = "—";
const SEPARADOR = "|";
/** O separador que a chave do nível de cima usa quando embutida na de baixo. */
const SEPARADOR_EMBUTIDO = "/";

/**
 * `evento = título normalizado + agente realizador + obra`.
 *
 * A MESMA `normalizar` do índice de busca e do aviso de duplicata da tela de publicar.
 * Uma normalização própria aqui faria o Studio gravar chave que a fila de duplicatas não
 * reconhece, e a fila passaria a acusar o próprio Studio.
 *
 * O agente realizador é a ORGANIZAÇÃO do produtor, e é por isso que ele não é campo de
 * formulário: quem publica é quem realiza, e deixar isso digitável abriria a porta para um
 * produtor declarar realização alheia.
 */
export function chaveDoEvento(
  titulo: string,
  agenteRealizador: string,
  obra: string | null,
): { chave: string; componentes: ComponenteDaChave[] } {
  const t = normalizar(titulo);
  const a = normalizar(agenteRealizador);
  const o = obra ? normalizar(obra) : "";
  return {
    chave: ["evento", t || SEM_VALOR, a || SEM_VALOR, o || SEM_VALOR].join(SEPARADOR),
    componentes: [
      { campo: "titulo", rotulo: "mesmo título normalizado", valor: t, sustentado: t.length > 0 },
      { campo: "agente", rotulo: "mesmo agente realizador", valor: a, sustentado: a.length > 0 },
      { campo: "obra", rotulo: "mesma obra", valor: o, sustentado: o.length > 0 },
    ],
  };
}

/**
 * A chave do nível de cima, embutida na de baixo SEM os separadores dela.
 *
 * É o que torna a chave contável. Sem a troca, `temporada|evento|t|a|o|espaco|intervalo`
 * teria sete campos e ninguém conseguiria dizer, olhando, quantos dos TRÊS componentes
 * daquele nível estão preenchidos — e é exatamente essa contagem que a P8 exibe e que o
 * portão da suíte confere.
 */
function embutir(chaveDoPai: string): string {
  return chaveDoPai.split(SEPARADOR).join(SEPARADOR_EMBUTIDO);
}

/** `temporada = evento + espaço + intervalo`. Três componentes próprios, sempre. */
export function chaveDaTemporada(
  chaveDoEventoCalculada: string,
  espacoId: string | null,
  inicio: string,
  fim: string,
): string {
  const intervalo = inicio && fim ? `${inicio}..${fim}` : SEM_VALOR;
  return [
    "temporada",
    embutir(chaveDoEventoCalculada),
    espacoId ?? SEM_VALOR,
    intervalo,
  ].join(SEPARADOR);
}

/**
 * `ocorrência = temporada + início exato + espaço`.
 *
 * TRÊS PARTES, SEMPRE. Uma chave de ocorrência que caísse para duas partes gravaria
 * registro sem identidade, e a deduplicação voltaria a ser parecença de texto.
 */
export function chaveDaOcorrencia(
  chaveDaTemporadaCalculada: string,
  inicio: string,
  espacoId: string | null,
): string {
  return [
    "ocorrencia",
    embutir(chaveDaTemporadaCalculada),
    inicio || SEM_VALOR,
    espacoId ?? SEM_VALOR,
  ].join(SEPARADOR);
}

/**
 * Quantos dos três componentes do PRÓPRIO nível a chave preenche. O portão da suíte e o
 * quadro de conversão da P8 contam por aqui.
 *
 * O primeiro campo é a etiqueta do nível (`evento`, `temporada`, `ocorrencia`) e não conta:
 * ela diz o que a chave é, não o que ela afirma sobre o mundo.
 */
export function partesDaChave(chave: string): number {
  return chave
    .split(SEPARADOR)
    .slice(1)
    .filter((p) => p.length > 0 && p !== SEM_VALOR).length;
}

// ---------------------------------------------------------------------------
// Score de qualidade (164) — o que falta, NOMEADO
// ---------------------------------------------------------------------------

export interface ItemDoScore {
  chave: string;
  rotulo: string;
  /** Falta obrigatória impede o envio; falta opcional só derruba o score. */
  obrigatorio: boolean;
  ok: boolean;
  /** A tela onde se resolve — um score que aponta o que falta sem dizer onde é enigma. */
  rota: string;
}

export interface Score {
  score: number;
  itens: ItemDoScore[];
  faltando: string[];
  /** O que impede o envio, se algo impede. */
  impedimentos: string[];
  podeEnviar: boolean;
}

/**
 * O score do próprio cadastro, com o que falta nomeado e endereçado.
 *
 * OS OBRIGATÓRIOS SÃO OS DA ONTOLOGIA, não os do gosto de quem desenhou a tela: título
 * (componente 1 da chave), crédito quando há imagem (165), papel em todo vínculo de elenco
 * (a aresta `atua_em` o exige), e a ficha de acessibilidade RESOLVIDA — marcada ou
 * declarada ausente, nunca em silêncio (D-43).
 */
export function scoreDoRascunho(r: RascunhoDoProdutor): Score {
  const temImagem = r.imagem !== null && r.imagem !== "";
  const elencoComPapel =
    r.elenco.length > 0 && r.elenco.every((v) => v.papel.trim().length > 0);

  const itens: ItemDoScore[] = [
    {
      chave: "titulo",
      rotulo: "título",
      obrigatorio: true,
      ok: r.titulo.trim().length >= 3,
      rota: "/studio/publicar/",
    },
    {
      chave: "resumo",
      rotulo: "resumo",
      obrigatorio: false,
      ok: r.resumo.trim().length >= 20,
      rota: "/studio/publicar/",
    },
    {
      chave: "linguagens",
      rotulo: "linguagem",
      obrigatorio: false,
      ok: r.linguagens.length > 0,
      rota: "/studio/publicar/",
    },
    {
      chave: "credito",
      rotulo: "crédito da imagem",
      obrigatorio: true,
      ok: !temImagem || (r.creditoImagem ?? "").trim().length > 0,
      rota: "/studio/publicar/",
    },
    {
      chave: "obra",
      rotulo: "obra — componente 3 da chave",
      obrigatorio: false,
      ok: r.obraId !== null,
      rota: "/studio/elenco/",
    },
    {
      chave: "elenco",
      rotulo: "elenco com papel",
      obrigatorio: false,
      ok: elencoComPapel,
      rota: "/studio/elenco/",
    },
    {
      chave: "temporada",
      rotulo: "temporada com intervalo",
      obrigatorio: true,
      ok: r.temporadas.length > 0,
      rota: "/studio/temporada/",
    },
    {
      chave: "espaco",
      rotulo: "espaço declarado",
      obrigatorio: false,
      ok: r.temporadas.length > 0 && r.temporadas.every((t) => t.espacoId !== null),
      rota: "/studio/temporada/",
    },
    {
      chave: "ocorrencias",
      rotulo: "sessões declaradas",
      obrigatorio: true,
      ok: r.ocorrencias.length > 0 || r.temporadas.some((t) => t.longaDuracao),
      rota: "/studio/grade/",
    },
    {
      chave: "acessibilidade",
      rotulo: "ficha de acessibilidade resolvida",
      obrigatorio: true,
      ok: r.declaraAcessibilidade,
      rota: "/studio/acessibilidade/",
    },
    {
      chave: "faixaEtaria",
      rotulo: "faixa etária",
      obrigatorio: false,
      ok: r.faixaEtaria !== null,
      rota: "/studio/comercial/",
    },
    {
      chave: "ingresso",
      rotulo: "canal de ingresso",
      obrigatorio: false,
      ok: r.canalIngresso !== null,
      rota: "/studio/comercial/",
    },
  ];

  const ok = itens.filter((i) => i.ok);
  return {
    score: Math.round((ok.length / itens.length) * 100),
    itens,
    faltando: itens.filter((i) => !i.ok).map((i) => i.rotulo),
    impedimentos: itens.filter((i) => !i.ok && i.obrigatorio).map((i) => i.rotulo),
    podeEnviar: itens.every((i) => i.ok || !i.obrigatorio),
  };
}

/**
 * As pendências de porta, RECALCULADAS a partir do próprio registro.
 *
 * Elas não são um campo que alguém marca: são consequência do que está gravado. Guardar a
 * lista à mão faria a tela mostrar pendência de um agente que já foi reconciliado, e o
 * avaliador veria a plataforma mentindo sobre o próprio estado.
 */
export function pendenciasDoRascunho(r: RascunhoDoProdutor): Pendencia[] {
  const saida: Pendencia[] = [];

  const propostos = r.elenco.filter((v) => v.proposto);
  if (propostos.length > 0) {
    saida.push({
      porta: "moderacao",
      texto: `${propostos.length === 1 ? "1 agente proposto" : `${propostos.length} agentes propostos`} — ${propostos
        .map((v) => v.agenteTitulo)
        .join(", ")}`,
    });
  }
  if (r.obraProposta && r.obraTitulo) {
    saida.push({ porta: "moderacao", texto: `obra proposta — ${r.obraTitulo}` });
  }

  const semEspaco = r.temporadas.filter((t) => t.espacoId === null);
  if (semEspaco.length > 0) {
    saida.push({
      porta: "organizacao",
      texto: semEspaco.some((t) => t.espacoPedido)
        ? `${semEspaco.length === 1 ? "1 temporada aguarda" : `${semEspaco.length} temporadas aguardam`} o cadastro de um espaço`
        : `${semEspaco.length === 1 ? "1 temporada" : `${semEspaco.length} temporadas`} sem espaço declarado`,
    });
  }

  if (r.termosPropostos.length > 0) {
    saida.push({
      porta: "editor",
      texto: `${r.termosPropostos.length === 1 ? "1 termo proposto" : `${r.termosPropostos.length} termos propostos`} — ${r.termosPropostos.join(", ")}`,
    });
  }

  return saida;
}

// ---------------------------------------------------------------------------
// A conversão de procedência — o argumento em números (P8)
// ---------------------------------------------------------------------------

export interface LinhaDeConversao {
  medida: string;
  antes: string;
  depois: string;
  /** `true` quando este envio efetivamente move a medida. */
  convertida: boolean;
}

/**
 * O que ESTE envio converte, medido no próprio rascunho e no acervo.
 *
 * Nenhum número é digitado: `numerosDoAcervo` entra por parâmetro, vindo do módulo que o
 * mede sobre o grafo. Um literal aqui faria a apresentação afirmar, na primeira regeração,
 * número que o acervo não sustenta.
 */
export function conversaoDoEnvio(
  r: RascunhoDoProdutor,
  acervo: { ocorrencias: number; ocorrenciasComEspaco: number; eventosQueDeclaramIngresso: number },
): LinhaDeConversao[] {
  const sessoes = r.ocorrencias.length;
  const comEspaco = r.ocorrencias.filter((o) => o.espacoId !== null).length;
  const { componentes } = chaveDoEvento(r.titulo, r.fonte, r.obraTitulo);
  const sustentados = componentes.filter((c) => c.sustentado).length;
  const elenco = r.elenco.length;

  return [
    {
      medida: "procedência das ocorrências",
      antes: `derivado (${acervo.ocorrencias} de ${acervo.ocorrencias} no acervo)`,
      depois: sessoes > 0 ? `produtor (${sessoes} sessões)` : "nada a converter",
      convertida: sessoes > 0,
    },
    {
      medida: "espaço declarado",
      antes: `${acervo.ocorrenciasComEspaco} de ${acervo.ocorrencias}`,
      depois: `${comEspaco} de ${sessoes}`,
      convertida: comEspaco > 0,
    },
    {
      medida: "ingresso declarado",
      antes: `${acervo.eventosQueDeclaramIngresso} de 300 eventos`,
      depois: r.canalIngresso !== null ? "1 de 1 — declarado" : "não declarado",
      convertida: r.canalIngresso !== null,
    },
    {
      medida: "componentes da chave",
      antes: "1 de 3",
      depois: `${sustentados} de 3`,
      convertida: sustentados > 1,
    },
    {
      medida: "elenco em evento datado",
      antes: "0 de 129 eventos datados",
      depois: elenco > 0 ? `${elenco} vínculos, todos com papel` : "nenhum vínculo",
      convertida: elenco > 0,
    },
    {
      medida: "ficha de acessibilidade",
      antes: "2.702 registros não declaram",
      depois: r.declaraAcessibilidade ? "declarada, inclusive a ausência" : "ainda em silêncio",
      convertida: r.declaraAcessibilidade,
    },
  ];
}

// ---------------------------------------------------------------------------
// Persistência e recálculo — as duas operações que rodam no build E no navegador
// ---------------------------------------------------------------------------

/**
 * A chave versionada do estado da jornada, em `localStorage`.
 *
 * Versionada porque a forma do registro vai mudar entre ondas, e um estado antigo lido com
 * forma nova quebraria a demonstração silenciosamente no navegador de quem já tinha aberto
 * a página — que é pior do que quebrar alto, porque ninguém veria.
 */
export const CHAVE_DE_ARMAZENAMENTO = "studio.v1";

/**
 * Recalcula a chave de identidade e as pendências a partir do próprio registro.
 *
 * VIVE AQUI, no módulo sem import de dado, porque é a MESMA operação no build e no
 * navegador: o servidor a chama na semeadura, o cliente a chama depois de cada edição.
 * Duas implementações fariam a semente e o que o produtor edita gravarem chaves diferentes
 * para o mesmo dado — e a fila de duplicatas passaria a acusar o próprio Studio.
 */
export function comChavesRecalculadas(r: RascunhoDoProdutor): RascunhoDoProdutor {
  const { chave } = chaveDoEvento(r.titulo, r.fonte, r.obraTitulo);
  return { ...r, chaveIdentidade: chave, pendencias: pendenciasDoRascunho(r) };
}

/** A chave de três partes de uma sessão, montada sobre a temporada a que ela pertence. */
export function chaveDaSessao(r: RascunhoDoProdutor, o: OcorrenciaDoRascunho): string {
  const t = r.temporadas.find((x) => x.id === o.temporadaId);
  const daTemporada = chaveDaTemporada(
    r.chaveIdentidade,
    t?.espacoId ?? null,
    t?.inicio ?? "",
    t?.fim ?? "",
  );
  return chaveDaOcorrencia(daTemporada, o.inicio, o.espacoId);
}
