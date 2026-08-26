/**
 * admin-observabilidade.tsx — A6, procedência, cobertura e frescor do lado de quem opera.
 *
 * COMPONENTE DE SERVIDOR, e é o primeiro do Admin que não precisa ser cliente: esta tela não
 * escreve nada além do pedido de reprocessamento, que no protótipo é mockado e a tela diz
 * que é. Sem estado, sem `localStorage`, sem evento — nenhum motivo para mandar JavaScript
 * ao navegador.
 *
 * A CONFERÊNCIA DE TRÊS PONTAS APARECE AQUI ANTES DE DERRUBAR O BUILD. `observatorio.ts` já
 * compara a varredura do grafo com o `meta.json` e QUEBRA quando uma fatia não fecha — é ela
 * que protege o artefato. Só que quem opera descobre isso pelo build vermelho, sem saber
 * qual fatia. Esta tela mostra o resultado da mesma conferência, fechando ou não, com o que
 * foi comparado escrito por extenso.
 *
 * SEM RELÓGIO. O frescor é `geradoEm` do `meta.json` contra a data de referência do build,
 * nunca o relógio de quem avalia — numa tela cujo assunto é frescor, ler o relógio faria a
 * página exportada envelhecer sozinha e afirmar um atraso que não existe.
 */

import type { ObservabilidadeDoAdmin } from "@/dados/admin";

export function AdminObservabilidade({ dados }: { dados: ObservabilidadeDoAdmin }) {
  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <p className="studio-superficie">Admin · governança</p>
        <h1 className="studio-titulo">Observabilidade</h1>
        <p className="studio-objetivo">
          De onde vem cada fatia do acervo, o que está coberto, o que não está — e se as três
          contagens independentes do sistema concordam entre si.
        </p>
      </header>

      <Conferencia dados={dados} />

      <Frescor dados={dados} />

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">Cobertura, sempre com denominador</h2>
        </div>
        <p className="studio-nota">
          Nenhum número aqui aparece sozinho. «5.108 declaram» sem o total não diz se é muito
          ou pouco, e a fração é o que separa cobertura de anedota.
        </p>
        <ul className="studio-tabela">
          {dados.coberturas.map((c) => (
            <li className="studio-linha" key={c.id}>
              <span className="studio-celula studio-celula-rotulo">{c.rotulo}</span>
              <span className="studio-celula">
                <strong>{c.com}</strong> de {c.de} · {c.nota}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Procedencia dados={dados} />

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">Reprocessar o grafo não roda aqui</p>
        <p>{dados.reprocessamentoEhMockado}</p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A conferência — o que deveria aparecer aqui antes de derrubar o build
// ---------------------------------------------------------------------------

function Conferencia({ dados }: { dados: ObservabilidadeDoAdmin }) {
  const { conferencia } = dados;

  return (
    <section className="admin-parametro">
      <div className="admin-parametro-valor">
        <p className="studio-rotulo">Conferência de três pontas</p>
        <p className="admin-parametro-numero">{conferencia.fecha ? "fecha" : "não fecha"}</p>
        <p className="admin-parametro-decide">
          {conferencia.fecha
            ? "as três contagens concordam"
            : `${conferencia.divergencias.length} fatia(s) divergindo`}
        </p>
      </div>
      <div className="admin-medicao">
        <p className="studio-nota">{conferencia.oQueFoiConferido}</p>
        {conferencia.fecha ? (
          <p className="studio-nota">
            Uma fatia que não fecha derruba o build, e é assim que tem de ser: melhor não
            compilar do que exibir número que o próprio sistema não confirma. O que esta tela
            acrescenta é o aviso antes do vermelho, com o nome da fatia que não fechou.
          </p>
        ) : (
          <div className="studio-nao-sustenta">
            <p className="studio-nao-sustenta-rotulo">O que não fecha</p>
            <ul>
              {conferencia.divergencias.map((d) => (
                <li className="studio-literal" key={d}>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Frescor — a data do build, nunca o relógio de quem abre
// ---------------------------------------------------------------------------

function Frescor({ dados }: { dados: ObservabilidadeDoAdmin }) {
  return (
    <section className="admin-parametro">
      <div className="admin-parametro-valor">
        <p className="studio-rotulo">Frescor do acervo</p>
        <p className="admin-parametro-numero">{dados.diasEscritos}</p>
        <p className="admin-parametro-decide">entre a geração do grafo e a data de referência</p>
      </div>
      <div className="admin-medicao">
        <p className="studio-nota">
          O grafo foi gerado em {dados.geradoEmEscrito} e a data de referência do build é{" "}
          {dados.dataDeReferenciaEscrita}. A distância entre as duas é o que esta tela chama
          de frescor.
        </p>
        <p className="studio-nota">
          Não é o relógio de quem abre a página. Sob export estático o HTML sai da build: uma
          tela que lesse a hora do visitante afirmaria, meses depois, um atraso que o dado não
          tem — e envelheceria sozinha sem ninguém mexer em nada.
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Procedência — as fatias, e o que elas dizem sobre o trabalho que falta
// ---------------------------------------------------------------------------

function Procedencia({ dados }: { dados: ObservabilidadeDoAdmin }) {
  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">Procedência</h2>
        <span className="studio-pastilha">
          <span className="studio-pastilha-numero">{dados.totalDeNosEscrito}</span> nós ·{" "}
          <span className="studio-pastilha-numero">{dados.totalDeArestasEscrito}</span> ligações
        </span>
      </div>

      <p className="studio-nota">
        Quanto do acervo veio do Itaú Cultural, quanto o sistema derivou por regra e quanto
        foi autorado por gente. É a medida do trabalho que os sete níveis de bastidor existem
        para inverter: cada publicação de produtor, cada decisão de moderação e cada verbete
        de editor move uma fatia daqui.
      </p>

      <ul className="studio-tabela admin-procedencia">
        <li className="studio-linha">
          <span className="studio-celula studio-celula-rotulo">Procedência</span>
          <span className="studio-celula studio-celula-rotulo">Nós</span>
          <span className="studio-celula studio-celula-rotulo">Ligações</span>
        </li>
        {dados.procedencia.map((f) => (
          <li className="studio-linha" key={f.procedencia}>
            <span className="studio-celula studio-celula-rotulo">{f.rotulo}</span>
            <span className="studio-celula">
              {f.nosEscrito} · {f.percentualDeNos}
            </span>
            <span className="studio-celula">
              {f.arestasEscrito} · {f.percentualDeArestas}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
