/**
 * apps.ts — o catálogo do hub: os aplicativos que moram dentro deste aplicativo.
 *
 * POR QUE ESTE ARQUIVO EXISTE. A árvore de navegação estava escrita dentro de
 * `menu-lateral.tsx`, como rótulo + ícone. Isso serve a um menu de texto e não
 * serve a um hub: um hub é uma prateleira de CAPAS, e capa é dado — arquivo,
 * autoria e descrição para quem não vê a imagem. Deixar isso dentro do
 * componente transformaria três informações do acervo em detalhe de layout.
 *
 * COMO AS CAPAS FORAM ESCOLHIDAS. Não por gosto e não por sorteio: cada app
 * declara um recorte do acervo (a categoria do CMS ou o tema que já classifica
 * aquele conteúdo), e a capa saiu de uma entidade REAL desse recorte, medida no
 * disco — ≥700px de largura e proporção entre 1,2 e 2,1, que é a faixa que
 * sobrevive ao corte de um mosaico. `origem` guarda o título da entidade de
 * onde a imagem veio: é o que permite conferir a escolha em vez de confiar
 * nela.
 *
 * ALT E CRÉDITO SÃO DO ACERVO, NÃO NOSSOS. `alt` é o `imagemAlt` que o CMS
 * publica e `credito` é o `creditoImagem` da mesma entidade. Nenhuma capa
 * entrou aqui sem os dois — escrever a descrição por conta própria seria pôr
 * palavra nossa na boca do Itaú Cultural, que é a linha que este projeto não
 * cruza (D-28).
 *
 * OS ATALHOS DE CONTA E DE BASTIDOR NÃO TÊM CAPA, e não é lacuna. «Salvos» é o
 * que VOCÊ guardou e «Studio» é uma mesa de trabalho: nenhum dos dois é um
 * acervo a folhear, e uma foto do acervo ali dentro prometeria conteúdo onde há
 * ferramenta.
 */

/**
 * Por onde o corte da capa deve segurar quando o cartaz é mais estreito que a
 * foto — e por que isso é dado da CAPA e não medida de layout.
 *
 * Parte do acervo tem TIPOGRAFIA GRAVADA na imagem: a foto do Cast é a thumb do
 * Mekukradjá e traz o letreiro do programa e o grafismo do Itaú Cultural no
 * terço esquerdo. Num cartaz em retrato o corte centralizado guarda justamente
 * essa faixa, e o rótulo «Cast» cai por cima de um segundo título. Onde segurar
 * o corte é propriedade daquela imagem, não do porte do cartaz: a mesma capa num
 * cartaz largo continua tendo o letreiro do mesmo lado.
 */
export type FocoDaCapa = "centro" | "direita" | "esquerda";

export interface CapaApp {
  /** Nome do arquivo em `public/acervo/`, sem o diretório. */
  readonly arquivo: string;
  /** Onde o corte segura. Ausente é `centro`, que serve à maioria. */
  readonly foco?: FocoDaCapa;
  /** `imagemAlt` da entidade de origem. Nunca vazio. */
  readonly alt: string;
  /** `creditoImagem` da entidade de origem. Nunca vazio. */
  readonly credito: string;
  /** Título da entidade do acervo de onde a capa veio — a trilha de conferência. */
  readonly origem: string;
}

/**
 * O glifo do selo redondo no canto do cartaz. É a única coisa que diz, ANTES do
 * toque, o que acontece do outro lado: Play e Cast começam a tocar alguma coisa,
 * Acontece abre um calendário, Mapa abre um mapa. `entrar` é o resto — a seta que
 * não promete nada além de atravessar. Quem desenha cada um é `base/icones.tsx`.
 */
export type Selo = "entrar" | "tocar" | "ouvir" | "agenda" | "mapa";

/**
 * Como o grupo se arruma na grade, e por que isto é DADO e não posição.
 *
 * O ritmo era derivado da ordem do grupo — girava sozinho e nenhum se repetia em
 * sequência. A referência de 23/08 tirou essa liberdade: ela desenha uma forma
 * para cada grupo, e a forma carrega significado. «Ler» é faixa larga porque
 * notícia e curso são leitura contínua; «Descobrir e perguntar» põe o feed em pé
 * ao lado dos dois atalhos porque o feed é o destino grande da fileira. Derivar
 * isso da posição do grupo daria a forma certa por acidente e a erraria assim que
 * alguém reordenasse a lista.
 *
 *   · **par**    — retratos aos pares. Contagem ímpar deixaria meia fileira vazia
 *                  no fim, então o ÚLTIMO vira faixa e fecha a linha.
 *   · **faixa**  — cada cartaz ocupa a largura toda.
 *   · **lado**   — o primeiro fica em pé à esquerda, os outros empilham à direita.
 */
export type Ritmo = "par" | "faixa" | "lado";

export interface App {
  readonly id: string;
  readonly rotulo: string;
  /** Uma linha: o que este app responde. Nunca o nome repetido em outra ordem. */
  readonly descricao: string;
  readonly href: string;
  readonly capa: CapaApp;
  readonly selo: Selo;
}

/**
 * O cartaz de temporada que a referência põe no fim de «Ir e ver».
 *
 * O TEXTO É NOSSO, E ISSO ESTÁ DECLARADO AQUI. Diferente de um cartaz de app, ele
 * não sai de nenhuma entidade do acervo: não existe no grafo uma coleção
 * «programação de inverno» para ele apontar — `meta.json` tem temporada como a
 * série de datas de um evento, não como estação do ano. Ele é uma CHAMADA DE
 * NAVEGAÇÃO para a agenda inteira, escrita por nós, e por isso não anuncia número
 * nem promete recorte: dizer «42 shows deste inverno» seria inventar contagem que
 * a fonte não faz. O fundo é textura, não fotografia do acervo — entra sem alt,
 * como decoração, porque é o que ele é.
 */
export interface Promocao {
  readonly rotulo: string;
  readonly descricao: string;
  readonly href: string;
  /** O rótulo do botão. Visível e clicável junto com o cartaz inteiro. */
  readonly chamada: string;
  /** Caminho da textura de fundo em `public/`. Decorativa: entra com alt vazio. */
  readonly fundo: string;
}

export interface GrupoApps {
  readonly id: string;
  readonly rotulo: string;
  readonly ritmo: Ritmo;
  readonly apps: readonly App[];
  /** O cartaz de temporada, quando o grupo carrega um. Vem depois da grade. */
  readonly promocao?: Promocao;
}

export interface Atalho {
  readonly href: string;
  readonly rotulo: string;
  readonly descricao: string;
}

export const GRUPOS_APPS: readonly GrupoApps[] = [
  {
    id: "assistir",
    rotulo: "Assistir e ouvir",
    ritmo: "par",
    apps: [
      {
        id: "play",
        rotulo: "Play",
        descricao: "Filmes, séries e mostras do acervo",
        href: "/play",
        capa: {
          arquivo: "62900cb44f608102.jpg",
          alt: "Frame de episódio da série O segredo delas. Na imagem, a atriz Zezé Motta sorri enquanto é entrevistada.",
          credito: "frame de video",
          origem: "Série “O segredo delas” estreia na Itaú Cultural Play",
        },
        selo: "tocar",
      },
      {
        id: "cast",
        rotulo: "Cast",
        descricao: "Podcasts e conversas do Itaú Cultural",
        href: "/cast",
        capa: {
          arquivo: "41307c2ff3e8a383.jpeg",
          // O letreiro «Mekukradjá» e o grafismo do IC ocupam o terço esquerdo
          // desta foto. Segurando à direita, o corte fica em Célia e o cartaz
          // deixa de ter dois títulos.
          foco: "direita",
          alt: "Célia Xakriabá é uma mulher indígena jovem. Ela usa cocar e segura um microfone.",
          credito: "Guilherme Castoldi",
          origem: "Célia Xakriabá – Mekukradjá",
        },
        selo: "ouvir",
      },
    ],
  },
  {
    id: "ir",
    rotulo: "Ir e ver",
    ritmo: "par",
    promocao: {
      rotulo: "Programação de inverno",
      descricao: "Shows, exposições e muito mais",
      href: "/acontece",
      chamada: "Explorar",
      fundo: "/hub/inverno.jpg",
    },
    apps: [
      {
        id: "acontece",
        rotulo: "Acontece",
        descricao: "A agenda, dia a dia",
        href: "/acontece",
        capa: {
          arquivo: "ed71328d4eadd832.jpeg",
          alt: "Parede com duas fileiras de cartazes coloridos de shows do Auditório Ibirapuera",
          credito: "Itaú Cultural",
          origem: "Auditório Ibirapuera (curadoria de hero, docs em src/dados/heroi.ts)",
        },
        selo: "agenda",
      },
      {
        id: "mapa",
        rotulo: "Mapa",
        descricao: "Onde a cultura está — e onde não está",
        href: "/mapa",
        capa: {
          arquivo: "934960fe5cd814d7.jpeg",
          alt: "A imagem mostra edifícios, telhados e casas. No centro da foto, há o desenho feito na lateral de um prédio.",
          credito: "Pri Barbosa",
          origem: "A arte visual e urbana cura a cidade em meio ao caos",
        },
        selo: "mapa",
      },
      {
        id: "museu",
        rotulo: "Museu virtual",
        descricao: "Exposições que continuam abertas",
        href: "/museu",
        capa: {
          arquivo: "9d6aae06dc62e35c.jpeg",
          alt: "Trata-se de um painel com quadrados e retângulos de tons diversos de azul e cinza.",
          credito: "Everton Ballardin",
          origem: "Recortes sobre Sandra Cinto",
        },
        selo: "entrar",
      },
    ],
  },
  {
    id: "ler",
    rotulo: "Ler",
    ritmo: "faixa",
    apps: [
      {
        id: "noticias",
        rotulo: "Notícias",
        descricao: "O que saiu hoje sobre cultura",
        href: "/noticias",
        capa: {
          arquivo: "ba73e8bf6017b82a.jpeg",
          alt: "Montagem colorida de duas fotos. Do lado esquerdo há uma mulher jovem encostada em um carro.",
          credito: "divulgação",
          origem: "Roteiristas de A Vida Invisível falam sobre o processo de adaptação",
        },
        selo: "entrar",
      },
      {
        id: "cursos",
        rotulo: "Cursos",
        descricao: "Formação aberta, on-line e presencial",
        href: "/cursos",
        capa: {
          arquivo: "30539015f18e9533.jpeg",
          alt: "A imagem traz Edinho Santos fazendo um sinal em libras. Ele é negro, tem barba e bigode.",
          credito: "Leonardo Rogério",
          origem: "Curso de extensão propõe reflexões sobre as culturas surdas",
        },
        selo: "entrar",
      },
    ],
  },
  {
    id: "descobrir",
    rotulo: "Descobrir e perguntar",
    ritmo: "lado",
    apps: [
      {
        id: "descobrir",
        rotulo: "Descobrir",
        descricao: "O feed que se explica",
        href: "/descobrir",
        capa: {
          arquivo: "8e3a4a31a4246c0b.jpeg",
          alt: "Cantora de vestido dourado ao microfone, iluminada de azul num palco",
          credito: "Agência Ophelia",
          origem: "curadoria de hero, docs em src/dados/heroi.ts",
        },
        selo: "entrar",
      },
      {
        id: "buscar",
        rotulo: "Buscar",
        descricao: "Atravessar as 7.810 entidades do acervo",
        href: "/buscar",
        capa: {
          arquivo: "08211344cfb3ec74.jpeg",
          alt: "A imagem dispõe em três colunas verticais as fotos de três Yanomami, dois homens nas pontas.",
          credito: "Iara Venanzi/Itaú Cultural",
          origem: "Artistas Mulheres Contemporâneas no Acervo: Claudia Andujar",
        },
        selo: "entrar",
      },
      {
        id: "ia",
        rotulo: "Roteiros com IA",
        descricao: "Descreva o programa e receba um roteiro",
        href: "/ia",
        capa: {
          arquivo: "6a769da06f5653fd.png",
          alt: "A imagem mostra um fundo em degradê suave, passando por tons de verde, amarelo, rosa, azul.",
          credito: "Itaú Cultural",
          origem: "Conheça o jogabulário da exposição Game+",
        },
        selo: "entrar",
      },
    ],
  },
];

/** Sua conta: o que você guardou e quem você é. Sem capa, de propósito. */
export const ATALHOS_CONTA: readonly Atalho[] = [
  { href: "/salvos", rotulo: "Salvos", descricao: "O que você guardou e os alertas" },
  { href: "/meu/repertorio", rotulo: "Meu repertório", descricao: "As linguagens que você atravessou" },
  { href: "/meu", rotulo: "Perfil", descricao: "Persona, disposições e preferências" },
];

/** Bastidor: só na visão web — no app cada uma destas rotas se declara «só web». */
export const ATALHOS_BASTIDOR: readonly Atalho[] = [
  { href: "/studio/duplicatas", rotulo: "Studio", descricao: "Publicar e deduplicar ocorrências" },
  { href: "/redacao/fila", rotulo: "Redação", descricao: "Fila editorial e trilhas autoradas" },
  { href: "/observatorio", rotulo: "Observatório", descricao: "Indicadores e procedência do acervo" },
  { href: "/roteiro", rotulo: "Roteiro guiado", descricao: "A demonstração passo a passo" },
];

/**
 * Quantos aplicativos o hub anuncia. Contado, nunca digitado.
 *
 * Os atalhos de conta saíram desta soma em 23/08, junto com a seção «Sua conta»:
 * eles deixaram o hub e foram para o menu do ícone de conta, no alto da tela. O
 * hub anuncia o que ele mostra.
 */
export const TOTAL_APPS =
  GRUPOS_APPS.reduce((n, g) => n + g.apps.length, 0) + ATALHOS_BASTIDOR.length;
