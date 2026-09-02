/**
 * ingressos.ts — a ponte de VENDA pedida pelo cliente na reformulação de 2026-08:
 * «se um evento for da Sympla, o aplicativo direciona para a compra na plataforma».
 *
 * O ACERVO NÃO TEM ESSE DADO, e isso é medido: 0 dos 300 eventos declaram link de
 * ingresso — a fonte só tem o booleano `comIngresso`, sempre falso, e `preco` é
 * sempre null (`tipos.ts`). Para o fluxo ser DEMONSTRÁVEL, este módulo autora o
 * link para DOIS eventos, no mesmo estatuto da trilha do Cenário 1 (D-37): dado
 * escrito pela curadoria, ROTULADO COMO TAL NA TELA, nunca apresentado como se
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
    rotulo: "link escrito pela curadoria — o acervo não publica link de ingresso",
  },
  {
    eventoSlug: "b-a-b-i-l-a-q-u-e-s",
    url: "https://www.sympla.com.br/evento/b-a-b-i-l-a-q-u-e-s",
    plataforma: "Sympla",
    procedencia: "autorado",
    rotulo: "link escrito pela curadoria — o acervo não publica link de ingresso",
  },
];

/**
 * A cobertura de link, que é o primeiro KPI do produtor.
 *
 * MEDIDO, NÃO ESTIMADO: `dados/normalizado/eventos.json` traz `comIngresso` em 0 dos
 * registros e NENHUM campo de URL de compra — a classe não tem o campo. Os dois links
 * abaixo foram escritos pela curadoria e vivem fora do acervo, rotulados como tal.
 *
 * O painel do produtor abre por este número e não por cliques: com zero evento publicando
 * link, um gráfico de saída mostraria zero e pareceria fracasso de audiência quando é
 * ausência de cadastro.
 */
export const EVENTOS_COM_LINK_NO_ACERVO = 0;

/** Os escritos pela curadoria para o fluxo ser demonstrável. Não são do acervo. */
export const INGRESSOS_AUTORADOS = INGRESSOS.length;

const POR_SLUG = new Map(INGRESSOS.map((i) => [i.eventoSlug, i]));

/** O ingresso autorado de um evento, se este for um dos dois de demonstração. */
export function ingressoDe(eventoSlug: string): IngressoAutorado | undefined {
  return POR_SLUG.get(eventoSlug);
}
