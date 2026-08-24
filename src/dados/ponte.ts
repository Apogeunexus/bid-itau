/**
 * ponte.ts — a travessia que liga a Enciclopédia à agenda, escrita uma vez e servida às
 * duas telas que a materializam (DESC-08, D-40, D-41).
 *
 * DESC-08 não é tela, é PROPRIEDADE: ela só existe se a página do artista e a do evento
 * se apontarem mutuamente, e se a conexão aparecer como RELAÇÃO NOMEADA em vez de link
 * solto. Um "ver mais" azul navega corretamente e mesmo assim falha o requisito — o que
 * se pede é que a tela diga «atua como artista em» e «quem atua, e com que papel».
 *
 * Por isso este arquivo devolve GRUPOS, e não uma lista de vizinhos: o grupo carrega o
 * rótulo em português, o sentido da aresta e a frase que declara a ausência quando não
 * há nada. É o grupo, e não o item, que nomeia a relação.
 *
 * D-41 / DADO-03 — O PAPEL VEM DA ARESTA, E DE MAIS LUGAR NENHUM. `atua_em` é a única
 * relação que carrega `papel`, e é dela que sai «artista», «participante», «colunista».
 * Ler papel de um campo do agente reintroduziria exatamente o erro de ontologia que a
 * proposta critica — papel não é classe, é vínculo (T-02-14).
 *
 * O QUE FOI MEDIDO NO GRAFO E DECIDE O DESENHO DAQUI:
 *
 * - `atua_em` pessoa→evento 312 · coletivo→evento 114 · `realiza` instituicao→evento 527.
 *   205 agentes têm ao menos um evento, 67 eventos têm ao menos um agente. A ponte é real
 *   e funciona nos dois sentidos.
 * - **Agente e data nunca coexistem.** Dos 129 eventos com ocorrência datada, ZERO têm
 *   aresta de agente; dos 67 eventos com agente, ZERO têm ocorrência datada. Os eventos
 *   com elenco vêm da Enciclopédia e são históricos; os datados vêm do CMS e chegam com
 *   `extra.agentes` literalmente vazio nos 100 registros. Não autoramos aresta `atua_em`
 *   para cruzar os dois: afirmar que a pessoa X participou da montagem Y seria uma
 *   alegação factual falsa sobre gente real, diferente da trilha editorial, que é
 *   opinião assinada. As duas telas são a mesma rota e o mesmo componente — o que muda é
 *   qual grupo tem conteúdo, e cada grupo vazio se declara.
 * - **Nenhum agente do acervo carregado tem dois papéis distintos.** `papeisDe` devolve a
 *   lista que a aresta trouxer, sem inflar e sem inventar o segundo papel.
 * - **Não existe nenhuma aresta ligando obra a pessoa.** `obra` só tem `pertence_a` para
 *   linguagem, `semelhante_a` para obra e `situado_em`. O grupo de obras existe assim
 *   mesmo e declara que o acervo não publica a autoria como vínculo.
 *
 * GRUPO VAZIO RENDERIZA A FRASE, NÃO DESAPARECE. Bloco que some faz parecer que a
 * categoria não existe no produto; bloco declarado prova que ela existe e que o dado é
 * que não veio. É a diferença entre um protótipo que esconde o buraco e um que o mostra.
 *
 * DP-F continua valendo: este arquivo importa `grafo.ts` e por isso roda SÓ NO BUILD.
 * Nenhum componente `"use client"` pode importá-lo.
 */

import { porId, vizinhos } from "./grafo";
import { motivoDaAresta } from "./motivo";
import { rotaDaEntidade } from "./rotas";
import type { MotivoCartao } from "./cartao";
import type { Aresta, ClasseEntidade, Coordenada, Entidade, Relacao } from "./tipos";

export { rotaDaEntidade } from "./rotas";

// ---------------------------------------------------------------------------
// Contrato
// ---------------------------------------------------------------------------

/**
 * De que lado da aresta está a entidade em foco.
 *
 * `sai` — a entidade é a ponta `de` (a pessoa atua NO evento).
 * `chega` — a entidade é a ponta `para` (o evento recebe quem atua).
 * `ambos` — relação simétrica (`semelhante_a`, `dialoga_com`), onde filtrar por direção
 *           esconderia metade dos vizinhos sem nenhum ganho de verdade.
 *
 * DESVIO DECLARADO: o plano previa só `"sai" | "chega"`. O terceiro valor existe porque
 * duas das relações do vocabulário são simétricas por definição, e carimbá-las de `sai`
 * afirmaria uma direção que a relação não tem.
 */
export type SentidoVinculo = "sai" | "chega" | "ambos";

/** Uma ponta resolvida do vínculo, pronta para virar linha navegável. */
export interface ItemVinculo {
  id: string;
  classe: ClasseEntidade;
  titulo: string;
  slug: string;
  /**
   * O papel EXATAMENTE como a aresta o gravou (D-41). Ausente quando a aresta não traz —
   * e nesse caso a tela mostra só a relação, nunca um papel inferido.
   */
  papel?: string;
  /** Texto da aresta, com a procedência do texto viajando junto (DP-A, T-02-05). */
  motivo: MotivoCartao;
  /** Rota existente para o item, ou `null` quando a classe não tem rota nesta fase. */
  rota: string | null;
  /** Só em espaço e território. Sempre derivada, e o método é para ser dito (D-19/D-20). */
  coordenada?: Coordenada;
}

/**
 * Um bloco de relação nomeada. É esta estrutura, e não o item, que cumpre D-40: o
 * `rotulo` é a relação escrita em português, e é ele que vira o cabeçalho na tela.
 */
export interface GrupoVinculo {
  /** Identificador estável do bloco. As telas escolhem grupos por esta chave. */
  chave: string;
  /**
   * A relação do vocabulário controlado. `null` só no grupo de obras, que é recortado por
   * CLASSE do vizinho e não por relação — e dizer que ele é `pertence_a` seria mentir
   * sobre o vocabulário.
   */
  relacao: Relacao | null;
  rotulo: string;
  sentido: SentidoVinculo;
  entidades: ItemVinculo[];
  /** Quantos existem no grafo, antes do corte de exibição. */
  total: number;
  /** Teto de itens exibidos (T-02-17). */
  limite: number;
  /**
   * A frase que a tela mostra quando `entidades` está vazio. Nomeia o que faltou e por
   * quê, na linguagem do acervo. Nunca é um traço, nunca é "nenhum resultado".
   */
  fraseDeAusencia: string;
}

/** Um papel exercido pelo agente, com quantas arestas o sustentam. */
export interface PapelDoAgente {
  papel: string;
  contagem: number;
}

// ---------------------------------------------------------------------------
// Especificação dos grupos
// ---------------------------------------------------------------------------

/** Teto padrão de itens por bloco. O evento de demonstração tem 37 arestas `realiza`. */
const LIMITE_PADRAO = 12;

const AGENTES: ClasseEntidade[] = ["pessoa", "coletivo", "instituicao"];

type Foco = "agente" | "evento" | "qualquer";

interface EspecificacaoGrupo {
  chave: string;
  relacao: Relacao | null;
  sentido: SentidoVinculo;
  foco: Foco;
  rotulo: string;
  /** Quando todos os itens compartilham o mesmo papel, o rótulo o incorpora (D-40). */
  rotuloComPapel?: (papel: string) => string;
  fraseDeAusencia: string;
  limite?: number;
  /** Recorte extra por classe do vizinho, para o grupo de obras. */
  classesDoVizinho?: ClasseEntidade[];
}

/**
 * AS FRASES DE AUSÊNCIA SÃO CONTEÚDO DE PRODUTO, NÃO MENSAGEM DE ERRO.
 *
 * A maioria das páginas de evento datado vai mostrar a frase de `quem-atua`, porque os
 * 100 eventos do CMS chegam com `extra.agentes` vazio. Ela precisa dizer três coisas ao
 * mesmo tempo: que a categoria existe no produto, que o dado é que não veio, e que nós
 * não completamos o que o acervo não publicou.
 */
const ESPECIFICACOES: EspecificacaoGrupo[] = [
  // ----- do agente para o acontecimento -------------------------------------
  {
    chave: "atua-em",
    relacao: "atua_em",
    sentido: "sai",
    foco: "agente",
    rotulo: "Atua em",
    rotuloComPapel: (papel) => `Atua como ${papel} em`,
    fraseDeAusencia:
      "O acervo não liga esta entrada a nenhum evento pela ligação de atuação. " +
      "Sem essa ligação não sabemos — e não afirmamos — de que este agente participou.",
  },
  {
    chave: "realiza",
    relacao: "realiza",
    sentido: "sai",
    foco: "agente",
    rotulo: "Realiza",
    fraseDeAusencia:
      "O registro do Itaú Cultural não atribui a realização de nenhum evento a esta entrada.",
  },
  {
    chave: "obras",
    relacao: null,
    sentido: "ambos",
    foco: "agente",
    rotulo: "Obras",
    classesDoVizinho: ["obra"],
    fraseDeAusencia:
      "O acervo carregado não publica a autoria da obra como vínculo: não existe no acervo " +
      "nenhuma ligação ligando obra a pessoa ou coletivo. As obras estão lá, os agentes " +
      "também, e a ligação entre os dois é o que a fonte não declara. Ligar por semelhança " +
      "de nome inventaria autoria.",
  },

  // ----- do acontecimento para o agente -------------------------------------
  {
    chave: "quem-realiza",
    relacao: "realiza",
    sentido: "chega",
    foco: "evento",
    rotulo: "Quem realiza",
    fraseDeAusencia:
      "O registro do Itaú Cultural para este evento não nomeia instituição realizadora.",
  },
  {
    chave: "quem-atua",
    relacao: "atua_em",
    sentido: "chega",
    foco: "evento",
    rotulo: "Quem atua, e com que papel",
    fraseDeAusencia:
      "O registro do Itaú Cultural para este evento não declara elenco: não há no acervo " +
      "nenhuma pessoa ou coletivo ligado a ele. A ausência é do registro, não do palco — " +
      "alguém subiu, e quem foi é o que a fonte não publica. Não completamos essa lista, " +
      "porque escrever aqui um nome que o acervo não afirma seria inventar uma participação.",
  },

  // ----- onde ---------------------------------------------------------------
  {
    chave: "onde",
    relacao: "situado_em",
    sentido: "sai",
    foco: "qualquer",
    rotulo: "Onde",
    fraseDeAusencia:
      "O acervo não situa esta entrada em nenhum território ou espaço. " +
      "Os 100 eventos vindos do CMS chegam sem território nenhum, e isso é da fonte.",
  },

  // ----- a segunda travessia da ponte: o conteúdo editorial ------------------
  {
    chave: "aprofunda",
    relacao: "aprofunda",
    sentido: "chega",
    foco: "qualquer",
    rotulo: "Conteúdo que aprofunda isto",
    fraseDeAusencia:
      "Nenhuma matéria, vídeo ou publicação do acervo aponta para esta entrada.",
  },
  {
    chave: "contextualiza",
    relacao: "contextualiza",
    sentido: "chega",
    foco: "qualquer",
    rotulo: "Trilhas que passam por aqui",
    fraseDeAusencia: "Nenhuma trilha editorial passa por esta entrada.",
  },
  {
    chave: "fala-sobre",
    relacao: "fala_sobre",
    sentido: "chega",
    foco: "qualquer",
    rotulo: "Mídia que fala sobre isto",
    fraseDeAusencia:
      "Nenhuma mídia do acervo declara falar sobre esta entrada.",
  },

  // ----- com quem dialoga no grafo -----------------------------------------
  {
    chave: "semelhante",
    relacao: "semelhante_a",
    sentido: "ambos",
    foco: "qualquer",
    rotulo: "Próximos no acervo",
    limite: 8,
    fraseDeAusencia:
      "O acervo não aproxima esta entrada de nenhuma outra: ela não compartilha linguagem " +
      "nem tema com ninguém no acervo carregado.",
  },
  {
    chave: "dialoga",
    relacao: "dialoga_com",
    sentido: "ambos",
    foco: "qualquer",
    rotulo: "Dialoga com",
    limite: 8,
    fraseDeAusencia: "Nenhum diálogo declarado entre esta entrada e outra do acervo.",
  },
];

// ---------------------------------------------------------------------------
// Travessia
// ---------------------------------------------------------------------------

function aplicaAoFoco(spec: EspecificacaoGrupo, classe: ClasseEntidade): boolean {
  if (spec.foco === "qualquer") return true;
  if (spec.foco === "evento") return classe === "evento";
  return AGENTES.includes(classe);
}

function respeitaSentido(spec: EspecificacaoGrupo, aresta: Aresta, focoId: string): boolean {
  if (spec.sentido === "ambos") return true;
  return spec.sentido === "sai" ? aresta.de === focoId : aresta.para === focoId;
}

/**
 * A aresta vira item. As duas pontas passadas a `motivoDaAresta` são as pontas DA ARESTA,
 * na orientação em que ela foi gravada — nunca a orientação em que a travessia por acaso
 * a atravessou. `atua_em` é dirigida: dizer «o evento atua na pessoa» porque viemos do
 * outro lado seria falso.
 */
function paraItem(aresta: Aresta, vizinho: Entidade): ItemVinculo | null {
  const de = porId(aresta.de);
  const para = porId(aresta.para);
  if (!de || !para) return null;

  const item: ItemVinculo = {
    id: vizinho.id,
    classe: vizinho.classe,
    titulo: vizinho.titulo,
    slug: vizinho.slug,
    motivo: motivoDaAresta(aresta, de, para),
    rota: rotaDaEntidade(vizinho.classe, vizinho.slug),
  };

  // D-41: o papel é copiado da aresta, sem normalização e sem reserva.
  const papel = aresta.papel?.trim();
  if (papel) item.papel = papel;
  if (vizinho.coordenada) item.coordenada = vizinho.coordenada;

  return item;
}

function montarGrupo(spec: EspecificacaoGrupo, foco: Entidade): GrupoVinculo {
  const limite = spec.limite ?? LIMITE_PADRAO;
  const candidatos = spec.relacao ? vizinhos(foco.id, spec.relacao) : vizinhos(foco.id);

  const vistos = new Set<string>();
  const itens: ItemVinculo[] = [];

  for (const { aresta, entidade } of candidatos) {
    if (!respeitaSentido(spec, aresta, foco.id)) continue;
    if (spec.classesDoVizinho && !spec.classesDoVizinho.includes(entidade.classe)) continue;
    if (entidade.id === foco.id) continue;
    if (vistos.has(entidade.id)) continue;
    const item = paraItem(aresta, entidade);
    if (!item) continue;
    vistos.add(entidade.id);
    itens.push(item);
  }

  itens.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR") || a.id.localeCompare(b.id));

  const papeis = new Set(itens.map((i) => i.papel).filter(Boolean) as string[]);
  const rotulo =
    spec.rotuloComPapel && papeis.size === 1
      ? spec.rotuloComPapel([...papeis][0])
      : spec.rotulo;

  return {
    chave: spec.chave,
    relacao: spec.relacao,
    rotulo,
    sentido: spec.sentido,
    entidades: itens.slice(0, limite),
    total: itens.length,
    limite,
    fraseDeAusencia: spec.fraseDeAusencia,
  };
}

/**
 * Os grupos de vínculo de uma entidade, na ordem em que as telas os usam.
 *
 * Devolve SEMPRE todos os grupos aplicáveis à classe, inclusive os vazios: é a lista de
 * grupos que define o que a tela promete mostrar, e o grupo vazio carrega a frase que
 * explica por que não mostrou. Filtrar os vazios aqui seria esconder o buraco uma camada
 * antes da tela, que é o mesmo erro com endereço melhor.
 */
export function vinculosDe(entidadeId: string): GrupoVinculo[] {
  const foco = porId(entidadeId);
  if (!foco) return [];
  return ESPECIFICACOES.filter((spec) => aplicaAoFoco(spec, foco.classe)).map((spec) =>
    montarGrupo(spec, foco),
  );
}

/** Um grupo específico, pela chave. Açúcar para as telas, que montam bloco a bloco. */
export function grupoDeVinculo(
  entidadeId: string,
  chave: string,
): GrupoVinculo | undefined {
  return vinculosDe(entidadeId).find((g) => g.chave === chave);
}

/**
 * Os papéis distintos que o agente exerce, LIDOS DA ARESTA `atua_em` (D-41).
 *
 * `docs/telas.md` tela 14 fala em ver a mesma pessoa como artista aqui e curadora ali. No
 * acervo carregado isso não acontece: nenhum agente tem dois papéis distintos. Esta função
 * devolve o que a aresta trouxer — hoje, sempre um só — sem inflar a lista para a tela
 * parecer mais rica, e sem impedir que o segundo apareça quando a fonte o publicar.
 */
export function papeisDe(agenteId: string): PapelDoAgente[] {
  const contagem = new Map<string, number>();
  for (const { aresta } of vizinhos(agenteId, "atua_em")) {
    if (aresta.de !== agenteId) continue;
    const papel = aresta.papel?.trim();
    if (!papel) continue;
    contagem.set(papel, (contagem.get(papel) ?? 0) + 1);
  }
  return [...contagem]
    .map(([papel, n]) => ({ papel, contagem: n }))
    .sort((a, b) => b.contagem - a.contagem || a.papel.localeCompare(b.papel, "pt-BR"));
}
