"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { useSessao } from "@/contexto/sessao";
import type { PaginaExplicacao, Criterio, ExplicacaoDaPersona } from "@/dados/explicacao";

/**
 * explicacao.tsx — «Por que isto apareceu» (D-33, D-34, D-35), `docs/telas.md` tela 6.
 *
 * É a tela que mais separa esta proposta de um recomendador opaco, e ela vai ser vista
 * PROJETADA. Daí a restrição que mandou em cada decisão deste arquivo:
 *
 *   **SE ENTENDER O CAMINHO EXIGIR ROLAGEM, A TELA FALHOU.** É o que D-33 quer dizer com
 *   caber numa foto de slide. A altura útil dentro da moldura de 390×844 é 824px de caixa
 *   de conteúdo menos ~59px de barra de abas: cerca de 765px, e o alvo aqui foi 700px.
 *
 * O orçamento vertical foi projetado antes do primeiro rascunho, não ajustado no fim:
 *   cabeçalho 20 · item 56 · cadeia do caminho ≤180 · legenda 26 · outros caminhos 40 ·
 *   critérios 68 · recálculo 0–44 · ações 34 · rodapé 52 · espaçamentos ~90 → ~610px.
 * Por isso a capa do item tem 48px e não uma imagem grande: imagem grande come metade do
 * orçamento e não explica nada.
 *
 * DP-A — A DISTINÇÃO QUE NÃO PODE SUMIR. Motivo `escrito` é texto do acervo do Itaú
 * Cultural, literal; motivo `composto` é frase que NÓS redigimos a partir de uma aresta que
 * existe. Na tela eles diferem em quatro coisas ao mesmo tempo: aspas contra nenhuma, filete
 * laranja cheio contra tracejado cinza, fundo contra sem fundo, romano contra itálico. Mais
 * uma legenda de uma linha. Apagar a diferença faria texto autorado passar por texto do IC,
 * que é a mentira de procedência que T-02-07 existe para impedir.
 *
 * NADA AQUI SE ANCORA NA JANELA. O rodapé de D-35 gruda no pé da tela por `mt-auto` dentro
 * de uma coluna de altura cheia — e não por `sticky`, porque a barra de abas já é `sticky`
 * no mesmo contêiner de rolagem e as duas disputariam o mesmo pé. Numa tela que cabe sem
 * rolar, `mt-auto` põe o rodapé exatamente onde `sticky` poria, sem a disputa.
 *
 * DP-F: os tipos vêm de `@/dados/explicacao` por `import type`, que o compilador apaga.
 * Nenhum byte do grafo atravessa por causa desta linha.
 */

/** Onde a preferência de D-34 é gravada. Chave própria: `salvos` é de ocorrência (D-42). */
const CHAVE_PREFERENCIAS = "agenda-cultural:preferencias";

/** Quantas fichas de caminho alternativo cabem na linha sem estourar a moldura. */
const MAX_FICHAS_DE_CAMINHO = 4;

/**
 * Quantos critérios ficam à vista antes do «+N».
 *
 * Medido: o repertório da Maria produz 13 caminhos até a trilha curada e portanto 16
 * critérios estruturais. Com todos à vista, 11 das 72 páginas passavam da moldura — a mais
 * alta em 63px. A regra desta tela é a de D-33 e ela não se negocia: quando não cabe, corta
 * conteúdo. Os que ficam à vista são os que o caminho exibido de fato usa, que são os que
 * mudam alguma coisa ao serem removidos; o resto fica a um toque.
 */
const MAX_FICHAS_VISIVEIS = 5;

type Preferencia = "mais" | "menos";

export function Explicacao({ pagina }: { pagina: PaginaExplicacao }) {
  const { personaId } = useSessao();
  const explicacao =
    pagina.porPersona.find((p) => p.personaId === personaId) ??
    pagina.porPersona.find((p) => p.personaId === pagina.personaPadrao) ??
    pagina.porPersona[0];

  return (
    <div data-explicacao className="flex min-h-full flex-col gap-2 px-4 py-3">
      <header className="flex items-center gap-2 text-xs">
        <Link
          href="/descobrir/"
          className="font-bold text-acao-tinta underline underline-offset-2"
        >
          ← Descobrir
        </Link>
        <span className="ml-auto text-tinta-3">
          explicando para <strong className="font-bold">{explicacao?.personaNome}</strong>
        </span>
      </header>

      {/* 1 — O ITEM, compacto. Capa de 48px: o que explica é o caminho, não a foto. */}
      <section className="flex items-start gap-2.5">
        <CapaDeCartao
          titulo={pagina.titulo}
          classe={pagina.classe}
          linguagens={pagina.linguagens}
          imagem={pagina.imagem}
          creditoImagem={pagina.creditoImagem}
          className="size-14 shrink-0 rounded-lg"
        />
        <div className="flex min-w-0 flex-col">
          {pagina.rotaEntidade ? (
            <Link href={pagina.rotaEntidade} className="no-underline">
              <h1 className="line-clamp-2 text-base leading-tight font-bold underline underline-offset-2">
                {pagina.titulo}
              </h1>
            </Link>
          ) : (
            <h1 className="line-clamp-2 text-base leading-tight font-bold">{pagina.titulo}</h1>
          )}
          <p className="text-[0.6rem] tracking-widest text-tinta-3 uppercase">
            {pagina.classe} · procedência {pagina.procedencia}
          </p>
        </div>
      </section>

      {explicacao ? <Corpo key={explicacao.personaId} explicacao={explicacao} /> : null}

      {/* 5 — D-35. O limite da IA em texto, no pé, em toda página de explicação. */}
      <p
        data-limite-ia
        className="mt-auto border-t-2 border-acao pt-2 text-[0.7rem] leading-snug text-tinta-2"
      >
        <strong className="font-bold">Nenhuma decisão editorial foi tomada por IA.</strong> O
        caminho acima é travessia determinística no acervo, o destaque curado é humano e
        assinado, e nenhum texto desta tela saiu de modelo de linguagem.
      </p>
    </div>
  );
}

/**
 * O miolo, remontado do zero a cada troca de persona (`key` na chamada): critério removido
 * de uma persona não faz sentido na outra, e carregar o estado adiante mostraria a tela em
 * um recálculo que ninguém pediu.
 */
function Corpo({ explicacao }: { explicacao: ExplicacaoDaPersona }) {
  const { disposicoes } = useSessao();
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [preferencia, setPreferencia] = useState<Preferencia | null>(null);
  const [todas, setTodas] = useState(false);

  // A preferência só é lida depois de hidratar: sob `output: "export"` o HTML sai do build
  // e ler `localStorage` no primeiro render divergiria da hidratação.
  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_PREFERENCIAS);
      const mapa: unknown = bruto ? JSON.parse(bruto) : null;
      const valor =
        mapa && typeof mapa === "object"
          ? (mapa as Record<string, unknown>)[explicacao.personaId]
          : null;
      if (valor === "mais" || valor === "menos") setPreferencia(valor);
    } catch {
      // Storage bloqueado: guardar a preferência é conveniência, não requisito.
    }
  }, [explicacao.personaId]);

  const gravarPreferencia = (valor: Preferencia) => {
    const proxima = preferencia === valor ? null : valor;
    setPreferencia(proxima);
    try {
      const bruto = window.localStorage.getItem(CHAVE_PREFERENCIAS);
      const mapa =
        bruto && typeof JSON.parse(bruto) === "object" ? (JSON.parse(bruto) as object) : {};
      window.localStorage.setItem(
        CHAVE_PREFERENCIAS,
        JSON.stringify({ ...mapa, [explicacao.personaId]: proxima }),
      );
    } catch {
      // idem
    }
  };

  // O RECÁLCULO, e ele acontece AQUI, no navegador, sem refazer travessia: `explicacaoDe`
  // já entregou de quais critérios cada caminho depende, então remover uma ficha é filtrar
  // uma lista que já está na memória.
  const validos = explicacao.caminhos.filter((c) => c.exige.every((id) => !removidos.includes(id)));
  const ativo = validos.find((c) => c.sementeId === escolhida) ?? validos[0] ?? null;

  // Critérios na tela: os estruturais sempre; os de disposição só os que a pessoa marcou —
  // quais são só se sabe no navegador.
  const fichas = explicacao.criterios.filter(
    (c) => c.tipo !== "disposicao" || disposicoes.includes(c.id.slice("disposicao:".length)),
  );
  const sustentam = new Set(explicacao.caminhos.flatMap((c) => c.exige));

  // Ordem de exibição: primeiro o que o caminho MOSTRADO usa — remover uma dessas fichas
  // muda a cadeia na hora, que é a demonstração — e o que já foi removido, para a pessoa
  // conseguir devolver. O resto vem depois e cabe atrás do «+N».
  const noAtivo = new Set(ativo?.exige ?? []);
  const ordenadas = [...fichas].sort((x, y) => {
    const peso = (c: Criterio) =>
      (noAtivo.has(c.id) ? 0 : 2) + (removidos.includes(c.id) ? -1 : 0);
    return peso(x) - peso(y);
  });
  const visiveis = todas ? ordenadas : ordenadas.slice(0, MAX_FICHAS_VISIVEIS);
  const escondidas = ordenadas.length - visiveis.length;

  return (
    <>
      {/* 2 — O CAMINHO. É o miolo da tela. --------------------------------- */}
      <section className="flex flex-col gap-1.5">
        <h2 className="text-[0.65rem] font-bold tracking-widest text-tinta-3 uppercase">
          {ativo?.doFeed ? "O caminho que trouxe este cartão" : "O caminho no grafo"}
        </h2>

        {ativo ? (
          <Cadeia caminho={ativo} />
        ) : (
          <p className="rounded-lg border-2 border-acao p-2.5 text-xs leading-snug">
            {explicacao.caminhos.length ? (
              <>
                <strong className="font-bold">
                  Sem os critérios que você removeu, este item não teria aparecido.
                </strong>{" "}
                {/* A frase diz exatamente o que foi calculado: a caminhada procurou a
                    partir de TODAS as sementes do repertório, e todos os caminhos que ela
                    achou dependem do que você tirou. */}
                {explicacao.caminhos.length === 1 ? "O único caminho" : `Os ${explicacao.caminhos.length} caminhos`}{" "}
                que a caminhada encontrou entre o repertório de {explicacao.personaNome} e este
                item {explicacao.caminhos.length === 1 ? "passa" : "passam"} por eles.
              </>
            ) : (
              <>
                <strong className="font-bold">Nenhum caminho leva a este item.</strong>{" "}
                {explicacao.motivoDoCartao?.origemMotivo === "sem-aresta"
                  ? explicacao.motivoDoCartao.texto
                  : `Nenhuma aresta de até dois saltos liga o repertório de ${explicacao.personaNome} a este item.`}
              </>
            )}
          </p>
        )}

        {/* A legenda de DP-A. Obrigatória sempre que há cadeia na tela: sem ela as duas
            marcações acima seriam decoração, e a diferença entre citar o acervo e redigir a
            partir dele ficaria só no estilo. Sem cadeia ela não tem o que legendar. */}
        <p className={clsx("text-[0.65rem] leading-snug text-tinta-2", !ativo && "hidden")}>
          <span className="mr-1 border-l-[3px] border-acao pl-1 font-semibold">
            «entre aspas»
          </span>
          é texto do acervo do Itaú Cultural;
          <span className="mx-1 border-l-[3px] border-dashed border-borda-forte pl-1 italic">
            em itálico
          </span>
          é frase nossa, composta a partir da aresta.
        </p>

        {/* Os outros caminhos. Tocar troca a cadeia exibida — é o «me mostra outro» que a
            banca vai pedir, e prova que o item está ligado ao repertório por mais de um fio. */}
        {validos.length > 1 ? (
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-[0.65rem] text-tinta-3">
              {validos.length - 1} outro{validos.length > 2 ? "s" : ""} caminho
              {validos.length > 2 ? "s" : ""} chega{validos.length > 2 ? "m" : ""} aqui:
            </span>
            {/* A tela mostra 4; a análise de dependência roda sobre todos. Exibir os 13 do
                repertório da Joana estouraria a moldura e não acrescentaria argumento. */}
            {validos.slice(0, MAX_FICHAS_DE_CAMINHO).map((c) => (
              <button
                key={c.sementeId}
                type="button"
                onClick={() => setEscolhida(c.sementeId)}
                className={clsx(
                  "cursor-pointer rounded-full border px-1.5 py-px text-[0.65rem] font-semibold",
                  c === ativo
                    ? "border-acao text-acao-tinta"
                    : "border-borda text-tinta-2",
                )}
              >
                {c.sementeTitulo}
                {c.doFeed ? " ·usado" : ""}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {/* 3 — OS CRITÉRIOS, removíveis. ------------------------------------- */}
      <section className="flex flex-col gap-1.5">
        <h2 className="text-[0.65rem] font-bold tracking-widest text-tinta-3 uppercase">
          O que pesou · toque para remover
        </h2>
        <ul className="flex flex-wrap gap-1.5">
          {visiveis.map((ficha) => {
            const fora = removidos.includes(ficha.id);
            return (
              <li key={ficha.id}>
                <button
                  type="button"
                  data-criterio={ficha.id}
                  data-removido={fora ? "sim" : undefined}
                  title={ficha.detalhe}
                  aria-pressed={!fora}
                  onClick={() =>
                    setRemovidos((atual) =>
                      atual.includes(ficha.id)
                        ? atual.filter((i) => i !== ficha.id)
                        : [...atual, ficha.id],
                    )
                  }
                  className={clsx(
                    "flex cursor-pointer items-baseline gap-1 rounded-full border px-2 py-0.5 text-xs",
                    fora
                      ? "border-borda text-tinta-3 line-through"
                      : "border-acao font-semibold",
                  )}
                >
                  <span className="text-[0.55rem] tracking-widest text-tinta-3 uppercase">
                    {ficha.tipo === "fora-da-caminhada" ? "sorteio" : ficha.tipo}
                  </span>
                  {ficha.rotulo}
                  <span aria-hidden>{fora ? "+" : "×"}</span>
                </button>
              </li>
            );
          })}

          {escondidas > 0 || todas ? (
            <li>
              <button
                type="button"
                onClick={() => setTodas((v) => !v)}
                className="cursor-pointer rounded-full border border-borda-forte px-2 py-0.5 text-xs font-semibold text-tinta-2"
              >
                {todas ? "menos" : `+${escondidas}`}
              </button>
            </li>
          ) : null}
        </ul>

        <Recalculo
          removidos={removidos}
          criterios={fichas}
          sustentam={sustentam}
          restaram={validos.length}
          total={explicacao.caminhos.length}
        />
      </section>

      {/* 4 — as duas ações de tela 6. Gravam na sessão e dão retorno visível. */}
      <div className="flex gap-2">
        {(
          [
            ["mais", "quero mais assim"],
            ["menos", "não é para mim"],
          ] as Array<[Preferencia, string]>
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            data-preferencia={valor}
            aria-pressed={preferencia === valor}
            onClick={() => gravarPreferencia(valor)}
            className={clsx(
              "flex-1 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold",
              preferencia === valor
                ? "border-acao bg-acao text-sobre-acao"
                : "border-borda-forte text-tinta",
            )}
          >
            {preferencia === valor ? "✓ " : ""}
            {rotulo}
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * A cadeia legível de tela 6: «você ouve rap, daí poesia falada, daí teatro documentário».
 *
 * Os nós da cadeia são os passos — o primeiro é a semente, que está no repertório, e cada
 * um dos seguintes traz o motivo DA ARESTA que levou até ele. Caminho de dois saltos dá três
 * nós e cabe; a caminhada nunca passa de dois saltos fora da reserva de classe vazia, então
 * a cadeia nunca cresce além disso.
 */
function Cadeia({
  caminho,
}: {
  caminho: {
    sementeTitulo: string;
    sementeClasse: string;
    passos: Array<{
      paraTitulo: string;
      paraClasse: string;
      motivoTexto: string;
      origemMotivo: string;
      relacao: string;
      papel?: string;
    }>;
  };
}) {
  return (
    <ol className="flex flex-col">
      <li data-passo className="flex flex-col">
        <span className="line-clamp-2 text-sm leading-tight font-bold">{caminho.sementeTitulo}</span>
        <span className="text-[0.6rem] tracking-widest text-tinta-3 uppercase">
          {caminho.sementeClasse} · no seu repertório
        </span>
      </li>

      {caminho.passos.map((passo, i) => (
        <li key={`${passo.paraTitulo}-${i}`} data-passo className="flex flex-col">
          {passo.origemMotivo === "escrito" ? (
            // `.selo-motivo` é a mesma classe do selo do cartão: filete laranja cheio,
            // fundo laranja a 8%, romano. Aqui ela marca CITAÇÃO do acervo.
            <p className="selo-motivo my-0.5 text-xs">
              <span>«{passo.motivoTexto}»</span>
            </p>
          ) : (
            // `line-clamp-3` só aqui, e a assimetria é deliberada: esta frase é NOSSA,
            // composta a partir da relação, e três linhas dela bastam. O ramo de cima, que
            // é citação literal do acervo do Itaú Cultural, nunca é truncado — cortar a
            // palavra do IC para caber na moldura seria pagar o orçamento vertical com a
            // única coisa que esta tela existe para preservar.
            <p className="my-0.5 line-clamp-3 border-l-[3px] border-dashed border-borda-forte py-px pl-2 text-xs leading-snug text-tinta-2 italic">
              {passo.motivoTexto}
            </p>
          )}
          <span className="flex flex-wrap items-baseline gap-1">
            <span className="line-clamp-2 text-sm leading-tight font-bold">{passo.paraTitulo}</span>
            <span className="text-[0.6rem] tracking-widest text-tinta-3 uppercase">
              {passo.paraClasse}
            </span>
            <span
              className={clsx(
                "rounded-full px-1.5 text-[0.55rem] font-bold tracking-wide",
                passo.origemMotivo === "escrito"
                  ? "bg-acao text-sobre-acao"
                  : "border border-borda-forte text-tinta-2",
              )}
            >
              {passo.origemMotivo === "escrito"
                ? "motivo escrito no acervo"
                : `composto de «${passo.relacao}»`}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * O resultado do recálculo, em uma frase.
 *
 * A frase forte — «sem este critério o item não teria aparecido» — é a demonstração mais
 * forte da tela inteira, e não pode ser suprimida por parecer estado de erro. A frase oposta
 * também é informação: um critério que não sustenta caminho nenhum é um critério que só não
 * cortou o item, e dizer isso é o que separa esta tela de uma lista de justificativas.
 */
function Recalculo({
  removidos,
  criterios,
  sustentam,
  restaram,
  total,
}: {
  removidos: string[];
  criterios: Criterio[];
  sustentam: Set<string>;
  restaram: number;
  total: number;
}) {
  if (!removidos.length) {
    return (
      <p className="text-[0.65rem] leading-snug text-tinta-3">
        {total
          ? `${total} caminho${total > 1 ? "s" : ""} sustenta${total > 1 ? "m" : ""} esta recomendação. Remover uma ficha recalcula na hora.`
          : "Nenhum caminho sustenta esta recomendação — ela veio de fora da caminhada."}
      </p>
    );
  }

  const ultimo = criterios.find((c) => c.id === removidos[removidos.length - 1]);
  const rotulo = ultimo?.rotulo ?? "este critério";
  const decorativo = ultimo ? !sustentam.has(ultimo.id) : false;

  return (
    <p
      className={clsx(
        "rounded-lg p-2 text-xs leading-snug",
        restaram ? "bg-superficie-2" : "border-2 border-acao",
      )}
    >
      {decorativo ? (
        <>
          <strong className="font-bold">«{rotulo}» não sustenta nenhum caminho.</strong> Sem
          ele o item continuaria aparecendo — ele apenas não cortou este item. {ultimo?.detalhe}
        </>
      ) : restaram ? (
        <>
          Sem <strong className="font-bold">«{rotulo}»</strong>, {restaram} de {total} caminho
          {total > 1 ? "s" : ""} continua{restaram > 1 ? "m" : ""} de pé. A cadeia acima já é o
          melhor que restou.
        </>
      ) : (
        <>
          <strong className="font-bold">
            Sem «{rotulo}», este item não teria aparecido no seu feed.
          </strong>{" "}
          {total === 1 ? "O único caminho" : `Todos os ${total} caminhos`} que a caminhada
          encontrou entre o seu repertório e ele {total === 1 ? "passa" : "passam"} pelo que
          você removeu.
        </>
      )}
    </p>
  );
}
