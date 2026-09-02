import type { ClasseEntidade } from "@/dados/tipos";

/**
 * rotulos.ts — o que cada classe da ontologia DIZ na tela.
 *
 * O mapa existe porque o nome da classe no modelo não é português de leitura:
 * `conteudo`, `midia`, `territorio`, `instituicao` são identificadores, e sem
 * acento. Sempre que um deles chegou à tela cru, chegou em caixa alta sobre uma
 * capa — «CONTEUDO» —, que é o vocabulário do banco aparecendo para o público.
 *
 * ELE MORA AQUI, E NÃO EM CADA COMPONENTE, porque já existia em duas cópias
 * idênticas (`cartao.tsx` e `busca-frase.tsx`) enquanto a capa — o lugar onde o
 * rótulo mais aparece — não usava nenhuma das duas. Duas cópias divergem na
 * primeira correção; três, com uma delas ausente, já divergiam.
 */
const ROTULO_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  conteudo: "editorial",
  pessoa: "pessoa",
  midia: "mídia",
  termo: "verbete",
  territorio: "território",
  evento: "evento",
  instituicao: "instituição",
  obra: "obra",
  coletivo: "coletivo",
  espaco: "espaço",
  tema: "tema",
  formacao: "formação",
  publicacao: "publicação",
  linguagem: "linguagem",
  trilha: "trilha",
};

export function rotuloDaClasse(classe: ClasseEntidade): string {
  return ROTULO_CLASSE[classe] ?? classe;
}
