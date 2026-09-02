import museus from "../../dados/parceiros/museus-sp.json";
import municipal from "../../dados/parceiros/theatro-municipal.json";
import type { Aresta, Entidade, Ocorrencia } from "./tipos";

/**
 * parceiros.ts — a camada de ingestão federada, unida ao grafo na LEITURA.
 *
 * POR QUE ELA NÃO PASSA PELO GERADOR. `gerar-grafo.mjs` transforma o acervo do Itaú
 * Cultural: outra fonte, outro pipeline, outra procedência. Fazer o dado de parceiro
 * atravessar o mesmo caminho tem dois desfechos e os dois são ruins — ou a próxima
 * geração o apaga, porque o gerador só conhece `dados/normalizado/`, ou ele sai do outro
 * lado indistinguível do acervo, que é exatamente o que a procedência existe para impedir.
 *
 * Aqui ele entra como camada, do mesmo jeito que `CAPAS_EXTRA` entra: um arquivo que o
 * `grafo.ts` conhece e soma. A fronteira fica visível no código e na tela.
 *
 * O QUE ESTE ARQUIVO NÃO FAZ. Ele não decide que a exposição é boa, não a promove no feed
 * e não a mistura com o acervo na contagem. Traduz o que a raspagem leu para o formato do
 * grafo, marcando `procedencia: "parceiro"` em toda entidade e em toda ocorrência.
 * Curadoria é humana e acontece no Studio.
 */

interface EventoRaspado {
  id: string;
  titulo: string;
  procedencia: string;
  fonte: string;
  fonteUrl?: string;
  resumo?: string;
  espacoDeclarado?: string;
  linguagemDeclarada?: string;
  gratuito: boolean | null;
  imagem?: string;
  ocorrencias: { inicio: string; fim?: string }[];
}

/**
 * O vocabulário do parceiro não é o nosso. «Ópera» e «Concertos» são o que o Municipal
 * escreve; `musica` e `teatro` são ids do vocabulário controlado do IC. A tradução é
 * literal e curta de propósito: o que não estiver aqui fica SEM linguagem, e uma entrada
 * sem linguagem é honesta — inventar a classificação é que não seria.
 */
const LINGUAGEM_DO_PARCEIRO: Record<string, string> = {
  "Ópera": "musica",
  "Música": "musica",
  Concertos: "musica",
  Recital: "musica",
  Coral: "musica",
  Teatro: "teatro",
  "Balé": "danca",
  "Dança": "danca",
};

/** Sem hora na fonte, a sessão abre às 10h — e o `extra` registra que a hora é nossa. */
const HORA_PADRAO = "T10:00:00";

/**
 * A LINGUAGEM QUANDO A FONTE NÃO DIZ, e por que isso é inferência declarada e não chute.
 *
 * O Municipal escreve a categoria em cada evento — «Ópera», «Concertos» — e ali a
 * linguagem é da fonte. Museu de arte não escreve «artes visuais» na página de uma
 * exposição, porque para ele isso é óbvio: é um museu de arte. Sem linguagem nenhuma o nó
 * fica ilhado — não pertence a nada, e num produto de travessia nó ilhado nunca é
 * alcançado.
 *
 * Então a linguagem é inferida do TIPO DA INSTITUIÇÃO, que é a única coisa que se pode
 * afirmar sem ler a exposição. E a inferência aparece: `linguagemInferida: true` no
 * `extra`, para que a tela e a fila do Studio saibam que aquele campo é leitura nossa —
 * a mesma disciplina de `procedencia: "derivado"` no resto do grafo.
 */
const LINGUAGEM_POR_INSTITUICAO: Record<string, string> = {
  "MASP — Museu de Arte de São Paulo Assis Chateaubriand": "artes-visuais",
  "Pinacoteca de São Paulo": "artes-visuais",
};

function paraEntidade(e: EventoRaspado): Entidade {
  const daFonte = e.linguagemDeclarada ? LINGUAGEM_DO_PARCEIRO[e.linguagemDeclarada] : undefined;
  const inferida = daFonte ? undefined : LINGUAGEM_POR_INSTITUICAO[e.fonte];
  const linguagem = daFonte ?? inferida;
  return {
    id: e.id,
    classe: "evento",
    titulo: e.titulo,
    slug: e.id.split(":").pop() ?? e.id,
    resumo: e.resumo,
    imagem: e.imagem,
    // Crédito é obrigatório quando há imagem, e a fonte é a instituição: a foto é de
    // divulgação dela, e é ela quem responde pela publicação.
    creditoImagem: e.imagem ? `Divulgação · ${e.fonte}` : undefined,
    linguagens: linguagem ? [linguagem] : [],
    temas: [],
    acessibilidade: {
      audio_description: false,
      libras: false,
      descriptive_subtitle: false,
      closed_caption: false,
      open_caption: false,
      simultaneous_translation: false,
      stenotypy: false,
      subtitle: false,
    },
    // O parceiro não preencheu a ficha das 8 dimensões. `false` aqui significa «não
    // declarou», que é diferente de «declarou que não tem» — a distinção de D-43.
    declaraAcessibilidade: false,
    procedencia: "parceiro",
    fonte: e.fonte,
    extra: {
      fonteUrl: e.fonteUrl ?? null,
      espacoDeclarado: e.espacoDeclarado ?? null,
      linguagemDeclarada: e.linguagemDeclarada ?? null,
      linguagemInferida: Boolean(inferida),
      horaAutorada: true,
      // Ninguém revisou. É o que a fila do Studio lê para saber o que espera gente.
      revisadoPor: null,
    },
  };
}

function ocorrenciasDe(e: EventoRaspado): Ocorrencia[] {
  return e.ocorrencias.map((o, i) => ({
    id: `${e.id}:oc${i}`,
    temporadaId: `${e.id}:temp`,
    eventoId: e.id,
    inicio: `${o.inicio}${HORA_PADRAO}`,
    espacoId: null,
    preco: null,
    // `gratuito: null` da raspagem quer dizer «a fonte não publicou»; vira `false` porque
    // o tipo não admite nulo, e o `extra` da entidade guarda que ninguém disse.
    gratuito: e.gratuito === true,
    esgotado: false,
    acessibilidade: {
      audio_description: false,
      libras: false,
      descriptive_subtitle: false,
      closed_caption: false,
      open_caption: false,
      simultaneous_translation: false,
      stenotypy: false,
      subtitle: false,
    },
    declaraAcessibilidade: false,
    procedencia: "parceiro",
    // A chave de identidade da ocorrência é temporada + início + espaço (D-22). Sem
    // espaço declarado pela fonte ela é temporada + início — e é ela que o Studio usa
    // para achar duplicata quando o mesmo museu for raspado duas vezes.
    chaveIdentidade: e.id + ':temp|' + o.inicio,
  }));
}

/**
 * A LEITURA DO ARQUIVO RASPADO É VALIDAÇÃO, não conversão. O JSON vem de fora — de um
 * script que abriu um site que ninguém controla — e tratá-lo como se já tivesse a forma
 * certa é o mesmo que confiar no HTML do museu. Cada campo é lido, conferido e, quando
 * não serve, descartado com a entrada inteira.
 */
function texto(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function lerRaspados(bruto: { eventos: unknown[] }): EventoRaspado[] {
  const lidos: EventoRaspado[] = [];
  for (const cru of bruto.eventos) {
    if (typeof cru !== "object" || cru === null) continue;
    const e: Record<string, unknown> = { ...cru };

    const id = texto(e.id);
    const titulo = texto(e.titulo);
    const fonte = texto(e.fonte);
    if (!id || !titulo || !fonte) continue;

    const ocorrencias: { inicio: string; fim?: string }[] = [];
    if (Array.isArray(e.ocorrencias)) {
      for (const o of e.ocorrencias) {
        if (typeof o !== "object" || o === null) continue;
        const oc: Record<string, unknown> = { ...o };
        const inicio = texto(oc.inicio);
        // ISO curto e nada mais: uma data em outro formato viraria `Invalid Date` na tela.
        if (inicio && /^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
          ocorrencias.push({ inicio, fim: texto(oc.fim) });
        }
      }
    }

    lidos.push({
      id,
      titulo,
      fonte,
      procedencia: "parceiro",
      fonteUrl: texto(e.fonteUrl),
      resumo: texto(e.resumo),
      espacoDeclarado: texto(e.espacoDeclarado),
      linguagemDeclarada: texto(e.linguagemDeclarada),
      gratuito: e.gratuito === true ? true : e.gratuito === false ? false : null,
      imagem: texto(e.imagem),
      ocorrencias,
    });
  }
  return lidos;
}

const RASPADOS: EventoRaspado[] = [...lerRaspados(museus), ...lerRaspados(municipal)];

/**
 * O CRIVO É DATA, NÃO IMAGEM — e a primeira versão errou nisso.
 *
 * Exigir imagem parecia zelo e era o contrário: barrou os oito eventos do Theatro
 * Municipal, que são os únicos com LINGUAGEM DECLARADA e data de sessão, e deixou passar
 * só exposição de museu. O resultado foi um feed que não mudou para a Maria — o repertório
 * dela é literatura, música e poesia, e exposição de artes visuais não a alcança.
 *
 * Cartão sem foto o design system já resolve: `CapaSemImagem` compõe a capa na cor da
 * linguagem, com a textura da marca. O que um evento não pode faltar é DATA — sem ela não
 * há ocorrência, e sem ocorrência ele não é um acontecimento, é uma ficha.
 */
const APROVEITAVEIS = RASPADOS.filter((e) => e.ocorrencias.length > 0);

export const ENTIDADES_DE_PARCEIRO: Entidade[] = APROVEITAVEIS.map(paraEntidade);

export const OCORRENCIAS_DE_PARCEIRO: Record<string, Ocorrencia[]> = Object.fromEntries(
  APROVEITAVEIS.map((e) => [e.id, ocorrenciasDe(e)] as const).filter(([, oc]) => oc.length),
);

/** Quantos, e de onde — o Observatório precisa contar parceiro separado do acervo. */
export const RESUMO_DE_PARCEIROS = {
  total: ENTIDADES_DE_PARCEIRO.length,
  porFonte: ENTIDADES_DE_PARCEIRO.reduce<Record<string, number>>((acc, e) => {
    const f = e.fonte ?? "sem fonte";
    acc[f] = (acc[f] ?? 0) + 1;
    return acc;
  }, {}),
};


// ---------------------------------------------------------------------------
// A instituição e a aresta — sem elas o evento é nó órfão
// ---------------------------------------------------------------------------

/**
 * NÓ SEM ARESTA NÃO EXISTE NUM PRODUTO DE TRAVESSIA. O feed de Descobrir é caminhada no
 * grafo, não consulta a uma tabela: uma exposição sem nenhuma ligação nunca é alcançada,
 * por melhor que seja. Foi o que aconteceu na primeira tentativa — as nove entidades
 * entraram, o índice contou 7.819, e o feed continuou idêntico.
 *
 * Então cada exposição é LIGADA A QUEM A REALIZA. E aqui a ingestão federada mostra a que
 * veio: o MASP já existe no acervo do Itaú Cultural, como `instituicao:enc:76213`, e a
 * exposição raspada se pendura na instituição que a Enciclopédia já conhecia. Não é
 * importação paralela: é o grafo do IC ganhando o que estava faltando nele.
 *
 * Pinacoteca e Theatro Municipal não estão no acervo, e por isso entram como instituição
 * de procedência `parceiro` — declaradas, não fingidas de acervo.
 */
const INSTITUICAO_NO_ACERVO: Record<string, string> = {
  "MASP — Museu de Arte de São Paulo Assis Chateaubriand": "instituicao:enc:76213",
};

function idDaInstituicao(fonte: string): string {
  return (
    INSTITUICAO_NO_ACERVO[fonte] ??
    "instituicao:parceiro:" +
      fonte
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
  );
}

const FONTES = [...new Set(APROVEITAVEIS.map((e) => e.fonte))];

/** Só as que o acervo ainda não tem — duplicar o MASP seria criar a duplicata do Cenário 3. */
export const INSTITUICOES_DE_PARCEIRO: Entidade[] = FONTES.filter(
  (f) => !INSTITUICAO_NO_ACERVO[f],
).map((fonte) => ({
  id: idDaInstituicao(fonte),
  classe: "instituicao",
  titulo: fonte,
  slug: idDaInstituicao(fonte).split(":").pop() ?? fonte,
  linguagens: [],
  temas: [],
  acessibilidade: {
    audio_description: false,
    libras: false,
    descriptive_subtitle: false,
    closed_caption: false,
    open_caption: false,
    simultaneous_translation: false,
    stenotypy: false,
    subtitle: false,
  },
  declaraAcessibilidade: false,
  procedencia: "parceiro",
  fonte,
}));

function linguagemDe(e: EventoRaspado): string | undefined {
  const daFonte = e.linguagemDeclarada ? LINGUAGEM_DO_PARCEIRO[e.linguagemDeclarada] : undefined;
  return daFonte ?? LINGUAGEM_POR_INSTITUICAO[e.fonte];
}

/**
 * DUAS ARESTAS POR EXPOSIÇÃO, e nenhuma delas é enfeite.
 *
 * `realiza` liga a instituição ao que ela realiza — é o que faz a exposição aparecer na
 * página do MASP. `pertence_a` liga a exposição à linguagem, no mesmo formato que o acervo
 * usa em 7.254 arestas, e é essa que a torna ALCANÇÁVEL: o feed parte das linguagens do
 * repertório da pessoa, então sem ela a exposição fica a saltos demais de qualquer semente.
 */
export const ARESTAS_DE_PARCEIRO: Aresta[] = [
  ...APROVEITAVEIS.flatMap((e) => {
    const l = linguagemDe(e);
    if (!l) return [];
    return [
      {
        de: e.id,
        para: `linguagem:cms:${l}`,
        relacao: "pertence_a" as const,
        procedencia: "parceiro" as const,
        motivo: e.linguagemDeclarada
          ? `${e.fonte} classifica esta programação como ${e.linguagemDeclarada}.`
          : `Classificação nossa, pela natureza da instituição: ${e.fonte} é museu de arte.`,
      },
    ];
  }),
  ...APROVEITAVEIS.map((e) => ({
    de: idDaInstituicao(e.fonte),
    para: e.id,
    relacao: "realiza" as const,
    procedencia: "parceiro" as const,
    // O motivo é obrigatório e é escrito, não gerado por template vazio: quem clicar em
    // «por que isto?» precisa ler uma frase que explique a ligação, e esta explica.
    motivo: `${e.fonte} publica esta programação na própria página.`,
  })),
];
