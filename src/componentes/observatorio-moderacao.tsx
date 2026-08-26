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
 * Achatar as duas num «não temos» só apagaria a informação de que uma depende do acervo
 * mudar e a outra é uma tela em outro lugar.
 *
 * O CRUZAMENTO ENTRE FILA E DENSIDADE FECHA, e é por SIGLA e não por título. A fila também
 * carrega o título do território que alcança o item, e esses títulos são municípios e
 * cidades estrangeiras — casá-los com a densidade pelo nome faria «São Paulo» da fila
 * encontrar os registros do ESTADO. `ItemDaFila.uf` resolve a unidade federativa descendo a
 * hierarquia territorial pela mesma travessia que `densidadePorUf()` usa, e por isso o
 * número vale. O denominador é a parte RESOLVIDA da fila, nunca a fila inteira.
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
          <strong>{milhar(d.semUf)}</strong> deles o acervo não situa em unidade federativa
          nenhuma — o que já é um diagnóstico: fila de moderação sem território não pode ser
          recortada por região, e um escopo territorial sobre ela alcança menos do que parece.
          Destes, <strong>{milhar(d.comTerritorioSemUf)}</strong> até trazem um título de
          território, só que um que não é do Brasil.
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

      </section>

      {/* ---------------------------------------------------------------
          O CRUZAMENTO — a leitura que só existe nesta tela.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-cruzamento">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-cruzamento" className="obs-secao-titulo">
            Fila parada onde o acervo é magro
          </h2>
        </div>
        <p className="obs-publico-nota">
          É a única leitura desta superfície que <strong>não existe em nenhuma outra tela do
          projeto</strong>: a Moderação vê a própria fila e não vê a densidade do acervo; o Admin
          vê a máquina e não vê o acervo. Só aqui os dois números convivem — e é o cruzamento
          deles que separa <strong>abandono</strong> de <strong>calmaria</strong>. A tabela está
          ordenada pelo acervo, do mais magro ao mais cheio.
        </p>
        <ul className="web-grade obs-indicadores">
          <CartaoDeIndicador indicador={d.cruzamento} destacado primeiro />
        </ul>

        <div className="obs-tabela-uf" data-ufs-da-fila={d.porUf.length}>
          <table className="obs-uf">
            <caption className="obs-uf-legenda">
              As {milhar(d.porUf.length)} unidades federativas com item na fila, resolvidas pela
              descida da hierarquia territorial — a mesma travessia que mede a densidade, e não
              comparação de nome.
            </caption>
            <thead>
              <tr>
                <th scope="col">UF</th>
                <th scope="col">itens na fila</th>
                <th scope="col">registros no acervo</th>
              </tr>
            </thead>
            <tbody>
              {d.porUf.map((u) => (
                <tr key={u.sigla} data-uf-da-fila={u.sigla}>
                  <th scope="row">{u.sigla}</th>
                  <td>{milhar(u.naFila)}</td>
                  <td>{milhar(u.registrosNoAcervo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          O QUE ELA NÃO MEDE, e as duas razões DIFERENTES.
          --------------------------------------------------------------- */}
      <section className="obs-recorte obs-par" aria-labelledby="obs-moderacao-sem-lastro">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-moderacao-sem-lastro" className="obs-secao-titulo">
            O que ela não mede, e as duas razões são diferentes
          </h2>
        </div>
        <p className="obs-publico-nota">
          Uma falta porque <strong>o acervo não tem o campo</strong> — nenhum registro carrega
          data de submissão, e a própria Moderação declara isso por escrito. A outra porque{" "}
          <strong>o dado existe do outro lado da fronteira</strong>, no navegador de quem decidiu,
          e esta página roda no build. Achatar as duas num «não temos» apagaria a informação de
          que uma depende do acervo mudar e a outra é uma tela em outro lugar.
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
