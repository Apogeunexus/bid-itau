"use client";

import { useEffect, useState } from "react";
import { usePontos } from "@/contexto/pontos";
import type { NomeDeEvento } from "@/lib/pontos/tipos";

/**
 * concluir-missao.tsx — o ato explícito de dizer «terminei isto».
 *
 * POR QUE ELE EXISTE. Quatro eventos do programa de pontos estavam declarados em
 * `lib/pontos/tipos.ts` e tinham missão em `dados/pontos.ts`, mas NENHUMA tela os
 * emitia: `leitura.materia.concluida`, `curso.aula.concluida`,
 * `museu.exposicao.percorrida` e `perfil.completo` eram vocabulário sem falante. A
 * missão aparecia na tela de Desafios, a pessoa fazia exatamente o que o cartão
 * pedia, e nada acontecia — que é o pior defeito possível num programa de missões,
 * porque parece desonestidade e não bug.
 *
 * POR QUE UM BOTÃO, E NÃO DETECÇÃO AUTOMÁTICA. Ler «rolou até o fim» ou «passou N
 * minutos na página» exigiria instrumentar rolagem e relógio em quatro telas
 * diferentes, e as duas medidas mentem: rolar até o rodapé não é ler, e deixar a
 * aba aberta não é assistir. Um ato explícito é mais honesto, e é o mesmo padrão
 * que o player já usa em «Marcar no meu repertório» — esta peça é a generalização
 * dele para as telas que não tinham nenhum.
 *
 * NÃO TEM «DESFAZER», E ISSO É DECISÃO. Marcar concede percurso e fichas; um
 * desfazer que não devolvesse os pontos seria um botão mentindo sobre o que faz, e
 * um que devolvesse abriria a porta para marcar e desmarcar em laço. Quem precisa
 * zerar zera a persona inteira, que é o caminho que já existe.
 *
 * SEM RELÓGIO E SEM SORTEIO, e `localStorage` só dentro de `useEffect`: o HTML
 * exportado no build precisa coincidir com a página hidratada, e ler o storage no
 * render faria os dois divergirem na primeira renderização.
 */
/**
 * As chaves de storage, UMA POR ESPÉCIE e todas versionadas com o mesmo prefixo do
 * resto do aplicativo. Ficam aqui, e não em cada tela, porque uma chave escrita à
 * mão em quatro arquivos diverge no primeiro erro de digitação — e o sintoma seria
 * uma marca que some ao recarregar, sem nenhum erro no console.
 */
export const CHAVE_MATERIAS_LIDAS = "agenda-cultural:materias-lidas";
export const CHAVE_EXPOSICOES_PERCORRIDAS = "agenda-cultural:exposicoes-percorridas";
export const CHAVE_AULAS_CONCLUIDAS = "agenda-cultural:aulas-concluidas";
export const CHAVE_PERFIL_COMPLETO = "agenda-cultural:perfil-completo";

export function ConcluirMissao({
  evento,
  alvo,
  chave,
  titulo,
  rotulo,
  rotuloFeito,
}: {
  /** O evento do programa de pontos que este ato emite. */
  evento: NomeDeEvento;
  /** O que foi concluído — vira `alvo` no rastro e aparece no extrato. */
  alvo: { tipo: string; id: string };
  /** Chave de `localStorage` da lista de ids já concluídos desta espécie. */
  chave: string;
  titulo: string;
  rotulo: string;
  rotuloFeito: string;
}) {
  const { motor } = usePontos();
  const [feitos, setFeitos] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    setFeitos(ler(chave));
    setHidratado(true);
  }, [chave]);

  const feito = feitos.includes(alvo.id);

  function concluir() {
    // O GUARDA VEM ANTES DE TUDO. O botão continua na tela depois de marcado —
    // ele vira o selo de «feito» — e sem isto cada clique repetido emitiria de
    // novo, inflando o extrato com uma leitura que aconteceu uma vez só.
    if (feito || !hidratado) return;
    const proximo = [...new Set([...feitos, alvo.id])];
    setFeitos(proximo);
    gravar(chave, proximo);
    motor.emitir(evento, alvo);
  }

  return (
    <section className="concluir-missao">
      <h2 className="tipo-detalhe font-bold">{titulo}</h2>
      <button
        type="button"
        data-concluir-missao={evento}
        onClick={concluir}
        // Antes de hidratar não dá para saber se já foi feito, e um botão que
        // pisca de «Concluir» para «Concluído» na hidratação é pior que um botão
        // desabilitado por um instante.
        disabled={!hidratado || feito}
        aria-pressed={feito}
        className="player-botao"
      >
        {feito ? rotuloFeito : rotulo}
      </button>
    </section>
  );
}

/**
 * Storage indisponível é caso previsto, não erro a propagar: em aba privada, em
 * iframe ou com a cota estourada a marca vale só nesta sessão. As duas funções
 * DEVOLVEM o resultado em vez de engolir em silêncio, e quem chama decide — aqui,
 * a decisão é seguir, porque o motor de pontos tem persistência própria e a missão
 * já está registrada mesmo quando esta marca se perde.
 */
function ler(chave: string): string[] {
  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    return Array.isArray(valor) ? valor.filter((x): x is string => typeof x === "string") : [];
  } catch (erro) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`concluir-missao: não consegui ler «${chave}» do storage`, erro);
    }
    return [];
  }
}

function gravar(chave: string, valor: string[]): boolean {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch (erro) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`concluir-missao: não consegui gravar «${chave}» no storage`, erro);
    }
    return false;
  }
}
