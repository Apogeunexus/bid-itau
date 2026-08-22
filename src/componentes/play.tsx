"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CapaSemImagem } from "@/componentes/capa-sem-imagem";
import { Comentario } from "@/componentes/comentario";
import {
  diaParaIso,
  diaParaTexto,
  DIMENSOES_DO_FILTRO,
  expandirItem,
  ROTULOS_DE_DIMENSAO,
  type CatalogoNoFio,
  type DimensaoContada,
  type ItemDoPlayNoCliente,
} from "@/dados/play-wire";
import type { DimensaoAcessibilidade } from "@/dados/tipos";

/**
 * play.tsx — Play, o catálogo unificado das 529 mídias (D-92, `docs/telas.md` tela 19).
 *
 * POR QUE ESTA TELA EXISTE NA PROPOSTA. Ela sustenta dois argumentos ao mesmo tempo: o da
 * gratuidade e o da escala nacional onde não há equipamento cultural. É a resposta para as
 * regiões que o mapa de desertos mostra vazias — quando não há teatro na cidade, o que
 * existe é isto.
 *
 * O CATÁLOGO É UNIFICADO, E ISSO É UMA DECISÃO DE FORMA, NÃO DE ESTILO. Uma lista só, com
 * o tipo etiquetado em cada item, e as categorias como RECORTE — não uma prateleira por
 * categoria. Quatro prateleiras lado a lado seriam quatro catálogos, e a tela 19 pede o
 * contrário: um lugar onde podcast, série, vídeo e playlist convivem e se comparam.
 *
 * ONDE ESTA TELA PODERIA MENTIR MAIS FÁCIL, e o que impede:
 *
 * 1. **O FILTRO DE ACESSIBILIDADE.** A tela 19 pede legenda, Libras e audiodescrição como
 *    se fossem três recortes equivalentes. Medido no acervo: Libras recorta 3 de 529 e os
 *    outros dois recortam ZERO. Os três aparecem — com o NÚMERO AO LADO DO RÓTULO, antes
 *    de qualquer marcação —, os dois zerados carregam `data-nao-sustenta`, e marcá-los
 *    devolve um vazio explicado em vez de um vazio mudo. Esconder os zerados seria pior do
 *    que mostrá-los: o buraco de acessibilidade do acervo publicado é justamente o que a
 *    tela precisa tornar visível (D-90, D-91).
 *
 * 2. **A PONTE COM EVENTO.** «Não pode ir? veja isto» é sustentado por 14 das 529, não
 *    pelas 529. O bloco declara o denominador em vez de fingir cobertura. É PROIBIDO
 *    autorar aresta mídia→evento para inflar o número (T-05-34).
 *
 * 3. **O CORTE DO RESUMO.** O resumo não cabe no orçamento do catálogo e não viaja nele.
 *    O corte é declarado NA TELA, com o motivo — é o padrão que o feed e o índice de busca
 *    já fixaram nesta obra: custo declarado, nunca silencioso.
 *
 * DP-F: este é um `"use client"` e por isso NÃO alcança `@/dados/play` nem
 * `@/dados/grafo`, nem transitivamente. O DTO chega por propriedade, e o vocabulário
 * posicional vem de `play-wire.ts`, que não importa nada por valor.
 */

/**
 * A chave da conclusão, no espaço `agenda-cultural:`. É ESTE arquivo e `player.tsx` que a
 * conhecem — `src/contexto/sessao.tsx` é compartilhado com a fase inteira e não foi
 * tocado. O registro é um CONJUNTO de slugs de mídia: concluir a mesma duas vezes deixa
 * uma entrada.
 */
export const CHAVE_CONCLUIDAS = "agenda-cultural:play-concluidas";

/**
 * Lista de strings guardada como JSON, no molde de `lerLista` de `sessao.tsx`.
 *
 * T-05-37: o valor vem de storage EDITÁVEL por quem avalia. Valor que não é lista devolve
 * lista vazia e a tela continua de pé; item que não é string é descartado. O que a tela
 * não faz é propagar lixo para dentro do catálogo.
 */
export function lerConcluidas(): string[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE_CONCLUIDAS);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    if (!Array.isArray(valor)) return [];
    return valor.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

export function gravarConcluidas(slugs: string[]) {
  try {
    window.localStorage.setItem(CHAVE_CONCLUIDAS, JSON.stringify(slugs));
  } catch {
    // Storage bloqueado (modo privado, iframe): persistir é conveniência, não requisito.
  }
}

/** «Todas» não é uma categoria do acervo — é a ausência de recorte. */
const SEM_RECORTE = "";

export function Play({
  catalogo,
  dimensoes,
  ponte,
  corte,
  procedencia,
}: {
  catalogo: CatalogoNoFio;
  dimensoes: readonly DimensaoContada[];
  ponte: { arestas: number; midiasDistintas: number; eventosAlcancados: number; deQuantas: number; declaracao: string };
  corte: { campo: string; itens: number; motivo: string };
  procedencia: { rotulo: string; n: number };
}) {
  const [categoria, setCategoria] = useState<string>(SEM_RECORTE);
  const [dimensoesMarcadas, setDimensoesMarcadas] = useState<DimensaoAcessibilidade[]>([]);
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);

  // A leitura do storage mora no efeito, nunca no primeiro render: sob `output: "export"`
  // o HTML é gerado no build e ler `localStorage` no render divergiria da hidratação.
  useEffect(() => {
    setConcluidas(lerConcluidas());
    setHidratado(true);
  }, []);

  // As tuplas viram objetos UMA vez. O que viajou foi a posição; expandir é de graça.
  const itens = useMemo(
    () => catalogo.itens.map((f) => expandirItem(f, catalogo.categorias, catalogo.linguagens)),
    [catalogo],
  );

  const porSlug = useMemo(() => new Map(itens.map((i) => [i.slug, i])), [itens]);

  const recorte = useMemo(() => {
    return itens.filter((i) => {
      if (categoria !== SEM_RECORTE && i.categoria !== categoria) return false;
      return dimensoesMarcadas.every((d) => i.acessibilidade[d]);
    });
  }, [itens, categoria, dimensoesMarcadas]);

  /**
   * O que o Player registrou, resolvido contra o catálogo.
   *
   * T-05-37 de novo: um slug que NÃO resolve é descartado — e o descarte é DECLARADO, do
   * mesmo jeito que a prévia de impacto da fase 4 declara o dela. Descartar em silêncio
   * transformaria storage adulterado numa lista que encolhe sem explicação.
   */
  const retomada = useMemo(() => {
    const vistos = new Set<string>();
    const resolvidas: ItemDoPlayNoCliente[] = [];
    let descartadas = 0;
    for (const slug of concluidas) {
      if (vistos.has(slug)) continue;
      vistos.add(slug);
      const item = porSlug.get(slug);
      if (item) resolvidas.push(item);
      else descartadas += 1;
    }
    return { resolvidas, descartadas, guardadas: vistos.size };
  }, [concluidas, porSlug]);

  const rotuloDoRecorte =
    categoria === SEM_RECORTE
      ? "todas as categorias"
      : (catalogo.categorias.find((c) => c.valor === categoria)?.rotulo ?? categoria);

  return (
    <section data-play className="flex flex-col gap-6 p-4 desk:mx-auto desk:max-w-[76rem] desk:p-8">
      {/* ---------------------------------------------------------------- cabeçalho */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold desk:text-4xl">Play</h1>
        <p className="text-sm leading-relaxed desk:text-base">
          O catálogo do que dá para ver e ouvir de onde você estiver, de graça. São{" "}
          <strong data-denominador="midias">{catalogo.total}</strong> mídias do acervo do{" "}
          {procedencia.rotulo} — podcast, série, vídeo, entrevista e coluna na mesma lista,
          com o tipo etiquetado em cada uma.
        </p>
        <Comentario className="text-xs leading-relaxed text-black/55">
          O acervo não tem campo de «tipo» nem de «formato»: o que ele tem é a categoria do
          CMS, e é dela que sai o recorte abaixo. As {catalogo.total} são todas do{" "}
          {procedencia.rotulo} — a procedência é constante aqui, e por isso é declarada uma
          vez em vez de repetida em cada item (D-92).
        </Comentario>
      </header>

      {/* ------------------------------------------------- continue de onde parou */}
      <section
        data-continue={!hidratado ? "carregando" : retomada.resolvidas.length ? "com-itens" : "vazio"}
        className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 desk:web-painel"
      >
        <h2 className="text-sm font-bold">Continue de onde parou</h2>

        {!hidratado ? (
          <p className="text-xs text-black/45">Lendo o que ficou guardado neste navegador…</p>
        ) : retomada.resolvidas.length === 0 ? (
          /* Vazio e EXPLICADO, não sumido: um bloco que desaparece deixa quem avalia sem
             saber se a funcionalidade existe ou se ela quebrou. */
          <p className="text-xs leading-relaxed text-black/55">
            Nada aqui ainda. Ao concluir uma mídia na página dela, ela passa a aparecer
            nesta lista — e continua aparecendo depois de fechar e reabrir o navegador,
            porque o registro fica guardado neste computador e em nenhum outro lugar.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {retomada.resolvidas.map((i) => (
                <li key={i.slug}>
                  <Link
                    href={i.rota}
                    data-retomada={i.slug}
                    className="flex items-baseline gap-2 py-1 text-sm underline decoration-black/20 underline-offset-4 hover:decoration-current"
                  >
                    <span className="shrink-0 text-[0.6rem] font-bold tracking-widest text-black/45 uppercase">
                      {i.rotuloCategoria}
                    </span>
                    <span className="min-w-0 truncate">{i.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs text-black/55">
              <strong data-denominador="concluidas">{retomada.resolvidas.length}</strong> de{" "}
              {catalogo.total} concluída{retomada.resolvidas.length > 1 ? "s" : ""} neste
              navegador.
            </p>
          </>
        )}

        {retomada.descartadas > 0 ? (
          /* O descarte é DECLARADO. Storage adulterado não pode encolher a lista em
             silêncio — a pessoa tem de saber que havia algo ali que não resolveu. */
          <p data-descarte className="text-xs leading-relaxed text-black/55">
            <strong>{retomada.descartadas}</strong> registro
            {retomada.descartadas > 1 ? "s guardados neste navegador não correspondem" : " guardado neste navegador não corresponde"}{" "}
            a nenhuma mídia do acervo e foi descartado da lista acima.
          </p>
        ) : null}
      </section>

      {/* -------------------------------------------- não pode ir? veja isto (D-92) */}
      <section
        data-veja-isto
        className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 desk:web-painel"
      >
        <h2 className="text-sm font-bold">Não pode ir? veja isto</h2>
        <p className="text-sm leading-relaxed">
          <strong data-denominador="com-ponte">{ponte.midiasDistintas}</strong> das{" "}
          <strong data-denominador="total">{ponte.deQuantas}</strong> mídias falam de um
          evento que está no acervo — são{" "}
          <strong data-denominador="arestas">{ponte.arestas}</strong> ligações, alcançando{" "}
          <strong data-denominador="eventos">{ponte.eventosAlcancados}</strong> eventos. Nas
          páginas desses eventos, essas mídias aparecem como o que dá para ver de casa
          quando não dá para ir.
        </p>
        <p className="text-xs leading-relaxed text-black/55">
          As outras {ponte.deQuantas - ponte.midiasDistintas} não têm essa ligação
          declarada, e nós não a inventamos. O acervo registra «fala sobre» entre mídia e
          evento; «semelhante a» liga mídia a mídia e nunca chega a um evento. Afirmar que
          um vídeo fala de um evento quando a fonte não disse seria inventar um fato sobre
          o acervo — e é a mesma linha que não cruzamos ao não montar lista de elenco.
        </p>
      </section>

      {/* -------------------------------------------------------- recorte por categoria */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">Categorias do acervo</h2>
        <div role="group" aria-label="Recortar o catálogo por categoria" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            data-categoria={SEM_RECORTE || "todas"}
            aria-pressed={categoria === SEM_RECORTE}
            onClick={() => setCategoria(SEM_RECORTE)}
            className="play-chip"
          >
            Todas <span className="play-chip-n">{catalogo.total}</span>
          </button>
          {catalogo.categorias.map((c) => (
            <button
              key={c.valor}
              type="button"
              data-categoria={c.valor}
              aria-pressed={categoria === c.valor}
              onClick={() => setCategoria(c.valor === categoria ? SEM_RECORTE : c.valor)}
              className="play-chip"
            >
              {c.rotulo} <span className="play-chip-n">{c.n}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------- filtro de acessibilidade (D-90) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">Recursos de acessibilidade</h2>
        <p className="text-xs leading-relaxed text-black/55">
          O número ao lado de cada recurso é quanto ele recorta do acervo, medido antes de
          você marcar qualquer coisa. Dois dos três não recortam nada — e é por isso que
          eles aparecem com o número, e não escondidos.
        </p>
        <div role="group" aria-label="Filtrar por recurso de acessibilidade" className="flex flex-wrap gap-1.5">
          {DIMENSOES_DO_FILTRO.map((campo) => {
            const d = dimensoes.find((x) => x.campo === campo);
            const n = d?.n ?? 0;
            const marcada = dimensoesMarcadas.includes(campo);
            return (
              <button
                key={campo}
                type="button"
                data-acessibilidade-do-play={campo}
                {...(n === 0 ? { "data-nao-sustenta": "sim" } : {})}
                aria-pressed={marcada}
                onClick={() =>
                  setDimensoesMarcadas((atual) =>
                    atual.includes(campo) ? atual.filter((x) => x !== campo) : [...atual, campo],
                  )
                }
                className="play-chip"
              >
                {ROTULOS_DE_DIMENSAO[campo]}{" "}
                <span className="play-chip-n" data-denominador={campo}>
                  {n} de {catalogo.total}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------------- a lista */}
      <section className="flex flex-col gap-3">
        <p className="text-sm">
          <strong data-recorte-n>{recorte.length}</strong> de {catalogo.total} — {rotuloDoRecorte}
          {dimensoesMarcadas.length
            ? ` · com ${dimensoesMarcadas.map((d) => ROTULOS_DE_DIMENSAO[d].toLowerCase()).join(" e ")}`
            : ""}
        </p>

        {recorte.length === 0 ? (
          /* Vazio EXPLICADO — o mesmo compromisso de D-93: nenhum fim de caminho mudo. */
          <p data-recorte-vazio className="rounded-lg border border-dashed border-black/25 p-4 text-sm leading-relaxed">
            Nenhuma das {catalogo.total} mídias do acervo atende a esse recorte.{" "}
            {dimensoesMarcadas.some((d) => (dimensoes.find((x) => x.campo === d)?.n ?? 0) === 0)
              ? "O acervo publicado não declara esse recurso em nenhuma mídia — o vazio aqui é o próprio dado, não uma falha da busca."
              : "Tente soltar uma das marcações acima."}
          </p>
        ) : (
          <ul className="play-catalogo web-grade" style={{ ["--web-colunas" as string]: 4 }}>
            {recorte.map((i) => (
              <li key={i.slug} data-midia={i.slug} data-categoria-do-item={i.categoria}>
                <Link href={i.rota} className="play-cartao">
                  {/* A capa do catálogo NÃO usa `CapaDeCartao`, e a razão foi vista numa
                      foto, não num gate: aquele componente sobrepõe à imagem a pastilha
                      da classe e a tarja de crédito, que são desenhadas para a capa
                      grande do feed. Na miniatura de 88px do catálogo as duas se
                      empilham sobre a imagem e viram um borrão ilegível — e a pastilha
                      diria «MIDIA» ao lado de uma etiqueta que já diz «NOTÍCIA», que é
                      mais específica. Aqui a imagem é imagem, e o crédito é uma LINHA DE
                      TEXTO no pé do cartão: continua obrigatório e continua legível.
                      As 11 sem imagem caem na composição de marca, como no feed. */}
                  {i.imagem ? (
                    /* `alt=""`: o título está ao lado, como texto, dentro do mesmo link.
                       Repeti-lo no alt faria o leitor de tela anunciar a mesma frase
                       duas vezes por cartão, 529 vezes. */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={i.imagem}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="play-capa play-capa-imagem"
                    />
                  ) : (
                    <CapaSemImagem
                      titulo={i.titulo}
                      classe="midia"
                      linguagens={i.linguagens}
                      className="play-capa"
                    />
                  )}
                  <span className="play-cartao-tipo">{i.rotuloCategoria}</span>
                  <span className="play-cartao-titulo">{i.titulo}</span>
                  <span className="play-cartao-pe">
                    <time dateTime={diaParaIso(i.dia)}>{diaParaTexto(i.dia)}</time>
                    {i.creditoImagem ? (
                      <span className="play-credito">Foto: {i.creditoImagem}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------- o custo declarado */}
      <p data-corte className="text-xs leading-relaxed text-black/55">
        O resumo de cada mídia não viaja nesta lista — ele aparece por inteiro na página
        dela. {corte.motivo} O catálogo desta tela pesa{" "}
        <strong>{(catalogo.bytes / 1024).toFixed(1)} KB</strong> de um orçamento de{" "}
        {(catalogo.teto / 1024).toFixed(0)} KB, com as {corte.itens} mídias inteiras: o
        corte é de campo, nunca de item.
      </p>
    </section>
  );
}
