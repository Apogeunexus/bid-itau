/**
 * capas-extra.ts — fotos que o gerador não internou porque a Enciclopédia
 * não publica imagem nesses verbetes. O arquivo local vive em `public/acervo/`,
 * o crédito vem da fonte da foto, e `fonte` é a URL de origem para auditoria.
 *
 * Só preenche entidade SEM imagem. Quem já tem capa do crawl não é tocado.
 */

export interface CapaExtra {
  /** Nome do arquivo em `public/acervo/`. */
  readonly arquivo: string;
  /** Autoria, como a fonte declara. */
  readonly credito: string;
  /** URL de origem — vai para `extra.imagemFonte`. */
  readonly fonte: string;
}

export const CAPAS_EXTRA: Readonly<Record<string, CapaExtra>> = {
  "pessoa:enc:22367": {
    arquivo: "38355a68f31891ad.jpg",
    credito: "Eliseu Visconti, 1895 / Wikimedia Commons",
    fonte: "https://commons.wikimedia.org/wiki/File:Retrato_do_Maestro_Alberto_Nepomuceno_-_Pintado_por_Eliseu_Visconti_em_1895.jpg",
  },
  "coletivo:enc:81559": {
    arquivo: "727c3065fbf2d542.jpeg",
    credito: "Kennel Rocha",
    fonte: "https://www.itaucultural.org.br/entrevista/silvero-pereira-indica-cinco-filmes-nacionais",
  },
  "termo:enc:79833": {
    arquivo: "776ddfd40d515b26.jpeg",
    credito: "João Luiz Musa/Itaú Cultural",
    fonte: "https://www.itaucultural.org.br/secoes/mostras-e-exposicoes__exposicoes-virtuais/fotografia-modernista-brasileira-exposicao-virtual-itau",
  },
  "evento:enc:163529": {
    arquivo: "e60f2f7c1f6882e9.jpg",
    credito: "Claiton Luis Moraes / Wikimedia Commons",
    fonte: "https://commons.wikimedia.org/wiki/File:Centro_Cultural_Dragão_do_Mar_-_Fortaleza(CE).jpg",
  },
};
