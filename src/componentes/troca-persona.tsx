"use client";

import clsx from "clsx";
import { Comentario } from "@/componentes/comentario";
import { useSessao } from "@/contexto/sessao";
import { PERSONAS } from "@/dados/personas";

/**
 * troca-persona.tsx — D-45, e é um requisito de DEMONSTRAÇÃO antes de ser de produto.
 *
 * «A banca vai querer ver o feed da Maria e o do Carlos» está escrito no contexto da
 * fase, e por isso a troca precisa ser um toque: sem navegar, sem recarregar rota, sem
 * refazer caminhada. Dá para fazer porque o feed das três personas já veio
 * prerenderizado do build (DP-F) — trocar só muda qual lista o cliente exibe.
 *
 * Antes de hidratar, nenhuma persona aparece marcada: o HTML do build não sabe o que o
 * navegador guardou, e fingir que sabe produz divergência de hidratação.
 */
export function TrocaPersona({ className }: { className?: string }) {
  const { personaId, definirPersona, hidratado } = useSessao();

  if (PERSONAS.length < 2) return null;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <div
        role="group"
        aria-label="Trocar de persona"
        className="flex flex-wrap gap-1 rounded-full border border-black/15 p-1"
      >
        {PERSONAS.map((persona) => {
          const ativa = hidratado && personaId === persona.id;
          return (
            <button
              key={persona.id}
              type="button"
              aria-pressed={ativa}
              title={persona.resumo}
              onClick={() => definirPersona(persona.id)}
              className={clsx(
                "flex-1 cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                ativa
                  ? "bg-acao text-[var(--ic-branco)]"
                  : "text-[var(--ic-preto)] hover:bg-black/5",
              )}
            >
              {persona.nome}
            </button>
          );
        })}
      </div>
      {/* D-25: a persona é mock explícito e a tela diz isso, sem a banca precisar
          perguntar. A PRIMEIRA FRASE FICA NOS DOIS MODOS — é declaração de procedência do
          dado, da mesma família dos rótulos `ic`/`derivado`/`autorado`, e escondê-la faria
          uma persona inventada passar por gente do acervo. A segunda é sobre ONDE a conta
          foi feita, que é assunto de quem avalia a arquitetura, não de quem troca de
          persona. */}
      <p className="text-[0.65rem] leading-snug text-black/45">
        Persona é dado autorado para o protótipo.
        <Comentario como="span">
          {" "}
          Trocar aqui remonta o feed na hora — as três caminhadas foram montadas no build,
          não no navegador.
        </Comentario>
      </p>
    </div>
  );
}
