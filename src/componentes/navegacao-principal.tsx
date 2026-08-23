"use client";

import { MenuLateral } from "@/componentes/menu-lateral";
import { NavegacaoBarra } from "@/componentes/navegacao-barra";
import { useVisao } from "@/contexto/visao";

/**
 * navegacao-principal.tsx — qual das duas navegações entra na tela.
 *
 * NÃO É UMA PREFERÊNCIA, é a divergência de visão: no app a navegação é a
 * BARRA INFERIOR — quatro destinos a um polegar e o quinto botão abrindo o hub
 * de `/apps` — e na web é o TRILHO LATERAL. Uma barra de abas colada no pé de
 * uma janela de 1440px seria um padrão de telefone posto onde não resolve nada;
 * uma gaveta com hambúrguer num telefone que já tem barra seria a mesma árvore
 * duas vezes.
 *
 * O layout do grupo de rotas é componente de SERVIDOR e não lê contexto; este
 * arquivo é a fronteira mínima de cliente que a escolha exige. Ele decide, não
 * desenha: as duas navegações continuam donas da própria forma.
 *
 * Renderizar UMA das duas, e não esconder a outra por CSS, é o que impede o
 * hambúrguer de continuar alcançável pelo teclado numa tela onde ele não
 * aparece — uma armadilha de foco invisível é pior que um botão a mais.
 */
export function NavegacaoPrincipal() {
  const { visao } = useVisao();

  return visao === "mobile" ? <NavegacaoBarra /> : <MenuLateral />;
}
