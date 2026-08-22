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

import { contagens, porSlug, porTerritorio, slugsPorTipo, vizinhos } from "./grafo";
import { densidadePorUf } from "./geo";
import { PERSONAS } from "./personas";
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
};

/** Teto do DTO que atravessa a fronteira RSC. 60 KB, medido a cada build. */
export const TETO_DO_DTO = 61_440;

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
    "Nós extraímos do que veio do Itaú Cultural, por regra escrita e auditável: as ocorrências datadas, os territórios, os espaços e as arestas de semelhança. Não é invenção, é leitura — mas é leitura NOSSA, e por isso está separada.",
  autorado:
    "Nós inventamos para o protótipo. Não existe no acervo do Itaú Cultural: foi escrito por nós para a demonstração ter o que mostrar.",
};

export const ROTULO_DA_PROCEDENCIA: Record<Procedencia, string> = {
  ic: "Itaú Cultural",
  derivado: "derivado por nós",
  autorado: "autorado por nós",
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

const zerado = (): Record<Procedencia, number> => ({ ic: 0, derivado: 0, autorado: 0 });

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
  };
  const porRelacao: Record<Procedencia, Map<Relacao, number>> = {
    ic: new Map(),
    derivado: new Map(),
    autorado: new Map(),
  };
  const exemploPorProcedencia: Record<Procedencia, ExemploDeEntidade | null> = {
    ic: null,
    derivado: null,
    autorado: null,
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
    },
    exemploPorProcedencia,
    arestasPorProcedencia,
    relacoesPorProcedencia: {
      ic: maiores(porRelacao.ic),
      derivado: maiores(porRelacao.derivado),
      autorado: maiores(porRelacao.autorado),
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
      problemas.push(`arestas «${p}»: varredura ${minhasArestas}, meta.json ${arestasDeMeta}`);
    }
  }

  if (somaDeEntidades !== META.totais.entidades) {
    problemas.push(
      `as fatias de entidade somam ${somaDeEntidades} e o acervo tem ${META.totais.entidades}`,
    );
  }
  if (somaDeArestas !== a.totalDeArestas || somaDeArestas !== META.totais.arestas) {
    problemas.push(
      `as fatias de aresta somam ${somaDeArestas}, a varredura viu ${a.totalDeArestas} arestas distintas e meta.json declara ${META.totais.arestas}`,
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
        ? `${(ROTULO_DA_RELACAO[top[0]] ?? top[0]).toString()} — ${top[1].toLocaleString("pt-BR")} arestas`
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
    procedenciaDoNumero: "src/dados/geo.ts · densidadePorUf() sobre as arestas situado_em",
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
 * Enciclopédia, nem nas 7.810 entidades. `disposicoes.ts` já registra isso por escrito e
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
      do_que: `campos de faixa etária nas ${total.toLocaleString("pt-BR")} entidades do acervo`,
    },
    denominadorSecundario: {
      n: total,
      do_que: "entidades varridas atrás do campo — nenhuma o tem",
    },
    sustentado: false,
    procedenciaDoNumero:
      "src/dados/disposicoes.ts · o corte por faixa etária já nasce visível e desligado, com o motivo escrito",
    declaracao:
      "O acervo não declara faixa etária nem classificação indicativa em campo nenhum — nem no CMS, nem na Enciclopédia, nem nas 7.810 entidades. Este recorte fica visível e desligado. Adivinhar por palavra no título seria inventar a classificação indicativa de um evento real, e é diferente de gratuidade: lá o campo existe e está vazio; aqui o campo não existe.",
    leitura:
      "Dois indicadores desta tela não são sustentados pelo acervo, e eles falham por motivos diferentes. A tela mostra os dois em vez de mostrar cinco que fecham bonito.",
    detalhe: [],
  };
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

  // A invariante de D-90, conferida em vez de confiada: `valor: null` e `sustentado: false`
  // são a MESMA afirmação e nunca podem se separar, e um indicador não sustentado sem frase
  // é um zero silencioso com outro nome.
  for (const i of lista) {
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
          `Um indicador sem lastro e sem frase é um zero silencioso (D-90).`,
      );
    }
    if (!i.denominador?.do_que || typeof i.denominador.n !== "number") {
      throw new Error(`observatorio.ts: «${i.id}» sem denominador nomeado.`);
    }
    if (!i.procedenciaDoNumero) {
      throw new Error(`observatorio.ts: «${i.id}» sem a origem do número.`);
    }
  }

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
