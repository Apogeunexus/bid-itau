import { CascaDoObservatorio } from "@/componentes/observatorio-casca";
import { CartaoDeIndicador, milhar } from "@/componentes/observatorio-indicador";
import type { DadosDoProduto, TelaDaSuperficie } from "@/dados/observatorio";

/**
 * observatorio-produto.tsx — G2, os KPIs de produto e a honestidade sobre os que faltam.
 *
 * NÃO INVENTE ENGAJAMENTO. Aquisição, retenção e funil são exatamente os três números que
 * uma banca espera ver num painel de produto, e são os três que este protótipo não pode
 * medir — não há sessão, não há retorno, não há conversão registrada. Escrevê-los a partir
 * das 3 personas autoradas seria afirmar comportamento de gente que não existe, e é o tipo
 * de número que passa despercebido até alguém perguntar de onde saiu.
 *
 * A TELA SEPARA OS DOIS BLOCOS EM VEZ DE MISTURÁ-LOS, e a ordem é deliberada: primeiro o
 * que ela mede, depois o que ela não mede. Misturados numa grade só, os três `null`
 * pareceriam buracos numa lista de sete; separados e com título próprio, eles viram uma
 * afirmação — «estes três não têm lastro, e aqui está o motivo de cada um».
 *
 * O NÚMERO QUE VALE EXIBIR É A DISTÂNCIA ENTRE OS FEEDS. Ele não depende de comportamento:
 * o feed sai da travessia do grafo a partir do repertório, e repertórios diferentes produzem
 * listas diferentes sem que ninguém tenha registrado um clique. Personalização MEDIDA, num
 * lugar onde quase todo produto afirma sem contar.
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO.
 */
export function ObservatorioProduto({
  dados,
  tela,
  telas,
}: {
  dados: DadosDoProduto;
  tela: TelaDaSuperficie;
  telas: readonly TelaDaSuperficie[];
}) {
  const { medidos, semLastro } = dados;

  return (
    <CascaDoObservatorio tela={tela} telas={telas}>
      <p className="obs-publico-declaracao" data-recorte-do-produto>
        <strong>{milhar(medidos.length)}</strong> destes indicadores são medidos no acervo e{" "}
        <strong>{milhar(semLastro.length)}</strong> não têm lastro nenhum. Os três que faltam são
        justamente os que um painel de produto costuma abrir — aquisição, retenção, funil —, e
        eles estão aqui como <em>o dado não sustenta</em>, com o motivo escrito, em vez de como
        um número plausível. Um KPI de produto sem usuário real é uma afirmação sobre gente que
        não existe.
      </p>

      <section className="obs-recorte" aria-labelledby="obs-medidos-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-medidos-titulo" className="obs-secao-titulo">
            O que este protótipo mede de verdade
          </h2>
        </div>
        <p className="obs-publico-nota">
          Os três saem da estrutura do grafo, e não do comportamento de ninguém: são verdadeiros
          sem que uma única visita tenha sido registrada. É menos do que um painel de analytics
          promete, e é tudo verificável.
        </p>
        <ul className="web-grade obs-indicadores">
          {medidos.map((i, pos) => (
            <CartaoDeIndicador key={i.id} indicador={i} destacado={pos === 0} primeiro={pos === 0} />
          ))}
        </ul>
      </section>

      <section className="obs-recorte obs-par" aria-labelledby="obs-sem-lastro-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-sem-lastro-titulo" className="obs-secao-titulo">
            O que ele não pode medir, e por quê
          </h2>
        </div>
        <p className="obs-publico-nota">
          E a falta aqui é de <strong>outra espécie</strong> que a da gratuidade na tela de
          impacto: lá o campo existe no acervo e está vazio; aqui não há acervo que pudesse ter o
          campo. O artefato é um export estático sem back-end, sem cookie e sem registro de
          visita. Cada um dos três diz qual é o seu motivo, porque «não temos» três vezes seria
          uma desculpa e não uma medida.
        </p>
        <ul className="web-grade obs-indicadores" data-sem-lastro={semLastro.length}>
          {semLastro.map((i) => (
            <CartaoDeIndicador key={i.id} indicador={i} destacado={false} primeiro={false} />
          ))}
        </ul>
      </section>
    </CascaDoObservatorio>
  );
}
