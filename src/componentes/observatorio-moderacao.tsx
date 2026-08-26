import { CascaDoObservatorio } from "@/componentes/observatorio-casca";
import { CartaoDeIndicador, milhar } from "@/componentes/observatorio-indicador";
import type { DadosDaModeracao, TelaDaSuperficie } from "@/dados/observatorio";

/**
 * observatorio-moderacao.tsx — G8, a moderação lida de fora (funcionalidade 169).
 *
 * O GESTOR VÊ AGREGADO E ANONIMIZADO. Nome de moderador não aparece aqui, e a distinção
 * entre as três telas parecidas está escrita na própria tela porque confundi-las transforma
 * indicador em vigilância: M9 é do moderador para ele mesmo, A10 é do Admin para governar
 * quem modera, e esta é do Gestor para observar o SISTEMA de moderação. Só a do meio tem
 * nome, e ela não é esta.
 *
 * AS TRÊS AUSÊNCIAS DESTA TELA TÊM CAUSAS DIFERENTES, e ficam separadas de propósito —
 * é a mesma disciplina de `valor: null` contra `valor: 0` aplicada a por que o número falta:
 *
 *  - tempo de fila: o ACERVO não tem o campo. Nenhum registro carrega data de submissão, e a
 *    própria Moderação declara isso por escrito
 *  - volume decidido e taxa de veto: o dado EXISTE, e está do outro lado do DP-F. As decisões
 *    são gravadas no navegador de quem decidiu, e esta página roda no build
 *  - fila cruzada com a densidade: as duas pontas existem e não CASAM. A fila carrega título
 *    de município, a densidade conta unidade federativa, e casar as duas pelo nome seria a
 *    falsa equivalência que esta superfície inteira existe para não cometer
 *
 * Achatar as três num «não temos» só apagaria a informação de que uma tem solução de
 * contrato, outra depende do acervo mudar e a terceira é uma tela em outro lugar.
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO.
 */
export function ObservatorioModeracao({
  dados,
  tela,
  telas,
}: {
  dados: DadosDaModeracao;
  tela: TelaDaSuperficie;
  telas: readonly TelaDaSuperficie[];
}) {
  const d = dados;

  return (
    <CascaDoObservatorio tela={tela} telas={telas}>
      <p className="obs-publico-declaracao" data-agregado-e-anonimo>
        Esta tela lê a moderação <strong>agregada e anonimizada</strong>. Nenhum nome de
        moderador aparece aqui, em nenhuma linha — e a ausência é a definição do nível, não uma
        omissão: o Gestor observa <strong>o sistema</strong> de moderação, e observar pessoas é
        de outro nível e de outra tela.
      </p>

      {/* ---------------------------------------------------------------
          AS TRÊS TELAS PARECIDAS, e por que elas não podem virar uma.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-tres-telas">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-tres-telas" className="obs-secao-titulo">
            Três telas parecidas, e uma só delas é esta
          </h2>
        </div>
        <p className="obs-publico-nota">
          Confundir as três transforma indicador em vigilância. A do moderador tem nome porque o
          nome é dele; a do Admin tem nome porque governar quem modera exige saber quem modera;
          esta não tem nome nenhum, e é por isso que ela pode existir.
        </p>
        <div className="obs-tabela-uf" data-tres-telas={d.asTresTelas.length}>
          <table className="obs-uf">
            <thead>
              <tr>
                <th scope="col">tela</th>
                <th scope="col">de quem</th>
                <th scope="col">o que mede</th>
              </tr>
            </thead>
            <tbody>
              {d.asTresTelas.map((linha) => (
                <tr key={linha.tela} data-tela-parecida={linha.tela}>
                  <th scope="row">{linha.tela}</th>
                  <td>{linha.deQuem}</td>
                  <td>{linha.oQueMede}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          O QUE ESTA TELA MEDE: a composição da fila.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-composicao-da-fila">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-composicao-da-fila" className="obs-secao-titulo">
            A composição da fila
          </h2>
        </div>
        <p className="obs-publico-nota">
          São <strong>{milhar(d.fila)}</strong> itens na fila, e{" "}
          <strong>{milhar(d.semTerritorio)}</strong> deles não têm território nenhum — o que já é
          um diagnóstico: fila de moderação sem território não pode ser recortada por região, e um
          escopo territorial sobre ela alcança menos do que parece.
        </p>

        <ul className="obs-metodos" data-escopos={d.porEscopo.length}>
          {d.porEscopo.map((e) => (
            <li key={e.rotulo} className="obs-metodo" data-escopo-da-fila={e.rotulo}>
              <span className="obs-metodo-rotulo">{e.rotulo}</span>
              <span className="obs-trilho" aria-hidden="true">
                <span
                  className="obs-barra obs-barra-buraco"
                  style={{ width: `${e.de > 0 ? (((e.valor ?? 0) / e.de) * 100).toFixed(2) : 0}%` }}
                />
              </span>
              <span className="obs-detalhe-valor">
                {milhar(e.valor ?? 0)}
                <span className="obs-detalhe-de"> de {milhar(e.de)}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="obs-tabela-uf" data-territorios-da-fila={d.porTerritorio.length}>
          <table className="obs-uf">
            <caption className="obs-uf-legenda">
              Os {milhar(d.porTerritorio.length)} territórios que aparecem na fila, e a marca de
              quais sequer coincidem com o nome de uma unidade federativa. Coincidir não é ser.
            </caption>
            <thead>
              <tr>
                <th scope="col">território</th>
                <th scope="col">itens na fila</th>
                <th scope="col">coincide com UF?</th>
              </tr>
            </thead>
            <tbody>
              {d.porTerritorio.map((t) => (
                <tr
                  key={t.titulo}
                  data-territorio-da-fila={t.titulo}
                  data-no-grafo={t.coincideComUf ? "sim" : "nao"}
                >
                  <th scope="row">{t.titulo}</th>
                  <td>{milhar(t.naFila)}</td>
                  <td>{t.coincideComUf ? "o nome coincide" : "não é unidade federativa"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          O QUE ELA NÃO MEDE, e as três razões DIFERENTES.
          --------------------------------------------------------------- */}
      <section className="obs-recorte obs-par" aria-labelledby="obs-moderacao-sem-lastro">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-moderacao-sem-lastro" className="obs-secao-titulo">
            O que ela não mede, e as três razões são diferentes
          </h2>
        </div>
        <p className="obs-publico-nota">
          Uma falta porque <strong>o acervo não tem o campo</strong>; outra porque{" "}
          <strong>o dado existe do outro lado da fronteira</strong>, no navegador de quem decidiu;
          a terceira porque <strong>as duas pontas existem e não casam</strong>. Achatar as três
          num «não temos» apagaria a informação de que uma tem solução de contrato, outra depende
          do acervo mudar e a terceira é uma tela em outro lugar.
        </p>
        <ul className="web-grade obs-indicadores" data-sem-lastro={d.semLastro.length}>
          {d.semLastro.map((i) => (
            <CartaoDeIndicador key={i.id} indicador={i} destacado={false} primeiro={false} />
          ))}
        </ul>
      </section>
    </CascaDoObservatorio>
  );
}
