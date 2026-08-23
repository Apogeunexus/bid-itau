"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Chip, TrilhoDeChips } from "@/componentes/base/chip";
import { CapaSemImagem } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import {
  diaParaIso,
  diaParaTexto,
  DIMENSOES_DO_FILTRO,
  expandirItem,
  ROTULOS_DE_DIMENSAO,
  type CatalogoNoFio,
  type DestaqueNoFio,
  type DimensaoContada,
  type ItemDoPlayNoCliente,
} from "@/dados/play-wire";
import type { DimensaoAcessibilidade } from "@/dados/tipos";

/**
 * play.tsx — Play, a vitrine de streaming do acervo (D-92, `docs/telas.md` tela 19).
 *
 * POR QUE ESTA TELA EXISTE NA PROPOSTA. Ela sustenta dois argumentos ao mesmo tempo: o da
 * gratuidade e o da escala nacional onde não há equipamento cultural. É a resposta para as
 * regiões que o mapa de desertos mostra vazias — quando não há teatro na cidade, o que
 * existe é isto.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * REFORMULAÇÃO DE 23/08 — A TELA VIRA VITRINE, no molde de Netflix e Apple TV.
 *
 * A decisão é da reunião: «esse play aí pode ser bem dizer um clone da Netflix», «como
 * se já fosse logado», com destaque em cima e as fileiras embaixo. A forma anterior era
 * uma lista vertical de miniaturas de 88px, que entregava três itens por rolagem e não
 * dizia a ninguém que ali havia 113 coisas para assistir.
 *
 * O QUE ESTA TELA COPIA, e o que ela se recusa a copiar:
 *
 * **COPIA A FORMA.** Peça de destaque sangrando no topo, prateleiras horizontais por
 * categoria, cartaz em pé, e a troca de fileira para grade quando alguém escolhe um
 * recorte. É vocabulário que a pessoa já sabe operar sem aprender nada — a regra que a
 * reunião fixou («vamos evitar reinventar a roda»).
 *
 * **NÃO COPIA O QUE SERIA MENTIRA.** Não há «Top 10», não há «Em alta», não há «porque
 * você assistiu». As três coisas dependem de dado de uso, e este acervo não tem nenhum:
 * inventá-lo para encher fileira seria autorar um fato sobre o Itaú Cultural, que é a
 * linha que este projeto não cruza desde a fase 1. As fileiras que existem saem de campo
 * declarado — categoria — e o destaque é simplesmente A MAIS RECENTE, que é ordem, não
 * curadoria fabricada.
 *
 * **AS 113 CONTINUAM TODAS NA TELA.** As prateleiras são uma PARTIÇÃO do recorte de
 * streaming: cada mídia aparece em exatamente uma fileira, e as fileiras somam 113. Não
 * há `slice`, não há teto de exibição, não há item inalcançável — o mesmo compromisso que
 * o Cast assumiu ao acabar com o corte de 60. É por isso que não existe uma fileira
 * «novidades» nem uma fileira «com Libras»: as duas seriam o mesmo item aparecendo duas
 * vezes, e aí a soma das fileiras deixaria de ser o tamanho do acervo.
 *
 * **O CARTAZ É NOSSO DE PROPÓSITO.** O acervo não tem key art — tem fotografia larga com
 * o assunto fora do centro. Fechá-la num 2:3 de pôster decepa o assunto. Então o cartaz é
 * COMPOSTO: foto em 3:2, sem crop destrutivo, e uma faixa tipográfica da casa embaixo.
 * A forma é de streaming; a capa é deste design system, e isso se vê.
 *
 * **O BOTÃO NÃO DIZ «ASSISTIR».** O acervo traz a ficha e a capa, não o arquivo — e a
 * página do player explica isso por extenso. Um botão de play sobre nada seria a mentira
 * mais barata desta tela, do mesmo jeito que «ouvir» seria no Cast.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * ONDE ESTA TELA PODERIA MENTIR MAIS FÁCIL, e o que impede:
 *
 * 1. **O FILTRO DE ACESSIBILIDADE.** A tela 19 pede legenda, Libras e audiodescrição como
 *    se fossem três recortes equivalentes. Medido no acervo: Libras recorta 3 de 113 e os
 *    outros dois recortam ZERO. Os três aparecem — com o NÚMERO AO LADO DO RÓTULO, antes
 *    de qualquer marcação —, os dois zerados carregam `data-nao-sustenta`, e marcá-los
 *    devolve um vazio explicado em vez de um vazio mudo (D-90, D-91). As 3 com Libras
 *    ganham selo no próprio cartaz: o argumento aparece na parede, não só no chip.
 *
 * 2. **A PONTE COM EVENTO.** «Não pode ir? veja isto» é sustentado por 14 das 529, não
 *    pelas 529. O bloco declara o denominador em vez de fingir cobertura. É PROIBIDO
 *    autorar aresta mídia→evento para inflar o número (T-05-34).
 *
 * 3. **O CORTE DO RESUMO.** O resumo não cabe no orçamento do catálogo e não viaja nele.
 *    O corte é declarado NA TELA, com o motivo — é o padrão que o feed e o índice de busca
 *    já fixaram nesta obra: custo declarado, nunca silencioso. O destaque é a exceção
 *    medida: UM resumo custa ~200 bytes e ele é a peça que abre a tela.
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

/**
 * O cartaz — a unidade da parede, usada IGUAL no trilho e na grade.
 *
 * Um vocabulário só para os dois lugares não é economia de código: é o que impede que a
 * fileira e a grade divirjam de aparência e a tela passe a ter dois cartões para a mesma
 * coisa, que é exatamente a dívida que a primitiva `Chip` veio pagar.
 */
function Cartaz({ item }: { item: ItemDoPlayNoCliente }) {
  return (
    <li data-midia={item.slug} data-categoria-do-item={item.categoria}>
      <Link href={item.rota} className="play-cartaz">
        <span className="play-cartaz-quadro">
          {item.imagem ? (
            /* `alt=""`: o título está logo abaixo, como texto, dentro do mesmo link.
               Repeti-lo no alt faria o leitor de tela anunciar a mesma frase duas vezes
               por cartaz, 113 vezes.

               `next/image` está fora do projeto por decisão registrada em
               `capa-sem-imagem.tsx`: sob `output: "export"` com `images.unoptimized`
               ele só acrescentaria peso ao pacote. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imagem}
              alt=""
              loading="lazy"
              decoding="async"
              className="play-cartaz-foto"
            />
          ) : (
            <CapaSemImagem
              titulo={item.titulo}
              classe="midia"
              rotulo={item.rotuloCategoria}
              linguagens={item.linguagens}
              className="size-full"
            />
          )}
          {item.acessibilidade.libras ? (
            <span className="play-cartaz-selo tipo-micro">Libras</span>
          ) : null}
        </span>
        <span className="play-cartaz-faixa">
          <span className="play-cartaz-tipo tipo-micro">{item.rotuloCategoria}</span>
          <span className="play-cartaz-titulo tipo-detalhe">{item.titulo}</span>
        </span>
      </Link>
      <p className="play-cartaz-pe">
        <time dateTime={diaParaIso(item.dia)}>{diaParaTexto(item.dia)}</time>
        {item.creditoImagem ? (
          <span className="play-cartaz-credito">Foto: {item.creditoImagem}</span>
        ) : null}
      </p>
    </li>
  );
}

export function Play({
  catalogo,
  destaque,
  dimensoes,
  ponte,
  corte,
  procedencia,
}: {
  catalogo: CatalogoNoFio;
  destaque: DestaqueNoFio;
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

  const recortando = categoria !== SEM_RECORTE || dimensoesMarcadas.length > 0;

  const recorte = useMemo(() => {
    return itens.filter((i) => {
      if (categoria !== SEM_RECORTE && i.categoria !== categoria) return false;
      return dimensoesMarcadas.every((d) => i.acessibilidade[d]);
    });
  }, [itens, categoria, dimensoesMarcadas]);

  /**
   * As prateleiras — UMA por categoria, na ordem em que o catálogo as contou (a maior
   * primeiro). É uma PARTIÇÃO: cada mídia cai em exatamente uma fileira, e as fileiras
   * somam o total. Ver o cabeçalho deste arquivo para por que não há fileira editorial.
   */
  const prateleiras = useMemo(
    () =>
      catalogo.categorias.map((c) => ({
        ...c,
        itens: itens.filter((i) => i.categoria === c.valor),
      })),
    [catalogo.categorias, itens],
  );

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

  function limparRecorte() {
    setCategoria(SEM_RECORTE);
    setDimensoesMarcadas([]);
  }

  return (
    <section data-play className="play">
      {/* ------------------------------------------------------------------ o destaque */}
      <section data-destaque={destaque.slug} className="play-destaque">
        {destaque.imagem ? (
          /* `alt=""`: o título vem logo abaixo como texto, dentro da mesma peça. */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={destaque.imagem} alt="" decoding="async" className="play-destaque-foto" />
        ) : null}
        <span className="play-destaque-veu" aria-hidden />

        {destaque.creditoImagem ? (
          <span className="play-destaque-credito">Foto: {destaque.creditoImagem}</span>
        ) : null}

        <div className="play-destaque-texto">
          {/* O `<h1>` diz ONDE a pessoa está, como nas outras trinta telas. O texto
              grande é o título da mídia, e ele é `<p>`: promovê-lo a cabeçalho daria
              dois `<h1>` à rota e faria a navegação por cabeçalhos anunciar o nome de
              um vídeo no lugar do nome da tela. Mesma escolha de `heroi.tsx`. */}
          <h1 className="play-destaque-marca tipo-titulo-3">
            <Grafismo variacao="barra" className="h-[0.9em] w-auto" />
            Play
          </h1>
          <p className="play-destaque-tipo tipo-legenda">
            {destaque.rotuloCategoria} · a mais recente do acervo ·{" "}
            <time dateTime={diaParaIso(destaque.dia)}>{diaParaTexto(destaque.dia)}</time>
          </p>
          <p className="play-destaque-titulo tipo-cartaz">{destaque.titulo}</p>
          {destaque.resumo ? (
            <p className="play-destaque-resumo tipo-detalhe">{destaque.resumo}</p>
          ) : null}
          <Link
            href={destaque.rota}
            className="play-destaque-botao tipo-detalhe"
            aria-label={`Abrir «${destaque.titulo}»`}
          >
            Abrir
          </Link>
          {/* «Abrir» e não «assistir», e a ressalva vem junto: o acervo traz a ficha e a
              capa, não o arquivo. A página do player explica por extenso; aqui basta a
              vitrine não prometer o que não existe. */}
          <p className="play-destaque-nota tipo-legenda">
            O acervo traz a ficha e a capa de cada mídia — o arquivo de vídeo não faz parte
            dele, e nada é buscado de fora deste protótipo.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ o que a vitrine oferece */}
      <p className="tipo-detalhe text-tinta-2">
        <strong data-denominador="midias" className="font-display text-tinta">
          {catalogo.total} mídias
        </strong>{" "}
        para assistir, de graça, no acervo do {procedencia.rotulo} —{" "}
        {catalogo.categorias.map((c) => c.rotulo.toLowerCase()).join(", ")}. Os podcasts
        moram em Cast e o editorial em Notícias.
      </p>

      {/* --------------------------------------------------------------- os recortes
       *
       * OS DOIS TRILHOS NUM BLOCO SÓ, logo abaixo do destaque. Estavam em duas seções
       * com título em negrito e um parágrafo de três frases entre eles, e o resultado
       * media meia tela de conversa sobre o sistema antes da primeira prateleira —
       * exatamente a queixa que reformulou o Cast («a página falava do sistema antes de
       * falar do conteúdo»). O que o acervo precisa dizer continua dito: o número ao
       * lado de cada recurso, antes de qualquer marcação (D-90).
       */}
      <section className="play-recorte">
        <h2 className="tipo-micro text-tinta-3">Categorias do acervo</h2>
        <TrilhoDeChips rotulo="Recortar o catálogo por categoria">
          <Chip
            data-categoria={SEM_RECORTE || "todas"}
            selecionado={categoria === SEM_RECORTE}
            onClick={() => setCategoria(SEM_RECORTE)}
            contagem={catalogo.total}
          >
            Todas
          </Chip>
          {catalogo.categorias.map((c) => (
            <Chip
              key={c.valor}
              data-categoria={c.valor}
              selecionado={categoria === c.valor}
              onClick={() => setCategoria(c.valor === categoria ? SEM_RECORTE : c.valor)}
              contagem={c.n}
            >
              {c.rotulo}
            </Chip>
          ))}
        </TrilhoDeChips>

        {/* -------------------------------------- filtro de acessibilidade (D-90) */}
        <h2 className="tipo-micro mt-1 text-tinta-3">Recursos de acessibilidade</h2>
        <TrilhoDeChips rotulo="Filtrar por recurso de acessibilidade">
          {DIMENSOES_DO_FILTRO.map((campo) => {
            const d = dimensoes.find((x) => x.campo === campo);
            const n = d?.n ?? 0;
            const marcada = dimensoesMarcadas.includes(campo);
            return (
              <Chip
                key={campo}
                data-acessibilidade-do-play={campo}
                {...(n === 0 ? { "data-nao-sustenta": "sim" } : {})}
                selecionado={marcada}
                onClick={() =>
                  setDimensoesMarcadas((atual) =>
                    atual.includes(campo) ? atual.filter((x) => x !== campo) : [...atual, campo],
                  )
                }
                // «3 de 113» inteiro num nó só, e não quebrado em dois: o portão
                // lê o rótulo com /3\s*de\s*113/ depois de colapsar as quebras de
                // linha, e dois spans irmãos inserem um separador no innerText.
                contagem={`${n} de ${catalogo.total}`}
                chaveDaContagem={campo}
              >
                {ROTULOS_DE_DIMENSAO[campo]}
              </Chip>
            );
          })}
        </TrilhoDeChips>
        <p className="tipo-legenda text-tinta-2">
          O número diz quanto cada recurso recorta, medido antes de você marcar qualquer
          coisa — dois dos três não recortam nada, e é por isso que eles aparecem com o
          número em vez de escondidos.
        </p>
      </section>

      {/* ------------------------------------------------------------------- a vitrine */}
      {recortando ? (
        /* COM RECORTE A FILEIRA VIRA GRADE — a mesma troca que a referência faz ao
           escolher um gênero. Com recorte, a pergunta deixou de ser «o que tem aqui» e
           passou a ser «me mostre tudo isso de uma vez». */
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="tipo-detalhe">
              <strong data-recorte-n className="font-display">
                {recorte.length}
              </strong>{" "}
              de {catalogo.total} — {rotuloDoRecorte}
              {dimensoesMarcadas.length
                ? ` · com ${dimensoesMarcadas.map((d) => ROTULOS_DE_DIMENSAO[d].toLowerCase()).join(" e ")}`
                : ""}
            </p>
            {/* Nenhum recorte é beco: sair dele é sempre um clique, e o clique está do
                lado do número que ele desfaz. */}
            <button
              type="button"
              data-limpar-recorte
              onClick={limparRecorte}
              className="tipo-detalhe cursor-pointer font-bold text-acao-tinta hover:underline hover:underline-offset-4"
            >
              Limpar recorte
            </button>
          </div>

          {recorte.length === 0 ? (
            /* Vazio EXPLICADO — o mesmo compromisso de D-93: nenhum fim de caminho mudo. */
            <p
              data-recorte-vazio
              className="tipo-detalhe rounded-m border border-dashed border-borda-forte p-4"
            >
              Nenhuma das {catalogo.total} mídias desta vitrine atende a esse recorte.{" "}
              {dimensoesMarcadas.some((d) => (dimensoes.find((x) => x.campo === d)?.n ?? 0) === 0)
                ? "O acervo publicado não declara esse recurso em nenhuma mídia — o vazio aqui é o próprio dado, não uma falha da busca."
                : "Tente soltar uma das marcações acima."}
            </p>
          ) : (
            <ul className="play-grade">
              {recorte.map((i) => (
                <Cartaz key={i.slug} item={i} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        /* SEM RECORTE, AS PRATELEIRAS — e elas somam as 113: cada mídia aparece em
           exatamente uma fileira. Nada de `slice`, nada de teto de exibição. */
        prateleiras.map((p) => (
          <section key={p.valor} className="play-prateleira">
            <div className="play-prateleira-cabecalho">
              <h2 className="play-prateleira-titulo tipo-titulo-3">
                <Grafismo variacao="barra" className="h-[0.8em] w-auto text-acao-tinta" />
                {p.rotulo}
                <span className="play-prateleira-n tipo-detalhe">{p.n}</span>
              </h2>
              <button
                type="button"
                data-ver-tudo={p.valor}
                onClick={() => setCategoria(p.valor)}
                className="play-prateleira-tudo tipo-detalhe"
              >
                Ver {p.n} →
              </button>
            </div>
            <ul className="play-trilho">
              {p.itens.map((i) => (
                <Cartaz key={i.slug} item={i} />
              ))}
            </ul>
          </section>
        ))
      )}

      {/* ---------------------------------------------------- já concluídas por você
       *
       * DEPOIS DA VITRINE, e não antes dela. A referência abre com «continue
       * assistindo» porque lá essa lista quase nunca está vazia; aqui ela começa vazia
       * para todo mundo que abre a proposta, e vazia ela é um parágrafo de explicação.
       * Explicação antes de conteúdo era o defeito que esta reformulação veio corrigir.
       *
       * «Já concluídas», e não «continue de onde parou», que era o rótulo antigo: o que
       * esta lista guarda é o que a pessoa MARCOU COMO CONCLUÍDO no player. Não há
       * posição de reprodução no acervo, então prometer retomada era um rótulo que não
       * correspondia ao conteúdo debaixo dele.
       */}
      <section
        data-continue={!hidratado ? "carregando" : retomada.resolvidas.length ? "com-itens" : "vazio"}
        className="flex flex-col gap-2 rounded-m border border-borda p-3"
      >
        <h2 className="tipo-detalhe font-bold">Já concluídas por você</h2>

        {!hidratado ? (
          <p className="tipo-legenda text-tinta-3">Lendo o que ficou guardado neste navegador…</p>
        ) : retomada.resolvidas.length === 0 ? (
          /* Vazio e EXPLICADO, não sumido: um bloco que desaparece deixa quem avalia sem
             saber se a funcionalidade existe ou se ela quebrou. */
          <p className="tipo-legenda text-tinta-2">
            Nada aqui ainda. O que você marcar como concluída na página da mídia aparece
            nesta lista, guardada só neste navegador.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {retomada.resolvidas.map((i) => (
                <li key={i.slug}>
                  <Link
                    href={i.rota}
                    data-retomada={i.slug}
                    className="tipo-detalhe flex items-baseline gap-2 py-1 underline decoration-borda-forte underline-offset-4 hover:decoration-current"
                  >
                    <span className="tipo-micro shrink-0 text-tinta-3">{i.rotuloCategoria}</span>
                    <span className="min-w-0 truncate">{i.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="tipo-legenda text-tinta-2">
              <strong data-denominador="concluidas">{retomada.resolvidas.length}</strong> de{" "}
              {catalogo.total} concluída{retomada.resolvidas.length > 1 ? "s" : ""} neste
              navegador.
            </p>
          </>
        )}

        {retomada.descartadas > 0 ? (
          /* O descarte é DECLARADO. Storage adulterado não pode encolher a lista em
             silêncio — a pessoa tem de saber que havia algo ali que não resolveu. */
          <p data-descarte className="tipo-legenda text-tinta-2">
            <strong>{retomada.descartadas}</strong> registro
            {retomada.descartadas > 1 ? "s guardados neste navegador não correspondem" : " guardado neste navegador não corresponde"}{" "}
            a nenhuma mídia do acervo e foi descartado da lista acima.
          </p>
        ) : null}
      </section>

      {/* -------------------------------------------- não pode ir? veja isto (D-92) */}
      <section
        data-veja-isto
        className="flex flex-col gap-2 rounded-m border border-borda p-3 desk:web-painel"
      >
        <h2 className="tipo-detalhe font-bold">Não pode ir? veja isto</h2>
        <p className="tipo-detalhe">
          <strong data-denominador="com-ponte">{ponte.midiasDistintas}</strong> das{" "}
          <strong data-denominador="total">{ponte.deQuantas}</strong> mídias falam de um
          evento que está no acervo — são{" "}
          <strong data-denominador="arestas">{ponte.arestas}</strong> ligações, alcançando{" "}
          <strong data-denominador="eventos">{ponte.eventosAlcancados}</strong> eventos. Nas
          páginas desses eventos, essas mídias aparecem como o que dá para ver de casa
          quando não dá para ir.
        </p>
        <p className="tipo-legenda text-tinta-2">
          As outras {ponte.deQuantas - ponte.midiasDistintas} não têm essa ligação
          declarada, e nós não a inventamos. O acervo registra «fala sobre» entre mídia e
          evento; «semelhante a» liga mídia a mídia e nunca chega a um evento. Afirmar que
          um vídeo fala de um evento quando a fonte não disse seria inventar um fato sobre
          o acervo — e é a mesma linha que não cruzamos ao não montar lista de elenco.
        </p>
      </section>

      {/* ------------------------------------------------------------- o custo declarado */}
      <p data-corte className="tipo-legenda text-tinta-2">
        O resumo de cada mídia não viaja nesta lista — ele aparece por inteiro na página
        dela, e aqui só no destaque, que é um só. {corte.motivo} A vitrine desta tela pesa{" "}
        <strong>{(catalogo.bytes / 1024).toFixed(1)} KB</strong> de um orçamento de{" "}
        {(catalogo.teto / 1024).toFixed(0)} KB, com as {catalogo.total} mídias inteiras: o
        corte é de campo, nunca de item.
      </p>
    </section>
  );
}
