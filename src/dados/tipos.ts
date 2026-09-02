/**
 * tipos.ts — o contrato da ontologia do protótipo.
 *
 * Escrito COMPLETO desde o primeiro plano, incluindo classes que a geração ainda não
 * popula. É este arquivo que permite os planos 01-02 e 01-03 correrem em paralelo sem
 * se esperarem: 01-03 enche o grafo por baixo, 01-02 consome por cima, e nenhum dos
 * dois precisa renegociar assinatura.
 *
 * Referências: PRD §6 (ontologia), D-16 a D-18, DADO-02 a DADO-05.
 */

// ---------------------------------------------------------------------------
// Procedência — D-17 / DADO-05
// ---------------------------------------------------------------------------

/**
 * De onde o dado veio. Sem exceção: toda entidade e toda aresta carrega este campo.
 * - `ic`        — veio do acervo do Itaú Cultural; exige `fonte` com a URL de origem
 * - `derivado`  — calculado a partir de dado `ic` por regra determinística
 * - `autorado`  — escrito à mão para o protótipo, e rotulado como tal na tela
 */
/**
 * De onde o campo veio. O enum do PRD §6 tem seis valores; o protótipo usava três, porque
 * só existiam três fontes. `parceiro` entra em 2026-09 com a ingestão federada — MASP,
 * Pinacoteca e Theatro Municipal raspados — e é o que separa, NA TELA, o que o Itaú
 * Cultural publicou do que um terceiro publicou. Sem ele os dois seriam a mesma coisa,
 * que é o erro exato que a procedência existe para impedir.
 */
export type Procedencia = "ic" | "derivado" | "autorado" | "parceiro";

/** Sistema de onde o identificador de origem foi lido. Compõe o `id`. */
export type OrigemId = "cms" | "enc" | "derivado" | "autorado";

// ---------------------------------------------------------------------------
// Classes da ontologia — PRD §6
// ---------------------------------------------------------------------------

/**
 * As seis camadas da ontologia, achatadas em uma união.
 * Agência: pessoa · coletivo · instituicao
 * Lugar: espaco · territorio
 * Criação: obra · termo
 * Acontecimento: programa · evento · temporada · ocorrencia
 * Conteúdo: conteudo · midia · publicacao · formacao
 * Classificação e público: linguagem · tema · pessoa-usuaria · repertorio · trilha
 */
export type ClasseEntidade =
  | "pessoa"
  | "coletivo"
  | "instituicao"
  | "espaco"
  | "obra"
  | "termo"
  | "programa"
  | "evento"
  | "temporada"
  | "ocorrencia"
  | "conteudo"
  | "midia"
  | "publicacao"
  | "formacao"
  | "linguagem"
  | "tema"
  | "territorio"
  | "pessoa-usuaria"
  | "repertorio"
  | "trilha";

/** Vocabulário fechado de relações — PRD §6. Nada fora desta lista vira aresta. */
export type Relacao =
  | "influenciou"
  | "dialoga_com"
  | "deriva_de"
  | "pertence_a"
  | "atua_em"
  | "curou"
  | "realiza"
  | "ocorre_em"
  | "situado_em"
  | "aprofunda"
  | "fala_sobre"
  | "contextualiza"
  | "semelhante_a"
  | "duplicata_suspeita";

// ---------------------------------------------------------------------------
// Acessibilidade — as 8 dimensões do CMS
// ---------------------------------------------------------------------------

export interface Acessibilidade {
  audio_description: boolean;
  libras: boolean;
  descriptive_subtitle: boolean;
  closed_caption: boolean;
  open_caption: boolean;
  simultaneous_translation: boolean;
  stenotypy: boolean;
  subtitle: boolean;
}

/** Nome da dimensão, para iterar sem repetir a lista literal em cada tela. */
export type DimensaoAcessibilidade = keyof Acessibilidade;

// ---------------------------------------------------------------------------
// Entidade
// ---------------------------------------------------------------------------

/**
 * Coordenada geográfica derivada (D-19, D-20).
 *
 * Nunca vem da fonte: o acervo traz nome de cidade e de espaço, não latitude. Por isso
 * `procedencia` é sempre `"derivado"` e `metodo` diz COMO foi obtida — o mapa exibe
 * isso na legenda, porque a honestidade do dado é argumento da proposta.
 */
export type MetodoCoordenada =
  | "centroide-municipio"
  | "centroide-estado"
  | "centroide-pais"
  | "deslocamento-por-espaco";

export interface Coordenada {
  lat: number;
  lon: number;
  procedencia: "derivado";
  metodo: MetodoCoordenada;
}

/**
 * Nó do grafo.
 *
 * `id` segue o formato `"{classe}:{origem}:{idOrigem}"` — ex.: `evento:cms:13913`,
 * `pessoa:enc:26400`. O formato é contrato: as fases 2 a 6 fazem parse dele.
 */
export interface Entidade {
  id: string;
  classe: ClasseEntidade;
  titulo: string;
  slug: string;
  /** Texto puro. Nenhum HTML atravessa a fronteira do gerador (T-01-02). */
  resumo?: string;
  imagem?: string;
  creditoImagem?: string;
  /** Ids de linguagem do vocabulário controlado, não rótulos livres. */
  linguagens: string[];
  temas: string[];
  acessibilidade: Acessibilidade;
  /**
   * O registro de origem preencheu a ficha das 8 dimensões? É este campo, e nada dentro
   * do booleano, que separa «declarado ausente» de «não declarado» (D-43): em
   * `acessibilidade` um `false` significa as duas coisas ao mesmo tempo.
   *
   * OBRIGATÓRIO, e não opcional de propósito. Campo ausente teria de ser lido como «não
   * declarou», e ler ausência como declaração é o erro exato que D-43 existe para não
   * cometer — o campo que registra se houve declaração não pode depender de ausência.
   */
  declaraAcessibilidade: boolean;
  procedencia: Procedencia;
  /** Obrigatória quando `procedencia === "ic"`. */
  fonte?: string;
  /** Critério de identidade da ontologia (D-22). O Studio deduplica por aqui. */
  chaveIdentidade?: string;
  /** Presente em espaço e território, e em nada mais. Sempre `derivado` (D-20). */
  coordenada?: Coordenada;
  /** Id da entidade `ic` de onde este nó `derivado` foi extraído. */
  derivadoDe?: string;
  /** Só nas duplicatas do Cenário 3: id do original que este clone viola (D-22). */
  clonadoDe?: string;
  /** Nome legível da variação aplicada ao clone. Renderizado literalmente no Studio. */
  variacao?: string;
  /** O que é específico de classe e não merece campo próprio no nó genérico. */
  extra?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Aresta
// ---------------------------------------------------------------------------

/**
 * Ligação dirigida entre dois nós.
 *
 * Dois campos são condicionais e o gerador os trata como invariante, não como
 * item a preencher depois:
 * - `papel`  obrigatório quando `relacao === "atua_em"` (DADO-03 — o papel mora
 *            na aresta e nunca vira classe própria)
 * - `motivo` obrigatório quando `relacao === "semelhante_a"` (DADO-04, D-18 —
 *            em português legível, é o que a tela "Por que isto apareceu" mostra)
 */
export interface Aresta {
  de: string;
  para: string;
  relacao: Relacao;
  procedencia: Procedencia;
  peso?: number;
  papel?: string;
  motivo?: string;
}

/** Um salto de um caminho, já com as duas pontas resolvidas em entidades. */
export interface Passo {
  de: Entidade;
  para: Entidade;
  relacao: Relacao;
  motivo?: string;
  papel?: string;
}

// ---------------------------------------------------------------------------
// Acontecimento — DADO-02
// ---------------------------------------------------------------------------

/**
 * Evento é o que acontece; Temporada é o recorte com começo, fim e espaço; Ocorrência
 * é a sessão datada. As três são registros próprios, com id próprio e nó no grafo —
 * colapsá-las num array aninhado dentro do evento é o erro que faz agenda cultural
 * virar catálogo (DADO-02).
 */
export interface Temporada {
  id: string;
  eventoId: string;
  espacoId?: string | null;
  /** Data ISO (YYYY-MM-DD). */
  inicio: string;
  /** Data ISO (YYYY-MM-DD). */
  fim: string;
  /**
   * `ic` quando o intervalo veio do `periodo` do CMS ou do `locais[]` da Enciclopédia
   * — reestruturar campo existente não é derivar. `derivado` só nas duplicatas.
   */
  procedencia: Procedencia;
  fonte?: string | null;
  /** O texto de data exatamente como a Enciclopédia escreveu ("05.11.1826", "1978"). */
  dataDeclarada?: string | null;
}

/**
 * Sessão datada. SEMPRE `derivado`: o campo `schedules` do CMS está vazio em 100% dos
 * 100 eventos, então nenhuma ocorrência existe em sistema nenhum do IC. Ela é o
 * resultado da regra determinística de D-21 aplicada ao período real.
 */
export interface Ocorrencia {
  id: string;
  temporadaId: string;
  eventoId: string;
  /** Datetime ISO completo — a sessão tem hora, a temporada não. */
  inicio: string;
  espacoId?: string | null;
  /** Sempre `null`: a fonte só tem o booleano de ingresso, nunca o valor. */
  preco?: number | null;
  gratuito: boolean;
  esgotado: boolean;
  acessibilidade: Acessibilidade;
  /** Herdado do evento: a sessão não declara nada por conta própria. */
  declaraAcessibilidade: boolean;
  procedencia: Procedencia;
  derivadoDe?: string;
  /** D-22: temporada | início exato em ISO | espaço. */
  chaveIdentidade: string;
}

/** Forma de `src/dados/gerado/ocorrencias.json` — arquivo à parte, indexado por evento. */
export type OcorrenciasPorEvento = Record<string, Ocorrencia[]>;

// ---------------------------------------------------------------------------
// Artefatos gerados
// ---------------------------------------------------------------------------

/**
 * Entrada do vocabulário controlado de linguagens.
 * `cor` guarda o NOME DO TOKEN CSS (`"--ic-lilas"`), nunca o hex — o hex tem uma
 * fonte de verdade só, que é `globals.css`. A cor da linguagem é dado, não estilo (D-08).
 */
export interface LinguagemVocabulario {
  id: string;
  rotulo: string;
  cor: string;
  ocorrencias: number;
  /**
   * `true` quando o rótulo veio da Enciclopédia e não existe no vocabulário
   * controlado de 29 do CMS. Promover é fiel; encaixar à força seria fabricar.
   */
  promovida: boolean;
  fonte: string;
}

/** Assunto. Tag livre do CMS — não existe vocabulário controlado de tema na fonte. */
export interface TemaVocabulario {
  id: string;
  rotulo: string;
  ocorrencias: number;
  fonte: string;
}

/** Forma de `src/dados/gerado/vocabulario.json`. */
export interface Vocabulario {
  linguagens: LinguagemVocabulario[];
  temas: TemaVocabulario[];
}

export interface MetaGrafo {
  geradoEm: string;
  grauHub: number;
  fanoutSemelhante: number;
  /** Fanout realmente aplicado; cai abaixo do teto quando a fonte é grande (T-02-03). */
  fanoutEfetivo: number;
  fontes: {
    cms: string[];
    taxonomia: string[];
    enciclopedia: Array<{ fonte: string; lidos: number; novos: number; ausente?: boolean }>;
    imagens: string | null;
  };
  totais: { entidades: number; arestas: number; linguagens: number; temas: number };
  porClasse: Record<string, number>;
  porProcedencia: Record<string, number>;
  porRelacao: Record<string, number>;
  porProcedenciaDeAresta: Record<string, number>;
  /**
   * Quantas entidades `ic` DECLARAM cada uma das 8 dimensões. Quase todas ficam em
   * zero, e isso é a fonte, não o gerador.
   */
  acessibilidade: Record<DimensaoAcessibilidade, number>;
  /** A mesma contagem incluindo ocorrência e temporada, que herdam do evento. */
  acessibilidadeIncluindoDerivadas: Record<DimensaoAcessibilidade, number>;
  /**
   * Quantas entidades PREENCHERAM a ficha, independentemente de terem marcado algum
   * recurso. É o denominador que falta às duas contagens acima: sem ele, uma dimensão em
   * zero não distingue «ninguém oferece» de «ninguém preencheu».
   */
  fichaDeAcessibilidade: {
    declaram: number;
    naoDeclaram: number;
    declaramPorClasse: Record<string, number>;
  };
  cobertura: {
    imagens: {
      disponivel: boolean;
      arquivos: number;
      presentes: number;
      chavesRejeitadas: number;
      exemplosRejeitados: string[];
      donosDesconhecidos: number;
    };
    entidadesComImagemLocal: number;
    slugsDesambiguados: number;
    linguagensPromovidas: string[];
    aliasDeLinguagem: Record<string, string>;
    [chave: string]: unknown;
  };
  concentradores: {
    limiar: number;
    total: number;
    maiores: Array<{ id: string; grau: number }>;
  };
}

/** Retorno de `contagens()` — usado pelo smoke e pelo Observatório (fase 5). */
export interface Contagens {
  porClasse: Record<string, number>;
  porProcedencia: Record<string, number>;
}

/** Um vizinho já resolvido: a aresta que levou até ele e a entidade em si. */
export interface Vizinho {
  aresta: Aresta;
  entidade: Entidade;
}

/** Janela temporal fechada, em datas ISO. */
export interface Janela {
  de: string;
  ate: string;
}
