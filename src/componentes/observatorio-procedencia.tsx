import { CascaDoObservatorio } from "@/componentes/observatorio-casca";
import { milhar } from "@/componentes/observatorio-indicador";
import { PainelDaProcedencia } from "@/componentes/observatorio-painel";
import type { DadosDaProcedencia, DegrauDaProcedencia, TelaDaSuperficie } from "@/dados/observatorio";

/**
 * observatorio-procedencia.tsx — G5, a tela que mais distingue a proposta.
 *
 * TODO PROTÓTIPO DE AGENDA CULTURAL INVENTA DADO para a demonstração funcionar. Nenhum diz
 * quanto. É por afirmar em voz alta o que é invenção nossa — e o número está na tela, não
 * na prosa — que todo o resto passa a ser verificável em vez de acreditável.
 *
 * ELA ESTENDE O PAINEL, NÃO O SUBSTITUI. O painel de D-88 continua abrindo a raiz e é o
 * mesmo componente aqui: uma segunda versão dele seria um segundo lugar onde a inversão
 * entre as duas leituras pode ser desarranjada. O que esta tela ACRESCENTA é a conferência
 * por extenso — as três fontes, se fecham, e o que aconteceria se não fechassem — e o eixo
 * do tempo do vocabulário de procedência.
 *
 * O EIXO DO TEMPO É A TESE DA PROPOSTA INTEIRA, em uma tabela: os níveis de acesso não são
 * uma camada de segurança sobre a ontologia, eles SÃO o vocabulário de procedência. Cada
 * papel humano é um valor, cada escrita carimba quem escreveu, e a fatia «autorado» é a
 * única que existe hoje e não sobrevive ao bastidor entrar no ar.
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO.
 */

function Degrau({ degrau }: { degrau: DegrauDaProcedencia }) {
  return (
    <li
      className="web-painel obs-degrau"
      data-degrau-de-procedencia={degrau.id}
      data-existe-hoje={degrau.existeHoje ? "sim" : "nao"}
      data-em-producao={degrau.emProducao ? "sim" : "nao"}
    >
      <h3 className="obs-indicador-titulo">{degrau.rotulo}</h3>

      <p className="obs-valor">
        {degrau.hoje === null ? (
          <span className="obs-sem-lastro">ainda não existe no vocabulário</span>
        ) : (
          <span className="obs-numero">{milhar(degrau.hoje)}</span>
        )}
        <span className="obs-unidade">
          {degrau.hoje === null
            ? "— e isto é diferente de existir e medir zero"
            : "entidades hoje"}
        </span>
      </p>

      <ul className="web-denominadores obs-denominadores">
        <li className="web-denominador obs-denominador" data-denominador={`${degrau.id}:arestas`}>
          <span className="web-denominador-numero">
            {degrau.hojeEmArestas === null ? "—" : milhar(degrau.hojeEmArestas)}
          </span>
          <span className="web-denominador-rotulo">
            {degrau.hojeEmArestas === null
              ? "ligações — nenhuma, porque o valor não existe para ser carimbado"
              : "ligações hoje com este carimbo"}
          </span>
        </li>
      </ul>

      <p className="obs-degrau-carimba">
        <span className="obs-etiqueta">quem carimba</span>
        {degrau.quemCarimba}
      </p>

      <p className="obs-indicador-leitura">{degrau.significado}</p>

      {!degrau.emProducao ? (
        <p className="web-declaracao obs-declaracao" data-sai-em-producao={degrau.id}>
          Esta é a única procedência que <strong>não sobrevive</strong> ao bastidor entrar no ar.
          Ela existe porque a demonstração precisa ter o que mostrar, e ela encolhe a cada
          publicação de gente real — até não sobrar nada dela para contar.
        </p>
      ) : null}
    </li>
  );
}

export function ObservatorioProcedencia({
  dados,
  tela,
  telas,
}: {
  dados: DadosDaProcedencia;
  tela: TelaDaSuperficie;
  telas: readonly TelaDaSuperficie[];
}) {
  const { painel, eixo, hoje, emProducao } = dados;
  const autoradoEmNos = painel.entidades.find((f) => f.procedencia === "autorado");
  const autoradoEmArestas = painel.arestas.find((f) => f.procedencia === "autorado");

  return (
    <CascaDoObservatorio tela={tela} telas={telas}>
      <PainelDaProcedencia painel={painel} />

      {/* ---------------------------------------------------------------
          A FRASE QUE SUSTENTA A TELA, com os dois números que ela cita.
          --------------------------------------------------------------- */}
      <p className="obs-publico-declaracao" data-frase-da-invencao>
        {autoradoEmNos && autoradoEmArestas ? (
          <>
            <strong>{milhar(autoradoEmNos.n)}</strong> entidades e{" "}
            <strong>{milhar(autoradoEmArestas.n)}</strong> ligações desta plataforma nós
            inventamos. É por afirmar isto em voz alta, com o número contado ao lado, que todo o
            resto desta tela passa a ser verificável em vez de acreditável — e é a informação que
            um painel institucional comum não dá, porque dá-la parece fraqueza até o momento em
            que alguém pergunta.
          </>
        ) : (
          <>Nenhuma entidade autorada nesta geração do grafo — o painel acima conta o acervo inteiro.</>
        )}
      </p>

      {/* ---------------------------------------------------------------
          A CONFERÊNCIA DE TRÊS PONTAS, por extenso.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-conferencia-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-conferencia-titulo" className="obs-secao-titulo">
            A conferência de três pontas
          </h2>
        </div>
        <p className="obs-publico-nota">
          As fatias acima não são contadas uma vez. Elas são contadas <strong>três vezes</strong>,
          em processos independentes, e as três precisam concordar para esta tela abrir. Uma
          verificação que rodasse no fim já teria deixado o número errado passar pelo caminho
          todo — esta roda antes de qualquer fatia ser montada.
        </p>

        <ol className="obs-fontes" data-fontes-da-conferencia={painel.conferencia.fontes.length}>
          {painel.conferencia.fontes.map((fonte, i) => (
            <li key={fonte} className="obs-fonte">
              <span className="obs-etiqueta">fonte {i + 1}</span>
              {fonte}
            </li>
          ))}
        </ol>

        <ul className="web-denominadores obs-denominadores">
          <li className="web-denominador obs-denominador" data-denominador="conferencia:entidades">
            <span className="web-denominador-numero">{milhar(painel.conferencia.somaDeEntidades)}</span>
            <span className="web-denominador-rotulo">
              entidades somadas pelas fatias, contra {milhar(painel.conferencia.totalDeEntidades)}{" "}
              declaradas pelo acervo
            </span>
          </li>
          <li className="web-denominador obs-denominador" data-denominador="conferencia:arestas">
            <span className="web-denominador-numero">{milhar(painel.conferencia.somaDeArestas)}</span>
            <span className="web-denominador-rotulo">
              ligações somadas pelas fatias, contra {milhar(painel.conferencia.totalDeArestas)}{" "}
              declaradas pelo acervo
            </span>
          </li>
        </ul>

        <p className="web-declaracao obs-declaracao" data-se-nao-fechasse>
          <strong>E se não fechassem?</strong> O build quebra e a tela não abre. Não há aviso, não
          há número aproximado e não há fatia «outros» absorvendo a diferença. Uma fatia que não
          fecha é o sintoma de uma das três fontes ter envelhecido, e o módulo não tem como saber
          qual — exibir assim mesmo transformaria o painel de procedência de prova em decoração,
          que é exatamente o que ele existe para não ser. Grafo gerado em{" "}
          {painel.conferencia.geradoEm}.
        </p>
      </section>

      {/* ---------------------------------------------------------------
          O EIXO DO TEMPO — as procedências que existem e as que abrem.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-eixo-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-eixo-titulo" className="obs-secao-titulo">
            O vocabulário de procedência, no tempo
          </h2>
        </div>
        <p className="obs-publico-nota">
          Hoje o vocabulário tem <strong>{milhar(hoje)}</strong> valores; em produção ele tem{" "}
          <strong>{milhar(emProducao)}</strong>. E a diferença não é uma lista de opções a mais:{" "}
          <strong>cada valor novo é um papel humano</strong>. Os níveis de acesso não são uma
          camada de segurança sobre a ontologia — eles são o vocabulário de procedência, e é por
          isso que nenhum papel escreve sem deixar autor, admin incluído. As quatro que ainda não
          existem trazem <em>ainda não existe no vocabulário</em> em vez de zero, porque não
          existir é diferente de existir e medir zero.
        </p>

        <ul className="web-grade obs-eixo" data-eixo-do-tempo={eixo.length}>
          {eixo.map((d) => (
            <Degrau key={d.id} degrau={d} />
          ))}
        </ul>
      </section>
    </CascaDoObservatorio>
  );
}
