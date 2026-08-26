"use client";

import { useMemo, useState } from "react";
import { useStudio } from "@/componentes/studio-estado";
import { Literal } from "@/componentes/studio-literal";
import { SeletorDeRegistro } from "@/componentes/studio-seletor";
import {
  DIAS_DA_SEMANA,
  TETO_DE_SESSOES_GERADAS,
  comSeparador,
  dataCurta,
  dataDe,
  diaDaSemana,
  gerarSessoes,
  horaDe,
  horaValida,
  quandoPorExtenso,
} from "@/componentes/studio-datas";
import {
  EXPLICACAO_DA_SITUACAO,
  ROTULO_DA_SITUACAO,
  chaveDaSessao,
  partesDaChave,
} from "@/dados/tipos-acesso";
import type {
  OcorrenciaDoRascunho,
  RascunhoDoProdutor,
  TemporadaDoRascunho,
} from "@/dados/tipos-acesso";
import type { CatalogoDaGrade, EspacoDoCatalogo } from "@/dados/mock/seed";

/**
 * studio-grade.tsx — P5 · grade de ocorrências (funcionalidade 154).
 *
 * **A TELA ONDE 2.425 REGISTROS DEIXAM DE SER `derivado`.** O comentário de `Ocorrencia` em
 * `tipos.ts` é explícito: a ocorrência é SEMPRE derivada, porque `schedules` do CMS está
 * vazio em 100% dos eventos e nenhuma sessão existe em sistema nenhum do IC. Cada linha que
 * o produtor declara aqui é uma linha que passa a existir — e é essa conversão, não a
 * tabela, que é o argumento da proposta.
 *
 * A CHAVE DE TRÊS PARTES É A REGRA DA TELA, não um enfeite. `ocorrência = temporada + início
 * exato + espaço`. Uma sessão sem espaço declarado fica em 2 de 3, e a tela diz isso na
 * própria linha em vez de deixar passar: chave incompleta é registro que a fila de
 * duplicatas não consegue distinguir de outro.
 *
 * NENHUM `new Date(string)` NESTE ARQUIVO nem em `studio-datas.ts`. `new Date("2026-08-22")`
 * é meia-noite UTC, e o leitor local devolve dia 21 em fuso brasileiro — a grade inteira
 * sairia deslocada em um dia, e nenhum portão estático veria.
 *
 * MÓDULO DE CLIENTE: `@/dados/mock/seed` entra **apenas por tipo** (DP-F).
 */

interface Props {
  catalogo: CatalogoDaGrade;
  semente: RascunhoDoProdutor[];
  situacaoEAutorada: string;
  /** A frase de `ocorrencias-studio.ts` que mede a ausência de espaço, com denominador. */
  declaracaoDoEspaco: string;
  /** A frase de D-73 — a regra determinística que hoje inventa as sessões. */
  fraseDaDerivacao: string;
  numeros: { ocorrencias: number; ocorrenciasComEspaco: number; eventos: number };
}

/** Os horários que o gerador oferece de partida. Editáveis: é a grade real que manda. */
const HORARIOS_INICIAIS = ["20:00"];

export function StudioGrade({
  catalogo,
  semente,
  situacaoEAutorada,
  declaracaoDoEspaco,
  fraseDaDerivacao,
  numeros,
}: Props) {
  const studio = useStudio(semente, {
    dataDeReferencia: catalogo.dataDeReferencia,
    autor: catalogo.produtor,
    organizacao: catalogo.organizacao,
  });
  const { pronto, rascunhos, atual, editavelAgora } = studio;

  const [temporadaAberta, definirTemporadaAberta] = useState<string | null>(null);
  const [emEdicao, definirEmEdicao] = useState<string | null>(null);

  if (!pronto || atual === null) {
    return (
      <p className="studio-nota" data-carregando>
        Lendo o que você já tinha escrito…
      </p>
    );
  }

  const temporadas = atual.temporadas;
  const sessoes = [...atual.ocorrencias].sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
  const alvo = temporadas.find((t) => t.id === temporadaAberta) ?? temporadas[0] ?? null;

  // A COLISÃO DE CHAVE, contada sobre o próprio registro. Duas sessões com a mesma
  // temporada, o mesmo início e o mesmo espaço são a mesma sessão declarada duas vezes — e
  // é a fila de duplicatas que pagaria por isso se a tela não avisasse aqui.
  const porChave = new Map<string, number>();
  for (const o of sessoes) {
    const c = chaveDaSessao(atual, o);
    porChave.set(c, (porChave.get(c) ?? 0) + 1);
  }
  const colidem = sessoes.filter((o) => (porChave.get(chaveDaSessao(atual, o)) ?? 0) > 1).length;

  const declaradas = sessoes.filter((o) => !o.cancelada).length;
  const comEspaco = sessoes.filter((o) => o.espacoId !== null && !o.cancelada).length;
  const completas = sessoes.filter((o) => partesDaChave(chaveDaSessao(atual, o)) === 3).length;

  const alterarSessao = (id: string, mudanca: Partial<OcorrenciaDoRascunho>) =>
    studio.alterar({
      ocorrencias: atual.ocorrencias.map((o) => (o.id === id ? { ...o, ...mudanca } : o)),
    });

  const removerSessao = (id: string) =>
    studio.alterar({ ocorrencias: atual.ocorrencias.filter((o) => o.id !== id) });

  const acrescentarSessoes = (novas: string[], temporadaId: string, espacoId: string | null) => {
    const base = atual.ocorrencias.length;
    studio.alterar({
      ocorrencias: [
        ...atual.ocorrencias,
        ...novas.map((inicio, i) => ({
          // Id determinístico, derivado da posição: nada de sorteio nem de carimbo de tempo.
          id: `ocorrencia:produtor:${atual.id.slice(atual.id.lastIndexOf(":") + 1)}-${base + i}`,
          temporadaId,
          inicio,
          espacoId,
          gratuito: true,
          preco: null,
          esgotado: false,
          cancelada: false,
          motivoDoCancelamento: null,
        })),
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

      <div className="web-duas-colunas">
        <div className="studio-forma">
          {!editavelAgora ? (
            <p className="studio-travado" data-situacao={atual.situacao}>
              <strong>{ROTULO_DA_SITUACAO[atual.situacao]}.</strong>{" "}
              {EXPLICACAO_DA_SITUACAO[atual.situacao]}
            </p>
          ) : null}

          {temporadas.length === 0 ? (
            <SemTemporada />
          ) : (
            <>
              <Gerador
                temporadas={temporadas}
                escolhida={alvo}
                editavel={editavelAgora}
                espacos={catalogo.espacos}
                aoTrocarTemporada={definirTemporadaAberta}
                aoAplicar={acrescentarSessoes}
              />

              <TabelaDeSessoes
                sessoes={sessoes}
                rascunho={atual}
                espacos={catalogo.espacos}
                editavel={editavelAgora}
                emEdicao={emEdicao}
                porChave={porChave}
                aoEditar={definirEmEdicao}
                aoAlterar={alterarSessao}
                aoRemover={removerSessao}
              />
            </>
          )}
        </div>

        <aside className="web-colada studio-vivo">
          <section className="web-painel" data-contador-de-sessoes={declaradas}>
            <h2 className="web-painel-titulo">O que este registro declara</h2>
            <p className="studio-chave-conta">
              <strong className="studio-chave-numero">{declaradas}</strong>{" "}
              {declaradas === 1 ? "sessão declarada" : "sessões declaradas"} · procedência{" "}
              <Literal valor="produtor" />
            </p>
            <ul className="web-lista-densa">
              <li className="studio-falta">
                <span className="studio-falta-rotulo">com espaço declarado</span>
                <strong>
                  {comEspaco} de {declaradas}
                </strong>
              </li>
              <li className="studio-falta">
                <span className="studio-falta-rotulo">chave de três partes completa</span>
                <strong>
                  {completas} de {sessoes.length}
                </strong>
              </li>
              {colidem > 0 ? (
                <li className="studio-falta" data-obrigatorio="true">
                  <span className="studio-falta-rotulo">linhas com chave repetida</span>
                  <span className="studio-falta-marca">{colidem}</span>
                </li>
              ) : null}
            </ul>
          </section>

          <section className="studio-nao-sustenta">
            <span className="studio-nao-sustenta-rotulo">O que o acervo mede hoje</span>
            <ul className="web-denominadores">
              <li className="web-denominador">
                <span className="web-denominador-numero">
                  {comSeparador(numeros.ocorrencias)}
                </span>
                <span className="web-denominador-rotulo">ocorrências, todas derivadas</span>
              </li>
              <li className="web-denominador">
                <span className="web-denominador-numero">
                  {comSeparador(numeros.ocorrenciasComEspaco)} de{" "}
                  {comSeparador(numeros.ocorrencias)}
                </span>
                <span className="web-denominador-rotulo">com espaço declarado</span>
              </li>
            </ul>
            <p>{declaracaoDoEspaco}</p>
            <p>{fraseDaDerivacao}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

/**
 * O estado vazio, que é o mais importante desta tela.
 *
 * Sessão sem temporada é registro sem chave: `ocorrência = temporada + início + espaço`.
 * Deixar gerar assim gravaria linha que a deduplicação não consegue distinguir de nenhuma
 * outra — e a fila de duplicatas passaria a acusar o próprio Studio. Por isso a tela não
 * oferece o gerador desabilitado: ela diz o que falta e onde se resolve.
 */
function SemTemporada() {
  return (
    <section className="studio-vazio">
      <h2 className="web-painel-titulo">Ainda não há temporada</h2>
      <p className="studio-nota">
        A sessão se ancora na temporada: <Literal valor="ocorrência = temporada + início exato + espaço" />
        . Sem ela, cada linha gerada aqui nasceria sem identidade, e a fila de duplicatas
        passaria a acusar o próprio Studio.
      </p>
      <p className="studio-campo-nota">
        Declare o espaço e o intervalo em <strong>Espaço e temporada</strong> e volte. É a
        tela anterior desta jornada.
      </p>
    </section>
  );
}

/**
 * O gerador, com prévia ANTES de aplicar.
 *
 * Aplicar sem ver seria a mesma cegueira que a tela existe para desfazer: quem escolhe
 * «terça e quinta às 20h» numa temporada de três meses precisa saber que isso são 26
 * sessões antes de elas aparecerem na tabela.
 */
function Gerador({
  temporadas,
  escolhida,
  editavel,
  espacos,
  aoTrocarTemporada,
  aoAplicar,
}: {
  temporadas: TemporadaDoRascunho[];
  escolhida: TemporadaDoRascunho | null;
  editavel: boolean;
  espacos: EspacoDoCatalogo[];
  aoTrocarTemporada: (id: string) => void;
  aoAplicar: (inicios: string[], temporadaId: string, espacoId: string | null) => void;
}) {
  const [dias, definirDias] = useState<number[]>([]);
  const [horarios, definirHorarios] = useState<string[]>(HORARIOS_INICIAIS);
  const [novoHorario, definirNovoHorario] = useState("");

  const previa = useMemo(
    () =>
      escolhida
        ? gerarSessoes(escolhida.inicio, escolhida.fim, dias, horarios)
        : { sessoes: [], possiveis: 0, cortadas: 0 },
    [escolhida, dias, horarios],
  );

  if (escolhida === null) return null;

  const espaco = espacos.find((e) => e.id === escolhida.espacoId) ?? null;
  const podeAplicar = editavel && previa.sessoes.length > 0;

  return (
    <section className="studio-gerador">
      <h2 className="web-painel-titulo">Gerar sessões a partir da temporada</h2>

      {temporadas.length > 1 ? (
        <label className="studio-campo">
          <span className="studio-campo-rotulo">Temporada</span>
          <select
            className="studio-campo-entrada"
            value={escolhida.id}
            onChange={(e) => aoTrocarTemporada(e.target.value)}
            disabled={!editavel}
          >
            {temporadas.map((t) => (
              <option key={t.id} value={t.id}>
                {dataCurta(t.inicio)} – {dataCurta(t.fim)} ·{" "}
                {t.espacoTitulo ?? "sem espaço declarado"}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="studio-campo-nota">
          {dataCurta(escolhida.inicio)} – {dataCurta(escolhida.fim)} ·{" "}
          {espaco ? espaco.titulo : "sem espaço declarado"}
        </p>
      )}

      {escolhida.longaDuracao ? (
        <p className="studio-porta">
          <span className="studio-porta-estado">longa duração</span>
          <span>
            Esta temporada tem vigência própria — exposição e ocupação não têm grade de
            sessões diárias. Gerar sessões aqui é opcional.
          </span>
        </p>
      ) : null}

      <fieldset className="studio-campo" disabled={!editavel}>
        <legend className="studio-campo-rotulo">Dias da semana</legend>
        <div className="studio-pilulas">
          {DIAS_DA_SEMANA.map((d) => (
            <button
              key={d.indice}
              type="button"
              aria-pressed={dias.includes(d.indice)}
              aria-label={d.longo}
              className="studio-pilula"
              onClick={() =>
                definirDias((atual) =>
                  atual.includes(d.indice)
                    ? atual.filter((x) => x !== d.indice)
                    : [...atual, d.indice],
                )
              }
            >
              {d.curto}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="studio-campo" disabled={!editavel}>
        <legend className="studio-campo-rotulo">Horários</legend>
        <div className="studio-pilulas">
          {horarios.map((h) => (
            <button
              key={h}
              type="button"
              className="studio-pilula"
              aria-pressed
              aria-label={`remover o horário ${h}`}
              onClick={() => definirHorarios((atual) => atual.filter((x) => x !== h))}
            >
              {h} ✕
            </button>
          ))}
          {horarios.length === 0 ? (
            <span className="studio-campo-nota">nenhum horário — acrescente ao menos um</span>
          ) : null}
        </div>
        <span className="studio-campo-nota">
          <input
            type="time"
            className="studio-campo-entrada studio-campo-entrada-curta"
            value={novoHorario}
            onChange={(e) => definirNovoHorario(e.target.value)}
            aria-label="novo horário"
          />{" "}
          <button
            type="button"
            className="studio-botao"
            disabled={!horaValida(novoHorario) || horarios.includes(novoHorario)}
            onClick={() => {
              definirHorarios((atual) => [...atual, novoHorario].sort());
              definirNovoHorario("");
            }}
          >
            acrescentar horário
          </button>
        </span>
      </fieldset>

      {/* ---- a prévia, antes de aplicar ---- */}
      <div className="studio-previa" data-previa={previa.sessoes.length}>
        {dias.length === 0 || horarios.length === 0 ? (
          <p className="studio-campo-nota">
            Escolha ao menos um dia da semana e um horário para ver a prévia.
          </p>
        ) : previa.sessoes.length === 0 ? (
          <p className="studio-campo-nota">
            Nenhum desses dias cai entre {dataCurta(escolhida.inicio)} e{" "}
            {dataCurta(escolhida.fim)}.
          </p>
        ) : (
          <>
            <p className="studio-previa-conta">
              <strong className="studio-chave-numero">{previa.sessoes.length}</strong>{" "}
              {previa.sessoes.length === 1 ? "sessão" : "sessões"} nesta prévia
              {previa.cortadas > 0 ? (
                <>
                  {" "}
                  — a regra produz {previa.possiveis} e o teto desta tela é{" "}
                  {TETO_DE_SESSOES_GERADAS}, então <strong>{previa.cortadas} ficam de fora</strong>{" "}
                  desta aplicação. Aplique e gere de novo para as restantes.
                </>
              ) : null}
            </p>
            <ul className="studio-previa-lista">
              {previa.sessoes.slice(0, 8).map((s) => (
                <li key={s.inicio}>{quandoPorExtenso(s.inicio)}</li>
              ))}
            </ul>
            {previa.sessoes.length > 8 ? (
              <p className="studio-campo-nota">
                Mostrando as 8 primeiras de {previa.sessoes.length}. Todas entram ao aplicar.
              </p>
            ) : null}
          </>
        )}

        <div className="studio-acoes">
          <button
            type="button"
            className="studio-botao studio-botao-primario"
            disabled={!podeAplicar}
            onClick={() => {
              aoAplicar(
                previa.sessoes.map((s) => s.inicio),
                escolhida.id,
                escolhida.espacoId,
              );
              definirDias([]);
            }}
          >
            Aplicar {previa.sessoes.length > 0 ? `${previa.sessoes.length} ` : ""}à grade
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * A tabela densa. Uma linha por sessão, editável na própria linha.
 *
 * A chave de cada linha fica visível, com a contagem de partes: é ela que o produtor confere,
 * e escondê-la atrás de um clique faria a colisão só aparecer depois do envio.
 */
function TabelaDeSessoes({
  sessoes,
  rascunho,
  espacos,
  editavel,
  emEdicao,
  porChave,
  aoEditar,
  aoAlterar,
  aoRemover,
}: {
  sessoes: OcorrenciaDoRascunho[];
  rascunho: RascunhoDoProdutor;
  espacos: EspacoDoCatalogo[];
  editavel: boolean;
  emEdicao: string | null;
  porChave: Map<string, number>;
  aoEditar: (id: string | null) => void;
  aoAlterar: (id: string, mudanca: Partial<OcorrenciaDoRascunho>) => void;
  aoRemover: (id: string) => void;
}) {
  if (sessoes.length === 0) {
    return (
      <section className="studio-vazio">
        <h2 className="web-painel-titulo">Nenhuma sessão declarada</h2>
        <p className="studio-nota">
          Enquanto não houver linha aqui, este evento fica como os{" "}
          <strong>2.425 do acervo</strong>: sem sessão que exista em sistema nenhum. Use o
          gerador acima, ou acrescente uma sessão avulsa.
        </p>
      </section>
    );
  }

  return (
    <section className="studio-grade-tabela">
      <h2 className="web-painel-titulo">
        {sessoes.length} {sessoes.length === 1 ? "sessão" : "sessões"} nesta grade
      </h2>
      <ul className="studio-grade-lista">
        {sessoes.map((o) => {
          const chave = chaveDaSessao(rascunho, o);
          const partes = partesDaChave(chave);
          const repetida = (porChave.get(chave) ?? 0) > 1;
          const aberta = emEdicao === o.id;
          const espaco = espacos.find((e) => e.id === o.espacoId) ?? null;
          const semana = diaDaSemana(dataDe(o.inicio));

          return (
            <li
              key={o.id}
              className="studio-sessao"
              data-repetida={repetida ? "sim" : "nao"}
              data-cancelada={o.cancelada ? "sim" : "nao"}
              data-partes={partes}
            >
              <div className="studio-sessao-cabeca">
                <span className="studio-sessao-quando">
                  {dataCurta(dataDe(o.inicio))}
                  <span className="studio-sessao-dia">
                    {semana === null ? "" : ` ${DIAS_DA_SEMANA[semana]?.curto ?? ""}`}
                  </span>
                </span>
                <span className="studio-sessao-hora">{horaDe(o.inicio)}</span>
                <span className="studio-sessao-espaco">
                  {espaco ? espaco.titulo : "sem espaço declarado"}
                </span>
                <span className="studio-sessao-preco">
                  {o.gratuito ? "gratuito" : o.preco === null ? "pago — sem valor" : `R$ ${o.preco}`}
                </span>
                {o.esgotado ? <span className="studio-selo">esgotado</span> : null}
                {o.cancelada ? <span className="studio-selo studio-selo-perigo">cancelada</span> : null}
                <button
                  type="button"
                  className="studio-botao studio-botao-linha"
                  disabled={!editavel}
                  onClick={() => aoEditar(aberta ? null : o.id)}
                  aria-expanded={aberta}
                >
                  {aberta ? "fechar" : "editar"}
                </button>
              </div>

              <div className="studio-sessao-chave">
                <span className="studio-sessao-partes" data-partes={partes}>
                  {partes} de 3
                </span>
                <Literal valor={chave} />
              </div>

              {repetida ? (
                <p className="studio-sessao-colisao">
                  Esta chave se repete na grade: mesma temporada, mesmo início e mesmo espaço
                  que outra linha. São a mesma sessão declarada duas vezes.
                </p>
              ) : null}
              {partes < 3 && !o.cancelada ? (
                <p className="studio-campo-nota">
                  Chave incompleta: falta o espaço. A sessão entra, e a deduplicação não
                  consegue distingui-la de outra no mesmo horário.
                </p>
              ) : null}

              {aberta ? (
                <EdicaoDaSessao
                  sessao={o}
                  espacos={espacos}
                  aoAlterar={(m) => aoAlterar(o.id, m)}
                  aoRemover={() => {
                    aoRemover(o.id);
                    aoEditar(null);
                  }}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EdicaoDaSessao({
  sessao,
  espacos,
  aoAlterar,
  aoRemover,
}: {
  sessao: OcorrenciaDoRascunho;
  espacos: EspacoDoCatalogo[];
  aoAlterar: (m: Partial<OcorrenciaDoRascunho>) => void;
  aoRemover: () => void;
}) {
  return (
    <div className="studio-sessao-edicao">
      <label className="studio-campo">
        <span className="studio-campo-rotulo">Data e hora</span>
        <input
          type="datetime-local"
          className="studio-campo-entrada"
          value={sessao.inicio}
          onChange={(e) => aoAlterar({ inicio: e.target.value })}
        />
      </label>

      <label className="studio-campo">
        <span className="studio-campo-rotulo">Espaço</span>
        <select
          className="studio-campo-entrada"
          value={sessao.espacoId ?? ""}
          onChange={(e) => aoAlterar({ espacoId: e.target.value === "" ? null : e.target.value })}
        >
          <option value="">sem espaço declarado — chave fica em 2 de 3</option>
          {espacos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.titulo}
              {e.cidade ? ` · ${e.cidade}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="studio-campo studio-campo-inline">
        <input
          type="checkbox"
          checked={sessao.gratuito}
          onChange={(e) => aoAlterar({ gratuito: e.target.checked, preco: null })}
        />
        <span className="studio-campo-rotulo">Gratuito</span>
      </label>

      {!sessao.gratuito ? (
        <label className="studio-campo">
          <span className="studio-campo-rotulo">Preço, em reais</span>
          <input
            type="number"
            min={0}
            step={1}
            className="studio-campo-entrada studio-campo-entrada-curta"
            value={sessao.preco ?? ""}
            onChange={(e) =>
              aoAlterar({ preco: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </label>
      ) : null}

      <label className="studio-campo studio-campo-inline">
        <input
          type="checkbox"
          checked={sessao.esgotado}
          onChange={(e) => aoAlterar({ esgotado: e.target.checked })}
        />
        <span className="studio-campo-rotulo">Esgotado</span>
      </label>

      <div className="studio-acoes">
        {/* Remover uma sessão é destrutivo e não tem desfazer: a confirmação é da tela, e
            não `window.confirm`, para ser a mesma em todo o Studio. */}
        <details className="studio-confirma">
          <summary className="studio-botao studio-botao-perigo studio-confirma-gatilho">Remover sessão</summary>
          <div className="studio-confirma-corpo">
            <p className="studio-campo-nota">
              A sessão de {quandoPorExtenso(sessao.inicio)} some da grade. Para cancelar uma
              sessão que já foi anunciada, use o cancelamento na tela de ocorrências — ele
              guarda o motivo e dispara alerta.
            </p>
            <button type="button" className="studio-botao studio-botao-perigo" onClick={aoRemover}>
              Remover
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
