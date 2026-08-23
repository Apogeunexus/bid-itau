import vocabularioJson from "./gerado/vocabulario.json";
import type { LinguagemDoCast } from "./cast-wire";
import { catalogoDoPlay, fioDeItens, type ItemDoPlay } from "./play";
import type { CatalogoNoFio } from "./play-wire";
import type { Vocabulario } from "./tipos";

/**
 * cast.ts — o recorte de PODCAST do acervo.
 *
 * MÓDULO DE BUILD. Alcança `play.ts`, que alcança o grafo: por DP-F nenhum
 * `"use client"` pode importá-lo por valor. O que atravessa a fronteira é
 * `catalogoNoFioCast()`, no formato de `play-wire.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O QUE FOI MEDIDO CONTRA O ACERVO, e cada número desta tela é CONTADO:
 *
 * **336 podcasts**, todos `ic`, todos com resumo, 325 com capa.
 * **236 declaram linguagem** (13 distintas: literatura 88, música 81, teatro 47…)
 * e **100 não declaram nenhuma**.
 * **135 declaram tema** e 201 não — é por isso que o recorte da tela é por
 * linguagem e não por tema: um filtro que deixa 201 de fora é uma promessa que
 * o acervo não paga.
 * **Acessibilidade: ZERO em todas as 8 dimensões**, com os 336 DECLARANDO o
 * campo. Não é silêncio da fonte, é uma negativa declarada — e por isso não há
 * filtro de acessibilidade aqui: ele recortaria nada em qualquer dimensão.
 * **A ponte com evento é 4 arestas**, saindo de 4 dos 336. O bloco «não pode ir?
 * veja isto» mora em /play, onde é sustentado por 14 mídias; aqui ele seria uma
 * seção inteira construída sobre 1% do recorte.
 *
 * **As fileiras: 12, e elas somam 336.** Mekukradjá 71 · Toca Brasil 65 · Paiol
 * Literário 44 · Ficções Itaú Cultural 35 · Escritores-Leitores 27 · Ficções:
 * crianças 20 · Observe 20 · Versões do tempo 19 · série +70 10 · Rumos
 * Possíveis 7 · Tá no ar, produção! 6 · Outros podcasts 12. Como elas são
 * derivadas — e por que derivar do TÍTULO não é autorar um fato — está em
 * `prateleiras.ts`; a partição é conferida em `fioDeItens`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Quantos podcasts o acervo tem. Conferido a cada build; divergiu, o build cai. */
const PODCASTS_ESPERADOS = 336;

interface MontadoDoCast {
  linguagens: LinguagemDoCast[];
  fio: CatalogoNoFio;
}

let memo: MontadoDoCast | null = null;

function quebrar(mensagem: string): never {
  throw new Error(`cast.ts: ${mensagem}`);
}

/**
 * As linguagens contadas sobre os 336, com o rótulo e a COR vindos do
 * vocabulário gerado — a cor da linguagem é dado, nunca um mapa em TypeScript
 * (D-08). Uma linguagem que aparece no acervo e não está no vocabulário derruba
 * o build em vez de virar chave crua na tela.
 */
function linguagensContadas(itens: ItemDoPlay[]): LinguagemDoCast[] {
  const porId = new Map((vocabularioJson as Vocabulario).linguagens.map((l) => [l.id, l]));
  const contagem = new Map<string, number>();
  for (const item of itens) {
    for (const linguagem of new Set(item.linguagens)) {
      contagem.set(linguagem, (contagem.get(linguagem) ?? 0) + 1);
    }
  }
  return [...contagem]
    .map(([valor, n]) => {
      const entrada = porId.get(valor);
      if (!entrada) {
        quebrar(
          `a linguagem «${valor}» aparece em ${n} podcasts e não está no vocabulário gerado. ` +
            `A tela mostraria a chave crua e perderia a cor, que é DADO (D-08).`,
        );
      }
      return { valor, rotulo: entrada.rotulo, cor: entrada.cor, n };
    })
    .sort((a, b) => b.n - a.n || (a.valor < b.valor ? -1 : 1));
}

function montar(): MontadoDoCast {
  const itens = catalogoDoPlay().filter((item) => item.categoria === "podcasts");

  if (itens.length !== PODCASTS_ESPERADOS) {
    quebrar(
      `o recorte montou ${itens.length} podcasts e o acervo declara ${PODCASTS_ESPERADOS}. ` +
        `A tela AFIRMA o número na abertura; corrija a afirmação junto com a medida em vez ` +
        `de relaxar esta conferência.`,
    );
  }

  return { linguagens: linguagensContadas(itens), fio: fioDeItens(itens) };
}

function estado(): MontadoDoCast {
  if (!memo) memo = montar();
  return memo;
}

// ---------------------------------------------------------------------------
// A superfície pública — é a página de /cast que toca este módulo (DP-F)
// ---------------------------------------------------------------------------

/** O catálogo do Cast como ele atravessa a fronteira RSC, com as fileiras. */
export function catalogoNoFioCast(): CatalogoNoFio {
  return estado().fio;
}

/** As linguagens contadas sobre os 336, com rótulo e cor vindos do vocabulário. */
export function linguagensDoCast(): readonly LinguagemDoCast[] {
  return estado().linguagens;
}
