import Link from "next/link";
import { Explicacao } from "@/componentes/explicacao";
import { paginaExplicacao, PARAMS_DA_UNIAO } from "@/dados/explicacao";

/**
 * `/descobrir/porque/[id]` — DESC-03, D-33, `docs/telas.md` tela 6.
 *
 * A explicação é ROTA e não modal, de propósito: ela precisa ser compartilhável e precisa
 * sobreviver ao botão de voltar durante a demonstração ao vivo.
 *
 * O parâmetro é `{classe}_{slug}` e não o id canônico: `evento:cms:13787` tem dois-pontos,
 * que sob export estático vira nome de diretório e é frágil fora de macOS e Linux.
 *
 * `generateStaticParams` enumera a UNIÃO dos ids de cartão de todas as 96 combinações de
 * feed, importada do mesmo precômputo que Descobrir usa (`@/dados/feeds`). Recalcular a
 * lista com uma segunda chamada a `montarFeed` deixaria as duas divergirem, e id no feed
 * sem página é link morto no export — que ao vivo é pior do que um cartão a menos.
 *
 * A página prerenderiza a explicação das TRÊS personas e passa as três ao componente
 * cliente, que escolhe pela sessão: sob `output: "export"` a persona só é conhecida no
 * navegador, e prerenderizar uma faria a explicação mentir para as outras duas.
 */
export function generateStaticParams() {
  // Reserva, como as rotas de entidade da fase 1: união vazia por qualquer motivo não pode
  // fazer a rota sumir do export em silêncio.
  const params = PARAMS_DA_UNIAO.length ? PARAMS_DA_UNIAO : ["sem-cartao"];
  return params.map((id) => ({ id }));
}

export default async function PaginaPorque({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pagina = paginaExplicacao(id);

  // Entidade ausente não lança: sob `output: "export"` uma exceção aqui derrubaria o build
  // inteiro por causa de um parâmetro.
  if (!pagina) {
    return (
      <div className="flex min-h-full flex-col gap-3 p-4">
        <Link
          href="/descobrir/"
          className="text-xs font-bold text-acao underline underline-offset-2"
        >
          ← Descobrir
        </Link>
        <h1 className="text-lg leading-tight font-bold">Por que isto apareceu</h1>
        <p className="text-sm leading-snug text-black/60">
          Nenhum item do acervo corresponde a este endereço. A rota existe e responde; a
          explicação aparece quando o endereço é o de um cartão que o feed pode produzir.
        </p>
        <p
          data-limite-ia
          className="mt-auto border-t-2 border-acao pt-2 text-[0.7rem] leading-snug text-black/70"
        >
          <strong className="font-bold">Nenhuma decisão editorial foi tomada por IA.</strong> O
          caminho mostrado nesta tela é travessia determinística no grafo do acervo, e o
          destaque curado é humano e assinado.
        </p>
      </div>
    );
  }

  return <Explicacao pagina={pagina} />;
}
