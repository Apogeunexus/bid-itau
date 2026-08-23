import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import {
  AvisoDaCompanhia,
  LinkDaCombinacao,
  SalvarRoteiro,
} from "@/componentes/entrevista-estrelinha";
import { Grafismo } from "@/componentes/grafismo";
import { MapaDoDia } from "@/componentes/mapa-do-dia";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import {
  combinacoesDaEstrelinha,
  COMPANHIAS,
  GOSTOS,
  OPCOES_DE_DIAS,
  roteiroDaEstrelinha,
} from "@/dados/estrelinha";

/**
 * `/ia/roteiro/[combinacao]` — o roteiro da estrelinha (reformulação 2026-08).
 *
 * 360 PÁGINAS PRÉ-COMPUTADAS, uma por combinação da entrevista. Os chips do topo
 * são a CONSULTA VISÍVEL E EDITÁVEL (o argumento de D-64 aplicado à IA): trocar
 * gosto, janela ou cidade navega para a combinação vizinha — nada recalcula no
 * navegador, porque a vizinha também já existe. COMPONENTE DE SERVIDOR (DP-F).
 */

export function generateStaticParams() {
  return combinacoesDaEstrelinha().map((c) => ({ combinacao: c.combinacao }));
}

export async function generateMetadata({
  params,
}: PageProps<"/ia/roteiro/[combinacao]">): Promise<Metadata> {
  const { combinacao } = await params;
  const dados = roteiroDaEstrelinha(combinacao);
  return {
    title: dados
      ? `Roteiro ✦ ${dados.combinacao.cidade.titulo}, ${dados.combinacao.dias} dias — Agenda Cultural BR`
      : "Roteiro — Agenda Cultural BR",
  };
}

const km = (v: number) => v.toFixed(1).replace(".", ",");

export default async function RoteiroDaIa({ params }: PageProps<"/ia/roteiro/[combinacao]">) {
  const { combinacao } = await params;
  const dados = roteiroDaEstrelinha(combinacao);
  if (!dados) notFound();

  const { cidade, dias, gosto } = dados.combinacao;
  const { roteiro, cobertura, regras } = dados;

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">
            ✦ {cidade.titulo}, {dias} dias
          </h1>
        </div>

        {/* A CONSULTA, visível e editável: cada chip navega para a combinação vizinha. */}
        <nav aria-label="Editar as respostas da entrevista" className="flex flex-col gap-1.5">
          <p className="tipo-micro text-tinta-3">Suas respostas · toque para trocar</p>
          <div className="flex flex-wrap gap-1.5">
            {GOSTOS.map((g) => (
              <LinkDaCombinacao
                key={g.slug}
                href={`/ia/roteiro/${cidade.slug}--${dias}-dias--${g.slug}/`}
                ativo={g.slug === gosto.slug}
              >
                {g.rotulo}
              </LinkDaCombinacao>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OPCOES_DE_DIAS.map((d) => (
              <LinkDaCombinacao
                key={d}
                href={`/ia/roteiro/${cidade.slug}--${d}-dias--${gosto.slug}/`}
                ativo={d === dias}
              >
                {d} dias
              </LinkDaCombinacao>
            ))}
            <Link
              href="/ia/"
              className="rounded-pilula border border-borda-forte px-2.5 py-1 text-xs font-semibold no-underline"
            >
              trocar a cidade →
            </Link>
          </div>
        </nav>

        <AvisoDaCompanhia rotulos={Object.fromEntries(COMPANHIAS.map((c) => [c.slug, c.rotulo]))} />

        <p className="max-w-prose text-sm leading-snug">
          {cobertura.rotuloLinguagem ? (
            <>
              <strong>
                {cobertura.doGosto} das {cobertura.total} paradas
              </strong>{" "}
              declaram {cobertura.rotuloLinguagem} — o acervo de {cidade.titulo} manda no
              resto, e o número fica dito em vez de maquiado.
            </>
          ) : (
            <>
              {cobertura.total} paradas escolhidas pelo rodízio do acervo — você pediu
              surpresa, e a surpresa é o acervo inteiro concorrendo.
            </>
          )}{" "}
          <SalvarRoteiro combinacao={combinacao} />
        </p>
      </header>

      {roteiro.dias.map((dia) => (
        <article key={dia.numero} className="cartao" data-dia-roteiro={dia.numero}>
          <header className="flex items-baseline gap-2">
            <h2 className="tipo-titulo-3 font-bold">Dia {dia.numero}</h2>
            <p className="tipo-legenda text-tinta-2">
              {dia.ancoradosNoCentroide === dia.itens.length
                ? "deslocamento não estimável — paradas no centroide do município"
                : `${km(dia.deslocamentoKm)} km em linha reta`}
            </p>
          </header>
          <p className="tipo-legenda leading-snug text-tinta-2">{dia.justificativa}</p>

          <MapaDoDia itens={dia.itens} numero={dia.numero} />

          <ol className="flex flex-col gap-2">
            {dia.itens.map((item, i) => (
              <li key={item.chave} className="flex items-start gap-3">
                <span className="tipo-destaque w-6 shrink-0 text-center font-bold text-acao-tinta">
                  {i + 1}
                </span>
                <div className="w-16 shrink-0">
                  <CapaDeCartao
                    titulo={item.titulo}
                    classe={item.classe}
                    linguagens={item.linguagens}
                    imagem={item.imagem}
                    creditoImagem={item.creditoImagem}
                    className="h-12 w-full rounded-p"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {item.rota ? (
                    <Link href={item.rota} className="text-sm leading-snug font-semibold">
                      {item.titulo}
                    </Link>
                  ) : (
                    <span className="text-sm leading-snug font-semibold">{item.titulo}</span>
                  )}
                  <p className="tipo-legenda text-tinta-3">
                    {item.rotuloClasse}
                    {item.dataDeclarada ? ` · ${item.dataDeclarada}` : ""}
                  </p>
                  <SelosDeLinguagem ids={item.linguagens} />
                </div>
              </li>
            ))}
          </ol>
        </article>
      ))}

      <section className="flex flex-col gap-2 rounded-g border border-borda bg-superficie-2 p-4">
        <h2 className="tipo-detalhe font-bold">As regras deste roteiro — o gerador inteiro</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {regras.map((r) => (
            <li key={r} className="tipo-legenda leading-snug text-tinta-2">
              {r}
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
