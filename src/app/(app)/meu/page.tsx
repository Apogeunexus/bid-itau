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

        {/* A entrada para Salvos (AGEN-03). Meu Repertório mostra O QUE foi salvo; a fila
            de Salvos é onde o alerta de alteração chega, e ela precisa ser alcançável sem
            que ninguém digite a URL — Mapa e Salvos não têm aba (D-14), então a porta é
            aqui. */}
        <Link
          href="/salvos"
          className="w-fit rounded-full border border-acao px-3 py-1 text-xs font-bold text-acao transition-colors hover:bg-acao hover:text-[var(--ic-branco)]"
        >
          Salvos e alertas de alteração →
        </Link>
      </header>

      <TelaRepertorio repertorios={repertorios} indice={indice} />
    </div>
  );
}
