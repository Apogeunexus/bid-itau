"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Chip, TrilhoDeChips } from "@/componentes/base/chip";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import {
  consultar,
  expandirIndice,
  facetasDe,
  type Criterio,
  type IndiceDTO,
  type OpcaoFaceta,
} from "@/dados/indice";
import type {
  AcessibilidadeDTO,
  CriterioSemLastro,
  DimensaoContada,
  NumerosDosFiltros,
  ResumoDaFicha,
} from "@/dados/filtros";
import type { TrilhaResumo } from "@/dados/trilha";
import type { DimensaoAcessibilidade } from "@/dados/tipos";

/**
 * filtros.tsx — Filtros ontológicos (`docs/telas.md` tela 9, APPX-01, D-91, D-90, D-43).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A DECISÃO QUE ESTA TELA É
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Acessibilidade como FILTRO, e não como selo mostrado depois, é a diferença entre uma
 * plataforma que informa e uma que serve. Quem precisa de Libras precisa poder PEDIR
 * Libras — não descobrir, depois de escolher o evento e a sessão, que não tinha
 * intérprete. Por isso as 8 dimensões vivem na MESMA coluna, com o MESMO peso visual, que
 * linguagem e território. Esse posicionamento é o argumento; uma frase dizendo «também nos
 * importamos com acessibilidade» não seria.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS TRÊS RECUSAS, E POR QUE CADA UMA TEM UMA FORMA DIFERENTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. AS CINCO DIMENSÕES QUE MEDEM ZERO ficam na tela e ficam MARCÁVEIS. Escondê-las
 *    apagaria o diagnóstico — que é: a acessibilidade está catalogada em oito dimensões e
 *    documentada em uma e meia. Esse diagnóstico é argumento da proposta. Cada uma declara
 *    o seu zero COM o denominador antes de ser marcada, e marcá-la explica o vazio em vez
 *    de mostrar uma tela em branco.
 *
 * 2. GRATUIDADE não vira controle: o campo existe e NÃO DISCRIMINA. Zero de 300 eventos
 *    declaram ingresso, então as 2.425 sessões saem todas gratuitas e o filtro passaria
 *    100% do que é datado. A fase 3 já recusou a faceta em `/buscar` pelo mesmo motivo, e
 *    aqui o raciocínio é repetido, não reinventado.
 *
 * 3. FAIXA ETÁRIA não vira controle porque O CAMPO NÃO EXISTE — nem no CMS, nem na
 *    Enciclopédia, nem nas 7.810 entidades. `disposicoes.ts` já registrou essa decisão por
 *    escrito e o predicado de lá devolve `indeterminado` de propósito. A tela 9 pede faixa
 *    etária, e a resposta honesta é dizer que ela não existe: é mais forte do que um
 *    seletor que devolve tudo.
 *
 * Três ausências, três formas. Colapsá-las num «não temos esse filtro» apagaria o que cada
 * uma diz sobre a fonte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O QUE ESTA TELA NÃO FINGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `Criterio` de `indice.ts` tem seis campos e acessibilidade NÃO é um deles. O recorte de
 * acessibilidade, portanto, NÃO VIAJA para `/buscar/`. A escolha aqui é mostrar o
 * resultado NESTA tela, com o recorte inteiro aplicado, e oferecer a ida a `/buscar/`
 * DIZENDO, com o número, o que se perde no caminho. Levar a pessoa para uma tela que
 * silenciosamente devolve mais resultados do que ela pediu seria pior do que não oferecer
 * o botão.
 *
 * DP-F: este arquivo não alcança `@/dados/grafo`, nem transitivamente. De `@/dados/filtros`
 * ele importa SÓ TIPO — aquele módulo carrega o grafo por valor. O DTO de acessibilidade
 * desce por propriedade do componente de servidor de `/filtros`, e são 12,7 KB de
 * contagens, nunca entidade.
 *
 * NENHUMA POSIÇÃO ANCORADA NA JANELA: dentro da moldura de 390px da visão app, `fixed`
 * escaparia do telefone (D-03). O estilo mora em `src/estilos/filtros.css`.
 */

// ---------------------------------------------------------------------------
// Constantes de tela
// ---------------------------------------------------------------------------

/** Quantos resultados a prévia lista. O TOTAL REAL fica sempre declarado ao lado. */
const TETO_PREVIA = 40;

/** Quantas opções de cada faceta a coluna oferece. São 33 linguagens e 359 territórios. */
const TETO_LINGUAGENS = 12;
const TETO_TERRITORIOS = 10;

function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Marca a ficha: `sim` só o que declarou, `nao` só o que nunca declarou, `` qualquer. */
type RecorteDeFicha = "" | "declara" | "nao-declara";

export interface FiltrosProps {
  indice: IndiceDTO;
  acessibilidade: AcessibilidadeDTO;
  dimensoes: DimensaoContada[];
  ficha: ResumoDaFicha;
  semLastro: readonly CriterioSemLastro[];
  trilhas: readonly TrilhaResumo[];
  numeros: NumerosDosFiltros;
}

export function Filtros({
  indice,
  acessibilidade,
  dimensoes,
  ficha,
  semLastro,
  trilhas,
  numeros,
}: FiltrosProps) {
  const [marcadas, setMarcadas] = useState<DimensaoAcessibilidade[]>([]);
  const [recorteDeFicha, setRecorteDeFicha] = useState<RecorteDeFicha>("");
  const [criterios, setCriterios] = useState<Criterio[]>([]);

  // ---- as estruturas de leitura do DTO, montadas UMA vez --------------------
  //
  // O DTO de acessibilidade é POSICIONAL contra o índice: a posição `i` dele é a entrada
  // `i` de `expandirIndice`. `filtros.ts` garante o alinhamento por construção e derruba o
  // build se ele se perder; aqui basta ler.
  const leitura = useMemo(() => {
    const entradas = expandirIndice(indice);
    const posicaoPorChave = new Map<string, number>();
    for (let i = 0; i < entradas.length; i += 1) posicaoPorChave.set(entradas[i].chave, i);
    return {
      posicaoPorChave,
      declaram: new Set(acessibilidade.declaram),
      bitsPorPosicao: new Map(acessibilidade.marcadas),
      bitPorCampo: new Map(acessibilidade.ordemDosBits.map((campo, b) => [campo, 1 << b])),
    };
  }, [indice, acessibilidade]);

  const facetas = useMemo(() => facetasDe({ criterios }, indice), [criterios, indice]);

  // ---- O CONTADOR AO VIVO ---------------------------------------------------
  //
  // Filtro linear em memória, a cada marcação, exatamente como `/buscar` faz a cada tecla:
  // sem navegação, sem rota nova, sem requisição. Linguagem e território passam pelo MOTOR
  // DE `indice.ts` — não há um segundo motor aqui —, e a acessibilidade entra como camada
  // sobre as posições que ele devolveu.
  const recorte = useMemo(() => {
    const resposta = consultar({ criterios }, indice);
    const alvo = marcadas.reduce(
      (bits, campo) => bits | (leitura.bitPorCampo.get(campo) ?? 0),
      0,
    );

    const chaves: string[] = [];
    for (const r of resposta.resultados) {
      const i = leitura.posicaoPorChave.get(r.chave);
      if (i === undefined) continue;
      if (alvo && ((leitura.bitsPorPosicao.get(i) ?? 0) & alvo) !== alvo) continue;
      if (recorteDeFicha === "declara" && !leitura.declaram.has(i)) continue;
      if (recorteDeFicha === "nao-declara" && leitura.declaram.has(i)) continue;
      chaves.push(r.chave);
    }

    const porChave = new Map(resposta.resultados.map((r) => [r.chave, r]));
    return {
      total: chaves.length,
      previa: chaves.slice(0, TETO_PREVIA).map((c) => porChave.get(c)!),
      semAcessibilidade: resposta.total,
    };
  }, [criterios, indice, leitura, marcadas, recorteDeFicha]);

  const zeradas = dimensoes.filter((d) => !d.sustentada);
  const criteriosAtivos =
    marcadas.length + criterios.length + (recorteDeFicha === "" ? 0 : 1);

  // ---- as ações -------------------------------------------------------------
  function alternarDimensao(campo: DimensaoAcessibilidade) {
    setMarcadas((atual) =>
      atual.includes(campo) ? atual.filter((c) => c !== campo) : [...atual, campo],
    );
  }

  function alternarFicha(valor: Exclude<RecorteDeFicha, "">) {
    // Os dois são EXCLUSIVOS entre si: pedir «só quem declarou» e «só quem não declarou»
    // ao mesmo tempo é pedir o conjunto vazio, e um controle que devolve vazio por
    // contradição é ruído, não critério.
    setRecorteDeFicha((atual) => (atual === valor ? "" : valor));
  }

  function alternarCriterio(opcao: OpcaoFaceta) {
    setCriterios((atual) => {
      const ja = atual.find((c) => c.campo === opcao.campo && c.valor === opcao.valor);
      if (ja) return atual.filter((c) => c !== ja);
      return [...atual, { campo: opcao.campo, valor: opcao.valor, rotulo: opcao.rotulo }];
    });
  }

  function limparTudo() {
    setMarcadas([]);
    setRecorteDeFicha("");
    setCriterios([]);
  }

  const marcado = (campo: DimensaoAcessibilidade) => marcadas.includes(campo);
  const criterioMarcado = (o: OpcaoFaceta) =>
    criterios.some((c) => c.campo === o.campo && c.valor === o.valor);

  // O endereço de `/buscar/` com o que o motor entende. A gramática é a da fase 3:
  // `#f=campo:valor~campo:valor`.
  const enderecoDeBusca = criterios.length
    ? `/buscar/#f=${criterios.map((c) => `${c.campo}:${c.valor}`).join("~")}`
    : "/buscar/";

  return (
    <div data-filtros className="filtros">
      {/* ---------------------------------------------------------------- */}
      {/* Cabeçalho e o contador ao vivo                                    */}
      {/* ---------------------------------------------------------------- */}
      <header className="filtros-topo">
        <h1 className="filtros-titulo">
          <Grafismo
            variacao="barra"
            className="h-3.5 w-auto shrink-0 text-acao-tinta"
          />
          Filtros
        </h1>

        <p
          data-contador-vivo={recorte.total}
          className="filtros-contador"
          aria-live="polite"
        >
          <strong className="filtros-contador-numero">{milhar(recorte.total)}</strong>
          <span className="filtros-contador-de">
            de {milhar(indice.total)} entradas buscáveis
          </span>
          <span className="filtros-contador-criterios">
            {criteriosAtivos === 0
              ? "nenhum critério marcado — este é o acervo inteiro"
              : `${criteriosAtivos} critério${criteriosAtivos > 1 ? "s" : ""} marcado${
                  criteriosAtivos > 1 ? "s" : ""
                }`}
          </span>
        </p>

        <button
          type="button"
          data-limpar-filtros
          className="filtros-limpar"
          onClick={limparTudo}
          disabled={criteriosAtivos === 0}
        >
          limpar tudo
        </button>

        <p className="filtros-nota">
          O contador acima muda <strong>a cada critério marcado</strong>, aqui mesmo: filtro
          em memória sobre {milhar(indice.total)} entradas, sem trocar de tela e sem
          consultar servidor nenhum.
        </p>

        <Comentario className="filtros-comentario">
          Tela 9 (APPX-01). D-91 põe as 8 dimensões de acessibilidade como critério de
          primeira classe; D-90 manda declarar a ausência com o denominador em vez de
          oferecer controle que não corta; D-43 separa declarado-ausente de não-declarado.
          As contagens de acessibilidade não vêm de `indice.ts`, que não as indexa: elas são
          calculadas no build por `filtros.ts`, direto do grafo, e descem em{" "}
          {milhar(acessibilidade.bytesDoDto)} bytes de contagens.
        </Comentario>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* A COLUNA DOS CRITÉRIOS.                                             */}
      {/*                                                                     */}
      {/* Um DOM só para as duas visões (D-05: é proibido um componente irmão  */}
      {/* por visão). Na visão app este invólucro é uma coluna comum e a tela  */}
      {/* rola inteira dentro da moldura; na web ele vira `.web-coluna-fixa`   */}
      {/* de `web.css` — a coluna de facetas permanente de D-80, que cola no   */}
      {/* topo e ROLA POR DENTRO. A regra é de `web.css`, consumida aqui sem   */}
      {/* uma linha alterada lá: ela está CONGELADA desde 05-01.               */}
      {/* ------------------------------------------------------------------ */}
      <div className="filtros-criterios web-coluna-fixa" data-coluna-criterios>
      {/* ---------------------------------------------------------------- */}
      {/* 1. ACESSIBILIDADE — critério de primeira classe (D-91)            */}
      {/* ---------------------------------------------------------------- */}
      <section className="filtros-bloco" data-bloco="acessibilidade">
        <h2 className="filtros-bloco-titulo">Acessibilidade</h2>

        <p className="filtros-bloco-linha">
          As <strong>{numeros.dimensoes} dimensões</strong> que o CMS cataloga, todas
          marcáveis — as {numeros.dimensoesSustentadas} que o acervo documenta e as{" "}
          {numeros.dimensoesZeradas} que ele não documenta. Elas ficam aqui, no mesmo lugar e
          com o mesmo peso de linguagem e território, porque{" "}
          <strong>quem precisa de Libras precisa poder pedir Libras</strong> antes de
          escolher, e não descobrir depois.
        </p>

        <ul className="filtros-dimensoes">
          {dimensoes.map((d) => (
            <li
              key={d.campo}
              className="filtros-dimensao"
              data-dimensao-acessibilidade={d.campo}
              {...(d.sustentada ? {} : { "data-nao-sustenta": `acessibilidade:${d.campo}` })}
            >
              <button
                type="button"
                aria-pressed={marcado(d.campo)}
                className="filtros-marcavel"
                onClick={() => alternarDimensao(d.campo)}
              >
                <span className="filtros-marcavel-caixa" aria-hidden />
                <span className="filtros-marcavel-rotulo">{d.rotulo}</span>
                <span className="filtros-marcavel-n" data-denominador={d.campo}>
                  {milhar(d.declaradaVerdadeira)}
                </span>
              </button>

              {d.sustentada ? (
                <p className="filtros-dimensao-nota">
                  {milhar(d.declaradaVerdadeira)} registros da fonte declaram, de{" "}
                  {milhar(d.entreAsQueDeclaramNaFonte)} que preencheram a ficha —{" "}
                  {milhar(d.noIndice)} deles estão entre as {milhar(indice.total)} entradas
                  buscáveis.
                </p>
              ) : (
                <p className="filtros-dimensao-nota filtros-dimensao-zero">
                  {d.declaracao}
                </p>
              )}
            </li>
          ))}
        </ul>

        <p className="filtros-bloco-linha filtros-diagnostico">
          <strong>
            {numeros.dimensoesZeradas} das {numeros.dimensoes} dimensões medem zero no acervo
            inteiro
          </strong>{" "}
          — {zeradas.map((d) => d.rotulo.toLowerCase()).join(", ")}. As{" "}
          {numeros.dimensoesZeradas} continuam marcáveis de propósito: escondê-las deixaria a
          tela bonita e apagaria o diagnóstico. A acessibilidade está{" "}
          <strong>catalogada em {numeros.dimensoes} dimensões e documentada em uma e meia</strong>
          , e é esse número que uma agenda cultural pública precisa ver.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. D-43 — declarado-ausente contra não-declarado                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="filtros-bloco" data-bloco="ficha">
        <h2 className="filtros-bloco-titulo">A ficha foi preenchida?</h2>

        <p className="filtros-bloco-linha">
          <strong>«Não sabemos» e «não tem» são coisas diferentes</strong> para quem depende
          de Libras. Num booleano `false` as duas viram a mesma coisa; só o campo que
          registra se houve declaração as separa. Por isso a distinção é um par de controles,
          e não uma nota de rodapé.
        </p>

        <div className="filtros-par">
          <div className="filtros-par-item" data-declarado-ausente="declara">
            <button
              type="button"
              aria-pressed={recorteDeFicha === "declara"}
              className="filtros-marcavel"
              onClick={() => alternarFicha("declara")}
            >
              <span className="filtros-marcavel-caixa" aria-hidden />
              <span className="filtros-marcavel-rotulo">só o que declarou a ficha</span>
              <span className="filtros-marcavel-n" data-denominador="ficha-declaram">
                {milhar(ficha.declaram)}
              </span>
            </button>
            <p className="filtros-dimensao-nota">
              {milhar(ficha.declaram)} das {milhar(ficha.total)} entidades preencheram as{" "}
              {numeros.dimensoes} dimensões. Nelas, um «não» é uma{" "}
              <strong>declaração de ausência</strong>: a fonte foi perguntada e respondeu.
            </p>
          </div>

          <div className="filtros-par-item" data-nao-declarado="nao-declara">
            <button
              type="button"
              aria-pressed={recorteDeFicha === "nao-declara"}
              className="filtros-marcavel"
              onClick={() => alternarFicha("nao-declara")}
            >
              <span className="filtros-marcavel-caixa" aria-hidden />
              <span className="filtros-marcavel-rotulo">só o que nunca declarou</span>
              <span className="filtros-marcavel-n" data-denominador="ficha-nao-declaram">
                {milhar(ficha.naoDeclaram)}
              </span>
            </button>
            <p className="filtros-dimensao-nota">
              {milhar(ficha.naoDeclaram)} das {milhar(ficha.total)} nunca declararam nada. Aí
              um «não» é <strong>silêncio, não negação</strong> — e afirmar «este evento não
              tem intérprete» em nome do Itaú Cultural seria uma alegação que a fonte não
              faz.
            </p>
          </div>
        </div>

        <p className="filtros-bloco-linha">
          Quem declara, por classe:{" "}
          {Object.entries(ficha.porClasse)
            .sort((a, b) => b[1] - a[1])
            .map(([classe, n]) => `${classe} ${milhar(n)}`)
            .join(" · ")}
          . As {milhar(ficha.declaram)} somam exatamente o denominador de cima — nenhuma
          fatia fica sem nome.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 3. Linguagem e território — as duas facetas que RECORTAM          */}
      {/* ---------------------------------------------------------------- */}
      <section className="filtros-bloco" data-bloco="ontologia">
        <h2 className="filtros-bloco-titulo">Linguagem e território</h2>
        <p className="filtros-bloco-linha">
          As duas facetas que recortam de verdade, contadas sobre o recorte em curso: marcar
          uma opção que diz {'"'}51{'"'} devolve exatamente 51.
        </p>

        <TrilhoDeChips rotulo="Recortar por linguagem artística">
          {facetas.linguagem.slice(0, TETO_LINGUAGENS).map((o) => (
            <Chip
              key={`${o.campo}:${o.valor}`}
              selecionado={criterioMarcado(o)}
              onClick={() => alternarCriterio(o)}
              // O nome do token, e não a cor: a bolinha é pintada pelo CSS a
              // partir do dado, do mesmo jeito que `selo-linguagem.tsx` faz.
              cor={o.cor ?? undefined}
              contagem={milhar(o.n)}
            >
              {o.rotulo}
            </Chip>
          ))}
        </TrilhoDeChips>

        <TrilhoDeChips rotulo="Recortar por território">
          {facetas.territorio.slice(0, TETO_TERRITORIOS).map((o) => (
            <Chip
              key={`${o.campo}:${o.valor}`}
              selecionado={criterioMarcado(o)}
              onClick={() => alternarCriterio(o)}
              contagem={milhar(o.n)}
            >
              {o.rotulo}
            </Chip>
          ))}
        </TrilhoDeChips>
      </section>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* A COLUNA DA SAÍDA: o que o acervo não sustenta, e o recorte.        */}
      {/* ------------------------------------------------------------------ */}
      <div className="filtros-saida" data-coluna-saida>
      {/* ---------------------------------------------------------------- */}
      {/* 4. O que o acervo NÃO sustenta (D-90)                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="filtros-bloco" data-bloco="sem-lastro">
        <h2 className="filtros-bloco-titulo">O que este acervo não recorta</h2>
        <p className="filtros-bloco-linha">
          Dois critérios que a tela pede e o acervo não sustenta. Eles ficam aqui, nomeados e
          com o número, em vez de virarem controle que não faz nada — e as duas ausências são
          de naturezas diferentes.
        </p>

        {semLastro.map((c) => (
          <div
            key={c.campo}
            className="filtros-sem-lastro"
            {...(c.tipo === "inexistente"
              ? { "data-criterio-inexistente": c.campo }
              : { "data-nao-sustenta": `sem-lastro:${c.campo}` })}
          >
            <p className="filtros-sem-lastro-topo">
              <button
                type="button"
                className="filtros-marcavel filtros-marcavel-morta"
                disabled
                aria-disabled="true"
              >
                <span className="filtros-marcavel-caixa" aria-hidden />
                <span className="filtros-marcavel-rotulo">{c.rotulo}</span>
              </button>
              <span className="filtros-sem-lastro-selo">
                {c.tipo === "inexistente"
                  ? "o campo não existe no acervo"
                  : "o campo existe e não recorta"}
              </span>
            </p>

            <ul className="filtros-denominadores">
              {c.denominadores.map((d) => (
                <li key={d.chave} className="filtros-denominador" data-denominador={d.chave}>
                  <strong className="filtros-denominador-numero">{milhar(d.n)}</strong>
                  <span className="filtros-denominador-rotulo">{d.rotulo}</span>
                </li>
              ))}
            </ul>

            <p className="filtros-sem-lastro-frase">{c.frase}</p>
          </div>
        ))}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 5. O recorte, aqui mesmo — e o que NÃO viaja para /buscar         */}
      {/* ---------------------------------------------------------------- */}
      <section className="filtros-bloco" data-bloco="resultado">
        <h2 className="filtros-bloco-titulo">
          {recorte.total === 0 ? "Nenhum resultado — e por quê" : "O recorte"}
        </h2>

        {recorte.total === 0 ? (
          <div className="filtros-zero" data-sem-resultado="filtros">
            <p className="filtros-zero-frase">
              <strong>Zero de {milhar(indice.total)} entradas</strong> atendem a este recorte
              — e o vazio tem causa nomeada, não é uma tela em branco.
            </p>
            <ul className="filtros-zero-motivos">
              {marcadas
                .map((campo) => dimensoes.find((d) => d.campo === campo)!)
                .filter((d) => !d.sustentada)
                .map((d) => (
                  <li key={d.campo} className="filtros-zero-motivo">
                    <strong>{d.rotulo}</strong> está marcada e mede{" "}
                    <strong>0 de {milhar(ficha.declaram)}</strong> entidades que preencheram a
                    ficha. Nenhum registro do acervo declara esta dimensão — desmarcá-la é o
                    caminho.
                  </li>
                ))}
              {criterios.map((c) => (
                <li key={`${c.campo}:${c.valor}`}>
                  <strong>{c.rotulo}</strong> está marcado como {c.campo}.
                </li>
              ))}
            </ul>
            <p className="filtros-zero-frase">
              Sem os critérios de acessibilidade, o mesmo recorte devolveria{" "}
              <strong>{milhar(recorte.semAcessibilidade)}</strong> entradas.
            </p>
            <button type="button" className="filtros-limpar" onClick={limparTudo}>
              limpar tudo e voltar às {milhar(indice.total)}
            </button>
            {trilhas.map((t) => (
              <p key={t.id} data-trilha-relacionada={t.slug} className="filtros-trilha">
                Ou veja a <strong>{t.titulo}</strong> — {trilhas.length} trilha curada, a
                única que este acervo tem.{" "}
                <Link href={`/trilha/${t.slug}/`}>abrir a trilha</Link>
              </p>
            ))}
          </div>
        ) : (
          <>
            <p className="filtros-bloco-linha">
              Mostrando {milhar(Math.min(TETO_PREVIA, recorte.total))} de{" "}
              {milhar(recorte.total)}. O corte é da exibição, não da contagem.
            </p>
            <ul className="filtros-previa">
              {recorte.previa.map((r) => (
                <li key={r.chave} className="filtros-previa-item">
                  <span className="filtros-previa-classe">{r.classe}</span>
                  <span className="filtros-previa-titulo">{r.titulo}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="filtros-bloco-linha filtros-nao-viaja">
          <strong>O que não viaja daqui para a busca.</strong> O motor de busca entende
          texto, tipo, linguagem, tema, procedência e território — acessibilidade não é campo
          dele. Levar este recorte para <code>/buscar/</code> levaria{" "}
          {criterios.length === 0 ? "nenhuma faceta" : `${criterios.length} faceta(s)`} e{" "}
          <strong>
            deixaria para trás {marcadas.length} critério(s) de acessibilidade
            {recorteDeFicha === "" ? "" : " e o recorte da ficha"}
          </strong>
          , devolvendo {milhar(recorte.semAcessibilidade)} em vez de {milhar(recorte.total)}.
          Está dito aqui em vez de acontecer em silêncio.
        </p>

        <Link href={enderecoDeBusca} className="filtros-ir-buscar">
          abrir na busca só com o que ela entende
        </Link>
      </section>
      </div>
    </div>
  );
}
