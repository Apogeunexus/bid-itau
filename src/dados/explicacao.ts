/**
 * explicacao.ts — o dado de «Por que isto apareceu» (D-33, D-34).
 *
 * Esta é a tela que responde à pergunta do RFP sobre transparência da IA, e o que ela
 * mostra tem de ser o CAMINHO REAL: as arestas que a caminhada percorreu, com o motivo de
 * cada uma e a procedência de cada motivo. Uma reconstrução plausível feita depois seria
 * uma explicação bonita de uma decisão que ninguém tomou assim — que é exatamente a
 * opacidade que a tela existe para desmentir.
 *
 * TRÊS COISAS MORAM AQUI:
 *
 * 1. **A ponte id ↔ parâmetro de rota.** O id canônico é `evento:cms:13787`, e dois-pontos
 *    em nome de diretório sob export estático é frágil fora de macOS e Linux. O parâmetro é
 *    `{classe}_{slug}`. Verificado no grafo: nenhuma das 20 classes contém `_`, então
 *    dividir na PRIMEIRA ocorrência recupera classe e slug sem ambiguidade — e os slugs que
 *    contêm `_` continuam íntegros, porque só a primeira divisão importa.
 *
 * 2. **A coleta dos caminhos.** O caminho que trouxe o cartão vem pronto de `montarFeed`
 *    (`Cartao.caminho`) — é o mesmo objeto, não uma segunda busca que poderia dar outro
 *    resultado. Os caminhos das OUTRAS sementes do repertório vêm de `caminho()` de
 *    `grafo.ts`, que já traz a trava de concentrador. Medido: 0,4 ms por chamada, ~1 s para
 *    as 72 entidades × 3 personas. Não há busca em largura reescrita neste arquivo.
 *
 * 3. **Os critérios e de que caminho cada um depende.** É essa relação que permite a tela
 *    remover um critério e recalcular no cliente, sem refazer travessia nenhuma.
 *
 * T-02-06: `paramParaEntidade` resolve por CONSULTA INDEXADA ao grafo (`porSlug`), nunca
 * por concatenação de caminho de arquivo, e parâmetro desconhecido devolve `undefined` para
 * a página cair no estado vazio. Sob `output: "export"` uma exceção aqui derrubaria o build
 * inteiro por causa de um slug.
 */

import { expandir, resolverSalto } from "./caminhada";
import type { MotivoCartao, PassoCartao } from "./cartao";
import { cartaoDoFeed, IDS_DA_UNIAO } from "./feeds";
import { DISPOSICOES, type ResultadoPredicado } from "./disposicoes";
import { caminho, ocorrenciasDe, porId, porSlug, vizinhos } from "./grafo";
import { PERSONAS, personaPorId, PERSONA_PADRAO, type Persona } from "./personas";
import { ROTA_POR_CLASSE } from "./rotas";
import type { ClasseEntidade, Entidade, Passo, Procedencia } from "./tipos";

// ---------------------------------------------------------------------------
// 1 — id ↔ parâmetro de rota
// ---------------------------------------------------------------------------

/** `{classe}_{slug}`. Espelha o link que `cartao.tsx` já escreve no rodapé do cartão. */
export function idParaParam(entidade: Pick<Entidade, "classe" | "slug">): string {
  return `${entidade.classe}_${entidade.slug}`;
}

/**
 * A volta. Divide na PRIMEIRA `_` — classe nunca tem `_`, slug pode ter, e é por isso que
 * a divisão é pela primeira e não pela última.
 */
export function paramParaEntidade(param: string): Entidade | undefined {
  const corte = param.indexOf("_");
  if (corte <= 0) return undefined;
  const classe = param.slice(0, corte) as ClasseEntidade;
  const slug = param.slice(corte + 1);
  if (!slug) return undefined;
  return porSlug(classe, slug);
}

/**
 * Injetividade, verificada NO BUILD sobre a união que a rota vai exportar.
 *
 * Dois ids diferentes que produzissem o mesmo parâmetro dariam uma página só para dois
 * itens, e a explicação de um passaria pela do outro — mentira de procedência com cara de
 * bug de roteamento. Falha aqui derruba a geração, que é a falha visível correta.
 */
function verificarInjetividade(ids: readonly string[]): void {
  const porParam = new Map<string, string>();
  for (const id of ids) {
    const entidade = porId(id);
    if (!entidade) continue;
    const param = idParaParam(entidade);
    const anterior = porParam.get(param);
    if (anterior && anterior !== id) {
      throw new Error(
        `D-33: o parâmetro de rota «${param}» é produzido por dois ids diferentes ` +
          `(«${anterior}» e «${id}»). Uma página serviria os dois e a explicação de um ` +
          `passaria pela do outro.`,
      );
    }
    porParam.set(param, id);
  }
}

/** Os parâmetros de rota que a explicação precisa exportar, já verificados. */
export const PARAMS_DA_UNIAO: string[] = (() => {
  verificarInjetividade(IDS_DA_UNIAO);
  return IDS_DA_UNIAO.map((id) => porId(id))
    .filter((e): e is Entidade => Boolean(e))
    .map(idParaParam)
    .sort();
})();

// ---------------------------------------------------------------------------
// 2 — critérios e caminhos
// ---------------------------------------------------------------------------

/**
 * `fora-da-caminhada` é o quarto tipo, e existe pelo mesmo motivo que `sem-aresta` existe
 * em `cartao.ts`: o cartão de serendipidade é escolhido FORA do alcance da caminhada por
 * definição (D-30), e a persona que não alcança um item também não tem semente nem
 * linguagem que o sustente. Carimbar esses casos de «semente» afirmaria um vínculo com o
 * repertório que o grafo não tem.
 */
export type TipoCriterio = "semente" | "linguagem" | "disposicao" | "fora-da-caminhada";

export interface Criterio {
  id: string;
  rotulo: string;
  tipo: TipoCriterio;
  /** Uma linha do que este critério é, em português. Vai para a tela. */
  detalhe: string;
}

export interface CaminhoExplicado {
  sementeId: string;
  sementeTitulo: string;
  sementeClasse: ClasseEntidade;
  passos: PassoCartao[];
  /** Ids de critério sem os quais este caminho deixa de existir. */
  exige: string[];
  /** Verdadeiro no caminho que a caminhada de fato usou para trazer o cartão. */
  doFeed: boolean;
}

export interface ExplicacaoDaPersona {
  personaId: string;
  personaNome: string;
  caminhos: CaminhoExplicado[];
  criterios: Criterio[];
  /** O motivo como o cartão o mostrou no feed desta persona, quando ele apareceu lá. */
  motivoDoCartao: MotivoCartao | null;
  /** Resultado dos 5 predicados de disposição sobre esta entidade. */
  predicados: Record<string, ResultadoPredicado>;
}

export interface PaginaExplicacao {
  entidadeId: string;
  titulo: string;
  classe: ClasseEntidade;
  slug: string;
  imagem?: string;
  creditoImagem?: string;
  linguagens: string[];
  procedencia: Procedencia;
  /** Rota da entidade quando ela existe. A explicação não pode ser um beco. */
  rotaEntidade: string | null;
  porPersona: ExplicacaoDaPersona[];
  personaPadrao: string;
}

/**
 * A COLETA É EXAUSTIVA SOBRE AS SEMENTES, e isso é uma correção de honestidade, não de
 * desempenho.
 *
 * A primeira versão parava nos 4 primeiros caminhos, que é quanto a tela exibe. Medido no
 * navegador: na trilha curada, remover a ficha «Teatro» derrubava os 4 e a tela declarava
 * que sem aquele critério o item não teria aparecido — sendo que outras 9 sementes chegam
 * ao mesmo item e não tinham sido consultadas. A frase mais forte da tela estaria afirmando
 * mais do que fora verificado.
 *
 * Agora a análise de dependência roda sobre TODOS os caminhos que a caminhada encontra (um
 * por semente, 13 a 15 por persona; ~0,4 ms cada), e a tela exibe só os primeiros. O que a
 * tela afirma passa a ser exatamente o que foi calculado.
 */
const MAX_CAMINHOS = Number.POSITIVE_INFINITY;



const CONTEXTO_PREDICADO = { ocorrenciasDe };

/** O caminho que a caminhada guardou para cada entidade alcançada, por persona. */
const CANDIDATOS_POR_PERSONA = new Map<string, Map<string, PassoCartao[]>>();

function caminhosDaCaminhada(persona: Persona): Map<string, PassoCartao[]> {
  const cacheado = CANDIDATOS_POR_PERSONA.get(persona.id);
  if (cacheado) return cacheado;
  const expansao = expandir(persona);
  const idx = new Map<string, PassoCartao[]>();
  for (const c of [...expansao.candidatos, ...expansao.reserva]) {
    if (!idx.has(c.entidade.id)) idx.set(c.entidade.id, c.caminho);
  }
  CANDIDATOS_POR_PERSONA.set(persona.id, idx);
  return idx;
}

/**
 * `Passo` (com as entidades resolvidas) → `PassoCartao` (achatado e serializável).
 *
 * A aresta é reencontrada por consulta indexada de vizinhança, e não sintetizada, porque é
 * dela que saem `motivo`, `papel` e `procedencia` — e `resolverSalto` é o mesmo código que
 * o feed usa, então o texto do motivo aqui é literalmente o texto que o cartão mostraria.
 */
function passoParaCartao(passo: Passo): PassoCartao | null {
  const vizinho = vizinhos(passo.de.id, passo.relacao).find(
    (v) => v.entidade.id === passo.para.id,
  );
  if (!vizinho) return null;
  return resolverSalto(passo.de, passo.para, vizinho.aresta).passo;
}

/** A semente de onde um caminho parte é o `de` do primeiro passo. */
function sementeDoCaminho(passos: readonly PassoCartao[]): string | null {
  return passos.length ? passos[0].deId : null;
}

/**
 * A explicação de uma entidade para uma persona.
 *
 * ORDEM DOS CAMINHOS, e ela é uma decisão de honestidade: **o primeiro é sempre o que a
 * caminhada usou**, mesmo quando ele é o mais curto e o menos vistoso. Promover um caminho
 * de dois saltos mais bonito para o topo mostraria uma explicação que não foi a razão de o
 * cartão estar no feed — a tela ficaria melhor e passaria a mentir. Os outros vêm depois,
 * na ordem das sementes (as entidades do repertório antes das linguagens), porque uma obra
 * que a pessoa atravessou explica mais do que a categoria dela.
 */
export function explicacaoDe(entidadeId: string, personaId: string): ExplicacaoDaPersona {
  const persona = personaPorId(personaId);
  const entidade = porId(entidadeId);

  const vazia: ExplicacaoDaPersona = {
    personaId,
    personaNome: persona?.nome ?? personaId,
    caminhos: [],
    criterios: [],
    motivoDoCartao: null,
    predicados: {},
  };
  if (!persona || !entidade) return vazia;

  const cartao = cartaoDoFeed(personaId, entidadeId);
  const predicados: Record<string, ResultadoPredicado> = {};
  for (const d of DISPOSICOES) {
    predicados[d.id] = d.predicado ? d.predicado(entidade, CONTEXTO_PREDICADO) : "passa";
  }

  // --- os caminhos -------------------------------------------------------
  const sementes = expandir(persona).sementes;
  const brutos: Array<{ sementeId: string; passos: PassoCartao[]; doFeed: boolean }> = [];

  // 1. O caminho que TROUXE o cartão. `Cartao.caminho` primeiro (é o objeto que o feed
  //    exibiu), e o índice da expansão como reserva para as entidades que esta persona
  //    alcança mas que não caíram no feed dela.
  const doFeed = cartao?.caminho?.length
    ? cartao.caminho
    : (caminhosDaCaminhada(persona).get(entidadeId) ?? []);
  const sementePrincipal = sementeDoCaminho(doFeed);
  if (sementePrincipal) {
    brutos.push({ sementeId: sementePrincipal, passos: doFeed, doFeed: true });
  }

  // 2. As outras sementes do repertório, por `caminho()` — que já tem a trava de
  //    concentrador (DP-E) e devolve os passos com motivo e papel resolvidos.
  for (const semente of sementes) {
    if (brutos.length >= MAX_CAMINHOS) break;
    if (semente.id === sementePrincipal) continue;
    if (brutos.some((b) => b.sementeId === semente.id)) continue;
    const bruto = caminho(semente.id, entidadeId, 2);
    if (!bruto?.length) continue;
    const passos = bruto.map(passoParaCartao);
    if (passos.some((p) => p === null)) continue;
    brutos.push({
      sementeId: semente.id,
      passos: passos as PassoCartao[],
      doFeed: false,
    });
  }

  // --- os critérios ------------------------------------------------------
  const criterios: Criterio[] = [];
  const visto = new Set<string>();
  const acrescentar = (criterio: Criterio) => {
    if (visto.has(criterio.id)) return;
    visto.add(criterio.id);
    criterios.push(criterio);
  };

  // Linguagem: as que esta entidade compartilha com o repertório da persona.
  const doRepertorio = new Set(persona.repertorio.linguagens);
  const linguagensCompartilhadas = entidade.linguagens.filter((l) => doRepertorio.has(l));
  const idDeLinguagem = new Map<string, string>();
  for (const l of linguagensCompartilhadas) {
    const no = porSlug("linguagem", l);
    if (!no) continue;
    idDeLinguagem.set(no.id, `linguagem:${l}`);
    acrescentar({
      id: `linguagem:${l}`,
      rotulo: no.titulo,
      tipo: "linguagem",
      detalhe: `Linguagem que este item declara e que também está no seu repertório.`,
    });
  }

  const caminhos: CaminhoExplicado[] = brutos.map(({ sementeId, passos, doFeed: usado }) => {
    const semente = porId(sementeId);
    const exige = [`semente:${sementeId}`];
    // Um caminho depende de uma linguagem quando ELE ATRAVESSA o nó daquela linguagem.
    // Sem essa verificação, o critério seria decorativo: removê-lo não removeria nada e a
    // ficha viraria um botão que finge fazer alguma coisa.
    for (const passo of passos) {
      for (const lado of [passo.deId, passo.paraId]) {
        const criterio = idDeLinguagem.get(lado);
        if (criterio && !exige.includes(criterio)) exige.push(criterio);
      }
    }
    const criterioSemente = idDeLinguagem.get(sementeId);
    if (criterioSemente && !exige.includes(criterioSemente)) exige.push(criterioSemente);

    acrescentar({
      id: `semente:${sementeId}`,
      rotulo: semente?.titulo ?? sementeId,
      tipo: "semente",
      detalhe: semente
        ? `${semente.classe} que já está no seu repertório — é daqui que este caminho parte.`
        : "Ponto de partida no seu repertório.",
    });

    return {
      sementeId,
      sementeTitulo: semente?.titulo ?? sementeId,
      sementeClasse: semente?.classe ?? "termo",
      passos,
      exige,
      doFeed: usado,
    };
  });

  // Sem nenhum caminho: ou o item foi o sorteio de serendipidade (D-30), ou ele está fora
  // do alcance da caminhada desta persona. Nos dois casos existe UM critério e ele é
  // verdadeiro — não há semente, não há linguagem compartilhada, e a tela diz isso.
  if (!caminhos.length) {
    const serendipidade = cartao?.motivo.origemMotivo === "sem-aresta";
    acrescentar({
      id: "fora-da-caminhada",
      rotulo: serendipidade ? "sorteio fora do repertório" : "fora do alcance desta persona",
      tipo: "fora-da-caminhada",
      detalhe: serendipidade
        ? "Nenhuma ligação do acervo liga este item ao que você já atravessou. Ele entrou por um sorteio determinístico entre o que a caminhada NÃO alcançou."
        : "Nenhum caminho de até dois saltos parte do repertório desta persona até este item. Ele apareceu no feed de outra persona.",
    });
  }

  // Disposição: as cinco entram como critério com o resultado do predicado sobre ESTE item.
  // A tela mostra só as que a pessoa marcou — quais são só se sabe no navegador, sob
  // `output: "export"`.
  for (const d of DISPOSICOES) {
    acrescentar({
      id: `disposicao:${d.id}`,
      rotulo: d.rotulo,
      tipo: "disposicao",
      detalhe:
        predicados[d.id] === "indeterminado" && d.ausencia
          ? d.ausencia
          : d.tipo === "corte"
            ? "Este item passou por este corte. O corte não trouxe o item — ele só não o tirou."
            : d.explicacao,
    });
  }

  return {
    personaId,
    personaNome: persona.nome,
    caminhos,
    criterios,
    motivoDoCartao: cartao?.motivo ?? null,
    predicados,
  };
}

/**
 * A página inteira: a entidade e as TRÊS explicações.
 *
 * Sob `output: "export"` a persona só é conhecida no navegador (ela mora no `localStorage`).
 * Prerenderizar uma só e mostrá-la a todo mundo faria a explicação mentir para as outras
 * duas — e a tela cuja função é ser auditável é a última que pode fazer isso.
 */
export function paginaExplicacao(param: string): PaginaExplicacao | null {
  const entidade = paramParaEntidade(param);
  if (!entidade) return null;

  const base = ROTA_POR_CLASSE[entidade.classe];

  return {
    entidadeId: entidade.id,
    titulo: entidade.titulo,
    classe: entidade.classe,
    slug: entidade.slug,
    ...(entidade.imagem ? { imagem: entidade.imagem } : {}),
    ...(entidade.creditoImagem ? { creditoImagem: entidade.creditoImagem } : {}),
    linguagens: entidade.linguagens,
    procedencia: entidade.procedencia,
    rotaEntidade: base ? `${base}/${entidade.slug}/` : null,
    porPersona: PERSONAS.map((p) => explicacaoDe(entidade.id, p.id)),
    personaPadrao: PERSONA_PADRAO,
  };
}
