import type { Metadata } from "next";
import Link from "next/link";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { dataCurta } from "@/componentes/cartao-leitura";
import { Grafismo } from "@/componentes/grafismo";
import { catalogoDoPlay } from "@/dados/play";
import { milhar } from "@/dados/leituras";

export const metadata: Metadata = { title: "Cast — Agenda Cultural BR" };

/**
 * Cast — os podcasts do acervo em seção própria (reformulação 2026-08: o cliente
 * reprovou o Play misturando streaming, podcast e notícia). O recorte é
 * `categoria === "podcasts"` do catálogo de mídias; cada episódio abre a página
 * do player que a fase 5 já construiu. COMPONENTE DE SERVIDOR (DP-F).
 *
 * A TELA É UMA REVISTA, NÃO UM CATÁLOGO (revisão de hierarquia, 23/08). Três
 * mudanças, e todas vieram da mesma queixa — a página falava do sistema antes de
 * falar do conteúdo:
 *
 * 1. **O cabeçalho encolheu.** Título, uma linha editorial e a contagem medida.
 *    A explicação de como o recorte é feito falava do protótipo, não do acervo, e
 *    saiu da tela.
 *
 * 2. **A capa deixou de ser quadrada.** 3:2 e raio de painel, como peça
 *    editorial — o quadrado engolia a tela e entregava menos de um episódio por
 *    rolagem. A pastilha diz «Podcast» e não «MIDIA»: as 336 são todas mídia, e o
 *    nome da classe no modelo não é assunto de quem lê.
 *
 * 3. **O CORTE DE EXIBIÇÃO ACABOU, e por isso não há mais nada a declarar.**
 *    Havia um teto de 60 com o total dito ao lado — honesto, mas deixava 276
 *    episódios inalcançáveis e gastava a primeira vista com uma frase de sistema.
 *    O acervo não tem campo de série nem de tema que recorte estes 336 (201 deles
 *    não declaram tema nenhum), então inventar um filtro seria autorar um fato
 *    que a fonte não escreveu. A saída honesta é mostrar os 336, e ela cabe:
 *    MEDIDO na exportação anterior (`out/cast/index.html`), a grade custava 10.063
 *    bytes para 60 cartões — 168 bytes cada, num HTML estático com imagem
 *    preguiçosa. Os 276 que faltavam entram na mesma ordem de grandeza.
 */
export default function Cast() {
  const podcasts = catalogoDoPlay().filter((m) => m.categoria === "podcasts");

  return (
    <div className="flex flex-col gap-6 p-5 desk:mx-auto desk:max-w-6xl desk:p-8">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="tipo-titulo-1 font-bold">Cast</h1>
        </div>
        <p className="tipo-detalhe max-w-prose">
          Vozes e histórias do acervo do Itaú Cultural. O streaming continua em Play.
        </p>
        <p className="tipo-legenda text-tinta-3">
          <strong className="font-display text-tinta">{milhar(podcasts.length)} podcasts</strong> ·
          do mais recente ao mais antigo
        </p>
      </header>

      {podcasts.length === 0 ? (
        <p className="tipo-detalhe rounded-m border border-dashed border-borda-forte p-4">
          O acervo carregado não traz nenhum podcast. Nada foi escondido aqui — a fila é o que
          a fonte publicou, e neste momento ela está vazia.
        </p>
      ) : (
        <div
          className="grid grid-cols-1 gap-6 desk:grid-cols-3 desk:gap-8"
          data-resultados-total={podcasts.length}
          data-resultados-exibidos={podcasts.length}
        >
          {podcasts.map((m) => (
            <Link key={m.slug} href={m.rota} className="flex flex-col gap-2 no-underline">
              <CapaDeCartao
                titulo={m.titulo}
                classe="midia"
                rotulo="Podcast"
                linguagens={m.linguagens}
                imagem={m.imagem}
                creditoImagem={m.creditoImagem}
                className="aspect-[3/2] w-full rounded-g"
              />
              {/* Data em Display bold preto, e não na cor de realce: laranja é AÇÃO
                  neste projeto, nunca data (DESIGN-SYSTEM.md §1, regra 2). */}
              <span className="tipo-micro font-display font-bold text-tinta">
                {dataCurta(m.dia)}
              </span>
              <span className="tipo-destaque line-clamp-2 font-semibold">{m.titulo}</span>
              {/* «Abrir» e não «ouvir»: o acervo não traz o arquivo de áudio, e a página
                  de destino é a ficha do episódio. Prometer play seria mentir no rótulo. */}
              <span className="tipo-legenda font-semibold text-acao-tinta">
                Abrir o episódio →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
