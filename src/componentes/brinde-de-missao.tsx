"use client";

import { useEffect, useRef, useState } from "react";
import { useEfeitosDePontos } from "@/contexto/pontos";
import type { EfeitoDoMotor } from "@/lib/pontos/tipos";

/**
 * brinde-de-missao.tsx — o aviso que aparece quando uma missão fecha.
 *
 * POR QUE ELE EXISTE. O motor já publicava `missaoConcluida` desde sempre, e
 * `useEfeitosDePontos` foi escrito exatamente para «quem desenha comemoração» — mas
 * NINGUÉM assinava. O canal existia inteiro e desembocava no vazio: a pessoa fazia
 * o que o cartão pedia, os pontos entravam no extrato, e a tela não dizia nada. Num
 * programa de missões isso não lê como bug, lê como promessa não cumprida.
 *
 * ONDE ELE MORA, E POR QUÊ. Dentro de `.moldura` e IRMÃO de `.moldura-rolagem`, na
 * casca — não dentro do conteúdo. É a mesma âncora da gaveta do menu lateral, e o
 * motivo é o mesmo: `position: fixed` está proibido fora do canto (D-04), porque na
 * visão mobile ele escapa da moldura do telefone e ocupa a largura da janela
 * inteira. `absolute` contra a moldura fica preso ao telefone, que é o que se
 * espera de um aviso.
 *
 * SEM RELÓGIO E SEM SORTEIO. A chave que reinicia a animação é um contador em
 * `ref`, não `Date.now()` nem `Math.random()`: os dois fariam o HTML exportado
 * divergir da página hidratada, e este componente renderiza em toda tela.
 *
 * DUAS MISSÕES AO MESMO TEMPO É CASO REAL — «Puxe uma cadeira» fecha na terceira
 * interação, e a mesma ação pode fechar a meta da semana junto. O aviso nomeia a
 * primeira e CONTA as outras, em vez de empilhar cartões que se cobrem.
 */
const DURACAO_MS = 6000;

interface Brinde {
  chave: number;
  titulo: string;
  percurso: number;
  fichas: number;
  alem: number;
}

export function BrindeDeMissao() {
  const [brinde, setBrinde] = useState<Brinde | null>(null);
  const contador = useRef(0);

  useEfeitosDePontos((efeitos: EfeitoDoMotor[]) => {
    const concluidas = efeitos.filter((e) => e.tipo === "missaoConcluida");
    if (concluidas.length === 0) return;

    // As concessões vêm NO MESMO LOTE da conclusão: é assim que o aviso mostra o
    // que entrou sem ter de reler o saldo — e sem correr o risco de mostrar um
    // número que já mudou por causa de outro evento.
    let percurso = 0;
    let fichas = 0;
    for (const e of efeitos) {
      if (e.tipo !== "concessao") continue;
      if (e.ativo === "percurso") percurso += e.valor;
      if (e.ativo === "ficha") fichas += e.valor;
    }

    contador.current += 1;
    setBrinde({
      chave: contador.current,
      titulo: concluidas[0].missao.titulo,
      percurso,
      fichas,
      alem: concluidas.length - 1,
    });
  });

  useEffect(() => {
    if (!brinde) return;
    const relogio = setTimeout(() => setBrinde(null), DURACAO_MS);
    return () => clearTimeout(relogio);
  }, [brinde]);

  if (!brinde) return null;

  return (
    <div
      // `key` reinicia a entrada quando uma segunda missão fecha enquanto a
      // primeira ainda está na tela — sem ele o cartão trocaria de texto parado.
      key={brinde.chave}
      className="brinde-missao"
      data-brinde-missao
      // `polite` e não `assertive`: é comemoração, não erro. Interromper a leitura
      // de tela no meio de uma frase para dizer «parabéns» é o oposto de acessível.
      role="status"
      aria-live="polite"
    >
      <p className="brinde-missao-selo tipo-micro">Missão cumprida</p>
      <p className="brinde-missao-titulo tipo-detalhe font-bold">{brinde.titulo}</p>
      <p className="brinde-missao-ganho tipo-legenda">
        {brinde.percurso > 0 ? <>+{brinde.percurso} de percurso</> : null}
        {brinde.percurso > 0 && brinde.fichas > 0 ? " · " : null}
        {brinde.fichas > 0 ? (
          <>
            +{brinde.fichas} <span className="ficha-moeda" aria-hidden /> fichas
          </>
        ) : null}
        {brinde.alem > 0 ? <> · e mais {brinde.alem} missão</> : null}
      </p>
      <button
        type="button"
        className="brinde-missao-fechar tipo-legenda"
        onClick={() => setBrinde(null)}
      >
        fechar
      </button>
    </div>
  );
}
