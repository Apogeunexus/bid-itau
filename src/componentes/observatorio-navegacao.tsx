import type { TelaDaSuperficie } from "@/dados/observatorio";

/**
 * observatorio-navegacao.tsx — a navegação das oito telas do Observatório.
 *
 * A SUPERFÍCIE NASCEU COMO TELA ÚNICA e passou a ser oito. Sem navegação, sete delas só
 * existem para quem digita a URL — e quem digita URL ao vivo, na frente de uma banca, erra.
 *
 * ELA MORA DENTRO DO CABEÇALHO QUE JÁ EXISTE, e isso é medida, não estética. O portão de
 * 05-08 afere que o painel de procedência está INTEIRO na primeira vista de 1440×960, topo
 * e base, sem rolar: uma faixa de navegação em linha própria empurra o painel para baixo e
 * derruba esse portão. No lugar dos três atalhos que estavam aqui, a navegação ocupa o
 * mesmo espaço, e os atalhos para as outras superfícies de bastidor desceram para o pé da
 * página, onde não custam pixel de primeira vista.
 *
 * A TELA ATIVA CONTINUA SENDO UM LINK, com `aria-current="page"`. Transformá-la em texto
 * morto economizaria um clique inútil e custaria a única forma de recarregar a tela em que
 * se está — e, no artefato estático, recarregar é o gesto que desfaz qualquer estado de
 * cliente que tenha ficado estranho.
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO. A lista de telas chega como DTO,
 * montada no build pela página de servidor. Um `import` por valor aqui arrastaria 23 MB de
 * grafo para o navegador.
 */
export function ObservatorioNavegacao({
  telas,
  ativa,
}: {
  telas: readonly TelaDaSuperficie[];
  ativa: string;
}) {
  return (
    <nav className="obs-telas" aria-label="as oito telas do Observatório">
      {telas.map((t) => (
        <a
          key={t.id}
          href={t.rota}
          className="obs-tela"
          data-tela-do-observatorio={t.id}
          data-ativa={t.id === ativa ? "sim" : "nao"}
          aria-current={t.id === ativa ? "page" : undefined}
          title={t.pergunta}
        >
          {t.rotulo}
        </a>
      ))}
    </nav>
  );
}
