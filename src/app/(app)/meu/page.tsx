import Link from "next/link";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { TrocaPersona } from "@/componentes/troca-persona";
import { repertorioDe } from "@/dados/repertorio";
import { PERSONAS } from "@/dados/personas";

/**
 * `/meu` — o PERFIL COMO HUB (reformulação 2026-08: o cliente reprovou a
 * organização da tela). A troca de persona no topo (D-45 — ela mora SÓ aqui e no
 * rodapé do menu) e quatro portas em cartão, cada uma dizendo o que entrega. O
 * mapa de repertório, que ocupava esta tela inteira, virou tela própria em
 * /meu/repertorio — aqui fica o resumo por persona, medido no build.
 */

/** O resumo do repertório das três personas, pré-computado (D-45). */
const resumos = Object.fromEntries(
  PERSONAS.map((p) => {
    const r = repertorioDe(p.id);
    return [
      p.id,
      { atravessadas: r.linguagensAtravessadas.length, aUmPasso: r.linguagensNovas.length },
    ];
  }),
);

export default function Meu() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Meu perfil</h1>
          <span className="ml-auto shrink-0 rounded-full border border-black/15 px-2 py-0.5 text-xs font-semibold text-black/50">
            C1
          </span>
        </div>
        <Comentario className="max-w-prose text-sm text-black/60">
          O perfil como hub: a persona no topo, e cada área do produto como porta com o que
          ela entrega dito na frente — em vez de uma tela única com tudo empilhado.
        </Comentario>
      </header>

      {/* D-45 — trocar de persona é um toque, e vale para o produto inteiro. */}
      <TrocaPersona />

      <Comentario className="max-w-prose text-sm text-black/60">
        Os números dos cartões abaixo são medidos no build — o resumo do repertório vem da
        mesma travessia de um salto que alimenta o mapa, nunca de contagem escrita à mão.
      </Comentario>

      <nav aria-label="Atalhos do perfil" className="grid gap-3 desk:grid-cols-2">
        <Link href="/meu/repertorio" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Mapa de repertório</span>
          <span className="tipo-legenda text-tinta-2">
            As linguagens que cada persona atravessou e as que estão a um passo —{" "}
            {Object.values(resumos)
              .map((r) => r.atravessadas)
              .join("/")}{" "}
            atravessadas por Maria, Carlos e Joana.
          </span>
          <span className="tipo-legenda font-bold text-acao">abrir o mapa →</span>
        </Link>
        <Link href="/salvos" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Salvos e alertas</span>
          <span className="tipo-legenda text-tinta-2">
            As sessões que você guardou, com aviso quando o produtor altera horário ou
            cancela.
          </span>
          <span className="tipo-legenda font-bold text-acao">abrir →</span>
        </Link>
        <Link href="/filtros" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Acessibilidade</span>
          <span className="tipo-legenda text-tinta-2">
            As 8 dimensões como critério que se marca uma vez e vale para toda a agenda.
          </span>
          <span className="tipo-legenda font-bold text-acao">configurar →</span>
        </Link>
        <Link href="/ia" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Roteiros com IA ✦</span>
          <span className="tipo-legenda text-tinta-2">
            Os roteiros que a estrelinha montou para você, guardados neste navegador.
          </span>
          <span className="tipo-legenda font-bold text-acao">ver →</span>
        </Link>
      </nav>
    </div>
  );
}
