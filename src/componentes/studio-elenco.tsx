"use client";

import { useMemo, useState } from "react";
import { useStudio } from "@/componentes/studio-estado";
import { Literal } from "@/componentes/studio-literal";
import { SeletorDeRegistro } from "@/componentes/studio-seletor";
import {
  EXPLICACAO_DA_SITUACAO,
  PORTAS,
  ROTULO_DA_SITUACAO,
  chaveDoEvento,
} from "@/dados/tipos-acesso";
import type { RascunhoDoProdutor, VinculoDeElenco } from "@/dados/tipos-acesso";
import type { AgenteDoCatalogo, CatalogoDoElenco, NumerosDoElenco } from "@/dados/mock/seed";

/**
 * studio-elenco.tsx — P3 · obra e elenco (funcionalidade 155).
 *
 * **A PONTE.** É a tela que fecha o vão entre a agenda e a Enciclopédia, e o número que a
 * justifica é medido, não afirmado: o grafo tem 508 arestas `atua_em`, 426 delas apontando
 * para `evento` — e **nenhuma para um evento datado**. Os eventos que a Enciclopédia liga a
 * artistas são históricos, sem sessão; os 129 que têm ocorrência têm zero artistas. «Evento»
 * e «evento datado» são conjuntos disjuntos neste acervo, e confundir os dois faria a tela
 * afirmar que o problema não existe.
 *
 * O PRODUTOR REFERENCIA, NUNCA EDITA. São 575 pessoas no protótipo e 43.614 na base
 * completa — pessoas reais que nunca se cadastraram. Um produtor editando o verbete de um
 * artista real seria a violação exata que o projeto se proibiu; o único caminho de escrita é
 * a reconciliação, que passa pelo moderador. Por isso o resultado da busca traz o verbete
 * EMBUTIDO, para conferência, e nenhum campo dele é editável.
 *
 * `papel` É OBRIGATÓRIO e a tela obriga junto. O tipo `Aresta` o exige quando
 * `relacao === "atua_em"`; uma tela que deixasse vincular sem papel gravaria aresta inválida
 * e empurraria a validação para o gerador do grafo, que não tem como perguntar a ninguém.
 *
 * MÓDULO DE CLIENTE: `@/dados/mock/seed` entra **apenas por tipo** (DP-F).
 */

interface Props {
  catalogo: CatalogoDoElenco;
  semente: RascunhoDoProdutor[];
  situacaoEAutorada: string;
  numeros: NumerosDoElenco;
  /** Os papéis que as 508 arestas existentes de fato usam, por frequência. */
  papeis: Array<{ papel: string; arestas: number }>;
  /** Quantos agentes a Enciclopédia completa tem, contra os do protótipo. */
  agentesNaBaseCompleta: number;
}

/** Quantos resultados a busca mostra por vez. Declarado na tela, nunca em silêncio. */
const RESULTADOS_POR_BUSCA = 8;

function comSeparador(n: number): string {
  const s = String(Math.trunc(Math.abs(n)));
  let saida = "";
  for (let i = 0; i < s.length; i += 1) {
    if (i > 0 && (s.length - i) % 3 === 0) saida += ".";
    saida += s[i];
  }
  return (n < 0 ? "-" : "") + saida;
}

/**
 * Tira acento e caixa, para a busca casar «Jose» com «José».
 *
 * A CLASSE DE COMBINAÇÃO VAI EM ESCAPE (`\u0300-\u036f`) e não como caractere literal: o
 * literal é invisível no código, e qualquer ferramenta que normalize o arquivo em NFC o
 * apagaria sem deixar rastro — a busca passaria a não achar nome nenhum com acento, e o
 * `tsc` continuaria verde. É a mesma escrita de `indice.ts`.
 *
 * Ela não reusa `normalizar` de `indice.ts` por escolha de fronteira: aquele módulo é de
 * dado, e importá-lo por valor num componente de cliente é a porta por onde o grafo começa
 * a atravessar. A P2 o importa porque precisa da MESMA normalização da chave; aqui a busca
 * é só conveniência de digitação, e não tem de coincidir com nada.
 */
function simplificar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function StudioElenco({
  catalogo,
  semente,
  situacaoEAutorada,
  numeros,
  papeis,
  agentesNaBaseCompleta,
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

  const { componentes } = chaveDoEvento(atual.titulo, atual.fonte, atual.obraTitulo);
  const sustentados = componentes.filter((c) => c.sustentado).length;
  const semPapel = atual.elenco.filter((v) => v.papel.trim() === "").length;
  const propostos = atual.elenco.filter((v) => v.proposto).length;

  const vincular = (agente: AgenteDoCatalogo, papel: string, proposto: boolean) => {
    if (atual.elenco.some((v) => v.agenteId === agente.id)) return;
    const novo: VinculoDeElenco = {
      agenteId: agente.id,
      agenteTitulo: agente.titulo,
      agenteClasse: agente.classe,
      papel,
      proposto,
    };
    studio.alterar({ elenco: [...atual.elenco, novo] });
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

      {/* O aviso permanente, e não um rodapé: é a regra que define a tela. */}
      <p className="studio-fronteira">
        <strong>Pessoa, coletivo e obra são leitura.</strong> São{" "}
        {comSeparador(numeros.pessoas)} pessoas no protótipo e{" "}
        {comSeparador(agentesNaBaseCompleta)} na Enciclopédia completa — pessoas reais que
        nunca se cadastraram. O Studio referencia e propõe; quem edita verbete é a
        Enciclopédia, pela reconciliação que passa por {PORTAS.moderacao.nivel}.
      </p>

      <div className="web-duas-colunas">
        <div className="studio-forma">
          {!editavelAgora ? (
            <p className="studio-travado" data-situacao={atual.situacao}>
              <strong>{ROTULO_DA_SITUACAO[atual.situacao]}.</strong>{" "}
              {EXPLICACAO_DA_SITUACAO[atual.situacao]}
            </p>
          ) : null}

          <EscolhaDaObra
            obras={catalogo.obras}
            rascunho={atual}
            editavel={editavelAgora}
            aoEscolher={(o) =>
              studio.alterar({
                obraId: o?.id ?? null,
                obraTitulo: o?.titulo ?? null,
                obraProposta: false,
              })
            }
            aoPropor={(titulo) =>
              studio.alterar({
                obraId: `obra:proposta:${simplificar(titulo).replace(/[^a-z0-9]+/g, "-")}`,
                obraTitulo: titulo,
                obraProposta: true,
              })
            }
          />

          <BuscaDeAgentes
            agentes={catalogo.agentes}
            papeis={papeis}
            editavel={editavelAgora}
            jaNoElenco={atual.elenco.map((v) => v.agenteId)}
            aoVincular={vincular}
          />
        </div>

        <aside className="web-colada studio-vivo">
          <ElencoMontado
            elenco={atual.elenco}
            editavel={editavelAgora}
            papeis={papeis}
            aoAlterarPapel={(agenteId, papel) =>
              studio.alterar({
                elenco: atual.elenco.map((v) => (v.agenteId === agenteId ? { ...v, papel } : v)),
              })
            }
            aoRemover={(agenteId) =>
              studio.alterar({ elenco: atual.elenco.filter((v) => v.agenteId !== agenteId) })
            }
          />

          {semPapel > 0 ? (
            <section className="studio-nao-sustenta" data-sem-papel={semPapel}>
              <span className="studio-nao-sustenta-rotulo">Falta papel</span>
              <p>
                {semPapel === 1 ? "1 vínculo está" : `${semPapel} vínculos estão`} sem papel. A
                aresta <Literal valor="atua_em" /> exige papel — sem ele o vínculo não é
                gravável, e a validação cairia no gerador do grafo, que não tem a quem
                perguntar.
              </p>
            </section>
          ) : null}

          {propostos > 0 || atual.obraProposta ? (
            <p className="studio-porta" data-porta="moderacao">
              <span className="studio-porta-estado">{PORTAS.moderacao.estado}</span>
              <span>
                {[
                  propostos > 0
                    ? `${propostos} ${propostos === 1 ? "agente proposto" : "agentes propostos"}`
                    : null,
                  atual.obraProposta ? "1 obra proposta" : null,
                ]
                  .filter(Boolean)
                  .join(" e ")}{" "}
                — vai para {PORTAS.moderacao.nivel}. {PORTAS.moderacao.saida}.
              </span>
            </p>
          ) : null}

          <section className="web-painel">
            <h2 className="web-painel-titulo">Chave de identidade</h2>
            <p className="studio-chave-conta">
              <strong className="studio-chave-numero">{sustentados} de 3</strong> componentes
              sustentados
            </p>
            <p className="studio-campo-nota">
              {atual.obraId === null
                ? "A obra é o terceiro componente. Enquanto ela não for escolhida, a chave fica em 2 de 3 — que é onde o acervo inteiro está hoje."
                : "A obra fecha o terceiro componente. Esta é a conversão que a jornada existe para fazer."}
            </p>
          </section>

          <section className="studio-nao-sustenta">
            <span className="studio-nao-sustenta-rotulo">O que o acervo mede hoje</span>
            <ul className="web-denominadores">
              <li className="web-denominador">
                <span className="web-denominador-numero">{numeros.atuaEm}</span>
                <span className="web-denominador-rotulo">arestas atua_em no grafo</span>
              </li>
              <li className="web-denominador">
                <span className="web-denominador-numero">
                  {numeros.paraEventoDatado} de {numeros.paraEvento}
                </span>
                <span className="web-denominador-rotulo">ligam a evento datado</span>
              </li>
              <li className="web-denominador">
                <span className="web-denominador-numero">
                  {numeros.datadosComArtista} de {numeros.eventosDatados}
                </span>
                <span className="web-denominador-rotulo">eventos datados com artista</span>
              </li>
            </ul>
            <p>
              Das {numeros.atuaEm} arestas <Literal valor="atua_em" /> do grafo,{" "}
              {numeros.paraEvento} apontam para um evento — e{" "}
              <strong>nenhuma para um evento datado</strong>. Os que a Enciclopédia liga a
              artistas são históricos, sem sessão; os {numeros.eventosDatados} que têm
              ocorrência têm zero artistas. O produtor é o único ator com legitimidade para
              afirmar que fulano se apresenta sábado.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

function EscolhaDaObra({
  obras,
  rascunho,
  editavel,
  aoEscolher,
  aoPropor,
}: {
  obras: AgenteDoCatalogo[];
  rascunho: RascunhoDoProdutor;
  editavel: boolean;
  aoEscolher: (o: AgenteDoCatalogo | null) => void;
  aoPropor: (titulo: string) => void;
}) {
  const [busca, definirBusca] = useState("");

  const achados = useMemo(() => {
    const q = simplificar(busca);
    if (q.length < 2) return [];
    return obras.filter((o) => simplificar(o.titulo).includes(q)).slice(0, RESULTADOS_POR_BUSCA);
  }, [busca, obras]);

  const total = useMemo(() => {
    const q = simplificar(busca);
    return q.length < 2 ? 0 : obras.filter((o) => simplificar(o.titulo).includes(q)).length;
  }, [busca, obras]);

  return (
    <section className="studio-gerador">
      <h2 className="web-painel-titulo">Obra — o terceiro componente da chave</h2>

      {rascunho.obraId !== null ? (
        <div className="studio-escolhido">
          <span className="studio-escolhido-nome">{rascunho.obraTitulo}</span>
          {rascunho.obraProposta ? <span className="studio-selo">proposta</span> : null}
          <Literal valor={rascunho.obraId} />
          <button
            type="button"
            className="studio-botao studio-botao-linha"
            disabled={!editavel}
            onClick={() => aoEscolher(null)}
          >
            trocar
          </button>
        </div>
      ) : (
        <>
          <label className="studio-campo">
            <span className="studio-campo-rotulo">Buscar entre as {obras.length} obras do acervo</span>
            <input
              type="search"
              className="studio-campo-entrada"
              value={busca}
              disabled={!editavel}
              onChange={(e) => definirBusca(e.target.value)}
              placeholder="parte do título da obra"
            />
          </label>

          {busca.trim().length >= 2 ? (
            achados.length > 0 ? (
              <>
                <ul className="studio-resultados">
                  {achados.map((o) => (
                    <li key={o.id} className="studio-resultado">
                      <div className="studio-resultado-cabeca">
                        <span className="studio-resultado-nome">{o.titulo}</span>
                        <button
                          type="button"
                          className="studio-botao studio-botao-linha"
                          disabled={!editavel}
                          onClick={() => aoEscolher(o)}
                        >
                          escolher
                        </button>
                      </div>
                      {o.resumo ? <p className="studio-verbete">{o.resumo}</p> : null}
                      <Literal valor={o.id} />
                    </li>
                  ))}
                </ul>
                {total > achados.length ? (
                  <p className="studio-campo-nota">
                    Mostrando {achados.length} de {total}. Refine a busca para ver as outras.
                  </p>
                ) : null}
              </>
            ) : (
              <NaoAchou
                termo={busca}
                oQue="obra"
                editavel={editavel}
                aoPropor={() => {
                  aoPropor(busca.trim());
                  definirBusca("");
                }}
              />
            )
          ) : (
            <p className="studio-campo-nota">
              Digite ao menos duas letras. A obra é o que faz duas montagens do mesmo texto
              serem o mesmo evento — e o que o acervo não declara em nenhum dos 300.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function BuscaDeAgentes({
  agentes,
  papeis,
  editavel,
  jaNoElenco,
  aoVincular,
}: {
  agentes: AgenteDoCatalogo[];
  papeis: Array<{ papel: string; arestas: number }>;
  editavel: boolean;
  jaNoElenco: string[];
  aoVincular: (a: AgenteDoCatalogo, papel: string, proposto: boolean) => void;
}) {
  const [busca, definirBusca] = useState("");
  const [papel, definirPapel] = useState(papeis[0]?.papel ?? "");
  const [papelLivre, definirPapelLivre] = useState("");

  const usarLivre = papel === "";
  const papelEscolhido = usarLivre ? papelLivre.trim() : papel;

  const { achados, total } = useMemo(() => {
    const q = simplificar(busca);
    if (q.length < 2) return { achados: [], total: 0 };
    const todos = agentes.filter((a) => simplificar(a.titulo).includes(q));
    return { achados: todos.slice(0, RESULTADOS_POR_BUSCA), total: todos.length };
  }, [busca, agentes]);

  return (
    <section className="studio-gerador">
      <h2 className="web-painel-titulo">Elenco — quem faz, e com que papel</h2>

      {/* O PAPEL VEM ANTES DA BUSCA, e é decisão de ordem e não de layout: escolher a
          pessoa primeiro e o papel depois convida a vincular sem papel, que é a aresta
          inválida que a tela existe para impedir. */}
      <label className="studio-campo">
        <span className="studio-campo-rotulo">
          Papel <em className="studio-campo-exigido">obrigatório</em>
        </span>
        <select
          className="studio-campo-entrada"
          value={papel}
          disabled={!editavel}
          onChange={(e) => definirPapel(e.target.value)}
        >
          {papeis.map((p) => (
            <option key={p.papel} value={p.papel}>
              {p.papel} — {p.arestas} {p.arestas === 1 ? "aresta" : "arestas"} no acervo
            </option>
          ))}
          <option value="">outro papel, escrito por mim</option>
        </select>
        {usarLivre ? (
          <input
            type="text"
            className="studio-campo-entrada"
            value={papelLivre}
            disabled={!editavel}
            onChange={(e) => definirPapelLivre(e.target.value)}
            placeholder="direção, iluminação, curadoria…"
            aria-label="papel escrito por mim"
          />
        ) : null}
        <span className="studio-campo-nota">
          O acervo usa {papeis.length}{" "}
          {papeis.length === 1 ? "papel distinto" : "papéis distintos"} nas arestas que já
          existem. Papel novo é seu, e fica registrado como seu.
        </span>
      </label>

      <label className="studio-campo">
        <span className="studio-campo-rotulo">
          Buscar entre as {agentes.length} pessoas e coletivos do acervo
        </span>
        <input
          type="search"
          className="studio-campo-entrada"
          value={busca}
          disabled={!editavel}
          onChange={(e) => definirBusca(e.target.value)}
          placeholder="parte do nome"
        />
      </label>

      {busca.trim().length < 2 ? (
        <p className="studio-campo-nota">
          Digite ao menos duas letras. O verbete da Enciclopédia aparece junto de cada
          resultado, para conferência antes do vínculo.
        </p>
      ) : achados.length > 0 ? (
        <>
          <ul className="studio-resultados">
            {achados.map((a) => {
              const dentro = jaNoElenco.includes(a.id);
              return (
                <li key={a.id} className="studio-resultado">
                  <div className="studio-resultado-cabeca">
                    <span className="studio-resultado-nome">{a.titulo}</span>
                    <span className="studio-resultado-classe">{a.classe}</span>
                    <button
                      type="button"
                      className="studio-botao studio-botao-linha"
                      disabled={!editavel || dentro || papelEscolhido === ""}
                      onClick={() => aoVincular(a, papelEscolhido, false)}
                    >
                      {dentro ? "já no elenco" : `vincular como ${papelEscolhido || "…"}`}
                    </button>
                  </div>
                  {a.resumo ? <p className="studio-verbete">{a.resumo}</p> : null}
                  <Literal valor={a.id} />
                </li>
              );
            })}
          </ul>
          {total > achados.length ? (
            <p className="studio-campo-nota">
              Mostrando {achados.length} de {total}. Refine a busca para ver as outras.
            </p>
          ) : null}
          {papelEscolhido === "" ? (
            <p className="studio-campo-nota">
              Escolha ou escreva o papel para liberar o vínculo. A aresta{" "}
              <Literal valor="atua_em" /> não existe sem ele.
            </p>
          ) : null}
        </>
      ) : (
        <NaoAchou
          termo={busca}
          oQue="pessoa ou coletivo"
          editavel={editavel && papelEscolhido !== ""}
          aoPropor={() => {
            aoVincular(
              {
                id: `pessoa:proposta:${simplificar(busca).replace(/[^a-z0-9]+/g, "-")}`,
                titulo: busca.trim(),
                classe: "pessoa",
                resumo: "",
              },
              papelEscolhido,
              true,
            );
            definirBusca("");
          }}
        />
      )}
    </section>
  );
}

/**
 * A porta 1, quando a busca não acha.
 *
 * Ela não é um erro nem um beco: é estado, com o nível responsável nomeado e a saída
 * escrita. A proposta entra marcada e **não bloqueia o envio** — travar aqui faria o
 * produtor esperar por um nível que ele não controla, e a demonstração pararia no meio.
 */
function NaoAchou({
  termo,
  oQue,
  editavel,
  aoPropor,
}: {
  termo: string;
  oQue: string;
  editavel: boolean;
  aoPropor: () => void;
}) {
  return (
    <div className="studio-vazio">
      <p className="studio-nota">
        Nenhuma {oQue} do acervo casa com <strong>{termo.trim()}</strong>.
      </p>
      <p className="studio-campo-nota">
        {PORTAS.moderacao.estado} — a proposta vai para {PORTAS.moderacao.nivel}, entra
        marcada no elenco e não bloqueia o envio. {PORTAS.moderacao.saida}.
      </p>
      <div className="studio-acoes">
        <button
          type="button"
          className="studio-botao studio-botao-primario"
          disabled={!editavel}
          onClick={aoPropor}
        >
          Propor «{termo.trim()}» à moderação
        </button>
      </div>
      {!editavel ? (
        <p className="studio-campo-nota">
          Escolha o papel antes de propor: a aresta não existe sem ele.
        </p>
      ) : null}
    </div>
  );
}

function ElencoMontado({
  elenco,
  editavel,
  papeis,
  aoAlterarPapel,
  aoRemover,
}: {
  elenco: VinculoDeElenco[];
  editavel: boolean;
  papeis: Array<{ papel: string; arestas: number }>;
  aoAlterarPapel: (agenteId: string, papel: string) => void;
  aoRemover: (agenteId: string) => void;
}) {
  if (elenco.length === 0) {
    return (
      <section className="studio-vazio">
        <h2 className="web-painel-titulo">Elenco vazio</h2>
        <p className="studio-nota">
          Como os 129 eventos datados do acervo, que têm zero artistas vinculados. Cada
          vínculo declarado aqui é uma aresta <Literal valor="atua_em" /> que passa a existir.
        </p>
      </section>
    );
  }

  return (
    <section className="web-painel" data-elenco={elenco.length}>
      <h2 className="web-painel-titulo">
        {elenco.length} {elenco.length === 1 ? "vínculo" : "vínculos"} declarados
      </h2>
      <ul className="studio-grade-lista">
        {elenco.map((v) => (
          <li key={v.agenteId} className="studio-sessao" data-proposto={v.proposto ? "sim" : "nao"}>
            <div className="studio-sessao-cabeca">
              <span className="studio-resultado-nome">{v.agenteTitulo}</span>
              <span className="studio-resultado-classe">{v.agenteClasse}</span>
              {v.proposto ? <span className="studio-selo">proposto</span> : null}
              <button
                type="button"
                className="studio-botao studio-botao-linha"
                disabled={!editavel}
                onClick={() => aoRemover(v.agenteId)}
              >
                remover
              </button>
            </div>
            <label className="studio-campo">
              <span className="studio-rotulo">papel</span>
              <input
                type="text"
                className="studio-campo-entrada"
                value={v.papel}
                disabled={!editavel}
                list="studio-papeis"
                onChange={(e) => aoAlterarPapel(v.agenteId, e.target.value)}
                aria-label={`papel de ${v.agenteTitulo}`}
              />
            </label>
            {v.papel.trim() === "" ? (
              <p className="studio-sessao-colisao">
                Sem papel, este vínculo não é gravável.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <datalist id="studio-papeis">
        {papeis.map((p) => (
          <option key={p.papel} value={p.papel} />
        ))}
      </datalist>
    </section>
  );
}
