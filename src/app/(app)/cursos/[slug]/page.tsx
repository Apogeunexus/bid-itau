import type { Metadata } from "next";
import { CursoFicha } from "@/componentes/curso-ficha";
import { corpoPorSlug } from "@/dados/corpos";
import { catalogoDeCursos, cursoPorSlug } from "@/dados/cursos";

const TETO_IRMAS = 6;

export function generateStaticParams() {
  const slugs = catalogoDeCursos().itens.map((i) => i.slug);
  return (slugs.length ? slugs : ["sem-entidade"]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const curso = cursoPorSlug(slug);
  return { title: `${curso?.titulo ?? "Curso"} — Itaú Cultural` };
}

export default async function PaginaDoCurso({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const curso = cursoPorSlug(slug);

  if (!curso) {
    return (
      <main className="flex flex-col gap-2 p-4">
        <h1 className="text-lg font-bold">Formação não encontrada</h1>
        <p className="text-sm">
          Nenhuma formação do acervo responde por «{slug}».{" "}
          <a href="/cursos/" className="underline underline-offset-4">
            Voltar aos cursos
          </a>
          .
        </p>
      </main>
    );
  }

  const irmasTodas = catalogoDeCursos().itens.filter(
    (i) => i.formato === curso.formato && i.slug !== curso.slug,
  );
  const irmas = irmasTodas.slice(0, TETO_IRMAS);
  const cru = corpoPorSlug(curso.slug);

  return (
    <CursoFicha
      curso={curso}
      irmas={irmas}
      irmasTotal={irmasTodas.length}
      corpo={
        cru
          ? {
              blocos: cru.blocos,
              autor: cru.autor,
              youtubeId: cru.youtubeId,
              spotify: cru.spotify,
            }
          : undefined
      }
    />
  );
}
