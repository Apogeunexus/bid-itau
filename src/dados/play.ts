import { porSlug, slugsPorTipo, vizinhos } from "./grafo";
import { prateleirasDe, rostoDa } from "./prateleiras";
import {
  comprimirAcessibilidade,
  DIMENSOES,
  ROTULOS_DE_DIMENSAO,
  type CatalogoNoFio,
  type CategoriaContada,
  type DestaqueNoFio,
  type DimensaoContada,
  type ItemNoFio,
} from "./play-wire";
import type { Acessibilidade, Entidade } from "./tipos";

/**
 * play.ts — o catálogo unificado das 529 mídias do acervo (D-92).
 *
 * MÓDULO DE BUILD. Alcança `grafo.ts` por valor e por isso **nenhum `"use client"` pode
 * importá-lo por valor** (DP-F). O que atravessa a fronteira é `catalogoNoFio()`, cujo
 * vocabulário posicional mora em `play-wire.ts` — um módulo só-de-tipos que os dois lados
 * importam.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * O QUE FOI MEDIDO CONTRA O GRAFO, e cada número aqui é CONTADO, nunca escrito à mão:
 *
 * **As 529 mídias, por `extra.categoria`:** podcasts 336 · series 63 · videos 46 ·
 * noticias 45 · entrevista 25 · colunistas 7 · playlists 4 · agenda-cultural 2 ·
 * acervos 1. **Não existe campo de tipo nem de formato** no acervo — `categoria` é o que
 * ele tem, e é dela que o recorte da tela 19 sai. Vídeo, podcast, série e playlist estão
 * todos ali, com os nomes que o CMS usa; a tradução para português mora em `ROTULOS`,
 * neste arquivo, e em lugar nenhum mais.
 *
 * **As 529 são todas `ic`** e todas declaram `resumo`, `fonte` e `extra.publicadoEm`.
 * 518 têm imagem local, 352 têm linguagem, 242 têm tema.
 *
 * **Acessibilidade: apenas 3 das 529 têm `libras`.** As outras SETE dimensões medem
 * ZERO. A tela 19 pede filtro por legenda, Libras e audiodescrição como se fossem três
 * recortes equivalentes; medido, um recorta 3 e os outros dois recortam nada. É isso que
 * a tela tem de dizer, com o denominador, antes de qualquer marcação (D-90).
 *
 * **A ponte com evento é 14, não 529, e este é o número que a tela não pode maquiar.**
 * A única relação real entre mídia e evento no acervo é `fala_sobre`: 34 arestas, saindo
 * de 14 mídias distintas, chegando a 25 eventos distintos. `semelhante_a` de mídia vai
 * só para outra mídia e nunca para evento. Portanto «não pode ir? veja isto» é
 * sustentado por 14 das 529, e o bloco declara isso COM o denominador.
 *
 * **É PROIBIDO AUTORAR ARESTA MÍDIA→EVENTO PARA INFLAR ESSE NÚMERO** (T-05-34). Uma
 * ponte editorial entre dois conceitos é defensável; dizer «este vídeo fala deste
 * evento» quando o acervo nunca disse é uma afirmação factual falsa em nome do Itaú
 * Cultural — a mesma linha que este projeto se recusou a cruzar com lista de elenco.
 *
 * **`aprofunda` de mídia mede ZERO** — nenhuma das 529 tem uma. O plano supunha que
 * houvesse; não há, e a tela do player declara a ausência com o denominador em vez de
 * sumir com o bloco.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

/** Quantas mídias o acervo tem. Conferido a cada build; divergiu, o build cai. */
const MIDIAS_ESPERADAS = 529;

/**
 * O teto do que atravessa a fronteira para o cliente. É o orçamento deste plano dentro
 * do teto herdado de 1.600 KB de `out/_next/static/chunks`.
 */
export const TETO_DO_FIO = 100 * 1024;

/**
 * Categoria crua do CMS → o que a pessoa lê. **Esta tabela é o ÚNICO lugar onde essa
 * tradução mora.** `Record` completo de propósito: uma categoria nova no acervo sem
 * rótulo aqui vira erro em `montar()`, e não um chip escrito «podcasts» em inglês de
 * banco de dados no meio de uma tela em português.
 */
const ROTULOS: Record<string, string> = {
  podcasts: "Podcast",
  series: "Série",
  videos: "Vídeo",
  noticias: "Notícia",
  entrevista: "Entrevista",
  colunistas: "Coluna",
  playlists: "Playlist",
  "agenda-cultural": "Agenda cultural",
  acervos: "Acervo",
};

/**
 * O nome da FILEIRA DE SOBRA de cada categoria — a última passada de
 * `prateleiras.ts`, para o que nenhuma coleção e nenhum tema reuniu.
 *
 * «Outras séries» e não «Séries»: as coleções acima também são séries, e uma
 * fileira chamada «Séries» ao lado delas prometeria o conjunto inteiro. O plural
 * e o gênero são escritos aqui porque português não os deriva de `ROTULOS`.
 */
const ROTULOS_DO_RESTO: Record<string, string> = {
  podcasts: "Outros podcasts",
  series: "Outras séries",
  videos: "Outros vídeos",
  noticias: "Outras notícias",
  entrevista: "Outras entrevistas",
  colunistas: "Outras colunas",
  playlists: "Outras playlists",
  "agenda-cultural": "Outras da agenda cultural",
  acervos: "Outros acervos",
};

/** O item do catálogo, nomeado e completo. É a verdade de build. */
export interface ItemDoPlay {
  id: string;
  slug: string;
  titulo: string;
  rota: string;
  categoria: string;
  rotuloCategoria: string;
  resumo: string;
  imagem?: string;
  creditoImagem?: string;
  imagemAlt?: string;
  /** A data de publicação como número `AAAAMMDD` — comparável por `<`, sem fuso. */
  dia: number;
  publicadoEm: string;
  linguagens: string[];
  temas: string[];
  procedencia: string;
  fonte?: string;
  acessibilidade: Acessibilidade;
  declaraAcessibilidade: boolean;
}

/** Uma mídia ligada a um evento por `fala_sobre` — a única ponte real do acervo. */
export interface PonteDaMidia {
  slug: string;
  titulo: string;
  rota: string;
  classe: string;
  motivo?: string;
}

/** A cobertura MEDIDA da ponte entre mídia e evento. */
export interface PonteComEvento {
  arestas: number;
  midiasDistintas: number;
  eventosAlcancados: number;
  deQuantas: number;
  declaracao: string;
}

// ---------------------------------------------------------------------------
// A montagem, memoizada — roda uma vez por processo de build
// ---------------------------------------------------------------------------

interface Montado {
  itens: ItemDoPlay[];
  porSlugDoPlay: Map<string, ItemDoPlay>;
  categorias: CategoriaContada[];
  dimensoes: DimensaoContada[];
  ponte: PonteComEvento;
  /** eventoId → as mídias que falam dele. A leitura útil é a INVERSA das arestas. */
  midiasPorEvento: Map<string, PonteDaMidia[]>;
  /** slug de mídia → os eventos de que ela fala. */
  eventosPorMidia: Map<string, PonteDaMidia[]>;
  fio: CatalogoNoFio;
}

let memo: Montado | null = null;

function quebrar(mensagem: string): never {
  throw new Error(`play.ts: ${mensagem}`);
}

function diaDe(publicadoEm: string): number {
  // Os 10 primeiros caracteres de `2024-11-13T14:00:00.000-03:00`. Sem `new Date()`:
  // construir um Date aqui devolveria o dia do fuso de quem roda o build, e o HTML
  // exportado passaria a afirmar uma data que a fonte não escreveu.
  const iso = publicadoEm.slice(0, 10);
  const n = Number(iso.replace(/-/g, ""));
  if (!Number.isInteger(n) || n < 19000101 || n > 21001231) {
    quebrar(`data de publicação irreconhecível: ${JSON.stringify(publicadoEm)}`);
  }
  return n;
}

function montar(): Montado {
  const slugs = slugsPorTipo("midia");
  const entidades: Entidade[] = [];
  for (const slug of slugs) {
    const e = porSlug("midia", slug);
    if (e) entidades.push(e);
  }

  if (entidades.length !== MIDIAS_ESPERADAS) {
    quebrar(
      `o catálogo montou ${entidades.length} mídias e o acervo declara ${MIDIAS_ESPERADAS}. ` +
        `A tela do Play AFIRMA o número na primeira linha; corrija a afirmação junto com a ` +
        `medida em vez de relaxar esta conferência.`,
    );
  }

  // --- os itens nomeados -----------------------------------------------------
  const itens: ItemDoPlay[] = entidades.map((e) => {
    const categoria = String(e.extra?.categoria ?? "");
    const rotulo = ROTULOS[categoria];
    if (!rotulo) {
      quebrar(
        `a mídia «${e.slug}» tem categoria «${categoria}», que não tem rótulo em português ` +
          `na tabela ROTULOS. Escreva o rótulo — a tela não pode mostrar a chave crua do CMS.`,
      );
    }
    const publicadoEm = String(e.extra?.publicadoEm ?? "");
    return {
      id: e.id,
      slug: e.slug,
      titulo: e.titulo,
      rota: `/play/${e.slug}/`,
      categoria,
      rotuloCategoria: rotulo,
      resumo: e.resumo ?? "",
      imagem: e.imagem,
      creditoImagem: e.creditoImagem,
      imagemAlt: typeof e.extra?.imagemAlt === "string" ? e.extra.imagemAlt : undefined,
      dia: diaDe(publicadoEm),
      publicadoEm,
      linguagens: e.linguagens,
      temas: e.temas,
      procedencia: e.procedencia,
      fonte: e.fonte,
      acessibilidade: e.acessibilidade,
      declaraAcessibilidade: e.declaraAcessibilidade,
    };
  });

  // Ordenação DETERMINÍSTICA, nunca `localeCompare`: publicação decrescente, desempate
  // pelo slug, que é único nas 529 e portanto uma chave total.
  itens.sort((a, b) => (b.dia - a.dia) || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

  const porSlugDoPlay = new Map(itens.map((i) => [i.slug, i]));
  if (porSlugDoPlay.size !== itens.length) {
    quebrar(`há slug repetido entre as ${itens.length} mídias — o slug é a chave do catálogo`);
  }

  // --- as categorias, CONTADAS -----------------------------------------------
  const contagem = new Map<string, number>();
  for (const i of itens) contagem.set(i.categoria, (contagem.get(i.categoria) ?? 0) + 1);

  const categorias: CategoriaContada[] = [...contagem]
    .map(([valor, n]) => ({ valor, rotulo: ROTULOS[valor], n }))
    .sort((a, b) => b.n - a.n || (a.valor < b.valor ? -1 : 1));

  const soma = categorias.reduce((a, c) => a + c.n, 0);
  if (soma !== itens.length) {
    quebrar(`as categorias somam ${soma} e o catálogo tem ${itens.length} — nenhum item pode sumir`);
  }

  // --- as 8 dimensões, CONTADAS pela chave do tipo ----------------------------
  const dimensoes: DimensaoContada[] = DIMENSOES.map((campo) => {
    const n = itens.filter((i) => i.acessibilidade[campo]).length;
    return {
      campo,
      rotulo: ROTULOS_DE_DIMENSAO[campo],
      n,
      de: itens.length,
      // A dimensão só é «sustentada» se o acervo tem o que mostrar. Zero recorta nada, e
      // oferecê-la como filtro equivalente às outras prometeria um acervo inexistente.
      sustentada: n > 0,
    };
  });

  // --- a ponte com evento, MEDIDA --------------------------------------------
  const midiasPorEvento = new Map<string, PonteDaMidia[]>();
  const eventosPorMidia = new Map<string, PonteDaMidia[]>();
  let arestas = 0;
  const midiasComPonte = new Set<string>();
  const eventosAlcancados = new Set<string>();

  for (const item of itens) {
    const destinos: PonteDaMidia[] = [];
    for (const v of vizinhos(item.id, "fala_sobre")) {
      if (v.entidade.classe !== "evento") continue;
      arestas += 1;
      midiasComPonte.add(item.id);
      eventosAlcancados.add(v.entidade.id);

      destinos.push({
        slug: v.entidade.slug,
        titulo: v.entidade.titulo,
        rota: `/evento/${v.entidade.slug}/`,
        classe: "evento",
        motivo: v.aresta.motivo,
      });

      const lista = midiasPorEvento.get(v.entidade.id) ?? [];
      lista.push({
        slug: item.slug,
        titulo: item.titulo,
        rota: item.rota,
        classe: "midia",
        motivo: v.aresta.motivo,
      });
      midiasPorEvento.set(v.entidade.id, lista);
    }
    if (destinos.length) eventosPorMidia.set(item.slug, destinos);
  }

  // Ordem estável dos dois lados — sem isso a mesma página muda de ordem entre builds.
  for (const lista of midiasPorEvento.values()) lista.sort((a, b) => (a.slug < b.slug ? -1 : 1));
  for (const lista of eventosPorMidia.values()) lista.sort((a, b) => (a.slug < b.slug ? -1 : 1));

  const ponte: PonteComEvento = {
    arestas,
    midiasDistintas: midiasComPonte.size,
    eventosAlcancados: eventosAlcancados.size,
    deQuantas: itens.length,
    declaracao:
      `${midiasComPonte.size} das ${itens.length} mídias do acervo declaram ligação com um ` +
      `evento — são ${arestas} ligações, alcançando ${eventosAlcancados.size} eventos. ` +
      `A ligação é a relação «fala sobre», a única que o acervo registra entre mídia e ` +
      `evento; «semelhante a» liga mídia a mídia e nunca chega a um evento. ` +
      `As outras ${itens.length - midiasComPonte.size} não têm essa ligação declarada, e ` +
      `nós não a inventamos: afirmar que um vídeo fala de um evento quando a fonte não ` +
      `disse seria inventar um fato sobre o acervo.`,
  };

  const fio = fioDeItens(itens);

  return { itens, porSlugDoPlay, categorias, dimensoes, ponte, midiasPorEvento, eventosPorMidia, fio };
}

/**
 * Monta o DTO que atravessa a fronteira RSC para um CONJUNTO de itens. Extraída
 * de `montar()` na reformulação de 2026-08, quando /play passou a servir só o
 * recorte de streaming: o mesmo empacotamento serve o catálogo inteiro e
 * qualquer recorte, com categorias re-contadas sobre o conjunto recebido.
 *
 * EXPORTADA em 23/08 para o Cast (`cast.ts`): o recorte de podcast atravessa a
 * mesma fronteira, com o mesmo formato posicional e o mesmo teto. Uma segunda
 * cópia deste empacotamento seria a divergência que `play-wire.ts` existe para
 * impedir — o produtor do fio tem de ser um só.
 */
export function fioDeItens(itens: ItemDoPlay[]): CatalogoNoFio {
  const contagem = new Map<string, number>();
  for (const i of itens) contagem.set(i.categoria, (contagem.get(i.categoria) ?? 0) + 1);
  const categorias: CategoriaContada[] = [...contagem]
    .map(([valor, n]) => ({ valor, rotulo: ROTULOS[valor], n }))
    .sort((a, b) => b.n - a.n || (a.valor < b.valor ? -1 : 1));

  // ---- as fileiras da vitrine, e a conferência de que elas são uma PARTIÇÃO --
  const posicao = new Map(itens.map((item, i) => [item.slug, i]));
  const montadas = prateleirasDe(itens, (categoria) => {
    const rotulo = ROTULOS_DO_RESTO[categoria];
    if (!rotulo) {
      quebrar(
        `a categoria «${categoria}» não tem rótulo de fileira de sobra em ROTULOS_DO_RESTO. ` +
          `Escreva o rótulo — a fileira não pode mostrar a chave crua do CMS.`,
      );
    }
    return rotulo;
  });
  const prateleiras = montadas.map((p) => ({
    valor: p.valor,
    rotulo: p.rotulo,
    itens: p.itens.map((item) => posicao.get(item.slug)!),
    rosto: posicao.get(rostoDa(p).slug)!,
  }));

  const emFileiras = prateleiras.reduce((soma, p) => soma + p.itens.length, 0);
  const distintos = new Set(prateleiras.flatMap((p) => p.itens)).size;
  if (emFileiras !== itens.length || distintos !== itens.length) {
    quebrar(
      `as fileiras somam ${emFileiras} (${distintos} distintas) e o conjunto tem ${itens.length}. ` +
        `A vitrine é uma PARTIÇÃO: nenhum item pode sumir entre a derivação e a tela, e ` +
        `nenhum pode aparecer em duas fileiras.`,
    );
  }
  if (new Set(prateleiras.map((p) => p.valor)).size !== prateleiras.length) {
    quebrar(`duas fileiras dividem a mesma chave — a chave é o que o recorte guarda no estado`);
  }

  const vocabularioDeLinguagens = [...new Set(itens.flatMap((i) => i.linguagens))].sort();
  const indiceDeLinguagem = new Map(vocabularioDeLinguagens.map((l, i) => [l, i]));
  const indiceDeCategoria = new Map(categorias.map((c, i) => [c.valor, i]));

  const noFio: ItemNoFio[] = itens.map((i) => {
    const mascara = comprimirAcessibilidade(i.acessibilidade);
    return [
      i.slug,
      i.titulo,
      indiceDeCategoria.get(i.categoria)!,
      i.imagem ? i.imagem.replace(/^\/acervo\//, "") : "",
      i.creditoImagem ?? "",
      i.dia,
      i.linguagens.map((l) => indiceDeLinguagem.get(l)!),
      mascara,
    ] as const;
  });

  const semFio = { itens: noFio, categorias, prateleiras, linguagens: vocabularioDeLinguagens };
  const bytes = JSON.stringify(semFio).length;

  if (bytes > TETO_DO_FIO) {
    quebrar(
      `o catálogo no fio ficou com ${bytes} bytes, acima do teto declarado de ${TETO_DO_FIO}. ` +
        `Corte CAMPO, nunca item: nenhuma mídia pode sumir para caber no orçamento.`,
    );
  }

  return { ...semFio, total: itens.length, bytes, teto: TETO_DO_FIO };
}

/**
 * O RECORTE DE STREAMING (reformulação 2026-08, decisão do cliente): /play passou
 * a mostrar só o que se ASSISTE — vídeo, série e playlist (113 mídias medidas).
 * Podcast ganhou porta própria em /cast e o editorial em /noticias; o catálogo
 * unificado de D-92 continua existindo por inteiro em `catalogoDoPlay()` e nas
 * 529 rotas do player — o que mudou foi a vitrine, não o acervo.
 */
const CATEGORIAS_DE_STREAMING = ["videos", "series", "playlists"] as const;

let streamingMemo: ItemDoPlay[] | null = null;

/**
 * O recorte de streaming, filtrado UMA vez. Os três consumidores — o catálogo no fio, as
 * dimensões e o destaque — leem a mesma lista: três filtros soltos divergiriam na
 * primeira vez que alguém acrescentasse uma categoria de streaming e esquecesse um deles.
 */
function itensDeStreaming(): ItemDoPlay[] {
  if (!streamingMemo) {
    streamingMemo = estado().itens.filter((i) =>
      (CATEGORIAS_DE_STREAMING as readonly string[]).includes(i.categoria),
    );
  }
  return streamingMemo;
}

let fioStreamingMemo: CatalogoNoFio | null = null;

export function catalogoNoFioStreaming(): CatalogoNoFio {
  if (!fioStreamingMemo) fioStreamingMemo = fioDeItens(itensDeStreaming());
  return fioStreamingMemo;
}

/**
 * A PEÇA DE DESTAQUE da vitrine: a mídia MAIS RECENTE do recorte de streaming.
 *
 * A escolha é ordem, não curadoria — `montar()` já ordena por publicação decrescente com
 * desempate pelo slug, então o primeiro item é determinístico e o mesmo em todo build.
 * Uma «seleção editorial» aqui seria uma afirmação sobre o acervo que ninguém fez, e é a
 * mesma razão por que a vitrine não tem «Top 10» nem «em alta»: não há dado de uso.
 *
 * O `resumo` viaja aqui e NÃO viaja no catálogo, e a exceção é aritmética: um resumo custa
 * ~200 bytes contra os ~52 KB que os 113 custariam. Ver `DestaqueNoFio` em `play-wire.ts`.
 */
export function destaqueDoStreaming(): DestaqueNoFio {
  const primeiro = itensDeStreaming()[0];
  if (!primeiro) {
    quebrar(
      `o recorte de streaming ficou vazio e a vitrine de /play abre com uma peça de ` +
        `destaque. Corrija o recorte em CATEGORIAS_DE_STREAMING em vez de deixar a tela ` +
        `abrir sem abertura.`,
    );
  }
  return {
    slug: primeiro.slug,
    titulo: primeiro.titulo,
    rota: primeiro.rota,
    rotuloCategoria: primeiro.rotuloCategoria,
    resumo: primeiro.resumo,
    imagem: primeiro.imagem,
    creditoImagem: primeiro.creditoImagem,
    dia: primeiro.dia,
  };
}

/** As 8 dimensões contadas sobre um conjunto — o denominador acompanha o recorte. */
export function dimensoesDe(itens: readonly ItemDoPlay[]): DimensaoContada[] {
  return DIMENSOES.map((campo) => {
    const n = itens.filter((i) => i.acessibilidade[campo]).length;
    return { campo, rotulo: ROTULOS_DE_DIMENSAO[campo], n, de: itens.length, sustentada: n > 0 };
  });
}

/** As dimensões do recorte de streaming, para a tela do /play. */
export function dimensoesDoStreaming(): DimensaoContada[] {
  return dimensoesDe(itensDeStreaming());
}

function estado(): Montado {
  if (!memo) memo = montar();
  return memo;
}

// ---------------------------------------------------------------------------
// A superfície pública
// ---------------------------------------------------------------------------

/**
 * As 529, nomeadas e completas — com o resumo INTEIRO. É a verdade de build: alimenta as
 * 529 rotas do player, que são de servidor e não pagam chunk. **Não atravessa a fronteira
 * do cliente**; para isso existe `catalogoNoFio()`.
 */
export function catalogoDoPlay(): ItemDoPlay[] {
  return estado().itens;
}

/** Resolve o que o `localStorage` guardou sem varrer o catálogo no cliente. */
export function itemDoPlay(slug: string): ItemDoPlay | undefined {
  return estado().porSlugDoPlay.get(slug);
}

/** As categorias PRESENTES no acervo, contadas e ordenadas. Nunca lista escrita à mão. */
export const CATEGORIAS: readonly CategoriaContada[] = estado().categorias;

/** As 8 dimensões contadas sobre as 529 — o que sustenta o filtro honesto da tela 19. */
export const ACESSIBILIDADE_DAS_MIDIAS: readonly DimensaoContada[] = estado().dimensoes;

/** A cobertura medida da ponte entre mídia e evento (D-92, D-90). */
export const PONTE_COM_EVENTO: PonteComEvento = estado().ponte;

/**
 * As mídias que falam de um evento. **A leitura útil é a inversa das arestas**: elas
 * partem da mídia e chegam ao evento, então é a página do evento que pode oferecer «não
 * pode ir? veja isto» com lastro.
 */
export function vejaIsto(eventoId: string): PonteDaMidia[] {
  return estado().midiasPorEvento.get(eventoId) ?? [];
}

/** Os eventos de que ESTA mídia fala. Vazio para 515 das 529, e o vazio é declarado. */
export function eventosDaMidia(slug: string): PonteDaMidia[] {
  return estado().eventosPorMidia.get(slug) ?? [];
}

/** O catálogo como ele atravessa a fronteira RSC. É o que a página passa ao componente. */
export function catalogoNoFio(): CatalogoNoFio {
  return estado().fio;
}

/**
 * A COLEÇÃO A QUE UMA MÍDIA PERTENCE, com as irmãs dela — o que a página do item mostra
 * como «Episódios» numa série e como a listagem do programa num podcast.
 *
 * ELA NÃO É UMA CONSULTA NOVA AO GRAFO. É a mesma partição que a vitrine desenha
 * (`prateleirasDe`, em `prateleiras.ts`), lida do outro lado: em vez de «quais itens tem
 * esta fileira», «de que fileira este item é». Reusar a partição é o que garante que a
 * página do episódio e a prateleira da vitrine digam a MESMA coisa — duas montagens
 * separadas divergiriam na primeira vez que o agrupamento mudasse.
 *
 * A ORIGEM VIAJA JUNTO, e a tela muda de rótulo com ela. Quando a fileira nasceu do nome
 * repetido no título (`colecao`), as irmãs são episódios de um mesmo programa e o cabeçalho
 * pode dizer isso. Quando ela nasceu do tema ou da categoria, elas são só mídias que
 * dividem um assunto — chamar aquilo de «episódios» seria afirmar uma série que o acervo
 * não declara.
 *
 * A ORDEM É A MAIS RECENTE PRIMEIRO, que é a ordem do catálogo (`montar()` ordena por
 * publicação decrescente) e a ordem em que um programa de áudio se lê.
 */
export interface ColecaoDaMidia {
  rotulo: string;
  origem: "colecao" | "tema" | "categoria";
  /** As OUTRAS da fileira. Sem a própria — ela já é o assunto da página. */
  irmas: ItemDoPlay[];
  /** O tamanho da fileira INTEIRA, contando esta. É o número que o cabeçalho declara. */
  total: number;
}

let colecoesMemo: Map<string, ColecaoDaMidia> | null = null;

function colecoes(): Map<string, ColecaoDaMidia> {
  if (colecoesMemo) return colecoesMemo;
  const itens = estado().itens;
  const montadas = prateleirasDe(itens, (categoria) => ROTULOS_DO_RESTO[categoria] ?? categoria);
  const mapa = new Map<string, ColecaoDaMidia>();
  for (const p of montadas) {
    for (const item of p.itens) {
      mapa.set(item.slug, {
        rotulo: p.rotulo,
        origem: p.origem,
        irmas: p.itens.filter((o) => o.slug !== item.slug),
        total: p.itens.length,
      });
    }
  }
  colecoesMemo = mapa;
  return mapa;
}

export function colecaoDaMidia(slug: string): ColecaoDaMidia | undefined {
  return colecoes().get(slug);
}

/**
 * As mídias SEMELHANTES a esta, pela aresta `semelhante_a` do grafo.
 *
 * POR QUE ELA VOLTOU. A primeira versão desta rota escreveu, no cabeçalho, «nada de lista
 * de semelhantes»: o DTO de 529 páginas paga HTML, e a lista era peso sem pedido. O pedido
 * veio em 23/08 — a página do item tinha de sugerir para onde ir depois, como a referência
 * faz. O custo foi medido antes de entrar: são no máximo {@link TETO_DE_SEMELHANTES}
 * entradas de ~120 bytes, ou seja menos de 1 KB por página.
 *
 * O QUE ELA NÃO FAZ: inventar semelhança. `semelhante_a` é aresta DERIVADA e declarada no
 * grafo, com motivo próprio — não é «porque você assistiu», que dependeria de um dado de
 * uso que este acervo não tem. Mídia que não tem a aresta devolve lista vazia, e a tela
 * simplesmente não desenha a seção em vez de encher com o que estiver à mão.
 */
export const TETO_DE_SEMELHANTES = 12;

export function semelhantesDaMidia(id: string): ItemDoPlay[] {
  const porId = new Map(estado().itens.map((i) => [i.id, i]));
  const saida: ItemDoPlay[] = [];
  for (const v of vizinhos(id, "semelhante_a")) {
    const item = porId.get(v.entidade.id);
    if (item) saida.push(item);
    if (saida.length === TETO_DE_SEMELHANTES) break;
  }
  return saida;
}

/*
 * O QUE FOI CORTADO DO FIO, E POR QUÊ.
 *
 * Isto era uma constante exportada, impressa num parágrafo ao pé de /play. O parágrafo
 * saiu da tela em 23/08 — a tela não se explica —, e a decisão continua aqui, que é onde
 * ela mora.
 *
 * O `resumo` das 529 não viaja no catálogo. Medido: o fio mede 79 KB sem ele e 131 KB
 * com ele, contra um teto de 100 KB. Sobrariam ~59 bytes por item, ou seja um resumo
 * cortado em ~55 caracteres — e a mediana dos resumos do acervo é 111. Um resumo cortado
 * ao meio não é um resumo mais curto: é uma frase interrompida, que promete uma coisa e
 * entrega outra.
 *
 * Então o corte é de CAMPO e não de item, como o orçamento manda: o resumo INTEIRO
 * aparece na rota da própria mídia — que é de servidor, não paga chunk, e é onde alguém
 * que quer saber do que se trata já está indo. No catálogo, quem faz o reconhecimento é
 * o título, a capa e a categoria.
 */

/** As 529 são todas do Itaú Cultural — a procedência é uma constante, não um campo. */
export const PROCEDENCIA_DAS_MIDIAS = {
  valor: "ic",
  rotulo: "Itaú Cultural",
  n: MIDIAS_ESPERADAS,
} as const;

/**
 * O protótipo NÃO CARREGA ARQUIVO DE MÍDIA NENHUM, e a tela diz isso em vez de esconder.
 *
 * Duas coisas diferentes, e as duas verdadeiras: (1) o acervo carregado traz a ficha e a
 * capa, não o arquivo de áudio ou vídeo — ele não existe nestes dados; (2) `fonte` aponta
 * para itaucultural.org.br, e buscar de lá quebraria a promessa medida de ZERO requisição
 * externa, que vale para o protótipo inteiro desde a fase 2.
 *
 * `fonte` aparece como LINK que a pessoa clica. Um link que a pessoa clica não é uma
 * requisição que o protótipo faz, e a diferença é exatamente o que o gate mede.
 */
export const SEM_ARQUIVO = {
  titulo: "Por que não há player de verdade aqui",
  acervo:
    "O acervo carregado neste protótipo traz a ficha e a capa de cada mídia — o arquivo de " +
    "áudio ou vídeo não faz parte dele.",
  rede:
    "E nada é buscado do site do Itaú Cultural: este protótipo não faz nenhuma requisição " +
    "para fora do servidor local, e isso é medido a cada verificação. O endereço da fonte " +
    "está aqui como link para quem quiser ir ver — clicar num link é uma escolha de quem " +
    "usa, não uma requisição que o protótipo faz por conta própria.",
} as const;
