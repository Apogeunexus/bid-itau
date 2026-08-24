/**
 * grafo.ts — a única porta de entrada para o acervo (D-16).
 *
 * As telas nunca varrem arrays crus: sempre passam por aqui. É essa restrição que
 * impede o produto de virar catálogo — quem consulta por travessia acaba mostrando
 * relação, quem consulta por filtro acaba mostrando lista.
 *
 * Tudo puro e síncrono, sobre índices `Map` construídos uma vez no carregamento do
 * módulo. Sob `output: "export"` (D-24) isso roda no build, não no runtime.
 *
 * ESTA É A API PÚBLICA E CONGELADA. Os planos 01-02 e 01-03 rodam em paralelo
 * contra estas nove assinaturas; 01-03 pode reescrever tudo por baixo sem tocar
 * em nenhuma delas.
 */

import { CAPAS_EXTRA } from "./capas-extra";
import entidadesJson from "./gerado/entidades.json";
import arestasJson from "./gerado/arestas.json";
import ocorrenciasJson from "./gerado/ocorrencias.json";
import type {
  Aresta,
  ClasseEntidade,
  Contagens,
  Entidade,
  Janela,
  Ocorrencia,
  OcorrenciasPorEvento,
  Passo,
  Relacao,
  Vizinho,
} from "./tipos";

/**
 * Capa que o crawl não internou — só entra se a entidade ainda não tem foto.
 * O arquivo já está em `public/acervo/`; aqui só amarra id → caminho + crédito.
 */
function comCapasExtras(lista: readonly Entidade[]): Entidade[] {
  return lista.map((e) => {
    if (e.imagem) return e;
    const extra = CAPAS_EXTRA[e.id];
    if (!extra) return e;
    return {
      ...e,
      imagem: `/acervo/${extra.arquivo}`,
      creditoImagem: extra.credito,
      extra: { ...e.extra, imagemFonte: extra.fonte },
    };
  });
}

const ENTIDADES = comCapasExtras(entidadesJson as unknown as Entidade[]);
const ARESTAS = arestasJson as unknown as Aresta[];
const OCORRENCIAS = ocorrenciasJson as unknown as OcorrenciasPorEvento;

/**
 * Grau acima do qual um nó é tratado como concentrador e fica barrado como salto
 * intermediário na primeira passada de `caminho()` (T-01-03).
 *
 * Exportado de propósito: o valor precisa ser auditável, porque é ele que decide
 * se uma trilha é explicação ou atalho. Espelha `GRAU_HUB` de `scripts/gerar-grafo.mjs`.
 */
export const GRAU_HUB = 60;

/** Teto de saltos de `caminho()`. Segura a busca em largura em grafo denso. */
const MAX_PASSOS_PADRAO = 4;

// ---------------------------------------------------------------------------
// Índices — construídos uma vez, no carregamento do módulo
// ---------------------------------------------------------------------------

const IDX_POR_ID = new Map<string, Entidade>(ENTIDADES.map((e) => [e.id, e]));

/**
 * Ordem de preferência de expansão. Sem ela, todo par de entidades vira
 * "dois saltos passando por Artes visuais" — verdade e inútil.
 * Menor é melhor.
 */
const PESO_RELACAO: Record<Relacao, number> = {
  semelhante_a: 0,
  influenciou: 1,
  dialoga_com: 1,
  deriva_de: 1,
  aprofunda: 1,
  fala_sobre: 1,
  contextualiza: 1,
  atua_em: 2,
  realiza: 2,
  ocorre_em: 2,
  situado_em: 2,
  curou: 2,
  duplicata_suspeita: 3,
  pertence_a: 4,
};

/** Adjacência não dirigida, já ordenada por preferência de relação e por id. */
const IDX_ADJACENCIA = (() => {
  const idx = new Map<string, Aresta[]>();
  const empurrar = (chave: string, aresta: Aresta) => {
    const lista = idx.get(chave);
    if (lista) lista.push(aresta);
    else idx.set(chave, [aresta]);
  };
  for (const a of ARESTAS) {
    empurrar(a.de, a);
    if (a.para !== a.de) empurrar(a.para, a);
  }
  for (const lista of idx.values()) {
    lista.sort(
      (x, y) =>
        PESO_RELACAO[x.relacao] - PESO_RELACAO[y.relacao] ||
        x.de.localeCompare(y.de) ||
        x.para.localeCompare(y.para),
    );
  }
  return idx;
})();

const IDX_GRAU = new Map<string, number>(
  [...IDX_ADJACENCIA].map(([id, arestas]) => [id, arestas.length]),
);

const IDX_POR_CLASSE = (() => {
  const idx = new Map<ClasseEntidade, Entidade[]>();
  for (const e of ENTIDADES) {
    const lista = idx.get(e.classe);
    if (lista) lista.push(e);
    else idx.set(e.classe, [e]);
  }
  return idx;
})();

const IDX_POR_SLUG = new Map<string, Entidade>(
  ENTIDADES.map((e) => [`${e.classe}/${e.slug}`, e]),
);

const IDX_POR_LINGUAGEM = (() => {
  const idx = new Map<string, Entidade[]>();
  for (const e of ENTIDADES) {
    for (const l of e.linguagens) {
      const lista = idx.get(l);
      if (lista) lista.push(e);
      else idx.set(l, [e]);
    }
  }
  return idx;
})();

/** Assunto → entidades. Alimenta a tela de filtros e o motivo de `semelhante_a`. */
const IDX_POR_TEMA = (() => {
  const idx = new Map<string, Entidade[]>();
  for (const e of ENTIDADES) {
    for (const t of e.temas) {
      const lista = idx.get(t);
      if (lista) lista.push(e);
      else idx.set(t, [e]);
    }
  }
  return idx;
})();

// ---------------------------------------------------------------------------
// D-16 — as seis funções de travessia
// ---------------------------------------------------------------------------

/** Nó do grafo pelo id canônico `"{classe}:{origem}:{idOrigem}"`. */
export function porId(id: string): Entidade | undefined {
  return IDX_POR_ID.get(id);
}

/**
 * Vizinhos imediatos, com a aresta que levou até cada um — é a aresta que carrega
 * o `motivo` e o `papel`, e sem ela a recomendação deixa de ser explicável.
 */
export function vizinhos(id: string, relacao?: Relacao): Vizinho[] {
  const arestas = IDX_ADJACENCIA.get(id);
  if (!arestas) return [];
  const saida: Vizinho[] = [];
  for (const aresta of arestas) {
    if (relacao && aresta.relacao !== relacao) continue;
    const outroId = aresta.de === id ? aresta.para : aresta.de;
    const entidade = IDX_POR_ID.get(outroId);
    if (entidade) saida.push({ aresta, entidade });
  }
  return saida;
}

/** Uma passada de busca em largura. `travarHubs` liga a trava de concentrador. */
function buscarEmLargura(
  de: string,
  para: string,
  maxPassos: number,
  travarHubs: boolean,
): Passo[] | null {
  if (de === para) return [];
  const anterior = new Map<string, { id: string; aresta: Aresta }>();
  const visitados = new Set<string>([de]);
  let fronteira = [de];

  for (let profundidade = 0; profundidade < maxPassos && fronteira.length; profundidade++) {
    const proxima: string[] = [];
    for (const atual of fronteira) {
      for (const aresta of IDX_ADJACENCIA.get(atual) ?? []) {
        const vizinhoId = aresta.de === atual ? aresta.para : aresta.de;
        if (visitados.has(vizinhoId)) continue;
        if (!IDX_POR_ID.has(vizinhoId)) continue;
        // A trava vale para saltos intermediários; o destino nunca é barrado.
        if (
          travarHubs &&
          vizinhoId !== para &&
          (IDX_GRAU.get(vizinhoId) ?? 0) > GRAU_HUB
        ) {
          continue;
        }
        visitados.add(vizinhoId);
        anterior.set(vizinhoId, { id: atual, aresta });
        if (vizinhoId === para) return reconstruir(anterior, de, para);
        proxima.push(vizinhoId);
      }
    }
    fronteira = proxima;
  }
  return null;
}

function reconstruir(
  anterior: Map<string, { id: string; aresta: Aresta }>,
  de: string,
  para: string,
): Passo[] {
  const passos: Passo[] = [];
  let cursor = para;
  while (cursor !== de) {
    const salto = anterior.get(cursor);
    if (!salto) return [];
    const origem = IDX_POR_ID.get(salto.id);
    const destino = IDX_POR_ID.get(cursor);
    if (!origem || !destino) return [];
    const passo: Passo = { de: origem, para: destino, relacao: salto.aresta.relacao };
    if (salto.aresta.motivo) passo.motivo = salto.aresta.motivo;
    if (salto.aresta.papel) passo.papel = salto.aresta.papel;
    passos.push(passo);
    cursor = salto.id;
  }
  return passos.reverse();
}

/**
 * Caminho explicável entre duas entidades.
 *
 * Busca em largura sobre a adjacência já ordenada por preferência de relação
 * (`semelhante_a` antes de acontecimento e agência, e `pertence_a` por último),
 * com trava de concentrador na primeira passada. Se a trava impedir o encontro,
 * repete sem ela — melhor um caminho por concentrador do que caminho nenhum.
 *
 * Devolve `Passo[]` com as entidades resolvidas e o `motivo`/`papel` de cada
 * aresta: é exatamente o que a tela "Por que isto apareceu" vai renderizar.
 */
export function caminho(
  de: string,
  para: string,
  maxPassos: number = MAX_PASSOS_PADRAO,
): Passo[] | null {
  if (!IDX_POR_ID.has(de) || !IDX_POR_ID.has(para)) return null;
  return (
    buscarEmLargura(de, para, maxPassos, true) ??
    buscarEmLargura(de, para, maxPassos, false)
  );
}

/**
 * Entidades que declaram a linguagem, opcionalmente restritas a uma classe.
 *
 * Aceita tanto o id de linguagem (`"musica"`) quanto o id de entidade da própria
 * linguagem (`"linguagem:cms:musica"`), porque a travessia devolve o segundo e a
 * tela costuma ter em mãos o primeiro. Também resolve id de tema, para a mesma
 * chamada servir aos dois eixos de classificação sem duplicar assinatura.
 */
export function porLinguagem(linguagemId: string, classe?: ClasseEntidade): Entidade[] {
  const chave = linguagemId.startsWith("linguagem:") || linguagemId.startsWith("tema:")
    ? (IDX_POR_ID.get(linguagemId)?.slug ?? linguagemId)
    : linguagemId;
  const lista = IDX_POR_LINGUAGEM.get(chave) ?? IDX_POR_TEMA.get(chave) ?? [];
  const filtrada = classe ? lista.filter((e) => e.classe === classe) : lista;
  return [...filtrada].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Entidades situadas num território, opcionalmente recortadas por janela temporal.
 *
 * Desce a hierarquia: pedir "Pará" devolve também quem está situado em Belém, porque
 * a fonte situa a entidade no município e a pergunta do produto costuma ser pelo
 * estado. Espaços entram junto — um espaço situado na cidade é conteúdo do território.
 *
 * **A `janela` é opcional de propósito, e isso é uma consequência medida do acervo:**
 * os 100 eventos do CMS têm data de 2026 e ZERO território; os 160 eventos da
 * Enciclopédia têm território real e data histórica (1978, 1966...). Nenhuma entidade
 * tem as duas coisas. Uma consulta "Belém nos próximos quatro dias" sobre dado real
 * devolve vazio, e inventar data para salvar a consulta violaria DADO-05. Sem janela,
 * a função devolve tudo e a tela decide como enquadrar.
 */
export function porTerritorio(territorioId: string, janela?: Janela): Entidade[] {
  const territorio = IDX_POR_ID.get(territorioId);
  if (!territorio || territorio.classe !== "territorio") return [];

  // `situado_em` é DIRIGIDA: o contido aponta para o continente. Descer a hierarquia
  // é seguir só as arestas que CHEGAM no território — se a travessia fosse não
  // dirigida, pedir Belém subiria para Pará, depois para Brasil, e devolveria o país
  // inteiro. Foi exatamente o que aconteceu na primeira versão.
  const territorios = new Set<string>([territorioId]);
  const fila = [territorioId];
  while (fila.length) {
    const atual = fila.shift() as string;
    for (const { aresta, entidade } of vizinhos(atual, "situado_em")) {
      if (aresta.para !== atual) continue;
      if (entidade.classe !== "territorio") continue;
      if (territorios.has(entidade.id)) continue;
      territorios.add(entidade.id);
      fila.push(entidade.id);
    }
  }

  const situadas = new Map<string, Entidade>();
  for (const t of territorios) {
    for (const { aresta, entidade } of vizinhos(t, "situado_em")) {
      if (aresta.para !== t) continue;
      if (entidade.classe === "territorio") continue;
      situadas.set(entidade.id, entidade);
    }
  }

  const lista = [...situadas.values()];
  const recortada = janela ? lista.filter((e) => dentroDaJanela(e, janela)) : lista;
  return recortada.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * A entidade acontece dentro da janela? Três testes, na ordem em que o acervo os
 * sustenta: sessão datada, período declarado do CMS, ano declarado da Enciclopédia.
 */
function dentroDaJanela(entidade: Entidade, janela: Janela): boolean {
  const sessoes = ocorrenciasDe(entidade.id);
  if (sessoes.some((o) => o.inicio.slice(0, 10) >= janela.de && o.inicio.slice(0, 10) <= janela.ate)) {
    return true;
  }

  const extra = entidade.extra as
    | { periodo?: { inicio?: string; fim?: string }; locais?: Array<{ data?: string | null }> }
    | undefined;

  const periodo = extra?.periodo;
  if (periodo?.inicio) {
    const inicio = periodo.inicio.slice(0, 10);
    const fim = (periodo.fim ?? periodo.inicio).slice(0, 10);
    if (inicio <= janela.ate && fim >= janela.de) return true;
  }

  for (const local of extra?.locais ?? []) {
    const ano = String(local?.data ?? "").match(/(\d{4})/)?.[1];
    if (!ano) continue;
    if (`${ano}-12-31` >= janela.de && `${ano}-01-01` <= janela.ate) return true;
  }

  return false;
}

/**
 * Sessões datadas de um evento (DADO-02).
 *
 * Lê `ocorrencias.json`, que é arquivo à parte indexado por evento — e não um array
 * aninhado dentro da entidade. Um evento devolve N ocorrências, cada uma com data,
 * hora e espaço próprios, sem que o evento apareça duplicado na listagem.
 *
 * Continua devolvendo lista vazia, e nunca lançando, para evento sem período: os 11
 * eventos do CMS sem data são um fato do acervo, não um erro de programa.
 */
export function ocorrenciasDe(eventoId: string): Ocorrencia[] {
  const lista = OCORRENCIAS[eventoId];
  if (!Array.isArray(lista)) return [];
  return [...lista].sort((a, b) => a.inicio.localeCompare(b.inicio) || a.id.localeCompare(b.id));
}

/** Temporadas de um evento, na ordem em que começam. Nível intermediário de DADO-02. */
export function temporadasDe(eventoId: string): Entidade[] {
  return vizinhos(eventoId, "ocorre_em")
    .map((v) => v.entidade)
    .filter((e) => e.classe === "temporada")
    .sort((a, b) => a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// Funções de serviço
// ---------------------------------------------------------------------------

/**
 * Fora de D-16, exigida por D-24: sob `output: "export"` toda rota dinâmica
 * precisa alimentar `generateStaticParams`, e sem esta lista a rota simplesmente
 * não é exportada.
 */
export function slugsPorTipo(classe: ClasseEntidade): string[] {
  const lista = IDX_POR_CLASSE.get(classe) ?? [];
  return [...new Set(lista.map((e) => e.slug))].sort();
}

/** Contrapartida de `slugsPorTipo`: resolve o parâmetro de rota em entidade. */
export function porSlug(classe: ClasseEntidade, slug: string): Entidade | undefined {
  return IDX_POR_SLUG.get(`${classe}/${slug}`);
}

/** Números do grafo. Alimenta o smoke e, na fase 5, o Observatório. */
export function contagens(): Contagens {
  const porClasse: Record<string, number> = {};
  const porProcedencia: Record<string, number> = {};
  for (const e of ENTIDADES) {
    porClasse[e.classe] = (porClasse[e.classe] ?? 0) + 1;
    porProcedencia[e.procedencia] = (porProcedencia[e.procedencia] ?? 0) + 1;
  }
  const ordenar = (o: Record<string, number>) =>
    Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  return { porClasse: ordenar(porClasse), porProcedencia: ordenar(porProcedencia) };
}
