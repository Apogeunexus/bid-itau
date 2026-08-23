"use client";

import { Cartao } from "@/componentes/cartao";
import { Comentario } from "@/componentes/comentario";
import { useSessao } from "@/contexto/sessao";
import type { AvisoFeed, Cartao as CartaoDTO, DiagnosticoFeed } from "@/dados/cartao";

/**
 * feed.tsx — o lado cliente de Descobrir (D-26, D-27, D-32, D-45).
 *
 * ESTE COMPONENTE NÃO CALCULA NADA. A caminhada rodou no build, 96 vezes — 3 personas × 32
 * subconjuntos de disposição — e o que atravessou a fronteira RSC foram os cartões prontos.
 * Trocar de disposição ou de persona aqui muda **um índice**: sem navegação, sem
 * `useEffect` de busca, sem refazer travessia. É isso que faz a troca ser instantânea na
 * apresentação, e é por isso que D-32 e D-45 são demonstráveis ao vivo em vez de descritas.
 *
 * DP-F: nenhuma linha deste arquivo conhece `@/dados/grafo`. Os tipos vêm de
 * `@/dados/cartao`, que é o DTO da fronteira e não importa acervo nenhum. Os 23 MB de grafo
 * ficam do lado de lá.
 *
 * A CHAVE DA COMBINAÇÃO É UMA MÁSCARA DE BITS, e a ordem vem do servidor em
 * `ordemDisposicoes`. Foi de propósito: uma função de chave escrita dos dois lados da
 * fronteira diverge na primeira edição, e o sintoma seria uma combinação que existe no
 * build e nunca é encontrada no navegador — ou seja, a disposição que não muda nada, que é
 * exatamente o defeito que D-32 existe para impedir.
 *
 * ANTES DE HIDRATAR o contexto de sessão devolve a persona padrão e nenhuma disposição, que
 * é exatamente o que saiu no HTML estático. A tela não pisca e o feed existe mesmo antes de
 * o JavaScript carregar.
 */

export interface CombinacaoFeedProps {
  disposicoes: string[];
  lista: number;
  avisos: AvisoFeed[];
  diagnostico: DiagnosticoFeed;
}

export interface FeedProps {
  /** Ordem canônica das disposições. O índice da combinação é a máscara sobre ela. */
  ordemDisposicoes: string[];
  listas: CartaoDTO[][];
  porPersona: Record<string, CombinacaoFeedProps[]>;
  personaPadrao: string;
}

export function Feed({
  ordemDisposicoes,
  listas,
  porPersona,
  personaPadrao,
}: FeedProps) {
  const { personaId, disposicoes } = useSessao();

  // T-02-02: `personaId` vem do `localStorage`, que o avaliador pode editar. `sessao.tsx`
  // já valida contra a lista de personas; aqui a reserva é estrutural — persona sem
  // combinação cai na padrão em vez de estourar a tela.
  const doPersona = porPersona[personaId] ?? porPersona[personaPadrao] ?? [];

  const mascara = ordemDisposicoes.reduce(
    (m, id, i) => (disposicoes.includes(id) ? m | (1 << i) : m),
    0,
  );
  const combinacao = doPersona[mascara] ?? doPersona[0];
  const cartoes = combinacao ? (listas[combinacao.lista] ?? []) : [];

  return (
    <div className="flex flex-col gap-3">
      {/* Os avisos do motor. NÃO são opcionais: quando um corte marcado não pôde filtrar
          porque o acervo não declara o campo, a tela diz isso. É desconfortável e é o
          ponto — a diferença entre um filtro que mente e um que se declara. */}
      {combinacao?.avisos.length ? (
        <ul className="flex flex-col gap-2">
          {combinacao.avisos.map((aviso: AvisoFeed) => (
            <li
              key={aviso.origem}
              data-aviso={aviso.origem}
              className="rounded-lg border border-acao bg-superficie p-2.5 text-xs leading-snug"
            >
              {aviso.texto}
            </li>
          ))}
        </ul>
      ) : null}

      {cartoes.length ? (
        // A GRADE DA VISÃO WEB MORA AQUI E É SÓ LAYOUT (D-79, D-80, plano 05-02).
        //
        // `web-grade` e `data-grade-web` viajam nos DOIS estados de visão: as regras que
        // as animam estão todas sob `[data-view="web"]`, em `web.css` e
        // `web-descobrir.css`, e na visão app não existe uma que case. É por isso que não
        // há nenhum `if (visao === …)` neste arquivo — um ramo em JavaScript por visão
        // faria o mesmo componente renderizar árvores diferentes, que é exatamente o que
        // D-05 proíbe, e ainda quebraria a hidratação, porque a visão só é conhecida
        // depois de ler o `localStorage`.
        //
        // `flex flex-col gap-3` continua e continua valendo NA VISÃO APP. Na web,
        // `.web-grade` ganha por ser regra sem camada — os utilitários do Tailwind moram
        // em `@layer utilities` e perdem para qualquer declaração fora de camada.
        <div data-feed data-grade-web="sim" className="web-grade flex flex-col gap-3">
          {cartoes.map((cartao) => (
            // `data-classe` no invólucro é contrato de verificação da fase: os gates leem
            // a heterogeneidade daqui, sem depender de texto visível nem de classe de CSS.
            //
            // `data-destaque-curado` carrega o MESMO valor de `data-especial` que
            // `cartao.tsx` já lê — `curado` (D-29) ou `serendipidade` (D-30). Não é um
            // segundo critério de destaque: é o primeiro, subido um nível para o
            // invólucro, porque quem ocupa duas colunas é o ITEM DA GRADE, e o item da
            // grade é este `div`, não o `<article>` lá dentro.
            <div
              key={cartao.id}
              data-classe={cartao.classe}
              data-destaque-curado={cartao.especial ?? undefined}
              className={cartao.especial ? "web-grade-largo" : undefined}
            >
              <Cartao cartao={cartao} />
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-borda-forte p-4 text-sm text-tinta-2">
          Nenhum candidato sobrou com esta combinação de disposição. Isto é um resultado do
          acervo, não um erro: desmarque um corte para voltar ao feed base.
        </p>
      )}

    </div>
  );
}

