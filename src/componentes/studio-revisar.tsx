"use client";

import { useStudio } from "@/componentes/studio-estado";
import { Literal } from "@/componentes/studio-literal";
import { SeletorDeRegistro } from "@/componentes/studio-seletor";
import { dataCurta, quandoPorExtenso } from "@/componentes/studio-datas";
import {
  DIMENSOES_DE_ACESSIBILIDADE,
  EXPLICACAO_DA_SITUACAO,
  NENHUMA_PORTA_BLOQUEIA,
  PORTAS,
  ROTULO_DA_FAIXA,
  ROTULO_DA_SITUACAO,
  ROTULO_DO_CANAL,
  algumaDimensaoMarcada,
  chaveDaSessao,
  chaveDoEvento,
  conversaoDoEnvio,
  partesDaChave,
  scoreDoRascunho,
} from "@/dados/tipos-acesso";
import type { MedidasDoAcervo, RascunhoDoProdutor } from "@/dados/tipos-acesso";
import type { CatalogoDeEspacos } from "@/dados/mock/seed";

/**
 * studio-revisar.tsx — P8 · revisão e envio (funcionalidades 153 e 164).
 *
 * **O FECHO DA JORNADA, E A TELA QUE MAIS FALA COM QUEM AVALIA.** Ela não acrescenta campo
 * nenhum: mostra, campo a campo e na ordem da ontologia, o que os sete atos anteriores
 * escreveram — e depois carimba.
 *
 * O QUADRO DE CONVERSÃO É O ARGUMENTO, não uma ilustração dele. Cada linha compara o que o
 * acervo mede hoje com o que este envio muda, e os números do «antes» vêm medidos sobre o
 * grafo. Um literal digitado ali faria a apresentação afirmar, na primeira regeração, número
 * que o acervo não sustenta — e nesta tela isso seria a contradição mais visível de todas.
 *
 * O ENVIO CARIMBA AUTOR E DATA, NUNCA ANÔNIMO. §3 da ontologia: nenhum papel escreve sem
 * deixar autor, admin incluído. A data é `DATA_DE_REFERENCIA`, não o relógio de quem abre a
 * página — ler o relógio exporia o fuso de quem avalia e faria a tela mudar entre dois
 * carregamentos.
 *
 * AS TRÊS PORTAS NÃO BLOQUEIAM, e aparecem nomeadas com o nível responsável. Travar o envio
 * por uma pendência que é de outro nível faria o produtor esperar por quem ele não controla,
 * e a demonstração pararia no meio.
 *
 * MÓDULO DE CLIENTE: `@/dados/mock/seed` entra **apenas por tipo** (DP-F).
 */

interface Props {
  catalogo: CatalogoDeEspacos;
  semente: RascunhoDoProdutor[];
  situacaoEAutorada: string;
  /** Medidos sobre o grafo — o «antes» de cada linha da conversão. */
  numeros: MedidasDoAcervo;
  /** Onde a decisão continua, do outro lado. A S3 é quem constrói essa rota. */
  rotaDaModeracao: string;
}

export function StudioRevisar({
  catalogo,
  semente,
  situacaoEAutorada,
  numeros,
  rotaDaModeracao,
}: Props) {
  const studio = useStudio(semente, {
    dataDeReferencia: catalogo.dataDeReferencia,
    autor: catalogo.produtor,
    organizacao: catalogo.organizacao,
  });
  const { pronto, rascunhos, atual, editavelAgora } = studio;

  if (!pronto || atual === null) {
    return (
      <p className="studio-nota" data-carregando>
        Lendo o que você já tinha escrito…
      </p>
    );
  }

  const score = scoreDoRascunho(atual);
  const { componentes } = chaveDoEvento(atual.titulo, atual.fonte, atual.obraTitulo);
  const sustentados = componentes.filter((c) => c.sustentado).length;
  const conversao = conversaoDoEnvio(atual, numeros);
  const pendencias = atual.pendencias;
  const jaEnviado = atual.situacao === "em-moderacao";

  const enviar = () => {
    studio.mudarSituacao(atual.id, "em-moderacao");
    // A entrada de histórico reusa o DTO existente: campo, de, para, quem e quando. É o
    // mesmo registro que a tela de ocorrências exibe, e por isso o histórico da jornada e o
    // das alterações pós-publicação são um só, e não dois formatos que ninguém junta.
    studio.alterarId(atual.id, {
      historico: [
        ...atual.historico,
        {
          ocorrenciaId: atual.id,
          eventoId: atual.id,
          eventoTitulo: atual.titulo,
          campo: "situacao", // smaug-ignore ui-strings: nome de campo do contrato
          campoRotulo: "situação",
          de: ROTULO_DA_SITUACAO[atual.situacao],
          para: ROTULO_DA_SITUACAO["em-moderacao"],
          dataDaSessao: dataCurta(catalogo.dataDeReferencia),
          quem: atual.autor,
          quando: dataCurta(catalogo.dataDeReferencia),
          origem: "operador",
          frase: null,
          rotaDoOutroLado: rotaDaModeracao,
        },
      ],
    });
  };

  return (
    <div className="studio-jornada">
      <SeletorDeRegistro
        rascunhos={rascunhos}
        atual={atual}
        aoEscolher={studio.escolher}
        aoCriar={() => studio.criar()}
        aoReiniciar={studio.reiniciar}
        situacaoEAutorada={situacaoEAutorada}
      />

      {jaEnviado ? (
        <DepoisDoEnvio rascunho={atual} rotaDaModeracao={rotaDaModeracao} />
      ) : null}

      <div className="web-duas-colunas">
        {/* =============== a ficha, na ordem da ontologia =============== */}
        <div className="studio-forma">
          {!editavelAgora && !jaEnviado ? (
            <p className="studio-travado" data-situacao={atual.situacao}>
              <strong>{ROTULO_DA_SITUACAO[atual.situacao]}.</strong>{" "}
              {EXPLICACAO_DA_SITUACAO[atual.situacao]}
            </p>
          ) : null}

          {atual.motivoDaDevolucao ? (
            <p className="studio-travado" data-motivo>
              <strong>A moderação escreveu:</strong> {atual.motivoDaDevolucao}
            </p>
          ) : null}

          <Ficha rascunho={atual} catalogo={catalogo} />
        </div>

        {/* =============== o argumento, à direita =============== */}
        <aside className="web-colada studio-vivo">
          <section className="web-painel" data-chave={sustentados}>
            <h2 className="web-painel-titulo">A chave de identidade final</h2>
            <p className="studio-chave-conta">
              <strong className="studio-chave-numero">{sustentados} de 3</strong> componentes
            </p>
            <ul className="web-lista-densa">
              {componentes.map((c) => (
                <li
                  key={c.campo}
                  className="studio-componente"
                  data-sustentado={c.sustentado ? "sim" : "nao"}
                >
                  <span className="studio-componente-marca" aria-hidden>
                    {c.sustentado ? "•" : "○"}
                  </span>
                  <span className="studio-componente-corpo">
                    <span className="studio-componente-rotulo">{c.rotulo}</span>
                    <Literal valor={c.valor || "não preenchido"} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="web-painel" data-score={score.score}>
            <h2 className="web-painel-titulo">Qualidade do registro</h2>
            <p className="studio-chave-conta">
              <strong className="studio-chave-numero">{score.score}%</strong>
            </p>
            <div className="studio-barra" aria-hidden>
              <div className="studio-barra-cheia" style={{ inlineSize: `${score.score}%` }} />
            </div>
            {score.faltando.length === 0 ? (
              <p className="studio-campo-nota">
                Os doze campos que o score mede estão preenchidos.
              </p>
            ) : (
              <ul className="web-lista-densa">
                {score.itens
                  .filter((i) => !i.ok)
                  .map((i) => (
                    <li key={i.chave} className="studio-falta" data-obrigatorio={i.obrigatorio}>
                      <span className="studio-falta-rotulo">{i.rotulo}</span>
                      {i.obrigatorio ? (
                        <span className="studio-falta-marca">impede o envio</span>
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <Pendencias pendencias={pendencias} />

          <QuadroDaConversao conversao={conversao} />

          {!jaEnviado ? (
            <Envio
              podeEnviar={score.podeEnviar && editavelAgora}
              impedimentos={score.impedimentos}
              autor={atual.autor}
              quando={dataCurta(catalogo.dataDeReferencia)}
              editavel={editavelAgora}
              situacao={atual.situacao}
              aoEnviar={enviar}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

/**
 * A ficha completa, campo a campo, NA ORDEM DA ONTOLOGIA.
 *
 * Não é a ordem do formulário nem a de importância visual: é vocabulário, agente, criação,
 * acontecimento, acessibilidade, comercial, carimbo. Quem confere um registro contra o
 * contrato lê nessa ordem, e uma ficha reordenada por estética obrigaria a procurar.
 */
function Ficha({
  rascunho,
  catalogo,
}: {
  rascunho: RascunhoDoProdutor;
  catalogo: CatalogoDeEspacos;
}) {
  const marcadas = DIMENSOES_DE_ACESSIBILIDADE.filter((d) => rascunho.acessibilidade[d.chave]);
  const espacoDe = (id: string | null) =>
    id === null ? null : (catalogo.espacos.find((e) => e.id === id)?.titulo ?? id);

  return (
    <section className="studio-ficha">
      <h2 className="web-painel-titulo">O que será enviado</h2>

      <Bloco titulo="Identidade">
        <Linha rotulo="título" valor={rascunho.titulo || "—"} />
        <Linha rotulo="resumo" valor={rascunho.resumo || "não declarado"} />
        <Linha
          rotulo="linguagens"
          valor={rascunho.linguagens.length ? rascunho.linguagens.join(", ") : "nenhuma"}
        />
        <Linha rotulo="temas" valor={rascunho.temas.length ? rascunho.temas.join(", ") : "nenhum"} />
        <Linha
          rotulo="imagem"
          valor={rascunho.imagem ? `${rascunho.imagem} · crédito: ${rascunho.creditoImagem}` : "sem imagem"}
        />
      </Bloco>

      <Bloco titulo="Obra e elenco">
        <Linha
          rotulo="obra"
          valor={
            rascunho.obraTitulo
              ? `${rascunho.obraTitulo}${rascunho.obraProposta ? " · proposta" : ""}`
              : "não declarada"
          }
        />
        {rascunho.elenco.length === 0 ? (
          <Linha rotulo="elenco" valor="nenhum vínculo" />
        ) : (
          rascunho.elenco.map((v) => (
            <Linha
              key={v.agenteId}
              rotulo={v.papel || "SEM PAPEL"}
              valor={`${v.agenteTitulo}${v.proposto ? " · proposto" : ""}`}
            />
          ))
        )}
      </Bloco>

      <Bloco titulo="Temporadas e sessões">
        {rascunho.temporadas.length === 0 ? (
          <Linha rotulo="temporada" valor="nenhuma" />
        ) : (
          rascunho.temporadas.map((t) => (
            <Linha
              key={t.id}
              rotulo={`${dataCurta(t.inicio)} – ${dataCurta(t.fim)}`}
              valor={`${espacoDe(t.espacoId) ?? "sem espaço declarado"}${t.longaDuracao ? " · longa duração" : ""}`}
            />
          ))
        )}
        <Linha
          rotulo="sessões"
          valor={
            rascunho.ocorrencias.length === 0
              ? "nenhuma declarada"
              : `${rascunho.ocorrencias.length} · ${
                  rascunho.ocorrencias.filter(
                    (o) => partesDaChave(chaveDaSessao(rascunho, o)) === 3,
                  ).length
                } com chave de três partes`
          }
        />
        {rascunho.ocorrencias.slice(0, 3).map((o) => (
          <Linha key={o.id} rotulo="sessão" valor={quandoPorExtenso(o.inicio)} />
        ))}
        {rascunho.ocorrencias.length > 3 ? (
          <Linha
            rotulo="—"
            valor={`e mais ${rascunho.ocorrencias.length - 3}; a grade tem todas`}
          />
        ) : null}
      </Bloco>

      <Bloco titulo="Acessibilidade">
        <Linha
          rotulo="ficha declarada"
          valor={rascunho.declaraAcessibilidade ? "sim, pelo produtor" : "NÃO — o registro está em silêncio"}
        />
        <Linha
          rotulo="recursos"
          valor={
            !rascunho.declaraAcessibilidade
              ? "indeterminado enquanto a ficha não for declarada"
              : algumaDimensaoMarcada(rascunho.acessibilidade)
                ? marcadas.map((d) => d.rotulo).join(", ")
                : "nenhum, dito por extenso"
          }
        />
      </Bloco>

      <Bloco titulo="Comercial e classificação">
        <Linha
          rotulo="faixa etária"
          valor={rascunho.faixaEtaria ? ROTULO_DA_FAIXA[rascunho.faixaEtaria] : "não declarada"}
        />
        <Linha
          rotulo="canal de ingresso"
          valor={rascunho.canalIngresso ? ROTULO_DO_CANAL[rascunho.canalIngresso] : "não declarado"}
        />
        <Linha rotulo="inscrição" valor={rascunho.inscricao ?? "não se aplica"} />
      </Bloco>

      <Bloco titulo="Carimbo do sistema">
        <Linha rotulo="procedência" valor={rascunho.procedencia} literal />
        <Linha rotulo="agente realizador" valor={rascunho.fonte} />
        <Linha rotulo="autor" valor={rascunho.autor} />
        <Linha rotulo="chave" valor={rascunho.chaveIdentidade} literal />
      </Bloco>
    </section>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="studio-ficha-bloco">
      <h3 className="studio-rotulo">{titulo}</h3>
      <dl className="studio-ficha-lista">{children}</dl>
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  literal,
}: {
  rotulo: string;
  valor: string;
  literal?: boolean;
}) {
  return (
    <>
      <dt>{rotulo}</dt>
      <dd>{literal ? <Literal valor={valor} /> : valor}</dd>
    </>
  );
}

function Pendencias({ pendencias }: { pendencias: RascunhoDoProdutor["pendencias"] }) {
  if (pendencias.length === 0) {
    return (
      <section className="web-painel" data-pendencias="0">
        <h2 className="web-painel-titulo">Pendências</h2>
        <p className="studio-campo-nota">
          Nenhuma. As três portas — moderação, organização e editor — estão resolvidas neste
          registro.
        </p>
      </section>
    );
  }

  return (
    <section className="web-painel" data-pendencias={pendencias.length}>
      <h2 className="web-painel-titulo">
        {pendencias.length} {pendencias.length === 1 ? "pendência" : "pendências"}, com o
        nível responsável
      </h2>
      <ul className="web-lista-densa">
        {pendencias.map((p) => (
          <li key={`${p.porta}-${p.texto}`} className="studio-porta" data-porta={p.porta}>
            <span className="studio-porta-estado">{PORTAS[p.porta].estado}</span>
            <span>{p.texto}</span>
            <span className="studio-campo-nota">
              decide: {PORTAS[p.porta].nivel} · {PORTAS[p.porta].saida}
            </span>
          </li>
        ))}
      </ul>
      <p className="studio-campo-nota">{NENHUMA_PORTA_BLOQUEIA}</p>
    </section>
  );
}

/**
 * O quadro de conversão — o argumento da proposta, em números que mudam sozinhos.
 *
 * A coluna «antes» é o acervo medido; a «depois» é o que este envio faz. As linhas que
 * efetivamente convertem ganham marca, e as que não convertem ficam — esconder as que não
 * mudaram faria o quadro afirmar mais do que o registro sustenta.
 */
function QuadroDaConversao({
  conversao,
}: {
  conversao: ReturnType<typeof conversaoDoEnvio>;
}) {
  const convertidas = conversao.filter((l) => l.convertida).length;

  return (
    <section className="web-painel" data-conversao={convertidas}>
      <h2 className="web-painel-titulo">O que este envio converte</h2>
      <p className="studio-chave-conta">
        <strong className="studio-chave-numero">
          {convertidas} de {conversao.length}
        </strong>{" "}
        medidas
      </p>
      <div className="studio-tabela">
        <div className="studio-linha studio-linha-conversao">
          <div className="studio-celula studio-celula-rotulo">medida</div>
          <div className="studio-celula studio-celula-rotulo">hoje, no acervo</div>
          <div className="studio-celula studio-celula-rotulo">depois deste envio</div>
        </div>
        {conversao.map((l) => (
          <div
            key={l.medida}
            className="studio-linha studio-linha-conversao"
            data-convertida={l.convertida ? "sim" : "nao"}
          >
            <div className="studio-celula studio-celula-rotulo">{l.medida}</div>
            <div className="studio-celula">{l.antes}</div>
            <div className="studio-celula studio-celula-depois">{l.depois}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * A ação, com carimbo visível ANTES de apertar.
 *
 * Quem envia precisa ver com que nome e com que data o registro vai — carimbo que só
 * aparece depois é carimbo que ninguém conferiu.
 */
function Envio({
  podeEnviar,
  impedimentos,
  autor,
  quando,
  editavel,
  situacao,
  aoEnviar,
}: {
  podeEnviar: boolean;
  impedimentos: string[];
  autor: string;
  quando: string;
  editavel: boolean;
  situacao: RascunhoDoProdutor["situacao"];
  aoEnviar: () => void;
}) {
  return (
    <section className="studio-ato" data-pode-enviar={podeEnviar ? "sim" : "nao"}>
      <h2 className="web-painel-titulo">Enviar para moderação</h2>
      <dl className="studio-carimbo-lista">
        <dt>autor</dt>
        <dd>{autor}</dd>
        <dt>data</dt>
        <dd>{quando}</dd>
      </dl>
      <div className="studio-acoes">
        <button
          type="button"
          className="studio-botao studio-botao-primario studio-botao-ato"
          disabled={!podeEnviar}
          onClick={aoEnviar}
        >
          Enviar para moderação
        </button>
      </div>
      {!editavel ? (
        <p className="studio-campo-nota">
          Este registro está como «{ROTULO_DA_SITUACAO[situacao]}» e não é seu para enviar
          agora.
        </p>
      ) : impedimentos.length > 0 ? (
        <p className="studio-campo-nota">
          O envio libera quando {impedimentos.length === 1 ? "faltar" : "faltarem"} zero
          obrigatórios. Falta: {impedimentos.join(", ")}.
        </p>
      ) : (
        <p className="studio-campo-nota">
          Nunca anônimo: o nome acima vai junto, e é ele que a moderação lê do outro lado.
        </p>
      )}
    </section>
  );
}

/**
 * Depois do envio: para onde foi, e quem decide.
 *
 * Sem esta caixa, o botão de enviar seria um botão que muda um selo. O produtor precisa
 * saber que o registro trocou de mãos, e que a próxima palavra não é dele.
 */
function DepoisDoEnvio({
  rascunho,
  rotaDaModeracao,
}: {
  rascunho: RascunhoDoProdutor;
  rotaDaModeracao: string;
}) {
  const ultima = rascunho.historico[rascunho.historico.length - 1];

  return (
    <section className="studio-enviado" data-enviado={rascunho.enviadoEm ?? ""}>
      <h2 className="web-painel-titulo">Enviado</h2>
      <p className="studio-nota">
        <strong>{ROTULO_DA_SITUACAO[rascunho.situacao]}.</strong>{" "}
        {EXPLICACAO_DA_SITUACAO[rascunho.situacao]}
      </p>
      <dl className="studio-carimbo-lista">
        <dt>quem enviou</dt>
        <dd>{rascunho.autor}</dd>
        <dt>quando</dt>
        <dd>{rascunho.enviadoEm ? dataCurta(rascunho.enviadoEm) : "—"}</dd>
        <dt>quem decide agora</dt>
        <dd>{PORTAS.moderacao.nivel}</dd>
        <dt>onde</dt>
        <dd>
          <Literal valor={rotaDaModeracao} />
        </dd>
      </dl>
      {ultima ? (
        <p className="studio-campo-nota">
          Histórico: {ultima.campoRotulo} de «{ultima.de}» para «{ultima.para}», por{" "}
          {ultima.quem} em {ultima.quando}.
        </p>
      ) : null}
    </section>
  );
}
