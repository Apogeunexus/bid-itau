"use client";

import { usePathname } from "next/navigation";
import { useVisao } from "@/contexto/visao";

/**
 * Qual das superfícies de bastidor a pessoa tentou abrir — as três da fase 1 mais
 * `/roteiro`, que a fase 4 acrescentou. O layout do grupo não sabe qual rota
 * filha está montada, e um aviso genérico ("Bastidor") deixaria a pessoa sem saber o que
 * ela vai encontrar do outro lado da troca de visão.
 */
function superficieDe(caminho: string): string {
  if (caminho.startsWith("/studio")) return "Studio";
  if (caminho.startsWith("/redacao")) return "Redação";
  if (caminho.startsWith("/observatorio")) return "Observatório";
  if (caminho.startsWith("/roteiro")) return "O roteiro da demonstração";
  return "Esta superfície";
}

/**
 * Aviso das superfícies de bastidor na visão app.
 *
 * Studio, Redação e Observatório existem só na web — é a única exceção que D-05 permite à
 * regra de um componente para as duas visões. Mas rota bloqueada e tela branca são coisas
 * diferentes de superfície de desktop: aqui a pessoa entende o motivo e resolve num clique,
 * usando o mesmo contexto de visão do alternador (D-01, D-04).
 */
export function AvisoDesktop() {
  const { definirVisao } = useVisao();
  const superficie = superficieDe(usePathname() ?? "");

  return (
    <div className="flex flex-col gap-3 p-6 desk:hidden">
      <h1 className="text-xl font-bold">{superficie} é superfície de desktop</h1>
      <p className="text-sm text-black/60">
        As superfícies de bastidor — Studio, Redação, Observatório e o roteiro da
        demonstração — são feitas para tela grande e densa, e não têm equivalente na visão
        app. A rota existe e responde; só precisa da outra visão.
      </p>
      <button
        type="button"
        onClick={() => definirVisao("web")}
        className="w-fit cursor-pointer rounded-full bg-acao px-5 py-2.5 font-semibold text-[var(--ic-branco)] transition-opacity hover:opacity-90"
      >
        Trocar para a visão Web
      </button>
    </div>
  );
}
