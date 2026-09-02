import Link from "next/link";
import type { Metadata } from "next";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import { CENARIOS_DE_IA, cenarioDeIA } from "@/dados/cenarios-ia";
import { porSlug } from "@/dados/grafo";

/**
 * `/ia/cenario/[id]` — a resposta dos três cenários do briefing.
 *
 * PÁGINA DE SERVIDOR, e é aqui que o grafo é lido: cada evento citado na resposta é
 * buscado por slug e renderizado com a capa e a ficha reais. Se um slug sair do grafo, o
 * cartão some — a resposta nunca cita programação que não existe.
 *
 * A RESPOSTA É ESCRITA, E A TELA DIZ QUE É (D-15). Nenhum modelo é chamado. O que esta
 * página demonstra não é geração de texto: é a FORMA que este produto se compromete a dar
 * a uma resposta de IA — o que foi entendido, o critério que saiu daí amarrado ao trecho
 * literal da frase, os eventos que atendem com o motivo de cada um, e o que a resposta não
 * sustenta. Trocar a redação por um modelo depois não muda uma linha desta tela.
 */

export function generateStaticParams() {
  return CENARIOS_DE_IA.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/ia/cenario/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = cenarioDeIA(id);
  return { title: c ? `${c.persona} — resposta` : "Cenário" };
}

export default async function PaginaDoCenario({ params }: PageProps<"/ia/cenario/[id]">) {
  const { id } = await params;
  const cenario = cenarioDeIA(id);

  if (!cenario) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <h1 className="text-2xl font-bold">Cenário não encontrado</h1>
        <p className="text-sm text-tinta-2">A rota existe e responde; este identificador não.</p>
        <Link href="/ia/" className="text-sm font-bold text-acao-tinta">
          Voltar para a conversa
        </Link>
      </div>
    );
  }

  const sugeridos = cenario.sugestoes
    .map((s) => ({ ...s, entidade: porSlug("evento", s.slug) }))
    .filter((s) => s.entidade);

  return (
    <div className="cen-tela flex flex-col gap-6 p-5 desk:p-8">
      <header className="flex flex-col gap-3">
        <p className="text-[0.65rem] tracking-widest text-tinta-3 uppercase">
          {cenario.persona}
        </p>
        {/* A PERGUNTA APARECE COMO A PESSOA A ESCREVEU. Reescrever o pedido na resposta é
            o vício clássico do assistente: some a frase original e ninguém confere se ele
            entendeu. Aqui ela fica, entre aspas, acima da leitura. */}
        <blockquote className="cen-pergunta">«{cenario.prompt}»</blockquote>
      </header>

      <section className="flex flex-col gap-3">
        <h1 className="flex items-baseline gap-2 text-xl leading-tight font-bold">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />O que eu
          entendi
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-tinta-2">{cenario.entendi}</p>
      </section>

      {/* CADA CRITÉRIO CARREGA O TRECHO QUE O PRODUZIU. É a mesma disciplina da busca por
          frase: a tradução fica visível, e quem lê confere se a leitura foi a dele. */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[0.65rem] tracking-widest text-tinta-3 uppercase">
          o que virou critério
        </h2>
        <ul className="cen-criterios">
          {cenario.criterios.map((c) => (
            <li key={c.campo} className="cen-criterio">
              <span className="cen-criterio-campo">{c.campo}</span>
              <span className="cen-criterio-valor">{c.valor}</span>
              <span className="cen-criterio-frase">veio de «{c.daFrase}»</span>
            </li>
          ))}
        </ul>
      </section>

      {sugeridos.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg leading-tight font-bold">O que eu sugiro</h2>
          <div className="flex flex-col gap-3">
            {sugeridos.map((s) => (
              <article key={s.slug} className="cen-sugestao">
                <Link href={`/evento/${s.slug}/`} className="cen-sugestao-link no-underline">
                  <CapaDeCartao
                    titulo={s.entidade!.titulo}
                    classe="evento"
                    linguagens={s.entidade!.linguagens}
                    imagem={s.entidade!.imagem}
                    creditoImagem={s.entidade!.creditoImagem}
                    semPastilha
                    className="cen-sugestao-capa aspect-square w-full rounded-m"
                  />
                  <span className="cen-sugestao-titulo">{s.entidade!.titulo}</span>
                </Link>
                <p className="cen-sugestao-porque">{s.porque}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* O LIMITE DA RESPOSTA, no mesmo peso do resto. A tela da IA é a que mais parece
          saber coisas, e por isso é a que mais precisa dizer o que não sabe. */}
      <section className="cen-nao-sustenta">
        <h2 className="flex items-baseline gap-2 text-sm font-bold">
          <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0 text-acao-tinta" />O que
          esta resposta não sustenta
        </h2>
        <p className="text-sm leading-relaxed">{cenario.naoSustenta}</p>
      </section>

      <p className="text-xs leading-relaxed text-tinta-3">
        Resposta escrita, não gerada por modelo. O que está em demonstração é a forma da
        resposta — leitura, critério, sugestão e limite —, e é ela que o produto se
        compromete a manter quando o modelo entrar.
      </p>

      <Link href="/ia/" className="w-fit text-sm font-bold text-acao-tinta">
        ← Outra pergunta
      </Link>
    </div>
  );
}
