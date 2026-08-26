/**
 * organizacao.ts — o que as dez telas do nível 6 leem do grafo.
 *
 * MÓDULO DE SERVIDOR. Ele lê `@/dados/grafo` por valor, no build, e devolve DTOs só de
 * primitivo. Componente `"use client"` importa daqui APENAS POR TIPO — é essa fronteira,
 * e só ela, que impede os 9,4 MB de `entidades.json` de atravessarem para o navegador
 * (DP-F). Um `import` por valor do outro lado seria invisível no código e mediria megabytes
 * no artefato.
 *
 * NENHUM NÚMERO DIGITADO. Tudo o que este arquivo afirma sobre o acervo é CONTADO aqui,
 * sobre o grafo carregado — «113 espaços», «100% derivado», «2.425 sem espaço declarado».
 * Um literal digitado passaria a mentir na primeira regeração do grafo, e mentiria em
 * silêncio, que é a única forma de mentira que este produto não pode se permitir: o
 * argumento inteiro da proposta é que os números da tela são medidos.
 *
 * SEM RELÓGIO E SEM SORTEIO. A data é `DATA_DE_REFERENCIA`, fixada em `alerta.ts`.
 */

import vocabularioJson from "./gerado/vocabulario.json";
import { DATA_DE_REFERENCIA } from "./alerta";
import { ocorrenciasDe, porSlug, slugsPorTipo, vizinhos } from "./grafo";
import type { Entidade, MetodoCoordenada, Procedencia, Vocabulario } from "./tipos";

const vocabulario = vocabularioJson as Vocabulario;

/** Quem opera a superfície na demonstração. Autorado, e a tela diz que é — no mesmo
 *  padrão de `OPERADOR_DO_STUDIO` e de `PRODUTOR_DA_DEMONSTRACAO`. */
export const ORGANIZACAO_DA_DEMONSTRACAO = "Itaú Cultural";

export const GESTOR_DA_ORGANIZACAO = "Gestão institucional (perfil autorado)";

export const GESTOR_E_AUTORADO =
  "O perfil de quem opera esta tela é autorado para a demonstração: não há autenticação " +
  "real no protótipo. O que NÃO é autorado é o carimbo — toda escrita registra este " +
  "nome, porque §3 da ontologia proíbe escrita anônima, admin incluído.";

// ---------------------------------------------------------------------------
// O espaço, achatado em primitivo
// ---------------------------------------------------------------------------

export interface EspacoDoAcervo {
  id: string;
  slug: string;
  titulo: string;
  /** O verbete que a Enciclopédia publica. É ele que explica de ONDE o espaço foi
   *  inferido — e é por isso que a tela o mostra em vez de esconder a derivação. */
  resumo: string;
  cidade: string;
  estado: string;
  pais: string;
  /** O território a que o espaço está ligado por `situado_em`, quando há. */
  territorio: string | null;
  lat: number | null;
  lon: number | null;
  metodoCoordenada: MetodoCoordenada | null;
  procedencia: Procedencia;
  /** De qual entidade `ic` este nó derivado foi extraído. É a prova da inferência. */
  derivadoDe: string | null;
  declaraAcessibilidade: boolean;
}

function texto(e: Entidade, chave: string): string {
  const v = e.extra?.[chave];
  return typeof v === "string" ? v : "";
}

function entidadesDe(classe: Parameters<typeof slugsPorTipo>[0]): Entidade[] {
  const saida: Entidade[] = [];
  for (const slug of slugsPorTipo(classe)) {
    const e = porSlug(classe, slug);
    if (e) saida.push(e);
  }
  return saida;
}

/**
 * Os 113 espaços do acervo, em ordem de título.
 *
 * A LISTA INTEIRA VAI JUNTO, e é decisão e não descuido: são 113 registros de treze
 * campos de primitivo, e a tela precisa deixar trocar de espaço sem navegar. Uma rota por
 * espaço geraria 113 páginas e faria quem cadastra perder o lugar na lista a cada clique
 * — o mesmo raciocínio que a fila de duplicatas já fez para 84 grupos.
 *
 * Ordem por título e não por id: quem procura um espaço procura pelo nome.
 */
export function espacosDoAcervo(): EspacoDoAcervo[] {
  const espacos = entidadesDe("espaco").map((e) => {
    const territorio =
      vizinhos(e.id, "situado_em")
        .map((v) => v.entidade)
        .find((x) => x.classe === "territorio")?.titulo ?? null;

    return {
      id: e.id,
      slug: e.slug,
      titulo: e.titulo,
      resumo: (e.resumo ?? "").trim(),
      cidade: texto(e, "cidade"),
      estado: texto(e, "estado"),
      pais: texto(e, "pais"),
      territorio,
      lat: e.coordenada?.lat ?? null,
      lon: e.coordenada?.lon ?? null,
      metodoCoordenada: e.coordenada?.metodo ?? null,
      procedencia: e.procedencia,
      derivadoDe: e.derivadoDe ?? null,
      declaraAcessibilidade: e.declaraAcessibilidade,
    };
  });

  espacos.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  return espacos;
}

// ---------------------------------------------------------------------------
// Os números que explicam por que a tela existe
// ---------------------------------------------------------------------------

export interface NumerosDosEspacos {
  total: number;
  derivados: number;
  daFonte: number;
  declaramAcessibilidade: number;
  comCoordenada: number;
  /** Quantos espaços por método de derivação da coordenada, em ordem decrescente. */
  porMetodo: { metodo: string; quantos: number }[];
  /** O denominador que explica a tela: sessões que não dizem onde acontecem. */
  ocorrencias: number;
  ocorrenciasComEspaco: number;
  /** Quantos lugares distintos (cidade + estado) os 113 cobrem. */
  cidades: number;
}

/**
 * Conta, sobre o grafo, tudo o que a O2 afirma.
 *
 * `ocorrenciasComEspaco` é contado percorrendo os eventos e não lendo `ocorrencias.json`
 * direto: o arquivo é indexado por evento e a casa já decidiu que o acesso passa por
 * `grafo.ts` (D-47). São 300 eventos e 2.425 sessões — a conta roda uma vez, no build.
 */
export function numerosDosEspacos(): NumerosDosEspacos {
  const espacos = entidadesDe("espaco");

  const metodos = new Map<string, number>();
  for (const e of espacos) {
    if (!e.coordenada) continue;
    metodos.set(e.coordenada.metodo, (metodos.get(e.coordenada.metodo) ?? 0) + 1);
  }

  let ocorrencias = 0;
  let ocorrenciasComEspaco = 0;
  for (const evento of entidadesDe("evento")) {
    for (const o of ocorrenciasDe(evento.id)) {
      ocorrencias += 1;
      if (o.espacoId) ocorrenciasComEspaco += 1;
    }
  }

  const lugares = new Set(espacos.map((e) => `${texto(e, "cidade")}|${texto(e, "estado")}`));

  return {
    total: espacos.length,
    derivados: espacos.filter((e) => e.procedencia === "derivado").length,
    daFonte: espacos.filter((e) => e.procedencia === "ic").length,
    declaramAcessibilidade: espacos.filter((e) => e.declaraAcessibilidade).length,
    comCoordenada: espacos.filter((e) => e.coordenada).length,
    porMetodo: [...metodos.entries()]
      .map(([metodo, quantos]) => ({ metodo, quantos }))
      .sort((a, b) => b.quantos - a.quantos || a.metodo.localeCompare(b.metodo)),
    ocorrencias,
    ocorrenciasComEspaco,
    cidades: lugares.size,
  };
}

// ---------------------------------------------------------------------------
// As declarações — frases que CITAM os números, em vez de repeti-los à mão
// ---------------------------------------------------------------------------

export interface DeclaracaoDaTela {
  titulo: string;
  texto: string;
}

/**
 * O que a O2 declara sobre o próprio dado.
 *
 * As frases são montadas a partir de `numerosDosEspacos()` e não escritas com o número
 * dentro: assim elas continuam verdadeiras depois de uma regeração do grafo. É a mesma
 * disciplina de `declaracaoDoQueNaoSustenta()` em `duplicatas.ts`.
 */
export function declaracoesDosEspacos(n: NumerosDosEspacos): DeclaracaoDaTela[] {
  const saida: DeclaracaoDaTela[] = [
    {
      titulo: "Nenhum espaço do acervo vem da fonte",
      texto:
        `Os ${n.total} espaços são ${n.derivados} derivados e ${n.daFonte} da fonte. Todos ` +
        `foram INFERIDOS por regra a partir do campo territorial da Enciclopédia — o Itaú ` +
        `Cultural não publica um cadastro de espaços. É por isso que esta tela é a segunda ` +
        `maior conversão de procedência do sistema, atrás só das ocorrências.`,
    },
    {
      titulo: "Nenhum espaço declara acessibilidade",
      texto:
        `${n.declaramAcessibilidade} de ${n.total} espaços declaram a ficha. A funcionalidade ` +
        `de ficha de acessibilidade está no ar no app público e, do lado do espaço, não tem ` +
        `nenhum dado — e é a ficha do espaço que decide se alguém consegue chegar. Só a ` +
        `Organização pode declarar isso.`,
    },
    {
      titulo: "As sessões não dizem onde acontecem",
      texto:
        `${n.ocorrenciasComEspaco} de ${n.ocorrencias} ocorrências têm espaço declarado. Este é ` +
        `o denominador que explica a tela: enquanto não houver espaço cadastrado, o produtor ` +
        `não tem o que escolher, e a chave de identidade da sessão — temporada + início + ` +
        `espaço — fica sem um terço.`,
    },
  ];

  if (n.comCoordenada === n.total && n.porMetodo.length > 0) {
    const m = n.porMetodo[0];
    saida.push({
      titulo: "A coordenada é derivada, e continua",
      texto:
        `Os ${n.total} espaços têm coordenada, e ${m.quantos} deles por «${m.metodo}» — uma ` +
        `regra de deslocamento, não um endereço geocodificado. Cadastrar o endereço nesta ` +
        `tela troca o MÉTODO da derivação e não a procedência dela: latitude digitada não ` +
        `existe neste produto.`,
    });
  }

  return saida;
}

/** A data contra a qual tudo isto foi medido. Reexportada para a página carimbar a tela
 *  sem importar dois módulos — e para deixar explícito que a medida tem data. */
export const DATA_DA_MEDIDA = DATA_DE_REFERENCIA;

// ---------------------------------------------------------------------------
// A instituição — O1
// ---------------------------------------------------------------------------

export interface LocalDaInstituicao {
  cidade: string;
  estado: string;
  pais: string;
}

export interface InstituicaoDoAcervo {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  /** A URL do verbete na Enciclopédia. Obrigatória quando `procedencia === "ic"`, e as 246
   *  são `ic` — é ela que deixa quem confere abrir a fonte em vez de acreditar na tela. */
  fonte: string | null;
  imagem: string | null;
  creditoImagem: string | null;
  /** Rótulos do vocabulário controlado, já resolvidos: o cliente não tem o índice. */
  linguagens: string[];
  territorio: string | null;
  locais: LocalDaInstituicao[];
  /** Quantos eventos ela `realiza`. É a relação organizacional de verdade — `pertence_a` é
   *  classificação, não hierarquia — e é o segundo terço da chave de identidade do evento. */
  eventosRealizados: number;
  temCoordenada: boolean;
  declaraAcessibilidade: boolean;
}

function locaisDe(e: Entidade): LocalDaInstituicao[] {
  const bruto = e.extra?.locais;
  if (!Array.isArray(bruto)) return [];
  const saida: LocalDaInstituicao[] = [];
  for (const l of bruto) {
    if (typeof l !== "object" || l === null) continue;
    const o = l as Record<string, unknown>;
    saida.push({
      cidade: typeof o.cidade === "string" ? o.cidade : "",
      estado: typeof o.estado === "string" ? o.estado : "",
      pais: typeof o.pais === "string" ? o.pais : "",
    });
  }
  return saida;
}

const ROTULO_DA_LINGUAGEM = new Map(vocabulario.linguagens.map((l) => [l.id, l.rotulo]));

/**
 * As 246 instituições, em ordem de título.
 *
 * A LISTA INTEIRA VAI JUNTO pelo mesmo motivo dos 113 espaços: a O1 deixa escolher por qual
 * instituição a organização responde, e trocar de instituição não pode ser navegar. São
 * treze campos de primitivo por registro.
 */
export function instituicoesDoAcervo(): InstituicaoDoAcervo[] {
  const saida = entidadesDe("instituicao").map((e) => {
    const territorio =
      vizinhos(e.id, "situado_em")
        .map((v) => v.entidade)
        .find((x) => x.classe === "territorio")?.titulo ?? null;

    return {
      id: e.id,
      slug: e.slug,
      titulo: e.titulo,
      resumo: (e.resumo ?? "").trim(),
      fonte: e.fonte ?? null,
      imagem: e.imagem ?? null,
      creditoImagem: e.creditoImagem ?? null,
      linguagens: e.linguagens.map((id) => ROTULO_DA_LINGUAGEM.get(id) ?? id),
      territorio,
      locais: locaisDe(e),
      eventosRealizados: vizinhos(e.id, "realiza").length,
      temCoordenada: e.coordenada !== undefined,
      declaraAcessibilidade: e.declaraAcessibilidade,
    };
  });

  saida.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  return saida;
}

/**
 * Por qual instituição a demonstração começa respondendo.
 *
 * REGRA, E NÃO CURADORIA: a primeira em ordem de título entre as que `realiza` pelo menos um
 * evento. Uma escolha manual aqui seria mais um lugar onde a demonstração dependeria de
 * alguém lembrar de atualizar depois de uma regeração do grafo — a mesma disciplina de
 * `GRUPO_DO_TRACADOR` em `duplicatas.ts`.
 *
 * Por que «entre as que realizam»: a ficha que importa é a de quem publica. Das 246, só 127
 * realizam evento; abrir numa das 119 que não realizam mostraria a tela no caso menos
 * interessante que ela tem.
 */
export function instituicaoInicial(lista: InstituicaoDoAcervo[]): string | null {
  return lista.find((i) => i.eventosRealizados > 0)?.id ?? lista[0]?.id ?? null;
}

export interface NumerosDasInstituicoes {
  total: number;
  daFonte: number;
  comCoordenada: number;
  declaramAcessibilidade: number;
  comImagem: number;
  comCredito: number;
  /** As que têm imagem e NÃO têm crédito. Trabalho concreto, não aviso genérico. */
  comImagemSemCredito: number;
  comResumo: number;
  /** Arestas `instituicao → linguagem`, e quantas instituições realizam evento. */
  arestasDeLinguagem: number;
  queRealizam: number;
  eventosRealizados: number;
}

export function numerosDasInstituicoes(): NumerosDasInstituicoes {
  const ins = entidadesDe("instituicao");
  let arestasDeLinguagem = 0;
  let queRealizam = 0;
  let eventosRealizados = 0;

  for (const e of ins) {
    arestasDeLinguagem += e.linguagens.length;
    const realiza = vizinhos(e.id, "realiza").length;
    eventosRealizados += realiza;
    if (realiza > 0) queRealizam += 1;
  }

  return {
    total: ins.length,
    daFonte: ins.filter((e) => e.procedencia === "ic").length,
    comCoordenada: ins.filter((e) => e.coordenada).length,
    declaramAcessibilidade: ins.filter((e) => e.declaraAcessibilidade).length,
    comImagem: ins.filter((e) => e.imagem).length,
    comCredito: ins.filter((e) => e.creditoImagem).length,
    comImagemSemCredito: ins.filter((e) => e.imagem && !e.creditoImagem).length,
    comResumo: ins.filter((e) => (e.resumo ?? "").trim().length > 0).length,
    arestasDeLinguagem,
    queRealizam,
    eventosRealizados,
  };
}

export function declaracoesDasInstituicoes(n: NumerosDasInstituicoes): DeclaracaoDaTela[] {
  return [
    {
      titulo: "Nenhuma instituição tem lugar",
      texto:
        `${n.comCoordenada} de ${n.total} instituições têm coordenada. Uma instituição sem lugar ` +
        `não aparece no mapa, e o mapa é a lente de todo o produto. Esta tela cadastra o ` +
        `endereço — e a coordenada continua derivada, pelo mesmo motivo da tela de espaços.`,
    },
    {
      titulo: "Nenhuma instituição declara acessibilidade",
      texto:
        `${n.declaramAcessibilidade} de ${n.total} declaram a ficha. O padrão do ato explícito ` +
        `foi fixado na tela de espaços e é o MESMO aqui: treze caixas desmarcadas seriam lidas ` +
        `como «não declarou», e a plataforma se proibiu de interpretar silêncio.`,
    },
    {
      titulo: "A imagem existe antes do crédito",
      texto:
        `${n.comImagem} de ${n.total} instituições têm imagem e ${n.comCredito} têm crédito — ` +
        `${n.comImagemSemCredito} têm imagem SEM crédito. Crédito é bloqueante, então essas ` +
        `${n.comImagemSemCredito} não publicam a imagem até alguém resolver. É trabalho ` +
        `nomeado, e não aviso genérico.`,
    },
    {
      titulo: "«realiza» é a relação organizacional de verdade",
      texto:
        `${n.queRealizam} de ${n.total} instituições realizam evento, somando ` +
        `${n.eventosRealizados} arestas. É esta relação — e não «pertence_a», que é ` +
        `classificação — que faz a chave de identidade do evento fechar: título normalizado ` +
        `+ AGENTE REALIZADOR + obra. Sem organização cadastrada, o produtor não consegue ` +
        `preencher o segundo terço da chave.`,
    },
    {
      titulo: "O verbete é da Enciclopédia, e esta tela não o reescreve",
      texto:
        `As ${n.daFonte} de ${n.total} instituições são todas da fonte, com ${n.comResumo} ` +
        `trazendo resumo e ${n.arestasDeLinguagem} arestas de linguagem. Nome, resumo e ` +
        `linguagem continuam vindo de lá: o Studio referencia e propõe, nunca edita o verbete ` +
        `de um agente real.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// A mídia — O5
// ---------------------------------------------------------------------------

export interface MidiaDoAcervo {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  /** Onde o CMS publica o item — `podcasts`, `series`, `videos`… NÃO é o formato do
   *  arquivo, e a tela não o trata como se fosse. */
  categoria: string;
  imagem: string | null;
  creditoImagem: string | null;
  /** A descrição alternativa da imagem, que o acervo às vezes traz e às vezes não. */
  imagemAlt: string | null;
  publicadoEm: string | null;
  linguagens: string[];
  /** As 8 dimensões como o acervo as publica, e o ato de declarar separado delas. */
  acessibilidade: Record<string, boolean>;
  declaraAcessibilidade: boolean;
}

export interface NumerosDasMidias {
  total: number;
  daFonte: number;
  declaramAcessibilidade: number;
  comImagem: number;
  comCredito: number;
  semCredito: number;
  comImagemAlt: number;
  /** Quantos itens por categoria do CMS, do maior para o menor. */
  porCategoria: { categoria: string; quantos: number }[];
  /** Quantos itens marcam cada uma das 8 dimensões. É a medida mais dura da tela. */
  porDimensao: { chave: string; rotulo: string; quantos: number }[];
}

export function midiasDoAcervo(): MidiaDoAcervo[] {
  const saida = entidadesDe("midia").map((e) => ({
    id: e.id,
    slug: e.slug,
    titulo: e.titulo,
    resumo: (e.resumo ?? "").trim(),
    categoria: texto(e, "categoria"),
    imagem: e.imagem ?? null,
    creditoImagem: e.creditoImagem ?? null,
    imagemAlt: texto(e, "imagemAlt") || null,
    publicadoEm: texto(e, "publicadoEm") || null,
    linguagens: e.linguagens.map((id) => ROTULO_DA_LINGUAGEM.get(id) ?? id),
    acessibilidade: { ...e.acessibilidade } as unknown as Record<string, boolean>,
    declaraAcessibilidade: e.declaraAcessibilidade,
  }));

  // Os SEM crédito primeiro, e não em ordem de título: eles são a fila de trabalho da tela,
  // e uma fila que abre no meio da lista alfabética não é uma fila.
  saida.sort((a, b) => {
    const bloqueadoA = a.creditoImagem ? 1 : 0;
    const bloqueadoB = b.creditoImagem ? 1 : 0;
    if (bloqueadoA !== bloqueadoB) return bloqueadoA - bloqueadoB;
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
  return saida;
}

/** Os rótulos das 8, na ordem do contrato. Espelha `DIMENSOES_DE_ACESSIBILIDADE`, que mora
 *  em `tipos-acesso.ts` — mas este módulo é de servidor e a contagem é feita aqui. */
const DIMENSOES_MEDIDAS: readonly { chave: string; rotulo: string }[] = [
  { chave: "audio_description", rotulo: "audiodescrição" },
  { chave: "libras", rotulo: "Libras" },
  { chave: "descriptive_subtitle", rotulo: "legenda descritiva" },
  { chave: "closed_caption", rotulo: "closed caption" },
  { chave: "open_caption", rotulo: "legenda aberta" },
  { chave: "simultaneous_translation", rotulo: "tradução simultânea" },
  { chave: "stenotypy", rotulo: "estenotipia" },
  { chave: "subtitle", rotulo: "legenda" },
];

export function numerosDasMidias(): NumerosDasMidias {
  const midias = entidadesDe("midia");
  const categorias = new Map<string, number>();
  for (const e of midias) {
    const c = texto(e, "categoria") || "sem categoria";
    categorias.set(c, (categorias.get(c) ?? 0) + 1);
  }

  return {
    total: midias.length,
    daFonte: midias.filter((e) => e.procedencia === "ic").length,
    declaramAcessibilidade: midias.filter((e) => e.declaraAcessibilidade).length,
    comImagem: midias.filter((e) => e.imagem).length,
    comCredito: midias.filter((e) => e.creditoImagem).length,
    semCredito: midias.filter((e) => !e.creditoImagem).length,
    comImagemAlt: midias.filter((e) => texto(e, "imagemAlt").length > 0).length,
    porCategoria: [...categorias.entries()]
      .map(([categoria, quantos]) => ({ categoria, quantos }))
      .sort((a, b) => b.quantos - a.quantos || a.categoria.localeCompare(b.categoria)),
    porDimensao: DIMENSOES_MEDIDAS.map((d) => ({
      ...d,
      quantos: midias.filter((e) => (e.acessibilidade as unknown as Record<string, boolean>)[d.chave])
        .length,
    })),
  };
}

export function declaracoesDasMidias(n: NumerosDasMidias): DeclaracaoDaTela[] {
  const maior = n.porCategoria[0];
  const zeradas = n.porDimensao.filter((d) => d.quantos === 0);

  return [
    {
      titulo: `${n.semCredito} itens não publicam`,
      texto:
        `${n.comCredito} de ${n.total} mídias têm crédito. As ${n.semCredito} sem crédito não ` +
        `publicam a imagem — crédito é bloqueante (165), e isso é trabalho concreto e nomeado: ` +
        `esta tela abre por elas, e não em ordem alfabética.`,
    },
    {
      titulo: "A ficha de acessibilidade existe, e está vazia",
      texto:
        `${n.declaramAcessibilidade} de ${n.total} mídias DECLARAM a ficha — ou seja, o ato foi ` +
        `feito em 100% do acervo. E ainda assim ${zeradas.length} das 8 dimensões estão em ZERO ` +
        `itens: ${zeradas.map((d) => d.rotulo).join(", ")}. Ficha preenchida não é ficha ` +
        `atendida, e a diferença entre as duas coisas é esta tela.`,
    },
    {
      titulo: "Categoria não é formato",
      texto:
        `A maior categoria é «${maior?.categoria ?? "—"}», com ${maior?.quantos ?? 0} de ` +
        `${n.total} itens. Categoria é ONDE o CMS publica, não O QUE o arquivo é — «séries» tem ` +
        `vídeo e tem texto. O formato é campo declarado, e enquanto ninguém declarar a tela diz ` +
        `que ninguém declarou.`,
    },
    {
      titulo: "A descrição alternativa também é ausência com denominador",
      texto:
        `${n.comImagemAlt} de ${n.total} itens trazem descrição alternativa da imagem. Os ` +
        `${n.total - n.comImagemAlt} sem ela publicam uma imagem que leitor de tela não lê.`,
    },
  ];
}
