import Link from "next/link";
import { Grafismo } from "@/componentes/grafismo";
import { TelaTrilha } from "@/componentes/trilha";
import { slugsPorTipo } from "@/dados/grafo";
import { trilhaCompletaPorSlug } from "@/dados/trilha";

/**
 * `/trilha/[slug]` — o destino do cartão de trilha que `cartao.tsx` já emite desde o
 * plano 02-01. Era link para frente; a partir daqui é rota.
 *
 * COMPONENTE DE SERVIDOR. A cadeia é resolvida no build (DP-F): `trilha.ts` importa
 * `grafo.ts`, que carrega 23 MB de JSON, e nada disso pode ir ao navegador. O que
 * atravessa a fronteira é `TrilhaCompleta`, que é só primitivo.
 *
 * Sob `output: "export"` (D-24) rota dinâmica sem `generateStaticParams` simplesmente
 * não é exportada. O parâmetro de reserva segue a mesma regra das rotas de entidade da
 * fase 1: a rota existe mesmo se a classe estiver vazia, e o reserva some sozinho assim
 * que houver trilha. Hoje há uma, então ele não é emitido.
 */
export function generateStaticParams() {
  const slugs = slugsPorTipo("trilha");
  return (slugs.length ? slugs : ["sem-trilha"]).map((slug) => ({ slug }));
}

export default async function PaginaTrilha({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trilha = trilhaCompletaPorSlug(slug);

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      {trilha ? (
        <TelaTrilha trilha={trilha} />
      ) : (
        // Entidade ausente é estado vazio, nunca exceção: sob export estático uma
        // exceção aqui derrubaria o build inteiro por causa de um slug.
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <Grafismo
              variacao="barra"
              className="h-5 w-auto shrink-0 text-[var(--ic-laranja)]"
            />
            <h1 className="text-2xl leading-tight font-bold">Trilha não encontrada</h1>
          </div>
          <p className="max-w-prose text-sm leading-snug text-black/60">
            Nenhuma trilha do acervo responde por «{slug}». As trilhas são entidades do
            grafo como qualquer outra — quando não existe, a tela diz que não existe, em vez
            de montar uma cadeia plausível.
          </p>
          <Link
            href="/descobrir/"
            className="text-sm font-semibold text-[var(--ic-laranja)] underline underline-offset-2"
          >
            voltar para Descobrir
          </Link>
        </div>
      )}
    </div>
  );
}
