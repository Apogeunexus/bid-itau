import { TelaEntidade } from "@/componentes/tela-entidade";
import { porSlug, slugsPorTipo } from "@/dados/grafo";

/**
 * Reserva `sem-entidade` para o caso da classe vazia. Sob `output: "export"` (D-24) um
 * `generateStaticParams` que devolve lista vazia não exporta página nenhuma, e a rota
 * deixaria de existir — FUND-04 quebraria de forma intermitente, conforme a ordem de
 * execução. Com a reserva a rota existe sempre; ela some sozinha quando há entidade.
 * Hoje a classe tem conteúdo e o reserva não é emitido.
 */
export function generateStaticParams() {
  const slugs = slugsPorTipo("obra");
  return (slugs.length ? slugs : ["sem-entidade"]).map((slug) => ({ slug }));
}

export default async function PaginaObra({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entidade = porSlug("obra", slug);

  return (
    <TelaEntidade
      nome="Página da obra"
      camada="C3"
      objetivo="Mostrar que existem várias leituras da mesma obra: autoria, ano, técnica, onde está o acervo, expressões e montagens derivadas."
      entidade={entidade}
      classesEsperadas="obra"
      blocos={[
        "autoria, ano e técnica",
        "onde está · acervo",
        "expressões e montagens derivadas",
        "eventos que a apresentam",
        "verbete da Enciclopédia",
      ]}
    />
  );
}
