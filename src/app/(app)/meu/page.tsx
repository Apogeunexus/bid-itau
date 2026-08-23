import Link from "next/link";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { TelaRepertorio } from "@/componentes/repertorio";
import { PERSONAS } from "@/dados/personas";
import { indiceDeSalvaveis, repertorioDe, type RepertorioDaPersona } from "@/dados/repertorio";

/**
 * Meu Repertório — DESC-07, `docs/telas.md` tela 21. Substitui o esqueleto da fase 1.
 *
 * COMPONENTE DE SERVIDOR. A travessia de um salto roda aqui, no build (DP-F): resolver
 * `vizinhos()` para as três personas exige `grafo.ts`, que carrega 23 MB de JSON. O que
 * atravessa a fronteira é `RepertorioDaPersona`, que é só primitivo.
 *
 * AS TRÊS PERSONAS SÃO MONTADAS DE UMA VEZ (D-45). É requisito de demonstração antes de
 * ser de produto: a banca vai pedir para ver a Maria e depois o Carlos, e a troca precisa
 * ser um toque. Com as três já prerenderizadas, trocar é escolher qual objeto exibir.
 */
const repertorios: Record<string, RepertorioDaPersona> = Object.fromEntries(
  PERSONAS.map((persona) => [persona.id, repertorioDe(persona.id)]),
);

/**
 * Ocorrência → evento, para o cliente nomear o que foi salvo NESTA SESSÃO. Sem ele a
 * tela mostraria uma contagem de salvos sem conseguir dizer o que são — e o índice
 * compacto (129 eventos numa tabela, data fatiada em 16 caracteres) é o preço medido de
 * não mandar o grafo ao navegador.
 */
const indice = indiceDeSalvaveis();

export default function Meu() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Meu Repertório</h1>
          <span className="ml-auto shrink-0 rounded-full border border-black/15 px-2 py-0.5 text-xs font-semibold text-black/50">
            C1
          </span>
        </div>
        {/* Fala de «a pessoa» na terceira pessoa e compara a tela com uma alternativa de
            projeto («não como configurações»): é o argumento sobre a tela, não a tela. Quem
            usa o app já recebe a mesma ideia no número em destaque logo abaixo, escrito na
            segunda pessoa — «você atravessou N linguagens; M outras estão a um passo». */}
        <Comentario className="max-w-prose text-sm text-black/60">
          O perfil como mapa do que a pessoa atravessou, não como configurações: as
          linguagens já experimentadas, com peso, e o que está adjacente a exatamente um
          passo — calculado no grafo, não escrito à mão.
        </Comentario>

      </header>

      {/* O HUB DO PERFIL (reformulação 2026-08: o cliente reprovou a organização da
          tela). Três portas em cartão, com o que cada uma entrega dito na frente —
          Salvos é onde o alerta de alteração chega (AGEN-03), Filtros guarda as 8
          dimensões de acessibilidade, e a estrelinha guarda os roteiros gerados. */}
      <nav aria-label="Atalhos do perfil" className="grid gap-3 desk:grid-cols-3">
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

      {/* D-45 — a troca de persona mora SÓ AQUI desde a reformulação de 2026-08
          (feedback do cliente: a visualização de personas não pode afetar a
          experiência na tela de Descobrir). Quem a renderiza é a própria
          TelaRepertorio, logo no topo; o mecanismo não mudou — as três personas
          continuam pré-computadas e o feed lê a sessão. */}
      <TelaRepertorio repertorios={repertorios} indice={indice} />
    </div>
  );
}
