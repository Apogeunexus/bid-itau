import { Player } from "@/componentes/player";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { slugsPorTipo, vizinhos } from "@/dados/grafo";
import { eventosDaMidia, itemDoPlay, SEM_ARQUIVO } from "@/dados/play";

/**
 * A rota de uma mídia — **529 páginas**, o maior acréscimo desta fase (D-92).
 *
 * Reserva `sem-entidade` para o caso da classe vazia, no molde das rotas irmãs. Sob
 * `output: "export"` (D-24) um `generateStaticParams` que devolve lista vazia não exporta
 * página nenhuma e a rota deixaria de existir. Hoje a classe tem 529 mídias e o reserva
 * não é emitido.
 *
 * É PÁGINA DE SERVIDOR: é ela que toca `@/dados/play` e `@/dados/grafo`. O componente
 * recebe tudo por propriedade (DP-F).
 *
 * O DTO POR PÁGINA É ENXUTO DE PROPÓSITO. Ele não paga chunk — o payload de uma rota
 * exportada viaja no HTML da própria página, como 05-01 mediu —, mas paga HTML, e são
 * 529 arquivos. Por isso vai daqui só o que ESTA página mostra: nada de catálogo, nada
 * de lista de semelhantes, nada de vizinhança que a tela não usa.
 */
export function generateStaticParams() {
  const slugs = slugsPorTipo("midia");
  return (slugs.length ? slugs : ["sem-entidade"]).map((slug) => ({ slug }));
}

/**
 * Resolve o PARÂMETRO DE ROTA em item do catálogo — e não é `itemDoPlay(slug)` direto.
 *
 * O DEFEITO QUE ISTO CONSERTA, medido e não suposto: **8 das 529 mídias têm slug com
 * caractere fora de `[a-z0-9-]`** no acervo — aspas curvas, acento, travessão e até um
 * espaço de largura zero (U+200B). Um deles traz o TÍTULO INTEIRO enxertado no meio do
 * slug (`…-a-fo“17º In-Edit Brasil” leva à IC Play…rca-da-musica…`). É defeito do dado de
 * origem, não desta tela; `dados/` é somente-leitura aqui e o grafo não é regerado.
 *
 * Sob `output: "export"`, o Next ESCREVE o diretório com o nome decodificado e ENTREGA o
 * parâmetro percent-encodado. Comparar o parâmetro cru contra a chave do catálogo falha
 * exatamente nessas 8 — e o sintoma era o pior tipo: a rota EXISTIA, o build passava, e a
 * página servia «mídia não encontrada». 521 páginas certas e 8 mortas passariam em
 * qualquer contagem de rotas.
 *
 * A normalização Unicode entra pelo mesmo motivo: o sistema de arquivos do macOS pode
 * devolver a forma decomposta (NFD) de um nome gravado composto (NFC), e as duas são
 * strings diferentes para `Map.get` apesar de serem o mesmo texto na tela.
 *
 * Isto NÃO inventa dado nenhum: é o mesmo item, alcançado pela chave que ele já tem.
 */
function resolverParametro(param: string) {
  const tentativas = new Set<string>([param]);
  try {
    tentativas.add(decodeURIComponent(param));
  } catch {
    // Parâmetro com `%` solto não é decodificável — o valor cru segue valendo.
  }
  for (const t of [...tentativas]) {
    tentativas.add(t.normalize("NFC"));
    tentativas.add(t.normalize("NFD"));
  }
  for (const t of tentativas) {
    const achado = itemDoPlay(t);
    if (achado) return achado;
  }
  return undefined;
}

export default async function PaginaDaMidia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = resolverParametro(slug);

  if (!item) {
    return (
      <main className="flex flex-col gap-2 p-4">
        <h1 className="text-lg font-bold">Mídia não encontrada</h1>
        <p className="text-sm">
          Nenhuma mídia do acervo responde por «{slug}».{" "}
          <a href="/play/" className="underline underline-offset-4">
            Voltar ao catálogo
          </a>
          .
        </p>
      </main>
    );
  }

  /**
   * `aprofunda` saindo desta mídia. **Medido no acervo: ZERO nas 529** — nenhuma mídia
   * tem essa aresta. A consulta fica aqui mesmo assim, e não substituída por uma lista
   * vazia escrita à mão: se o grafo for regerado com essas arestas, a tela passa a
   * mostrá-las sem que ninguém precise lembrar de voltar aqui.
   */
  const aprofunda = vizinhos(item.id, "aprofunda").map((v) => ({
    slug: v.entidade.slug,
    titulo: v.entidade.titulo,
    rota: `/${v.entidade.classe}/${v.entidade.slug}/`,
    motivo: v.aresta.motivo,
  }));

  return (
    <Player
      midia={{
        slug: item.slug,
        titulo: item.titulo,
        rotuloCategoria: item.rotuloCategoria,
        resumo: item.resumo,
        imagem: item.imagem,
        imagemAlt: item.imagemAlt,
        creditoImagem: item.creditoImagem,
        dia: item.dia,
        linguagens: item.linguagens,
        temas: item.temas,
        fonte: item.fonte,
        acessibilidade: item.acessibilidade,
        declaraAcessibilidade: item.declaraAcessibilidade,
        procedencia: item.procedencia,
      }}
      eventos={eventosDaMidia(item.slug)}
      aprofunda={aprofunda}
      dataDeReferencia={DATA_DE_REFERENCIA}
      semArquivo={SEM_ARQUIVO}
    />
  );
}
