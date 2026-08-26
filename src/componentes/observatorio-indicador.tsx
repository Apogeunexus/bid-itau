import clsx from "clsx";
import type { Indicador } from "@/dados/observatorio";

/**
 * observatorio-indicador.tsx — o cartão de um indicador, e o par de D-90 que ele desenha.
 *
 * ELE MORA FORA DA TELA RAIZ DESDE A G3. A superfície tem oito telas e sete delas exibem
 * indicador; um cartão copiado por tela seria sete lugares onde a distinção entre «o dado
 * não sustenta» e «a medida deu zero» pode ser achatada por descuido, uma tela de cada vez.
 * Um componente só é o que faz «as outras telas copiam o tratamento visual da G3» ser
 * verdade por construção em vez de por disciplina.
 *
 * O QUE O CARTÃO GARANTE, E É O PORTÃO DA SESSÃO INTEIRA:
 *  - `valor: null` nunca vira «0» na tela: ele vira a frase «o dado não sustenta»
 *  - `valor: 0` com `sustentado: true` vira o número zero COM a etiqueta de medida ao lado,
 *    porque um zero solitário é lido como ausência por quem passa o olho
 *  - o denominador aparece sustentado ou não, sempre, sob o número e nunca em rodapé
 *  - indicador sem lastro NÃO desenha barra nenhuma, nem trilho vazio: um trilho é um
 *    gráfico, e um gráfico afirma escala
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO.
 */

/**
 * Separador de milhar escrito à mão, e não `toLocaleString`.
 *
 * `toLocaleString("pt-BR")` depende do ICU do ambiente: o Node do build e o navegador de
 * quem avalia podem formatar diferente, e o React acusaria divergência de hidratação num
 * número que é o argumento da tela. Uma função pura de dez caracteres não tem esse risco.
 */
export function milhar(n: number): string {
  const [inteiro, decimal] = String(n).split(".");
  const agrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimal ? `${agrupado},${decimal}` : agrupado;
}

function Denominador({
  id,
  chave,
  n,
  do_que,
}: {
  id: string;
  chave: string;
  n: number;
  do_que: string;
}) {
  return (
    <li className="web-denominador obs-denominador" data-denominador={`${id}:${chave}`}>
      <span className="web-denominador-numero">{milhar(n)}</span>
      <span className="web-denominador-rotulo">{do_que}</span>
    </li>
  );
}

export function CartaoDeIndicador({
  indicador,
  destacado,
  primeiro,
}: {
  indicador: Indicador;
  destacado: boolean;
  primeiro: boolean;
}) {
  const i = indicador;
  return (
    <li
      data-indicador={i.id}
      data-sustentado={i.sustentado ? "sim" : "nao"}
      data-destaque={destacado ? "sim" : "nao"}
      className={clsx("web-painel obs-indicador", primeiro && "web-grade-largo")}
    >
      <h3 className="obs-indicador-titulo">{i.rotulo}</h3>

      <p className="obs-valor">
        {i.valor === null ? (
          <span className="obs-sem-lastro">o dado não sustenta</span>
        ) : (
          <span className="obs-numero">{milhar(i.valor)}</span>
        )}
        <span className="obs-unidade">{i.unidade}</span>
      </p>

      {/* O ZERO MEDIDO PRECISA DIZER QUE É MEDIDA, e esta etiqueta é a G3 virando regra.
          Um «0» sozinho ao lado de um «o dado não sustenta» na mesma tela é lido como a
          mesma coisa por quem passa o olho — e as duas afirmações são opostas: uma diz que
          o corte funcionou e deu zero, a outra diz que o corte não recorta nada. O tipo já
          separa as duas desde D-90; sem esta linha, a tela achatava o que o tipo separou. */}
      {i.sustentado && i.valor === 0 ? (
        <p className="obs-selo-medida" data-zero-medido={i.id}>
          zero medido — o corte recortou {milhar(i.denominador.n)}{" "}
          {i.denominador.do_que.split(" —")[0]} e o resultado foi zero
        </p>
      ) : null}

      {/* Os denominadores são PRODUTO e aparecem sustentado ou não. «Um indicador sem lastro
          não some e não aparece zerado: ele aparece dizendo quantos de quantos.» */}
      <ul className="web-denominadores obs-denominadores">
        <Denominador id={i.id} chave="principal" n={i.denominador.n} do_que={i.denominador.do_que} />
        {i.denominadorSecundario ? (
          <Denominador
            id={i.id}
            chave="secundario"
            n={i.denominadorSecundario.n}
            do_que={i.denominadorSecundario.do_que}
          />
        ) : null}
      </ul>

      {!i.sustentado && i.declaracao ? (
        <p data-nao-sustenta={i.id} className="web-declaracao obs-declaracao">
          {i.declaracao}
        </p>
      ) : null}

      <p className="obs-indicador-leitura">{i.leitura}</p>

      {/* AS BARRAS DE DETALHE SÓ EXISTEM ONDE O DADO SUSTENTA O INDICADOR, e isto é
          conserto de um defeito medido, não preferência. Com barra, a linha «ocorrências
          marcadas gratuitas · 2.425 de 2.425» desenhava uma barra CHEIA — que é
          exatamente «a barra de 100% gratuito» que D-90 proíbe. O denominador ao lado não
          desfaz a imagem: quem passa o olho lê a barra, não a fração, e sai com a
          impressão de que o acervo é todo gratuito. Onde o corte não recorta, o detalhe
          fica em número e denominador, sem desenho. */}
      {i.detalhe.length ? (
        <ul className="obs-detalhe" data-com-barra={i.sustentado ? "sim" : "nao"}>
          {i.detalhe.map((l) => (
            <li key={`${i.id}-${l.rotulo}`} className="obs-detalhe-linha" title={l.nota}>
              <span className="obs-detalhe-rotulo">{l.rotulo}</span>
              {i.sustentado ? (
                <span className="obs-detalhe-trilho">
                  <span
                    className="obs-detalhe-barra"
                    style={{ width: `${l.de > 0 ? ((l.valor ?? 0) / l.de) * 100 : 0}%` }}
                  />
                </span>
              ) : (
                <span className="obs-detalhe-sem-barra">não recorta</span>
              )}
              <span className="obs-detalhe-valor">
                {milhar(l.valor ?? 0)}
                <span className="obs-detalhe-de"> de {milhar(l.de)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="obs-origem">
        <span className="obs-etiqueta">origem do número</span>
        {i.procedenciaDoNumero}
      </p>
    </li>
  );
}
