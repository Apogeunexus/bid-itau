"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { SELO_GRATUIDADE, curta, milhar, plural, porExtenso } from "@/componentes/acontece";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { useSessao } from "@/contexto/sessao";
import type { AusenciaMedida, TempoDoDia } from "@/dados/agenda";

/**
 * selecao-ocorrencia.tsx — a tela onde fica claro que O QUE SE SALVA É A SESSÃO (D-56).
 *
 * Esta rota existe por uma razão só, e ela é conceitual e não de navegação: enquanto
 * salvar for um botão na página do evento, «salvar» significa «salvar o evento», e o
 * Cenário 4 do RFP fica incompreensível — não há a quem dirigir um aviso de mudança de
 * horário. Ocorrência é entidade com identidade própria no modelo; dar a ela uma tela de
 * escolha é o que torna essa identidade uma coisa que se toca em vez de um argumento de
 * slide. Por isso NÃO EXISTE aqui um botão de salvar o evento: um segundo botão desfaria
 * exatamente a distinção que a tela inteira existe para construir.
 *
 * `docs/telas.md` (tela 13) prevê acessibilidade por sessão «que pode variar». Medido, ela
 * não varia em nenhum dos 129 eventos com sessão datada deste acervo. A tela mostra por
 * sessão, como o modelo prevê, E DIZ que no acervo carregado o valor é o mesmo em todas as
 * sessões do evento — mostrar variação onde não há seria encenar um dado.
 *
 * DP-F: nenhuma linha deste arquivo conhece `@/dados/grafo`. A página resolve espaço,
 * acessibilidade e tempo no BUILD e passa primitivos.
 *
 * NENHUM RELÓGIO DE RUNTIME (T-03-04): `passado`/`hoje`/`futuro` chegam decididos da
 * página, contra a data do build, que é dita na tela.
 */

// ---------------------------------------------------------------------------
// Contrato com a página
// ---------------------------------------------------------------------------

export interface SessaoExibivel {
  /** O id da OCORRÊNCIA. É ele, e nunca o id do evento, que vai para os salvos. */
  id: string;
  /** Datetime ISO com deslocamento, como o grafo grava. */
  inicio: string;
  tempo: TempoDoDia;
  gratuito: boolean;
  esgotado: boolean;
  espaco: string | null;
  origemDoEspaco: "temporada" | "evento" | null;
  /** Rótulos das dimensões que ESTA sessão declara presentes. Resolvidos no build. */
  acessibilidadePresente: string[];
  /** A ficha das 8 dimensões foi preenchida na origem? D-43: ausência não é negação. */
  declaraAcessibilidade: boolean;
}

export interface SelecaoDeOcorrenciaDTO {
  slug: string;
  titulo: string;
  /** `YYYY-MM-DD` do build. É contra ela que passado e futuro foram decididos. */
  dataDeReferencia: string;
  totalSessoes: number;
  sessoesPassadas: number;
  sessoesFuturas: number;
  sessoes: SessaoExibivel[];
  /** As quatro ausências medidas da agenda, as mesmas de `/acontece`. */
  ausencias: AusenciaMedida[];
  /** A acessibilidade varia entre as sessões DESTE evento? Medido, não presumido. */
  acessibilidadeVaria: boolean;
}

/**
 * Teto de sessões renderizadas de uma vez (T-03-05). O evento mais longo deste acervo tem
 * 53 sessões; sem teto, a página mais pesada trava a rolagem dentro da moldura de celular
 * justamente na projeção ao vivo. O padrão é o mesmo da fase 2: teto exibido, total
 * SEMPRE declarado ao lado, e o resto a um toque de distância.
 */
const TETO = 24;

/** Quantas sessões de contexto ficam ANTES da âncora quando a lista abre recortada. */
const ANTES_DA_ANCORA = 6;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function SelecaoDeOcorrencia({ evento }: { evento: SelecaoDeOcorrenciaDTO }) {
  const { salvos, alternarSalvo } = useSessao();
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [ultimoSalvo, setUltimoSalvo] = useState<string | null>(null);

  /**
   * T-03-03: `localStorage` é editável por quem avalia e `alternarSalvo` aceita qualquer
   * string. O id só sai daqui se for de uma sessão DESTE evento, que é o conjunto que a
   * tela realmente mostrou — sem isso, um id inventado entraria na lista de salvos e o
   * alerta do Cenário 4 apontaria para uma sessão que não existe.
   */
  const idsDaTela = useMemo(() => new Set(evento.sessoes.map((s) => s.id)), [evento.sessoes]);

  const salvarSessao = useCallback(
    (id: string) => {
      if (!idsDaTela.has(id)) return;
      alternarSalvo(id);
      setUltimoSalvo(id);
    },
    [idsDaTela, alternarSalvo],
  );

  /**
   * A âncora do recorte: a primeira sessão que ainda vem, ou a última quando todas
   * passaram. Abrir uma lista de 53 sessões no dia 1 de 2023 esconderia justamente a
   * sessão que a pessoa procura.
   */
  const ancora = useMemo(() => {
    const futura = evento.sessoes.findIndex((s) => s.tempo !== "passado");
    return futura === -1 ? Math.max(0, evento.sessoes.length - 1) : futura;
  }, [evento.sessoes]);

  const visiveis = useMemo(() => {
    if (mostrarTodas || evento.sessoes.length <= TETO) return evento.sessoes;
    const inicio = Math.min(
      Math.max(0, evento.sessoes.length - TETO),
      Math.max(0, ancora - ANTES_DA_ANCORA),
    );
    return evento.sessoes.slice(inicio, inicio + TETO);
  }, [evento.sessoes, mostrarTodas, ancora]);

  /** As sessões visíveis agrupadas por dia, na ordem em que acontecem. */
  const grupos = useMemo(() => {
    const porDia = new Map<string, SessaoExibivel[]>();
    for (const s of visiveis) {
      const dia = s.inicio.slice(0, 10);
      const lista = porDia.get(dia);
      if (lista) lista.push(s);
      else porDia.set(dia, [s]);
    }
    return [...porDia.entries()].map(([dia, sessoes]) => ({ dia, sessoes }));
  }, [visiveis]);

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      {/* ================================================================== */}
      {/* 1 — CABEÇALHO: de onde se veio, o que é este evento, e a contagem.  */}
      {/* ================================================================== */}
      <header className="flex flex-col gap-2">
        <Link
          href={`/evento/${evento.slug}/`}
          className="w-fit text-xs font-semibold text-acao-tinta underline underline-offset-2"
        >
          ← voltar para o evento
        </Link>

        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{evento.titulo}</h1>
        </div>

        <p className="contagem-sessoes">
          <span>
            <strong>{plural(evento.totalSessoes, "sessão", "sessões")}</strong>
            {` · ${milhar(evento.sessoesPassadas)} já ${evento.sessoesPassadas === 1 ? "aconteceu" : "aconteceram"} · ${milhar(evento.sessoesFuturas)} ainda ${evento.sessoesFuturas === 1 ? "vem" : "vêm"}`}
          </span>
        </p>

        <p className="text-[0.65rem] tracking-wide text-tinta-3 uppercase">
          {`data de referência · ${curta(evento.dataDeReferencia)} · o protótipo é estático e «já aconteceu» é calculado contra a data em que ele foi gerado`}
        </p>

        {/* 5 — POR QUE ISTO É UMA TELA E NÃO UM MENU. Texto de PRODUTO. */}
        <p className="max-w-prose text-sm leading-relaxed text-tinta-2">
          Escolher a sessão é uma tela, e não um menu suspenso, porque a ocorrência é uma
          entidade com identidade própria no modelo — não uma data dentro do evento. É essa
          identidade que permite um aviso de alteração chegar exatamente a quem salvou
          aquela sessão, e não a todo mundo que se interessou pelo evento.
        </p>

        <Comentario className="max-w-prose text-xs leading-relaxed text-tinta-2">
          Evento, temporada e ocorrência são três registros próprios, cada um com id no
          grafo (DADO-02). Colapsá-los num array aninhado dentro do evento é o que faz
          agenda cultural virar catálogo — e é o que tornaria o Cenário 4 do RFP
          impossível de demonstrar, porque não haveria a quem dirigir o alerta.
        </Comentario>
      </header>

      {/* ================================================================== */}
      {/* 2 — AS SESSÕES, AGRUPADAS POR DIA.                                  */}
      {/* ================================================================== */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-sm font-bold tracking-wide text-tinta-2 uppercase">
            Escolha a sessão
          </h2>
          {/* Teto exibido com total declarado — o padrão da fase 2 para toda lista que
              não cabe inteira. Sem o total ao lado, «24 sessões» seria lido como o
              tamanho do acervo em vez do tamanho do recorte. */}
          <span className="text-[0.65rem] tracking-wide text-tinta-3 uppercase">
            {`${milhar(visiveis.length)} de ${plural(evento.totalSessoes, "sessão", "sessões")} exibidas`}
          </span>
        </div>

        {grupos.map(({ dia, sessoes }) => (
          <div key={dia} className="grupo-de-dia">
            <h3 className="grupo-de-dia-cabecalho">{porExtenso(dia)}</h3>
            <ul className="flex flex-col gap-2">
              {sessoes.map((sessao) => {
                const salvo = salvos.includes(sessao.id);
                const confirmando = salvo && ultimoSalvo === sessao.id;
                return (
                  <li
                    key={sessao.id}
                    className="linha-sessao"
                    data-sessao={sessao.id}
                    data-sessao-tempo={sessao.tempo}
                  >
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-base font-bold">
                        {sessao.inicio.slice(11, 16).replace(":", "h")}
                      </span>
                      {/* D-54 também aqui: a sessão passada aparece rotulada, não some. */}
                      {sessao.tempo === "passado" ? (
                        <span className="selo-acervo" data-tom="passado">
                          já aconteceu
                        </span>
                      ) : sessao.tempo === "hoje" ? (
                        <span className="selo-acervo">hoje</span>
                      ) : null}
                      {sessao.gratuito ? (
                        <span className="selo-acervo">{SELO_GRATUIDADE}</span>
                      ) : (
                        <span className="selo-acervo">com ingresso declarado na fonte</span>
                      )}
                    </p>

                    {/* Espaço: a MESMA frase que a fase 2 escreveu na página do evento,
                        agora com o número medido. Duas frases diferentes para a mesma
                        ausência divergiriam na primeira correção. */}
                    {sessao.espaco ? (
                      <p className="text-xs text-tinta-2">
                        {sessao.espaco}
                        <span className="text-[0.65rem] tracking-wide text-tinta-3 uppercase">
                          {" · espaço declarado "}
                          {sessao.origemDoEspaco === "temporada"
                            ? "na temporada"
                            : "no registro do evento"}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs leading-relaxed text-tinta-2">
                        O acervo do Itaú Cultural não publica o espaço desta sessão. O
                        evento declara período, não endereço de cada data.
                      </p>
                    )}

                    {/* Acessibilidade POR SESSÃO, como o modelo prevê. */}
                    <p className="text-xs leading-relaxed text-tinta-2">
                      {sessao.acessibilidadePresente.length
                        ? `Acessibilidade declarada nesta sessão: ${sessao.acessibilidadePresente.join(", ")}.`
                        : sessao.declaraAcessibilidade
                          ? "A ficha de acessibilidade foi preenchida na origem e nenhum recurso foi marcado para esta sessão — é declaração de ausência, não falta de informação."
                          : "O registro de origem não preencheu a ficha de acessibilidade: nada foi declarado sobre esta sessão, nem a presença nem a ausência de recursos."}
                    </p>

                    {/* ---------------------------------------------------- */}
                    {/* SALVAR — D-56, e o ponto da tela. O id que entra é o  */}
                    {/* da OCORRÊNCIA.                                        */}
                    {/* ---------------------------------------------------- */}
                    <button
                      type="button"
                      data-salvar-sessao={sessao.id}
                      aria-pressed={salvo}
                      onClick={() => salvarSessao(sessao.id)}
                      className={`w-fit cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                        salvo
                          ? "border-acao bg-acao text-sobre-acao"
                          : "border-borda-forte text-tinta hover:border-tinta"
                      }`}
                    >
                      {salvo ? "sessão salva — tocar para remover" : "salvar esta sessão"}
                    </button>

                    {confirmando ? (
                      <div className="confirmacao-salvo" data-confirmacao-salvo={sessao.id}>
                        <strong>{`Salvo: a sessão de ${porExtenso(sessao.inicio)}.`}</strong>
                        <span>
                          {`O que ficou salvo é esta sessão, não o evento. Se o horário dela mudar, o aviso chega a você — e as outras ${plural(evento.totalSessoes - 1, "sessão", "sessões")} deste mesmo evento seguem intocadas, com quem as salvou.`}
                        </span>
                        <Link
                          href="/salvos/"
                          className="w-fit text-xs font-bold text-acao-tinta underline underline-offset-2"
                        >
                          ver as sessões salvas
                        </Link>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {evento.sessoes.length > TETO && !mostrarTodas ? (
          <button
            type="button"
            onClick={() => setMostrarTodas(true)}
            className="w-fit cursor-pointer rounded-full border border-borda-forte px-3 py-1 text-xs font-semibold"
          >
            {`mostrar as ${plural(evento.sessoes.length, "sessão", "sessões")}`}
          </button>
        ) : null}
      </section>

      {/* ================================================================== */}
      {/* 3 — AS AUSÊNCIAS, CADA UMA ONDE A PESSOA A PROCURARIA.              */}
      {/*     Texto de PRODUTO, fora do modo comentado.                       */}
      {/* ================================================================== */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold tracking-wide text-tinta-2 uppercase">
          O que esta tela não pode dizer
        </h2>
        <ul className="flex flex-col gap-2">
          {evento.ausencias.map((a) => (
            <li key={a.campo} className="ausencia-medida" data-ausencia={a.campo}>
              <span className="ausencia-medida-rotulo">
                {`${a.rotulo} · ${milhar(a.numerador)} de ${milhar(a.denominador)}`}
              </span>
              <span>{a.frase}</span>
            </li>
          ))}
        </ul>

        {/* A ausência de acessibilidade variável, dita sobre ESTE evento e não só sobre o
            acervo inteiro: é aqui, na lista de sessões, que alguém esperaria ver variação. */}
        <p className="max-w-prose text-xs leading-relaxed text-tinta-2">
          {evento.acessibilidadeVaria
            ? "A acessibilidade declarada muda de uma sessão para outra neste evento — cada linha acima mostra a da sua própria sessão."
            : `Neste evento a acessibilidade é idêntica nas ${plural(evento.totalSessoes, "sessão", "sessões")}: ela aparece por sessão porque o modelo permite que varie, e no acervo carregado ela não varia.`}
        </p>

        <Comentario className="max-w-prose text-xs leading-relaxed text-tinta-2">
          Estes quatro campos existem no modelo e continuam visíveis mesmo vazios (D-51).
          Campo que some vira bloco que some, e bloco que some faz parecer que a categoria
          não existe no produto — quando o que não existe é o dado na fonte.
        </Comentario>
      </section>
    </div>
  );
}
