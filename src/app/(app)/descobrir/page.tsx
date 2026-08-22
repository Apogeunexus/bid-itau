import { Comentario } from "@/componentes/comentario";
import { Feed } from "@/componentes/feed";
import { Grafismo } from "@/componentes/grafismo";
import { SeletorDisposicao } from "@/componentes/seletor-disposicao";
import { TrocaPersona } from "@/componentes/troca-persona";
import { PRECOMPUTO } from "@/dados/feeds";

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
 */
export default function Descobrir() {
  return (
    // `desk:max-w-6xl` e não `5xl`: a moldura da visão web já é `max-w-6xl` em
    // `casca.tsx`, e o teto de 5xl estreitava o conteúdo em 128px dentro dela — pagando
    // com a largura dos cartões um limite que a moldura não pedia. Com 1.152px menos os
    // 64px de respiro sobram 1.088px, que dão três colunas de ~347px (D-80: o que muda na
    // web é densidade, não largura).
    <div className="flex flex-col gap-4 p-5 desk:mx-auto desk:max-w-6xl desk:gap-6 desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-[var(--ic-laranja)]" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Descobrir</h1>
          <span className="ml-auto shrink-0 rounded-full border border-black/15 px-2 py-0.5 text-xs font-semibold text-black/50">
            C1
          </span>
        </div>
        {/* A tese da tela, escrita para quem AVALIA a proposta: ela nomeia o mecanismo
            («uma aresta do acervo»), aponta para o próprio componente («o selo laranja») e
            se posiciona contra uma alternativa de projeto («ordenado por popularidade»).
            Nada disso é dito a quem usa o app — para essa pessoa, quem faz o trabalho é o
            selo de motivo de cada cartão, que continua na tela nos dois modos. */}
        <Comentario className="text-sm leading-snug text-black/60">
          Levar, não fazer buscar. Cada cartão abaixo chegou por uma aresta do acervo, e o selo
          laranja é o texto dessa aresta — nada aqui é ordenado por popularidade.
        </Comentario>
      </header>

      {/* A FAIXA DE CONTROLE, que na web atravessa a largura toda em vez de empilhar.
          Na visão app os dois seguem um sobre o outro exatamente como na fase 2: o
          contêiner é `flex flex-col gap-4`, e os dois invólucros são caixas de bloco sem
          regra própria, então o empilhamento e o respiro são os mesmos de antes. Na web
          `desk:flex-row` põe os dois lado a lado, e a grade de cartões começa logo abaixo
          — em vez de depois de duas faixas empilhadas que empurrariam a primeira linha de
          cartões para fora da primeira vista, que é a foto do slide. */}
      <div className="flex flex-col gap-4 desk:flex-row desk:items-start desk:gap-6">
        {/* D-32 — a disposição visível em texto e editável em um toque. */}
        <div className="desk:min-w-0 desk:flex-1">
          <SeletorDisposicao />
        </div>

        {/* D-45 — trocar de persona é um toque, e é requisito de demonstração. */}
        <div className="desk:w-80 desk:shrink-0">
          <TrocaPersona />
        </div>
      </div>

      <Feed
        ordemDisposicoes={PRECOMPUTO.ordemDisposicoes}
        listas={PRECOMPUTO.listas}
        porPersona={PRECOMPUTO.porPersona}
        personaPadrao={PRECOMPUTO.personaPadrao}
        bytes={PRECOMPUTO.bytes}
        combinacoes={PRECOMPUTO.combinacoes}
      />
    </div>
  );
}
