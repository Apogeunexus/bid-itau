/**
 * observatorio.ts — os indicadores de impacto cultural e o painel de procedência
 * (D-87, D-88, D-89, D-90).
 *
 * O QUE ESTA TELA PROVA, E POR QUE ELA É A QUE MAIS DISTINGUE A PROPOSTA. Todo protótipo
 * de agenda cultural inventa dado para a demonstração funcionar. Nenhum diz quanto. Aqui o
 * painel de procedência é TELA DE PRIMEIRA CLASSE e diz, com o número contado: 4.826
 * entidades vieram do acervo do Itaú Cultural, 2.937 nós derivamos por regra, e 47 nós
 * inventamos. É o princípio 9 virando interface — e é justamente por afirmar em voz alta o
 * que é invenção nossa que todo o resto da tela passa a ser verificável em vez de
 * acreditável.
 *
 * NENHUM NÚMERO DESTE MÓDULO É LITERAL. Cada um sai da travessia do grafo por `grafo.ts`
 * (D-16, D-47), da contagem direta das arestas, ou de `repertorio.ts` e `geo.ts`. Os
 * literais que aparecem no arquivo são CONFERÊNCIAS — valores esperados contra os quais o
 * módulo se compara e QUEBRA ALTO se divergir. A diferença entre as duas coisas é a tela
 * inteira: um número copiado à mão mente em silêncio na primeira regeração do grafo; uma
 * conferência que não fecha derruba o build.
 *
 * A CONFERÊNCIA DE PROCEDÊNCIA É DE TRÊS PONTAS, e é de propósito. As fatias de entidade
 * são contadas aqui, comparadas com `contagens()` de `grafo.ts` E com `porProcedencia` de
 * `meta.json`, que o gerador escreveu num processo separado. As de aresta são contadas aqui
 * e comparadas com `porProcedenciaDeAresta` e `totais.arestas` do mesmo `meta.json`. Três
 * fontes independentes precisam concordar para a tela abrir. Uma fatia que não fecha é o
 * sintoma de um `porProcedencia` desatualizado, e é melhor não compilar do que exibir.
 *
 * D-90 MORA NA ESTRUTURA, NÃO NA PROSA. `valor: null` com `sustentado: false` é a forma de
 * dizer «o dado não sustenta este indicador»; `valor: 0` com `sustentado: true` é uma
 * medida real que deu zero, e as duas coisas NÃO podem ser confundidas pelo tipo. As duas
 * existem neste acervo ao mesmo tempo: gratuidade não sustenta (0 de 300 eventos declaram
 * preço, então o corte não recorta nada), e a descoberta de artista novo da Joana é zero
 * MEDIDO sobre 68 adjacentes reais. Um tipo que achatasse as duas num zero faria a tela
 * mentir sobre uma delas, e não haveria como saber qual.
 *
 * DP-F: roda NO BUILD. Alcança `grafo.ts`, que carrega 23 MB de JSON, e nenhum arquivo
 * `"use client"` pode importar este módulo por valor — só `import type`. O que atravessa a
 * fronteira RSC são os DTOs abaixo, que são SÓ PRIMITIVO, e o teto deles é medido a cada
 * build.
 */

import { contagens, ocorrenciasDe, porSlug, porTerritorio, slugsPorTipo, vizinhos } from "./grafo";
import {
  METODOS_INDEXADOS,
  caminhoDe,
  densidadePorUf,
  indiceDePinos,
  projetar,
} from "./geo";
import { CONTORNO_BRASIL, ROTULO_CONTORNO, ROTULO_UNIDADES_FEDERATIVAS, UNIDADES_FEDERATIVAS } from "./contorno-brasil";
import type { DadosDesertos } from "@/componentes/desertos";
import { alcancadosDaPersona } from "./caminhada";
import { LIMITE_FEED, PRECOMPUTO } from "./feeds";
import { ESCOPOS_DE_CURADORIA, declaracoesDaModeracao, filaDaModeracao } from "./moderacao";
import { PERSONAS } from "./personas";
import { COMPONENTES_DO_CRITERIO } from "./duplicatas";
import { repertorioDe } from "./repertorio";
import metaJson from "./gerado/meta.json";
import type { ClasseEntidade, Entidade, Procedencia, Relacao } from "./tipos";

// ---------------------------------------------------------------------------
// meta.json — a segunda e a terceira fonte da conferência
// ---------------------------------------------------------------------------

/**
 * `meta.json` é escrito por `scripts/gerar-grafo.mjs` num processo separado, sobre a mesma
 * passada que produziu `entidades.json` e `arestas.json`. Ele NÃO é a fonte dos números da
 * tela — é a testemunha independente contra a qual a contagem feita aqui se confere. Se as
 * duas divergirem, uma das duas está velha, e o módulo não tem como saber qual: ele quebra.
 */
const META = metaJson as unknown as {
  geradoEm: string;
  totais: { entidades: number; arestas: number; ocorrencias: number };
  porClasse: Record<string, number>;
  porProcedencia: Record<string, number>;
  porRelacao: Record<string, number>;
  porProcedenciaDeAresta: Record<string, number>;
  acessibilidade: Record<string, number>;
  acessibilidadeIncluindoDerivadas: Record<string, number>;
  fichaDeAcessibilidade: { declaram: number; naoDeclaram: number };
  cobertura: {
    coordenadas: {
      /** Entidades com coordenada PRÓPRIA — o tamanho da tabela, não o do mapa. */
      comCoordenada: number;
      porMetodo: Record<string, number>;
    };
  };
};

/** Teto do DTO que atravessa a fronteira RSC. 60 KB, medido a cada build. */
export const TETO_DO_DTO = 61_440;

// ---------------------------------------------------------------------------
// A superfície — oito telas, e o recorte que impede o DTO inteiro de ir a todas
// ---------------------------------------------------------------------------

/**
 * Uma tela da superfície do Observatório.
 *
 * A superfície nasceu como TELA ÚNICA e virou oito. A tentação, quando isso acontece, é
 * mandar `montarObservatorio()` para as oito e deixar cada uma escolher o que exibe: o
 * código fica menor e o artefato fica oito vezes maior, porque o que não é exibido
 * atravessa a fronteira RSC do mesmo jeito. O recorte é POR TELA, feito no servidor, e
 * `aferirDto()` é o que o torna conferido em vez de pretendido.
 *
 * A PERGUNTA É CAMPO OBRIGATÓRIO, e não enfeite. Uma tela de painel institucional que não
 * saiba dizer que pergunta responde é uma tela que existe porque cabia no menu — e a
 * pergunta escrita ao lado do rótulo é o que impede a navegação de virar gaveta.
 */
export interface TelaDaSuperficie {
  id: string;
  /** Rota do artefato estático. Termina em barra: sem ela é outra página. */
  rota: string;
  rotulo: string;
  /** A pergunta que esta tela responde. */
  pergunta: string;
  /** As funcionalidades do catálogo que ela entrega. */
  funcionalidades: readonly string[];
}

export const TELAS: readonly TelaDaSuperficie[] = [
  {
    id: "visao-geral",
    rota: "/observatorio/",
    rotulo: "Visão geral",
    pergunta: "os mesmos indicadores — para quem estou olhando, e em que ordem?",
    funcionalidades: ["101"],
  },
  {
    id: "produto",
    rota: "/observatorio/produto/",
    rotulo: "Produto",
    pergunta: "qual recorte já funciona e qual está esperando dado?",
    funcionalidades: ["102"],
  },
  {
    id: "impacto",
    rota: "/observatorio/impacto/",
    rotulo: "Impacto cultural",
    pergunta: "o que a plataforma amplia no repertório de quem a atravessa?",
    funcionalidades: ["103"],
  },
  {
    id: "territorio",
    rota: "/observatorio/territorio/",
    rotulo: "Território",
    pergunta: "onde a documentação da cultura brasileira não chega?",
    funcionalidades: ["104"],
  },
  {
    id: "procedencia",
    rota: "/observatorio/procedencia/",
    rotulo: "Procedência",
    pergunta: "de onde veio cada coisa que estas telas mostram?",
    funcionalidades: ["105"],
  },
  {
    id: "ausencia",
    rota: "/observatorio/ausencia/",
    rotulo: "Ausência declarada",
    pergunta: "o que este acervo não sabe, e quem preencheria?",
    funcionalidades: ["106"],
  },
  {
    id: "dados",
    rota: "/observatorio/dados/",
    rotulo: "Dados abertos",
    pergunta: "o que daqui sai para quem quiser construir em cima?",
    funcionalidades: ["107"],
  },
  {
    id: "moderacao",
    rota: "/observatorio/moderacao/",
    rotulo: "Leitura da moderação",
    pergunta: "o sistema de moderação dá conta, e onde ele parou?",
    funcionalidades: ["169"],
  },
];

// A mesma disciplina de PUBLICOS, e pelo mesmo motivo: a navegação das oito telas é montada
// a partir desta lista. Sob `output: "export"` uma rota digitada errado não dá 404 no
// desenvolvimento — ela sai no artefato como link para lugar nenhum, e o sintoma aparece na
// frente de quem avalia.
const IDS_DE_TELA = new Set<string>();
for (const t of TELAS) {
  if (IDS_DE_TELA.has(t.id)) {
    throw new Error(`observatorio.ts: a tela «${t.id}» aparece duas vezes em TELAS.`);
  }
  IDS_DE_TELA.add(t.id);
  if (!t.rota.startsWith("/observatorio/") || !t.rota.endsWith("/")) {
    throw new Error(
      `observatorio.ts: a rota «${t.rota}» da tela «${t.id}» não é da superfície do Observatório ` +
        `ou não termina em barra — e sob output: "export" a rota sem barra final é OUTRA página.`,
    );
  }
}

/**
 * O teto do DTO, aferido POR TELA em vez de uma vez só.
 *
 * `numerosDoObservatorio()` afere o DTO da raiz desde 05-05. Este é o mesmo teto aplicado às
 * outras sete: cada página de servidor passa por aqui o que vai mandar ao cliente, e a tela
 * que estourar não compila. Aferir só a raiz deixaria as sete crescerem sem sintoma nenhum
 * até o artefato dobrar de tamanho — e o sintoma, quando viesse, seria lentidão sem causa
 * aparente, que é a forma de dívida mais cara de achar.
 */
export function aferirDto<T>(tela: string, dto: T): T {
  const bytes = JSON.stringify(dto).length;
  if (bytes > TETO_DO_DTO) {
    throw new Error(
      `observatorio.ts: o DTO da tela «${tela}» ficou com ${bytes} bytes, acima do teto de ${TETO_DO_DTO}. ` +
        `Recorte o que esta tela NÃO exibe — detalhe de indicador que ela não abre, composição de fatia que ` +
        `ela não mostra — e DECLARE o corte na tela, em vez de reduzir o que ela afirma.`,
    );
  }
  return dto;
}

// ---------------------------------------------------------------------------
// Procedência — o vocabulário, e a frase que não pode ser suavizada
// ---------------------------------------------------------------------------

export const PROCEDENCIAS: readonly Procedencia[] = ["ic", "derivado", "autorado"];

/**
 * O que cada procedência QUER DIZER, em texto de produto.
 *
 * A terceira frase é a que importa e ela está escrita sem eufemismo de propósito:
 * «autorado» quer dizer inventado por nós para o protótipo. Dizer isso em voz alta, ao lado
 * do número, é o que torna os 4.826 do Itaú Cultural críveis — uma tela que chamasse os 47
 * de «complementares» ou «curados» estaria escondendo exatamente a informação que ela
 * existe para dar, e quem avalia perceberia.
 */
export const SIGNIFICADO_DA_PROCEDENCIA: Record<Procedencia, string> = {
  ic: "Veio do acervo do Itaú Cultural — CMS e Enciclopédia —, carregado como está. Nós não escrevemos nada disto.",
  derivado:
    "Nós extraímos do que veio do Itaú Cultural, por regra escrita e auditável: as ocorrências datadas, os territórios, os espaços e as ligações de semelhança. Não é invenção, é leitura — mas é leitura NOSSA, e por isso está separada.",
  autorado:
    "Nós inventamos para o protótipo. Não existe no acervo do Itaú Cultural: foi escrito por nós para a demonstração ter o que mostrar.",
  parceiro:
    "Uma instituição publicou, e nós lemos. MASP, Pinacoteca e Theatro Municipal entram por raspagem das próprias páginas públicas — não é acervo do Itaú Cultural nem invenção nossa: é o que um terceiro afirma, com a fonte registrada e a revisão humana ainda pendente.",
};

export const ROTULO_DA_PROCEDENCIA: Record<Procedencia, string> = {
  ic: "Itaú Cultural",
  derivado: "derivado por nós",
  autorado: "autorado por nós",
  parceiro: "publicado por parceiro",
};

// ---------------------------------------------------------------------------
// DTO — só primitivo
// ---------------------------------------------------------------------------

/**
 * O denominador de um número.
 *
 * CAMPO OBRIGATÓRIO DO TIPO, e não campo opcional que a tela lembra de preencher. Um
 * indicador de impacto sobre 3 pessoas autoradas que não diga «3 pessoas autoradas» é
 * exatamente o tipo de número que esta proposta inteira existe para combater — e a única
 * forma de garantir que ele nunca apareça sozinho é o tipo não admitir a sua ausência.
 */
export interface Denominador {
  n: number;
  do_que: string;
}

/** Uma linha de detalhe de um indicador — a persona, o estado, a dimensão. */
export interface LinhaDeIndicador {
  rotulo: string;
  valor: number | null;
  de: number;
  nota?: string;
}

export interface Indicador {
  id: string;
  rotulo: string;
  /** `null` SÓ quando `sustentado` é falso. Zero é uma medida, não uma ausência. */
  valor: number | null;
  unidade: string;
  denominador: Denominador;
  /** O segundo denominador, quando a leitura honesta exige dois (gratuidade). */
  denominadorSecundario: Denominador | null;
  /**
   * O dado do acervo sustenta este indicador? Falso quer dizer «o corte não recorta»,
   * não «o corte deu zero».
   */
  sustentado: boolean;
  /** De onde o número saiu: o módulo e a função, no molde do «origem do número». */
  procedenciaDoNumero: string;
  /** A frase de D-90. OBRIGATÓRIA quando `sustentado` é falso. */
  declaracao: string | null;
  /** A leitura em texto de produto — o que o número quer dizer. */
  leitura: string;
  detalhe: LinhaDeIndicador[];
}

export interface FatiaDeProcedencia {
  procedencia: Procedencia;
  rotulo: string;
  n: number;
  /** 0 a 1, contra o total da leitura. É daqui que sai a largura da barra. */
  fracao: number;
  /** A mesma fração em por cento, com uma casa. A tela não recalcula. */
  percentual: number;
  significado: string;
  /** Uma coisa real desta procedência, para a tela mostrar do que se trata. */
  exemplo: string;
  /** Como o exemplo foi escolhido — regra, nunca escolha à mão. */
  regraDoExemplo: string;
  /** A composição da fatia: as maiores classes, ou as maiores relações. */
  composicao: LinhaDeIndicador[];
}

export interface Conferencia {
  /** As fatias somam o total? Se não somarem, o módulo não chega até aqui. */
  fecha: boolean;
  somaDeEntidades: number;
  somaDeArestas: number;
  totalDeEntidades: number;
  totalDeArestas: number;
  fontes: string[];
  geradoEm: string;
}

export interface PainelDeProcedencia {
  entidades: FatiaDeProcedencia[];
  arestas: FatiaDeProcedencia[];
  totalDeEntidades: number;
  totalDeArestas: number;
  /** A segunda leitura, que é a que explica por que o grafo parece rico. */
  leituraDaDiferenca: string;
  conferencia: Conferencia;
}

export interface Publico {
  id: string;
  rotulo: string;
  resumo: string;
  /** A pergunta que este público faz. É ela que justifica a ordem abaixo. */
  pergunta: string;
  /** Os MESMOS indicadores, em outra ordem. Nenhum some; nenhum é exclusivo. */
  ordem: string[];
  /** Quantos dos primeiros ganham peso visual. O recorte é ênfase, não filtro. */
  destaques: number;
}

// ---------------------------------------------------------------------------
// A varredura do acervo — uma passada, memoizada
// ---------------------------------------------------------------------------

interface ExemploDeEntidade {
  id: string;
  titulo: string;
  classe: ClasseEntidade;
  grau: number;
}

interface Acervo {
  entidades: Entidade[];
  entidadesPorProcedencia: Record<Procedencia, number>;
  classesPorProcedencia: Record<Procedencia, Array<[ClasseEntidade, number]>>;
  exemploPorProcedencia: Record<Procedencia, ExemploDeEntidade | null>;
  arestasPorProcedencia: Record<Procedencia, number>;
  relacoesPorProcedencia: Record<Procedencia, Array<[Relacao, number]>>;
  totalDeArestas: number;
}

let acervoMemorizado: Acervo | null = null;

const CLASSES: readonly ClasseEntidade[] = [
  "coletivo",
  "conteudo",
  "espaco",
  "evento",
  "formacao",
  "instituicao",
  "linguagem",
  "midia",
  "obra",
  "ocorrencia",
  "pessoa",
  "pessoa-usuaria",
  "programa",
  "publicacao",
  "repertorio",
  "tema",
  "temporada",
  "termo",
  "territorio",
  "trilha",
];

const zerado = (): Record<Procedencia, number> => ({ ic: 0, derivado: 0, autorado: 0, parceiro: 0 });

/**
 * A varredura. UMA passada sobre o acervo inteiro, pela porta de `grafo.ts`.
 *
 * A adjacência é não dirigida e cada aresta aparece nas duas pontas, então a contagem
 * DEDUPLICA por `de|relacao|para` antes de somar. Sem isso, todo número de aresta sairia
 * quase o dobro — e «quase» é o pior caso, porque um laço (`de === para`) aparece uma vez
 * só e o erro deixaria de ser um fator constante que alguém notaria.
 *
 * O exemplo de cada procedência é O NÓ DE MAIOR GRAU daquela procedência, desempatado pelo
 * id. É regra, e não escolha: uma entidade escolhida à mão vira literal disfarçado e troca
 * de significado sem aviso quando o grafo é regerado. E é a regra certa para o que a tela
 * quer dizer — «a coisa mais conectada que veio de cada lugar».
 */
function acervo(): Acervo {
  if (acervoMemorizado) return acervoMemorizado;

  const entidades: Entidade[] = [];
  for (const classe of CLASSES) {
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      if (e) entidades.push(e);
    }
  }
  entidades.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const entidadesPorProcedencia = zerado();
  const arestasPorProcedencia = zerado();
  const porClasse: Record<Procedencia, Map<ClasseEntidade, number>> = {
    ic: new Map(),
    derivado: new Map(),
    autorado: new Map(),
    parceiro: new Map(),
  };
  const porRelacao: Record<Procedencia, Map<Relacao, number>> = {
    ic: new Map(),
    derivado: new Map(),
    autorado: new Map(),
    parceiro: new Map(),
  };
  const exemploPorProcedencia: Record<Procedencia, ExemploDeEntidade | null> = {
    ic: null,
    derivado: null,
    autorado: null,
    parceiro: null,
  };

  const vistas = new Set<string>();

  for (const e of entidades) {
    entidadesPorProcedencia[e.procedencia] += 1;
    porClasse[e.procedencia].set(e.classe, (porClasse[e.procedencia].get(e.classe) ?? 0) + 1);

    const ligacoes = vizinhos(e.id);
    const atual = exemploPorProcedencia[e.procedencia];
    if (!atual || ligacoes.length > atual.grau) {
      exemploPorProcedencia[e.procedencia] = {
        id: e.id,
        titulo: e.titulo,
        classe: e.classe,
        grau: ligacoes.length,
      };
    }

    for (const { aresta } of ligacoes) {
      const chave = `${aresta.de}|${aresta.relacao}|${aresta.para}`;
      if (vistas.has(chave)) continue;
      vistas.add(chave);
      arestasPorProcedencia[aresta.procedencia] += 1;
      porRelacao[aresta.procedencia].set(
        aresta.relacao,
        (porRelacao[aresta.procedencia].get(aresta.relacao) ?? 0) + 1,
      );
    }
  }

  const maiores = <T>(m: Map<T, number>): Array<[T, number]> =>
    [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));

  acervoMemorizado = {
    entidades,
    entidadesPorProcedencia,
    classesPorProcedencia: {
      ic: maiores(porClasse.ic),
      derivado: maiores(porClasse.derivado),
      autorado: maiores(porClasse.autorado),
      parceiro: maiores(porClasse.parceiro),
    },
    exemploPorProcedencia,
    arestasPorProcedencia,
    relacoesPorProcedencia: {
      ic: maiores(porRelacao.ic),
      derivado: maiores(porRelacao.derivado),
      autorado: maiores(porRelacao.autorado),
      parceiro: maiores(porRelacao.parceiro),
    },
    totalDeArestas: vistas.size,
  };
  return acervoMemorizado;
}

// ---------------------------------------------------------------------------
// O painel de procedência (D-88)
// ---------------------------------------------------------------------------

const porcento = (n: number, total: number): number =>
  total > 0 ? Number(((n / total) * 100).toFixed(1)) : 0;

/**
 * O mesmo número, escrito em português, para entrar nas FRASES do módulo.
 *
 * `61.8%` no meio de um parágrafo em português, ao lado de um rótulo que diz `61,8%`, é
 * duas grafias do mesmo número na mesma tela — e quem lê passa um segundo decidindo se são
 * o mesmo número. Custa uma função e some.
 */
const pt = (n: number): string => String(n).replace(".", ",");

/**
 * A conferência que derruba o build.
 *
 * Ela é chamada ANTES de qualquer fatia ser montada, e não depois: uma verificação que roda
 * no fim já deixou o número errado passar pelo caminho todo, e o hábito de «avisar» em vez
 * de quebrar é como um painel de procedência deixa de ser prova e vira decoração.
 */
function conferir(): Conferencia {
  const a = acervo();
  const doGrafo = contagens().porProcedencia;

  const problemas: string[] = [];
  let somaDeEntidades = 0;
  let somaDeArestas = 0;

  for (const p of PROCEDENCIAS) {
    const meu = a.entidadesPorProcedencia[p];
    const deGrafo = doGrafo[p] ?? 0;
    const deMeta = META.porProcedencia[p] ?? 0;
    somaDeEntidades += meu;
    if (meu !== deGrafo || meu !== deMeta) {
      problemas.push(
        `entidades «${p}»: varredura ${meu}, contagens() de grafo.ts ${deGrafo}, meta.json ${deMeta}`,
      );
    }
    const minhasArestas = a.arestasPorProcedencia[p];
    const arestasDeMeta = META.porProcedenciaDeAresta[p] ?? 0;
    somaDeArestas += minhasArestas;
    if (minhasArestas !== arestasDeMeta) {
      problemas.push(`ligações «${p}»: varredura ${minhasArestas}, meta.json ${arestasDeMeta}`);
    }
  }

  if (somaDeEntidades !== META.totais.entidades) {
    problemas.push(
      `as fatias de entidade somam ${somaDeEntidades} e o acervo tem ${META.totais.entidades}`,
    );
  }
  if (somaDeArestas !== a.totalDeArestas || somaDeArestas !== META.totais.arestas) {
    problemas.push(
      `as fatias de aresta somam ${somaDeArestas}, a varredura viu ${a.totalDeArestas} ligações distintas e meta.json declara ${META.totais.arestas}`,
    );
  }

  if (problemas.length) {
    throw new Error(
      `observatorio.ts: o painel de procedência NÃO FECHA e a tela não pode abrir.\n` +
        problemas.map((p) => `  · ${p}`).join("\n") +
        `\nUma fatia que não fecha é o sintoma de um porProcedencia desatualizado — ` +
        `regere o grafo (npm run gerar-grafo) em vez de relaxar esta conferência. ` +
        `O painel de procedência é o argumento inteiro da tela: melhor não compilar do que exibir.`,
    );
  }

  return {
    fecha: true,
    somaDeEntidades,
    somaDeArestas,
    totalDeEntidades: META.totais.entidades,
    totalDeArestas: META.totais.arestas,
    fontes: [
      "varredura própria por slugsPorTipo() + porSlug() + vizinhos() de grafo.ts",
      "contagens().porProcedencia de grafo.ts",
      "porProcedencia, porProcedenciaDeAresta e totais de src/dados/gerado/meta.json",
    ],
    geradoEm: META.geradoEm,
  };
}

const ROTULO_DA_RELACAO: Partial<Record<Relacao, string>> = {
  semelhante_a: "semelhante a",
  pertence_a: "pertence a",
  ocorre_em: "ocorre em",
  situado_em: "situado em",
  atua_em: "atua em",
  fala_sobre: "fala sobre",
  dialoga_com: "dialoga com",
  duplicata_suspeita: "duplicata suspeita",
  deriva_de: "deriva de",
};

let painelMemorizado: PainelDeProcedencia | null = null;

export function painelDeProcedencia(): PainelDeProcedencia {
  if (painelMemorizado) return painelMemorizado;

  const conferencia = conferir();
  const a = acervo();
  const totalDeEntidades = conferencia.somaDeEntidades;
  const totalDeArestas = conferencia.somaDeArestas;

  const entidades: FatiaDeProcedencia[] = PROCEDENCIAS.map((p) => {
    const n = a.entidadesPorProcedencia[p];
    const exemplo = a.exemploPorProcedencia[p];
    return {
      procedencia: p,
      rotulo: ROTULO_DA_PROCEDENCIA[p],
      n,
      fracao: n / totalDeEntidades,
      percentual: porcento(n, totalDeEntidades),
      significado: SIGNIFICADO_DA_PROCEDENCIA[p],
      exemplo: exemplo ? `${exemplo.classe} · ${exemplo.titulo}` : "—",
      regraDoExemplo: "exemplo · a mais conectada",
      composicao: a.classesPorProcedencia[p]
        .slice(0, 4)
        .map(([classe, quantos]) => ({ rotulo: classe, valor: quantos, de: n })),
    };
  });

  const arestas: FatiaDeProcedencia[] = PROCEDENCIAS.map((p) => {
    const n = a.arestasPorProcedencia[p];
    const top = a.relacoesPorProcedencia[p][0];
    return {
      procedencia: p,
      rotulo: ROTULO_DA_PROCEDENCIA[p],
      n,
      fracao: n / totalDeArestas,
      percentual: porcento(n, totalDeArestas),
      significado: SIGNIFICADO_DA_PROCEDENCIA[p],
      exemplo: top
        ? `${(ROTULO_DA_RELACAO[top[0]] ?? top[0]).toString()} — ${top[1].toLocaleString("pt-BR")} ligações`
        : "—",
      regraDoExemplo: "exemplo · a relação mais frequente",
      composicao: a.relacoesPorProcedencia[p]
        .slice(0, 4)
        .map(([relacao, quantos]) => ({
          rotulo: ROTULO_DA_RELACAO[relacao] ?? relacao,
          valor: quantos,
          de: n,
        })),
    };
  });

  const eIc = entidades.find((f) => f.procedencia === "ic") as FatiaDeProcedencia;
  const eDerivado = entidades.find((f) => f.procedencia === "derivado") as FatiaDeProcedencia;
  const eAutorado = entidades.find((f) => f.procedencia === "autorado") as FatiaDeProcedencia;
  const aIc = arestas.find((f) => f.procedencia === "ic") as FatiaDeProcedencia;
  const aDerivado = arestas.find((f) => f.procedencia === "derivado") as FatiaDeProcedencia;

  painelMemorizado = {
    entidades,
    arestas,
    totalDeEntidades,
    totalDeArestas,
    leituraDaDiferenca:
      `As duas leituras contam histórias diferentes, e é a segunda que explica por que este grafo parece rico. ` +
      `Em entidade, o Itaú Cultural é ${pt(eIc.percentual)}% e o que nós derivamos é ${pt(eDerivado.percentual)}%. ` +
      `Em aresta a proporção se inverte: o acervo entrega ${pt(aIc.percentual)}% das ligações e ${pt(aDerivado.percentual)}% ` +
      `foram derivadas por nós — a semelhança, a ocorrência datada, o lugar. ` +
      `O acervo deu as coisas; a maior parte das ligações entre elas é leitura nossa, e está dita aqui em vez de ` +
      `passar por acervo. E ${eAutorado.n} entidades — ${pt(eAutorado.percentual)}% — nós simplesmente inventamos.`,
    conferencia,
  };
  return painelMemorizado;
}

// ---------------------------------------------------------------------------
// Os cinco indicadores de D-87, mais os dois que o acervo não sustenta
// ---------------------------------------------------------------------------

const soma = (ns: number[]): number => ns.reduce((s, n) => s + n, 0);

/** Ampliação de repertório: linguagens atravessadas contra linguagens declaradas. */
function ampliacaoDeRepertorio(): Indicador {
  const linhas: LinhaDeIndicador[] = [];
  let declaradas = 0;
  let atravessadas = 0;

  for (const persona of PERSONAS) {
    const r = repertorioDe(persona.id);
    declaradas += r.linguagensDeclaradas.length;
    atravessadas += r.linguagensAtravessadas.length;
    linhas.push({
      rotulo: r.nome,
      valor: r.linguagensAtravessadas.length,
      de: r.linguagensDeclaradas.length,
      nota: `${r.diagnostico.entidadesNoRepertorio} entidades no repertório · ${r.linguagensNovas.length} linguagens novas no adjacente`,
    });
  }

  return {
    id: "ampliacao-de-repertorio",
    rotulo: "Ampliação de repertório",
    valor: atravessadas,
    unidade: "linguagens atravessadas",
    denominador: {
      n: PERSONAS.length,
      do_que:
        "personas autoradas — este indicador inteiro se apoia em pessoas que nós inventamos",
    },
    denominadorSecundario: {
      n: declaradas,
      do_que: "linguagens que os repertórios delas declaram",
    },
    sustentado: true,
    procedenciaDoNumero:
      "src/dados/repertorio.ts · repertorioDe().linguagensAtravessadas sobre as 3 personas de personas.json",
    declaracao: null,
    leitura:
      `As três personas declaram ${declaradas} linguagens e atravessam ${atravessadas}: as entidades que elas guardaram ` +
      `carregam linguagem que elas nunca disseram gostar, e é essa diferença que a plataforma existe para produzir. ` +
      `O denominador é ${PERSONAS.length} — três pessoas autoradas por nós, não uma base de usuários. ` +
      `Num sistema em produção este mesmo cálculo roda sobre gente real sem mudar de forma; ` +
      `o que muda é o n, e o n está na tela.`,
    detalhe: linhas,
  };
}

/** Descoberta de artista novo: pessoa ou coletivo no adjacente e fora do repertório. */
function descobertaDeArtistaNovo(): Indicador {
  const linhas: LinhaDeIndicador[] = [];
  let novos = 0;
  let adjacentes = 0;

  for (const persona of PERSONAS) {
    const r = repertorioDe(persona.id);
    const noRepertorio = new Set<string>();
    for (const grupo of r.atravessado) for (const item of grupo.entidades) noRepertorio.add(item.id);
    const artistas = r.adjacente.filter(
      (c) => (c.classe === "pessoa" || c.classe === "coletivo") && !noRepertorio.has(c.id),
    );
    novos += artistas.length;
    adjacentes += r.adjacente.length;
    linhas.push({
      rotulo: r.nome,
      valor: artistas.length,
      de: r.adjacente.length,
      nota:
        artistas.length === 0
          ? "zero MEDIDO sobre um adjacente real: o que está encostado no repertório da Joana são obras e conteúdos, não pessoas"
          : `${artistas.length} de ${r.adjacente.length} adjacentes são pessoa ou coletivo fora do repertório`,
    });
  }

  return {
    id: "descoberta-de-artista-novo",
    rotulo: "Descoberta de artista novo",
    valor: novos,
    unidade: "pessoas e coletivos a um salto, fora do repertório",
    denominador: {
      n: adjacentes,
      do_que: "entidades no adjacente a um salto das três personas",
    },
    denominadorSecundario: {
      n: PERSONAS.length,
      do_que: "personas autoradas",
    },
    sustentado: true,
    procedenciaDoNumero:
      "src/dados/repertorio.ts · repertorioDe().adjacente filtrado por classe pessoa|coletivo, menos o que já está no repertório",
    leitura:
      `${novos} pessoas e coletivos estão a UM salto do que as três personas já atravessaram e não estão no repertório de ninguém. ` +
      `Uma das três dá ZERO, e o zero fica na tela com o denominador ao lado: é medida, não ausência de dado. ` +
      `A diferença entre este zero e o de gratuidade, mais abaixo, é a tela inteira — aqui o corte funcionou e deu zero; ` +
      `lá o corte não recorta nada.`,
    declaracao: null,
    detalhe: linhas,
  };
}

/** Diversidade de linguagem por região: linguagens distintas por unidade federativa. */
function diversidadeDeLinguagemPorRegiao(): Indicador {
  const d = densidadePorUf();

  const estados = new Map<string, string>();
  for (const slug of slugsPorTipo("territorio")) {
    const t = porSlug("territorio", slug);
    if (t?.coordenada?.metodo === "centroide-estado") estados.set(t.titulo, t.id);
  }

  const linhas: LinhaDeIndicador[] = [];
  const comEstado = new Set<string>();
  const valores: number[] = [];

  for (const uf of d.ufs) {
    const id = estados.get(uf.titulo);
    const situadas = id ? porTerritorio(id) : [];
    const linguagens = new Set<string>();
    for (const e of situadas) {
      comEstado.add(e.id);
      for (const l of e.linguagens) linguagens.add(l);
    }
    valores.push(linguagens.size);
    linhas.push({
      rotulo: uf.sigla,
      valor: linguagens.size,
      de: situadas.length,
      nota: uf.registros === 0 ? "nenhum registro no acervo" : undefined,
    });
  }

  linhas.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0) || a.rotulo.localeCompare(b.rotulo));

  const ordenados = [...valores].sort((x, y) => x - y);
  const meio = Math.floor(ordenados.length / 2);
  const mediana =
    ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
  const maior = linhas[0];
  const noAcervo = META.totais.entidades;

  return {
    id: "diversidade-de-linguagem-por-regiao",
    rotulo: "Diversidade de linguagem por região",
    valor: mediana,
    unidade: "linguagens distintas por estado (mediana das 27)",
    denominador: {
      n: comEstado.size,
      do_que: "entidades com estado resolvível por situado_em — a base real deste recorte",
    },
    denominadorSecundario: {
      n: noAcervo,
      do_que: `entidades no acervo, das quais ${pt(porcento(comEstado.size, noAcervo))}% sustentam este corte`,
    },
    sustentado: true,
    procedenciaDoNumero:
      "src/dados/grafo.ts · porTerritorio() sobre os 27 estados de geo.ts · densidadePorUf() para a lista das unidades federativas",
    declaracao: null,
    leitura:
      `A mediana é ${mediana} linguagens por estado e o topo é ${maior.rotulo} com ${maior.valor}. ` +
      `E o denominador é o que importa aqui: só ${comEstado.size} das ${noAcervo.toLocaleString("pt-BR")} entidades ` +
      `— ${pt(porcento(comEstado.size, noAcervo))}% do acervo — têm estado resolvível. ` +
      `Este indicador é verdadeiro sobre essas ${comEstado.size}, e não sobre o acervo; ` +
      `apresentá-lo sem o denominador seria afirmar sobre 7.810 uma coisa medida em ${comEstado.size}.`,
    detalhe: linhas,
  };
}

/** Circulação territorial: a concentração medida da documentação. */
function circulacaoTerritorial(): Indicador {
  const d = densidadePorUf();
  const ordenadas = [...d.ufs].sort((a, b) => b.registros - a.registros);
  const [primeiro, segundo] = ordenadas;
  const percentual = porcento(d.doisMaiores, d.total);

  return {
    id: "circulacao-territorial",
    rotulo: "Circulação territorial",
    valor: percentual,
    unidade: `% dos registros de lugar em 2 dos ${d.ufs.length} estados`,
    denominador: {
      n: d.total,
      do_que: "registros de lugar no acervo — cada vínculo entre uma entidade e um território",
    },
    denominadorSecundario: {
      n: d.entidadesDistintas,
      do_que: "entidades distintas por trás desses registros",
    },
    sustentado: true,
    procedenciaDoNumero: "src/dados/geo.ts · densidadePorUf() sobre as ligações situado_em",
    declaracao: null,
    leitura:
      `${primeiro.titulo} tem ${primeiro.registros} registros e ${segundo.titulo}, ${segundo.registros}: ` +
      `${d.doisMaiores} dos ${d.total}, ${pt(percentual)}% em dois estados de ${d.ufs.length}. ` +
      `${d.comUmRegistro.length} estados têm um registro só e ${d.semRegistro.length} não aparecem em lugar nenhum. ` +
      `O que este número mede é DOCUMENTAÇÃO, não oferta: ele diz onde o acervo olhou, não onde há cultura.`,
    detalhe: ordenadas
      .slice(0, 8)
      .map((uf) => ({ rotulo: uf.sigla, valor: uf.registros, de: d.total })),
  };
}

/** Gratuito × pago — o caso em que o dado NÃO sustenta o indicador (D-90). */
function gratuitoXPago(): Indicador {
  let eventos = 0;
  let comPrecoDeclarado = 0;
  let semCampoDeIngresso = 0;

  for (const e of acervo().entidades) {
    if (e.classe !== "evento") continue;
    eventos += 1;
    const extra = e.extra as { comIngresso?: boolean; preco?: unknown } | undefined;
    if (extra?.preco != null && extra.preco !== "") comPrecoDeclarado += 1;
    if (extra?.comIngresso === undefined) semCampoDeIngresso += 1;
  }

  const ocorrencias = META.totais.ocorrencias;

  return {
    id: "gratuito-x-pago",
    rotulo: "Gratuito × pago",
    valor: null,
    unidade: "—",
    denominador: {
      n: eventos,
      do_que: `eventos no acervo, dos quais ${comPrecoDeclarado} declaram preço de ingresso`,
    },
    denominadorSecundario: {
      n: ocorrencias,
      do_que:
        "ocorrências, TODAS marcadas gratuitas — porque gratuito é a negação de um campo que ninguém preencheu",
    },
    sustentado: false,
    procedenciaDoNumero:
      "src/dados/grafo.ts · extra.comIngresso e extra.preco sobre as entidades de classe evento · meta.json · totais.ocorrencias",
    declaracao:
      `Gratuito × pago não recorta nada neste acervo, e a tela diz isso em vez de desenhar uma barra de 100%. ` +
      `${comPrecoDeclarado} de ${eventos} eventos declaram preço de ingresso — ${semCampoDeIngresso} não têm sequer o campo, ` +
      `e os outros ${eventos - semCampoDeIngresso} o têm vazio. As ${ocorrencias.toLocaleString("pt-BR")} ocorrências saem ` +
      `todas gratuitas porque «gratuito» é a negação de um campo vazio, não uma afirmação sobre o preço. ` +
      `Uma barra dizendo «100% gratuito» seria tecnicamente derivável do dado e completamente falsa sobre o mundo.`,
    leitura:
      "O corte existe no produto e está DESLIGADO aqui, com o motivo escrito. O dia em que a fonte publicar preço, este mesmo indicador acende sem uma linha de código nova — o que falta é dado, não software.",
    detalhe: [
      { rotulo: "eventos que declaram preço", valor: comPrecoDeclarado, de: eventos },
      { rotulo: "eventos sem o campo de ingresso", valor: semCampoDeIngresso, de: eventos },
      { rotulo: "ocorrências marcadas gratuitas", valor: ocorrencias, de: ocorrencias },
    ],
  };
}

/** Acessibilidade como critério — sustentado em 3 das 8 dimensões, e a tela diz quais. */
function acessibilidadeComoCriterio(): Indicador {
  const dimensoes = Object.keys(META.acessibilidadeIncluindoDerivadas);
  const comRegistro = dimensoes.filter(
    (d) => (META.acessibilidadeIncluindoDerivadas[d] ?? 0) > 0,
  );
  const ficha = META.fichaDeAcessibilidade;
  const total = META.totais.entidades;

  return {
    id: "acessibilidade-como-criterio",
    rotulo: "Acessibilidade como critério",
    valor: comRegistro.length,
    unidade: `das ${dimensoes.length} dimensões têm ao menos um registro no acervo inteiro`,
    denominador: {
      n: dimensoes.length,
      do_que: "dimensões de acessibilidade do vocabulário — 5 delas medem zero em 7.810 entidades",
    },
    denominadorSecundario: {
      n: ficha.declaram,
      do_que: `entidades que PREENCHERAM a ficha; ${ficha.naoDeclaram} não a preencheram, e as duas coisas são diferentes (D-43)`,
    },
    sustentado: true,
    procedenciaDoNumero:
      "src/dados/gerado/meta.json · acessibilidadeIncluindoDerivadas e fichaDeAcessibilidade",
    declaracao: null,
    leitura:
      `${comRegistro.length} das ${dimensoes.length} dimensões têm registro: ${comRegistro.join(", ")}. ` +
      `As outras ${dimensoes.length - comRegistro.length} medem zero em todas as ${total.toLocaleString("pt-BR")} entidades. ` +
      `Isso é uma medida real e não uma falha de leitura — e ela vale como diagnóstico do acervo, não do produto. ` +
      `${ficha.declaram.toLocaleString("pt-BR")} entidades preencheram a ficha e ${ficha.naoDeclaram.toLocaleString("pt-BR")} não preencheram: ` +
      `«declarado ausente» e «não declarado» continuam separados aqui como já estão na ficha do evento.`,
    detalhe: dimensoes
      .map((d) => ({
        rotulo: d,
        valor: META.acessibilidadeIncluindoDerivadas[d] ?? 0,
        de: total,
      }))
      .sort((a, b) => b.valor - a.valor || a.rotulo.localeCompare(b.rotulo)),
  };
}

/**
 * Faixa etária — o segundo caso em que o dado não sustenta, e é de outra espécie.
 *
 * Gratuidade tem campo e o campo está vazio. Faixa etária NÃO TEM CAMPO: nem no CMS, nem na
 * Enciclopédia, nem nos 7.810 registros. `disposicoes.ts` já registra isso por escrito e
 * mantém o corte visível e desligado. Um proxy por palavra no título — «infantil», «livre» —
 * seria inventar a classificação indicativa de um evento real, que é a categoria de mentira
 * mais cara que esta tela poderia cometer.
 */
function faixaEtaria(): Indicador {
  const total = META.totais.entidades;
  return {
    id: "faixa-etaria",
    rotulo: "Faixa etária",
    valor: null,
    unidade: "—",
    denominador: {
      n: 0,
      do_que: `campos de faixa etária nas ${total.toLocaleString("pt-BR")} registros do acervo`,
    },
    denominadorSecundario: {
      n: total,
      do_que: "entidades varridas atrás do campo — nenhuma o tem",
    },
    sustentado: false,
    procedenciaDoNumero:
      "src/dados/disposicoes.ts · o corte por faixa etária já nasce visível e desligado, com o motivo escrito",
    declaracao:
      "O acervo não declara faixa etária nem classificação indicativa em campo nenhum — nem no CMS, nem na Enciclopédia, nem nos 7.810 registros. Este recorte fica visível e desligado. Adivinhar por palavra no título seria inventar a classificação indicativa de um evento real, e é diferente de gratuidade: lá o campo existe e está vazio; aqui o campo não existe.",
    leitura:
      "Dois indicadores desta tela não são sustentados pelo acervo, e eles falham por motivos diferentes. A tela mostra os dois em vez de mostrar cinco que fecham bonito.",
    detalhe: [],
  };
}

/**
 * A invariante de D-90, conferida em vez de confiada.
 *
 * `valor: null` e `sustentado: false` são a MESMA afirmação e nunca podem se separar; um
 * indicador não sustentado sem frase é um zero silencioso com outro nome. Isto era um laço
 * dentro de `indicadores()` e virou função porque as telas da superfície montam indicador
 * FORA daquela lista — o recorte por persona da tela de impacto, por exemplo. Um indicador
 * que escapasse da conferência por ter nascido em outro lugar seria a primeira porta por
 * onde o zero silencioso volta.
 */
export function conferirIndicador(i: Indicador): Indicador {
  if ((i.valor === null) !== (i.sustentado === false)) {
    throw new Error(
      `observatorio.ts: «${i.id}» tem valor ${JSON.stringify(i.valor)} com sustentado=${i.sustentado}. ` +
        `valor null e sustentado false são a mesma afirmação e andam juntos; zero com sustentado true é uma MEDIDA. ` +
        `Confundir as duas é exatamente o que D-90 existe para impedir.`,
    );
  }
  if (!i.sustentado && !i.declaracao) {
    throw new Error(
      `observatorio.ts: «${i.id}» não é sustentado pelo acervo e não traz declaração. ` +
        `Um indicador sem lastro e sem frase é um zero silencioso.`,
    );
  }
  if (!i.denominador?.do_que || typeof i.denominador.n !== "number") {
    throw new Error(`observatorio.ts: «${i.id}» sem denominador nomeado.`);
  }
  if (!i.procedenciaDoNumero) {
    throw new Error(`observatorio.ts: «${i.id}» sem a origem do número.`);
  }
  return i;
}

let indicadoresMemorizados: Indicador[] | null = null;

export function indicadores(): Indicador[] {
  if (indicadoresMemorizados) return indicadoresMemorizados;

  const lista = [
    ampliacaoDeRepertorio(),
    descobertaDeArtistaNovo(),
    diversidadeDeLinguagemPorRegiao(),
    circulacaoTerritorial(),
    gratuitoXPago(),
    acessibilidadeComoCriterio(),
    faixaEtaria(),
  ];

  for (const i of lista) conferirIndicador(i);

  indicadoresMemorizados = lista;
  return lista;
}

// ---------------------------------------------------------------------------
// O seletor de público (D-89) — troca o RECORTE, não a tela
// ---------------------------------------------------------------------------

const TODOS_OS_INDICADORES = [
  "ampliacao-de-repertorio",
  "descoberta-de-artista-novo",
  "diversidade-de-linguagem-por-regiao",
  "circulacao-territorial",
  "gratuito-x-pago",
  "acessibilidade-como-criterio",
  "faixa-etaria",
];

/**
 * Os quatro públicos.
 *
 * CADA UM TEM OS SETE INDICADORES, EM OUTRA ORDEM. Nenhum público esconde nada e nenhum tem
 * bloco exclusivo — é a mesma superfície servindo escopos diferentes, exatamente como o
 * escopo do curador em D-84. Um seletor que ocultasse indicador viraria filtro, e filtro que
 * some com o número inconveniente é o oposto do que esta tela existe para ser: o público
 * institucional é justamente o que mais precisa ver que gratuidade não sustenta.
 *
 * E o painel de procedência não entra nesta lista de propósito: ele é de primeira classe nos
 * quatro e não é reordenável por ninguém.
 */
export const PUBLICOS: readonly Publico[] = [
  {
    id: "editorial",
    rotulo: "Editorial",
    resumo: "quem decide o que entra na home e o que vira pauta",
    pergunta: "o que este acervo permite contar que ninguém está contando?",
    ordem: [
      "diversidade-de-linguagem-por-regiao",
      "descoberta-de-artista-novo",
      "circulacao-territorial",
      "ampliacao-de-repertorio",
      "acessibilidade-como-criterio",
      "gratuito-x-pago",
      "faixa-etaria",
    ],
    destaques: 2,
  },
  {
    id: "produto",
    rotulo: "Produto",
    resumo: "quem decide o que construir depois",
    pergunta: "qual recorte já funciona e qual está esperando dado?",
    ordem: [
      "ampliacao-de-repertorio",
      "descoberta-de-artista-novo",
      "gratuito-x-pago",
      "faixa-etaria",
      "acessibilidade-como-criterio",
      "diversidade-de-linguagem-por-regiao",
      "circulacao-territorial",
    ],
    destaques: 2,
  },
  {
    id: "parceiro",
    rotulo: "Parceiro",
    resumo: "quem traz acervo e quer saber o que ganha ao entrar",
    pergunta: "o que o meu acervo passa a alcançar aqui dentro?",
    ordem: [
      "circulacao-territorial",
      "diversidade-de-linguagem-por-regiao",
      "ampliacao-de-repertorio",
      "descoberta-de-artista-novo",
      "acessibilidade-como-criterio",
      "gratuito-x-pago",
      "faixa-etaria",
    ],
    destaques: 2,
  },
  {
    id: "institucional",
    rotulo: "Institucional",
    resumo: "quem presta contas do impacto da política cultural",
    pergunta: "onde a documentação da cultura brasileira não chega?",
    ordem: [
      "circulacao-territorial",
      "acessibilidade-como-criterio",
      "diversidade-de-linguagem-por-regiao",
      "gratuito-x-pago",
      "ampliacao-de-repertorio",
      "descoberta-de-artista-novo",
      "faixa-etaria",
    ],
    destaques: 2,
  },
];

// A mesma disciplina do resto do módulo: um público que perdesse um indicador viraria filtro
// em silêncio, e o sintoma seria um número sumindo da tela sem ninguém decidir isso.
for (const p of PUBLICOS) {
  const faltando = TODOS_OS_INDICADORES.filter((id) => !p.ordem.includes(id));
  const sobrando = p.ordem.filter((id) => !TODOS_OS_INDICADORES.includes(id));
  if (faltando.length || sobrando.length) {
    throw new Error(
      `observatorio.ts: o público «${p.id}» não traz os mesmos indicadores que os outros. ` +
        `Faltando: [${faltando.join(", ")}]. Sobrando: [${sobrando.join(", ")}]. ` +
        `D-89 é troca de RECORTE e não de tela: os quatro públicos mostram os mesmos blocos em outra ordem.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Os números que a tela e o gate de 05-08 citam
// ---------------------------------------------------------------------------

export interface NumerosDoObservatorio {
  entidades: number;
  arestas: number;
  entidadesIc: number;
  entidadesDerivado: number;
  entidadesAutorado: number;
  arestasIc: number;
  arestasDerivado: number;
  arestasAutorado: number;
  indicadores: number;
  naoSustentados: number;
  publicos: number;
  personas: number;
  bytesDoDto: number;
  tetoDoDto: number;
  geradoEm: string;
}

export function numerosDoObservatorio(): NumerosDoObservatorio {
  const p = painelDeProcedencia();
  const ind = indicadores();
  const fatia = (fs: FatiaDeProcedencia[], q: Procedencia) =>
    fs.find((f) => f.procedencia === q)?.n ?? 0;

  const bytesDoDto = JSON.stringify({ painel: p, indicadores: ind, publicos: PUBLICOS }).length;
  if (bytesDoDto > TETO_DO_DTO) {
    throw new Error(
      `observatorio.ts: o DTO ficou com ${bytesDoDto} bytes, acima do teto declarado de ${TETO_DO_DTO}. ` +
        `Agregue a diversidade por unidade federativa em vez de por entidade, ou corte campo de detalhe — ` +
        `e DECLARE o corte na tela, em vez de reduzir o que a tela afirma.`,
    );
  }

  return {
    entidades: p.totalDeEntidades,
    arestas: p.totalDeArestas,
    entidadesIc: fatia(p.entidades, "ic"),
    entidadesDerivado: fatia(p.entidades, "derivado"),
    entidadesAutorado: fatia(p.entidades, "autorado"),
    arestasIc: fatia(p.arestas, "ic"),
    arestasDerivado: fatia(p.arestas, "derivado"),
    arestasAutorado: fatia(p.arestas, "autorado"),
    indicadores: ind.length,
    naoSustentados: ind.filter((i) => !i.sustentado).length,
    publicos: PUBLICOS.length,
    personas: PERSONAS.length,
    bytesDoDto,
    tetoDoDto: TETO_DO_DTO,
    geradoEm: META.geradoEm,
  };
}

// ---------------------------------------------------------------------------
// O DTO inteiro da tela
// ---------------------------------------------------------------------------

export interface DadosDoObservatorio {
  painel: PainelDeProcedencia;
  indicadores: Indicador[];
  publicos: readonly Publico[];
  publicoInicial: string;
  numeros: NumerosDoObservatorio;
}

export function montarObservatorio(): DadosDoObservatorio {
  return {
    painel: painelDeProcedencia(),
    indicadores: indicadores(),
    publicos: PUBLICOS,
    publicoInicial: PUBLICOS[0].id,
    numeros: numerosDoObservatorio(),
  };
}

/** `soma` fica exportada porque o gate de 05-08 confere as fatias com ela. */
export const somarFatias = (fs: FatiaDeProcedencia[]): number => soma(fs.map((f) => f.n));

// ---------------------------------------------------------------------------
// G3 · Impacto cultural — o recorte da tela, e o par de D-90 que ela fixa
// ---------------------------------------------------------------------------

/**
 * Uma persona, no que a tela de impacto mede dela.
 *
 * O DENOMINADOR DESTA TELA INTEIRA SÃO TRÊS PESSOAS, e três pessoas autoradas por nós. É
 * pouco a ponto de a tela ter de dizer, e ela diz: um indicador de impacto sobre 3 pessoas
 * é demonstração, não medição. O cálculo é o mesmo que roda sobre gente real; o que muda é
 * o n, e o n está na tela.
 */
export interface PersonaNoImpacto {
  id: string;
  nome: string;
  /** Linguagens que o repertório DECLARA. */
  declaradas: number;
  /** A união medida: as declaradas mais as que as entidades atravessadas carregam. */
  atravessadas: number;
  /** Ids de linguagem presentes no adjacente e ausentes do atravessado. */
  novas: string[];
  entidadesNoRepertorio: number;
  /** Entidades a UM salto do que ela já atravessou. */
  adjacentes: number;
  /** Pessoas e coletivos a um salto, fora do repertório. Zero aqui é MEDIDA. */
  artistasNovos: number;
}

export interface DadosDoImpacto {
  personas: PersonaNoImpacto[];
  ampliacao: Indicador;
  descoberta: Indicador;
  /**
   * O caso didático de D-90, recortado por REGRA: a persona cuja descoberta de artista novo
   * deu zero, sobre um adjacente real. `null` quando nenhuma deu zero — e aí a tela declara
   * que o par não existe hoje, em vez de escolher outra persona para caber na explicação.
   */
  zeroMedido: Indicador | null;
  /** O outro lado do par: o indicador que o acervo NÃO sustenta. */
  semLastro: Indicador;
  denominador: Denominador;
}

const exigirIndicador = (id: string): Indicador => {
  const i = indicadores().find((x) => x.id === id);
  if (!i) {
    throw new Error(
      `observatorio.ts: a tela de impacto pede o indicador «${id}» e ele não está em indicadores(). ` +
        `Ou o id mudou de nome, ou o indicador saiu da lista — e nos dois casos a tela afirmaria ` +
        `sobre um número que não existe mais.`,
    );
  }
  return i;
};

let impactoMemorizado: DadosDoImpacto | null = null;

export function montarImpacto(): DadosDoImpacto {
  if (impactoMemorizado) return impactoMemorizado;

  const ampliacao = exigirIndicador("ampliacao-de-repertorio");
  const descoberta = exigirIndicador("descoberta-de-artista-novo");
  const semLastro = exigirIndicador("gratuito-x-pago");

  const personas: PersonaNoImpacto[] = PERSONAS.map((persona) => {
    const r = repertorioDe(persona.id);
    const noRepertorio = new Set<string>();
    for (const grupo of r.atravessado) for (const item of grupo.entidades) noRepertorio.add(item.id);
    const artistas = r.adjacente.filter(
      (c) => (c.classe === "pessoa" || c.classe === "coletivo") && !noRepertorio.has(c.id),
    );
    return {
      id: persona.id,
      nome: r.nome,
      declaradas: r.linguagensDeclaradas.length,
      atravessadas: r.linguagensAtravessadas.length,
      novas: r.linguagensNovas,
      entidadesNoRepertorio: r.diagnostico.entidadesNoRepertorio,
      adjacentes: r.adjacente.length,
      artistasNovos: artistas.length,
    };
  });

  // A conferência de sempre, e ela vale a pena: este recorte por persona é uma SEGUNDA
  // contagem da mesma coisa que `descobertaDeArtistaNovo()` já conta. Duas contagens da
  // mesma coisa sem conferência entre elas é como a tela passa a dizer dois números
  // diferentes para o mesmo fato, e a divergência aparece na regeração do grafo, meses
  // depois, sem ninguém saber qual das duas envelheceu.
  const somaDeArtistas = soma(personas.map((p) => p.artistasNovos));
  const somaDeAdjacentes = soma(personas.map((p) => p.adjacentes));
  if (somaDeArtistas !== descoberta.valor || somaDeAdjacentes !== descoberta.denominador.n) {
    throw new Error(
      `observatorio.ts: o recorte por persona da tela de impacto não bate com o indicador. ` +
        `Artistas novos: ${somaDeArtistas} somados por persona contra ${descoberta.valor} do indicador. ` +
        `Adjacentes: ${somaDeAdjacentes} contra ${descoberta.denominador.n}. ` +
        `São duas contagens da mesma coisa e elas têm de concordar.`,
    );
  }

  // A REGRA, e não a escolha: a persona que deu zero. Escolher a Joana pelo nome faria a
  // tela contar uma história que o dado pode deixar de sustentar na próxima geração do
  // grafo — e o texto continuaria lá, afirmando.
  const zerada = personas.filter((p) => p.artistasNovos === 0).sort((a, b) => a.id.localeCompare(b.id))[0];

  const zeroMedido: Indicador | null = zerada
    ? conferirIndicador({
        id: `descoberta-de-artista-novo-${zerada.id}`,
        rotulo: `Descoberta de artista novo · ${zerada.nome}`,
        valor: zerada.artistasNovos,
        unidade: "pessoas e coletivos a um salto, fora do repertório",
        denominador: {
          n: zerada.adjacentes,
          do_que: `entidades REAIS no adjacente a um salto do repertório de ${zerada.nome} — o corte recortou, e deu zero`,
        },
        denominadorSecundario: {
          n: zerada.entidadesNoRepertorio,
          do_que: "entidades no repertório dela, de onde a travessia partiu",
        },
        sustentado: true,
        procedenciaDoNumero: `src/dados/repertorio.ts · repertorioDe("${zerada.id}").adjacente filtrado por classe pessoa|coletivo, menos o que já está no repertório`,
        declaracao: null,
        leitura:
          `Zero, e é uma MEDIDA. O adjacente de ${zerada.nome} tem ${zerada.adjacentes} entidades reais e nenhuma delas ` +
          `é pessoa ou coletivo fora do repertório: o que está encostado no que ela atravessou são obras e conteúdos. ` +
          `Este zero e o «não sustenta» ao lado parecem a mesma coisa numa tela mal feita, e não são: ` +
          `aqui o corte funcionou e o resultado foi zero; lá o corte não recorta nada.`,
        detalhe: [],
      })
    : null;

  impactoMemorizado = {
    personas,
    ampliacao,
    descoberta,
    zeroMedido,
    semLastro,
    denominador: {
      n: PERSONAS.length,
      do_que:
        "personas autoradas por nós — um indicador de impacto sobre 3 pessoas é demonstração, não medição",
    },
  };
  return impactoMemorizado;
}

// ---------------------------------------------------------------------------
// G5 · Procedência — o eixo do tempo, e a união local que espera o contrato
// ---------------------------------------------------------------------------

/**
 * As seis procedências de PRODUÇÃO, previstas no PRD §6.
 *
 * POR QUE ELA É UMA UNIÃO LOCAL E NÃO O TIPO `Procedencia`. `Procedencia` mora em
 * `tipos.ts`, que não é território desta sessão, e todo `Record<Procedencia, …>` deste
 * módulo é EXAUSTIVO: acrescentar quatro valores lá quebraria a varredura, a conferência de
 * três pontas e provavelmente os módulos das outras sessões, tudo de uma vez. O pedido de
 * contrato está registrado; enquanto ele não é atendido, o eixo do tempo se apoia nesta
 * união, e ela sai no dia em que o tipo real abrir.
 *
 * `autorado` NÃO ESTÁ AQUI, e a ausência é o argumento: ela é a procedência do protótipo e
 * a única que NÃO sobrevive ao bastidor entrar no ar. Cada um dos outros valores é um papel
 * humano — os níveis de acesso não são uma camada de segurança sobre a ontologia, eles SÃO
 * o vocabulário de procedência, e cada escrita carimba quem escreveu.
 */
export type ProcedenciaDeProducao = "ic" | "derivado" | "parceiro" | "produtor" | "ia" | "curador";

/**
 * Um degrau do eixo do tempo: uma procedência, o que ela conta hoje e o que ela vai contar.
 *
 * `hoje: null` com `existeHoje: false` é a MESMA distinção de D-90 aplicada ao vocabulário:
 * o valor não existe no tipo, então não há o que contar — e isso é diferente de existir e
 * medir zero. Um eixo que escrevesse `0` nas quatro procedências que ainda não abriram
 * afirmaria que ninguém as usou, quando o certo é que ninguém PODE usá-las ainda.
 */
export interface DegrauDaProcedencia {
  id: string;
  rotulo: string;
  /** Entidades hoje. `null` quando o valor ainda não existe no tipo. */
  hoje: number | null;
  /** Ligações hoje. `null` idem. */
  hojeEmArestas: number | null;
  existeHoje: boolean;
  /** `autorado` é a única que não sobrevive ao bastidor entrar no ar. */
  emProducao: boolean;
  /** O nível de acesso que passa a carimbar esta procedência. */
  quemCarimba: string;
  significado: string;
}

export interface DadosDaProcedencia {
  painel: PainelDeProcedencia;
  eixo: DegrauDaProcedencia[];
  /** Quantas procedências existem hoje e quantas o vocabulário terá. */
  hoje: number;
  emProducao: number;
}

const QUEM_CARIMBA: Record<string, string> = {
  ic: "ninguém daqui — é o acervo do Itaú Cultural carregado como está, e é a única procedência que não é um papel",
  derivado: "a regra, no build: escrita, auditável e nossa. Não é invenção, é leitura — mas é leitura NOSSA",
  autorado: "nós, para a demonstração ter o que mostrar. Some quando houver gente escrevendo",
  parceiro: "a instituição que traz acervo próprio para dentro da plataforma",
  produtor: "o produtor cultural, nível 7 — o mesmo que hoje deixa 2.425 ocorrências em «derivado»",
  ia: "a máquina, com revisão do moderador por regra: nível 3 decide, e a decisão fica assinada",
  curador: "o editor ou curador, nível 5 — o único papel que escreve SENTIDO, e por isso assina",
};

const SIGNIFICADO_QUE_ABRE: Record<string, string> = {
  parceiro:
    "O acervo que não é do Itaú Cultural e não foi derivado por nós: entra com o nome de quem entregou, e o crédito viaja com o dado em vez de se dissolver no total.",
  produtor:
    "O acontecimento declarado por quem o produz — data, hora, preço, espaço e elenco. É a procedência que converte as 2.425 ocorrências que hoje dizem «derivado» e os dois terços da chave de identidade que hoje estão vazios.",
  ia: "O que a máquina propôs e um humano decidiu. Ela já existe de fato — 71% das ligações de hoje são semelhança de máquina —, e o que falta não é a máquina: é o carimbo dizendo que ela foi revisada, e por quem.",
  curador:
    "O sentido escrito e assinado: influência, diálogo, derivação, curadoria. São as quatro relações que a ontologia declara e ninguém escreve — zero arestas hoje, nas quatro.",
};

const ROTULO_QUE_ABRE: Record<string, string> = {
  parceiro: "parceiro",
  produtor: "produtor",
  ia: "revisado da IA",
  curador: "curador",
};

let procedenciaMemorizada: DadosDaProcedencia | null = null;

export function montarProcedencia(): DadosDaProcedencia {
  if (procedenciaMemorizada) return procedenciaMemorizada;

  const painel = painelDeProcedencia();
  const emEntidades = new Map(painel.entidades.map((f) => [f.procedencia as string, f.n]));
  const emArestas = new Map(painel.arestas.map((f) => [f.procedencia as string, f.n]));

  // A ordem é a do TEMPO: primeiro as três que o acervo já tem, contadas; depois as quatro
  // que abrem quando o bastidor entrar no ar. Ordenar por tamanho poria «autorado» no fim e
  // esconderia o que a tela mais quer dizer — que aquela fatia é a que desaparece.
  const existentes: string[] = [...PROCEDENCIAS];
  const queAbrem = ["parceiro", "produtor", "ia", "curador"];

  const eixo: DegrauDaProcedencia[] = [
    ...existentes.map((p) => ({
      id: p,
      rotulo: ROTULO_DA_PROCEDENCIA[p as Procedencia],
      hoje: emEntidades.get(p) ?? 0,
      hojeEmArestas: emArestas.get(p) ?? 0,
      existeHoje: true,
      emProducao: p !== "autorado",
      quemCarimba: QUEM_CARIMBA[p],
      significado: SIGNIFICADO_DA_PROCEDENCIA[p as Procedencia],
    })),
    ...queAbrem.map((p) => ({
      id: p,
      rotulo: ROTULO_QUE_ABRE[p],
      hoje: null,
      hojeEmArestas: null,
      existeHoje: false,
      emProducao: true,
      quemCarimba: QUEM_CARIMBA[p],
      significado: SIGNIFICADO_QUE_ABRE[p],
    })),
  ];

  for (const d of eixo) {
    if ((d.hoje === null) !== (d.existeHoje === false)) {
      throw new Error(
        `observatorio.ts: o degrau «${d.id}» diz hoje=${JSON.stringify(d.hoje)} com existeHoje=${d.existeHoje}. ` +
          `«não existe no tipo» e «existe e mede zero» são afirmações diferentes, e o eixo não pode achatá-las.`,
      );
    }
    if (!d.quemCarimba || !d.significado) {
      throw new Error(`observatorio.ts: o degrau «${d.id}» sem quem carimba ou sem significado.`);
    }
  }

  procedenciaMemorizada = {
    painel,
    eixo,
    hoje: existentes.length,
    emProducao: eixo.filter((d) => d.emProducao).length,
  };
  return procedenciaMemorizada;
}

// ---------------------------------------------------------------------------
// G6 · Ausência declarada — os buracos, com denominador e com dono
// ---------------------------------------------------------------------------

/**
 * Uma ausência do acervo, declarada.
 *
 * O CAMPO QUE FAZ ESTA TELA VALER É `nivelQuePreenche`. Sem ele, isto é uma lista de
 * buracos — o gênero de tela que um avaliador lê como desculpa. Com ele, é um plano de
 * trabalho: cada buraco tem um dono nomeado entre os oito níveis de acesso, e a coluna
 * inteira vira o argumento de que o bastidor não é enfeite da proposta, é o mecanismo pelo
 * qual cada um destes números muda sem ninguém tocar em código.
 *
 * E `projecao` é o par dele: o que este número VIRA quando aquele nível entrar no ar. As
 * duas colunas juntas são a diferença entre «não sabemos» e «não sabemos, sabemos quem
 * saberia, e sabemos o que acontece quando souber».
 */
export interface AusenciaDeclarada {
  id: string;
  /** O que existe — quase sempre zero, e o zero aqui é sempre MEDIDO. */
  quantos: number;
  de: number;
  /** O que se está contando, com o denominador nomeado. */
  do_que: string;
  rotulo: string;
  nivelQuePreenche: string;
  projecao: string;
  procedenciaDoNumero: string;
}

let ausenciasMemorizadas: AusenciaDeclarada[] | null = null;

export function ausenciasDeclaradas(): AusenciaDeclarada[] {
  if (ausenciasMemorizadas) return ausenciasMemorizadas;

  const a = acervo();

  let eventos = 0;
  let comPreco = 0;
  let instituicoes = 0;
  let instituicoesComCoordenada = 0;
  let midias = 0;

  for (const e of a.entidades) {
    if (e.classe === "evento") {
      eventos += 1;
      const extra = e.extra as { preco?: unknown } | undefined;
      if (extra?.preco != null && extra.preco !== "") comPreco += 1;
    }
    if (e.classe === "instituicao") {
      instituicoes += 1;
      if (e.coordenada) instituicoesComCoordenada += 1;
    }
    if (e.classe === "midia") midias += 1;
  }

  // Os eventos DATADOS são os que têm sessão no grafo, e não os 300 do acervo: falar de
  // elenco num evento sem data é falar de um evento que ninguém pode ir ver. É a mesma
  // regra que `indiceDeSalvaveis()` usa para montar o índice do que dá para salvar.
  let eventosDatados = 0;
  let eventosDatadosComElenco = 0;
  let ocorrencias = 0;
  let ocorrenciasComEspaco = 0;

  for (const slug of slugsPorTipo("evento")) {
    const evento = porSlug("evento", slug);
    if (!evento) continue;
    const sessoes = ocorrenciasDe(evento.id);
    if (!sessoes.length) continue;
    eventosDatados += 1;
    if (vizinhos(evento.id, "atua_em").length > 0) eventosDatadosComElenco += 1;
    for (const o of sessoes) {
      ocorrencias += 1;
      if (o.espacoId) ocorrenciasComEspaco += 1;
    }
  }

  const ficha = META.fichaDeAcessibilidade;
  const totalDeEntidades = META.totais.entidades;
  const audiodescricao = META.acessibilidadeIncluindoDerivadas.audio_description ?? 0;

  // Os quatro elementos que a ontologia DECLARA e ninguém escreve. `porClasse` e
  // `porRelacao` não trazem chave para o que tem zero instâncias — a ausência da chave É a
  // medida, e lê-la como zero é a leitura certa aqui, ao contrário do resto desta tela.
  const vazios = [
    { elemento: "programa", n: META.porClasse.programa ?? 0, tipo: "classe" },
    { elemento: "influenciou", n: META.porRelacao.influenciou ?? 0, tipo: "relação" },
    { elemento: "deriva_de", n: META.porRelacao.deriva_de ?? 0, tipo: "relação" },
    { elemento: "curou", n: META.porRelacao.curou ?? 0, tipo: "relação" },
  ];
  const instanciasNosVazios = soma(vazios.map((v) => v.n));
  const sustentados = COMPONENTES_DO_CRITERIO.filter((c) => c.sustentado);

  const lista: AusenciaDeclarada[] = [
    {
      id: "ingresso-declarado",
      quantos: comPreco,
      de: eventos,
      do_que: "eventos do acervo declaram preço de ingresso",
      rotulo: "Preço de ingresso",
      nivelQuePreenche:
        "Produtor cultural (nível 7) — é ele que sabe quanto custa entrar, e é a única pessoa que sabe",
      projecao:
        "O corte gratuito × pago acende sem uma linha de código nova: o indicador já existe e está desligado, esperando dado.",
      procedenciaDoNumero:
        "src/dados/grafo.ts · extra.preco sobre as entidades de classe evento, varridas uma a uma",
    },
    {
      id: "espaco-na-ocorrencia",
      quantos: ocorrenciasComEspaco,
      de: ocorrencias,
      do_que: "sessões datadas declaram em que espaço acontecem",
      rotulo: "Espaço da sessão",
      nivelQuePreenche:
        "Organização (nível 6) cadastra o espaço com a ficha de acessibilidade; Produtor (nível 7) aponta a sessão para ele",
      projecao:
        "«Perto de mim» passa a funcionar sobre sessão e não sobre evento, e a ficha de acessibilidade do lugar chega a quem vai.",
      procedenciaDoNumero:
        "src/dados/grafo.ts · ocorrenciasDe() sobre os eventos com sessão · campo espacoId de cada Ocorrencia",
    },
    {
      id: "elenco-em-evento-datado",
      quantos: eventosDatadosComElenco,
      de: eventosDatados,
      do_que: "eventos com data no acervo têm elenco vinculado",
      rotulo: "Elenco do que está em cartaz",
      nivelQuePreenche:
        "Produtor cultural (nível 7), pela aresta atua_em — e o papel mora na aresta, nunca numa classe própria",
      projecao:
        "Quem procura por um artista encontra o que ele faz ESTA SEMANA, e não só o verbete dele na Enciclopédia.",
      procedenciaDoNumero:
        "src/dados/grafo.ts · vizinhos(evento, «atua_em») sobre os eventos que têm sessão datada",
    },
    {
      id: "ficha-de-acessibilidade",
      quantos: ficha.declaram,
      de: totalDeEntidades,
      do_que: "entidades preencheram a ficha de acessibilidade — as outras não a preencheram, e não é a mesma coisa que não oferecer",
      rotulo: "Ficha de acessibilidade",
      nivelQuePreenche:
        "Organização (nível 6) para espaço e mídia; Produtor (nível 7) para evento — e a ficha exige o ato explícito «declaro que não oferece nenhum destes recursos»",
      projecao:
        "A ausência para de ser silêncio e vira declaração: quem não oferece diz que não oferece, e o filtro passa a recortar sobre resposta em vez de sobre vazio.",
      procedenciaDoNumero: "src/dados/gerado/meta.json · fichaDeAcessibilidade e totais.entidades",
    },
    {
      id: "audiodescricao",
      quantos: audiodescricao,
      de: midias,
      do_que: "mídias do acervo registram audiodescrição",
      rotulo: "Audiodescrição",
      nivelQuePreenche:
        "Organização (nível 6), que é quem publica mídia com crédito — e quem sabe se a peça tem faixa de audiodescrição",
      projecao:
        "A dimensão sai de zero e o recorte por audiodescrição passa a devolver resultado em vez de devolver a explicação de por que está vazio.",
      procedenciaDoNumero:
        "src/dados/gerado/meta.json · acessibilidadeIncluindoDerivadas.audio_description sobre a contagem de entidades de classe midia",
    },
    {
      id: "coordenada-de-instituicao",
      quantos: instituicoesComCoordenada,
      de: instituicoes,
      do_que: "instituições do acervo têm coordenada",
      rotulo: "Onde ficam as instituições",
      nivelQuePreenche:
        "Admin (nível 1) para o território e o centroide; Organização (nível 6) para o endereço da própria casa",
      projecao:
        "O mapa deixa de mostrar só o que tem sessão datada e passa a mostrar a infraestrutura cultural do país — que é o que um observatório territorial precisa ver.",
      procedenciaDoNumero:
        "src/dados/grafo.ts · campo coordenada sobre as entidades de classe instituicao, varridas uma a uma",
    },
    {
      id: "componentes-da-chave",
      quantos: sustentados.length,
      de: COMPONENTES_DO_CRITERIO.length,
      do_que: `componentes da chave de identidade são sustentados pelo acervo — hoje só ${sustentados.map((c) => c.rotulo).join(", ")}`,
      rotulo: "A chave que diz o que é a mesma coisa",
      nivelQuePreenche:
        "Produtor cultural (nível 7) preenche os outros dois terços — agente realizador e obra —, e é o que faz a fila de duplicatas parar de acusar o próprio sistema",
      projecao:
        "A chave passa a afirmar identidade de verdade: duas linhas só são a mesma coisa quando são a mesma coisa no mundo, e não quando o título se parece.",
      procedenciaDoNumero:
        "src/dados/duplicatas.ts · COMPONENTES_DO_CRITERIO, o critério da ontologia e não uma medida de parecença entre textos",
    },
    {
      id: "elementos-vazios-da-ontologia",
      quantos: instanciasNosVazios,
      de: vazios.length,
      do_que: `instâncias somadas entre os ${vazios.length} elementos que a ontologia declara e ninguém escreve — ${vazios.map((v) => `${v.elemento} (${v.tipo})`).join(", ")}`,
      rotulo: "O que o contrato prevê e ninguém escreve",
      nivelQuePreenche:
        "Organização (nível 6) povoa programa; Editor / Curador (nível 5) escreve influenciou, deriva_de e curou — as três relações de SENTIDO, e por isso assinadas",
      projecao:
        "O grafo passa a ter ligação autorada por gente: hoje 71% das ligações são semelhança de máquina, e nenhuma delas afirma influência, derivação ou curadoria.",
      procedenciaDoNumero:
        "src/dados/gerado/meta.json · porClasse e porRelacao — a ausência da chave é a medida de zero instâncias",
    },
  ];

  for (const x of lista) {
    if (typeof x.quantos !== "number" || typeof x.de !== "number" || x.de <= 0) {
      throw new Error(
        `observatorio.ts: a ausência «${x.id}» sem denominador utilizável (${x.quantos} de ${x.de}). ` +
          `Ausência sem denominador é a mesma coisa que número sem denominador, e esta tela existe para o contrário.`,
      );
    }
    if (x.quantos > x.de) {
      throw new Error(
        `observatorio.ts: a ausência «${x.id}» tem ${x.quantos} de ${x.de} — o que existe não pode ser maior que o total.`,
      );
    }
    if (!x.nivelQuePreenche || !x.projecao || !x.procedenciaDoNumero) {
      throw new Error(
        `observatorio.ts: a ausência «${x.id}» sem nível que preenche, sem projeção ou sem origem do número. ` +
          `Os três juntos são o que transforma lista de buracos em plano de trabalho.`,
      );
    }
  }

  ausenciasMemorizadas = lista;
  return lista;
}

// ---------------------------------------------------------------------------
// G4 · Território — o diagnóstico que justifica a plataforma existir
// ---------------------------------------------------------------------------

/**
 * A camada de desertos, montada no build.
 *
 * ELA MORA AQUI DESDE A G4, e não mais dentro de `(bastidor)/observatorio/page.tsx`. Ela
 * nasceu lá como cópia declarada do molde de `(app)/mapa/page.tsx` — `montarDesertos` era
 * função interna daquela página e exportá-la significaria editar arquivo da fase 3 com seis
 * planos correndo em paralelo. Agora DUAS telas desta superfície precisam da camada, e uma
 * segunda cópia seria a terceira: o molde subiu para o módulo, que é território desta
 * sessão, e as duas páginas passam a chamar a mesma função.
 *
 * O tipo vem de `@/componentes/desertos` por `import type`, que some na compilação: nenhum
 * acoplamento em execução, e uma definição só do formato em vez de duas que divergem.
 *
 * A CONTAGEM vem da travessia do grafo e o POLÍGONO vem da geografia autorada; os dois se
 * encontram pelo título do estado, e `densidadePorUf()` já falha alto se a tabela de
 * centroides e os polígonos divergirem.
 */
export function montarDesertos(): DadosDesertos {
  const d = densidadePorUf();
  const poligonos = new Map(UNIDADES_FEDERATIVAS.map((u) => [u.sigla, u.contorno]));
  return {
    ufs: d.ufs.map((uf) => {
      const centro = projetar(uf.coordenada);
      return {
        sigla: uf.sigla,
        titulo: uf.titulo,
        registros: uf.registros,
        entidades: uf.entidades,
        noGrafo: uf.noGrafo,
        d: caminhoDe(poligonos.get(uf.sigla) ?? []),
        cx: Number(centro.x.toFixed(1)),
        cy: Number(centro.y.toFixed(1)),
      };
    }),
    total: d.total,
    doisMaiores: d.doisMaiores,
    percentual: Math.round((d.doisMaiores / d.total) * 100),
    maximo: d.maximo,
    mediana: d.mediana,
    entidadesDistintas: d.entidadesDistintas,
    comUmRegistro: d.comUmRegistro.map((u) => u.titulo),
    semRegistro: d.semRegistro.map((u) => u.titulo),
    rotulo: ROTULO_UNIDADES_FEDERATIVAS,
  };
}

export const CONTORNO_DO_BRASIL = { d: caminhoDe(CONTORNO_BRASIL), rotulo: ROTULO_CONTORNO };

/** Como cada coordenada do acervo foi obtida. Nenhuma é do dado: todas são derivadas. */
export interface MetodoDeCoordenada {
  metodo: string;
  rotulo: string;
  n: number;
  de: number;
}

export interface DadosDoTerritorio {
  desertos: DadosDesertos;
  /** Registros de `situado_em` — cada vínculo entre uma entidade e um território. */
  registros: number;
  /** Entidades distintas por trás dos registros. Uma entidade pode estar em mais de um. */
  entidadesDistintas: number;
  doisMaiores: number;
  percentualDosDoisMaiores: number;
  totalDeUfs: number;
  ufsNoAcervo: number;
  semRegistro: string[];
  comUmRegistro: string[];
  /** Como foi obtida a coordenada RESOLVIDA de cada entidade posicionável. */
  metodos: MetodoDeCoordenada[];
  /**
   * O mesmo, sobre as entidades com coordenada PRÓPRIA — a tabela, e não o mapa.
   *
   * AS DUAS CONTAGENS EXISTEM E NÃO SÃO A MESMA, e é a mesma família do «773 registros
   * contra 718 entidades»: `meta.json` conta quem TEM coordenada escrita; o índice de pinos
   * conta quem CONSEGUE ser posicionado, porque ocorrência herda do espaço e espaço herda do
   * município. A fatia de centroide-de-país é 45,3% numa e 29,1% na outra — quem citar
   * cobertura de coordenada sem dizer qual das duas está citando afirma a errada metade das
   * vezes.
   */
  metodosProprios: MetodoDeCoordenada[];
  comCoordenadaPropria: number;
  /** Entidades com coordenada resolvida, dentro e fora do retângulo do Brasil. */
  posicionadas: number;
  foraDoBrasil: number;
  /** O mesmo recorte, só sobre evento — o que uma agenda cultural leva a sério. */
  eventosSituados: number;
  eventosForaDoBrasil: number;
  concentracao: Indicador;
  diversidade: Indicador;
  instituicoesSemCoordenada: AusenciaDeclarada;
}

const ROTULO_DO_METODO: Record<string, string> = {
  "centroide-pais": "centroide do país inteiro",
  "centroide-municipio": "centroide do município",
  "centroide-estado": "centroide do estado",
  "deslocamento-por-espaco": "deslocamento a partir do espaço",
};

let territorioMemorizado: DadosDoTerritorio | null = null;

export function montarTerritorio(): DadosDoTerritorio {
  if (territorioMemorizado) return territorioMemorizado;

  const d = densidadePorUf();
  const pinos = indiceDePinos();

  // O índice de pinos traz método e via como ÍNDICE em `METODOS_INDEXADOS`, e traz as
  // coordenadas de FORA do Brasil de propósito: uma entidade ausente do índice seria
  // indistinguível de uma sem coordenada nenhuma, e são duas situações diferentes.
  const porMetodo = new Map<string, number>();
  let foraDoBrasil = 0;
  let eventosSituados = 0;
  let eventosForaDoBrasil = 0;
  for (const p of pinos) {
    const metodo = METODOS_INDEXADOS[p[6]] ?? "desconhecido";
    porMetodo.set(metodo, (porMetodo.get(metodo) ?? 0) + 1);
    if (p[10] === 0) foraDoBrasil += 1;
    if (p[3] === "evento") {
      eventosSituados += 1;
      if (p[10] === 0) eventosForaDoBrasil += 1;
    }
  }

  const metodos: MetodoDeCoordenada[] = [...porMetodo.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([metodo, n]) => ({
      metodo,
      rotulo: ROTULO_DO_METODO[metodo] ?? metodo,
      n,
      de: pinos.length,
    }));

  const propria = META.cobertura.coordenadas;
  const metodosProprios: MetodoDeCoordenada[] = Object.entries(propria.porMetodo)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([metodo, n]) => ({
      metodo,
      rotulo: ROTULO_DO_METODO[metodo] ?? metodo,
      n,
      de: propria.comCoordenada,
    }));

  const semCoordenadaDeInstituicao = ausenciasDeclaradas().find(
    (a) => a.id === "coordenada-de-instituicao",
  );
  if (!semCoordenadaDeInstituicao) {
    throw new Error(
      "observatorio.ts: a tela de território pede a ausência «coordenada-de-instituicao» e ela não está em ausenciasDeclaradas().",
    );
  }

  territorioMemorizado = {
    desertos: montarDesertos(),
    registros: d.total,
    entidadesDistintas: d.entidadesDistintas,
    doisMaiores: d.doisMaiores,
    percentualDosDoisMaiores: porcento(d.doisMaiores, d.total),
    totalDeUfs: d.ufs.length,
    ufsNoAcervo: d.ufs.filter((uf) => uf.noGrafo).length,
    semRegistro: d.semRegistro.map((uf) => uf.titulo),
    comUmRegistro: d.comUmRegistro.map((uf) => uf.titulo),
    metodos,
    metodosProprios,
    comCoordenadaPropria: propria.comCoordenada,
    posicionadas: pinos.length - foraDoBrasil,
    foraDoBrasil,
    eventosSituados,
    eventosForaDoBrasil,
    concentracao: exigirIndicador("circulacao-territorial"),
    diversidade: exigirIndicador("diversidade-de-linguagem-por-regiao"),
    instituicoesSemCoordenada: semCoordenadaDeInstituicao,
  };
  return territorioMemorizado;
}

// ---------------------------------------------------------------------------
// G2 · KPIs de produto — o que mede de verdade, e o que é null com declaração
// ---------------------------------------------------------------------------

export interface DadosDoProduto {
  /** Os que o acervo sustenta: personalização, alcance, travessia. */
  medidos: Indicador[];
  /** Os que não têm lastro nenhum — e não é atraso, é ausência de sinal de comportamento. */
  semLastro: Indicador[];
}

/**
 * A distância entre os feeds de duas personas, medida.
 *
 * É O ÚNICO NÚMERO DE PERSONALIZAÇÃO QUE ESTE PROTÓTIPO PODE AFIRMAR, e ele é forte
 * justamente porque não depende de comportamento: o feed sai da travessia do grafo a partir
 * do repertório, e dois repertórios diferentes produzem listas diferentes. Sobreposição
 * baixa é personalização MEDIDA; num produto com analytics, este mesmo número costuma ser
 * afirmado e nunca contado.
 *
 * A combinação usada é a de MÁSCARA ZERO — nenhuma disposição marcada —, que é o feed que
 * cada persona vê ao abrir. Comparar combinações diferentes entre duas personas mediria a
 * diferença entre os filtros, e não entre as pessoas.
 */
function distanciaEntreFeeds(): Indicador {
  const listaBase = (personaId: string): string[] => {
    const combinacoes = PRECOMPUTO.porPersona[personaId];
    const base = combinacoes?.[0];
    if (!base) return [];
    return (PRECOMPUTO.listas[base.lista] ?? []).map((c) => c.id);
  };

  const linhas: LinhaDeIndicador[] = [];
  let paresComparados = 0;
  let somaDeComuns = 0;
  let maiorSobreposicao = 0;

  for (let i = 0; i < PERSONAS.length; i += 1) {
    for (let j = i + 1; j < PERSONAS.length; j += 1) {
      const a = PERSONAS[i];
      const b = PERSONAS[j];
      const listaA = listaBase(a.id);
      const listaB = new Set(listaBase(b.id));
      const comuns = listaA.filter((id) => listaB.has(id)).length;
      const de = Math.max(listaA.length, listaB.size);
      paresComparados += 1;
      somaDeComuns += comuns;
      if (comuns > maiorSobreposicao) maiorSobreposicao = comuns;
      linhas.push({
        rotulo: `${a.nome} × ${b.nome}`,
        valor: comuns,
        de,
        nota: `${comuns} item em comum entre os dois feeds de abertura, de ${de}`,
      });
    }
  }

  return {
    id: "distancia-entre-feeds",
    rotulo: "Distância entre feeds",
    valor: somaDeComuns,
    unidade: `itens em comum somados entre os ${paresComparados} pares de personas`,
    denominador: {
      n: LIMITE_FEED,
      do_que: "itens no feed de abertura de cada persona — é sobre este conjunto que a sobreposição é contada",
    },
    denominadorSecundario: {
      n: PERSONAS.length,
      do_que: "personas autoradas, formando os pares comparados",
    },
    sustentado: true,
    procedenciaDoNumero:
      "src/dados/feeds.ts · PRECOMPUTO.porPersona[persona][0] — a combinação de máscara zero, o feed que cada uma vê ao abrir",
    declaracao: null,
    leitura:
      `Os feeds de abertura das personas compartilham ${somaDeComuns} itens somados entre os ${paresComparados} pares, ` +
      `com no máximo ${maiorSobreposicao} em comum num par. É personalização MEDIDA, e não afirmada: ` +
      `o feed sai da travessia do grafo a partir do repertório de cada uma, e repertórios diferentes ` +
      `produzem listas diferentes sem que ninguém tenha registrado um clique.`,
    detalhe: linhas,
  };
}

/** O alcance da caminhada: quanto do acervo cada repertório encosta. */
function alcanceDaCaminhada(): Indicador {
  const total = META.totais.entidades;
  const linhas: LinhaDeIndicador[] = [];
  let somaDeAlcance = 0;

  for (const persona of PERSONAS) {
    const alcancados = alcancadosDaPersona(persona.id).size;
    somaDeAlcance += alcancados;
    linhas.push({
      rotulo: persona.nome,
      valor: alcancados,
      de: total,
      nota: `${pt(porcento(alcancados, total))}% do acervo é alcançável a partir do repertório dela`,
    });
  }

  linhas.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0) || a.rotulo.localeCompare(b.rotulo));
  const maior = linhas[0];

  return {
    id: "alcance-da-caminhada",
    rotulo: "Alcance da caminhada",
    valor: maior?.valor ?? 0,
    unidade: "entidades alcançáveis a partir do maior repertório",
    denominador: {
      n: total,
      do_que: "entidades no acervo — o denominador é o acervo inteiro, e não a parte que o motor visitou",
    },
    denominadorSecundario: {
      n: PERSONAS.length,
      do_que: "personas autoradas, cada uma com o próprio alcance na lista abaixo",
    },
    sustentado: true,
    procedenciaDoNumero: "src/dados/caminhada.ts · alcancadosDaPersona() sobre as personas de personas.json",
    declaracao: null,
    leitura:
      `O maior repertório alcança ${maior?.valor ?? 0} entidades — ${pt(porcento(maior?.valor ?? 0, total))}% do acervo. ` +
      `É o tamanho do mundo que a plataforma consegue abrir a partir do que uma pessoa já guardou, ` +
      `e é medido no grafo, não estimado.`,
    detalhe: linhas,
  };
}

/**
 * Os três KPIs de produto que o protótipo NÃO PODE MEDIR, e é preciso dizer por quê.
 *
 * NÃO INVENTE ENGAJAMENTO. Um KPI de produto sem usuário real é `null` com declaração, e
 * nunca um número plausível — e a tentação aqui é enorme, porque aquisição, retenção e funil
 * são exatamente os três números que uma banca espera ver num painel de produto. Escrevê-los
 * a partir das 3 personas autoradas seria afirmar comportamento de gente que não existe.
 *
 * E é uma ausência de OUTRA espécie que a da gratuidade: lá o campo existe no acervo e está
 * vazio; aqui não há acervo nenhum que pudesse ter o campo, porque o artefato é estático e
 * não registra visita. As duas ficam declaradas, cada uma com o seu motivo.
 */
function semSinalDeComportamento(): Indicador[] {
  const total = META.totais.entidades;
  const base = {
    unidade: "—",
    valor: null,
    sustentado: false,
    detalhe: [] as LinhaDeIndicador[],
    denominadorSecundario: {
      n: PERSONAS.length,
      do_que: "personas autoradas — as únicas pessoas que este protótipo conhece, e nós as inventamos",
    },
  };

  return [
    {
      ...base,
      id: "aquisicao",
      rotulo: "Aquisição",
      denominador: { n: 0, do_que: "visitas registradas — o artefato é estático e não registra nenhuma" },
      procedenciaDoNumero:
        "não há origem: export estático (D-24), zero requisição em execução, nenhum registro de sessão em lugar nenhum",
      declaracao:
        "Aquisição não tem lastro aqui, e a falta é de outra espécie que a da gratuidade: lá o campo existe no acervo e está vazio; aqui não há acervo que pudesse ter o campo. O artefato é um export estático sem back-end, sem cookie e sem registro de visita — não há primeira visita a contar, então não há aquisição. Escrever um número plausível a partir das 3 personas autoradas seria afirmar comportamento de gente que não existe.",
      leitura:
        "O corte existe no produto e está desligado aqui. Num sistema em produção este indicador acende com a primeira pessoa real que entra — o que falta é gente, não software.",
    },
    {
      ...base,
      id: "retencao",
      rotulo: "Retenção e retorno",
      denominador: { n: 0, do_que: "segundas visitas — não há a primeira registrada, então não há a segunda" },
      procedenciaDoNumero:
        "não há origem: `localStorage` guarda a escolha de quem olha e nunca sai do navegador dele; nada é agregado em lugar nenhum",
      declaracao:
        "Retorno exige saber que alguém voltou, e saber isso exige ter registrado que alguém veio. O que este protótipo guarda — persona, salvos, visão — mora no `localStorage` de quem está olhando e nunca é agregado: é preferência de uma pessoa no navegador dela, não um dado do produto. Uma taxa de retorno calculada sobre isso mediria a sessão de quem avalia.",
      leitura:
        "É o indicador que mais depende de gente e menos depende de código: ele acende sozinho quando houver segunda visita para contar.",
    },
    {
      ...base,
      id: "funil-de-descoberta",
      rotulo: "Funil de descoberta",
      denominador: { n: 0, do_que: "conversões registradas — salvar um evento é gesto local e não vira registro" },
      denominadorSecundario: {
        n: total,
        do_que: "entidades que o funil poderia percorrer, se houvesse funil",
      },
      procedenciaDoNumero:
        "não há origem: salvar grava id de ocorrência em `localStorage` (D-42) e não atravessa para lugar nenhum",
      declaracao:
        "Funil exige etapas registradas — viu, abriu, salvou, foi. Aqui o gesto de salvar grava um id no navegador de quem salvou e não atravessa para lugar nenhum, então não existe a segunda ponta que faria a etapa virar taxa. O que a tela pode afirmar sobre descoberta está na tela de impacto, medido no grafo: quantas linguagens novas estão a um salto de cada repertório.",
      leitura:
        "A descoberta que este protótipo mede é estrutural e não comportamental: o que está encostado no que a pessoa já atravessou. É menos do que um funil, e é verdade.",
    },
  ];
}

let produtoMemorizado: DadosDoProduto | null = null;

export function montarProduto(): DadosDoProduto {
  if (produtoMemorizado) return produtoMemorizado;

  const medidos = [
    distanciaEntreFeeds(),
    alcanceDaCaminhada(),
    exigirIndicador("ampliacao-de-repertorio"),
  ].map(conferirIndicador);
  const semLastro = semSinalDeComportamento().map(conferirIndicador);

  produtoMemorizado = { medidos, semLastro };
  return produtoMemorizado;
}

// ---------------------------------------------------------------------------
// G7 · Dados abertos — o recorte exportável e o dicionário que o acompanha
// ---------------------------------------------------------------------------

/**
 * Um campo do recorte exportável, com significado e procedência.
 *
 * EXPORTAR NÚMERO SEM DICIONÁRIO É EXPORTAR MAL-ENTENDIDO. Uma coluna chamada `registros`
 * numa planilha, três meses depois, na mão de outra pessoa, vira «entidades» sem que
 * ninguém tenha decidido isso — é exatamente o erro que a tela de território existe para
 * não cometer, e ele se comete sozinho quando o dado sai daqui sem o dicionário junto.
 */
export interface CampoDoDicionario {
  campo: string;
  significado: string;
  unidade: string;
  procedencia: string;
}

export interface RecorteExportavel {
  id: string;
  rotulo: string;
  resumo: string;
  colunas: string[];
  linhas: (string | number | null)[][];
  dicionario: CampoDoDicionario[];
}

export interface DadosAbertos {
  /** A data do grafo, e nunca o relógio de quem avalia. É ela que versiona o recorte. */
  geradoEm: string;
  versao: string;
  licenca: string;
  anonimizacao: string;
  sobreAApi: string;
  recortes: RecorteExportavel[];
}

const CAMPOS_COMUNS: CampoDoDicionario[] = [
  {
    campo: "id",
    significado: "Identificador estável do indicador dentro do módulo — é por ele que duas exportações de datas diferentes se comparam.",
    unidade: "texto",
    procedencia: "src/dados/observatorio.ts · Indicador.id",
  },
  {
    campo: "valor",
    significado:
      "O número medido. VAZIO quando o acervo não sustenta o indicador — e vazio aqui NÃO É ZERO: zero é uma medida que deu zero, vazio é a ausência do lastro. Confundir os dois é o erro que este recorte mais provavelmente vai sofrer na mão de quem o receber.",
    unidade: "número ou vazio",
    procedencia: "src/dados/observatorio.ts · Indicador.valor, com Indicador.sustentado ao lado",
  },
  {
    campo: "sustentado",
    significado:
      "«sim» quando o acervo sustenta o indicador. É a coluna que desfaz a ambiguidade do vazio, e por isso ela viaja SEMPRE junto do valor.",
    unidade: "sim | nao",
    procedencia: "src/dados/observatorio.ts · Indicador.sustentado",
  },
  {
    campo: "denominador",
    significado: "Sobre quantos o número foi medido. Um valor sem ele não afirma nada.",
    unidade: "número",
    procedencia: "src/dados/observatorio.ts · Indicador.denominador.n",
  },
  {
    campo: "denominador_do_que",
    significado: "O que está sendo contado no denominador, em português — registros, entidades, pessoas, eventos.",
    unidade: "texto",
    procedencia: "src/dados/observatorio.ts · Indicador.denominador.do_que",
  },
  {
    campo: "origem_do_numero",
    significado: "O módulo e a função que produziram o valor. É a procedência do número, e não a do dado.",
    unidade: "texto",
    procedencia: "src/dados/observatorio.ts · Indicador.procedenciaDoNumero",
  },
];

let dadosAbertosMemorizados: DadosAbertos | null = null;

export function montarDadosAbertos(): DadosAbertos {
  if (dadosAbertosMemorizados) return dadosAbertosMemorizados;

  const ind = indicadores();
  const painel = painelDeProcedencia();
  const ausencias = ausenciasDeclaradas();
  const geradoEm = META.geradoEm;

  const recortes: RecorteExportavel[] = [
    {
      id: "indicadores",
      rotulo: "Indicadores de impacto cultural",
      resumo: `Os ${ind.length} indicadores da superfície, com denominador, lastro e origem do número.`,
      colunas: ["id", "rotulo", "valor", "unidade", "sustentado", "denominador", "denominador_do_que", "origem_do_numero"],
      linhas: ind.map((i) => [
        i.id,
        i.rotulo,
        i.valor,
        i.unidade,
        i.sustentado ? "sim" : "nao",
        i.denominador.n,
        i.denominador.do_que,
        i.procedenciaDoNumero,
      ]),
      dicionario: [
        ...CAMPOS_COMUNS.slice(0, 1),
        {
          campo: "rotulo",
          significado: "O nome do indicador como ele aparece na tela.",
          unidade: "texto",
          procedencia: "src/dados/observatorio.ts · Indicador.rotulo",
        },
        ...CAMPOS_COMUNS.slice(1, 2),
        {
          campo: "unidade",
          significado: "O que o número conta — linguagens, entidades, por cento. Traço quando não há valor.",
          unidade: "texto",
          procedencia: "src/dados/observatorio.ts · Indicador.unidade",
        },
        ...CAMPOS_COMUNS.slice(2),
      ],
    },
    {
      id: "procedencia",
      rotulo: "Procedência do acervo",
      resumo: `As ${painel.entidades.length + painel.arestas.length} fatias contadas — entidades e ligações —, com fração e composição.`,
      colunas: ["leitura", "procedencia", "n", "percentual", "total", "significado"],
      linhas: [
        ...painel.entidades.map((f) => [
          "entidades",
          f.procedencia,
          f.n,
          f.percentual,
          painel.totalDeEntidades,
          f.significado,
        ]),
        ...painel.arestas.map((f) => [
          "ligacoes",
          f.procedencia,
          f.n,
          f.percentual,
          painel.totalDeArestas,
          f.significado,
        ]),
      ],
      dicionario: [
        {
          campo: "leitura",
          significado:
            "«entidades» conta as coisas do acervo; «ligacoes» conta as ligações entre elas. As duas leituras contam histórias diferentes e não devem ser somadas.",
          unidade: "entidades | ligacoes",
          procedencia: "src/dados/observatorio.ts · painelDeProcedencia()",
        },
        {
          campo: "procedencia",
          significado:
            "De onde veio: «ic» é o acervo do Itaú Cultural carregado como está, «derivado» é leitura nossa por regra escrita, «autorado» é o que nós inventamos para o protótipo.",
          unidade: "ic | derivado | autorado",
          procedencia: "src/dados/tipos.ts · Procedencia",
        },
        { campo: "n", significado: "Quantas, contadas na varredura.", unidade: "número", procedencia: "varredura própria de observatorio.ts, conferida contra contagens() e meta.json" },
        { campo: "percentual", significado: "A fração contra o total daquela leitura, com uma casa decimal.", unidade: "por cento", procedencia: "src/dados/observatorio.ts · calculado, nunca digitado" },
        { campo: "total", significado: "O total da leitura — é o denominador do percentual.", unidade: "número", procedencia: "src/dados/gerado/meta.json · totais" },
        { campo: "significado", significado: "O que aquela procedência quer dizer, em texto de produto.", unidade: "texto", procedencia: "src/dados/observatorio.ts · SIGNIFICADO_DA_PROCEDENCIA" },
      ],
    },
    {
      id: "ausencias",
      rotulo: "Ausências declaradas",
      resumo: `Os ${ausencias.length} buracos medidos do acervo, com denominador, quem preencheria e a projeção.`,
      colunas: ["id", "rotulo", "quantos", "de", "do_que", "nivel_que_preenche", "projecao", "origem_do_numero"],
      linhas: ausencias.map((a) => [
        a.id,
        a.rotulo,
        a.quantos,
        a.de,
        a.do_que,
        a.nivelQuePreenche,
        a.projecao,
        a.procedenciaDoNumero,
      ]),
      dicionario: [
        ...CAMPOS_COMUNS.slice(0, 1),
        { campo: "rotulo", significado: "O nome da ausência como ela aparece na tela.", unidade: "texto", procedencia: "src/dados/observatorio.ts · AusenciaDeclarada.rotulo" },
        {
          campo: "quantos",
          significado:
            "O que EXISTE, contado. Zero aqui é sempre medida: o campo existe, foi varrido, e ninguém o preencheu. Nunca é ausência de leitura.",
          unidade: "número",
          procedencia: "src/dados/observatorio.ts · ausenciasDeclaradas()",
        },
        { campo: "de", significado: "O total sobre o qual a contagem foi feita.", unidade: "número", procedencia: "src/dados/observatorio.ts · AusenciaDeclarada.de" },
        { campo: "do_que", significado: "O que está sendo contado, em português.", unidade: "texto", procedencia: "src/dados/observatorio.ts · AusenciaDeclarada.do_que" },
        {
          campo: "nivel_que_preenche",
          significado:
            "O nível de acesso que passa a escrever este dado quando o bastidor entrar no ar. É o campo que transforma a lista de buracos em plano de trabalho.",
          unidade: "texto",
          procedencia: "src/dados/observatorio.ts · AusenciaDeclarada.nivelQuePreenche",
        },
        { campo: "projecao", significado: "O que este número vira quando aquele nível entrar no ar.", unidade: "texto", procedencia: "src/dados/observatorio.ts · AusenciaDeclarada.projecao" },
        ...CAMPOS_COMUNS.slice(5),
      ],
    },
  ];

  dadosAbertosMemorizados = {
    geradoEm,
    versao: `observatorio-${geradoEm}`,
    licenca:
      "O acervo é do Itaú Cultural e as condições dele valem. O que este recorte acrescenta — as contagens, os denominadores e o dicionário — é descrição do acervo e não obra derivada dele: pode ser citado, conferido e refeito por quem tiver o mesmo grafo.",
    anonimizacao:
      "Este recorte é AGREGADO por construção. Nenhuma linha aqui descreve uma pessoa: as três personas do protótipo são autoradas por nós e aparecem só como denominador — «3 pessoas» —, nunca como registro. O Observatório inteiro lê o público em agregado e não tem, em tela nenhuma, um caminho até o indivíduo.",
    sobreAApi:
      "A API pública com chave e limite de uso é do Admin (funcionalidade 97), e não desta superfície. O que existe aqui é o recorte legível e o dicionário que o acompanha — quem for construir em cima começa por eles, e pede a chave lá.",
    recortes,
  };
  return dadosAbertosMemorizados;
}

// ---------------------------------------------------------------------------
// G8 · Leitura da moderação — agregada, anonimizada, e cruzada com a densidade
// ---------------------------------------------------------------------------

/**
 * Uma unidade federativa na fila de moderação, cruzada com a densidade do acervo.
 *
 * É A LEITURA QUE SÓ FAZ SENTIDO NO OBSERVATÓRIO, porque só aqui os dois números convivem:
 * um território com pouco acervo e fila parada é ABANDONO, não calmaria. A Moderação vê a
 * própria fila e não vê a densidade; o Admin vê a máquina e não vê o acervo.
 *
 * O CRUZAMENTO É POR SIGLA E NÃO POR TÍTULO, e a diferença é a tela inteira. A fila também
 * carrega o título do território que alcança o item, e medido esses títulos são municípios e
 * cidades estrangeiras — Belém, Berlin, Brno, Istambul. Casá-los com a densidade pelo nome
 * faria «São Paulo» da fila encontrar os registros do ESTADO de São Paulo sem que ninguém
 * tivesse decidido que são a mesma coisa. `ItemDaFila.uf` resolve a unidade federativa
 * DESCENDO A HIERARQUIA por `porTerritorio()` — a mesma travessia que `densidadePorUf()`
 * usa —, e é por isso que o cruzamento fecha.
 */
export interface UfNaFila {
  sigla: string;
  naFila: number;
  registrosNoAcervo: number;
}

export interface DadosDaModeracao {
  /** Os indicadores que a página de servidor NÃO pode medir, cada um com o seu motivo. */
  semLastro: Indicador[];
  /** O cruzamento que justifica esta tela existir do lado de quem observa. */
  cruzamento: Indicador;
  fila: number;
  porEscopo: LinhaDeIndicador[];
  porUf: UfNaFila[];
  /** Itens sem unidade federativa — o acervo não os situa em território nenhum. */
  semUf: number;
  /** Destes, quantos até têm título de território, mas um que não resolve para UF. */
  comTerritorioSemUf: number;
  /** A distinção entre M9, A10 e esta tela, escrita — confundi-las vira vigilância. */
  asTresTelas: { tela: string; deQuem: string; oQueMede: string }[];
  /** A declaração da própria Moderação sobre a antiguidade, citada como procedência. */
  sobreAAntiguidade: string;
}

let moderacaoMemorizada: DadosDaModeracao | null = null;

export function montarLeituraDaModeracao(): DadosDaModeracao {
  if (moderacaoMemorizada) return moderacaoMemorizada;

  const fila = filaDaModeracao();

  const naFilaPorUf = new Map<string, { naFila: number; registros: number }>();
  let semUf = 0;
  let comTerritorioSemUf = 0;
  for (const item of fila) {
    if (!item.uf) {
      semUf += 1;
      if (item.territorio) comTerritorioSemUf += 1;
      continue;
    }
    const atual = naFilaPorUf.get(item.uf) ?? { naFila: 0, registros: item.registrosNaUf ?? 0 };
    atual.naFila += 1;
    naFilaPorUf.set(item.uf, atual);
  }

  const porUf: UfNaFila[] = [...naFilaPorUf.entries()]
    .map(([sigla, x]) => ({ sigla, naFila: x.naFila, registrosNoAcervo: x.registros }))
    .sort((a, b) => a.registrosNoAcervo - b.registrosNoAcervo || a.sigla.localeCompare(b.sigla));

  const comUf = fila.length - semUf;

  const porEscopo: LinhaDeIndicador[] = ESCOPOS_DE_CURADORIA.map((e) => ({
    rotulo: e.rotulo,
    valor: e.alcance,
    de: fila.length,
    nota: e.descricao,
  }));

  const sobreAAntiguidade =
    declaracoesDaModeracao().find((d) => /antiguidade|submiss/i.test(d.texto))?.texto ??
    "A Moderação declara, no próprio módulo, que o acervo não carrega data de submissão.";

  /**
   * As duas ausências desta tela são de espécies DIFERENTES, e achatá-las numa só apagaria
   * informação — a mesma falha que `valor: null` contra `valor: 0` combate no dado.
   *
   * Tempo de fila O ACERVO NÃO SUSTENTA: nenhum registro carrega data de submissão, e a
   * própria Moderação já declara isso por escrito. Volume decidido e taxa de veto EXISTEM a
   * partir da M2 — só que vivem no armazém do cliente, escritos por gesto de quem opera a
   * tela, e uma página de servidor que roda no BUILD não alcança o `localStorage` de
   * ninguém. Lê-los no cliente é possível e seria outra tela: mediria a sessão de quem está
   * olhando, e não o sistema de moderação.
   */
  const semLastro: Indicador[] = [
    conferirIndicador({
      id: "tempo-de-fila",
      rotulo: "Tempo de fila por escopo",
      valor: null,
      unidade: "—",
      denominador: {
        n: 0,
        do_que: `carimbos de submissão entre os ${fila.length} itens da fila — o acervo não tem o campo`,
      },
      denominadorSecundario: {
        n: fila.length,
        do_que: "itens na fila, todos sem data de entrada",
      },
      sustentado: false,
      procedenciaDoNumero:
        "src/dados/moderacao.ts · declaracoesDaModeracao() — a própria Moderação declara que nenhum registro do acervo carrega data de submissão",
      declaracao:
        `Tempo de fila exige saber quando o item entrou, e nenhum registro deste acervo carrega data de submissão. ` +
        `A fila não ordena por «mais antigo primeiro» e diz isso na própria tela; inventar um «entrouEm» aqui ` +
        `fabricaria a antiguidade que a Moderação declara não ter. É ausência do ACERVO, e não atraso de ninguém.`,
      leitura:
        "É o indicador que a banca mais espera num painel de moderação, e é o que este acervo menos pode dar. Ele acende no dia em que a submissão passar a carimbar a hora — e quem carimba é o próprio ato de submeter, não uma tela.",
      detalhe: [],
    }),
    conferirIndicador({
      id: "volume-decidido",
      rotulo: "Volume decidido por ação e taxa de veto",
      valor: null,
      unidade: "—",
      denominador: {
        n: 0,
        do_que: "decisões alcançáveis por esta página — ela roda no build, e as decisões moram no navegador de quem decidiu",
      },
      denominadorSecundario: {
        n: fila.length,
        do_que: "itens na fila, que é o que uma página de servidor consegue ver",
      },
      sustentado: false,
      procedenciaDoNumero:
        "não há origem alcançável: as decisões são gravadas em `localStorage` pelo gesto de quem opera a Moderação, e DP-F separa o build do navegador",
      declaracao:
        "Volume decidido e taxa de veto EXISTEM — a Moderação registra cada decisão com autor e motivo. Só que elas vivem no armazém do cliente, e esta é uma página de servidor que roda no build: o `localStorage` de quem decidiu está do outro lado da fronteira. A ausência aqui é de LUGAR, e não de dado — diferente do tempo de fila, logo acima, que o acervo simplesmente não tem. Ler o armazém no cliente é possível e seria outra tela: mediria a sessão de quem está olhando, e não o sistema de moderação.",
      leitura:
        "As duas ausências desta tela têm causas diferentes e ficam separadas de propósito. Achatá-las numa só apagaria a informação de que uma delas já tem solução e a outra depende do acervo mudar.",
      detalhe: [],
    }),
  ];

  const cruzamento = conferirIndicador({
      id: "fila-cruzada-com-densidade",
      rotulo: "Fila por território, cruzada com o acervo",
      valor: porUf.length,
      unidade: "unidades federativas com item na fila",
      denominador: {
        n: comUf,
        do_que: `itens da fila com unidade federativa resolvida — os outros ${semUf} não são falha de resolução: o acervo não os situa em território nenhum`,
      },
      denominadorSecundario: {
        n: fila.length,
        do_que: "itens na fila. O cruzamento vale sobre a parte resolvida, e não sobre a fila inteira",
      },
      sustentado: true,
      procedenciaDoNumero:
        "src/dados/moderacao.ts · ItemDaFila.uf e ItemDaFila.registrosNaUf — a unidade federativa vem da descida da hierarquia territorial por porTerritorio(), a MESMA travessia de densidadePorUf(), e não de comparação de título",
      declaracao: null,
      leitura:
        `${porUf.length} unidades federativas têm item nesta fila, sobre os ${comUf} itens que o acervo situa — ` +
        `os outros ${semUf} não têm território nenhum, e isso não é falha de resolução: é o acervo não sabendo onde a coisa fica. ` +
        `A lista abaixo está ordenada pelo ACERVO, do mais magro ao mais cheio, porque é essa ordem que revela o que só ` +
        `esta tela pode ver: fila parada num estado com pouco acervo é abandono, não calmaria. ` +
        `Cruzar por título em vez de por sigla faria «São Paulo» da fila — que é município — encontrar os registros do ESTADO, ` +
        `e é por não fazer isso que este número vale.`,
      detalhe: porUf.map((u) => ({
        rotulo: u.sigla,
        valor: u.naFila,
        de: comUf,
        nota: `${u.registrosNoAcervo} registros de lugar no acervo inteiro desta unidade federativa`,
      })),
    });

  moderacaoMemorizada = {
    semLastro,
    cruzamento,
    fila: fila.length,
    porEscopo,
    porUf,
    semUf,
    comTerritorioSemUf,
    asTresTelas: [
      {
        tela: "M9 · meu histórico",
        deQuem: "do moderador, para ele mesmo",
        oQueMede: "as próprias decisões, com nome porque o nome é dele",
      },
      {
        tela: "A10 · desempenho",
        deQuem: "do Admin",
        oQueMede: "quem modera, para governar — nome, volume e concordância entre moderadores",
      },
      {
        tela: "G8 · esta tela",
        deQuem: "do Gestor",
        oQueMede: "o sistema de moderação, agregado e anonimizado — nenhum nome aparece aqui",
      },
    ],
    sobreAAntiguidade,
  };
  return moderacaoMemorizada;
}
