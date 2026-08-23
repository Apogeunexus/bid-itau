import type { Metadata } from "next";
import Link from "next/link";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";

export const metadata: Metadata = { title: "Blog — Agenda Cultural BR" };

/**
 * Blog — a seção pedida pelo cliente, com a ausência DECLARADA: nem o acervo
 * exportado nem o site do Itaú Cultural publicam uma seção chamada «blog». O
 * equivalente real são as colunas e a opinião do hub editorial, e é para lá que
 * esta tela aponta. Nunca conteúdo fabricado (regra da casa desde a fase 1:
 * esqueleto rotulado ou ausência com denominador).
 */
export default function Blog() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Blog</h1>
        </div>
        <p className="max-w-prose text-sm text-black/60">
          O espaço de leitura contínua do produto — textos autorais, bastidores e séries de
          artigos.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-g border border-borda bg-superficie-2 p-4">
        <p className="tipo-corpo max-w-prose">
          O acervo do Itaú Cultural não publica uma seção chamada <strong>blog</strong> — nem no
          conteúdo exportado, nem no site institucional. O que existe de mais próximo são as{" "}
          <strong>colunas</strong> e os textos de <strong>opinião</strong> do acervo editorial, e
          é por lá que a leitura começa:
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/noticias"
            className="rounded-pilula border border-acao px-3 py-1 text-xs font-bold text-acao"
          >
            Colunas e opinião em Notícias →
          </Link>
        </div>
      </section>

      <Comentario className="max-w-prose text-sm text-black/60">
        A tela existe porque o item de menu existe — e um item que levasse a um 404 seria
        indistinguível de rota quebrada. Quando a redação publicar textos próprios pelo Studio,
        eles aparecem aqui; até lá, a ausência fica dita com o denominador, no padrão de D-93.
      </Comentario>
    </div>
  );
}
