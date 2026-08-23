import vocabularioJson from "./gerado/vocabulario.json";
import type { Vocabulario } from "./tipos";

/**
 * prateleiras.ts — como o acervo de mídia vira FILEIRA, para o Play e para o Cast.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O PROBLEMA QUE ESTE ARQUIVO RESOLVE (23/08). As duas telas ganharam forma de
 * vitrine — Netflix no Play, Spotify no Cast —, e vitrine sem divisão vira lista
 * gigante sem alma: o Play abria com três fileiras (série 63, vídeo 46, playlist
 * 4) e o Cast com uma parede de 336 capas. Nem 63 numa fileira só nem 336 numa
 * grade só dizem a alguém o que existe ali dentro.
 *
 * O ACERVO NÃO TEM CAMPO DE COLEÇÃO. Medido: nenhuma das 529 mídias tem aresta
 * para `temporada`, e `origemCms` é a mesma lista de arquivos em todas elas. O
 * que existe é (1) o NOME repetido no título, (2) o TEMA declarado e (3) a
 * CATEGORIA do CMS. É com esses três que as fileiras são feitas, nesta ordem.
 *
 * A REGRA, em uma frase: **cada mídia entra na primeira fileira que a
 * reconhece** — a coleção cujo nome ela carrega no título, senão o tema que ela
 * declara, senão a categoria dela. Nenhuma fileira nasce com menos de
 * `MINIMO_DA_FILEIRA` itens, e o que não é reconhecido por nenhuma das três
 * volta para a fileira de sobra da categoria.
 *
 * ISTO NÃO É AUTORAR UM FATO. A afirmação da fileira «Mekukradjá» é sobre o
 * TÍTULO — este nome aparece em 71 títulos —, e é conferível lendo os títulos;
 * a de «Efemérides» é sobre o campo `tema`, que a fonte preencheu. Nenhuma das
 * duas afirma nada sobre a produção do episódio. É a mesma linha da fase 1:
 * ponte editorial entre conceitos é defensável e rotulada; dizer que uma pessoa
 * atuou numa montagem quando a fonte não disse seria falso.
 *
 * A PARTIÇÃO É CONFERIDA por quem chama (`play.ts`): as fileiras somam o
 * conjunto inteiro e nenhum item aparece em duas. Sem isso, uma mídia poderia
 * sumir da tela sem que ninguém percebesse — que é exatamente o defeito que a
 * forma de vitrine facilita.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * O piso de uma fileira. Com 2, qualquer coincidência de nome viraria fileira
 * («Homenagem», «parte 2»); com 3, o nome já é uma convenção do acervo.
 */
export const MINIMO_DA_FILEIRA = 3;

/**
 * Os separadores que o acervo usa entre o nome da coleção e o do episódio,
 * lidos nos 529 títulos: travessão, travessão longo, barra vertical e hífen
 * cercado de espaço. O hífen SEM espaço fica de fora de propósito —
 * «Escritores-Leitores» é um nome só, e parti-lo criaria duas coleções falsas.
 *
 * O dois-pontos também não entra aqui: ele partiria «Ficções: crianças», que é
 * um nome com dois-pontos dentro. Ele é aceito só como último recurso, e só
 * contra a lista de nomes JÁ conhecida — ver `nomesDoTitulo`.
 */
const SEPARADORES = /\s*[–—|]\s*|\s+-\s+/;

/** O mínimo que um item precisa ter para ser agrupado. Estrutural de propósito:
 *  assim este módulo não importa `play.ts`, que alcança o grafo de 23 MB. */
export interface ItemAgrupavel {
  slug: string;
  titulo: string;
  temas: string[];
  categoria: string;
}

export interface PrateleiraMontada<T extends ItemAgrupavel> {
  /** Chave estável para o estado do recorte e para `data-prateleira`. */
  valor: string;
  rotulo: string;
  itens: T[];
  /** De onde veio o agrupamento — a tela não mostra, o build declara. */
  origem: "colecao" | "tema" | "categoria";
}

/** Tira aspas curvas e retas e normaliza a forma Unicode — 40 títulos as usam. */
function limpar(texto: string): string {
  return texto
    .normalize("NFC")
    .replace(/[“”"]/g, "")
    .trim();
}

/** A chave de comparação: sem aspas e em caixa baixa. «Paiol literário» = «Paiol Literário». */
function chaveDe(texto: string): string {
  return limpar(texto).toLocaleLowerCase("pt-BR");
}

function partesDoTitulo(titulo: string): string[] {
  return limpar(titulo).split(SEPARADORES).map(limpar).filter(Boolean);
}

/** A chave que vai para o estado e para `data-prateleira`. Sem acento, sem espaço. */
function valorDoRotulo(prefixo: string, rotulo: string): string {
  const corpo = chaveDe(rotulo)
    .normalize("NFD")
    // `\p{M}` e não uma faixa escrita à mão: a faixa exigiria acentos
    // combinantes literais no código, que são invisíveis no editor e no diff.
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${prefixo}-${corpo || "sem-nome"}`;
}

/** Maiúscula inicial — os rótulos de tema do vocabulário vêm todos em caixa baixa. */
function comMaiuscula(texto: string): string {
  return texto ? texto[0].toLocaleUpperCase("pt-BR") + texto.slice(1) : texto;
}

/**
 * Os nomes que se repetem em 3 ou mais títulos, com a primeira grafia
 * encontrada. A ordem da varredura é a do catálogo — publicação decrescente com
 * desempate pelo slug —, então a grafia escolhida é a mesma em todo build.
 */
function nomesRepetidos(itens: readonly ItemAgrupavel[]) {
  const frequencia = new Map<string, number>();
  const rotulos = new Map<string, string>();
  for (const item of itens) {
    const partes = partesDoTitulo(item.titulo);
    if (partes.length < 2) continue;
    const vistas = new Set<string>();
    for (const parte of partes) {
      const chave = chaveDe(parte);
      if (vistas.has(chave)) continue;
      vistas.add(chave);
      frequencia.set(chave, (frequencia.get(chave) ?? 0) + 1);
      if (!rotulos.has(chave)) rotulos.set(chave, parte);
    }
  }
  return { frequencia, rotulos };
}

/**
 * Quais nomes de coleção este título carrega.
 *
 * Três tentativas, nesta ordem: (1) um trecho separado por travessão ou barra;
 * (2) o título INTEIRO, que é o caso da ficha da própria coleção («Mekukradjá»
 * sozinho); (3) o prefixo antes do primeiro dois-pontos, QUANDO ele já é um nome
 * conhecido — é a forma de «Ficções Itaú Cultural: ouça a peça “Maré”», 27
 * títulos que de outro modo cairiam longe dos seus irmãos.
 */
function nomesDoTitulo(titulo: string, nomes: Map<string, number>): string[] {
  const partes = partesDoTitulo(titulo);
  const chaves = new Set<string>(partes.length < 2 ? [] : partes.map(chaveDe));
  chaves.add(chaveDe(titulo));

  const candidatas = [...chaves].filter((chave) => nomes.has(chave));
  if (candidatas.length) return candidatas;

  const inteiro = limpar(titulo);
  const doisPontos = inteiro.indexOf(":");
  if (doisPontos > 0) {
    const prefixo = chaveDe(inteiro.slice(0, doisPontos));
    if (nomes.has(prefixo)) return [prefixo];
  }
  return [];
}

/**
 * O desempate, e por que ele não pode ser «o primeiro que aparecer»: o mais
 * FREQUENTE ganha, e frequência igual desempata pela chave. «Paiol Literário –
 * Homenagem» é do Paiol (44) e não da Homenagem (7); sem o segundo critério,
 * dois nomes de mesma frequência trocariam de dono entre builds e a mesma tela
 * mudaria de fileira sozinha.
 */
function maisFrequente(candidatas: string[], peso: Map<string, number>): string {
  return [...candidatas].sort(
    (a, b) => (peso.get(b) ?? 0) - (peso.get(a) ?? 0) || (a < b ? -1 : a > b ? 1 : 0),
  )[0];
}

/**
 * As fileiras de um conjunto de mídias — uma PARTIÇÃO, da maior para a menor.
 *
 * `rotuloDoResto` traduz a categoria crua do CMS no nome da fileira de sobra
 * («Outras séries»), e mora em `play.ts`, que é dono da tabela de rótulos.
 */
export function prateleirasDe<T extends ItemAgrupavel>(
  itens: readonly T[],
  rotuloDoResto: (categoria: string) => string,
): PrateleiraMontada<T>[] {
  const posicao = new Map(itens.map((item, i) => [item.slug, i]));
  const grupos = new Map<string, PrateleiraMontada<T>>();

  const guardar = (
    chave: string,
    monta: () => Omit<PrateleiraMontada<T>, "itens">,
    item: T,
  ) => {
    const existente = grupos.get(chave);
    if (existente) existente.itens.push(item);
    else grupos.set(chave, { ...monta(), itens: [item] });
  };

  // ---- 1. a coleção, pelo nome repetido no título --------------------------
  const { frequencia, rotulos } = nomesRepetidos(itens);
  const nomes = new Map([...frequencia].filter(([, n]) => n >= MINIMO_DA_FILEIRA));
  let resto: T[] = [];

  for (const item of itens) {
    const candidatas = nomesDoTitulo(item.titulo, nomes);
    if (!candidatas.length) {
      resto.push(item);
      continue;
    }
    const chave = maisFrequente(candidatas, nomes);
    const rotulo = rotulos.get(chave) ?? chave;
    guardar(`colecao:${chave}`, () => ({ valor: valorDoRotulo("c", rotulo), rotulo, origem: "colecao" }), item);
  }
  resto = devolverPequenas(grupos, resto);

  // ---- 2. o tema declarado -------------------------------------------------
  const temas = (vocabularioJson as Vocabulario).temas;
  const rotuloDoTema = new Map(temas.map((t) => [t.id, t.rotulo]));
  const frequenciaDeTema = new Map<string, number>();
  for (const item of resto) {
    for (const tema of new Set(item.temas)) {
      frequenciaDeTema.set(tema, (frequenciaDeTema.get(tema) ?? 0) + 1);
    }
  }
  const temasUteis = new Map(
    [...frequenciaDeTema].filter(([, n]) => n >= MINIMO_DA_FILEIRA),
  );

  const semTema: T[] = [];
  for (const item of resto) {
    const candidatos = [...new Set(item.temas)].filter((t) => temasUteis.has(t));
    if (!candidatos.length) {
      semTema.push(item);
      continue;
    }
    const tema = maisFrequente(candidatos, temasUteis);
    const rotulo = comMaiuscula(rotuloDoTema.get(tema) ?? tema);
    // Um tema cujo nome já é o de uma coleção entra NELA, e não numa fileira
    // gêmea ao lado: «IC para crianças» é coleção de 24 e tema de 5, e duas
    // fileiras com o mesmo nome na mesma tela leem como defeito.
    const gemea = [...grupos].find(([, g]) => chaveDe(g.rotulo) === chaveDe(rotulo));
    if (gemea) gemea[1].itens.push(item);
    else guardar(`tema:${tema}`, () => ({ valor: valorDoRotulo("t", rotulo), rotulo, origem: "tema" }), item);
  }
  resto = devolverPequenas(grupos, semTema);

  // ---- 3. a categoria, que é a fileira de sobra ----------------------------
  for (const item of resto) {
    const rotulo = rotuloDoResto(item.categoria);
    guardar(
      `categoria:${item.categoria}`,
      () => ({ valor: valorDoRotulo("g", item.categoria), rotulo, origem: "categoria" }),
      item,
    );
  }

  // A ordem das fileiras é o TAMANHO delas — como as prateleiras do /play sempre
  // foram —, e a ordem dentro de cada uma é a do catálogo, mesmo depois das
  // devoluções acima: sem isto, quem voltou entraria fora de data.
  const saida = [...grupos.values()].sort(
    (a, b) => b.itens.length - a.itens.length || (a.valor < b.valor ? -1 : 1),
  );
  for (const g of saida) {
    g.itens.sort((a, b) => (posicao.get(a.slug) ?? 0) - (posicao.get(b.slug) ?? 0));
  }
  return saida;
}

/**
 * O item que dá a CAPA da fileira: a ficha da própria coleção quando ela existe
 * no acervo («Mekukradjá» sozinho, que é a página do programa), e o mais recente
 * quando não existe. É escolha por ordem, nunca por gosto — nada de «a capa mais
 * bonita», que seria curadoria que ninguém fez.
 */
export function rostoDa<T extends ItemAgrupavel>(prateleira: PrateleiraMontada<T>): T {
  const ficha = prateleira.itens.find((i) => chaveDe(i.titulo) === chaveDe(prateleira.rotulo));
  return ficha ?? prateleira.itens[0];
}

/**
 * Uma fileira pode nascer frequente e terminar pequena, porque os itens dela
 * foram todos para uma fileira maior. Quando isso acontece ela não vira fileira
 * de um item: os itens voltam para a passada seguinte.
 *
 * A fileira de CATEGORIA não passa por aqui: ela é a última, e devolver dali
 * seria devolver para lugar nenhum.
 */
function devolverPequenas<T extends ItemAgrupavel>(
  grupos: Map<string, PrateleiraMontada<T>>,
  resto: T[],
): T[] {
  const devolvidos = [...resto];
  for (const [chave, grupo] of [...grupos]) {
    if (grupo.itens.length >= MINIMO_DA_FILEIRA) continue;
    devolvidos.push(...grupo.itens);
    grupos.delete(chave);
  }
  return devolvidos;
}
