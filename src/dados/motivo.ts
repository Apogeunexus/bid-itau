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
  influenciou: (de, para) => `${de.titulo} influenciou ${para.titulo}.`,

  dialoga_com: (de, para) => `${de.titulo} dialoga com ${para.titulo}.`,

  deriva_de: (de, para) => `${de.titulo} deriva de ${para.titulo}.`,

  // O caso mais frequente do acervo: 13.000 arestas. Linguagem e tema são os dois eixos
  // de classificação e leem diferente — pertencer a uma linguagem é ser daquele campo
  // artístico; pertencer a um tema é falar daquele assunto.
  pertence_a: (de, para) => {
    if (para.classe === "linguagem") return `${de.titulo} é de ${para.titulo}.`;
    if (para.classe === "tema") return `${de.titulo} trata de ${para.titulo}.`;
    return `${de.titulo} pertence a ${para.titulo}.`;
  },

  // D-41: o papel MORA NA ARESTA. Quando a aresta não traz papel, a frase diz a relação
  // e para por aí — inferir "diretor" a partir de qualquer outro campo seria fabricar
  // atribuição sobre pessoa real.
  atua_em: (de, para, papel) =>
    papel?.trim()
      ? `${de.titulo} participa de ${para.titulo} como ${papel.trim()}.`
      : `${de.titulo} participa de ${para.titulo}.`,

  curou: (de, para) => `${de.titulo} assina a curadoria de ${para.titulo}.`,

  // A instituição é o sujeito: 527 arestas `instituicao -realiza-> evento`.
  realiza: (de, para) => `${de.titulo} realiza ${para.titulo}.`,

  ocorre_em: (de, para) => `${de.titulo} acontece dentro de ${para.titulo}.`,

  situado_em: (de, para) => `${de.titulo} fica em ${para.titulo}.`,

  // O conteúdo é o sujeito: 887 arestas `conteudo -aprofunda-> evento|formacao|publicacao`.
  aprofunda: (de, para) => `${de.titulo} aprofunda ${para.titulo}.`,

  fala_sobre: (de, para) => `${de.titulo} fala sobre ${para.titulo}.`,

  // Nomeia a trilha, que é sempre a ponta de origem das 4 arestas `contextualiza`.
  contextualiza: (de, para) =>
    de.classe === "trilha"
      ? `A trilha «${de.titulo}» passa por ${para.titulo}.`
      : `${de.titulo} contextualiza ${para.titulo}.`,

  // Na prática nunca cai aqui: todas as 47.259 `semelhante_a` do grafo têm motivo escrito.
  // A frase existe porque o `Record` é completo e porque o gerador pode mudar.
  semelhante_a: (de, para) => `${de.titulo} e ${para.titulo} são próximos no acervo.`,

  duplicata_suspeita: (de, para) =>
    `${de.titulo} é suspeita de duplicar ${para.titulo}.`,
};

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
    return {
      texto: escrito,
      origemMotivo: "escrito",
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
