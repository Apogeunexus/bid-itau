/**
 * comunidade.ts — as duas camadas de comunidade, e a amarra que segura a segunda.
 *
 * CAMADA 1 — a comunidade do Itaú Cultural. Uma só, oficial, onde o IC publica e
 * o público responde. É a que existe hoje na aplicação de origem, sem mudança.
 *
 * CAMADA 2 — o marketplace de comunidades de produtores e organizações. E aqui
 * está a decisão que segura o arquivo inteiro: NENHUMA COMUNIDADE É INVENTADA.
 * Cada uma tem `entidadeId` apontando para uma instituição ou coletivo que o
 * acervo já reconhece, com id canônico, slug navegável e fonte na Enciclopédia.
 * Uma lista de nomes fabricados ao lado de um acervo com procedência seria a
 * única coisa capaz de desmontar o argumento da proposta.
 *
 * POR QUE ESTAS DEZESSETE. Não por gosto: são as entidades que declaram
 * território no acervo, uma por unidade da federação — e é essa distribuição que
 * transforma o marketplace num argumento em vez de uma vitrine. O acervo tem
 * instituição ou coletivo em 19 UFs; São Paulo e Rio somam 140 das 220. As que
 * estão aqui são as OUTRAS 17, de propósito: o marketplace é onde o mapa de
 * desertos culturais deixa de ser diagnóstico e vira porta.
 *
 * DP-F: literais tipados, sem alcançar `grafo.ts`. Os ids e slugs foram MEDIDOS
 * contra `dados/gerado/entidades.json`, não escritos de memória.
 */

import type {
  ComunidadeDefinida,
  PessoaDaComunidade,
  PublicacaoDefinida,
} from "@/lib/pontos/tipos";

/* ── As comunidades ──────────────────────────────────────────────────────── */

export const COMUNIDADE_OFICIAL = "ic";

export const COMUNIDADES: ComunidadeDefinida[] = [
  {
    id: COMUNIDADE_OFICIAL,
    entidadeId: null,
    nome: "Itaú Cultural",
    descricao: "A comunidade da casa: programação, bastidores e o que está sendo pensado.",
    natureza: "oficial",
    linguagens: [],
    assinantes: 48210,
  },

  {
    id: "c-bro-mcs",
    entidadeId: "coletivo:enc:80580",
    nome: "Brô MC's",
    descricao: "Rap em guarani-kaiowá, de Dourados. O primeiro grupo de rap indígena do país.",
    natureza: "coletivo",
    uf: "MS",
    linguagens: ["musica"],
    assinantes: 3120,
  },
  {
    id: "c-teatro-amazonas",
    entidadeId: "instituicao:enc:70692",
    nome: "Teatro Amazonas",
    descricao: "Ópera, concerto e temporada no casarão de Manaus.",
    natureza: "instituicao",
    uf: "AM",
    linguagens: ["musica", "teatro"],
    assinantes: 9840,
  },
  {
    id: "c-bordadeiras",
    entidadeId: "coletivo:enc:194263",
    nome: "Bordadeiras do Curtume",
    descricao: "Bordado narrativo em Jenipapo de Minas, no Vale do Jequitinhonha.",
    natureza: "coletivo",
    uf: "MG",
    linguagens: ["artes-visuais"],
    assinantes: 1470,
  },
  {
    id: "c-itamatatiua",
    entidadeId: "coletivo:enc:196461",
    nome: "Ceramistas de Itamatatiua",
    descricao: "Cerâmica quilombola em Alcântara, feita por mulheres há mais de três séculos.",
    natureza: "coletivo",
    uf: "MA",
    linguagens: ["artes-visuais"],
    assinantes: 980,
  },
  {
    id: "c-rendeiras-cariri",
    entidadeId: "coletivo:enc:81449",
    nome: "Rendeiras de Bilro do Cariri",
    descricao: "Renda de bilro em Santana do Cariri, no sopé da Chapada do Araripe.",
    natureza: "coletivo",
    uf: "CE",
    linguagens: ["artes-visuais"],
    assinantes: 1130,
  },
  {
    id: "c-caixa-belem",
    entidadeId: "instituicao:enc:196649",
    nome: "Caixa Cultural Belém",
    descricao: "Exposição, cinema e formação no centro histórico de Belém.",
    natureza: "instituicao",
    uf: "PA",
    linguagens: ["artes-visuais"],
    assinantes: 6210,
  },
  {
    id: "c-coletivo-bispo",
    entidadeId: "coletivo:enc:194646",
    nome: "Coletivo Bispo",
    descricao: "Teatro de pesquisa em Salvador.",
    natureza: "coletivo",
    uf: "BA",
    linguagens: ["teatro"],
    assinantes: 2340,
  },
  {
    id: "c-brigada-henfil",
    entidadeId: "coletivo:enc:195562",
    nome: "Brigada Henfil",
    descricao: "Muralismo e gravura em Recife.",
    natureza: "coletivo",
    uf: "PE",
    linguagens: ["artes-visuais"],
    assinantes: 2890,
  },
  {
    id: "c-basirah",
    entidadeId: "coletivo:enc:80658",
    nome: "BaSiraH",
    descricao: "Núcleo de dança contemporânea de Brasília.",
    natureza: "coletivo",
    uf: "DF",
    linguagens: ["danca"],
    assinantes: 1760,
  },
  {
    id: "c-armazem",
    entidadeId: "coletivo:enc:80348",
    nome: "Armazém Companhia de Teatro",
    descricao: "Companhia de repertório, com sede no Paraná.",
    natureza: "coletivo",
    uf: "PR",
    linguagens: ["teatro"],
    assinantes: 4020,
  },
  {
    id: "c-caixa-do-elefante",
    entidadeId: "coletivo:enc:80898",
    nome: "Caixa do Elefante",
    descricao: "Teatro de bonecos em Porto Alegre, para adulto e para criança.",
    natureza: "coletivo",
    uf: "RS",
    linguagens: ["teatro"],
    assinantes: 3410,
  },
  {
    id: "c-artmosfera",
    entidadeId: "coletivo:enc:195566",
    nome: "Artmosfera",
    descricao: "Arte urbana em Santa Catarina.",
    natureza: "coletivo",
    uf: "SC",
    linguagens: ["artes-visuais"],
    assinantes: 1520,
  },
  {
    id: "c-a-cena",
    entidadeId: "coletivo:enc:80675",
    nome: "A Cena",
    descricao: "Dança contemporânea na Paraíba.",
    natureza: "coletivo",
    uf: "PB",
    linguagens: ["danca"],
    assinantes: 890,
  },
  {
    id: "c-atelie-gravura",
    entidadeId: "coletivo:enc:80827",
    nome: "Ateliê Livre de Gravura",
    descricao: "Gravura de acesso aberto em Goiânia.",
    natureza: "coletivo",
    uf: "GO",
    linguagens: ["artes-visuais"],
    assinantes: 1240,
  },
  {
    id: "c-bonobando",
    entidadeId: "coletivo:enc:81501",
    nome: "Coletivo Bonobando",
    descricao: "Criação coletiva no Acre.",
    natureza: "coletivo",
    uf: "AC",
    linguagens: ["artes-visuais"],
    assinantes: 640,
  },
  {
    id: "c-cine-falcatrua",
    entidadeId: "coletivo:enc:80555",
    nome: "Cine Falcatrua",
    descricao: "Cinema de exibição livre no Espírito Santo.",
    natureza: "coletivo",
    uf: "ES",
    linguagens: ["arte-e-tecnologia", "artes-visuais"],
    assinantes: 1980,
  },
  {
    id: "c-o-imaginario",
    entidadeId: "coletivo:enc:80694",
    nome: "Associação Cultural O Imaginário",
    descricao: "Teatro e formação em Rondônia.",
    natureza: "coletivo",
    uf: "RO",
    linguagens: ["teatro"],
    assinantes: 720,
  },
];

const POR_ID = new Map(COMUNIDADES.map((c) => [c.id, c]));

export function comunidadePorId(id: string): ComunidadeDefinida | undefined {
  return POR_ID.get(id);
}

/** As do marketplace — tudo menos a oficial. */
export function comunidadesDoMarketplace(): ComunidadeDefinida[] {
  return COMUNIDADES.filter((c) => c.natureza !== "oficial");
}

/**
 * Agrupa por UF, da que tem mais para a que tem menos. O marketplace ordena por
 * TERRITÓRIO e não por número de assinantes de propósito: ordenar por tamanho
 * empurraria as comunidades pequenas — que são justamente as dos territórios com
 * menos acervo — para o fim de uma lista que ninguém rola até o fim.
 */
export function comunidadesPorUf(): { uf: string; comunidades: ComunidadeDefinida[] }[] {
  const mapa = new Map<string, ComunidadeDefinida[]>();
  for (const c of comunidadesDoMarketplace()) {
    if (!c.uf) continue;
    const lista = mapa.get(c.uf) ?? [];
    lista.push(c);
    mapa.set(c.uf, lista);
  }
  return [...mapa.entries()]
    .map(([uf, comunidades]) => ({ uf, comunidades }))
    .sort((a, b) => a.uf.localeCompare(b.uf, "pt-BR"));
}

/* ── As pessoas ──────────────────────────────────────────────────────────── */

/**
 * Avatar é MONOGRAMA, nunca foto. Não temos foto de nenhuma pessoa real e gerar
 * uma seria inventar rosto — a mesma linha que o projeto já se recusou a cruzar
 * ao não autorar elenco. Nomes de demonstração, marcados como tal.
 */
export const PESSOAS: PessoaDaComunidade[] = [
  { id: "eu", nome: "Você", monograma: "VC", cidade: "São Paulo", uf: "SP" },
  { id: "p-ic", nome: "Itaú Cultural", monograma: "IC", cidade: "São Paulo", uf: "SP" },
  { id: "p-maria", nome: "Maria Andrade", monograma: "MA", cidade: "Recife", uf: "PE" },
  { id: "p-carlos", nome: "Carlos Ribeiro", monograma: "CR", cidade: "Belo Horizonte", uf: "MG" },
  { id: "p-joana", nome: "Joana Lima", monograma: "JL", cidade: "Belém", uf: "PA" },
  { id: "p-rita", nome: "Rita Nascimento", monograma: "RN", cidade: "Salvador", uf: "BA" },
  { id: "p-tiago", nome: "Tiago Moraes", monograma: "TM", cidade: "Porto Alegre", uf: "RS" },
];

const PESSOA_POR_ID = new Map(PESSOAS.map((p) => [p.id, p]));

export function pessoaPorId(id: string): PessoaDaComunidade | undefined {
  return PESSOA_POR_ID.get(id);
}

/* ── O feed inicial ──────────────────────────────────────────────────────── */

/**
 * TODA PUBLICAÇÃO TEM CAPA, e ela vem do acervo com o alt e o crédito do CMS. A
 * aplicação de origem desenhava uma cena SVG à mão quando faltava foto; aqui há
 * 1.920 capas reais com autoria declarada, e usar uma delas custa menos que
 * inventar uma.
 */
export const PUBLICACOES: PublicacaoDefinida[] = [
  {
    id: "pub-ic-1",
    comunidadeId: COMUNIDADE_OFICIAL,
    autorId: "p-ic",
    titulo: "A temporada Travessias começou",
    corpo:
      "Durante 18 dias, tudo que estiver fora do seu repertório vale mais. Quem nunca ouviu um disco de música do Norte, quem nunca leu sobre gravura, quem nunca foi a um espetáculo de dança: é agora que compensa.",
    etiqueta: "Temporada",
    imagem: "/acervo/b7356adde1e249a7.jpeg",
    imagemAlt: "O auditório do Itaú Cultural visto do alto. No telão atrás do palco, está escrito Caminhada Rumos. No palco há duas pessoas sob a luz e a plateia está cheia e pouco iluminada.",
    imagemCredito: "Itaú Cultural",
    reacoes: 412,
    comentarios: [
      {
        autorId: "p-carlos",
        corpo: "Já fui atrás de teatro de bonecos por causa disso. Não sabia que existia companhia disso no Sul.",
        reacoes: 34,
        quandoRotulo: "2d",
        respostas: [
          {
            autorId: "p-ic",
            corpo: "Caixa do Elefante, em Porto Alegre. Está no marketplace de comunidades.",
            reacoes: 12,
            quandoRotulo: "2d",
          },
        ],
      },
    ],
    diasAtras: 3,
    oficial: true,
  },
  {
    id: "pub-ic-2",
    comunidadeId: COMUNIDADE_OFICIAL,
    autorId: "p-ic",
    titulo: "Qual linguagem você quer atravessar nesta temporada?",
    corpo: "A gente monta uma trilha com a mais votada.",
    etiqueta: "Enquete",
    imagem: "/acervo/62aa3a29b29496ce.jpeg",
    imagemAlt: "Um grupo de dançarinos vestido de preto estou junto no fundo do palco, que é iluminado de amarelo. Um dançarino está em primeiro plano, em um salto, sob luz vermelha e com imagem desfocada pelo movimento.",
    imagemCredito: "José Luiz Pederneiras",
    reacoes: 188,
    comentarios: [],
    diasAtras: 1,
    oficial: true,
    enquete: {
      opcoes: [
        { rotulo: "Dança", pct: 31 },
        { rotulo: "Literatura", pct: 27 },
        { rotulo: "Cultura popular", pct: 24 },
        { rotulo: "Arte e tecnologia", pct: 18 },
      ],
    },
  },
  {
    id: "pub-maria-1",
    comunidadeId: COMUNIDADE_OFICIAL,
    autorId: "p-maria",
    titulo: "Fui ver o mural da Brigada Henfil",
    corpo:
      "Passei três anos andando por essa rua sem saber que aquilo tinha nome, coletivo e história. Segui a comunidade deles aqui.",
    imagem: "/acervo/a2505a8218c98f69.jpeg",
    imagemAlt: "Fotografia da fachada do Itaú Cultural com uma intervenção de arte urbana. Em primeiro plano, um banco de concreto e uma mureta lateral foram pintados com fundo azul-claro e flores de pétalas rosadas. No canto direito da mureta, uma mão realista segura um galho verde.",
    imagemCredito: "agência ophelia",
    reacoes: 96,
    comentarios: [
      {
        autorId: "p-rita",
        corpo: "Tem um trabalho deles no Recife Antigo também, vale a caminhada.",
        reacoes: 18,
        quandoRotulo: "5h",
      },
    ],
    diasAtras: 2,
  },
  {
    id: "pub-joana-1",
    comunidadeId: "c-caixa-belem",
    autorId: "p-joana",
    titulo: "A mostra de Belém tem sessão com audiodescrição",
    corpo:
      "Levei minha mãe, que enxerga pouco. Foi a primeira vez que ela saiu de uma exposição falando do que viu em vez de perguntar o que era.",
    imagem: "/acervo/7c8650657e847c65.jpeg",
    imagemAlt: "Vemos a baía de Belém de longe. Há embarcações no mar e o Sol dá uma cor laranja à água. No horizonte, são visíveis várias casas coloridas a, ao centro, a igreja.",
    imagemCredito: "Imagem: Edouard Fraipont/Itaú Cultural",
    reacoes: 231,
    comentarios: [],
    diasAtras: 4,
  },
  {
    id: "pub-tiago-1",
    comunidadeId: "c-caixa-do-elefante",
    autorId: "p-tiago",
    titulo: "Ensaio aberto na quinta",
    corpo: "Vamos abrir a montagem nova para vinte pessoas. Quem estiver em Porto Alegre, apareça.",
    imagem: "/acervo/839992165fd4ea29.jpeg",
    imagemAlt: "Vista ampla de um palco de teatro em penumbra. Três silhuetas humanas aparecem em destaque contra uma luz intensa que emana do centro do palco, criando feixes de luz que cortam o ambiente. No centro, há um pedestal ou instrumento. As figuras estão em movimento, sugerindo uma performance. Na parte inferior da imagem, vê-se a silhueta das cabeças da plateia, indicando que o ponto de vista é do público. A atmosfera é misteriosa, dramática e teatral, com forte contraste entre a luz intensa de fundo e as sombras das figuras.",
    imagemCredito: "Thelma Vidales",
    reacoes: 74,
    comentarios: [],
    diasAtras: 1,
  },
];
