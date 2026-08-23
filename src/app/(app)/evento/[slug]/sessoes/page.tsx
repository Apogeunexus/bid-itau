import {
  SelecaoDeOcorrencia,
  type SelecaoDeOcorrenciaDTO,
  type SessaoExibivel,
} from "@/componentes/selecao-ocorrencia";
import { DIMENSOES, ROTULO_DIMENSAO, type TempoDoDia } from "@/dados/agenda";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { ocorrenciasDe, porId, porSlug, slugsPorTipo, temporadasDe } from "@/dados/grafo";
import type { Entidade } from "@/dados/tipos";

/**
 * `/evento/[slug]/sessoes` — AGEN-02, `docs/telas.md` tela 13.
 *
 * A ROTA É EXPORTADA SÓ PARA OS 129 EVENTOS QUE TÊM SESSÃO. Exportá-la para os 300
 * produziria 171 páginas com uma lista vazia — exatamente o tipo de tela que a fase 2
 * evitou, e ainda um link que promete escolha e entrega nada. Os 171 restantes (160 da
 * Enciclopédia, 11 do CMS sem período) não perdem informação: a data que eles têm é
 * declarada na própria página do evento, transcrita como a fonte a escreveu.
 *
 * COMPONENTE DE SERVIDOR (DP-F): é aqui, no BUILD, que o grafo de 23 MB é lido. O que
 * atravessa para `<SelecaoDeOcorrencia>` são primitivos — inclusive a acessibilidade, já
 * traduzida em rótulos, e o `passado`/`hoje`/`futuro` já decidido contra a data do build.
 */

/** A data de referência de `alerta.ts`, nunca o relógio: um build depois da meia-noite
 * UTC divergiria da data que o resto do produto e as suítes pinam (T-03-04). */
const HOJE = DATA_DE_REFERENCIA;

export function generateStaticParams() {
  return slugsPorTipo("evento")
    .filter((slug) => {
      const evento = porSlug("evento", slug);
      return evento ? ocorrenciasDe(evento.id).length > 0 : false;
    })
    .map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// Espaço: os três caminhos da fase 2, na mesma ordem, e o terceiro é uma frase
// ---------------------------------------------------------------------------

interface LocalDoEvento {
  cidade?: string | null;
  espaco?: string | null;
}

function espacoDaTemporada(temporada: Entidade | undefined): string | null {
  const id = (temporada?.extra as { espacoId?: string | null } | undefined)?.espacoId;
  if (!id) return null;
  return porId(id)?.titulo ?? null;
}

function espacoDoEvento(evento: Entidade): string | null {
  const locais = (evento.extra as { locais?: LocalDoEvento[] } | undefined)?.locais ?? [];
  for (const local of locais) {
    const nome = local?.espaco?.trim();
    if (!nome) continue;
    const cidade = local?.cidade?.trim();
    return cidade ? `${nome}, ${cidade}` : nome;
  }
  return null;
}

function tempoDaSessao(inicio: string): TempoDoDia {
  const dia = inicio.slice(0, 10);
  if (dia < HOJE) return "passado";
  if (dia > HOJE) return "futuro";
  return "hoje";
}

export default async function PaginaSessoes({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entidade = porSlug("evento", slug);
  const sessoesDoGrafo = entidade ? ocorrenciasDe(entidade.id) : [];

  /* Inalcançável pelo `generateStaticParams` acima, e mantido mesmo assim: uma rota que
   * lança durante o export derruba o build inteiro em vez de falhar numa página. */
  if (!entidade || !sessoesDoGrafo.length) {
    return (
      <div className="flex flex-col gap-4 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
        <h1 className="text-2xl leading-tight font-bold">Sessões</h1>
        <p className="max-w-prose text-sm text-tinta-2">
          Nenhum evento com sessão datada corresponde a este endereço.
        </p>
      </div>
    );
  }

  const porTemporada = new Map(temporadasDe(entidade.id).map((t) => [t.id, t]));
  const doEvento = espacoDoEvento(entidade);

  const sessoes: SessaoExibivel[] = sessoesDoGrafo.map((o) => {
    const daTemporada = espacoDaTemporada(porTemporada.get(o.temporadaId));
    const espaco = daTemporada ?? doEvento;
    return {
      id: o.id,
      inicio: o.inicio,
      tempo: tempoDaSessao(o.inicio),
      gratuito: o.gratuito,
      esgotado: o.esgotado,
      espaco,
      origemDoEspaco: espaco ? (daTemporada ? "temporada" : "evento") : null,
      /* Os rótulos são resolvidos AQUI, no build: o mapa das 8 dimensões mora em
       * `agenda.ts`, do lado servidor da fronteira, e mandá-lo para o cliente exigiria
       * uma terceira cópia dele. */
      acessibilidadePresente: DIMENSOES.filter((d) => o.acessibilidade[d]).map(
        (d) => ROTULO_DIMENSAO[d],
      ),
      declaraAcessibilidade: o.declaraAcessibilidade,
    };
  });

  const primeira = sessoesDoGrafo[0].acessibilidade;
  const acessibilidadeVaria = sessoesDoGrafo.some((o) =>
    DIMENSOES.some((d) => o.acessibilidade[d] !== primeira[d]),
  );

  const evento: SelecaoDeOcorrenciaDTO = {
    slug: entidade.slug,
    titulo: entidade.titulo,
    dataDeReferencia: HOJE,
    totalSessoes: sessoes.length,
    sessoesPassadas: sessoes.filter((s) => s.tempo === "passado").length,
    sessoesFuturas: sessoes.filter((s) => s.tempo !== "passado").length,
    sessoes,
    acessibilidadeVaria,
  };

  return <SelecaoDeOcorrencia evento={evento} />;
}
