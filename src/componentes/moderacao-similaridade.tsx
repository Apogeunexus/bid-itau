"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CHAVE_DO_ARMAZEM, gravarArmazem, lerArmazem } from "./moderacao-armazem";
import type { DecisaoRegistrada, PanoramaDaSimilaridade } from "@/dados/moderacao";

/**
 * moderacao-similaridade.tsx — a revisão de `semelhante_a` (M4, funcionalidade 112).
 *
 * O PROBLEMA É DE ESCALA, E ELE É REAL: 47.259 arestas, 71% do grafo, todas de máquina,
 * nenhuma revisada por humano. A um minuto por aresta, oito horas por dia, são mais de
 * quatro meses de trabalho contínuo para uma pessoa. Uma fila item a item não é uma opção
 * cara — é uma opção que não existe.
 *
 * E FINGIR QUE REVISOU SERIA PIOR DO QUE NÃO REVISAR. Uma tela com cem arestas e um botão
 * «aprovar todas» produziria carimbo de revisão humana sobre 47 mil ligações que ninguém
 * leu — e o carimbo é justamente o que daria a elas o peso que hoje não têm. O acervo
 * passaria a afirmar que foram conferidas, o que é falso, e ninguém conseguiria distinguir
 * as conferidas das outras.
 *
 * A SAÍDA É GOVERNAR A REGRA. As arestas compartilham famílias de justificativa; decidir
 * sobre a família é uma decisão que uma pessoa consegue tomar de fato — ela lê a regra, lê
 * a amostra, e diz se a regra se sustenta. **O que não se pode é chamar isso de "revisado"
 * sem o denominador**, e é por isso que o contador de quantas seguem sem revisão fica no
 * topo da tela e não no rodapé.
 *
 * DP-F: `"use client"`, e `@/dados/moderacao` entra **apenas por tipo**.
 */

type Veredito = "aprovada" | "ajustar" | "reprovada";

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function ModeracaoSimilaridade({
  panorama,
  fraseDaRevisaoHonesta,
  moderador,
  carimbo,
}: {
  panorama: PanoramaDaSimilaridade;
  fraseDaRevisaoHonesta: string;
  moderador: string;
  carimbo: string;
}) {
  const [decisoes, setDecisoes] = useState<DecisaoRegistrada[]>([]);
  const [armazemLido, setArmazemLido] = useState(false);
  const [falhaDoArmazem, setFalhaDoArmazem] = useState<string | null>(null);
  const [abertaId, setAbertaId] = useState<string>(panorama.familias[0]?.id ?? "");

  useEffect(() => {
    const lido = lerArmazem();
    setDecisoes(lido.decisoes);
    setFalhaDoArmazem(lido.falha);
    setArmazemLido(true);
  }, []);

  useEffect(() => {
    if (armazemLido) setFalhaDoArmazem(gravarArmazem(decisoes));
  }, [decisoes, armazemLido]);

  /** O veredito de cada família, lido do armazém pelo id. */
  const vereditos = useMemo(() => {
    const m = new Map<string, Veredito>();
    for (const d of decisoes) {
      if (!d.itemId.startsWith("familia:")) continue;
      m.set(
        d.itemId,
        d.acao === "aprovar" ? "aprovada" : d.acao === "editar" ? "ajustar" : "reprovada",
      );
    }
    return m;
  }, [decisoes]);

  /**
   * O CONTADOR HONESTO. Quantas arestas as decisões desta sessão alcançaram, e quantas
   * seguem sem revisão nenhuma. Sem os dois números, «revisado» é uma palavra sem tamanho.
   */
  const alcancadas = useMemo(
    () =>
      panorama.familias
        .filter((f) => vereditos.has(f.id))
        .reduce((s, f) => s + f.arestas, 0),
    [panorama.familias, vereditos],
  );
  const semRevisao = panorama.totalDeArestas - alcancadas;
  const pctAlcancado = Math.round((alcancadas / panorama.totalDeArestas) * 100);
  const pctDoGrafo = Math.round(
    (panorama.totalDeArestas / panorama.totalDoGrafo) * 100,
  );

  const familia = useMemo(
    () => panorama.familias.find((f) => f.id === abertaId) ?? panorama.familias[0],
    [panorama.familias, abertaId],
  );

  const [motivo, setMotivo] = useState("");
  const [reprovando, setReprovando] = useState(false);
  const motivoAparado = motivo.trim();

  const decidir = (veredito: Veredito, texto: string) => {
    if (!familia) return;
    // Reprovar uma família encerra o assunto sobre milhares de arestas de uma vez, e por
    // isso é a que exige motivo — a mesma assimetria da fila, na escala em que ela mais
    // importa.
    if (veredito === "reprovada" && !texto.trim()) return;
    setDecisoes((antes) => [
      {
        itemId: familia.id,
        itemTitulo: `família «${familia.padrao}» — ${comSeparador(familia.arestas)} arestas`,
        origem: "ia",
        acao:
          veredito === "aprovada" ? "aprovar" : veredito === "ajustar" ? "editar" : "vetar",
        motivo: texto.trim() ? texto.trim() : null,
        autor: moderador,
        quando: carimbo,
        escopo: null,
        situacao: veredito === "reprovada" ? "vetado" : "publicado",
      },
      ...antes.filter((d) => d.itemId !== familia.id),
    ]);
    setReprovando(false);
    setMotivo("");
  };

  return (
    <div className="studio moderacao" data-similaridade-moderacao>
      <header className="studio-cabecalho">
        <span className="studio-superficie">Moderação · revisão de similaridade</span>
        <h1 className="studio-titulo">
          {comSeparador(panorama.totalDeArestas)} ligações de máquina, {pctDoGrafo}% do
          grafo
        </h1>
        <p className="studio-objetivo">{fraseDaRevisaoHonesta}</p>
        <div className="moderacao-ficha-atalhos">
          <Link className="studio-botao" href="/moderacao/fila/">
            ← voltar à fila
          </Link>
        </div>

        {/* ================================================================ */}
        {/* O CONTADOR HONESTO — no topo, e não no rodapé                     */}
        {/* ================================================================ */}
        <div className="web-denominadores" data-contador-revisao={alcancadas}>
          <span className="web-denominador" data-revisao="alcancada" data-valor={alcancadas}>
            <span className="web-denominador-numero">{comSeparador(alcancadas)}</span>
            <span className="web-denominador-rotulo">
              arestas alcançadas por decisão nesta sessão · {pctAlcancado}%
            </span>
          </span>
          <span className="web-denominador" data-revisao="sem-revisao" data-valor={semRevisao}>
            <span className="web-denominador-numero">{comSeparador(semRevisao)}</span>
            <span className="web-denominador-rotulo">
              seguem SEM revisão nenhuma · {100 - pctAlcancado}%
            </span>
          </span>
        </div>
      </header>

      <div className="moderacao-colunas">
        {/* ================================================================ */}
        {/* AS FAMÍLIAS                                                      */}
        {/* ================================================================ */}
        <section className="web-painel moderacao-coluna-ficha">
          <div className="studio-painel-cabeca">
            <span className="studio-painel-nome">Famílias por padrão de justificativa</span>
            <span className="studio-pastilha">
              <span className="studio-pastilha-numero">
                {comSeparador(panorama.familias.length)}
              </span>
              de {comSeparador(panorama.totalDeFamilias)}
            </span>
          </div>

          <ul className="moderacao-familias">
            {panorama.familias.map((f) => {
              const v = vereditos.get(f.id);
              return (
                <li
                  key={f.id}
                  className="moderacao-familia"
                  data-familia={f.id}
                  data-veredito={v ?? "pendente"}
                  data-arestas={f.arestas}
                  data-realcado={familia?.id === f.id ? "sim" : "nao"}
                >
                  <button
                    type="button"
                    className="moderacao-atalho-item"
                    onClick={() => {
                      setAbertaId(f.id);
                      setReprovando(false);
                      setMotivo("");
                    }}
                  >
                    <span className="moderacao-familia-numero">
                      {comSeparador(f.arestas)}
                    </span>
                    <span className="web-linha-titulo">{f.padrao}</span>
                    {v ? (
                      <span className="studio-rotulo">{v}</span>
                    ) : (
                      <span className="studio-rotulo">sem revisão</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* A CAUDA ENTRA COMO NÚMERO, e não some. 529 famílias somando 28.352 arestas
              não cabem numa tela, e omiti-las faria as 12 mostradas parecerem o conjunto
              inteiro — a mesma falha de uma lista truncada em silêncio, na escala em que
              ela esconde mais da metade do problema. */}
          <p className="studio-nota" data-cauda={panorama.arestasNaCauda}>
            Outras <strong>{comSeparador(panorama.familiasNaCauda)}</strong> famílias somam{" "}
            <strong>{comSeparador(panorama.arestasNaCauda)}</strong> arestas e não aparecem
            nesta lista — são padrões com poucas ligações cada, e mostrá-los todos daria uma
            tela de {comSeparador(panorama.totalDeFamilias)} linhas que ninguém percorre. Eles
            entram no contador de «sem revisão» acima, que é onde precisam estar.
          </p>
        </section>

        {/* ================================================================ */}
        {/* A AMOSTRA E O VEREDITO                                           */}
        {/* ================================================================ */}
        <div className="moderacao-coluna-decisao">
          {familia ? (
            <section className="web-painel">
              <div className="studio-painel-cabeca">
                <span className="studio-painel-nome">{familia.padrao}</span>
                <span className="studio-pastilha studio-pastilha-marca">
                  <span className="studio-pastilha-numero">
                    {comSeparador(familia.arestas)}
                  </span>
                  arestas
                </span>
              </div>

              <span className="studio-rotulo">
                amostra de {comSeparador(panorama.tamanhoDaAmostra)}
              </span>
              <ul className="moderacao-amostra">
                {familia.amostra.map((a, i) => (
                  <li key={`${a.de}-${a.para}-${i}`} className="moderacao-ligacao" data-ligacao={i}>
                    <span className="moderacao-ligacao-nos">
                      <strong>{a.de}</strong>
                      <span aria-hidden>↔</span>
                      <strong>{a.para}</strong>
                    </span>
                    <p className="selo-motivo">
                      <span>{a.motivo}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <p className="studio-nota">{panorama.metodoDaAmostra}</p>

              {/* ---- Os três vereditos, sobre a FAMÍLIA inteira ---- */}
              <div className="studio-acoes moderacao-acoes">
                <button
                  type="button"
                  className="studio-botao studio-botao-primario"
                  data-veredito-familia="aprovada"
                  onClick={() => decidir("aprovada", "")}
                >
                  A regra se sustenta — aprovar as {comSeparador(familia.arestas)}
                </button>
                <button
                  type="button"
                  className="studio-botao"
                  data-veredito-familia="ajustar"
                  onClick={() => decidir("ajustar", "")}
                >
                  Ajustar a regra
                </button>
                <button
                  type="button"
                  className="studio-botao"
                  data-veredito-familia="reprovada"
                  onClick={() => setReprovando(true)}
                >
                  Reprovar · exige motivo
                </button>
              </div>

              {reprovando ? (
                <form
                  className="moderacao-veto"
                  onSubmit={(e) => {
                    e.preventDefault();
                    decidir("reprovada", motivoAparado);
                  }}
                >
                  <span className="studio-nao-sustenta-rotulo">
                    reprovar {comSeparador(familia.arestas)} arestas — motivo obrigatório
                  </span>
                  <label htmlFor="motivo-familia" className="studio-rotulo">
                    por que esta regra não se sustenta
                  </label>
                  <textarea
                    id="motivo-familia"
                    data-motivo-veto
                    className="moderacao-textarea"
                    rows={3}
                    autoFocus
                    value={motivo}
                    placeholder="Escreva o motivo. Sem ele a reprovação não conclui."
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <p className="studio-nota">
                    Reprovar encerra o assunto sobre{" "}
                    <strong>{comSeparador(familia.arestas)}</strong> ligações de uma vez. É a
                    mesma assimetria da fila — só quem encerra deve explicação —, na escala
                    em que ela mais importa: quem vier depois precisa saber por que aquela
                    regra foi recusada, ou vai reintroduzi-la.
                  </p>
                  <div className="studio-acoes">
                    <button
                      type="submit"
                      className="studio-botao studio-botao-primario"
                      disabled={!motivoAparado}
                      data-veto-bloqueado={motivoAparado ? "nao" : "sim"}
                    >
                      Confirmar reprovação
                    </button>
                    <button
                      type="button"
                      className="studio-botao"
                      onClick={() => {
                        setReprovando(false);
                        setMotivo("");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : null}
            </section>
          ) : null}

          <section className="web-painel">
            <div className="studio-nao-sustenta" data-nao-sustenta data-declaracao-revisao>
              <span className="studio-nao-sustenta-rotulo">o que esta tela não faz</span>
              <p>
                Ela <strong>não revisa aresta a aresta</strong>, e não finge que revisa. A um
                minuto por ligação, oito horas por dia, as{" "}
                {comSeparador(panorama.totalDeArestas)} levariam mais de quatro meses de
                trabalho contínuo de uma pessoa. Uma tela com um botão «aprovar todas»
                produziria carimbo de revisão humana sobre 47 mil ligações que ninguém leu — e
                o carimbo é justamente o que lhes daria o peso que hoje não têm.
              </p>
              <p>
                Marcar uma ligação individual quando o motivo não se sustenta é o caminho que
                falta aqui, e ele está declarado como ausência em vez de fingido: o que esta
                tela sustenta hoje é a decisão sobre a REGRA, com a amostra e o método à
                vista.
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
