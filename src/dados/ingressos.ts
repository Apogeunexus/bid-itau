/**
 * ingressos.ts — a ponte de VENDA pedida pelo cliente na reformulação de 2026-08:
 * «se um evento for da Sympla, o aplicativo direciona para a compra na plataforma».
 *
 * O ACERVO NÃO TEM ESSE DADO, e isso é medido: 0 dos 300 eventos declaram link de
 * ingresso — a fonte só tem o booleano `comIngresso`, sempre falso, e `preco` é
 * sempre null (`tipos.ts`). Para o fluxo ser DEMONSTRÁVEL, este módulo autora o
 * link para DOIS eventos, no mesmo estatuto da trilha do Cenário 1 (D-37): dado
 * autorado para o protótipo, ROTULADO COMO TAL NA TELA, nunca apresentado como se
 * a fonte o tivesse publicado. Quando o produtor publicar o link pelo Studio, esta
 * tabela desaparece e o campo vem do acervo.
 *
 * É um `<a href>` externo que a pessoa CLICA — não uma requisição que o protótipo
 * faz; a promessa medida de zero rede em runtime continua valendo (mesma distinção
 * do link de fonte, `play.ts` SEM_ARQUIVO).
 */

export interface IngressoAutorado {
  /** O slug do evento que o demonstra. */
  eventoSlug: string;
  /** A URL de compra na plataforma — endereço real da Sympla, evento fictício. */
  url: string;
  plataforma: "Sympla";
  procedencia: "autorado";
  rotulo: string;
}

const INGRESSOS: IngressoAutorado[] = [
  {
    eventoSlug:
      "o-veneno-do-teatro-traz-thriller-fascinante-protagonizado-por-osmar-prado-e-mauricio-machado",
    url: "https://www.sympla.com.br/evento/o-veneno-do-teatro",
    plataforma: "Sympla",
    procedencia: "autorado",
    rotulo: "link autorado para o protótipo — o acervo não publica link de ingresso",
  },
  {
    eventoSlug: "b-a-b-i-l-a-q-u-e-s",
    url: "https://www.sympla.com.br/evento/b-a-b-i-l-a-q-u-e-s",
    plataforma: "Sympla",
    procedencia: "autorado",
    rotulo: "link autorado para o protótipo — o acervo não publica link de ingresso",
  },
];

const POR_SLUG = new Map(INGRESSOS.map((i) => [i.eventoSlug, i]));

/** O ingresso autorado de um evento, se este for um dos dois de demonstração. */
export function ingressoDe(eventoSlug: string): IngressoAutorado | undefined {
  return POR_SLUG.get(eventoSlug);
}

/** A ausência, com denominador — impressa nos eventos SEM link. */
export const AUSENCIA_DE_INGRESSO =
  "Nenhum dos 300 eventos do acervo publica link de ingresso — a fonte só tem um " +
  "booleano, sempre falso. Quando o produtor publicar o link pelo Studio, o botão de " +
  "compra aparece aqui.";
