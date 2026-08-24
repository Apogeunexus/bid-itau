/**
 * exposicoes-permanentes.ts — as duas exposições permanentes da sede na Paulista.
 *
 * Não passam pelo grafo: o acervo trata «museu» como espaços citados na
 * Enciclopédia, e estes dois são a sede. Textos e fotos vêm das páginas
 * oficiais (itaucultural.org.br/espaco-olavo-setubal e ehp.itaucultural.org.br).
 * DP-F: módulo puro, sem fs e sem grafo — o cliente pode importar.
 */

export interface FotoDaExposicao {
  arquivo: string;
  alt: string;
  credito: string;
}

export interface VideoDaExposicao {
  id: string;
  titulo: string;
}

export interface TextoDaExposicao {
  titulo: string;
  autor?: string;
  cargo?: string;
  paragrafos: string[];
}

export interface PercursoDaExposicao {
  titulo: string;
  texto?: string;
  imagem: string;
  altImagem: string;
  creditoImagem: string;
}

export interface VisitaDaExposicao {
  endereco: string;
  andares: string;
  cidade: string;
  entrada: string;
}

export interface RelacionadoDaExposicao {
  titulo: string;
  rota: string;
  rotulo: string;
}

export interface ExposicaoPermanente {
  slug: string;
  titulo: string;
  subtitulo: string;
  kicker: string;
  lead: string;
  rota: string;
  imagem: string;
  altImagem: string;
  creditoImagem: string;
  visita: VisitaDaExposicao;
  videos: VideoDaExposicao[];
  galeria: FotoDaExposicao[];
  textos: TextoDaExposicao[];
  percursos: PercursoDaExposicao[];
}

const PASTA = "/exposicoes";

export const EXPOSICOES_PERMANENTES: readonly ExposicaoPermanente[] = [
  {
    slug: "espaco-olavo-setubal",
    titulo: "Espaço Olavo Setubal",
    subtitulo: "Coleção Brasiliana Itaú",
    kicker: "Exposição permanente",
    lead: "A exposição permanente foi inaugurada em 2014, no Itaú Cultural, e reúne obras de duas coleções específicas do maior acervo de arte de uma companhia privada da América Latina: Brasiliana Itaú e Itaú Numismática.",
    rota: "/museu/espaco-olavo-setubal/",
    imagem: `${PASTA}/eos-hero.jpg`,
    altImagem: "Vista do módulo O Brasil da Capital, no Espaço Olavo Setubal.",
    creditoImagem: "Edouard Fraipont",
    visita: {
      endereco: "Avenida Paulista, 149",
      andares: "4º e 5º andares",
      cidade: "São Paulo, SP",
      entrada: "Gratuita",
    },
    videos: [
      {
        id: "U15YWDfiDAw",
        titulo: "Espaço Olavo Setubal — Coleção Brasiliana Itaú (2014) — teaser 1/3",
      },
      {
        id: "0qKWI358vRg",
        titulo: "Espaço Olavo Setubal — Coleção Brasiliana Itaú (2014) — teaser 2/3",
      },
      {
        id: "Fafc94UqUBE",
        titulo: "Espaço Olavo Setubal — Coleção Brasiliana Itaú (2014) — teaser 3/3",
      },
    ],
    galeria: [
      {
        arquivo: `${PASTA}/eos-galeria-01.jpg`,
        alt: "Vista do módulo O Brasil das Províncias, no Espaço Olavo Setubal.",
        credito: "Edouard Fraipont",
      },
      {
        arquivo: `${PASTA}/eos-galeria-02.jpg`,
        alt: "Vitrine do módulo O Brasil do Império, no Espaço Olavo Setubal.",
        credito: "André Seiti",
      },
      {
        arquivo: `${PASTA}/eos-galeria-03.jpg`,
        alt: "Vista do módulo O Brasil desconhecido, no Espaço Olavo Setubal.",
        credito: "Edouard Fraipont",
      },
      {
        arquivo: `${PASTA}/eos-galeria-04.jpg`,
        alt: "Vista do módulo O Brasil dos naturalistas, no Espaço Olavo Setubal.",
        credito: "Matheus Castro",
      },
      {
        arquivo: `${PASTA}/eos-galeria-05.jpg`,
        alt: "Vista do módulo O Brasil secreto, no Espaço Olavo Setubal.",
        credito: "Edouard Fraipont",
      },
      {
        arquivo: `${PASTA}/eos-galeria-06.jpg`,
        alt: "Vista do módulo O Brasil holandês, no Espaço Olavo Setubal.",
        credito: "Edouard Fraipont",
      },
      {
        arquivo: `${PASTA}/eos-galeria-07.jpg`,
        alt: "Vista do módulo O Brasil do Império, no Espaço Olavo Setubal.",
        credito: "Matheus Castro",
      },
      {
        arquivo: `${PASTA}/eos-galeria-08.jpg`,
        alt: "Vista do módulo O Brasil da escravidão, no Espaço Olavo Setubal.",
        credito: "Matheus Castro",
      },
      {
        arquivo: `${PASTA}/eos-galeria-09.jpg`,
        alt: "Vista do módulo O Brasil dos brasileiros, no Espaço Olavo Setubal.",
        credito: "Matheus Castro",
      },
    ],
    textos: [
      {
        titulo: "O espaço",
        paragrafos: [
          "Ocupando dois andares do Itaú Cultural, em São Paulo, SP, em um total de 514 metros quadrados, o Espaço Olavo Setubal foi inaugurado em dezembro de 2014. A exposição permanente reúne obras de duas coleções específicas do maior acervo de arte de uma companhia privada da América Latina: Brasiliana Itaú e Itaú Numismática.",
          "Organizado pela equipe do Itaú Cultural, em uma longa pesquisa que começou em 2009, o percurso revela cinco séculos da história do Brasil, com o objetivo de dividir com o maior número de pessoas esse importante acervo.",
          "Parte das duas coleções está intercalada no espaço, de acordo com o período histórico. São nove módulos, cada um com um tema, reunindo 1.364 obras. Da Brasiliana Itaú o público poderá ver 969 itens, entre pinturas (12), tridimensionais (16), desenhos, aquarelas e têmperas (30), gravuras (693), mapas/cartografia (16), manuscritos de literatura (7), documentos (76), periódicos (5), livros (98) e caricaturas (96).",
          "Já da coleção Itaú Numismática o Espaço Olavo Setubal apresenta 395 peças, entre moedas (281), medalhas (96), condecorações (10), barras de ouro (6) e objetos (2).",
        ],
      },
    ],
    percursos: [
      {
        titulo: "O Brasil desconhecido",
        texto:
          "Foi pelo litoral que o atual território brasileiro começou a ser descoberto por navegadores europeus. Durante o primeiro século, pouco se explorou o interior. O Mapa do Almirante, de 1522, delineia apenas parte da costa e chama o país de Terra Nova ou Terra dos Papagaios.",
        imagem: `${PASTA}/eos-modulo-01.jpg`,
        altImagem: "Moeda de ouro conhecida como O Português, cunhada em 1499.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "O Brasil holandês",
        texto:
          "Os oito anos passados por Maurício de Nassau no Nordeste valeram ao Brasil o precioso legado dos jovens cientistas e artistas da comitiva holandesa. Neste módulo, destaca-se o quadro a óleo de Frans Post Povoado numa Planície Arborizada, peça inaugural da Coleção Brasiliana Itaú.",
        imagem: `${PASTA}/eos-modulo-02.jpg`,
        altImagem: "Moedas de ouro obsidionais holandesas batidas no Recife, módulo O Brasil holandês.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "O Brasil secreto",
        texto:
          "Após derrotar o invasor holandês, o governo de Portugal fechou o país aos visitantes estrangeiros por mais de 150 anos. A preocupação em manter o Brasil secreto aumentou após a descoberta de enormes jazidas de ouro e diamantes, por volta de 1700, em Minas Gerais.",
        imagem: `${PASTA}/eos-modulo-03.jpg`,
        altImagem: "Peça do módulo O Brasil secreto, no Espaço Olavo Setubal.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "O Brasil dos naturalistas",
        texto:
          "Com a chegada da família real e a abertura dos portos, em 1808, o país foi finalmente revelado ao mundo e, nas décadas seguintes, recebeu centenas de artistas e cientistas determinados em registrar o território, seus costumes, sua flora e sua fauna.",
        imagem: `${PASTA}/eos-modulo-04.jpg`,
        altImagem: "Peça do módulo O Brasil dos naturalistas, no Espaço Olavo Setubal.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "O Brasil da capital",
        texto:
          "Foco da atenção dos artistas viajantes, o Rio de Janeiro possui rica iconografia que retrata a variedade da vegetação, do mar e da topografia da segunda capital do Brasil. Destaca-se a aquarela Panorama de la Baie de Rio-Janeiro, de E. E. Vidal, por sua dimensão e qualidade.",
        imagem: `${PASTA}/eos-modulo-05.jpg`,
        altImagem: "Peça do módulo O Brasil da capital, no Espaço Olavo Setubal.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "O Brasil das províncias",
        texto:
          "Menos retratadas que a capital, as diferentes regiões do Brasil foram às vezes documentadas por artistas viajantes. Encomendada pelo imperador D. Pedro I, Panorama da Cidade de São Paulo, do francês A. J. Pallière, é considerada a obra mais importante da iconografia paulistana anterior à fotografia.",
        imagem: `${PASTA}/eos-modulo-06.jpg`,
        altImagem: "Peça do módulo O Brasil das províncias, no Espaço Olavo Setubal.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "O Brasil do império",
        texto:
          "A família real, depois imperial, foi amplamente retratada e desempenhou papel fundamental no desenrolar da arte no Brasil. Pintor da corte, Debret presenciou e registrou a cerimônia de casamento de D. Pedro I com sua segunda mulher, D. Amélia.",
        imagem: `${PASTA}/eos-modulo-07.jpg`,
        altImagem: "Peça do módulo O Brasil do império, no Espaço Olavo Setubal.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "O Brasil da escravidão",
        texto:
          "Capítulo tenebroso e determinante da história brasileira, a escravidão foi retratada por uma série de artistas viajantes. O inglês Henry Chamberlain visitou o Rio de Janeiro em 1817 e, cinco anos depois, lançou em Londres a primeira coleção de gravuras focada na mão de obra escrava.",
        imagem: `${PASTA}/eos-modulo-08.jpg`,
        altImagem: "Peça do módulo O Brasil da escravidão, no Espaço Olavo Setubal.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "O Brasil dos brasileiros",
        texto:
          "O Brasil chega ao século XX. Enquanto a república se consolida, a cultura nacional se reconhece — seja questionando a tradição e absorvendo elementos estrangeiros, como fez o modernista Oswald de Andrade na coletânea de poemas Pau Brasil, de 1925, seja compondo crônicas visuais focadas nos tipos da cidade e no meio político.",
        imagem: `${PASTA}/eos-modulo-09.jpg`,
        altImagem: "Peça do módulo O Brasil dos brasileiros, no Espaço Olavo Setubal.",
        creditoImagem: "Itaú Cultural",
      },
    ],
  },
  {
    slug: "espaco-herculano-pires",
    titulo: "Espaço Herculano Pires",
    subtitulo: "Arte no dinheiro",
    kicker: "Exposição permanente",
    lead: "A trajetória das moedas, das medalhas, das cédulas e dos selos nacionais revela muito das nossas identidades. Revisitando o acervo da Coleção Numismática — iniciada por Herculano Pires —, o Itaú Cultural convida o público a examinar o passado a partir de um pensamento crítico e criativo.",
    rota: "/museu/espaco-herculano-pires/",
    imagem: `${PASTA}/ehp-hero.jpg`,
    altImagem:
      "Salão de exposição com paredes, chão e teto brancos e um puff cinza ao centro; ao fundo, uma placa com textos e fotos sobre a exposição Espaço Herculano Pires — Arte no dinheiro.",
    creditoImagem: "Itaú Cultural",
    visita: {
      endereco: "Avenida Paulista, 149",
      andares: "6º andar",
      cidade: "São Paulo, SP",
      entrada: "Gratuita",
    },
    videos: [
      {
        id: "wohcfW59Feo",
        titulo: "Espaço Herculano Pires — entrevistas Anna Helena Altenfelder e Alfredo Gallas",
      },
      {
        id: "I65JIl1Nqos",
        titulo: "Cinco atividades interativas no Espaço Herculano Pires",
      },
    ],
    galeria: [
      {
        arquivo: `${PASTA}/ehp-galeria-01.jpg`,
        alt: "Sala de obras de arte contemporânea no Espaço Herculano Pires.",
        credito: "Itaú Cultural",
      },
      {
        arquivo: `${PASTA}/ehp-galeria-02.jpg`,
        alt: "Área de interatividades do Espaço Herculano Pires.",
        credito: "Itaú Cultural",
      },
      {
        arquivo: `${PASTA}/ehp-galeria-03.jpg`,
        alt: "Sala quem somos, no Espaço Herculano Pires.",
        credito: "Itaú Cultural",
      },
    ],
    textos: [
      {
        titulo: "Para pensar os Brasis",
        autor: "Alfredo Setubal",
        cargo: "Presidente do Itaú Cultural",
        paragrafos: [
          "A memória é uma chave imprescindível para entender quem somos, onde estamos e, assim, abrir as portas para refletirmos sobre o passado e os futuros possíveis. A trajetória das moedas, das medalhas, das cédulas e dos selos nacionais revela muito das nossas identidades. Reconhecendo essa premissa e revisitando o acervo da Coleção Numismática — iniciada por Herculano Pires —, o Itaú Cultural (IC) convida o público a examinar o passado a partir de um pensamento crítico e criativo, valorizando o que a arte acrescenta à nossa percepção.",
          "A mostra é composta de conteúdos diversos, por meio dos quais os visitantes poderão (re)conhecer a história do Brasil, plural, complexa e diversa, observando os grupos e os pensamentos que nos constituíram como país. Com um recorte cronológico, o material exposto percorre a trajetória histórica desde a chegada dos colonizadores e a presença dos povos originários até os tempos atuais, acompanhado de textos descritivos e analíticos que situam esse passado numa perspectiva atual.",
          "O acervo é complementado por outros trabalhos artísticos contemporâneos que estabelecem múltiplas narrativas e leituras sobre o diálogo, a crítica e a intervenção no dinheiro, apresentando outros olhares, oxigenando conceitos e tradições. Um trajeto que possibilita o acesso a várias histórias que formaram a narrativa de nação e outras que, por muitas vezes, estiveram ocultas, mas aqui se fazem presentes.",
          "Há ainda o uso de recursos tecnológicos, como a ampliação visual para observar detalhes das peças e jogos para uma experiência mais interativa.",
          "A Coleção Numismática faz parte do acervo do Itaú Unibanco, composto de várias coleções — incluindo a Brasiliana, aberta para visitação neste mesmo prédio. Agora, as moedas e as medalhas têm esse espaço para descobertas. Além disso, a exposição presta homenagem a Herculano Pires, que se dedicou e contribuiu para preservar parte da memória do país.",
          "Boa visita. E boa viagem a esses muitos Brasis!",
        ],
      },
      {
        titulo: "Muitas histórias, muitos olhares",
        autor: "Vagner Porto",
        cargo: "Curador",
        paragrafos: [
          "Esta exposição apresenta uma notável coleção de moedas, medalhas, condecorações e selos em uma perspectiva atual e dinâmica, que narra muitas histórias sob os mais diferentes olhares, tendo em conta principalmente as imagens gravadas, o formato e o metal ou o papel dos objetos, assim como as suas inscrições.",
          "O olhar atento do visitante encontrará temas importantes da sociedade contemporânea, como a negritude e sua invisibilidade histórica, a necessária representação das mulheres e a noção de valor entre os povos originários. Além dos temas clássicos da numismática brasileira, como a invasão holandesa, são apresentados aspectos técnicos da cunhagem (o ato de converter o metal em moeda), a produção das diferentes formas de governo e as moedas brasileiras de circulação exclusiva no continente africano.",
          "Pode-se perceber o enaltecer dos famosos dobrões, das longevas patacas e das deslumbrantes condecorações da Ordem da Rosa e da Ordem Imperial do Cruzeiro — para saber o que significa cada uma dessas moedas e medalhas, basta seguir a exposição. E há, ainda, a mais importante moeda brasileira, a Peça da Coroação.",
          "O resultado é uma história mais brasileira, mais plural, que busca respeitar os grupos sociais que contribuíram para a nossa formação política, econômica e cultural, e que ressurgem a cada novo olhar, a cada novo deslumbramento.",
        ],
      },
    ],
    percursos: [
      {
        titulo: "Quem falta no dinheiro?",
        imagem: `${PASTA}/ehp-secao-01.jpg`,
        altImagem: "Seção Quem falta no dinheiro?, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "Revisitar desde o início",
        imagem: `${PASTA}/ehp-secao-02.jpg`,
        altImagem: "Seção Revisitar desde o início, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "Em diálogo com a arte",
        imagem: `${PASTA}/ehp-secao-03.jpg`,
        altImagem: "Seção Em diálogo com a arte, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "Dicionário numismático",
        imagem: `${PASTA}/ehp-secao-04.jpg`,
        altImagem: "Seção Dicionário numismático, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "Preciosidade e independência",
        imagem: `${PASTA}/ehp-secao-05.jpg`,
        altImagem: "Seção Preciosidade e independência, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "Por onde circulam",
        imagem: `${PASTA}/ehp-secao-06.jpg`,
        altImagem: "Seção Por onde circulam, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "As faces da República",
        imagem: `${PASTA}/ehp-secao-07.jpg`,
        altImagem: "Seção As faces da República, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "Livros raros",
        imagem: `${PASTA}/ehp-secao-08.jpg`,
        altImagem: "Seção Livros raros, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "Os selos do Brasil",
        imagem: `${PASTA}/ehp-secao-09.jpg`,
        altImagem: "Seção Os selos do Brasil, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
      {
        titulo: "O gabinete do colecionador",
        imagem: `${PASTA}/ehp-secao-10.jpg`,
        altImagem: "Seção O gabinete do colecionador, no Espaço Herculano Pires.",
        creditoImagem: "Itaú Cultural",
      },
    ],
  },
];

export const TOTAL_DE_PERMANENTES = 2;

export function exposicaoPorSlug(slug: string): ExposicaoPermanente | null {
  let chave = slug;
  try {
    chave = decodeURIComponent(slug);
  } catch (erro) {
    if (!(erro instanceof URIError)) throw erro;
  }
  return EXPOSICOES_PERMANENTES.find((e) => e.slug === chave) ?? null;
}

export function irmaDaExposicao(slug: string): ExposicaoPermanente | null {
  return EXPOSICOES_PERMANENTES.find((e) => e.slug !== slug) ?? null;
}
