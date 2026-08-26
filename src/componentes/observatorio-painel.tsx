import { milhar } from "@/componentes/observatorio-indicador";
import type { FatiaDeProcedencia, LinhaDeIndicador, PainelDeProcedencia } from "@/dados/observatorio";

/**
 * observatorio-painel.tsx — o painel de procedência, a tela de primeira classe de D-88.
 *
 * ELE ABRE A RAIZ E É A TELA INTEIRA DA G5, e por isso mora aqui em vez de dentro de uma
 * das duas. Duas cópias do painel seriam dois lugares onde a inversão entre as leituras —
 * o acervo deu as coisas, nós derivamos as ligações — pode ser desarranjada por engano, e
 * o sintoma seria uma das duas telas contando a história errada sem ninguém notar.
 *
 * A FRASE SOBRE «AUTORADO» NÃO PODE SER SUAVIZADA. Ela vem do módulo, em
 * `SIGNIFICADO_DA_PROCEDENCIA`, e diz que aquelas 47 entidades nós inventamos para o
 * protótipo. Nenhum concorrente vai escrever isso na própria tela — e é justamente por
 * escrever que os outros 4.826 passam a ser verificáveis em vez de acreditáveis.
 *
 * SEM BIBLIOTECA DE GRÁFICO E SEM UMA ÚNICA REQUISIÇÃO DE REDE. As barras são elementos de
 * HTML com largura em porcentagem calculada do número. Uma biblioteca de gráfico derrubaria
 * o gate de zero requisição externa que o artefato mantém desde a fase 2; e `visiveis()` do
 * prelúdio de verificação FALHA sobre SVG, porque `offsetParent` é nulo em elemento SVG —
 * barra em HTML é mensurável pelos gates sem ginástica.
 *
 * NENHUMA LARGURA DE BARRA É LITERAL. Ela sai de `fatia.fracao`, por `style` calculado. Uma
 * barra desenhada à mão que não acompanhe o dado é a mentira mais fácil de cometer nesta
 * tela — e passaria num gate de presença sem sintoma nenhum.
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO.
 */

/** A composição de uma fatia, em uma linha só. Três linhas empilhadas custariam a dobra. */
function composicaoEmLinha(linhas: LinhaDeIndicador[]): string {
  return linhas.map((l) => `${l.rotulo} ${milhar(l.valor ?? 0)}`).join(" · ");
}

// ---------------------------------------------------------------------------
// O painel de procedência (D-88)
// ---------------------------------------------------------------------------

function Fatia({ fatia, leitura }: { fatia: FatiaDeProcedencia; leitura: string }) {
  return (
    <div
      data-procedencia-fatia={fatia.procedencia}
      data-leitura-procedencia={leitura}
      className="obs-fatia"
    >
      <p className="obs-fatia-cabeca">
        <span className="obs-fatia-numero">{milhar(fatia.n)}</span>
        <span className="obs-fatia-percentual">{milhar(fatia.percentual)}%</span>
      </p>

      {/* A barra. `width` sai do dado; `min-width` mora na folha, para a fatia de 0,1% não
          desaparecer da tela — some a barra, some a informação de que ela é minúscula. */}
      <span className="obs-trilho">
        <span
          className="obs-barra"
          data-procedencia={fatia.procedencia}
          style={{ width: `${(fatia.fracao * 100).toFixed(2)}%` }}
        />
      </span>

      <p className="obs-fatia-composicao">{composicaoEmLinha(fatia.composicao)}</p>
      <p className="obs-fatia-exemplo">
        <span className="obs-etiqueta">{fatia.regraDoExemplo}</span> {fatia.exemplo}
      </p>
    </div>
  );
}

/**
 * Uma procedência, com as DUAS leituras na mesma linha.
 *
 * Este arranjo é a decisão de composição do painel, e ela vem do que os números dizem: a
 * proporção de `ic` cai de 61,8% em entidade para 22,4% em aresta, e a de `derivado` sobe
 * de 37,6% para 77,5%. Em duas colunas independentes, essa inversão — que é o achado —
 * exigiria comparar dois blocos separados por 500 px. Lado a lado, na mesma linha, ela
 * salta.
 *
 * E o significado da procedência aparece UMA VEZ, atravessando as duas colunas: a frase
 * «nós inventamos para o protótipo» é a mesma para a entidade e para a aresta, e repeti-la
 * duas vezes por procedência gastaria seis parágrafos idênticos e empurraria o painel para
 * fora da primeira vista — que é justamente o que D-88 não admite.
 */
function LinhaDeProcedencia({
  entidade,
  aresta,
}: {
  entidade: FatiaDeProcedencia;
  aresta: FatiaDeProcedencia;
}) {
  return (
    <div className="obs-linha" data-procedencia={entidade.procedencia}>
      <p className="obs-linha-nome" data-procedencia={entidade.procedencia}>
        {entidade.rotulo}
      </p>
      <Fatia fatia={entidade} leitura="entidades" />
      <Fatia fatia={aresta} leitura="arestas" />
      <p className="obs-linha-significado">{entidade.significado}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Um indicador (D-87, D-90)
// ---------------------------------------------------------------------------

export function PainelDaProcedencia({ painel }: { painel: PainelDeProcedencia }) {
  return (
    <section data-procedencia-painel="acervo" className="obs-procedencia">
      <div className="obs-procedencia-topo">
        <h2 className="obs-procedencia-titulo">De onde veio cada coisa que esta tela mostra</h2>
        <p className="obs-procedencia-tese">
          Das <strong>{milhar(painel.totalDeEntidades)}</strong> entidades e das{" "}
          <strong>{milhar(painel.totalDeArestas)}</strong> ligações: o que veio do Itaú
          Cultural, o que foi derivado e o que foi autorado.
        </p>
      </div>

      <div className="obs-tabela">
        <p className="obs-colunas" aria-hidden="true">
          <span className="obs-coluna-vazia" />
          <span className="obs-coluna-cabeca">
            <span className="obs-coluna-rotulo">Entidades</span>
            <span className="obs-coluna-total">{milhar(painel.totalDeEntidades)}</span>
            <span className="obs-coluna-nota">
              as coisas do acervo: pessoas, obras, eventos, territórios, conteúdos
            </span>
          </span>
          <span className="obs-coluna-cabeca">
            <span className="obs-coluna-rotulo">Ligações</span>
            <span className="obs-coluna-total">{milhar(painel.totalDeArestas)}</span>
            <span className="obs-coluna-nota">
              as ligações entre elas: é a ligação, e não a coisa, que faz o grafo explicar
            </span>
          </span>
        </p>

        {painel.entidades.map((f) => {
          const par = painel.arestas.find((a) => a.procedencia === f.procedencia);
          return par ? (
            <LinhaDeProcedencia key={f.procedencia} entidade={f} aresta={par} />
          ) : null;
        })}
      </div>

      <p className="obs-diferenca">{painel.leituraDaDiferenca}</p>

      <p className="obs-conferencia">
        <span className="obs-etiqueta">conferência</span>
        As fatias somam {milhar(painel.conferencia.somaDeEntidades)} entidades e{" "}
        {milhar(painel.conferencia.somaDeArestas)} ligações, exatamente os totais do acervo.
        Três fontes independentes precisam concordar para esta tela abrir —{" "}
        {painel.conferencia.fontes.length} contagens feitas em processos separados; se
        divergirem, o build quebra em vez de exibir. Grafo gerado em{" "}
        {painel.conferencia.geradoEm}.
      </p>
    </section>
  );
}
