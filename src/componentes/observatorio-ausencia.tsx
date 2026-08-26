import { CascaDoObservatorio } from "@/componentes/observatorio-casca";
import { milhar } from "@/componentes/observatorio-indicador";
import type { AusenciaDeclarada, TelaDaSuperficie } from "@/dados/observatorio";

/**
 * observatorio-ausencia.tsx — G6, a tela dedicada ao que o acervo não sabe.
 *
 * NENHUM CONCORRENTE VAI TER UMA TELA DEDICADA AO QUE NÃO SABE, e é justamente por ter uma
 * que os outros números desta superfície ficam confiáveis. Uma proposta que só mostra o que
 * fecha bonito obriga quem avalia a descobrir sozinho o que falta — e quem avalia sempre
 * descobre, só que aí a descoberta vira desconfiança sobre o resto.
 *
 * A COLUNA DA DIREITA É O QUE SEPARA ESTA TELA DE UMA LISTA DE DESCULPAS. Cada buraco tem
 * um DONO nomeado entre os oito níveis de acesso e uma projeção do que o número vira quando
 * aquele nível entrar no ar. Sem as duas, isto seria «não temos esse dado» oito vezes; com
 * elas, é o plano de trabalho do bastidor inteiro, escrito em números que mudam sozinhos.
 *
 * O ZERO AQUI É SEMPRE MEDIDO, e por isso aparece como zero. É o outro lado do par de D-90:
 * na G3, «o dado não sustenta» é o que NÃO se pode contar; aqui tudo se contou, e o
 * resultado foi zero em seis dos oito. Uma tela que escondesse esses zeros por serem feios
 * estaria escondendo exatamente a informação pela qual o bastidor existe.
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO.
 */

function Ausencia({ ausencia }: { ausencia: AusenciaDeclarada }) {
  const a = ausencia;
  const faltam = a.de - a.quantos;
  const proporcao = a.de > 0 ? (a.quantos / a.de) * 100 : 0;

  return (
    <li className="web-painel obs-ausencia" data-ausencia={a.id}>
      <div className="obs-ausencia-medida">
        <h3 className="obs-indicador-titulo">{a.rotulo}</h3>

        <p className="obs-valor">
          <span className="obs-numero">{milhar(a.quantos)}</span>
          <span className="obs-unidade">de {milhar(a.de)} {a.do_que}</span>
        </p>

        {/* A BARRA SÓ EXISTE ONDE HÁ PROPORÇÃO PARA MOSTRAR, e é o mesmo tratamento da G3.
            Medido em navegador: com barra em todas, os seis buracos totais desenhavam uma
            faixa CHEIA na cor de ação — e faixa cheia em laranja lê como meta batida, que é
            o oposto do que a linha diz. Era a «barra de 100% gratuito» que D-90 proíbe,
            cometida do outro lado. Onde o preenchimento é zero, o número já disse tudo, e o
            que entra no lugar é a etiqueta que afirma que o zero foi MEDIDO. */}
        {a.quantos > 0 ? (
          <>
            <span className="obs-trilho" aria-hidden="true">
              <span
                className="obs-barra obs-barra-buraco"
                style={{ width: `${(100 - proporcao).toFixed(2)}%` }}
              />
            </span>
            <ul className="web-denominadores obs-denominadores">
              <li className="web-denominador obs-denominador" data-denominador={`${a.id}:falta`}>
                <span className="web-denominador-numero">{milhar(faltam)}</span>
                <span className="web-denominador-rotulo">
                  é o tamanho do buraco — o que existe, contado, é {milhar(a.quantos)}
                </span>
              </li>
            </ul>
          </>
        ) : (
          <p className="obs-selo-medida" data-zero-medido={a.id}>
            zero medido — o campo existe, as {milhar(a.de)} foram varridas uma a uma, e nenhuma
            o preencheu
          </p>
        )}

        <p className="obs-origem">
          <span className="obs-etiqueta">origem do número</span>
          {a.procedenciaDoNumero}
        </p>
      </div>

      <div className="obs-ausencia-plano">
        <p className="obs-ausencia-nivel">
          <span className="obs-etiqueta">quem preenche</span>
          {a.nivelQuePreenche}
        </p>
        <p className="obs-ausencia-projecao">
          <span className="obs-etiqueta">e aí este número vira</span>
          {a.projecao}
        </p>
      </div>
    </li>
  );
}

export function ObservatorioAusencia({
  ausencias,
  tela,
  telas,
}: {
  ausencias: AusenciaDeclarada[];
  tela: TelaDaSuperficie;
  telas: readonly TelaDaSuperficie[];
}) {
  const zerados = ausencias.filter((a) => a.quantos === 0).length;

  return (
    <CascaDoObservatorio tela={tela} telas={telas}>
      <p className="obs-publico-declaracao" data-declaracao-da-ausencia>
        São <strong>{milhar(ausencias.length)}</strong> ausências medidas, e{" "}
        <strong>{milhar(zerados)}</strong> delas dão exatamente zero. Todas foram CONTADAS: o
        zero aqui é medida, não falta de leitura — o campo existe, foi varrido, e ninguém o
        preencheu. E cada uma traz o nível de acesso que a preencheria, porque uma lista de
        buracos sem dono é uma lista de desculpas.
      </p>

      <ul className="obs-ausencias" data-ausencias={ausencias.length}>
        {ausencias.map((a) => (
          <Ausencia key={a.id} ausencia={a} />
        ))}
      </ul>

      <p className="web-declaracao obs-declaracao" data-o-que-esta-tela-prova>
        Esta lista inteira é o argumento de que os outros números desta superfície são
        confiáveis. Uma proposta que só mostrasse o que fecha bonito obrigaria quem avalia a
        descobrir sozinho o que falta — e quem avalia sempre descobre, só que aí a descoberta
        vira desconfiança sobre o resto. <strong>O bastidor é o mecanismo</strong> pelo qual
        cada linha acima muda de valor sem ninguém tocar em código.
      </p>
    </CascaDoObservatorio>
  );
}
