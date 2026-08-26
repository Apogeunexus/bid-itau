"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CHAVE_DO_ARMAZEM, gravarArmazem, lerArmazem } from "./moderacao-armazem";
import type { DecisaoRegistrada, PropostaDeAgente } from "@/dados/moderacao";

/**
 * moderacao-reconciliacao.tsx — reconciliação com a Enciclopédia (M6, funcionalidade 117).
 *
 * O ÚNICO CAMINHO DE ESCRITA sobre `pessoa`, `coletivo` e `obra`. O Studio lê essas quatro
 * classes e nunca as edita: são 575 pessoas no protótipo e 43.614 na base completa — pessoas
 * reais que nunca se cadastraram e cujo verbete foi escrito por quem o escreveu. Um produtor
 * editando o verbete de um artista real seria a violação exata que este projeto se proibiu.
 *
 * O QUE ESTA TELA FAZ, E É SÓ ISSO: LIGA. Ela liga um nome digitado a um verbete que já
 * existe, ou encaminha a criação ao Editor. **Ela não escreve verbete e não edita verbete.**
 * O aviso fica permanente na tela, não numa nota de rodapé.
 *
 * SEM PONTUAÇÃO DE SIMILARIDADE. Os candidatos aparecem por casamento de nome normalizado, e
 * por mais nada. Um número alto entre dois nomes parecidos é exatamente o que faz duas
 * pessoas diferentes virarem uma só — e do ponto de vista de quem foi apagado, o erro é
 * irreversível. A decisão é da ficha ao lado da ficha.
 *
 * DP-F: `"use client"`, e `@/dados/moderacao` entra **apenas por tipo**.
 */

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function ModeracaoReconciliacao({
  propostas,
  verbeteEAutoridade,
  regraDaReconciliacao,
  pessoasNoPrototipo,
  pessoasNaBaseCompleta,
  moderador,
  carimbo,
}: {
  propostas: PropostaDeAgente[];
  verbeteEAutoridade: string;
  regraDaReconciliacao: string;
  pessoasNoPrototipo: number;
  pessoasNaBaseCompleta: number;
  moderador: string;
  carimbo: string;
}) {
  const [decisoes, setDecisoes] = useState<DecisaoRegistrada[]>([]);
  const [armazemLido, setArmazemLido] = useState(false);
  const [falhaDoArmazem, setFalhaDoArmazem] = useState<string | null>(null);
  const [escolhidaId, setEscolhidaId] = useState<string>(propostas[0]?.id ?? "");
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    const lido = lerArmazem();
    setDecisoes(lido.decisoes);
    setFalhaDoArmazem(lido.falha);
    setArmazemLido(true);
  }, []);

  useEffect(() => {
    if (armazemLido) setFalhaDoArmazem(gravarArmazem(decisoes));
  }, [decisoes, armazemLido]);

  const decididas = useMemo(() => new Set(decisoes.map((d) => d.itemId)), [decisoes]);
  const pendentes = useMemo(
    () => propostas.filter((p) => !decididas.has(p.id)),
    [propostas, decididas],
  );
  const proposta = useMemo(
    () => pendentes.find((p) => p.id === escolhidaId) ?? pendentes[0],
    [pendentes, escolhidaId],
  );

  const motivoAparado = motivo.trim();

  const registrar = (
    acao: "aprovar" | "devolver" | "vetar",
    texto: string,
    titulo: string,
  ) => {
    if (!proposta) return;
    setDecisoes((antes) => [
      {
        itemId: proposta.id,
        itemTitulo: titulo,
        origem: "produtor",
        acao,
        motivo: texto.trim() ? texto.trim() : null,
        autor: moderador,
        quando: carimbo,
        escopo: null,
        situacao:
          acao === "aprovar" ? "publicado" : acao === "devolver" ? "devolvido" : "vetado",
      },
      ...antes.filter((d) => d.itemId !== proposta.id),
    ]);
    setRecusando(false);
    setMotivo("");
  };

  const registrarRecusa = () => {
    if (!motivoAparado || !proposta) return;
    registrar("vetar", motivoAparado, `proposta «${proposta.nomeDigitado}» recusada`);
  };

  return (
    <div className="studio moderacao" data-reconciliacao-moderacao>
      <header className="studio-cabecalho">
        <span className="studio-superficie">Moderação · reconciliação</span>
        <h1 className="studio-titulo">
          {comSeparador(pendentes.length)}{" "}
          {pendentes.length === 1 ? "proposta de agente" : "propostas de agente"}
        </h1>
        <p className="studio-objetivo">
          Um nome digitado por quem submeteu, sem verbete que case. Aqui ele é ligado a um
          verbete que já existe, ou a criação é encaminhada ao Editor.{" "}
          <strong>A moderação liga; ela não escreve verbete.</strong>
        </p>
        <div className="moderacao-ficha-atalhos">
          <Link className="studio-botao" href="/moderacao/fila/">
            ← voltar à fila
          </Link>
          <Link className="studio-botao" data-ir-para="elenco" href="/moderacao/elenco/">
            elenco declarado
          </Link>
        </div>
      </header>

      {/* O AVISO É PERMANENTE, e fica acima da decisão — não num rodapé. Ele é a regra que
          torna esta tela a única porta de escrita que não viola a Enciclopédia. */}
      <div className="moderacao-aviso-permanente" data-aviso-enciclopedia>
        <span className="studio-nao-sustenta-rotulo">
          verbete é autoridade da Enciclopédia
        </span>
        <p>{verbeteEAutoridade}</p>
      </div>

      <div className="moderacao-colunas">
        <section className="web-painel moderacao-coluna-ficha">
          {proposta ? (
            <>
              <div className="studio-painel-cabeca">
                <span className="studio-painel-nome">
                  «{proposta.nomeDigitado}»
                </span>
                <span className="studio-pastilha">{proposta.papel}</span>
              </div>
              <p className="studio-nota">
                Digitado por quem submeteu, ao declarar elenco em «{proposta.eventoTitulo}».
              </p>

              {/* ---- A COMPARAÇÃO, campo a campo ---- */}
              <div className="studio-painel-cabeca">
                <span className="studio-painel-nome">Candidatos no acervo</span>
                <span className="studio-pastilha">
                  <span className="studio-pastilha-numero">
                    {comSeparador(proposta.candidatos.length)}
                  </span>
                  {proposta.candidatos.length === 1 ? "candidato" : "candidatos"}
                </span>
              </div>

              {proposta.candidatos.length ? (
                <ul className="moderacao-candidatos">
                  {proposta.candidatos.map((c) => (
                    <li key={c.id} className="moderacao-candidato" data-candidato={c.id}>
                      <div className="studio-tabela">
                        <div className="studio-linha">
                          <div className="studio-celula studio-celula-rotulo">
                            nome digitado
                          </div>
                          <div className="studio-celula">{proposta.nomeDigitado}</div>
                        </div>
                        <div className="studio-linha">
                          <div className="studio-celula studio-celula-rotulo">
                            verbete no acervo
                          </div>
                          <div className="studio-celula">
                            <strong>{c.titulo}</strong>
                          </div>
                        </div>
                        <div className="studio-linha">
                          <div className="studio-celula studio-celula-rotulo">classe</div>
                          <div className="studio-celula">{c.classe}</div>
                        </div>
                        <div className="studio-linha">
                          <div className="studio-celula studio-celula-rotulo">resumo</div>
                          <div className="studio-celula">
                            {c.resumo ?? (
                              <span data-nao-sustenta>
                                o acervo não publica resumo para este verbete
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="studio-linha">
                          <div className="studio-celula studio-celula-rotulo">
                            alcance no acervo
                          </div>
                          <div className="studio-celula">
                            {comSeparador(c.grau)} ligações
                          </div>
                        </div>
                        <div className="studio-linha">
                          <div className="studio-celula studio-celula-rotulo">
                            por que apareceu
                          </div>
                          {/* NUNCA «similaridade 0,87». O que traz o candidato é dito por
                              extenso, e é uma regra que se confere, não um número. */}
                          <div className="studio-celula">{c.porqueApareceu}</div>
                        </div>
                      </div>
                      <div className="studio-acoes">
                        <button
                          type="button"
                          className="studio-botao studio-botao-primario"
                          data-reconciliar={c.id}
                          onClick={() =>
                            registrar(
                              "aprovar",
                              "",
                              `«${proposta.nomeDigitado}» reconciliado com «${c.titulo}»`,
                            )
                          }
                        >
                          Reconciliar com este verbete
                        </button>
                        {c.rota ? (
                          <Link className="studio-botao" href={c.rota}>
                            abrir o verbete
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="studio-nota" data-sem-candidato>
                  <strong>Nenhum verbete do acervo casa com este nome.</strong> A moderação
                  não cria o verbete: o caminho é encaminhar ao Editor, que é quem responde
                  pela Enciclopédia.
                </p>
              )}

              {/* ---- Os dois caminhos que não são reconciliar ---- */}
              <div className="studio-acoes moderacao-acoes">
                <button
                  type="button"
                  className="studio-botao"
                  data-encaminhar-criacao
                  onClick={() =>
                    registrar(
                      "devolver",
                      "Nenhum verbete do acervo corresponde; criação encaminhada ao Editor.",
                      `criação de «${proposta.nomeDigitado}» encaminhada ao Editor`,
                    )
                  }
                >
                  Nenhum destes — encaminhar criação ao Editor
                </button>
                <button
                  type="button"
                  className="studio-botao"
                  data-recusar-proposta
                  onClick={() => setRecusando(true)}
                >
                  Recusar a proposta · exige motivo
                </button>
              </div>

              {recusando ? (
                <form
                  className="moderacao-veto"
                  onSubmit={(e) => {
                    e.preventDefault();
                    registrarRecusa();
                  }}
                >
                  <span className="studio-nao-sustenta-rotulo">
                    recusar a proposta — motivo obrigatório
                  </span>
                  <label htmlFor="motivo-proposta" className="studio-rotulo">
                    por que esta proposta não segue
                  </label>
                  <textarea
                    id="motivo-proposta"
                    data-motivo-veto
                    className="moderacao-textarea"
                    rows={3}
                    autoFocus
                    value={motivo}
                    placeholder="Escreva o motivo. Sem ele a recusa não conclui."
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <div className="studio-acoes">
                    <button
                      type="submit"
                      className="studio-botao studio-botao-primario"
                      disabled={!motivoAparado}
                      data-veto-bloqueado={motivoAparado ? "nao" : "sim"}
                    >
                      Confirmar recusa
                    </button>
                    <button
                      type="button"
                      className="studio-botao"
                      onClick={() => {
                        setRecusando(false);
                        setMotivo("");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : null}
            </>
          ) : (
            <p className="studio-nota" data-reconciliacao-vazia>
              Nenhuma proposta pendente. As {comSeparador(propostas.length)} desta
              demonstração foram decididas — cada uma ligada a um verbete existente,
              encaminhada ao Editor, ou recusada com motivo.
            </p>
          )}
        </section>

        <div className="moderacao-coluna-decisao">
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">As propostas</span>
            </div>
            <ul className="web-lista-densa moderacao-lista">
              {pendentes.map((p) => (
                <li
                  key={p.id}
                  className="web-linha moderacao-linha"
                  data-proposta={p.id}
                  data-realcado={proposta?.id === p.id ? "sim" : "nao"}
                >
                  <button
                    type="button"
                    className="moderacao-atalho-item"
                    onClick={() => {
                      setEscolhidaId(p.id);
                      setRecusando(false);
                      setMotivo("");
                    }}
                  >
                    <span className="web-linha-titulo">{p.nomeDigitado}</span>
                    <span className="studio-rotulo">
                      {p.candidatos.length
                        ? `${comSeparador(p.candidatos.length)} candidato(s)`
                        : "nenhum candidato — vai ao Editor"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="web-painel">
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">como os candidatos aparecem</span>
              <p>{regraDaReconciliacao}</p>
            </div>
            <div className="studio-nao-sustenta" data-nao-sustenta data-denominador-enciclopedia>
              <span className="studio-nao-sustenta-rotulo">o tamanho da Enciclopédia</span>
              <p>
                São <strong>{comSeparador(pessoasNoPrototipo)}</strong> pessoas neste
                protótipo e <strong>{comSeparador(pessoasNaBaseCompleta)}</strong> na base
                completa. Uma reconciliação que erra liga o trabalho de uma pessoa ao verbete
                de outra — e quem foi apagado não tem como saber que foi.
              </p>
              <p>
                Nesta demonstração toda grafia proposta encontra o verbete de origem, porque
                foi dele que ela veio. O caminho «nenhum destes» existe e é o que se usa
                quando a pessoa digitada de fato não está na Enciclopédia — a tela não o
                esconde só porque o dado encenado não o exercita.
              </p>
              {falhaDoArmazem ? <p data-falha-armazem>{falhaDoArmazem}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
