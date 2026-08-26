"use client";

import { useMemo, useState } from "react";
import { useStudio } from "@/componentes/studio-estado";
import { Literal } from "@/componentes/studio-literal";
import { SeletorDeRegistro } from "@/componentes/studio-seletor";
import { comSeparador, simplificar, dataCurta, diasEntre } from "@/componentes/studio-datas";
import {
  EXPLICACAO_DA_SITUACAO,
  PORTAS,
  ROTULO_DA_SITUACAO,
  chaveDaTemporada,
  partesDaChave,
} from "@/dados/tipos-acesso";
import type { RascunhoDoProdutor, TemporadaDoRascunho } from "@/dados/tipos-acesso";
import type { CatalogoDeEspacos, EspacoDoCatalogo } from "@/dados/mock/seed";

/**
 * studio-temporada.tsx — P4 · espaço e temporada (funcionalidades 154 e 162).
 *
 * **O NÍVEL INTERMEDIÁRIO SEM O QUAL A SESSÃO NÃO TEM CHAVE.** `temporada = evento + espaço
 * + intervalo`, e `ocorrência = temporada + início exato + espaço`. Colapsar os dois num
 * array aninhado dentro do evento é o erro que faz agenda cultural virar catálogo (DADO-02),
 * e é por isso que esta tela vem antes da grade na ordem da jornada.
 *
 * UMA TEMPORADA POR ESPAÇO, e a tela diz isso em vez de deixar descobrir. Trocar o espaço de
 * uma temporada existente reescreveria a chave de todas as sessões penduradas nela — o
 * mesmo registro passaria a afirmar que aconteceu em outro lugar. Mudar de espaço cria
 * temporada nova, com as sessões que forem declaradas depois.
 *
 * LONGA DURAÇÃO É REGRA DE VIGÊNCIA, não um rótulo. Exposição e ocupação não têm grade de
 * sessões diárias: o que elas têm é um intervalo em que estão abertas. A tela marca isso e
 * a grade lê a marca para não cobrar sessões que não existem.
 *
 * MÓDULO DE CLIENTE: `@/dados/mock/seed` entra **apenas por tipo** (DP-F).
 */

interface Props {
  catalogo: CatalogoDeEspacos;
  semente: RascunhoDoProdutor[];
  situacaoEAutorada: string;
  /** A frase de `ocorrencias-studio.ts` que mede a ausência de espaço, com denominador. */
  declaracaoDoEspaco: string;
  numeros: { ocorrencias: number; ocorrenciasComEspaco: number };
}

/** Quantos espaços a lista mostra antes de pedir refino. Declarado, nunca em silêncio. */
const ESPACOS_POR_BUSCA = 8;

export function StudioTemporada({
  catalogo,
  semente,
  situacaoEAutorada,
  declaracaoDoEspaco,
  numeros,
}: Props) {
  const studio = useStudio(semente, {
    dataDeReferencia: catalogo.dataDeReferencia,
    autor: catalogo.produtor,
    organizacao: catalogo.organizacao,
  });
  const { pronto, rascunhos, atual, editavelAgora } = studio;
  const [emEdicao, definirEmEdicao] = useState<string | null>(null);

  if (!pronto || atual === null) {
    return (
      <p className="studio-nota" data-carregando>
        Lendo o que você já tinha escrito…
      </p>
    );
  }

  const temporadas = atual.temporadas;
  const comEspaco = temporadas.filter((t) => t.espacoId !== null).length;
  const pendentes = temporadas.filter((t) => t.espacoPedido).length;

  const alterar = (id: string, mudanca: Partial<TemporadaDoRascunho>) =>
    studio.alterar({
      temporadas: atual.temporadas.map((t) => (t.id === id ? { ...t, ...mudanca } : t)),
    });

  const acrescentar = (espaco: EspacoDoCatalogo | null, pedido: boolean) => {
    const seq = atual.temporadas.length + 1;
    const nova: TemporadaDoRascunho = {
      id: `temporada:produtor:${atual.id.slice(atual.id.lastIndexOf(":") + 1)}-${seq}`,
      espacoId: espaco?.id ?? null,
      espacoTitulo: espaco?.titulo ?? null,
      inicio: catalogo.dataDeReferencia,
      fim: catalogo.dataDeReferencia,
      longaDuracao: false,
      espacoPedido: pedido,
    };
    studio.alterar({ temporadas: [...atual.temporadas, nova] });
    definirEmEdicao(nova.id);
  };

  /**
   * Remover uma temporada leva junto as sessões penduradas nela.
   *
   * Isso não é efeito colateral escondido: sessão sem temporada é registro sem chave, e
   * deixá-las órfãs criaria exatamente o que a cadeia de identidade existe para impedir. A
   * confirmação diz quantas somem.
   */
  const remover = (id: string) => {
    studio.alterar({
      temporadas: atual.temporadas.filter((t) => t.id !== id),
      ocorrencias: atual.ocorrencias.filter((o) => o.temporadaId !== id),
    });
    definirEmEdicao(null);
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
            <section className="studio-vazio">
              <h2 className="web-painel-titulo">Nenhuma temporada declarada</h2>
              <p className="studio-nota">
                A temporada é o recorte com começo, fim e lugar. Sem ela a sessão não tem
                chave, porque{" "}
                <Literal valor="ocorrência = temporada + início exato + espaço" />.
              </p>
            </section>
          ) : (
            <ul className="studio-grade-lista" data-temporadas={temporadas.length}>
              {temporadas.map((t) => (
                <LinhaDaTemporada
                  key={t.id}
                  temporada={t}
                  rascunho={atual}
                  espacos={catalogo.espacos}
                  editavel={editavelAgora}
                  aberta={emEdicao === t.id}
                  aoAbrir={() => definirEmEdicao(emEdicao === t.id ? null : t.id)}
                  aoAlterar={(m) => alterar(t.id, m)}
                  aoRemover={() => remover(t.id)}
                  sessoesPenduradas={atual.ocorrencias.filter((o) => o.temporadaId === t.id).length}
                />
              ))}
            </ul>
          )}

          <NovaTemporada
            espacos={catalogo.espacos}
            editavel={editavelAgora}
            jaUsados={temporadas.map((t) => t.espacoId).filter((x): x is string => x !== null)}
            aoAcrescentar={acrescentar}
          />
        </div>

        <aside className="web-colada studio-vivo">
          <section className="web-painel" data-temporadas-declaradas={temporadas.length}>
            <h2 className="web-painel-titulo">O que este registro declara</h2>
            <p className="studio-chave-conta">
              <strong className="studio-chave-numero">{temporadas.length}</strong>{" "}
              {temporadas.length === 1 ? "temporada" : "temporadas"}
            </p>
            <ul className="web-lista-densa">
              <li className="studio-falta">
                <span className="studio-falta-rotulo">com espaço declarado</span>
                <strong>
                  {comEspaco} de {temporadas.length}
                </strong>
              </li>
              <li className="studio-falta">
                <span className="studio-falta-rotulo">sessões penduradas</span>
                <strong>{atual.ocorrencias.length}</strong>
              </li>
            </ul>
            <p className="studio-campo-nota">
              Uma temporada por espaço. Trocar o espaço de uma temporada existente reescreveria
              a chave de todas as sessões dela — o mesmo registro passaria a afirmar que
              aconteceu em outro lugar.
            </p>
          </section>

          {pendentes > 0 ? (
            <p className="studio-porta" data-porta="organizacao">
              <span className="studio-porta-estado">{PORTAS.organizacao.estado}</span>
              <span>
                {pendentes === 1 ? "1 temporada aguarda" : `${pendentes} temporadas aguardam`} um
                espaço que a {PORTAS.organizacao.nivel} precisa cadastrar.{" "}
                {PORTAS.organizacao.saida}.
              </span>
            </p>
          ) : null}

          <section className="studio-nao-sustenta">
            <span className="studio-nao-sustenta-rotulo">O que o acervo mede hoje</span>
            <ul className="web-denominadores">
              <li className="web-denominador">
                <span className="web-denominador-numero">
                  {comSeparador(numeros.ocorrenciasComEspaco)} de{" "}
                  {comSeparador(numeros.ocorrencias)}
                </span>
                <span className="web-denominador-rotulo">ocorrências com espaço</span>
              </li>
              <li className="web-denominador">
                <span className="web-denominador-numero">{catalogo.espacos.length}</span>
                <span className="web-denominador-rotulo">espaços no acervo</span>
              </li>
            </ul>
            <p>{declaracaoDoEspaco}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

function LinhaDaTemporada({
  temporada,
  rascunho,
  espacos,
  editavel,
  aberta,
  aoAbrir,
  aoAlterar,
  aoRemover,
  sessoesPenduradas,
}: {
  temporada: TemporadaDoRascunho;
  rascunho: RascunhoDoProdutor;
  espacos: EspacoDoCatalogo[];
  editavel: boolean;
  aberta: boolean;
  aoAbrir: () => void;
  aoAlterar: (m: Partial<TemporadaDoRascunho>) => void;
  aoRemover: () => void;
  sessoesPenduradas: number;
}) {
  const espaco = espacos.find((e) => e.id === temporada.espacoId) ?? null;
  const chave = chaveDaTemporada(
    rascunho.chaveIdentidade,
    temporada.espacoId,
    temporada.inicio,
    temporada.fim,
  );
  const partes = partesDaChave(chave);
  const dias = diasEntre(temporada.inicio, temporada.fim);
  const intervaloInvertido = dias < 0;

  return (
    <li
      className="studio-sessao"
      data-partes={partes}
      data-longa={temporada.longaDuracao ? "sim" : "nao"}
    >
      <div className="studio-sessao-cabeca">
        <span className="studio-sessao-quando">
          {dataCurta(temporada.inicio)} – {dataCurta(temporada.fim)}
        </span>
        <span className="studio-sessao-dia">
          {intervaloInvertido ? "" : `${dias + 1} ${dias === 0 ? "dia" : "dias"}`}
        </span>
        <span className="studio-sessao-espaco">
          {espaco ? (
            <>
              {espaco.titulo}
              {espaco.cidade ? ` · ${espaco.cidade}` : ""}
            </>
          ) : temporada.espacoPedido ? (
            "espaço pedido à Organização"
          ) : (
            "sem espaço declarado"
          )}
        </span>
        {temporada.longaDuracao ? <span className="studio-selo">longa duração</span> : null}
        <span className="studio-sessao-preco">
          {sessoesPenduradas} {sessoesPenduradas === 1 ? "sessão" : "sessões"}
        </span>
        <button
          type="button"
          className="studio-botao studio-botao-linha"
          disabled={!editavel}
          onClick={aoAbrir}
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

      {intervaloInvertido ? (
        <p className="studio-sessao-colisao">
          O fim vem antes do início. Enquanto estiver assim, a grade não gera sessão nenhuma
          para esta temporada.
        </p>
      ) : null}
      {temporada.espacoId === null ? (
        <p className="studio-campo-nota">
          Chave incompleta: sem espaço, ela fica em {partes} de 3, e toda sessão pendurada
          nesta temporada herda a falta.
        </p>
      ) : null}

      {aberta ? (
        <div className="studio-sessao-edicao">
          <label className="studio-campo">
            <span className="studio-campo-rotulo">Início</span>
            <input
              type="date"
              className="studio-campo-entrada"
              value={temporada.inicio}
              onChange={(e) => aoAlterar({ inicio: e.target.value })}
            />
          </label>
          <label className="studio-campo">
            <span className="studio-campo-rotulo">Fim</span>
            <input
              type="date"
              className="studio-campo-entrada"
              value={temporada.fim}
              onChange={(e) => aoAlterar({ fim: e.target.value })}
            />
          </label>

          <label className="studio-campo studio-campo-inline">
            <input
              type="checkbox"
              checked={temporada.longaDuracao}
              onChange={(e) => aoAlterar({ longaDuracao: e.target.checked })}
            />
            <span className="studio-campo-rotulo">Longa duração</span>
          </label>
          <p className="studio-campo-nota">
            Exposição e ocupação têm vigência própria: ficam abertas no intervalo inteiro, sem
            grade de sessões diárias. A grade lê esta marca para não cobrar sessões que não
            existem.
          </p>

          <div className="studio-acoes">
            <details className="studio-confirma">
              <summary className="studio-botao studio-botao-perigo studio-confirma-gatilho">Remover temporada</summary>
              <div className="studio-confirma-corpo">
                <p className="studio-campo-nota">
                  {sessoesPenduradas === 0
                    ? "Esta temporada não tem sessões penduradas."
                    : `As ${sessoesPenduradas} ${sessoesPenduradas === 1 ? "sessão pendurada" : "sessões penduradas"} nela somem junto — sessão sem temporada é registro sem chave.`}{" "}
                  Não há como desfazer.
                </p>
                <button
                  type="button"
                  className="studio-botao studio-botao-perigo"
                  onClick={aoRemover}
                >
                  Remover
                </button>
              </div>
            </details>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Escolher o espaço de uma temporada nova, ou abrir a porta 2 quando ele não existe.
 *
 * O espaço vem PRIMEIRO e o intervalo depois, na ordem da chave: `temporada = evento +
 * espaço + intervalo`. Pedir a data antes convidaria a criar temporada sem lugar, que é
 * metade da chave faltando desde o primeiro clique.
 */
function NovaTemporada({
  espacos,
  editavel,
  jaUsados,
  aoAcrescentar,
}: {
  espacos: EspacoDoCatalogo[];
  editavel: boolean;
  jaUsados: string[];
  aoAcrescentar: (espaco: EspacoDoCatalogo | null, pedido: boolean) => void;
}) {
  const [busca, definirBusca] = useState("");

  const { achados, total } = useMemo(() => {
    const q = simplificar(busca);
    if (q.length < 2) return { achados: [], total: 0 };
    const todos = espacos.filter(
      (e) => simplificar(e.titulo).includes(q) || simplificar(e.cidade).includes(q),
    );
    return { achados: todos.slice(0, ESPACOS_POR_BUSCA), total: todos.length };
  }, [busca, espacos]);

  return (
    <section className="studio-gerador">
      <h2 className="web-painel-titulo">Nova temporada — o espaço primeiro</h2>
      <label className="studio-campo">
        <span className="studio-campo-rotulo">
          Buscar entre os {espacos.length} espaços do acervo
        </span>
        <input
          type="search"
          className="studio-campo-entrada"
          value={busca}
          disabled={!editavel}
          onChange={(e) => definirBusca(e.target.value)}
          placeholder="nome do espaço ou cidade"
        />
        <span className="studio-campo-nota">
          O espaço vem antes do intervalo porque é assim que a chave se monta:{" "}
          <Literal valor="temporada = evento + espaço + intervalo" />.
        </span>
      </label>

      {busca.trim().length < 2 ? (
        <p className="studio-campo-nota">
          Digite ao menos duas letras. A ficha de acessibilidade do espaço vem da Organização
          e aparece em leitura na tela de acessibilidade.
        </p>
      ) : achados.length > 0 ? (
        <>
          <ul className="studio-resultados">
            {achados.map((e) => {
              const usado = jaUsados.includes(e.id);
              return (
                <li key={e.id} className="studio-resultado">
                  <div className="studio-resultado-cabeca">
                    <span className="studio-resultado-nome">{e.titulo}</span>
                    <span className="studio-resultado-classe">
                      {e.cidade || "cidade não declarada"}
                    </span>
                    <button
                      type="button"
                      className="studio-botao studio-botao-linha"
                      disabled={!editavel || usado}
                      onClick={() => {
                        aoAcrescentar(e, false);
                        definirBusca("");
                      }}
                    >
                      {usado ? "já tem temporada" : "criar temporada aqui"}
                    </button>
                  </div>
                  <p className="studio-verbete">
                    {e.declaraAcessibilidade
                      ? "A Organização preencheu a ficha de acessibilidade deste espaço."
                      : "A Organização ainda não preencheu a ficha de acessibilidade deste espaço — e «não preencheu» não é «não oferece»."}
                  </p>
                  <Literal valor={e.id} />
                </li>
              );
            })}
          </ul>
          {total > achados.length ? (
            <p className="studio-campo-nota">
              Mostrando {achados.length} de {total}. Refine a busca para ver os outros.
            </p>
          ) : null}
        </>
      ) : (
        <div className="studio-vazio">
          <p className="studio-nota">
            Nenhum espaço do acervo casa com <strong>{busca.trim()}</strong>.
          </p>
          <p className="studio-campo-nota">
            {PORTAS.organizacao.estado} — cadastrar espaço é da {PORTAS.organizacao.nivel}, não
            do produtor. {PORTAS.organizacao.saida}: a temporada nasce sem espaço, a chave
            fica em 2 de 3, e a tela diz isso em cada sessão pendurada nela.
          </p>
          <div className="studio-acoes">
            <button
              type="button"
              className="studio-botao studio-botao-primario"
              disabled={!editavel}
              onClick={() => {
                aoAcrescentar(null, true);
                definirBusca("");
              }}
            >
              Pedir «{busca.trim()}» à Organização e seguir
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
