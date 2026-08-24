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
