import type { Metadata } from "next";
import Link from "next/link";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { TelaRepertorio } from "@/componentes/repertorio";
import { PERSONAS } from "@/dados/personas";
import { indiceDeSalvaveis, repertorioDe, type RepertorioDaPersona } from "@/dados/repertorio";

export const metadata: Metadata = { title: "Mapa de repertório — Agenda Cultural BR" };

/**
 * `/meu/repertorio` — o MAPA DE REPERTÓRIO como tela própria (tela 22, Parte 6
 * do feedback do cliente): as linguagens atravessadas com peso e as adjacentes a
 * um passo, por persona. O conteúdo é a `TelaRepertorio` que morava dentro de
 * /meu — o perfil virou hub e o mapa ganhou endereço. COMPONENTE DE SERVIDOR:
 * a travessia roda no build (DP-F), as três personas já prontas (D-45).
 */
const repertorios: Record<string, RepertorioDaPersona> = Object.fromEntries(
  PERSONAS.map((persona) => [persona.id, repertorioDe(persona.id)]),
);

const indice = indiceDeSalvaveis();

export default function MapaDeRepertorio() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Mapa de repertório</h1>
          <span className="ml-auto shrink-0 rounded-full border border-borda px-2 py-0.5 text-xs font-semibold text-tinta-3">
            C3
          </span>
        </div>
        <Comentario className="max-w-prose text-sm text-tinta-2">
          O perfil como mapa do que a pessoa atravessou, não como configurações: as
          linguagens já experimentadas, com peso, e o que está adjacente a exatamente um
          passo — calculado no grafo, não escrito à mão.
        </Comentario>
        <Link
          href="/meu/"
          className="w-fit rounded-full border border-borda-forte px-3 py-1 text-xs font-bold no-underline"
        >
          ← Meu perfil
        </Link>
      </header>

      <TelaRepertorio repertorios={repertorios} indice={indice} />
    </div>
  );
}
