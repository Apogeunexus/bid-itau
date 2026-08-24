import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoticiasSecao } from "@/componentes/noticias";
import { secaoPorSlug, secoesEditoriais } from "@/dados/leituras";

/**
 * `/noticias/[secao]` — uma seção editorial do hub.
 * COMPONENTE DE SERVIDOR: quatro páginas estáticas, uma por seção, listadas
 * por publicação decrescente com o CORTE DECLARADO — nunca um slice silencioso.
 */

/** Teto de exibição por página. O total real fica dito ao lado do corte. */
const TETO_EXIBICAO = 60;

export function generateStaticParams() {
  return secoesEditoriais().map((s) => ({ secao: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/noticias/[secao]">): Promise<Metadata> {
  const { secao } = await params;
  const dados = secaoPorSlug(secao);
  return { title: `${dados?.secao.rotulo ?? "Seção"} — Itaú Cultural` };
}

export default async function Secao({ params }: PageProps<"/noticias/[secao]">) {
  const { secao } = await params;
  const dados = secaoPorSlug(secao);
  if (!dados) notFound();

  return <NoticiasSecao secao={dados.secao} itens={dados.itens} teto={TETO_EXIBICAO} />;
}
