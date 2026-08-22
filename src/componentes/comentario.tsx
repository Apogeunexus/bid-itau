import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * comentario.tsx — o invólucro de tudo que fala SOBRE o protótipo em vez de falar COM quem
 * o usa.
 *
 * O QUE ENTRA AQUI. Texto endereçado a quem avalia como pensamos: o parágrafo que explica o
 * que a tela é, a nota que descreve o mecanismo por trás dela, a citação de número de
 * decisão. Ligado o modo comentado, ele aparece; desligado, some.
 *
 * O QUE NÃO ENTRA AQUI, E ESTA METADE É A QUE IMPORTA. Texto endereçado a quem USA o
 * produto continua sempre na tela — o selo de motivo do cartão, os rótulos de procedência
 * `ic`/`derivado`/`autorado`, a frase de que o acervo não publica o espaço da sessão, a
 * frase de que o elenco não é declarado, a distinção entre «declarado ausente» e «não
 * declarado» da ficha de acessibilidade. Essas frases SÃO o argumento da proposta, não o
 * comentário sobre ele: escondê-las esvaziaria exatamente a tela que se quer mostrar.
 *
 * DISPLAY: NONE, E NÃO «VISUALMENTE ESCONDIDO». Um comentário que fica no fluxo ocupando
 * altura deixaria a tela furada de buracos justamente onde o texto foi tirado, e o modo
 * desligado pareceria uma tela quebrada em vez de um produto. A regra mora em
 * `globals.css`, sob `[data-comentado="nao"]`, pelo mesmo limite conhecido de `[data-view]`:
 * variante do Tailwind só prefixa UTILITÁRIO, e `.comentario` é classe semântica nossa.
 *
 * É COMPONENTE DE SERVIDOR, sem `"use client"` e sem `useComentado()`. A visibilidade é
 * decidida por CSS a partir do atributo que a casca escreve na raiz — assim um comentário
 * pode morar dentro de uma página de servidor sem arrastar a árvore inteira para o cliente,
 * e nenhum componente precisa assinar o contexto para saber se deve renderizar.
 */

/** Os elementos que os lugares de comentário deste protótipo precisam. */
type Elemento = "p" | "span" | "div" | "section" | "li";

export function Comentario({
  como = "p",
  className,
  children,
}: {
  /**
   * `span` para citação embutida numa frase de produto — o «(D-41)» que precisa sumir sem
   * levar a frase junto. `p` para o parágrafo inteiro. `section`/`div`/`li` para o bloco.
   */
  como?: Elemento;
  className?: string;
  children: ReactNode;
}) {
  const Tag = como;
  return (
    <Tag data-comentario className={clsx("comentario", className)}>
      {children}
    </Tag>
  );
}
