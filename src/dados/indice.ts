/**
 * indice.ts — o índice ÚNICO de busca sobre o grafo (AGEN-06, D-63).
 *
 * D-63 exige um índice só, misturando tipos, com o tipo etiquetado em cada resultado.
 * Isso não é otimização: uma busca que devolvesse apenas eventos transformaria a proposta
 * numa agenda, que é exatamente o anti-objetivo contra o qual ela foi escrita. Por isso a
 * regra deste arquivo, quando o peso apertar, é REDUZIR CAMPO E NUNCA CLASSE — tirar
 * `conteudo` para caber devolveria bytes e destruiria o requisito, e ninguém perceberia
 * até a banca buscar um termo que só existe naquela classe.
 *
 * SEM BIBLIOTECA DE BUSCA (D-63). O motor abaixo é filtro linear em memória sobre vetores
 * paralelos. Nenhum pacote foi instalado nesta fase — instalar acionaria a auditoria de
 * legitimidade de pacote que a fase não fez.
 *
 * ---------------------------------------------------------------------------
 * DP-F — POR QUE ESTE ARQUIVO NÃO IMPORTA `./grafo`
 * ---------------------------------------------------------------------------
 * `consultar` roda NO CLIENTE: é ela que refaz o recorte a cada tecla, e é ela que o
 * plano 03-06 (busca em linguagem natural) importa para incidir os critérios traduzidos
 * sobre o MESMO conjunto. Se este módulo importasse `./grafo`, estática ou dinamicamente,
 * os 9,4 MB de `entidades.json` e os 13,6 MB de `arestas.json` entrariam no grafo de
 * módulos do navegador — de uma vez, ou como chunk assíncrono que fica no disco
 * exportado. As duas saídas violam DP-F, que proíbe o alcance ao grafo INCLUSIVE
 * transitivamente.
 *
 * A saída é a mesma que `disposicoes.ts` usou na fase 2 com `ContextoPredicado`: o acervo
 * chega INJETADO. `montarIndice(fonte)` recebe as funções públicas de `grafo.ts` e roda no
 * build, dentro do componente de servidor de `/buscar`; `consultar` opera sobre o DTO já
 * montado e não conhece o grafo. D-47 continua respeitada — a leitura passa por
 * `slugsPorTipo`, `porSlug` e `vizinhos`, nunca por array cru.
 *
 * ---------------------------------------------------------------------------
 * A FORMA COLUNAR, E POR QUE ELA
 * ---------------------------------------------------------------------------
 * Medido nas 5.092 entidades indexáveis: uma lista de objetos com id, classe, título,
 * slug, linguagens e procedência pesa 515 KB; a mesma com resumo truncado em 120
 * caracteres pesa 855 KB. O resumo NÃO ENTRA — é caro demais para um campo que o
 * resultado não mostra, e continua disponível na página da entidade.
 *
 * O que entra é colunar com tabelas internadas: classe, procedência, território, imagem,
 * linguagem e tema viram índices de tabela codificados em base 36, um caractere por
 * entrada. Sobram só dois campos de texto — título e slug — e o slug é ELIDIDO quando
 * pode ser derivado do título pela mesma regra determinística que `slugDoTitulo`
 * aplica, o que apaga cerca de dois terços dele.
 *
 * O TÍTULO NORMALIZADO NÃO VIAJA, e essa é a redução de CAMPO prevista em plano: ele
 * pesa 210 KB medidos, o mesmo que o título inteiro, e é reconstruível no cliente em uma
 * passada com `normalizar` — a MESMA função das duas pontas. Duas normalizações
 * diferentes é o defeito que produz «não encontrei» para um termo que está no índice, e
 * é por isso que existe uma função só, exportada.
 */

import type { ClasseEntidade, Entidade, Procedencia, Relacao, Vizinho } from "./tipos";

// ---------------------------------------------------------------------------
// O recorte de classes
// ---------------------------------------------------------------------------

/**
 * As 15 classes indexáveis, na ordem de contagem medida no grafo gerado.
 *
 * ESTA LISTA NÃO ENCOLHE POR MOTIVO DE PESO. Se o DTO estourar o teto, corte campo.
 */
export const CLASSES_INDEXAVEIS: readonly ClasseEntidade[] = [
  "conteudo",
  "pessoa",
  "midia",
  "termo",
  "territorio",
  "evento",
  "instituicao",
  "obra",
  "coletivo",
  "espaco",
  "tema",
  "formacao",
  "publicacao",
  "linguagem",
  "trilha",
] as const;

/**
 * As 4 que ficam de fora, e o motivo de cada uma — porque «não indexei» sem motivo é
 * indistinguível de esquecimento.
 *
 * `ocorrencia` e `temporada` são registros de agenda e chegam pelo evento: indexá-las
 * faria a mesma sessão aparecer 2.425 vezes ao lado do evento que a contém.
 * `pessoa-usuaria` e `repertorio` são estado de sessão das personas, não conteúdo do
 * acervo — buscá-las devolveria a Maria como resultado de busca.
 */
export const CLASSES_EXCLUIDAS: Readonly<Record<string, string>> = {
  ocorrencia: "sessão datada — registro de agenda, chega pelo evento",
  temporada: "recorte de cartaz — registro de agenda, chega pelo evento",
  "pessoa-usuaria": "persona do protótipo — estado de sessão, não conteúdo",
  repertorio: "repertório da persona — estado de sessão, não conteúdo",
};

// ---------------------------------------------------------------------------
// Normalização — UMA função, usada no build e na consulta
// ---------------------------------------------------------------------------

/**
 * Caixa baixa sem diacrítico, espaços colapsados.
 *
 * «Sao Paulo» tem de achar «São Paulo» e «MUSICA» tem de achar «Música». O intervalo
 * U+0300–U+036F é o bloco de marcas combinantes que a decomposição NFD produz — inclusive
 * a cedilha, que decompõe em `c` + U+0327.
 *
 * NÃO HÁ RADICALIZAÇÃO. Errar plural é menos grave que casar palavra errada com regra
 * caseira de stemming de português.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A regra determinística de slug usada só para ELIDIR o campo do DTO.
 *
 * O slug real é o que o gerador escreveu — inclusive as desambiguações. Aqui ele é
 * derivado e comparado com o real no build: só quando batem exatamente o campo vai
 * vazio. Nada é adivinhado na leitura, então divergência de regra é impossível por
 * construção — no pior caso o campo simplesmente não é elidido.
 */
export function slugDoTitulo(titulo: string): string {
  return normalizar(titulo)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Codificação base 36 — o que torna a forma colunar barata
// ---------------------------------------------------------------------------

const DIGITOS = "0123456789abcdefghijklmnopqrstuvwxyz";

function codificar(indice: number, largura: number): string {
  let saida = "";
  let n = indice;
  for (let i = 0; i < largura; i += 1) {
    saida = DIGITOS[n % 36] + saida;
    n = Math.floor(n / 36);
  }
  return saida;
}

function decodificar(codigo: string): number {
  let n = 0;
  for (const c of codigo) n = n * 36 + DIGITOS.indexOf(c);
  return n;
}

/** Largura fixa por tabela: 1 caractere até 36 valores, 2 até 1.296. */
function largura(tamanho: number): number {
  return tamanho <= 36 ? 1 : 2;
}

// ---------------------------------------------------------------------------
// O DTO
// ---------------------------------------------------------------------------

export type CampoCriterio =
  | "texto"
  | "classe"
  | "linguagem"
  | "tema"
  | "procedencia"
  | "territorio";

export interface OpcaoFaceta {
  campo: CampoCriterio;
  valor: string;
  /** Rótulo legível em português, vindo do dado — nunca de lista paralela. */
  rotulo: string;
  /** Contagem REAL no índice. Faceta que oferece recorte vazio é a armadilha de D-66. */
  n: number;
  /** Só em linguagem: o NOME DO TOKEN CSS que o vocabulário gerou (D-08). */
  cor?: string;
}

/**
 * As facetas, derivadas do próprio índice.
 *
 * Nenhuma delas é lista escrita à mão: classe sai da ontologia, linguagem e tema saem do
 * vocabulário controlado que o gerador emitiu, procedência sai de DADO-05 e território sai
 * da hierarquia `situado_em`. É isso que faz a faceta ser «da ontologia» em vez de
 * decorativa.
 */
export interface Facetas {
  classe: OpcaoFaceta[];
  linguagem: OpcaoFaceta[];
  tema: OpcaoFaceta[];
  procedencia: OpcaoFaceta[];
  territorio: OpcaoFaceta[];
}

export interface DiagnosticoIndice {
  /** Entradas por classe. 15 chaves, e nenhuma das 4 excluídas. */
  porClasse: Record<string, number>;
  /** Tamanho em bytes do DTO serializado, medido — não estimado. */
  bytes: number;
  /** Teto declarado. Estourar exige cortar CAMPO. */
  tetoBytes: number;
  /** Quantos títulos normalizados colidem com outro do índice. */
  colisoesDeTitulo: number;
  /** Slugs que saíram vazios por serem derivávies do título. */
  slugsElididos: number;
  /** Entradas com estado (nível `estado`) resolvido pela hierarquia. */
  comTerritorio: number;
  /** Dessas, quantas num estado brasileiro. */
  comTerritorioBrasileiro: number;
  /** Entradas com imagem local no acervo exportado. */
  comImagem: number;
  /** Campos deliberadamente FORA do DTO, com o motivo. */
  camposOmitidos: Array<{ campo: string; motivo: string }>;
}

export interface IndiceDTO {
  versao: 1;
  total: number;
  /** Tabelas internadas. */
  classes: ClasseEntidade[];
  procedencias: Procedencia[];
  linguagens: Array<{ id: string; rotulo: string; cor: string }>;
  temas: Array<{ id: string; rotulo: string }>;
  territorios: Array<{ valor: string; rotulo: string; pais: string }>;
  /** Vetores paralelos. `t` título, `s` slug ("" quando derivável do título). */
  t: string[];
  s: string[];
  /** Um caractere por entrada: classe, procedência, imagem local (`0`/`1`). */
  c: string;
  p: string;
  im: string;
  /** Códigos separados por vírgula, um grupo por entrada. Vazio = ausente. */
  g: string;
  l: string;
  m: string;
  facetas: Facetas;
  diagnostico: DiagnosticoIndice;
}

/** O teto do DTO. Os chunks estáticos da fase 2 pesam 888 KB; este é o orçamento. */
export const TETO_BYTES = 480 * 1024;

// ---------------------------------------------------------------------------
// A fonte injetada
// ---------------------------------------------------------------------------

/**
 * As três funções públicas de `grafo.ts` que a montagem usa. Injetadas em vez de
 * importadas — ver o cabeçalho, DP-F.
 */
export interface FonteDoGrafo {
  slugsPorTipo: (classe: ClasseEntidade) => string[];
  porSlug: (classe: ClasseEntidade, slug: string) => Entidade | undefined;
  vizinhos: (id: string, relacao?: Relacao) => Vizinho[];
}

// ---------------------------------------------------------------------------
// montarIndice
// ---------------------------------------------------------------------------

function pesar(valor: unknown): number {
  return new TextEncoder().encode(JSON.stringify(valor)).length;
}

interface ExtraTerritorio {
  nivel?: string;
  pais?: string;
  estado?: string | null;
}

/**
 * Sobe a hierarquia `situado_em` a partir de uma entidade até achar o território de nível
 * `estado`. A aresta é DIRIGIDA — o contido aponta para o continente — então só as arestas
 * que SAEM da entidade sobem. Sem essa restrição, pedir o estado de Belém desceria para
 * todo o acervo do Pará, que é o defeito que `porTerritorio` já documentou em `grafo.ts`.
 */
function estadoDe(id: string, fonte: FonteDoGrafo): Entidade | null {
  const visto = new Set<string>([id]);
  let fronteira = fonte
    .vizinhos(id, "situado_em")
    .filter((v) => v.aresta.de === id)
    .map((v) => v.entidade);

  for (let profundidade = 0; profundidade < 6 && fronteira.length; profundidade += 1) {
    const proxima: Entidade[] = [];
    for (const territorio of fronteira) {
      if (visto.has(territorio.id)) continue;
      visto.add(territorio.id);
      if (territorio.classe !== "territorio") continue;
      const extra = territorio.extra as ExtraTerritorio | undefined;
      if (extra?.nivel === "estado") return territorio;
      for (const v of fonte.vizinhos(territorio.id, "situado_em")) {
        if (v.aresta.de === territorio.id) proxima.push(v.entidade);
      }
    }
    fronteira = proxima;
  }
  return null;
}

/**
 * Monta o índice único, no build.
 *
 * A enumeração passa por `slugsPorTipo` + `porSlug` (D-47): nenhuma varredura de array
 * cru acontece aqui. Slug é único por classe no grafo gerado, então a volta é exata —
 * a montagem confere o total e falha alto se não bater.
 */
export function montarIndice(fonte: FonteDoGrafo): IndiceDTO {
  const entidades: Entidade[] = [];
  for (const classe of CLASSES_INDEXAVEIS) {
    for (const slug of fonte.slugsPorTipo(classe)) {
      const entidade = fonte.porSlug(classe, slug);
      if (entidade) entidades.push(entidade);
    }
  }

  // Ordem estável e independente de locale: a chave `{classe}_{slug}` é o identificador
  // que a tela e o mapa usam, e ordenar por ela deixa o DTO reprodutível entre máquinas.
  entidades.sort((a, b) => {
    const x = `${a.classe}_${a.slug}`;
    const y = `${b.classe}_${b.slug}`;
    return x < y ? -1 : x > y ? 1 : 0;
  });

  // --- tabelas internadas -------------------------------------------------
  const classes = [...CLASSES_INDEXAVEIS];
  const procedencias: Procedencia[] = ["ic", "derivado", "autorado"];

  // Linguagem e tema saem das PRÓPRIAS entidades de classe `linguagem` e `tema` do grafo:
  // rótulo é o título, e a cor é o nome do token CSS que o gerador emitiu (D-08). Nenhuma
  // associação linguagem→cor é escrita aqui, nem poderia ser.
  const linguagens: Array<{ id: string; rotulo: string; cor: string }> = [];
  const temas: Array<{ id: string; rotulo: string }> = [];
  const idxLinguagem = new Map<string, number>();
  const idxTema = new Map<string, number>();
  for (const e of entidades) {
    if (e.classe === "linguagem" && !idxLinguagem.has(e.slug)) {
      idxLinguagem.set(e.slug, linguagens.length);
      const cor = (e.extra as { cor?: string } | undefined)?.cor ?? "--ic-preto";
      linguagens.push({ id: e.slug, rotulo: e.titulo, cor });
    }
    if (e.classe === "tema" && !idxTema.has(e.slug)) {
      idxTema.set(e.slug, temas.length);
      temas.push({ id: e.slug, rotulo: e.titulo });
    }
  }

  const territorios: Array<{ valor: string; rotulo: string; pais: string }> = [];
  const idxTerritorio = new Map<string, number>();

  // --- vetores paralelos --------------------------------------------------
  const t: string[] = [];
  const s: string[] = [];
  const c: string[] = [];
  const p: string[] = [];
  const im: string[] = [];
  const g: string[] = [];
  const l: string[] = [];
  const m: string[] = [];

  const larguraLinguagem = largura(linguagens.length);
  const larguraTema = largura(temas.length);

  let slugsElididos = 0;
  let comTerritorio = 0;
  let comTerritorioBrasileiro = 0;
  let comImagem = 0;

  const porClasse: Record<string, number> = {};
  const contagemLinguagem = new Map<string, number>();
  const contagemTema = new Map<string, number>();
  const contagemProcedencia = new Map<string, number>();
  const contagemTerritorio = new Map<string, number>();
  const normalizados = new Map<string, number>();

  for (const e of entidades) {
    t.push(e.titulo);
    s.push(slugDoTitulo(e.titulo) === e.slug ? "" : e.slug);
    if (slugDoTitulo(e.titulo) === e.slug) slugsElididos += 1;

    c.push(codificar(classes.indexOf(e.classe), 1));
    const iProc = Math.max(0, procedencias.indexOf(e.procedencia));
    p.push(codificar(iProc, 1));
    contagemProcedencia.set(e.procedencia, (contagemProcedencia.get(e.procedencia) ?? 0) + 1);

    const tem = Boolean(e.imagem);
    im.push(tem ? "1" : "0");
    if (tem) comImagem += 1;

    porClasse[e.classe] = (porClasse[e.classe] ?? 0) + 1;

    const chaveNormal = normalizar(e.titulo);
    normalizados.set(chaveNormal, (normalizados.get(chaveNormal) ?? 0) + 1);

    // Linguagens e temas: só os que o vocabulário conhece. Id solto que o gerador não
    // promoveu não vira faceta fantasma — ele simplesmente não entra no código.
    let codigoL = "";
    for (const id of e.linguagens) {
      const i = idxLinguagem.get(id);
      if (i === undefined) continue;
      codigoL += codificar(i, larguraLinguagem);
      contagemLinguagem.set(id, (contagemLinguagem.get(id) ?? 0) + 1);
    }
    l.push(codigoL);

    let codigoM = "";
    for (const id of e.temas) {
      const i = idxTema.get(id);
      if (i === undefined) continue;
      codigoM += codificar(i, larguraTema);
      contagemTema.set(id, (contagemTema.get(id) ?? 0) + 1);
    }
    m.push(codigoM);

    const estado = estadoDe(e.id, fonte);
    if (!estado) {
      g.push("");
    } else {
      comTerritorio += 1;
      const extra = estado.extra as ExtraTerritorio | undefined;
      const pais = extra?.pais ?? "";
      if (pais === "Brasil") comTerritorioBrasileiro += 1;
      let i = idxTerritorio.get(estado.slug);
      if (i === undefined) {
        i = territorios.length;
        idxTerritorio.set(estado.slug, i);
        territorios.push({ valor: estado.slug, rotulo: estado.titulo, pais });
      }
      g.push(String(i));
      contagemTerritorio.set(estado.slug, (contagemTerritorio.get(estado.slug) ?? 0) + 1);
    }
  }

  let colisoesDeTitulo = 0;
  for (const n of normalizados.values()) if (n > 1) colisoesDeTitulo += n;

  // --- facetas, com a contagem real --------------------------------------
  const porContagem = (a: OpcaoFaceta, b: OpcaoFaceta) =>
    b.n - a.n || (a.rotulo < b.rotulo ? -1 : a.rotulo > b.rotulo ? 1 : 0);

  const ROTULO_PROCEDENCIA: Record<Procedencia, string> = {
    ic: "acervo do Itaú Cultural",
    derivado: "derivado por regra",
    autorado: "autorado para o protótipo",
  };

  const facetas: Facetas = {
    classe: classes
      .map((classe) => ({
        campo: "classe" as const,
        valor: classe,
        rotulo: classe,
        n: porClasse[classe] ?? 0,
      }))
      .filter((o) => o.n > 0)
      .sort(porContagem),
    linguagem: linguagens
      .map((linguagem) => ({
        campo: "linguagem" as const,
        valor: linguagem.id,
        rotulo: linguagem.rotulo,
        n: contagemLinguagem.get(linguagem.id) ?? 0,
        cor: linguagem.cor,
      }))
      .filter((o) => o.n > 0)
      .sort(porContagem),
    tema: temas
      .map((tema) => ({
        campo: "tema" as const,
        valor: tema.id,
        rotulo: tema.rotulo,
        n: contagemTema.get(tema.id) ?? 0,
      }))
      .filter((o) => o.n > 0)
      .sort(porContagem),
    procedencia: procedencias
      .map((procedencia) => ({
        campo: "procedencia" as const,
        valor: procedencia,
        rotulo: ROTULO_PROCEDENCIA[procedencia],
        n: contagemProcedencia.get(procedencia) ?? 0,
      }))
      .filter((o) => o.n > 0)
      .sort(porContagem),
    territorio: territorios
      .map((territorio) => ({
        campo: "territorio" as const,
        valor: territorio.valor,
        rotulo:
          territorio.pais === "Brasil"
            ? territorio.rotulo
            : `${territorio.rotulo} · ${territorio.pais}`,
        n: contagemTerritorio.get(territorio.valor) ?? 0,
      }))
      .filter((o) => o.n > 0)
      .sort(porContagem),
  };

  const dto: IndiceDTO = {
    versao: 1,
    total: entidades.length,
    classes,
    procedencias,
    linguagens,
    temas,
    territorios,
    t,
    s,
    c: c.join(""),
    p: p.join(""),
    im: im.join(""),
    g: g.join(","),
    l: l.join(","),
    m: m.join(","),
    facetas,
    diagnostico: {
      porClasse,
      bytes: 0,
      tetoBytes: TETO_BYTES,
      colisoesDeTitulo,
      slugsElididos,
      comTerritorio,
      comTerritorioBrasileiro,
      comImagem,
      camposOmitidos: [
        {
          campo: "resumo",
          motivo:
            "855 KB medidos contra 515 KB sem ele — caro demais para um campo que o resultado não mostra; continua na página da entidade",
        },
        {
          campo: "tituloNormalizado",
          motivo:
            "210 KB medidos; reconstruído no cliente em uma passada pela MESMA função `normalizar`, o que também garante que as duas pontas normalizem igual",
        },
        {
          campo: "slug (quando derivável)",
          motivo: `${slugsElididos} de ${entidades.length} slugs são exatamente \`slugDoTitulo(titulo)\` e saem vazios; a derivação é conferida no build, então nada é adivinhado na leitura`,
        },
      ],
    },
  };

  // O peso é MEDIDO, e o campo que o guarda faz parte do que se mede — daí o ponto fixo.
  // Duas passadas bastam: o número só muda de casa decimal.
  for (let i = 0; i < 3; i += 1) {
    const bytes = pesar(dto);
    if (dto.diagnostico.bytes === bytes) break;
    dto.diagnostico.bytes = bytes;
  }

  return dto;
}

// ---------------------------------------------------------------------------
// A leitura do DTO — expansão preguiçosa, uma vez por índice
// ---------------------------------------------------------------------------

export interface EntradaIndice {
  /** `{classe}_{slug}` — a chave estável que a tela, o mapa e a explicação usam. */
  chave: string;
  classe: ClasseEntidade;
  titulo: string;
  slug: string;
  /** Reconstruído no cliente por `normalizar`, e por isso idêntico ao do build. */
  normalizado: string;
  linguagens: string[];
  temas: string[];
  procedencia: Procedencia;
  territorio: string | null;
  temImagem: boolean;
}

const EXPANDIDOS = new WeakMap<IndiceDTO, EntradaIndice[]>();

/**
 * Descompacta os vetores colunares uma vez por índice, e guarda o resultado.
 *
 * É aqui que o título normalizado nasce no cliente. Uma passada de 5.092 chamadas a
 * `normalizar` custa milissegundos e acontece UMA vez; mandar o campo pronto custaria
 * 210 KB em toda visita.
 */
export function expandirIndice(indice: IndiceDTO): EntradaIndice[] {
  const cache = EXPANDIDOS.get(indice);
  if (cache) return cache;

  const larguraLinguagem = largura(indice.linguagens.length);
  const larguraTema = largura(indice.temas.length);
  const gs = indice.g.split(",");
  const ls = indice.l.split(",");
  const ms = indice.m.split(",");

  const entradas: EntradaIndice[] = [];
  for (let i = 0; i < indice.total; i += 1) {
    const titulo = indice.t[i];
    const classe = indice.classes[decodificar(indice.c[i])];
    const slug = indice.s[i] === "" ? slugDoTitulo(titulo) : indice.s[i];

    const linguagens: string[] = [];
    const codigoL = ls[i] ?? "";
    for (let j = 0; j < codigoL.length; j += larguraLinguagem) {
      const entrada = indice.linguagens[decodificar(codigoL.slice(j, j + larguraLinguagem))];
      if (entrada) linguagens.push(entrada.id);
    }

    const temas: string[] = [];
    const codigoM = ms[i] ?? "";
    for (let j = 0; j < codigoM.length; j += larguraTema) {
      const entrada = indice.temas[decodificar(codigoM.slice(j, j + larguraTema))];
      if (entrada) temas.push(entrada.id);
    }

    const codigoG = gs[i] ?? "";
    const territorio = codigoG === "" ? null : (indice.territorios[Number(codigoG)]?.valor ?? null);

    entradas.push({
      chave: `${classe}_${slug}`,
      classe,
      titulo,
      slug,
      normalizado: normalizar(titulo),
      linguagens,
      temas,
      procedencia: indice.procedencias[decodificar(indice.p[i])],
      territorio,
      temImagem: indice.im[i] === "1",
    });
  }

  EXPANDIDOS.set(indice, entradas);
  return entradas;
}

// ---------------------------------------------------------------------------
// consultar — a função que atende /buscar e /buscar/frase
// ---------------------------------------------------------------------------

export interface Criterio {
  campo: CampoCriterio;
  valor: string;
  /** Legível em português. É o que a ficha removível mostra na tela. */
  rotulo: string;
}

export interface Consulta {
  texto?: string;
  criterios?: Criterio[];
  /** Teto de resultados devolvidos. As contagens são sempre sobre a lista INTEIRA. */
  limite?: number;
}

export interface ResultadoBusca {
  chave: string;
  classe: ClasseEntidade;
  titulo: string;
  slug: string;
  linguagens: string[];
  procedencia: Procedencia;
  territorio: string | null;
  territorioRotulo: string | null;
  temImagem: boolean;
  /** Posição do primeiro casamento no título normalizado; -1 quando não houve texto. */
  posicao: number;
  /** O casamento começa no início do título ou de uma palavra dele. */
  noInicio: boolean;
}

export interface ContagemCriterio {
  criterio: Criterio;
  /** Quantos resultados haveria SEM este critério. É disso que 03-06 recalcula. */
  semEle: number;
}

export type TipoAfrouxamento = "remover" | "manter-apenas" | "descoberta";

export interface Afrouxamento {
  tipo: TipoAfrouxamento;
  campo: CampoCriterio;
  valor: string;
  /** «solte o texto «bienal»» — a frase que a tela mostra no toque. */
  rotulo: string;
  /** Quantos resultados este afrouxamento traria. Medido, não estimado. */
  resultados: number;
  /** A consulta já afrouxada, pronta para aplicar em um toque. */
  consulta: Consulta;
}

export interface RespostaBusca {
  resultados: ResultadoBusca[];
  /** Total REAL de casamentos, mesmo quando `resultados` vem cortado pelo limite. */
  total: number;
  porClasse: Record<string, number>;
  porCriterio: ContagemCriterio[];
  afrouxamentos: Afrouxamento[];
  /** Os critérios efetivamente aplicados, incluindo o texto livre como critério. */
  criterios: Criterio[];
  regraOrdenacao: string;
  limite: number;
}

/**
 * A regra de ordenação, escrita por extenso porque a tela precisa poder dizer por que
 * aquele resultado veio primeiro. Determinística e insensível a locale: a fase 2 baniu
 * `localeCompare` do motor porque dois ambientes ordenariam diferente e o HTML exportado
 * deixaria de ser reprodutível.
 */
export const REGRA_ORDENACAO =
  "casamento no começo do título ou de uma palavra dele vem antes de casamento no meio; " +
  "depois vem quem tem imagem no acervo; empate se resolve pela chave estável {classe}_{slug}";

const ROTULO_CAMPO: Record<CampoCriterio, string> = {
  texto: "texto",
  classe: "tipo",
  linguagem: "linguagem",
  tema: "tema",
  procedencia: "procedência",
  territorio: "território",
};

/** Índice ativo — conveniência para script e gate. A tela sempre passa o DTO explícito. */
let indiceAtivo: IndiceDTO | null = null;

export function definirIndiceAtivo(indice: IndiceDTO): IndiceDTO {
  indiceAtivo = indice;
  return indice;
}

function obterIndice(indice?: IndiceDTO): IndiceDTO {
  if (indice) return indice;
  if (indiceAtivo) return indiceAtivo;
  throw new Error(
    "consultar() sem índice: passe o DTO explicitamente ou chame definirIndiceAtivo(montarIndice(fonte)) antes.",
  );
}

/** Todo termo tem de casar. Vazio devolve casamento universal. */
function termosDe(texto: string): string[] {
  return normalizar(texto).split(" ").filter(Boolean);
}

function casaTexto(entrada: EntradaIndice, termos: string[]): { casa: boolean; posicao: number; noInicio: boolean } {
  if (!termos.length) return { casa: true, posicao: -1, noInicio: false };
  let melhor = Number.MAX_SAFE_INTEGER;
  let noInicio = false;
  for (const termo of termos) {
    const posicao = entrada.normalizado.indexOf(termo);
    if (posicao < 0) return { casa: false, posicao: -1, noInicio: false };
    if (posicao < melhor) melhor = posicao;
    if (posicao === 0 || entrada.normalizado[posicao - 1] === " ") noInicio = true;
  }
  return { casa: true, posicao: melhor, noInicio };
}

function casaCriterio(entrada: EntradaIndice, criterio: Criterio): boolean {
  switch (criterio.campo) {
    case "classe":
      return entrada.classe === criterio.valor;
    case "linguagem":
      return entrada.linguagens.includes(criterio.valor);
    case "tema":
      return entrada.temas.includes(criterio.valor);
    case "procedencia":
      return entrada.procedencia === criterio.valor;
    case "territorio":
      return entrada.territorio === criterio.valor;
    case "texto":
      return casaTexto(entrada, termosDe(criterio.valor)).casa;
  }
}

/**
 * Critérios do MESMO campo somam (ou), campos diferentes recortam (e).
 *
 * Marcar «evento» e «obra» tem de devolver os dois, não zero — a leitura contrária faria
 * a segunda marcação parecer defeito. Entre campos o recorte é conjunção, que é o que a
 * pessoa espera de «evento» mais «música».
 */
function filtrar(entradas: EntradaIndice[], criterios: Criterio[]): EntradaIndice[] {
  const porCampo = new Map<CampoCriterio, Criterio[]>();
  for (const criterio of criterios) {
    const lista = porCampo.get(criterio.campo);
    if (lista) lista.push(criterio);
    else porCampo.set(criterio.campo, [criterio]);
  }
  let atual = entradas;
  for (const [, grupo] of porCampo) {
    atual = atual.filter((entrada) => grupo.some((criterio) => casaCriterio(entrada, criterio)));
  }
  return atual;
}

function criteriosDaConsulta(consulta: Consulta): Criterio[] {
  const criterios: Criterio[] = [];
  const texto = (consulta.texto ?? "").trim();
  if (texto) {
    criterios.push({ campo: "texto", valor: texto, rotulo: `texto «${texto}»` });
  }
  for (const criterio of consulta.criterios ?? []) {
    if (criterio.campo === "texto" && !criterio.valor.trim()) continue;
    criterios.push(criterio);
  }
  return criterios;
}

/**
 * Sugestões de afrouxamento (D-66). NUNCA devolve lista vazia quando não houve resultado.
 *
 * Três passadas, da mais barata para a mais larga:
 *   1. remover UM critério de cada vez;
 *   2. manter APENAS um critério, quando nenhuma remoção isolada resolveu;
 *   3. o caminho de descoberta — as classes mais largas do índice — quando nem isso
 *      resolveu, porque «nenhuma saída» é a única resposta proibida.
 */
function montarAfrouxamentos(
  entradas: EntradaIndice[],
  criterios: Criterio[],
  indice: IndiceDTO,
): Afrouxamento[] {
  const consultaDe = (lista: Criterio[]): Consulta => ({
    texto: lista.find((c) => c.campo === "texto")?.valor ?? "",
    criterios: lista.filter((c) => c.campo !== "texto"),
  });

  // A frase do afrouxamento é a que a pessoa lê no momento em que a busca falhou, e é o
  // argumento inteiro de D-66 em uma linha. O critério de texto já se descreve sozinho
  // («texto «bienal»»), então repetir o nome do campo produziria «soltar texto — texto
  // «bienal»». Os demais precisam do campo dito, porque «soltar evento» é ambíguo entre
  // tipo e título.
  const frase = (criterio: Criterio) =>
    criterio.campo === "texto"
      ? `soltar o ${criterio.rotulo}`
      : `soltar ${ROTULO_CAMPO[criterio.campo]} — ${criterio.rotulo}`;

  const remover: Afrouxamento[] = [];
  for (let i = 0; i < criterios.length; i += 1) {
    const restantes = criterios.filter((_, j) => j !== i);
    const n = filtrar(entradas, restantes).length;
    if (!n) continue;
    remover.push({
      tipo: "remover",
      campo: criterios[i].campo,
      valor: criterios[i].valor,
      rotulo: frase(criterios[i]),
      resultados: n,
      consulta: consultaDe(restantes),
    });
  }
  if (remover.length) return remover.sort((a, b) => b.resultados - a.resultados);

  const apenas: Afrouxamento[] = [];
  for (const criterio of criterios) {
    const n = filtrar(entradas, [criterio]).length;
    if (!n) continue;
    apenas.push({
      tipo: "manter-apenas",
      campo: criterio.campo,
      valor: criterio.valor,
      rotulo:
        criterio.campo === "texto"
          ? `manter só o ${criterio.rotulo}`
          : `manter só ${ROTULO_CAMPO[criterio.campo]} — ${criterio.rotulo}`,
      resultados: n,
      consulta: consultaDe([criterio]),
    });
  }
  if (apenas.length) return apenas.sort((a, b) => b.resultados - a.resultados);

  return indice.facetas.classe.slice(0, 4).map((opcao) => ({
    tipo: "descoberta" as const,
    campo: "classe" as const,
    valor: opcao.valor,
    rotulo: `começar de novo por ${opcao.rotulo}`,
    resultados: opcao.n,
    consulta: {
      texto: "",
      criterios: [{ campo: "classe" as const, valor: opcao.valor, rotulo: opcao.rotulo }],
    },
  }));
}

/**
 * A consulta. Texto livre e critérios estruturados, sobre o mesmo índice.
 *
 * Devolve, além dos resultados, quanto CADA critério isolado custa (`porCriterio`) e,
 * quando não há resultado, por onde sair (`afrouxamentos`). As duas contagens são feitas
 * sobre a lista inteira e não sobre a página exibida — afirmar sobre um recorte é afirmar
 * mais do que se mediu.
 */
export function consultar(consulta: Consulta = {}, indice?: IndiceDTO): RespostaBusca {
  const dto = obterIndice(indice);
  const entradas = expandirIndice(dto);
  const criterios = criteriosDaConsulta(consulta);
  const limite = consulta.limite ?? Number.MAX_SAFE_INTEGER;

  const casados = filtrar(entradas, criterios);

  const termos = termosDe(
    criterios
      .filter((c) => c.campo === "texto")
      .map((c) => c.valor)
      .join(" "),
  );

  const rotuloTerritorio = new Map(dto.territorios.map((t) => [t.valor, t.rotulo]));

  const ordenados = casados
    .map((entrada) => {
      const casamento = casaTexto(entrada, termos);
      return {
        chave: entrada.chave,
        classe: entrada.classe,
        titulo: entrada.titulo,
        slug: entrada.slug,
        linguagens: entrada.linguagens,
        procedencia: entrada.procedencia,
        territorio: entrada.territorio,
        territorioRotulo: entrada.territorio
          ? (rotuloTerritorio.get(entrada.territorio) ?? null)
          : null,
        temImagem: entrada.temImagem,
        posicao: casamento.posicao,
        noInicio: casamento.noInicio,
      } satisfies ResultadoBusca;
    })
    .sort((a, b) => {
      if (a.noInicio !== b.noInicio) return a.noInicio ? -1 : 1;
      if (a.temImagem !== b.temImagem) return a.temImagem ? -1 : 1;
      return a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0;
    });

  const porClasse: Record<string, number> = {};
  for (const resultado of ordenados) {
    porClasse[resultado.classe] = (porClasse[resultado.classe] ?? 0) + 1;
  }

  const porCriterio: ContagemCriterio[] = criterios.map((criterio, i) => ({
    criterio,
    semEle: filtrar(entradas, criterios.filter((_, j) => j !== i)).length,
  }));

  return {
    resultados: ordenados.slice(0, limite),
    total: ordenados.length,
    porClasse,
    porCriterio,
    afrouxamentos: ordenados.length ? [] : montarAfrouxamentos(entradas, criterios, dto),
    criterios,
    regraOrdenacao: REGRA_ORDENACAO,
    limite,
  };
}

// ---------------------------------------------------------------------------
// facetasDe — as facetas RECONTADAS sobre o recorte atual
// ---------------------------------------------------------------------------

/**
 * As facetas do índice recontadas contra a consulta em curso.
 *
 * A contagem de cada campo é feita sobre o conjunto filtrado por TODOS os outros
 * critérios menos os do próprio campo — que é a única contagem que não mente: marcar uma
 * opção que diz «51» devolve exatamente 51. Facetas contadas sobre o índice inteiro
 * ofereceriam recortes que voltam vazios, e uma faceta que oferece o vazio é a mesma
 * armadilha que D-66 existe para fechar.
 *
 * Opção com contagem zero não é oferecida. `facetasDe()` sem consulta devolve a contagem
 * sobre o índice inteiro, que é o que a tela mostra antes de qualquer recorte.
 */
export function facetasDe(consulta: Consulta = {}, indice?: IndiceDTO): Facetas {
  const dto = obterIndice(indice);
  const entradas = expandirIndice(dto);
  const criterios = criteriosDaConsulta(consulta);

  const base = (campo: CampoCriterio) =>
    filtrar(
      entradas,
      criterios.filter((c) => c.campo !== campo),
    );

  const contar = (campo: CampoCriterio, valoresDe: (e: EntradaIndice) => string[]) => {
    const contagem = new Map<string, number>();
    for (const entrada of base(campo)) {
      for (const valor of valoresDe(entrada)) {
        contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
      }
    }
    return contagem;
  };

  const aplicar = (opcoes: OpcaoFaceta[], contagem: Map<string, number>): OpcaoFaceta[] =>
    opcoes
      .map((opcao) => ({ ...opcao, n: contagem.get(opcao.valor) ?? 0 }))
      .filter((opcao) => opcao.n > 0)
      .sort(
        (a, b) => b.n - a.n || (a.rotulo < b.rotulo ? -1 : a.rotulo > b.rotulo ? 1 : 0),
      );

  return {
    classe: aplicar(
      dto.facetas.classe,
      contar("classe", (e) => [e.classe]),
    ),
    linguagem: aplicar(
      dto.facetas.linguagem,
      contar("linguagem", (e) => e.linguagens),
    ),
    tema: aplicar(
      dto.facetas.tema,
      contar("tema", (e) => e.temas),
    ),
    procedencia: aplicar(
      dto.facetas.procedencia,
      contar("procedencia", (e) => [e.procedencia]),
    ),
    territorio: aplicar(
      dto.facetas.territorio,
      contar("territorio", (e) => (e.territorio ? [e.territorio] : [])),
    ),
  };
}
