"use client";

import Link from "next/link";
import { ICONE_SINO } from "@/componentes/base/icones";
import { usePontos } from "@/contexto/pontos";

/**
 * sino-de-avisos.tsx — o terceiro alvo do cabeçalho, entre a lupa e o perfil.
 *
 * O PONTO SÓ ACENDE PELO QUE PEDE UMA AÇÃO SUA: os resgates que o produtor marcou como
 * entregues e ainda esperam a sua palavra. Chamado já aberto NÃO entra — ele está com a
 * outra ponta, e um sino que insiste sobre o que a pessoa já respondeu vira ruído que se
 * aprende a ignorar. Aí, no dia em que aparecer algo de verdade, ninguém olha.
 *
 * SEM O SINO, ESSE PEDIDO NÃO TINHA ONDE APARECER. A confirmação de recebimento mora numa
 * tela que ninguém abre por vontade própria; sem um aviso no chrome, um ingresso que não
 * chegou continuaria marcado como entregue para sempre.
 */
export function SinoDeAvisos() {
  const { motor, hidratado } = usePontos();

  /* Antes de ler o `localStorage` não há contagem que seja verdade — e um selo que pisca
     um número errado no primeiro quadro é pior que um sino sem selo. O link já existe: o
     alvo não pode aparecer depois, senão o cabeçalho pula. */
  const pendentes = hidratado ? motor.aguardandoConfirmacao().length : 0;

  return (
    <Link
      href="/meu/notificacoes/"
      className="barra-sino no-underline"
      aria-label={
        pendentes
          ? `Avisos: ${pendentes} ${pendentes === 1 ? "entrega espera" : "entregas esperam"} sua confirmação`
          : "Avisos"
      }
    >
      {ICONE_SINO}
      {pendentes ? (
        /* UM PONTO, E NÃO O NÚMERO. Ele já foi «1», «2», «9+» — e em qualquer tamanho que
           coubesse um dígito legível o selo virava 33% a 44% do botão, competindo com o
           ícone que deveria apenas anotar. A contagem não se perdeu: está no `aria-label`
           deste link e escrita por extenso na tela de avisos, que é onde ela serve para
           alguma coisa. Aqui o trabalho é um só — dizer que existe algo esperando. */
        <span className="barra-sino-ponto" aria-hidden="true" />
      ) : null}
    </Link>
  );
}
