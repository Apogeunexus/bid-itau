/**
 * tipos.ts — o contrato do motor de pontos.
 *
 * REGRA INVARIANTE: nenhuma tela escreve estado direto. Toda interação emite um
 * `EventoDeAtividade` e o resto é consequência — regra → concessão → linha de livro
 * → saldo derivado → efeito visual. Uma tela que fizesse `saldo += 10` quebraria a
 * única coisa que dá valor a este motor, que é conseguir responder *por que* alguém
 * tem 840 de percurso, linha por linha.
 *
 * A QUARTA PROCEDÊNCIA. O acervo tem `ic`, `derivado` e `autorado` (`dados/tipos.ts`),
 * e nenhuma delas descreve um ponto: ponto não sai do acervo, sai do USO. Por isso o
 * motor guarda a origem de cada linha (`eventoOrigemId`, `regraId`, `regraVersao`) em
 * vez de herdar a procedência do acervo. A promessa da proposta continua de pé — nada
 * é afirmado sem fonte —, só que a fonte aqui é o gesto da pessoa, não o CMS.
 */

/* ── Os três ativos, e por que não é um só ───────────────────────────────── */

/**
 * `ficha`     — a moeda. Entra pelo uso, SAI na loja. É a única que debita.
 * `percurso`  — o quanto se andou. NUNCA debita e define o nível: se o resgate
 *               fizesse o nível cair, a loja puniria quem usa a loja.
 * `reputacao` — o quanto se contribuiu para os outros. Não compra nada; abre
 *               poder dentro do produto (propor trilha, destacar publicação).
 */
export type Ativo = "ficha" | "percurso" | "reputacao";

/* ── O evento: a unidade fundamental ─────────────────────────────────────── */

/**
 * Os nomes de evento do domínio cultural. Lista fechada de propósito — evento com
 * nome livre vira regra que nunca dispara e ninguém descobre por quê.
 *
 * A regra de corte: só entra aqui gesto que a PLATAFORMA OBSERVA. «Concluiu» é
 * observável (o player chegou ao fim); «gostou» não é. `presenca.confirmada` é o
 * único que vem de fora, e vem por código que o produtor gera no Studio — não por
 * autodeclaração.
 */
export type NomeDeEvento =
  | "play.midia.concluida"
  | "cast.episodio.concluido"
  | "leitura.materia.concluida"
  | "curso.aula.concluida"
  | "curso.concluido"
  | "ocorrencia.salva"
  | "ocorrencia.presenca.confirmada"
  | "acesso.dia.distinto"
  | "comunidade.publicacao.salva"
  | "comunidade.comentario.criado"
  | "comunidade.reacao.dada"
  | "comunidade.assinada"
  | "loja.resgate.efetuado"
  | "perfil.disposicoes.escolhidas";

/**
 * O contexto que a tela anexa ao evento. Os dois primeiros campos são o coração
 * da mecânica: eles são o que liga a economia à tese da proposta.
 */
export interface ContextoDeEvento {
  /**
   * O item concluído é de uma linguagem que esta pessoa ainda não tinha atravessado.
   * Quem responde é `dados/repertorio.ts`, que já calcula `linguagensNovas` — a
   * economia não recalcula travessia, ela LÊ o mesmo número que o Observatório
   * publica. Duas contas para a mesma coisa seria a garantia de divergirem.
   */
  linguagemNova?: string;
  /** Idem para território: o item é de uma UF que a pessoa ainda não alcançou. */
  territorioNovo?: string;
  /** Rótulo humano do item, para a linha do extrato dizer o que foi. */
  rotulo?: string;
  [chave: string]: unknown;
}

export interface EventoDeAtividade {
  eventoId: string;
  /** Persona ativa. NÃO é usuário: não há autenticação (D-25). */
  personaId: string;
  nome: NomeDeEvento;
  ocorridoEm: number;
  /** O que foi tocado — `{ tipo: "midia", id: "slug-da-serie" }`. */
  alvo?: { tipo: string; id: string };
  contexto?: ContextoDeEvento;
}

/* ── O livro: fonte da verdade dos saldos ────────────────────────────────── */

/**
 * Append-only. O saldo NUNCA é um número guardado; é soma sobre as linhas. É o que
 * permite a tela do extrato existir sem inventar nada e o Observatório auditar o
 * programa inteiro sem uma segunda fonte que possa discordar da primeira.
 */
export interface LinhaDoLivro {
  id: string;
  personaId: string;
  ativo: Ativo;
  /** Sempre positivo. O sinal mora em `sentido`. */
  valor: number;
  sentido: "credito" | "debito";
  /** Legível na tela: «Documentário concluído», «Resgate: cortesia». */
  motivo: string;
  eventoOrigemId: string;
  regraId?: string;
  regraVersao?: number;
  criadoEm: number;
}

/* ── Regras ──────────────────────────────────────────────────────────────── */

export interface ContextoDeRegra {
  evento: EventoDeAtividade;
  estado: EstadoDoMotor;
}

export type AcaoDeRegra =
  | { conceder: { ativo: Ativo; valor: number; motivo: string } }
  | { debitar: { ativo: Ativo; valor: number; motivo: string } }
  | { avancarMissoes: true }
  | { avaliarSequencia: true }
  | { concederEmblema: { emblemaId: string } };

export interface Regra {
  id: string;
  versao: number;
  /** Frase curta que a tela «Como ganhar» exibe. A regra se explica sozinha. */
  descreve: string;
  quando: NomeDeEvento | NomeDeEvento[];
  se?: (ctx: ContextoDeRegra) => boolean;
  entao: AcaoDeRegra[];
  /** Teto de execuções na vida da persona. */
  maxPorPersona?: number;
  /** Teto diário de integridade — o freio antifraude barato. */
  maxPorDia?: number;
}

/* ── Missões ─────────────────────────────────────────────────────────────── */

export type TipoDeMissao = "diaria" | "semanal" | "temporada" | "social" | "territorio";

export interface MissaoDefinida {
  id: string;
  tipo: TipoDeMissao;
  titulo: string;
  descricao: string;
  alvo: number;
  avancaCom: NomeDeEvento[];
  percurso: number;
  fichas: number;
  /** Minutos estimados. A diária tem que caber em dois. */
  minutos: number;
  expiraEm: "dia" | "semana" | "temporada";
  /** Rota interna que cumpre a missão. Missão sem porta é beco. */
  rota: string;
}

export interface MissaoEmCurso {
  missaoId: string;
  progresso: number;
  concluidaEm?: number;
  /** Período em que este progresso vale. Vira o período, o progresso zera. */
  chaveDoPeriodo: string;
}

/* ── Sequência ───────────────────────────────────────────────────────────── */

/**
 * O fluxo de perda NUNCA é «faltou → zero». É segura → em risco → carência →
 * congelada (se houver proteção) → quebrada. Zerar de uma vez é o desenho que faz
 * a pessoa desistir no primeiro tropeço, e num app cultural o tropeço é a regra:
 * ninguém vai ao teatro toda semana.
 */
export type FaseDaSequencia = "segura" | "em-risco" | "carencia" | "congelada" | "quebrada";

export interface Sequencia {
  ritmo: "diaria" | "semanal";
  contagem: number;
  melhor: number;
  fase: FaseDaSequencia;
  /** Proteções no inventário. Consome uma ao congelar. */
  protecoes: number;
  /** Marcas do período corrente — 7 casas na semana. */
  marcas: boolean[];
  valeuNestePeriodo: boolean;
  historico: { chaveDoPeriodo: string; manteve: boolean; congelada?: boolean }[];
}

/* ── Emblemas ────────────────────────────────────────────────────────────── */

export interface EmblemaDefinido {
  id: string;
  titulo: string;
  descricao: string;
  /** `"sequencia_4"`, `"nivel_3"`, `"linguagens_8"`, `"presencas_1"`. */
  criterio: string;
  /** Como ganhar, dito na tela. Emblema misterioso é enfeite, não meta. */
  comoGanhar: string;
}

export interface EmblemaConcedido {
  emblemaId: string;
  concedidoEm: number;
}

/* ── Comunidade ──────────────────────────────────────────────────────────── */

/**
 * Uma comunidade É UMA ENTIDADE DO GRAFO com canal aberto — instituição, coletivo
 * ou produtor que o acervo já reconhece. Não se cria comunidade do nada aqui: o
 * `entidadeId` é a amarra que impede o marketplace de virar uma lista de nomes
 * inventados ao lado de um acervo com procedência.
 */
export interface ComunidadeDefinida {
  id: string;
  /** Id canônico no grafo (`"instituicao:ic:123"`), ou `null` na oficial do IC. */
  entidadeId: string | null;
  nome: string;
  descricao: string;
  /** `oficial` é a do Itaú Cultural; as outras são do marketplace. */
  natureza: "oficial" | "instituicao" | "coletivo" | "produtor";
  /** UF de origem — o marketplace ordena por território, não por tamanho. */
  uf?: string;
  linguagens: string[];
  assinantes: number;
}

export interface ComentarioDefinido {
  autorId: string;
  corpo: string;
  reacoes?: number;
  quandoRotulo?: string;
  respostas?: ComentarioDefinido[];
}

export interface PublicacaoDefinida {
  id: string;
  comunidadeId: string;
  autorId: string;
  titulo: string;
  corpo: string;
  etiqueta?: string;
  /** Capa do acervo. Toda publicação tem uma — nenhuma cena inventada. */
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
  reacoes: number;
  comentarios: ComentarioDefinido[];
  diasAtras: number;
  /** Publicação do próprio Itaú Cultural. */
  oficial?: boolean;
  enquete?: { opcoes: { rotulo: string; pct: number }[] };
}

export interface PessoaDaComunidade {
  id: string;
  nome: string;
  /** Avatar é monograma em CSS, nunca foto — não temos foto de ninguém real. */
  monograma: string;
  cidade: string;
  uf: string;
}

/* ── Loja ────────────────────────────────────────────────────────────────── */

export type FamiliaDeRecompensa =
  | "acesso"
  | "editorial"
  | "bastidor"
  | "poder"
  | "devolver";

export interface RecompensaDefinida {
  id: string;
  familia: FamiliaDeRecompensa;
  titulo: string;
  descricao: string;
  custo: number;
  /** `null` = sem limite (as famílias `poder` e `devolver` não têm estoque). */
  estoque: number | null;
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
  /** O que a pessoa recebe de fato, dito antes do resgate. */
  entrega: "presencial" | "digital" | "correio" | "no-produto";
}

export type FaseDoResgate =
  | "resgatado"
  | "processando"
  | "separado"
  | "enviado"
  | "entregue";

export interface Resgate {
  id: string;
  recompensaId: string;
  fase: FaseDoResgate;
  em: number;
}

/* ── Efeitos ─────────────────────────────────────────────────────────────── */

export type EfeitoDoMotor =
  | { tipo: "concessao"; ativo: Ativo; valor: number; motivo: string }
  | { tipo: "subiuDeNivel"; nivel: number; nome: string }
  | { tipo: "emblema"; emblema: EmblemaDefinido }
  | { tipo: "missaoConcluida"; missao: MissaoDefinida }
  | { tipo: "metaDaSemanaFechada"; feitas: number }
  | { tipo: "sequenciaEstendida"; contagem: number }
  | { tipo: "sequenciaEmRisco" }
  | { tipo: "sequenciaCongelada" }
  | { tipo: "sequenciaQuebrada"; perdida: number }
  | { tipo: "linguagemNova"; linguagem: string }
  | { tipo: "territorioNovo"; uf: string }
  | { tipo: "resgateFeito"; recompensa: RecompensaDefinida }
  | { tipo: "tetoAtingido"; oQue: string };

/* ── Rastro — o que a tela «Como ganhar» e o Observatório leem ───────────── */

export interface Rastro {
  evento: EventoDeAtividade;
  dispararam: { regraId: string; versao: number; descreve: string }[];
  ignoradas: { regraId: string; motivo: string }[];
  linhas: LinhaDoLivro[];
  efeitos: EfeitoDoMotor[];
}

/* ── Estado ──────────────────────────────────────────────────────────────── */

export interface EstadoDoMotor {
  personaId: string;
  agora: number;
  livro: LinhaDoLivro[];
  missoes: Record<string, MissaoEmCurso>;
  sequencia: Sequencia;
  emblemas: EmblemaConcedido[];
  resgates: Resgate[];
  /** Publicações do feed vivo — as minhas entram aqui no topo. */
  publicacoes: PublicacaoDefinida[];
  /** Ids das comunidades que esta persona assina. */
  assinadas: string[];
  /** Ids das publicações guardadas para ler depois. */
  publicacoesSalvas: string[];
  reacoesDadas: Record<string, number>;
  presencas: string[];
  /** Linguagens já atravessadas, para o bônus não pagar duas vezes. */
  linguagensAlcancadas: string[];
  ufsAlcancadas: string[];
  /** Dias distintos de acesso já contados. */
  diasDistintos: string[];
  execucoesPorRegra: Record<string, number>;
  execucoesHoje: Record<string, number>;
  /** `"evento:tipo:id"` já pontuado — o freio de item repetido, em `motor.ts`. */
  itensPontuados: Record<string, true>;
  ultimoRastro?: Rastro;
  sequenciaDeEventos: number;
}

/* ── Configuração do programa ────────────────────────────────────────────── */

export interface ConfiguracaoDoPrograma {
  nome: string;
  /** Como a moeda se chama na tela. Trocar o nome do programa é trocar isto. */
  termos: { ficha: string; fichaPlural: string; percurso: string; nivel: string };
  nomesDeNivel: string[];
  /** Percurso acumulado para ENTRAR em cada nível. Índice 0 é sempre 0. */
  limiaresDeNivel: number[];
  temporada: { titulo: string; descricao: string; diasRestantes: number };
  /** Bônus por atravessar linguagem/território novo. O coração da mecânica. */
  bonus: { linguagemNova: number; territorioNovo: number };
}

export interface DadosDoPrograma {
  config: ConfiguracaoDoPrograma;
  regras: Regra[];
  missoes: MissaoDefinida[];
  emblemas: EmblemaDefinido[];
  recompensas: RecompensaDefinida[];
  comunidades: ComunidadeDefinida[];
  publicacoes: PublicacaoDefinida[];
  pessoas: PessoaDaComunidade[];
}
