/**
 * heroi.ts — as imagens que o hero de /descobrir sorteia, escolhidas a olho.
 *
 * POR QUE UMA LISTA CURTA E ESCRITA À MÃO, com 2.382 imagens no acervo. O hero
 * põe o título POR CIMA da foto, no canto inferior esquerdo. A maioria do acervo
 * não serve para isso: é vertical, é pequena demais para a largura da tela, é
 * uma peça gráfica que já tem tipografia própria — e aí seria texto sobre texto —
 * ou tem o assunto exatamente onde o título vai entrar, e o scrim escureceria um
 * rosto em vez de escurecer um fundo.
 *
 * COMO ESTAS OITO FORAM ESCOLHIDAS. `scripts/curar-heroi.mjs` mediu as 2.382 por
 * magic bytes (231 dos 247 arquivos «.png» do acervo são JPEG com o nome errado,
 * então a extensão mente), filtrou por razão ≥ 1,5 e largura ≥ 800 — sobraram
 * 1.273 —, e depois cada uma foi desenhada num canvas para medir três coisas:
 * quantos tons distintos tem (fotografia tem centenas, cartela chapada tem
 * dezenas — foi assim que as peças gráficas saíram), o quanto a imagem inteira
 * varia, e o quanto o canto do texto varia. Sobraram 38, e as oito abaixo foram
 * ABERTAS E OLHADAS uma a uma. A medida encurta a pilha; ela não escolhe.
 *
 * `scripts/verificar-ds.mjs` remede cada entrada contra o disco: arquivo
 * ausente, dimensão que não bate, `alt` ou `credito` vazio reprovam o gate. É
 * isso que impede a lista de virar oito nomes que ninguém confere de novo.
 *
 * O CRÉDITO NÃO É ENFEITE. Cada imagem é de alguém, e o nome veio do próprio
 * acervo (`creditoImagem` da entidade que a usa), não de um palpite. Onde o
 * acervo não declara autoria, o crédito diz isso em vez de inventar.
 */

export interface Heroi {
  /** Nome do arquivo em `public/acervo/`, sem o diretório. */
  readonly arquivo: string;
  readonly largura: number;
  readonly altura: number;
  /** Descrição para quem não vê a imagem. Nunca vazia — o gate reprova. */
  readonly alt: string;
  /** Autoria, como o acervo declara. */
  readonly credito: string;
}

export const HEROIS: readonly Heroi[] = [
  {
    arquivo: "8b353574132ad879.jpg",
    largura: 900,
    altura: 506,
    alt: "Projeção do rosto de uma mulher sobre roupas penduradas numa arara, em penumbra",
    credito: "Divulgação",
  },
  {
    arquivo: "ed71328d4eadd832.jpeg",
    largura: 900,
    altura: 599,
    alt: "Parede com duas fileiras de cartazes coloridos de shows do Auditório Ibirapuera",
    credito: "Itaú Cultural",
  },
  {
    arquivo: "785adc6363e9895c.jpg",
    largura: 900,
    altura: 599,
    alt: "Mesa de debate iluminada no palco de um auditório cheio, visto da plateia",
    credito: "Francio de Holanda/Fundação Itaú",
  },
  {
    arquivo: "d9d673b89580eed0.jpeg",
    largura: 900,
    altura: 506,
    alt: "Artista de branco em cena, com as mãos abertas à frente do corpo, sobre fundo escuro",
    credito: "Rita Aquino",
  },
  {
    arquivo: "8e3a4a31a4246c0b.jpeg",
    largura: 900,
    altura: 599,
    alt: "Cantora de vestido dourado ao microfone, iluminada de azul num palco",
    credito: "Agência Ophelia",
  },
  {
    arquivo: "a727a2dd23612929.jpeg",
    largura: 900,
    altura: 599,
    alt: "Plateia de costas assistindo a uma projeção numa sala de cinema",
    credito: "Ophelia",
  },
  {
    arquivo: "ad298596fa1c4095.jpg",
    largura: 900,
    altura: 599,
    alt: "Homem de roupão branco com as mãos unidas, diante de uma câmera de cinema e da equipe",
    credito: "Acervo pessoal",
  },
  {
    arquivo: "ccb8756303e4eef6.jpg",
    largura: 900,
    altura: 600,
    alt: "Música de óculos sorrindo com um violão no colo, sob luz verde e amarela",
    credito: "Murilo Alvesso",
  },
];
