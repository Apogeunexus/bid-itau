"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CHAVE_DO_ARMAZEM, gravarArmazem, lerArmazem } from "./moderacao-armazem";
import type { DecisaoRegistrada, VinculoDeElenco } from "@/dados/moderacao";

/**
 * moderacao-elenco.tsx — o elenco declarado (M5, funcionalidade 116).
 *
 * A BARREIRA ÉTICA DO SISTEMA, e a única tela desta sessão em que a pessoa afetada não está
 * na conversa. Nas outras, quem submeteu recebe a decisão de volta e pode responder. Aqui a
 * afirmação é sobre um terceiro — que uma pessoa real se apresentou neste evento, neste
 * papel — e essa pessoa só descobre depois de publicado.
 *
 * POR QUE ELA EXISTE. A equipe se recusou a autorar arestas de elenco no protótipo, porque
 * autorar elenco seria uma afirmação factual falsa sobre pessoas reais. Quando o produtor
 * passa a declarar elenco, alguém precisa conferir — senão a plataforma publica, em nome do
 * Itaú Cultural, que alguém esteve onde não esteve.
 *
 * O VÍNCULO PROPOSTO NÃO SE DECIDE AQUI. Quando o nome digitado não casa com verbete
 * nenhum, confirmar criaria a pessoa pela porta dos fundos — a moderação estaria escrevendo
 * na Enciclopédia sem passar por ela. Esses vão para a reconciliação (M6) antes, e a tela
 * desabilita a confirmação em vez de deixar acontecer.
 *
 * DP-F: `"use client"`, e `@/dados/moderacao` entra **apenas por tipo**.
 */

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function ModeracaoElenco({
  vinculos,
  fraseDoElenco,
  porQueNaoAutoramos,
  moderador,
  carimbo,
}: {
  vinculos: VinculoDeElenco[];
  fraseDoElenco: string;
  porQueNaoAutoramos: string;
  moderador: string;
  carimbo: string;
}) {
  const [decisoes, setDecisoes] = useState<DecisaoRegistrada[]>([]);
  const [armazemLido, setArmazemLido] = useState(false);
  const [falhaDoArmazem, setFalhaDoArmazem] = useState<string | null>(null);
  const [escolhidoId, setEscolhidoId] = useState<string>(vinculos[0]?.id ?? "");
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

  const decididos = useMemo(() => new Set(decisoes.map((d) => d.itemId)), [decisoes]);
  const pendentes = useMemo(
    () => vinculos.filter((v) => !decididos.has(v.id)),
    [vinculos, decididos],
  );
  const vinculo = useMemo(
    () => pendentes.find((v) => v.id === escolhidoId) ?? pendentes[0],
    [pendentes, escolhidoId],
  );

  const motivoAparado = motivo.trim();
  const propostos = vinculos.filter((v) => v.proposto).length;

  const registrar = (acao: "aprovar" | "vetar", texto: string) => {
    if (!vinculo) return;
    // A CONFIRMAÇÃO NÃO EXISTE PARA VÍNCULO PROPOSTO. A trava é aqui e não só no botão:
    // confirmar um vínculo cujo agente não tem verbete criaria a pessoa pela porta dos
    // fundos, e é o caminho que a Enciclopédia se reservou.
    if (acao === "aprovar" && vinculo.proposto) return;
    setDecisoes((antes) => [
      {
        itemId: vinculo.id,
        itemTitulo: `${vinculo.agenteNome} · ${vinculo.papel} em «${vinculo.eventoTitulo}»`,
        origem: "produtor",
        acao,
        motivo: texto.trim() ? texto.trim() : null,
        autor: moderador,
        quando: carimbo,
        escopo: null,
        situacao: acao === "aprovar" ? "publicado" : "vetado",
      },
      ...antes.filter((d) => d.itemId !== vinculo.id),
    ]);
    setRecusando(false);
    setMotivo("");
  };

  /** Recusar uma afirmação sobre alguém encerra o assunto — e por isso exige motivo. */
  const registrarRecusa = () => {
    if (!motivoAparado) return;
    registrar("vetar", motivoAparado);
  };

  return (
    <div className="studio moderacao" data-elenco-moderacao>
      <header className="studio-cabecalho">
        <span className="studio-superficie">Moderação · elenco declarado</span>
        <h1 className="studio-titulo">
          {comSeparador(pendentes.length)}{" "}
          {pendentes.length === 1 ? "afirmação" : "afirmações"} sobre pessoas reais
        </h1>
        <p className="studio-objetivo">{fraseDoElenco}</p>
        <div className="moderacao-ficha-atalhos">
          <Link className="studio-botao" href="/moderacao/fila/">
            ← voltar à fila
          </Link>
          <Link className="studio-botao" data-ir-para="reconciliacao" href="/moderacao/reconciliacao/">
            reconciliação · {comSeparador(propostos)}
          </Link>
        </div>
      </header>

      <div className="moderacao-colunas">
        {/* ================================================================ */}
        {/* O VÍNCULO — a afirmação, e o verbete ao lado para conferir        */}
        {/* ================================================================ */}
        <section className="web-painel moderacao-coluna-ficha">
          {vinculo ? (
            <>
              <div className="studio-painel-cabeca">
                <span className="studio-painel-nome">A afirmação</span>
                {vinculo.proposto ? (
                  <span className="studio-pastilha studio-pastilha-marca">
                    agente proposto — sem verbete
                  </span>
                ) : null}
              </div>

              <div className="studio-tabela" data-vinculo={vinculo.id}>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">quem</div>
                  <div className="studio-celula">
                    <strong>{vinculo.agenteNome}</strong>
                  </div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">papel</div>
                  <div className="studio-celula">{vinculo.papel}</div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">onde</div>
                  <div className="studio-celula">{vinculo.eventoTitulo}</div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">sessão</div>
                  <div className="studio-celula">
                    <span data-nao-sustenta>
                      o acervo não liga elenco a sessão datada — a afirmação é sobre o
                      evento, não sobre uma data específica
                    </span>
                  </div>
                </div>
              </div>

              {/* ---- O VERBETE EMBUTIDO, para conferir sem sair da tela ---- */}
              <div className="moderacao-verbete" data-verbete={vinculo.verbeteId ?? ""}>
                <span className="studio-rotulo">o verbete da Enciclopédia</span>
                {vinculo.verbeteId ? (
                  <>
                    <p className="studio-nota">
                      {vinculo.verbeteResumo ?? (
                        <span data-nao-sustenta>
                          este verbete existe e não tem resumo no acervo
                        </span>
                      )}
                    </p>
                    {vinculo.verbeteRota ? (
                      <Link className="studio-botao" href={vinculo.verbeteRota}>
                        abrir o verbete
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <p className="studio-nota" data-nao-sustenta>
                    <strong>Nenhum verbete casa com este nome.</strong> Não há o que
                    conferir: confirmar aqui afirmaria que uma pessoa que a Enciclopédia não
                    conhece se apresentou neste evento — e criaria essa pessoa pela porta dos
                    fundos. Este vínculo vai para a reconciliação antes de qualquer decisão.
                  </p>
                )}
              </div>

              {/* ---- As duas decisões ---- */}
              <div className="studio-acoes moderacao-acoes">
                <button
                  type="button"
                  className="studio-botao studio-botao-primario"
                  data-acao-elenco="confirmar"
                  disabled={vinculo.proposto}
                  data-acao-barrada={vinculo.proposto ? "sim" : "nao"}
                  onClick={() => registrar("aprovar", "")}
                >
                  Confirmar a afirmação
                </button>
                <button
                  type="button"
                  className="studio-botao"
                  data-acao-elenco="recusar"
                  onClick={() => setRecusando(true)}
                >
                  Recusar · exige motivo
                </button>
                {vinculo.proposto ? (
                  <Link className="studio-botao" href="/moderacao/reconciliacao/">
                    reconciliar primeiro →
                  </Link>
                ) : null}
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
                    recusar a afirmação — motivo obrigatório
                  </span>
                  <label htmlFor="motivo-elenco" className="studio-rotulo">
                    por que esta afirmação não se sustenta
                  </label>
                  <textarea
                    id="motivo-elenco"
                    data-motivo-veto
                    className="moderacao-textarea"
                    rows={3}
                    autoFocus
                    value={motivo}
                    placeholder="Escreva o motivo. Sem ele a recusa não conclui."
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <p className="studio-nota">
                    Recusar encerra o assunto sem devolver a palavra a quem afirmou, e a
                    pessoa de quem se falou nunca soube que se falou dela. O motivo escrito é
                    o que permite, depois, alguém dizer por que aquela afirmação não entrou.
                  </p>
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
            <p className="studio-nota" data-elenco-vazio>
              Nenhum vínculo pendente. As {comSeparador(vinculos.length)} afirmações desta
              demonstração foram decididas — e cada uma passou por uma conferência contra o
              verbete, que é a única coisa que separa publicar de afirmar.
            </p>
          )}
        </section>

        {/* ================================================================ */}
        {/* A LISTA e a declaração                                           */}
        {/* ================================================================ */}
        <div className="moderacao-coluna-decisao">
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Os vínculos</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{comSeparador(pendentes.length)}</span>
                pendentes
              </span>
            </div>
            <ul className="web-lista-densa moderacao-lista">
              {pendentes.map((v) => (
                <li
                  key={v.id}
                  className="web-linha moderacao-linha"
                  data-vinculo-elenco={v.id}
                  data-proposto={v.proposto ? "sim" : "nao"}
                  data-realcado={vinculo?.id === v.id ? "sim" : "nao"}
                >
                  <button
                    type="button"
                    className="moderacao-atalho-item"
                    onClick={() => {
                      setEscolhidoId(v.id);
                      setRecusando(false);
                      setMotivo("");
                    }}
                  >
                    <span className="moderacao-selo-origem" data-origem="produtor">
                      {v.papel}
                    </span>
                    <span className="web-linha-titulo">{v.agenteNome}</span>
                    <span className="studio-rotulo">
                      {v.proposto ? "sem verbete — vai à reconciliação" : "verbete casado"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="web-painel">
            <div className="studio-nao-sustenta" data-nao-sustenta data-nao-autoramos>
              <span className="studio-nao-sustenta-rotulo">
                por que não autoramos elenco neste protótipo
              </span>
              <p>{porQueNaoAutoramos}</p>
              <p>
                Dos {comSeparador(vinculos.length)} vínculos desta tela,{" "}
                <strong>{comSeparador(propostos)}</strong> chegam com o nome numa grafia que
                não casa com verbete nenhum. Essa grafia é <strong>encenada</strong>: é o
                mesmo nome do acervo, escrito sem acento e sem pontuação, porque é assim que
                o caso aparece na vida real — e porque inventar uma pessoa que não existe
                para demonstrar a tela seria cometer exatamente o que ela existe para
                impedir.
              </p>
              <p>
                As decisões vão para o mesmo armazém das outras telas, sob{" "}
                <code className="studio-literal">{CHAVE_DO_ARMAZEM}</code>, com{" "}
                <strong>{moderador}</strong> e o carimbo <strong>{carimbo}</strong>.
              </p>
              {falhaDoArmazem ? <p data-falha-armazem>{falhaDoArmazem}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
