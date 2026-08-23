"use client";

import Link from "next/link";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import { useSessao } from "@/contexto/sessao";
import type { OrigemMotivo } from "@/dados/cartao";
import type { DestinoFinal, PassoTrilha, TrilhaCompleta } from "@/dados/trilha";
import type { Procedencia } from "@/dados/tipos";

/**
 * trilha.tsx — a trilha de primeira vez (DESC-04, `docs/telas.md` tela 7).
 *
 * D-36: OS PASSOS SÃO ARESTAS, NÃO ITENS DE LISTA. Cada bloco abaixo diz de onde veio,
 * para onde vai e por quê, e o "por quê" é o texto da aresta, literal. Se esta tela
 * fosse quatro cartões empilhados, a trilha viraria uma playlist e a tese da proposta —
 * mediação legível — não teria onde aparecer.
 *
 * D-37: A PROCEDÊNCIA DA LIGAÇÃO APARECE NA TELA, POR PASSO, EM TEXTO. Três das arestas
 * desta trilha são `autorado`: fomos nós que escrevemos a ponte. Escondê-las seria pior
 * do que tê-las — o rótulo é o que separa "o Itaú Cultural diz que rap leva a slam" de
 * "nós propomos que rap leva a slam, sobre verbetes que o Itaú Cultural escreveu".
 *
 * `import type` em tudo que vem de `@/dados/trilha`: o tipo é apagado na compilação e o
 * grafo de 23 MB não atravessa a fronteira (DP-F). Este arquivo não importa `grafo.ts`,
 * nem direta nem indiretamente em runtime.
 *
 * Tailwind só com UTILITÁRIO aqui: `globals.css` não é arquivo deste plano, então nada
 * de classe semântica nova. O que precisa de peso visual usa utilitário e token.
 */

// ---------------------------------------------------------------------------
// Rótulos
// ---------------------------------------------------------------------------

/**
 * A procedência da ARESTA em português legível. Sigla ou ícone mudo não serve: D-37
 * pede rótulo que quem avalia leia de relance, na projeção, sem legenda.
 */
const ROTULO_PROCEDENCIA: Record<Procedencia, string> = {
  autorado: "ligação autorada",
  ic: "ligação escrita no acervo do Itaú Cultural",
  derivado: "ligação derivada por regra do acervo",
};

/**
 * O que cada procedência SIGNIFICA, dito sobre as DUAS PONTAS DESTE PASSO.
 *
 * A frase é parametrizada de propósito: escrever "Rap e Slam não compartilham atributo"
 * fixo no componente deixaria a explicação errada nos passos 2 e 3, que ligam outros
 * nós. É a mesma disciplina do resto da fase — o texto descreve a aresta que está na
 * tela, não um exemplo dela.
 */
function explicarProcedencia(
  procedencia: Procedencia,
  de: string,
  para: string,
): string {
  switch (procedencia) {
    case "autorado":
      return (
        `Escrita para este protótipo, sobre entidades reais da Enciclopédia Itaú Cultural. ` +
        `«${de}» e «${para}» não compartilham nenhum atributo na fonte, e nenhuma regra ` +
        `derivada os liga: a ponte é editorial. Ela aparece assinada em vez de passar por ` +
        `dado do acervo.`
      );
    case "ic":
      return `A ligação entre «${de}» e «${para}» vem do acervo do Itaú Cultural, com a fonte declarada.`;
    case "derivado":
      return (
        `A ligação entre «${de}» e «${para}» foi calculada a partir de dado do acervo por ` +
        `regra determinística, sem redação nossa.`
      );
  }
}

const ROTULO_ORIGEM_MOTIVO: Record<OrigemMotivo, string> = {
  escrito: "texto escrito nesta ligação",
  composto: "texto montado a partir da relação",
  "sem-aresta": "não há aresta entre estes dois passos",
};

// ---------------------------------------------------------------------------
// Blocos
// ---------------------------------------------------------------------------

function Secao({
  titulo,
  children,
  className,
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-2 ${className ?? ""}`}>
      <h2 className="flex items-center gap-1.5 text-sm font-bold tracking-wide text-tinta-2 uppercase">
        <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0 text-acao-tinta" />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Um nó da cadeia, com link quando a rota existe nesta fase e sem link quando não. */
function No({ no, papel }: { no: NonNullable<PassoTrilha["de"]>; papel: string }) {
  const corpo = (
    <>
      <span className="block text-[0.6rem] font-semibold tracking-wide text-tinta-3 uppercase">
        {papel}
      </span>
      <span className="block text-sm leading-snug font-bold">{no.titulo}</span>
      <span className="block text-xs text-tinta-3">{no.classe}</span>
    </>
  );

  return (
    <div className="min-w-0 flex-1 rounded-lg border border-borda bg-superficie p-2.5">
      {no.rota ? (
        <Link href={no.rota} className="block no-underline">
          {corpo}
          <span className="mt-1 block text-xs font-semibold text-acao-tinta underline underline-offset-2">
            abrir a página
          </span>
        </Link>
      ) : (
        <>
          {corpo}
          {/* Sem rota nesta fase, e a tela diz isso em vez de fingir um link morto. */}
          <span className="mt-1 block text-[0.65rem] leading-snug text-tinta-3">
            verbete sem rota própria nesta fase — a ponte é a aresta, não o link
          </span>
        </>
      )}
    </div>
  );
}

/** O último passo: o que o acervo publica, e o que ele não publica (D-38). */
function PassoFinal({ final }: { final: DestinoFinal }) {
  const gratuitas = final.sessoes.filter((s) => s.gratuito).length;

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border border-acao bg-[color-mix(in_srgb,var(--ic-laranja)_6%,transparent)] p-3">
      <p className="text-[0.65rem] font-bold tracking-wide text-acao-tinta uppercase">
        Aqui a trilha vira agenda
      </p>

      {/* ---- O que existe na fonte: data, horário, gratuidade ---- */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold">
          {final.sessoes.length} {final.sessoes.length === 1 ? "sessão" : "sessões"}
          {final.todasGratuitas ? " · todas gratuitas" : gratuitas ? ` · ${gratuitas} gratuitas` : ""}
        </p>
        <ul className="flex flex-col gap-1">
          {final.sessoes.map((sessao) => (
            <li
              key={sessao.id}
              data-sessao-trilha={sessao.inicio}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
            >
              <span className="font-semibold">{sessao.dataCurta}</span>
              <span className="text-tinta-2">{sessao.dataLonga}</span>
              <span className="text-tinta-2">· {sessao.hora}</span>
              {sessao.gratuito ? (
                <span className="rounded-full border border-borda px-1.5 text-[0.65rem] font-semibold">
                  entrada gratuita
                </span>
              ) : (
                <span className="text-[0.65rem] text-tinta-3">
                  o acervo não declara gratuidade nesta sessão
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* D-38 — O LUGAR. A frase abaixo é lida em voz alta na apresentação:  */}
      {/* o acervo não publica o espaço, e a tela diz isso em vez de derivar  */}
      {/* "Itaú Cultural, São Paulo" da URL de origem, que seria dado         */}
      {/* fabricado usando o crachá do IC (DADO-05).                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        data-lugar-declarado={final.espacoDeclarado ?? "ausente"}
        className="flex flex-col gap-1 rounded-md border border-dashed border-borda-forte p-2.5"
      >
        <p className="text-[0.65rem] font-bold tracking-wide text-tinta-2 uppercase">
          Lugar
        </p>
        {final.espacoDeclarado ? (
          <p className="text-sm font-semibold">{final.espacoDeclarado}</p>
        ) : (
          <p className="text-sm leading-snug">
            O acervo do Itaú Cultural não publica o espaço desta sessão. Mostramos a data, o
            horário e a gratuidade, que estão na fonte; o lugar não está, e não foi preenchido
            com um valor plausível.
          </p>
        )}
        {/* A contagem desta montagem é sobre O ACERVO e fica sempre — é o que sustenta a
            frase acima. O que vira comentário é a generalização para as 2.425 ocorrências e
            a referência ao que «a fase 1 registrou», que é o nosso caderno de campo. */}
        <p className="text-[0.65rem] leading-snug text-tinta-3">
          Medido: {final.sessoesSemEspaco} de {final.sessoes.length}{" "}
          {final.sessoes.length === 1 ? "sessão" : "sessões"} sem espaço declarado.
          <Comentario como="span">
            {" "}
            Nenhuma das 2.425 ocorrências do grafo tem espaço — é a mesma disjunção entre
            território e data que a fase 1 registrou, e ela alcança esta tela.
          </Comentario>
        </p>
        {final.evento.fonte ? (
          <a
            href={final.evento.fonte}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-acao-tinta underline underline-offset-2"
          >
            conferir na fonte
          </a>
        ) : null}
      </div>

      {/* ---- Elenco: ausência estrutural, declarada em texto ---- */}
      {final.elenco.length ? (
        <div className="flex flex-col gap-1">
          <p className="text-[0.65rem] font-bold tracking-wide text-tinta-2 uppercase">
            Quem atua
          </p>
          <ul className="flex flex-col gap-0.5 text-sm">
            {final.elenco.map((pessoa) => (
              <li key={pessoa.id}>
                {pessoa.rota ? (
                  <Link href={pessoa.rota} className="underline underline-offset-2">
                    {pessoa.titulo}
                  </Link>
                ) : (
                  pessoa.titulo
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p
          data-elenco-declarado="ausente"
          className="rounded-md border border-dashed border-borda-forte p-2.5 text-[0.7rem] leading-snug text-tinta-2"
        >
          <strong className="font-bold">Sem elenco no grafo.</strong> Nenhuma aresta{" "}
          <code>atua_em</code> chega a este evento — e não é acaso desta montagem: dos 129
          eventos com ocorrência datada, zero têm aresta de agente. Não autoramos essa
          ligação. Autorar uma ponte editorial entre dois termos é uma proposta de leitura;
          autorar que uma pessoa real atuou nesta montagem seria uma afirmação factual falsa,
          e é de outra ordem.
        </p>
      )}

      {final.evento.rota ? (
        <Link
          href={final.evento.rota}
          className="rounded-full bg-acao px-4 py-2 text-center text-sm font-bold text-sobre-acao no-underline"
        >
          abrir a página do evento
        </Link>
      ) : null}
    </div>
  );
}

/** Um passo — a aresta inteira, com procedência na cara (D-36, D-37). */
function Passo({ passo, total }: { passo: PassoTrilha; total: number }) {
  const procedencia = passo.procedenciaAresta;

  return (
    <li
      data-passo-trilha={passo.ordem}
      className="flex flex-col gap-2 rounded-xl border border-borda bg-superficie-2 p-3"
    >
      <p className="text-[0.65rem] font-bold tracking-wide text-tinta-3 uppercase">
        Passo {passo.ordem} de {total}
      </p>

      {/* De onde veio → para onde vai. As duas pontas na mesma linha, porque o que a
          tela precisa mostrar é a TRAVESSIA, não dois itens que por acaso vieram juntos. */}
      <div className="flex items-stretch gap-2">
        <No no={passo.de} papel="de onde veio" />
        <div
          aria-hidden
          className="flex shrink-0 items-center text-lg font-bold text-acao-tinta"
        >
          →
        </div>
        <No no={passo.para} papel="para onde vai" />
      </div>

      {/* Por quê — o texto da aresta, literal, sem reescrita. */}
      <p className="selo-motivo" data-motivo-passo={passo.motivo}>
        <Grafismo
          variacao="barra"
          className="mt-0.5 h-3.5 w-auto shrink-0 text-acao-tinta"
        />
        <span>{passo.motivo}</span>
      </p>

      {/* -------------------------------------------------------------- */}
      {/* D-37 — o rótulo de procedência DA ARESTA, em texto, na tela.    */}
      {/* -------------------------------------------------------------- */}
      <div
        data-procedencia-aresta={procedencia ?? "sem-aresta"}
        className="flex flex-col gap-1 rounded-lg border border-borda bg-superficie p-2.5"
      >
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <span className="rounded-full border border-acao px-2 py-0.5 text-[0.65rem] tracking-wide text-acao-tinta uppercase">
            {procedencia ?? "sem aresta"}
          </span>
          {procedencia ? ROTULO_PROCEDENCIA[procedencia] : "os dois passos não estão ligados"}
        </p>
        <p className="text-[0.7rem] leading-snug text-tinta-2">
          {procedencia
            ? explicarProcedencia(procedencia, passo.de.titulo, passo.para.titulo)
            : "A ordem é a autorada na trilha, mas nenhuma aresta do grafo liga estes dois nós. O passo aparece declarado, sem ponte."}
        </p>
        <p className="text-[0.65rem] text-tinta-3">
          {passo.relacao ? `relação «${passo.relacao}» · ` : ""}
          {ROTULO_ORIGEM_MOTIVO[passo.origemMotivo]}
        </p>
      </div>

      {passo.final ? <PassoFinal final={passo.final} /> : null}
    </li>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function TelaTrilha({ trilha }: { trilha: TrilhaCompleta }) {
  const { salvos, alternarSalvo, hidratado } = useSessao();
  const salva = hidratado && salvos.includes(trilha.id);

  return (
    <div data-trilha={trilha.slug} className="flex flex-col gap-5">
      {/* ---- Título, destino e a ponte em uma frase ---- */}
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold">{trilha.titulo}</h1>
        </div>

        {trilha.linguagens.length ? <SelosDeLinguagem ids={trilha.linguagens} limite={4} /> : null}

        {trilha.resumo ? (
          <p className="max-w-prose text-sm leading-snug text-tinta-2">{trilha.resumo}</p>
        ) : null}

        <p className="max-w-prose text-sm leading-snug">
          {`${trilha.passos.length} ${trilha.passos.length === 1 ? "passo" : "passos"}, de `}
          <strong>{trilha.passos[0]?.de.titulo ?? "—"}</strong> a{" "}
          <strong>{trilha.passos[trilha.passos.length - 1]?.para.titulo ?? "—"}</strong>.
          {/* Guia de leitura escrito no vocabulário do grafo. Cada passo já traz «de onde
              veio» e «para onde vai» rotulados na própria caixa — a frase é redundante para
              quem usa e informativa só para quem avalia o modelo. */}
          <Comentario como="span">
            {" "}
            Cada passo abaixo é uma aresta do grafo: de onde veio, para onde vai e por quê.
          </Comentario>
        </p>
      </header>

      {/* ---- A procedência da trilha inteira, antes dos passos ---- */}
      <div className="flex flex-col gap-1.5 rounded-xl border border-acao bg-[color-mix(in_srgb,var(--ic-laranja)_7%,transparent)] p-3">
        <p className="text-[0.65rem] font-bold tracking-wide text-acao-tinta uppercase">
          {trilha.ligacoesAutoradas} de {trilha.passos.length}{" "}
          {trilha.passos.length === 1 ? "ligação autorada" : "ligações autoradas"}
        </p>
        <p className="text-sm leading-snug">{trilha.assinatura}</p>
        {trilha.autoradaPorque ? (
          <p className="text-[0.7rem] leading-snug text-tinta-2">
            Motivo declarado na própria trilha: {trilha.autoradaPorque}. Os quatro nós da
            cadeia vêm do acervo do Itaú Cultural; o que é nosso são as ligações entre eles,
            e cada uma aparece rotulada abaixo.
          </p>
        ) : null}
      </div>

      {/* ---- Os passos, ou o motivo de a trilha não ser publicável (D-38) ---- */}
      {trilha.publicavel ? (
        <Secao titulo="Os passos">
          <ol className="flex flex-col gap-3">
            {trilha.passos.map((passo) => (
              <Passo key={passo.ordem} passo={passo} total={trilha.passos.length} />
            ))}
          </ol>
        </Secao>
      ) : (
        <div
          data-trilha-nao-publicavel="true"
          className="rounded-xl border border-dashed border-borda-forte p-4 text-sm leading-snug"
        >
          <strong className="font-bold">Esta trilha não é publicável.</strong>{" "}
          {trilha.motivoNaoPublicavel}
        </div>
      )}

      {/* ---- Salvar a trilha inteira ---- */}
      <button
        type="button"
        aria-pressed={salva}
        onClick={() => alternarSalvo(trilha.id)}
        className={
          salva
            ? "cursor-pointer rounded-full border border-acao bg-acao px-4 py-2 text-sm font-bold text-sobre-acao"
            : "cursor-pointer rounded-full border border-borda px-4 py-2 text-sm font-bold hover:border-tinta"
        }
      >
        {salva ? "trilha salva no seu repertório" : "salvar esta trilha"}
      </button>
      {/* A frase de privacidade é produto: quem clica «salvar» tem direito de saber onde
          aquilo foi parar. Só a citação da decisão sai de cena. */}
      <p className="-mt-3 text-[0.65rem] leading-snug text-tinta-3">
        Salvar grava no navegador<Comentario como="span"> (D-46)</Comentario>. Não há conta,
        não há autenticação e nenhum dado pessoal sai daqui.
      </p>
    </div>
  );
}
