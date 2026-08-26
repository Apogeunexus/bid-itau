"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CHAVE_DO_ARMAZEM, gravarArmazem, lerArmazem } from "./moderacao-armazem";
import { situacaoApos } from "@/dados/tipos-acesso";
import type {
  ComponenteDoScore,
  DecisaoRegistrada,
  FaixaDeScore,
  ItemDaFila,
} from "@/dados/moderacao";

/**
 * moderacao-ia.tsx — a revisão da IA (M3, funcionalidade 111).
 *
 * A TELA QUE RESPONDE À PERGUNTA MAIS DIFÍCIL DO RFP: onde a IA não deve ser utilizada. A
 * resposta não é uma frase de rodapé — é a mecânica desta tela, e ela tem três partes.
 *
 * PRIMEIRA: o score é CONFERÍVEL. Ele não vem de modelo, de popularidade nem de sorteio: é
 * a fração de cinco perguntas objetivas respondidas pela ficha da própria entidade. Os cinco
 * componentes aparecem marcados um a um, com o peso de cada um, e quem refizer a conta a
 * olho chega ao mesmo número. Um score sem regra à vista é o recomendador opaco que esta
 * proposta recusa; por isso a regra vem junto do número, e não numa documentação à parte.
 *
 * SEGUNDA: aprovar é a ÚNICA porta. Nenhuma sugestão de IA vira dado público sem um humano
 * apertar um botão, e o botão fica registrado com nome e carimbo. A tela não «recomenda
 * aprovar» os de score alto nem esconde os de score baixo — ordenar por confiança faria a
 * ferramenta empurrar a decisão, e a decisão é de quem modera.
 *
 * TERCEIRA: a distribuição vem com a POPULAÇÃO ao lado do recorte. Publicar o recorte sem a
 * população é deixar quem lê tomar um pelo outro — e a fila usa rodízio entre faixas
 * justamente para que o caso de confiança baixa, que é onde a decisão humana pesa, não suma
 * de vista.
 *
 * DP-F: `"use client"`, e `@/dados/moderacao` entra **apenas por tipo**.
 */

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

/** "0.6" → "0,60". Vírgula porque a tela é em português e o número é lido em voz alta. */
function comoScore(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export function ModeracaoIa({
  itens,
  componentesDoScore,
  regraDoScore,
  porQueRodizio,
  distribuicao,
  limites,
  fraseDaPorta,
  moderador,
  carimbo,
}: {
  /** Só os itens de origem `ia`. Os outros não têm score, e esta tela é sobre o score. */
  itens: ItemDaFila[];
  componentesDoScore: readonly ComponenteDoScore[];
  regraDoScore: string;
  porQueRodizio: string;
  distribuicao: FaixaDeScore[];
  limites: readonly string[];
  fraseDaPorta: string;
  moderador: string;
  carimbo: string;
}) {
  const [decisoes, setDecisoes] = useState<DecisaoRegistrada[]>([]);
  const [armazemLido, setArmazemLido] = useState(false);
  const [falhaDoArmazem, setFalhaDoArmazem] = useState<string | null>(null);
  const [escolhidoId, setEscolhidoId] = useState<string>(itens[0]?.id ?? "");

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

  /**
   * A LISTA NÃO É ORDENADA POR SCORE, e isso é decisão de produto.
   *
   * Ordenar por confiança poria os de score alto no topo e ensinaria a varrer de cima para
   * baixo aprovando — a ferramenta estaria empurrando a decisão que ela existe para
   * entregar a um humano. A ordem é a da fila, e o score aparece em cada linha para ser
   * lido, não para ordenar.
   */
  const pendentes = useMemo(
    () => itens.filter((i) => !decididos.has(i.id)),
    [itens, decididos],
  );

  const item = useMemo(
    () => pendentes.find((i) => i.id === escolhidoId) ?? pendentes[0],
    [pendentes, escolhidoId],
  );

  const registrar = (acao: "aprovar" | "vetar", motivo: string) => {
    if (!item) return;
    setDecisoes((antes) => [
      {
        itemId: item.id,
        itemTitulo: item.titulo,
        origem: item.origem,
        acao,
        motivo: motivo.trim() ? motivo.trim() : null,
        autor: moderador,
        quando: carimbo,
        escopo: null,
        situacao: situacaoApos(acao),
      },
      ...antes.filter((d) => d.itemId !== item.id),
    ]);
    setDescartando(false);
    setMotivoDescarte("");
  };

  const [descartando, setDescartando] = useState(false);
  const [motivoDescarte, setMotivoDescarte] = useState("");
  const motivoAparado = motivoDescarte.trim();

  /** Descartar é vetar: encerra o assunto, e por isso exige motivo escrito. */
  const registrarDescarte = () => {
    if (!motivoAparado) return;
    registrar("vetar", motivoAparado);
  };

  /** A conta do score, refeita NA TELA a partir dos componentes marcados. */
  const somaConferida = item?.componentes
    ? item.componentes.reduce(
        (s, id) => s + (componentesDoScore.find((c) => c.id === id)?.peso ?? 0),
        0,
      )
    : 0;

  return (
    <div className="studio moderacao" data-revisao-ia>
      <header className="studio-cabecalho">
        <span className="studio-superficie">Moderação · revisão da IA</span>
        <h1 className="studio-titulo">
          {comSeparador(pendentes.length)}{" "}
          {pendentes.length === 1 ? "sugestão esperando" : "sugestões esperando"} decisão
          humana
        </h1>
        <p className="studio-objetivo">{fraseDaPorta}</p>
        <div className="moderacao-ficha-atalhos">
          <Link className="studio-botao" href="/moderacao/fila/">
            ← voltar à fila
          </Link>
          <Link className="studio-botao" data-ir-para="historico" href="/moderacao/historico/">
            meu histórico
          </Link>
          <span className="studio-pastilha">
            operando como <strong>{moderador}</strong>
          </span>
        </div>
      </header>

      <div className="moderacao-colunas">
        {/* ================================================================ */}
        {/* O ITEM — os cinco componentes marcados, e a conta refeita         */}
        {/* ================================================================ */}
        <section className="web-painel moderacao-coluna-ficha">
          {item && item.score !== null && item.componentes ? (
            <>
              <div className="studio-painel-cabeca">
                <span className="studio-painel-nome">{item.titulo}</span>
                <span className="studio-pastilha">{item.classe}</span>
                <span className="studio-pastilha">procedência {item.procedencia}</span>
              </div>

              {/* ---- O SCORE, e a conta que qualquer pessoa refaz ---- */}
              <div className="moderacao-bloco-score" data-score-do-item={item.score}>
                <div className="studio-painel-cabeca">
                  <span className="studio-painel-nome">Score de confiança</span>
                  <span className="studio-pastilha studio-pastilha-marca">
                    <span className="studio-pastilha-numero">{comoScore(item.score)}</span>
                    de 1,00
                  </span>
                </div>

                <ul className="moderacao-componentes">
                  {componentesDoScore.map((c) => {
                    const atende = item.componentes?.includes(c.id) ?? false;
                    return (
                      <li
                        key={c.id}
                        className="moderacao-componente"
                        data-componente-score={c.id}
                        data-atende={atende ? "sim" : "nao"}
                      >
                        <span className="moderacao-componente-marca" aria-hidden>
                          {atende ? "●" : "○"}
                        </span>
                        <span className="moderacao-componente-texto">
                          <strong>{c.rotulo}</strong>
                          <span className="studio-nota">{c.observa}</span>
                        </span>
                        <span className="moderacao-componente-peso">
                          {atende ? `+${comoScore(c.peso)}` : "0,00"}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* A CONTA, SOMADA NA TELA. Não é enfeite: é a diferença entre «confie
                    neste número» e «confira este número». A soma dos pesos marcados é
                    exibida ao lado do score, e as duas têm de bater — se um dia não
                    batessem, quem opera veria antes de qualquer gate. */}
                <p className="moderacao-conta-do-score" data-conta-conferida={somaConferida.toFixed(2)}>
                  Somando os componentes marcados: {""}
                  <strong>{comoScore(somaConferida)}</strong>. O score exibido é{" "}
                  <strong>{comoScore(item.score)}</strong>.{" "}
                  {Math.abs(somaConferida - item.score) < 0.005 ? (
                    <>As duas contas batem, e é assim que este número se torna conferível.</>
                  ) : (
                    <span data-nao-sustenta>
                      As duas contas NÃO batem. Isso é defeito do cálculo, não da tela — o
                      score perdeu a propriedade que o torna auditável.
                    </span>
                  )}
                </p>

                <p className="studio-nota moderacao-regra-score">{regraDoScore}</p>
              </div>

              {/* ---- A ARESTA que produziu a sugestão ---- */}
              {item.sugestao ? (
                <div className="moderacao-sugestao">
                  <span className="studio-rotulo">por que a IA sugeriu isto</span>
                  <p className="selo-motivo">
                    <span>{item.sugestao.motivo}</span>
                  </p>
                  <p className="studio-nota">
                    Travessia do acervo a partir de «{item.sugestao.deTitulo}», pela relação
                    «{item.sugestao.relacao}». A frase acima é a da própria ligação, com
                    procedência {item.sugestao.procedenciaAresta} —{" "}
                    <strong>a IA não a escreveu</strong>. Ela alcançou um verbete que já
                    existia, por uma aresta que já existia.
                  </p>
                </div>
              ) : null}

              {/* ---- As duas decisões possíveis, e a assimetria entre elas ---- */}
              <div className="studio-acoes moderacao-acoes">
                <button
                  type="button"
                  className="studio-botao studio-botao-primario"
                  data-acao-ia="aprovar"
                  onClick={() => registrar("aprovar", "")}
                >
                  Aprovar — vira dado público
                </button>
                <button
                  type="button"
                  className="studio-botao"
                  data-acao-ia="descartar"
                  onClick={() => setDescartando(true)}
                >
                  Descartar · exige motivo
                </button>
              </div>

              {descartando ? (
                <form
                  className="moderacao-veto"
                  onSubmit={(e) => {
                    e.preventDefault();
                    registrarDescarte();
                  }}
                >
                  <span className="studio-nao-sustenta-rotulo">
                    descartar a sugestão — motivo obrigatório
                  </span>
                  <label htmlFor="motivo-descarte" className="studio-rotulo">
                    por que esta sugestão não se sustenta
                  </label>
                  <textarea
                    id="motivo-descarte"
                    data-motivo-veto
                    className="moderacao-textarea"
                    rows={3}
                    autoFocus
                    value={motivoDescarte}
                    placeholder="Escreva o motivo. Sem ele o descarte não conclui."
                    onChange={(e) => setMotivoDescarte(e.target.value)}
                  />
                  <p className="studio-nota">
                    Descartar é vetar: encerra o assunto sem devolver a palavra a ninguém, e
                    por isso é a que deve explicação por escrito. Sem motivo, a sugestão
                    sumiria da fila e ninguém conseguiria dizer por quê — inclusive quem
                    quisesse melhorar a regra que a produziu.
                  </p>
                  <div className="studio-acoes">
                    <button
                      type="submit"
                      className="studio-botao studio-botao-primario"
                      disabled={!motivoAparado}
                      data-veto-bloqueado={motivoAparado ? "nao" : "sim"}
                    >
                      Confirmar descarte
                    </button>
                    <button
                      type="button"
                      className="studio-botao"
                      onClick={() => {
                        setDescartando(false);
                        setMotivoDescarte("");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : null}
            </>
          ) : (
            <p className="studio-nota" data-ia-vazio>
              Nenhuma sugestão de IA pendente. Todas as {comSeparador(itens.length)} foram
              decididas nesta sessão — e cada uma delas passou por um clique humano, que é a
              única porta que existe.
            </p>
          )}
        </section>

        {/* ================================================================ */}
        {/* A LISTA, a distribuição e os limites                              */}
        {/* ================================================================ */}
        <div className="moderacao-coluna-decisao">
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">As sugestões</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">
                  {comSeparador(pendentes.length)}
                </span>
                pendentes
              </span>
            </div>
            <ul className="web-lista-densa moderacao-lista">
              {pendentes.map((i) => (
                <li
                  key={i.id}
                  className="web-linha moderacao-linha"
                  data-sugestao-ia={i.id}
                  data-realcado={item?.id === i.id ? "sim" : "nao"}
                >
                  <button
                    type="button"
                    className="moderacao-atalho-item"
                    onClick={() => {
                      setEscolhidoId(i.id);
                      setDescartando(false);
                      setMotivoDescarte("");
                    }}
                  >
                    <span className="moderacao-score" data-score-ia={i.score ?? 0}>
                      <span className="moderacao-score-rotulo">confiança</span>
                      <span className="moderacao-score-numero">
                        {comoScore(i.score ?? 0)}
                      </span>
                    </span>
                    <span className="web-linha-titulo">{i.titulo}</span>
                  </button>
                </li>
              ))}
            </ul>
            {/* A ordem é a da fila, e a tela diz que é. Ordenar por confiança poria os de
                score alto no topo e ensinaria a varrer aprovando — a ferramenta empurrando
                a decisão que ela existe para entregar a um humano. */}
            <p className="studio-nota" data-ordem-declarada>
              A lista NÃO é ordenada por score. Ordenar por confiança poria os mais altos no
              topo e ensinaria a varrer de cima para baixo aprovando — e o caso em que a
              decisão humana pesa é justamente o de confiança baixa. A ordem é a da fila; o
              score está em cada linha para ser lido, não para ordenar.
            </p>
          </section>

          {/* ---- A distribuição: o recorte E a população ---- */}
          <section className="web-painel moderacao-distribuicao">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A faixa de confiança, contada</span>
            </div>
            <div className="web-denominadores">
              {distribuicao.map((f) => (
                <span
                  key={f.score}
                  className="web-denominador"
                  data-faixa-score={comoScore(f.score)}
                >
                  <span className="web-denominador-numero">{f.naFila}</span>
                  <span className="web-denominador-rotulo">
                    score {comoScore(f.score)} · {comSeparador(f.naPopulacao)} na população
                  </span>
                </span>
              ))}
            </div>
            <p className="studio-nota">{porQueRodizio}</p>
          </section>

          {/* ---- Os limites: o que a IA nunca propõe ---- */}
          <footer className="moderacao-limites" data-limites-ia>
            <span className="studio-nao-sustenta-rotulo">onde a IA não é utilizada</span>
            <ul>
              {limites.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </footer>

          <section className="web-painel">
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">a porta única</span>
              <p>
                As decisões desta tela vão para o mesmo armazém da fila, sob a chave{" "}
                <code className="studio-literal">{CHAVE_DO_ARMAZEM}</code>, com{" "}
                <strong>{moderador}</strong> e o carimbo <strong>{carimbo}</strong>. Uma
                sugestão aprovada aqui aparece decidida lá: não há duas contabilidades.
              </p>
              {falhaDoArmazem ? <p data-falha-armazem>{falhaDoArmazem}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
