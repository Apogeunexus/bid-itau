import { ObservatorioNavegacao } from "@/componentes/observatorio-navegacao";
import type { TelaDaSuperficie } from "@/dados/observatorio";

/**
 * observatorio-casca.tsx — o cabeçalho comum das telas do Observatório.
 *
 * A RAIZ NÃO USA ESTA CASCA, e é decisão e não descuido: o cabeçalho dela tem o título do
 * produto — «Impacto cultural, medido no acervo» —, e o portão de 05-08 mede a distância
 * entre o topo do documento e a base do painel de procedência. Trocar aquele cabeçalho por
 * este mexeria numa medida que outro plano afere. As sete telas novas, que nenhum portão
 * antigo mede, compartilham este.
 *
 * A PERGUNTA APARECE SOB O TÍTULO, e é o que impede a navegação de virar gaveta: oito
 * rótulos numa fileira dizem que existem oito telas e não dizem por que alguém abriria
 * cada uma. A pergunta vem do dado, em `TelaDaSuperficie.pergunta`, e não do componente.
 */
export function CascaDoObservatorio({
  tela,
  telas,
  children,
}: {
  tela: TelaDaSuperficie;
  telas: readonly TelaDaSuperficie[];
  children: React.ReactNode;
}) {
  return (
    <section data-observatorio-tela={tela.id} className="obs">
      <header className="obs-cabecalho">
        <div className="obs-cabecalho-texto">
          <p className="obs-superficie">Bastidor · Observatório</p>
          <h1 className="obs-titulo">{tela.rotulo}</h1>
          <p className="obs-pergunta">{tela.pergunta}</p>
        </div>
        <ObservatorioNavegacao telas={telas} ativa={tela.id} />
      </header>
      {children}
    </section>
  );
}
