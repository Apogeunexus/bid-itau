"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useSessao } from "@/contexto/sessao";
import type { RostoDeSemente } from "@/dados/sementes-wire";

/**
 * onboarding-sementes.tsx — o passo 3 do onboarding cultural (S8). É aqui que o algoritmo
 * nasce: a entidade marcada vira o ponto de partida da caminhada no grafo, e o cartão que
 * chegar ao feed vai carregar a aresta que o trouxe.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * AS DUAS SAÍDAS SÃO REQUISITO, E O MOTIVO É MEDIDO
 *
 * A grade tem 194 rostos do acervo do Itaú Cultural. Reconhecer nomes dessa lista não é
 * garantido nem para quem trabalha com cultura — e uma tela de escolha que a pessoa não
 * consegue responder não é um passo do onboarding, é uma parede. Por isso:
 *
 *  - **«não conheço nenhum destes»** rerola a grade, sem sair da tela e sem penalidade;
 *  - **«pular»** segue adiante, e o feed passa a caminhar só pelas linguagens do passo 2
 *    — dizendo isso na tela de Descobrir, em vez de fingir um perfil.
 *
 * NEM TODA ENTIDADE É OFERECÍVEL, E ISSO SAIU DE UMA CONTAGEM. Das 847 sementes do
 * universo, 138 não alcançam nada no grafo em 1 ou 2 saltos — são ilhas — e 51 delas TÊM
 * foto. Sem esse corte, 51 cartas bonitas desta grade entregariam um feed vazio. Quem
 * corta é `sementes.ts`, no build, por `alcance`; esta tela recebe a lista já limpa.
 *
 * A BUSCA ALCANÇA MAIS DO QUE A GRADE. A grade só mostra quem tem imagem local, porque
 * uma parede de retângulos com nome é um teste de erudição, não um reconhecimento. Mas
 * quem procura por nome chega às 676 oferecíveis, e quem não tem foto aparece com as
 * iniciais no lugar dela.
 */

/** Quantos rostos a grade mostra por vez. Rerolar troca esta janela, não filtra. */
const POR_ROLAGEM = 24;

/** Acima disto a tela para de sugerir mais — é sugestão, nunca trava. */
const SUGERIDO = 12;

function iniciaisDe(titulo: string): string {
  return titulo
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function OnboardingSementes({ grade, busca }: { grade: RostoDeSemente[]; busca: RostoDeSemente[] }) {
  const { sementes, alternarSemente, hidratado } = useSessao();
  const [rolagem, setRolagem] = useState(0);
  const [termo, setTermo] = useState("");

  const marcadas = hidratado ? sementes.filter((c) => c.startsWith("e:")) : [];

  /**
   * A grade ordenada pelo passo 2: quem marcou música vê músicos primeiro. Não é filtro —
   * quem marcou só música continua vendo o resto do acervo depois, porque o onboarding
   * serve para ampliar repertório e não para confirmá-lo.
   */
  const ordenada = useMemo(() => {
    const doPasso2 = new Set(
      sementes.filter((c) => c.startsWith("l:")).map((c) => c.slice(2)),
    );
    if (!doPasso2.size) return grade;
    return [...grade].sort((a, b) => {
      const na = a.linguagens.some((l) => doPasso2.has(l)) ? 0 : 1;
      const nb = b.linguagens.some((l) => doPasso2.has(l)) ? 0 : 1;
      return na - nb;
    });
  }, [grade, sementes]);

  const resultados = useMemo(() => {
    const limpo = termo.trim().toLocaleLowerCase("pt-BR");
    if (limpo.length < 2) return null;
    return busca
      .filter((r) => r.titulo.toLocaleLowerCase("pt-BR").includes(limpo))
      .slice(0, POR_ROLAGEM);
  }, [termo, busca]);

  const inicio = (rolagem * POR_ROLAGEM) % Math.max(1, ordenada.length);
  const janela = resultados ?? ordenada.slice(inicio, inicio + POR_ROLAGEM);

  return (
    <section className="flex flex-col gap-4">
      <div className="onb-cabeca">
        <h2 className="onb-pergunta">Escolha quem já te interessa.</h2>
        <p className="onb-subtitulo">
          Artistas e obras do acervo. Quanto mais você marcar, mais o que aparece depois se
          parece com você — e cada cartão vai dizer por qual das suas escolhas ele chegou.
        </p>
      </div>

      <div className="onb-busca">
        <input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder={`Procurar entre ${busca.length.toLocaleString("pt-BR")} artistas e obras`}
          aria-label="Procurar artista ou obra pelo nome"
        />
      </div>

      {resultados?.length === 0 ? (
        <p className="onb-aviso-feed">
          Nenhum nome do acervo casa com «{termo.trim()}». Só entram aqui artistas e obras
          ligados a alguma coisa no grafo — quem está solto não vira ponto de partida.
        </p>
      ) : null}

      <div className="onb-grade">
        {janela.map((rosto) => {
          const ativo = hidratado && sementes.includes(rosto.chave);
          return (
            <button
              key={rosto.chave}
              type="button"
              aria-pressed={ativo}
              onClick={() => alternarSemente(rosto.chave)}
              className="onb-rosto"
            >
              <span className="onb-rosto-foto">
                {rosto.imagem ? (
                  <Image
                    src={rosto.imagem}
                    alt={`Retrato de ${rosto.titulo}`}
                    width={240}
                    height={320}
                    unoptimized
                  />
                ) : (
                  <span className="onb-iniciais" aria-hidden="true">
                    {iniciaisDe(rosto.titulo)}
                  </span>
                )}
                {ativo ? (
                  <span className="onb-marca" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </span>
              <span className="onb-rosto-texto">
                <span className="onb-rosto-nome">{rosto.titulo}</span>
                <span className="onb-rosto-classe">
                  {rosto.classe === "pessoa" ? "Artista" : "Obra"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!resultados ? (
        <div className="onb-saidas">
          <button
            type="button"
            className="onb-texto-acao"
            onClick={() => setRolagem((r) => r + 1)}
          >
            Não conheço nenhum destes — mostre outros
          </button>
        </div>
      ) : null}

      <p className="onb-passos" aria-live="polite">
        {marcadas.length === 0
          ? "Nenhum marcado ainda — dá para pular"
          : marcadas.length >= SUGERIDO
            ? `${marcadas.length} marcados — já é bastante`
            : `${marcadas.length} ${marcadas.length === 1 ? "marcado" : "marcados"}`}
      </p>
    </section>
  );
}
