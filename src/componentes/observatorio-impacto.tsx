import { CascaDoObservatorio } from "@/componentes/observatorio-casca";
import { CartaoDeIndicador, milhar } from "@/componentes/observatorio-indicador";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import type { DadosDoImpacto, PersonaNoImpacto, TelaDaSuperficie } from "@/dados/observatorio";

/**
 * observatorio-impacto.tsx — G3, a tela onde D-90 deixa de ser tipagem e vira interface.
 *
 * ESTA É A TELA MAIS IMPORTANTE DA SUPERFÍCIE, e não porque o indicador seja o mais bonito.
 * É aqui que as duas formas de não ter número aparecem LADO A LADO, e é o arranjo lado a
 * lado que faz o argumento: separadas por uma rolagem, «zero» e «o dado não sustenta»
 * viram a mesma coisa na cabeça de quem lê, e a distinção que o tipo protege desde D-90
 * morre na tela — sem sintoma, e sem que ninguém saiba sobre qual das duas o painel mentiu.
 *
 * O PAR É ESCOLHIDO POR REGRA. `montarImpacto()` recorta a persona cuja descoberta de
 * artista novo deu zero, e devolve `null` quando nenhuma deu — e aí a tela DIZ que o par
 * não existe hoje, em vez de eleger outra persona para o exemplo continuar de pé. Um
 * exemplo escolhido à mão é literal disfarçado: ele continua afirmando depois que o dado
 * deixou de sustentá-lo.
 *
 * O DENOMINADOR DO CONJUNTO SÃO TRÊS PESSOAS AUTORADAS, e ele abre a tela em vez de fechar.
 * Um indicador de impacto sobre 3 pessoas é demonstração, não medição, e quem avalia
 * precisa saber disso antes de ler o primeiro número — não depois, em nota de rodapé.
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO.
 */

/**
 * Quantos selos de linguagem cabem numa coluna sem empurrar o resto da tela para fora.
 * Doze é o teto medido; o que importa é que ele é DECLARADO quando morde.
 */
const TETO_DE_SELOS = 12;

function LinhaDaPersona({ persona }: { persona: PersonaNoImpacto }) {
  return (
    <li className="web-painel obs-persona" data-persona-do-impacto={persona.id}>
      <h3 className="obs-indicador-titulo">{persona.nome}</h3>

      <p className="obs-valor">
        <span className="obs-numero">{milhar(persona.atravessadas)}</span>
        <span className="obs-unidade">linguagens atravessadas</span>
      </p>

      <ul className="web-denominadores obs-denominadores">
        <li className="web-denominador obs-denominador" data-denominador={`${persona.id}:declaradas`}>
          <span className="web-denominador-numero">{milhar(persona.declaradas)}</span>
          <span className="web-denominador-rotulo">
            linguagens que o repertório dela declara — a travessia é a diferença entre as duas
          </span>
        </li>
        <li className="web-denominador obs-denominador" data-denominador={`${persona.id}:repertorio`}>
          <span className="web-denominador-numero">{milhar(persona.entidadesNoRepertorio)}</span>
          <span className="web-denominador-rotulo">entidades no repertório, de onde a travessia parte</span>
        </li>
        <li className="web-denominador obs-denominador" data-denominador={`${persona.id}:adjacente`}>
          <span className="web-denominador-numero">{milhar(persona.adjacentes)}</span>
          <span className="web-denominador-rotulo">
            entidades a um salto, das quais {milhar(persona.artistasNovos)} são pessoa ou coletivo fora do
            repertório
          </span>
        </li>
      </ul>

      {/* A diversidade que o RFP pede, medida: linguagem presente no adjacente e ausente do
          atravessado. É a lista do que ela ainda não viu e está encostado no que ela viu.

          A LISTA DIZ QUANDO NÃO CABE INTEIRA. Uma lista cortada que não declara o corte é a
          versão de interface do zero silencioso que esta superfície inteira combate no dado:
          a tela SABE que são quinze e mostra doze, e quem lê sai com doze. O teto existe
          porque uma persona com quarenta linguagens novas empurraria o resto da tela para
          fora; o que não pode é o teto ser secreto. */}
      <div className="obs-novas">
        <p className="obs-etiqueta">
          {persona.novas.length === 0
            ? "nenhuma linguagem nova no adjacente — o que está encostado já é do repertório dela"
            : persona.novas.length > TETO_DE_SELOS
              ? `${milhar(TETO_DE_SELOS)} das ${milhar(persona.novas.length)} linguagens novas no adjacente — a lista não cabe inteira e o resto não está aqui`
              : `${milhar(persona.novas.length)} linguagens novas no adjacente`}
        </p>
        {persona.novas.length > 0 ? (
          <SelosDeLinguagem ids={persona.novas} limite={TETO_DE_SELOS} />
        ) : null}
      </div>
    </li>
  );
}

export function ObservatorioImpacto({
  dados,
  tela,
  telas,
}: {
  dados: DadosDoImpacto;
  tela: TelaDaSuperficie;
  telas: readonly TelaDaSuperficie[];
}) {
  const { personas, ampliacao, descoberta, zeroMedido, semLastro, denominador } = dados;

  return (
    <CascaDoObservatorio tela={tela} telas={telas}>
      {/* ---------------------------------------------------------------
          O DENOMINADOR DO CONJUNTO, antes do primeiro número.
          --------------------------------------------------------------- */}
      <p className="obs-publico-declaracao" data-denominador-do-conjunto="impacto">
        Tudo nesta tela é medido sobre <strong>{milhar(denominador.n)}</strong> {denominador.do_que}. O
        cálculo é o mesmo que rodaria sobre gente real e não muda de forma; o que muda é o n, e o n
        está aqui em cima.
      </p>

      {/* ---------------------------------------------------------------
          O PAR DE D-90 — as duas formas de não ter número, lado a lado.
          --------------------------------------------------------------- */}
      <section className="obs-par" data-par-d90 aria-labelledby="obs-par-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-par-titulo" className="obs-secao-titulo">
            Duas formas de não ter número, e elas não são a mesma
          </h2>
        </div>
        <p className="obs-publico-nota">
          À esquerda, um corte que <strong>funcionou e deu zero</strong>: o adjacente existe, foi
          percorrido, e nele não há artista novo. À direita, um corte que{" "}
          <strong>não recorta nada</strong>: o campo está vazio no acervo inteiro, e desenhar
          qualquer barra ali seria afirmar sobre o mundo uma coisa que só o vazio do dado sustenta.
          As duas convivem neste acervo e a tela mostra as duas, em vez de mostrar só as que
          fecham bonito.
        </p>

        <ul className="web-grade obs-indicadores" data-par-de-indicadores="d90">
          {zeroMedido ? (
            <CartaoDeIndicador indicador={zeroMedido} destacado primeiro={false} />
          ) : (
            <li className="web-painel obs-indicador" data-par-vazio="sem-zero-medido">
              <h3 className="obs-indicador-titulo">Nenhuma persona deu zero nesta geração do grafo</h3>
              <p className="obs-indicador-leitura">
                O par didático de D-90 precisa de um zero MEDIDO, e a regra que o escolhe é «a
                persona cuja descoberta de artista novo deu zero». Nesta geração do acervo nenhuma
                deu, e a tela diz isso em vez de eleger outra persona para o exemplo continuar de pé.
              </p>
            </li>
          )}
          <CartaoDeIndicador indicador={semLastro} destacado primeiro={false} />
        </ul>
      </section>

      {/* ---------------------------------------------------------------
          AMPLIAÇÃO DE REPERTÓRIO — o indicador que o RFP pede.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-ampliacao-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-ampliacao-titulo" className="obs-secao-titulo">
            Ampliação de repertório
          </h2>
        </div>
        <p className="obs-publico-nota">
          É dela que sai a métrica de impacto do RFP, e é por causa dela que{" "}
          <strong>Repertório é entidade de primeira classe desde o dia um</strong>: métrica de
          impacto não pode ser puxadinho de analytics. O que ela mede é a diferença entre o que
          cada pessoa declarou gostar e o que as coisas que ela guardou realmente carregam.
        </p>

        <ul className="web-grade obs-indicadores">
          <CartaoDeIndicador indicador={ampliacao} destacado primeiro />
          <CartaoDeIndicador indicador={descoberta} destacado={false} primeiro={false} />
        </ul>
      </section>

      {/* ---------------------------------------------------------------
          AS TRÊS PERSONAS, uma a uma.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-personas-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-personas-titulo" className="obs-secao-titulo">
            As três personas, uma a uma
          </h2>
        </div>
        <ul className="web-grade obs-personas">
          {personas.map((p) => (
            <LinhaDaPersona key={p.id} persona={p} />
          ))}
        </ul>
      </section>
    </CascaDoObservatorio>
  );
}
