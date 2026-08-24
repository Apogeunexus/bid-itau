import Link from "next/link";
import { cloneElement, type ReactElement } from "react";
import { Chip, Estante, TrilhoDeChips } from "@/componentes/base/chip";
import { ICONE_BUSCAR, ICONE_FILTROS, ICONE_MAPA } from "@/componentes/base/icones";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { CartaoLeitura, dataCurta } from "@/componentes/cartao-leitura";
import type { Leitura } from "@/dados/leituras";
import type { ClasseEntidade } from "@/dados/tipos";

/**
 * descobrir-vitrines.tsx — as seções de descoberta que cercam o feed (redesenho
 * 2026-08 da área Descobrir).
 *
 * COMPONENTES DE SERVIDOR, todos. Nenhum estado, nenhum efeito: cada seção recebe
 * um recorte já MEDIDO no build por `descobrir/page.tsx` e o transforma em porta
 * para uma tela que existe — /buscar, /filtros, /mapa, /cidade, /acontece,
 * /noticias. Nada aqui calcula número: contagem que aparece veio medida do grafo,
 * e recorte exibido contra total é declarado (a regra da casa para todo teto).
 *
 * O que o redesenho pediu e o dado NÃO sustenta ficou fora, com o motivo já
 * registrado no projeto: chip «Gratuitos» (gratuidade não discrimina — 100% das
 * sessões saem gratuitas, `filtros.tsx`), bairros com contagem (distância abaixo
 * de 5 km é ruído da derivação, `mapa-perto.ts`) e «vistos recentemente» (o
 * produto não rastreia visita a entidade).
 */

// ---------------------------------------------------------------------------
// Cabeçalho de seção — título à esquerda, porta à direita
// ---------------------------------------------------------------------------

function CabecalhoDeSecao({
  titulo,
  href,
  rotuloDoLink,
}: {
  titulo: string;
  href?: string;
  rotuloDoLink?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="tipo-titulo-3 font-bold">{titulo}</h2>
      {href && rotuloDoLink ? (
        <Link
          href={href}
          className="shrink-0 text-xs font-semibold whitespace-nowrap text-acao-tinta underline underline-offset-2"
        >
          {rotuloDoLink}
        </Link>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Busca e atalhos — a porta de /buscar vestida de campo, mais os chips rápidos
// ---------------------------------------------------------------------------

export function BuscaDeDescobrir({ sessoesDeHoje }: { sessoesDeHoje: number }) {
  return (
    <section className="flex flex-col gap-3" aria-label="Busca e atalhos">
      <div className="flex items-stretch gap-2">
        {/* Link vestido de campo, e não um <input> falso: digitar acontece em
            /buscar, que filtra em memória a cada tecla (D-63). Um input aqui
            teria de repetir aquele índice ou mentir que busca. */}
        <Link
          href="/buscar/"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full border border-borda-forte bg-superficie px-4 py-2.5 text-sm text-tinta-2 no-underline"
        >
          <span aria-hidden className="shrink-0 text-tinta-3">
            {ICONE_BUSCAR}
          </span>
          Busque eventos, artistas, obras e espaços
        </Link>
        <Link
          href="/filtros/"
          aria-label="Filtros"
          className="flex w-11 shrink-0 items-center justify-center rounded-full border border-borda-forte bg-superficie"
        >
          {ICONE_FILTROS}
        </Link>
      </div>

      <TrilhoDeChips rotulo="Atalhos de descoberta">
        <Chip href="/acontece/" contagem={sessoesDeHoje > 0 ? sessoesDeHoje : undefined}>
          Hoje
        </Chip>
        <Chip href="/mapa/">Perto de mim</Chip>
        <Chip href="/filtros/">Acessibilidade</Chip>
      </TrilhoDeChips>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Mapa cultural — as cidades com acervo, com contagem medida
// ---------------------------------------------------------------------------

export interface CidadeDaVitrine {
  slug: string;
  titulo: string;
  /** Entidades que o acervo situa na cidade. Medido no grafo (`cidade.ts`). */
  total: number;
}

export function MapaCultural({ cidades }: { cidades: readonly CidadeDaVitrine[] }) {
  if (!cidades.length) return null;
  return (
    <Estante
      titulo="Mapa cultural"
      rotulo="Cidades com acervo"
      verTodas={{ href: "/mapa/", rotulo: "Ver mapa completo" }}
    >
      {cidades.map((cidade) => (
        <Chip
          key={cidade.slug}
          variante="explorar"
          href={`/cidade/${cidade.slug}/`}
          contagem={cidade.total}
        >
          {cloneElement(ICONE_MAPA as ReactElement)}
          {cidade.titulo}
        </Chip>
      ))}
    </Estante>
  );
}

// ---------------------------------------------------------------------------
// Explore por linguagens — as facetas do índice de busca, cor e contagem do dado
// ---------------------------------------------------------------------------

export interface LinguagemDaVitrine {
  /** O valor da faceta — vira `#f=linguagem:{valor}` em /buscar (T-03-22 valida). */
  valor: string;
  rotulo: string;
  /** Contagem REAL no índice de busca, nunca estimada. */
  n: number;
  /** Nome do token de cor que o vocabulário gerou (D-08). */
  cor?: string;
}

export function ExplorePorLinguagens({
  linguagens,
  total,
}: {
  linguagens: readonly LinguagemDaVitrine[];
  total: number;
}) {
  if (!linguagens.length) return null;
  return (
    <Estante titulo="Explore por linguagens" rotulo="Linguagens artísticas">
      {linguagens.map((linguagem) => (
        <Chip
          key={linguagem.valor}
          variante="explorar"
          href={`/buscar/#f=linguagem:${linguagem.valor}`}
          cor={linguagem.cor}
          contagem={linguagem.n}
        >
          {linguagem.rotulo}
        </Chip>
      ))}
      {/* Porta para o acervo, não «as linguagens que faltam»: /buscar/ não lista
          as 23 que o teto cortou, lista o índice. O rótulo é Todas, e o número
          é quantas linguagens o acervo tem. */}
      {total > linguagens.length ? (
        <Chip variante="explorar" href="/buscar/" contagem={total}>
          Todas
        </Chip>
      ) : null}
    </Estante>
  );
}

// ---------------------------------------------------------------------------
// Programação do dia — as sessões da data de referência, hora a hora
// ---------------------------------------------------------------------------

export interface SessaoDaVitrine {
  hora: string;
  titulo: string;
  slug: string;
  classe: ClasseEntidade;
  linguagens: string[];
  /** Caminho local, ou `null` declarado — a capa sem imagem entra no lugar. */
  imagem: string | null;
  creditoImagem: string | null;
}

export interface ProgramacaoDaVitrine {
  /** `YYYY-MM-DD` do dia exibido — o de referência, ou o primeiro com sessão depois dele. */
  data: string;
  eHoje: boolean;
  totalSessoes: number;
  sessoes: SessaoDaVitrine[];
}

export function ProgramacaoDoDia({ programacao }: { programacao: ProgramacaoDaVitrine | null }) {
  if (!programacao || !programacao.sessoes.length) return null;
  const { data, eHoje, totalSessoes, sessoes } = programacao;
  const rotuloDoDia = dataCurta(Number(data.replace(/-/g, "")));

  return (
    <section className="flex flex-col gap-3">
      <CabecalhoDeSecao
        titulo={eHoje ? "Programação de hoje" : `Próximas sessões · ${rotuloDoDia}`}
        href="/acontece/"
        rotuloDoLink="Ver agenda completa"
      />
      <ol
        data-programacao-do-dia
        className="flex flex-col rounded-xl border border-borda bg-superficie"
      >
        {sessoes.map((sessao) => (
          // Chave composta: o acervo de hoje tem UMA sessão por par evento-dia
          // (agenda.ts), mas a estrutura permite duas — e aí o slug sozinho colidiria.
          <li key={`${sessao.hora}-${sessao.slug}`} className="border-t border-borda first:border-t-0">
            <Link
              href={`/evento/${sessao.slug}/`}
              className="flex items-center gap-3 px-3 py-2 no-underline"
            >
              <CapaDeCartao
                titulo={sessao.titulo}
                classe={sessao.classe}
                linguagens={sessao.linguagens}
                imagem={sessao.imagem}
                creditoImagem={sessao.creditoImagem}
                compacta
                className="size-16 shrink-0 rounded-p"
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-display text-sm font-bold">{sessao.hora}</span>
                <span className="line-clamp-2 text-sm leading-snug font-semibold">
                  {sessao.titulo}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {totalSessoes > sessoes.length ? (
        <p className="tipo-legenda text-tinta-2">
          {sessoes.length} de {totalSessoes} sessões do dia — o restante está na agenda.
        </p>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Conteúdo para inspirar — o editorial mais recente, no cartão que o hub já usa
// ---------------------------------------------------------------------------

export function ConteudoParaInspirar({ itens }: { itens: readonly Leitura[] }) {
  if (!itens.length) return null;
  return (
    <section className="flex flex-col gap-3">
      <CabecalhoDeSecao titulo="Conteúdo para inspirar" href="/noticias/" rotuloDoLink="Ver todos" />
      <div className="grid grid-cols-2 gap-3">
        {itens.map((leitura) => (
          <CartaoLeitura key={leitura.slug} leitura={leitura} />
        ))}
      </div>
    </section>
  );
}
