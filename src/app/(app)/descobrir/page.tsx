import { AtalhosDaSessao } from "@/componentes/descobrir-atalhos";
import {
  BuscaDeDescobrir,
  ConteudoParaInspirar,
  ExplorePorLinguagens,
  MapaCultural,
  ProgramacaoDoDia,
  type ProgramacaoDaVitrine,
} from "@/componentes/descobrir-vitrines";
import { Feed } from "@/componentes/feed";
import { Grafismo } from "@/componentes/grafismo";
import { ANCORA_DO_FEED, Heroi } from "@/componentes/heroi";

import { montarAgenda } from "@/dados/agenda";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { cidadesComAcervo } from "@/dados/cidade";
import { PRECOMPUTO } from "@/dados/feeds";
import { porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import { montarIndice } from "@/dados/indice";
import { leituras } from "@/dados/leituras";

/**
 * Descobrir — DESC-02, `docs/telas.md` tela 5. A tela mais importante do produto.
 *
 * COMPONENTE DE SERVIDOR, E É AQUI QUE A CAMINHADA RODA. Sob `output: "export"` (D-24)
 * "servidor" quer dizer build: `@/dados/feeds` monta as 96 combinações no momento em que
 * este módulo é carregado, e o que atravessa a fronteira RSC são cartões — primitivos, sem
 * uma referência a `Entidade`. `entidades.json` tem 9,4 MB e `arestas.json` 13,6 MB; nenhum
 * dos dois pode chegar ao navegador (DP-F).
 *
 * O feed NÃO é lista ordenada por relevância (D-26). Cada cartão chegou por uma aresta do
 * grafo, e o selo laranja é o texto dessa aresta. Popularidade não entra em lugar nenhum —
 * nem aqui, nem em `caminhada.ts`.
 *
 * AS VITRINES DO REDESENHO (2026-08) SÃO MEDIDAS AQUI, no mesmo escopo de build, e descem
 * como recortes mínimos: a agenda inteira tem 192 KB e as vitrines levam só o dia em foco;
 * o índice de busca empresta as facetas de linguagem, com contagem e cor que o vocabulário
 * gerou (D-08). Nenhum número de vitrine é escrito à mão.
 */

const HOJE = DATA_DE_REFERENCIA;

/** Quantas sessões a vitrine do dia mostra. O restante é declarado contra o total. */
const TETO_DE_SESSOES = 5;

/** Quantas linguagens entram no trilho. As demais ficam atrás do chip «Todas». */
const TETO_DE_LINGUAGENS = 10;

/** Quantas leituras a vitrine editorial leva — a dupla mais recente do acervo. */
const TETO_DE_LEITURAS = 2;

const agenda = montarAgenda({ hoje: HOJE });

/* O dia em foco: o de referência quando ele tem sessão, senão o primeiro com sessão
 * depois dele — e a seção DIZ qual dos dois é. Todas as sessões no passado → sem vitrine,
 * em vez de uma vitrine anunciando «hoje» sobre um dia que já passou. */
const diaEmFoco = agenda.dias.find((d) => d.data >= agenda.hoje) ?? null;

const PROGRAMACAO: ProgramacaoDaVitrine | null = diaEmFoco
  ? {
      data: diaEmFoco.data,
      eHoje: diaEmFoco.data === agenda.hoje,
      totalSessoes: diaEmFoco.totalSessoes,
      sessoes: diaEmFoco.eventos.slice(0, TETO_DE_SESSOES).map((indice, i) => {
        const evento = agenda.eventos[indice];
        return {
          hora: diaEmFoco.horas[i],
          titulo: evento.titulo,
          slug: evento.slug,
          classe: evento.classe,
          linguagens: evento.linguagens,
          imagem: evento.imagem,
          creditoImagem: evento.creditoImagem,
        };
      }),
    }
  : null;

const SESSOES_DE_HOJE = diaEmFoco?.data === agenda.hoje ? diaEmFoco.totalSessoes : 0;

const facetasDeLinguagem = [...montarIndice({ slugsPorTipo, porSlug, vizinhos }).facetas.linguagem]
  .sort((a, b) => b.n - a.n || (a.valor < b.valor ? -1 : 1));

const LINGUAGENS = facetasDeLinguagem
  .slice(0, TETO_DE_LINGUAGENS)
  .map(({ valor, rotulo, n, cor }) => ({ valor, rotulo, n, cor }));

const TOTAL_DE_LINGUAGENS = facetasDeLinguagem.length;

const CIDADES = cidadesComAcervo().map(({ slug, titulo, total }) => ({ slug, titulo, total }));

const INSPIRAR = leituras().slice(0, TETO_DE_LEITURAS);

export default function Descobrir() {
  return (
    <>
      {/* O hero fica FORA do contêiner com padding, de propósito: ele sangra até a
          borda da moldura, e um gutter de 20px à sua volta o transformaria num
          cartão de foto em vez de uma abertura. */}
      <Heroi />

      <div
        id={ANCORA_DO_FEED}
        className="flex flex-col gap-4 p-5 desk:gap-6 desk:p-8"
      >
        <header className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="tipo-titulo-1 font-bold">Descobrir</h1>
        </header>

        <BuscaDeDescobrir sessoesDeHoje={SESSOES_DE_HOJE} />

        {/* O destaque curado abre o feed como seção própria e o restante segue sob
            «Para você» — a partição acontece em `feed.tsx`, sobre a MESMA combinação. */}
        <Feed
          ordemDisposicoes={PRECOMPUTO.ordemDisposicoes}
          listas={PRECOMPUTO.listas}
          porPersona={PRECOMPUTO.porPersona}
          personaPadrao={PRECOMPUTO.personaPadrao}
        />

        <MapaCultural cidades={CIDADES} />

        <ExplorePorLinguagens linguagens={LINGUAGENS} total={TOTAL_DE_LINGUAGENS} />

        <ProgramacaoDoDia programacao={PROGRAMACAO} />

        <ConteudoParaInspirar itens={INSPIRAR} />

        <AtalhosDaSessao />
      </div>
    </>
  );
}
