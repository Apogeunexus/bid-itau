"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useSessao } from "@/contexto/sessao";

/**
 * Seleção de persona da tela de entrada.
 *
 * D-25: NÃO HÁ AUTENTICAÇÃO. A escolha grava no estado de sessão e pronto. É mock
 * explícito, e o rótulo disso na própria tela é requisito, não cortesia — a banca precisa
 * saber, sem perguntar, o que é produto e o que é encenação.
 *
 * A gravação passou a ser feita por `useSessao` (D-46). Antes esta tela escrevia direto no
 * `localStorage` e NINGUÉM LIA: a persona escolhida na entrada não chegava ao feed. Agora
 * a chave é a mesma dos dois lados, e é essa ligação que faz o Cenário 1 existir.
 */
export interface PersonaExibivel {
  id: string;
  nome: string;
  resumo: string;
}

export function SelecaoPersona({ personas }: { personas: PersonaExibivel[] }) {
  const router = useRouter();
  const { personaId, definirPersona, hidratado } = useSessao();

  if (!personas.length) {
    return (
      <p className="rounded-xl border border-dashed border-black/25 p-4 text-sm text-black/60">
        Nenhuma persona no grafo ainda. A tela existe e responde; as três personas do
        protótipo aparecem quando `personas.json` for gerado.
      </p>
    );
  }

  function escolher(id: string) {
    definirPersona(id);
    router.push("/onboarding/1");
  }

  return (
    <div className="flex flex-col gap-2">
      {personas.map((persona) => {
        // Antes de hidratar, nenhuma aparece marcada: o HTML do build não sabe o que o
        // navegador guardou, e fingir que sabe produz divergência de hidratação.
        const ativa = hidratado && personaId === persona.id;
        return (
          <button
            key={persona.id}
            type="button"
            onClick={() => escolher(persona.id)}
            aria-pressed={ativa}
            className={clsx(
              "cursor-pointer rounded-xl border p-3 text-left transition-colors",
              ativa
                ? "border-[var(--ic-laranja)] bg-[var(--ic-laranja)]/10"
                : "border-black/15 hover:border-[var(--ic-preto)]",
            )}
          >
            <span className="block font-bold">{persona.nome}</span>
            <span className="mt-0.5 block text-xs text-black/60">{persona.resumo}</span>
          </button>
        );
      })}
    </div>
  );
}
