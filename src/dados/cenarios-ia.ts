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
     * ELA NÃO PEDE TEATRO, e é isso que o cenário testa. A primeira redação — «nunca fui
     * ao teatro e não sei por onde começar» — era o enunciado do briefing copiado, não uma
     * pessoa falando: ninguém digita a própria persona. Esta é como alguém de 27 anos
     * escreve de fato, com a objeção («não é pra mim») que é o verdadeiro obstáculo, e o
     * repertório dito de passagem em vez de declarado.
     */
    prompt:
      "nunca fui no teatro, sempre achei que não era pra mim. curto rap e slam — tem " +
      "alguma coisa nessa pegada pra fazer no sábado?",
    entendi:
      "Você não pediu teatro — disse que ele não é para você. Então eu não discuto isso: " +
      "entro pelo que você já ouve e mostro o caminho até o palco, em vez de largar você na " +
      "porta dele. Se no fim for teatro, você descobre depois de já estar gostando.",
    criterios: [
      { campo: "repertório", valor: "rap, slam", daFrase: "curto rap e slam" },
      { campo: "experiência", valor: "primeira vez", daFrase: "nunca fui no teatro" },
      { campo: "objeção", valor: "acha que não é para ela", daFrase: "sempre achei que não era pra mim" },
      { campo: "linguagem de chegada", valor: "poesia, música", daFrase: "derivado do repertório" },
    ],
    sugestoes: [
      {
        slug: "cr-pescaria-de-curiosidades-3",
        porque:
          "Poesia falada num museu de poesia, e é gratuito. É o passo mais curto entre o slam " +
          "que você já ouve e uma sala com público — mesma palavra dita em voz alta, outro lugar.",
      },
      {
        slug: "cr-o-que-e-que-a-bahia-tem",
        porque:
          "Espetáculo musical na Casa das Rosas: já tem palco, direção e roteiro, e ainda entra " +
          "pela música. É teatro sem se anunciar como teatro.",
      },
      {
        slug: "tm-recital-all-greek-to-me",
        porque:
          "A única sessão gratuita do Theatro Municipal neste mês. Se a ideia é atravessar a " +
          "porta de um teatro pela primeira vez, atravesse a do maior deles sem pagar por isso.",
      },
    ],
    naoSustenta:
      "A ponte entre rap e slam é nossa, não do acervo: rap está classificado em Música e slam " +
      "em Literatura, e nenhuma ligação da fonte une os dois. Ela aparece rotulada «autorado» na " +
      "trilha, passo a passo — não escondemos a ponte, mostramos de quem ela é.",
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
