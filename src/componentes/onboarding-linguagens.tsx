"use client";

import { useState } from "react";
import { useSessao } from "@/contexto/sessao";
import { LASTRO_FORTE, type LinguagemDeSemente } from "@/dados/sementes-wire";

/**
 * onboarding-linguagens.tsx — o passo 2 do onboarding cultural (S8).
 *
 * A pergunta é «por onde você entra?». Ela vem DEPOIS da disposição de propósito: o passo
 * 1 captura intenção («o que te move hoje»), este captura território cultural, e os dois
 * fazem trabalho diferente no motor — disposição pondera e corta o feed, linguagem é
 * SEMENTE, o ponto de onde a caminhada parte.
 *
 * A CONTAGEM VEM COLADA NO ROTULO, e ela é o tamanho do acervo daquela linguagem — não um
 * aviso de risco. MEDIDO: até «culinária», que tem 2 entidades, alcança 15 cartões, porque
 * a caminhada atravessa a linguagem para fora dela. O número está ali para a escolha ser
 * informada, e porque um catálogo que esconde o próprio tamanho pede confiança em vez de
 * dar evidência.
 *
 * AS FRACAS NÃO SÃO ESCONDIDAS, SÃO ADIADAS. A grade abre com as de 50 entidades ou mais
 * e as demais ficam atrás de «ver todas», com a contagem à vista. Cortar a cauda seria
 * decidir pela pessoa que ela não pode se interessar por circo (14) ou por feminismo (9).
 */
export function OnboardingLinguagens({ linguagens }: { linguagens: LinguagemDeSemente[] }) {
  const { sementes, alternarSemente, hidratado } = useSessao();
  const [verTodas, setVerTodas] = useState(false);

  const fortes = linguagens.filter((l) => l.entidades >= LASTRO_FORTE);
  const fracas = linguagens.filter((l) => l.entidades < LASTRO_FORTE);
  const mostradas = verTodas ? linguagens : fortes;
  const marcadas = hidratado ? sementes.filter((c) => c.startsWith("l:")).length : 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="onb-cabeca">
        <h2 className="onb-pergunta">Por onde você entra?</h2>
        <p className="onb-subtitulo">
          Escolha quantas quiser. Três já dão um bom começo, e dá para mudar depois. O
          número ao lado é quanta coisa o acervo tem de cada uma.
        </p>
      </div>

      <div className="onb-grade">
        {mostradas.map((linguagem) => {
          const ativa = hidratado && sementes.includes(linguagem.chave);
          return (
            <button
              key={linguagem.chave}
              type="button"
              aria-pressed={ativa}
              onClick={() => alternarSemente(linguagem.chave)}
              className="onb-lingua"
              style={{ ["--cor-linguagem" as string]: `var(${linguagem.cor})` }}
            >
              <span className="onb-rotulo">{linguagem.rotulo}</span>
              <span className="onb-conta">
                {linguagem.entidades.toLocaleString("pt-BR")}{" "}
                {linguagem.entidades === 1 ? "registro" : "registros"}
              </span>
            </button>
          );
        })}
      </div>

      {fracas.length ? (
        <button type="button" className="onb-texto-acao" onClick={() => setVerTodas((v) => !v)}>
          {verTodas
            ? `Mostrar só as ${fortes.length} maiores`
            : `Ver todas as ${linguagens.length} — inclusive as ${fracas.length} com acervo pequeno`}
        </button>
      ) : null}

      <p className="onb-passos" aria-live="polite">
        {marcadas === 0
          ? "Nenhuma marcada ainda"
          : `${marcadas} ${marcadas === 1 ? "marcada" : "marcadas"}`}
      </p>
    </section>
  );
}
