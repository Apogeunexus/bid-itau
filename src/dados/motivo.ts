/**
 * motivo.ts — o texto do selo de motivo (D-28, DP-A).
 *
 * O selo de motivo é o elemento que separa mediação legível de recomendador opaco. Por
 * isso este arquivo tem uma regra só, e ela é dura: **o texto descreve uma aresta que
 * existe no grafo**. Não há terceiro modo, não há texto genérico de reserva, não há
 * "porque combina com você".
 *
 * MEDIÇÃO QUE OBRIGA OS DOIS MODOS (M-1 e M-5 do plano 02-01):
 * das 47.259 arestas `semelhante_a`, 47.258 ligam duas entidades da MESMA classe. Uma
 * caminhada que só siga aresta com `motivo` escrito nunca produz feed heterogêneo — sair
 * de um termo devolve termos. A heterogeneidade mora nas arestas estruturais
 * (`pertence_a`, `atua_em`, `realiza`, `aprofunda`…), e essas não carregam `motivo`:
 * só `semelhante_a` e `duplicata_suspeita` carregam, 47.299 arestas ao todo.
 * Nos feeds medidos, 20% a 39% dos cartões chegam por aresta com motivo escrito. Se
 * cartão sem motivo escrito não renderizasse, o feed teria 3 ou 4 itens.
 *
 * Daí os dois modos, e daí `origemMotivo` viajar no DTO: a tela de explicação precisa
 * poder dizer o que está escrito no acervo e o que foi redigido a partir da relação
 * (T-02-05). Sem essa distinção, texto nosso passaria por texto do Itaú Cultural.
 */

import type { MotivoCartao } from "./cartao";
import type { Aresta, Entidade, Relacao } from "./tipos";

/**
 * Uma frase curta em português que nomeia a relação e as duas pontas.
 *
 * `de` e `para` são as pontas DA ARESTA, na orientação em que a aresta foi gravada —
 * nunca a orientação em que a caminhada por acaso a atravessou. `atua_em` é dirigida:
 * dizer "o evento atua na pessoa" porque a travessia veio do outro lado seria falso.
 */
type Compositor = (de: Entidade, para: Entidade, papel?: string) => string;

/**
 * As 14 relações de `Relacao`. `Record` completo de propósito: acrescentar relação em
 * `tipos.ts` sem escrever a frase aqui vira erro de compilação, não cartão mudo.
 */
const COMPOSITORES: Record<Relacao, Compositor> = {
  influenciou: (de) => `Influência de ${de.titulo}`,

  dialoga_com: (_de, para) => `Diálogo com ${para.titulo}`,

  deriva_de: (_de, para) => `Deriva de ${para.titulo}`,

  // Nomeia o CAMPO, sem remendar o título do cartão — «90-00: cuentos… é de
  // literatura» lia como banner gerado. A categoria já está na tag; aqui é a
  // descrição da aresta.
  pertence_a: (_de, para) => {
    if (para.classe === "linguagem") return `É de ${para.titulo}`;
    if (para.classe === "tema") return `Trata de ${para.titulo}`;
    return `Pertence a ${para.titulo}`;
  },

  // D-41: o papel MORA NA ARESTA. Quando a aresta não traz papel, a frase diz a relação
  // e para por aí — inferir "diretor" a partir de qualquer outro campo seria fabricar
  // atribuição sobre pessoa real.
  atua_em: (_de, para, papel) =>
    papel?.trim() ? `${papel.trim()} em ${para.titulo}` : `Em ${para.titulo}`,

  curou: (de) => `Curadoria de ${de.titulo}`,

  realiza: (de) => `Realizado por ${de.titulo}`,

  ocorre_em: (_de, para) => `Acontece em ${para.titulo}`,

  situado_em: (_de, para) => `Fica em ${para.titulo}`,

  aprofunda: (de) => `Aprofunda ${de.titulo}`,

  fala_sobre: (_de, para) => `Fala sobre ${para.titulo}`,

  contextualiza: (de, para) =>
    de.classe === "trilha" ? `Passa por ${para.titulo}` : `Contextualiza ${para.titulo}`,

  semelhante_a: (_de, para) => `Próximo de ${para.titulo}`,

  duplicata_suspeita: (_de, para) => `Possível duplicata de ${para.titulo}`,
};

/* ---------------------------------------------------------------------------
 * O MOTIVO DE «SEMELHANTE A», REESCRITO NA LEITURA (23/08).
 *
 * O gerador do grafo carimba, nas 47.259 arestas `semelhante_a`, uma frase de template:
 * «parecido porque os dois são coletivos, de artes visuais». Ela tem a informação certa e
 * a forma errada — começa em minúscula, explica o mecanismo («os dois são») em vez de
 * dizer a coisa, e no cartão lia como depuração vazada para a tela. O cliente apontou isso
 * em 23/08: «descrições burras que não simulam bem a UI».
 *
 * ELA NÃO É TEXTO DO ITAÚ CULTURAL, e é isso que torna a reescrita legítima. Medido em
 * `arestas.json`: das 47.259, 47.256 são `derivado` e 3 são `autorado`. NENHUMA é `ic`.
 * A frase foi escrita pelo nosso build, então reescrevê-la não põe palavra nossa na boca
 * de ninguém — pelo contrário: mantê-la marcada como `escrito` é que fazia a tela de
 * explicação apresentá-la como CITAÇÃO do acervo, em laranja e sem corte (ver o ramo de
 * `origemMotivo === "escrito"` em `explicacao.tsx`). Daí a reescrita devolver `composto`,
 * que é o que ela sempre foi.
 *
 * O TEMPLATE É NOSSO, ENTÃO CASÁ-LO É SEGURO — e mesmo assim há saída: motivo que não casa
 * o padrão volta inteiro, do jeito que veio. Os 43 motivos de `duplicata_suspeita`
 * («mesma chave de identidade do original…») caem nesse caminho e não são tocados.
 * ------------------------------------------------------------------------ */

/**
 * Os dez plurais que o gerador emite, CONTADOS em `arestas.json` e não adivinhados:
 * conteúdos (21.150), pessoas (5.179), mídias (5.147), termos (4.787), instituições
 * (3.146), eventos (2.744), obras (2.463), coletivos (2.278), formações (217) e
 * publicações (145). O valor traz o artigo junto porque o gênero muda com a classe.
 *
 * «Termo» vira «verbete», que é o nome que o produto usa para a classe em `cartao.tsx` e
 * em `buscar.tsx` — a tela não mostra a palavra da ontologia.
 */
const OUTRO_DA_CLASSE: Record<string, string> = {
  conteúdos: "Outro conteúdo",
  pessoas: "Outra pessoa",
  mídias: "Outra mídia",
  termos: "Outro verbete",
  instituições: "Outra instituição",
  eventos: "Outro evento",
  obras: "Outra obra",
  coletivos: "Outro coletivo",
  formações: "Outra formação",
  publicações: "Outra publicação",
};

/**
 * As quatro cidades, das 45 que aparecem depois de «em», que pedem artigo em português.
 *
 * O gerador escreve sempre «em», e «em Rio de Janeiro» é a segunda combinação mais comum
 * do grafo (828 arestas) — errado o bastante para tirar a frase do lugar. As outras 41
 * («em São Paulo», «em Belém», «em Nova York», «em Ouro Preto»…) já estão certas com
 * «em», e por isso não entram: a tabela é a EXCEÇÃO medida, não uma lista de todas.
 */
const ARTIGO_DO_LUGAR: Record<string, string> = {
  "Rio de Janeiro": "no",
  Recife: "no",
  "Cidade do México": "na",
  "Grande Londres": "na",
};

/**
 * Quatro linguagens do vocabulário vêm com inicial maiúscula porque foram PROMOVIDAS na
 * geração — «Arte», «Gestão cultural», «Rádio», «TV» (ver `linguagensPromovidas` em
 * `meta.json`). No meio de uma frase elas viram «de Arte e arte e tecnologia», que lê como
 * defeito. Só a PRIMEIRA letra desce, e só quando o resto da palavra já é minúsculo: assim
 * «TV» continua «TV» em vez de virar «tV».
 */
function comInicialMinuscula(traco: string): string {
  const [primeira, ...resto] = traco;
  const palavra = traco.split(/\s/)[0];
  if (palavra.length > 1 && palavra.slice(1) !== palavra.slice(1).toLocaleLowerCase("pt-BR")) {
    return traco;
  }
  return primeira.toLocaleLowerCase("pt-BR") + resto.join("");
}

/** `parecido porque os dois são <classe>[, <de|em|sobre> <traço>]` */
const TEMPLATE_DO_GERADOR = /^parecido porque os dois são ([^,]+?)(?:,\s+(de|em|sobre)\s+(.+))?$/;

function reescreverSemelhanca(texto: string): string | undefined {
  const casou = TEMPLATE_DO_GERADOR.exec(texto);
  if (!casou) return undefined;
  const abertura = OUTRO_DA_CLASSE[casou[1]];
  if (!abertura) return undefined;

  const conector = casou[2];
  const traco = casou[3];
  // Sem traço compartilhado a frase para no que ela sabe. «Outro conteúdo do acervo» diz
  // menos que as outras, e dizer menos é melhor que completar com o que não foi medido.
  if (!conector || !traco) return `${abertura} do acervo`;

  if (conector === "em") return `${abertura} ${ARTIGO_DO_LUGAR[traco] ?? "em"} ${traco}`;
  return `${abertura} ${conector} ${comInicialMinuscula(traco)}`;
}

/**
 * O texto do selo a partir da aresta que trouxe o candidato.
 *
 * FALHA ALTA DE D-28 — e ela vale TAMBÉM em produção, de propósito. A caminhada roda no
 * build (DP-F), não no navegador: derrubar `npm run build` é a falha visível que D-28
 * pede. Um cartão mudo projetado na parede em cima do palco é a falha silenciosa que ela
 * proíbe. Por isso não existe `if (process.env.NODE_ENV === "production") return "…"`
 * neste arquivo.
 */
export function motivoDaAresta(aresta: Aresta, de: Entidade, para: Entidade): MotivoCartao {
  const escrito = aresta.motivo?.trim();
  if (escrito) {
    // A frase de template de `semelhante_a` é NOSSA, não do acervo: reescrita e devolvida
    // como composta. O porquê está no bloco acima.
    const reescrito =
      aresta.relacao === "semelhante_a" ? reescreverSemelhanca(escrito) : undefined;
    return {
      texto: reescrito ?? escrito,
      origemMotivo: reescrito ? "composto" : "escrito",
      relacao: aresta.relacao,
      procedenciaAresta: aresta.procedencia,
    };
  }

  const compositor = COMPOSITORES[aresta.relacao];
  if (!compositor) {
    throw new Error(
      `D-28: relação «${aresta.relacao}» sem compositor de motivo (${aresta.de} → ${aresta.para}). ` +
        `Toda relação de tipos.ts precisa de uma frase em motivo.ts.`,
    );
  }

  const texto = compositor(de, para, aresta.papel).trim();
  if (!texto || !de.titulo?.trim() || !para.titulo?.trim()) {
    throw new Error(
      `D-28: motivo vazio para «${aresta.relacao}» (${aresta.de} → ${aresta.para}). ` +
        `Cartão sem motivo não renderiza — falha visível em vez de selo mudo.`,
    );
  }

  return {
    texto,
    origemMotivo: "composto",
    relacao: aresta.relacao,
    procedenciaAresta: aresta.procedencia,
  };
}
