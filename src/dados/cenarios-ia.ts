/**
 * cenarios-ia.ts — os três cenários do briefing como pergunta e resposta, para a
 * demonstração ao vivo.
 *
 * POR QUE RESPOSTA ESCRITA E NÃO MODELO. O protótipo não chama modelo nenhum, e isso é
 * decisão declarada (D-15): a IA do produto SUGERE e quem assina é humano. Numa
 * demonstração de uma hora, chamar um modelo é apostar a cena mais importante da
 * apresentação numa chamada de rede que pode demorar, variar ou cair — e a banca não
 * conseguiria distinguir a proposta do produto do humor do modelo naquele dia.
 *
 * Então a resposta é ESCRITA, e a tela diz que é. O que ela demonstra não é a geração de
 * texto: é a FORMA da resposta que este produto se compromete a dar — o que foi entendido,
 * que critério saiu daí, o que ficou de fora e por quê, e os eventos reais do grafo que
 * atendem. Essa forma é a promessa contratual; trocar a redação por um modelo depois não
 * muda nenhuma linha da tela.
 *
 * AS TRÊS PERGUNTAS SÃO AS DO BRIEFING, palavra por palavra onde ele as escreveu:
 * Maria que nunca foi ao teatro, Carlos com quatro dias em Belém, e a frase «quero algo
 * parecido com a Bienal, gratuito e perto de mim».
 *
 * OS EVENTOS CITADOS SÃO REAIS e estão no grafo — raspados do Theatro Municipal, da Casa
 * das Rosas e do MASP. Nenhuma resposta inventa programação: se o slug some do grafo, o
 * cartão some da resposta, e a verificação pega.
 */

export interface CriterioLido {
  /** O que a plataforma entendeu, em uma palavra: «linguagem», «território», «preço». */
  campo: string;
  /** O valor entendido. */
  valor: string;
  /** O trecho literal da pergunta que produziu este critério. */
  daFrase: string;
}

export interface SugestaoDoCenario {
  /** Slug do evento no grafo. A resposta não cita o que não existe. */
  slug: string;
  /** Por que ESTE evento, nesta resposta, para esta pessoa. */
  porque: string;
}

export interface PassoDaJornada {
  /** A tela, com o nome que ela tem no produto. */
  tela: string;
  /** A rota real — a jornada é clicável, não ilustrada. */
  rota: string;
  /** O que acontece ali, e o que aquele passo resolve. */
  oQueAcontece: string;
}

export interface CenarioDeIA {
  id: string;
  /** A persona do briefing a que este cenário pertence. */
  persona: string;
  /** A pergunta como a pessoa a escreveria. */
  prompt: string;
  /** A abertura da resposta — o que foi entendido, em uma frase. */
  entendi: string;
  /** Os critérios extraídos, cada um amarrado ao trecho que o produziu. */
  criterios: CriterioLido[];
  /** Os eventos sugeridos, com o motivo de cada um. */
  sugestoes: SugestaoDoCenario[];
  /**
   * A JORNADA INTEIRA, quando o cenário a pede. O briefing não pergunta «o que você
   * recomenda para a Maria»: pergunta «como ela DESCOBRE sua primeira experiência teatral —
   * apresente toda a jornada». Uma lista de sugestões responde a pergunta errada.
   */
  jornada?: PassoDaJornada[];
  /**
   * O QUE A RESPOSTA NÃO SUSTENTA. Toda tela deste protótipo declara o próprio limite, e
   * a da IA mais que as outras: é a que mais parece saber coisas.
   */
  naoSustenta: string;
}

export const CENARIOS_DE_IA: readonly CenarioDeIA[] = [
  {
    id: "maria-primeira-vez",
    persona: "Maria, 27 anos",
    /**
     * ELA NÃO DECLARA GOSTO NENHUM, E ISSO NÃO É DESCUIDO — é o cenário.
     *
     * A primeira redação fazia Maria dizer «curto rap e slam». Rap e slam saem do NOSSO
     * PRD (§9), que propôs a cadeia rap → poesia falada → teatro; o briefing não diz uma
     * palavra sobre o que ela ouve. Pôr um gosto na boca dela resolvia o problema difícil
     * por decreto: com o repertório declarado, recomendar vira busca, e o princípio nº 1 do
     * briefing — «descoberta antes de busca» — deixa de ser testado.
     *
     * Então ela chega como o briefing a descreve: 27 anos, nunca foi ao teatro, e nada
     * mais. O trabalho da plataforma começa aí.
     */
    prompt: "sábado eu tô livre e não sei o que fazer. nunca fui em teatro na vida.",
    entendi:
      "Você não me disse o que gosta, e eu não vou pedir — quem sabe o nome do que procura " +
      "já não precisa descobrir. O que eu tenho é uma data, uma cidade e uma porta que você " +
      "nunca atravessou. Começo por aí, e a primeira pergunta não é sobre gênero: é sobre o " +
      "que te move hoje.",
    criterios: [
      { campo: "janela", valor: "sábado", daFrase: "sábado eu tô livre" },
      { campo: "repertório", valor: "vazio — nada declarado", daFrase: "não sei o que fazer" },
      {
        campo: "porta fechada",
        valor: "teatro, nunca experimentado",
        daFrase: "nunca fui em teatro na vida",
      },
    ],
    jornada: [
      {
        tela: "Onboarding por disposição",
        rota: "/onboarding/1/",
        oQueAcontece:
          "A pergunta não é «que gênero você gosta?» — é «o que te move hoje?». Ela escolhe " +
          "«de graça e perto» e «quero algo que eu nunca vi». Duas escolhas, nenhum gênero " +
          "nomeado: é disso que o feed parte.",
      },
      {
        tela: "Descobrir",
        rota: "/descobrir/",
        oQueAcontece:
          "O feed é caminhada no grafo, não ranking. Ela vê acontecimento com data, preço e " +
          "lugar — e cada cartão traz por que veio.",
      },
      {
        tela: "Por que isto apareceu",
        rota: "/descobrir/",
        oQueAcontece:
          "Ela toca em «por que isto?» e lê as arestas que trouxeram o cartão. É aqui que a " +
          "recomendação para de ser palpite: se o sistema não consegue dizer por quê, ele não " +
          "sugere.",
      },
      {
        tela: "Poesia falada, que é o passo curto",
        rota: "/evento/cr-pescaria-de-curiosidades-3/",
        oQueAcontece:
          "Palavra dita em voz alta, para público, de graça, num museu de poesia. Ainda não é " +
          "teatro e já é palco — é o degrau que a porta fechada exige.",
      },
      {
        tela: "A primeira vez no teatro",
        rota: "/evento/tm-recital-all-greek-to-me/",
        oQueAcontece:
          "A única sessão gratuita do Theatro Municipal no mês. Ela atravessa a porta do maior " +
          "teatro da cidade sem pagar por isso — e reserva no canal da própria casa.",
      },
    ],
    sugestoes: [
      {
        slug: "cr-pescaria-de-curiosidades-3",
        porque:
          "O degrau. Poesia falada, gratuita, e público numa sala: tudo o que um teatro tem, " +
          "menos o nome que a assusta.",
      },
      {
        slug: "tm-recital-all-greek-to-me",
        porque:
          "O destino. Sessão gratuita no Theatro Municipal — a primeira vez dela acontece no " +
          "lugar que ela achava que não era para ela.",
      },
    ],
    naoSustenta:
      "A cadeia que liga o que ela ouve ao palco é CURADORIA NOSSA, não ligação do acervo: o " +
      "Itaú Cultural classifica cada linguagem em sua caixa e nada na fonte une música falada a " +
      "teatro. Na trilha isso aparece rotulado «autorado», passo a passo. E a jornada acima " +
      "supõe que ela responda ao onboarding — se ela pular, o feed parte só de «sábado, perto, " +
      "de graça», que é menos preciso e continua honesto.",
  },
  {
    id: "carlos-belem",
    persona: "Carlos, 4 dias em Belém",
    prompt: "Vou passar quatro dias em Belém e nunca estive na cidade. O que eu não posso perder?",
    entendi:
      "Quatro dias e um território que você não conhece. Priorizo o que é próprio de Belém — " +
      "não a franquia que também existe na sua cidade — e equilibro deslocamento e densidade " +
      "para você não gastar o dia no trânsito.",
    criterios: [
      { campo: "território", valor: "Belém, PA", daFrase: "quatro dias em Belém" },
      { campo: "janela", valor: "4 dias", daFrase: "quatro dias" },
      { campo: "repertório", valor: "nenhum declarado", daFrase: "nunca estive na cidade" },
    ],
    sugestoes: [],
    naoSustenta:
      "Nenhum evento do acervo cruza data futura com território, e Belém não é exceção: os 39 " +
      "registros que o Itaú Cultural documenta lá são o que a cidade PRODUZIU — 17 exposições, " +
      "11 artistas, 8 espaços e 3 instituições —, com data histórica transcrita da fonte. Por " +
      "isso o Modo Cidade responde «o que existe no território», e não «o que está em cartaz " +
      "esta semana». Programação futura entra nesta mesma tela quando os produtores publicarem " +
      "no Studio, ou quando a raspagem alcançar as casas de Belém como já alcançou as de São " +
      "Paulo. Não fabricamos data para tapar o buraco.",
  },
  {
    id: "joao-bienal",
    persona: "João",
    prompt: "Quero algo parecido com a Bienal, gratuito e perto de mim.",
    entendi:
      "Três critérios numa frase só, e eu mostro os três antes de mostrar resultado — você tira " +
      "qualquer um com um toque e vê o número mudar na hora. Não é conversa: é a sua frase " +
      "virando filtro, e o filtro continua seu.",
    criterios: [
      { campo: "semelhança", valor: "arte contemporânea, coletiva, em espaço expositivo", daFrase: "parecido com a Bienal" },
      { campo: "preço", valor: "gratuito", daFrase: "gratuito" },
      { campo: "proximidade", valor: "São Paulo, SP", daFrase: "perto de mim" },
    ],
    sugestoes: [
      {
        slug: "masp-carolina-caycedo-confluencias",
        porque:
          "Arte contemporânea latino-americana em espaço expositivo, na Avenida Paulista — a " +
          "aresta mais curta que sai da âncora «Bienal» dentro do seu raio.",
      },
      {
        slug: "masp-damian-ortega-materia-e-energia",
        porque:
          "Mesmo tipo de exposição, mesma casa, período mais longo: se a data da outra não " +
          "servir, esta cobre a janela.",
      },
    ],
    naoSustenta:
      "«Parecido com» casa por TEXTO, e não por travessia de aresta: o índice de busca não tem " +
      "campo de vizinhança, então parte dos vizinhos «semelhante_a» da Bienal fica fora do " +
      "alcance, e a tela declara quantos. E o critério «gratuito» aqui é o que a instituição " +
      "publica — o MASP não declara preço na página da exposição, então ele não é afirmado como " +
      "gratuito, e sim mostrado com o preço não publicado.",
  },
];

export function cenarioDeIA(id: string): CenarioDeIA | undefined {
  return CENARIOS_DE_IA.find((c) => c.id === id);
}


// ---------------------------------------------------------------------------
// O DTO que atravessa a fronteira RSC — só primitivo
// ---------------------------------------------------------------------------

export interface CartaoDoCenario {
  slug: string;
  titulo: string;
  imagem: string | null;
  creditoImagem: string | null;
  porque: string;
  rota: string;
}

export interface CenarioResolvido {
  id: string;
  persona: string;
  prompt: string;
  entendi: string;
  criterios: CriterioLido[];
  jornada: PassoDaJornada[];
  cartoes: CartaoDoCenario[];
  naoSustenta: string;
}

/**
 * A RESOLUÇÃO ACONTECE NO BUILD, não no clique. `ia-conversa.tsx` é cliente e não pode
 * alcançar o grafo (DP-F): se um evento citado sumir, é aqui que ele some, e o cartão
 * simplesmente não desce. A conversa nunca fica esperando dado.
 */
export function cenariosResolvidos(
  buscar: (slug: string) => { titulo: string; imagem?: string; creditoImagem?: string } | undefined,
): CenarioResolvido[] {
  return CENARIOS_DE_IA.map((c) => ({
    id: c.id,
    persona: c.persona,
    prompt: c.prompt,
    entendi: c.entendi,
    criterios: [...c.criterios],
    jornada: [...(c.jornada ?? [])],
    naoSustenta: c.naoSustenta,
    cartoes: c.sugestoes.flatMap((sg) => {
      const e = buscar(sg.slug);
      if (!e) return [];
      return [{
        slug: sg.slug,
        titulo: e.titulo,
        imagem: e.imagem ?? null,
        creditoImagem: e.creditoImagem ?? null,
        porque: sg.porque,
        rota: `/evento/${sg.slug}/`,
      }];
    }),
  }));
}
