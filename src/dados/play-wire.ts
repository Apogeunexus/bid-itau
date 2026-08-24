import type { Acessibilidade, DimensaoAcessibilidade } from "@/dados/tipos";

/**
 * play-wire.ts — o vocabulário POSICIONAL do catálogo do Play, escrito UMA vez.
 *
 * POR QUE ESTE ARQUIVO EXISTE, e por que ele não é um arquivo a mais. `play.ts` alcança o
 * grafo de 23 MB e por DP-F nenhum `"use client"` pode importá-lo por valor. Mas o
 * catálogo atravessa a fronteira em TUPLA, e uma tupla só tem sentido com o vocabulário
 * que diz o que é a posição 3. Se o produtor e o consumidor guardassem cada um a sua
 * cópia desse vocabulário, trocar duas posições de lugar **não quebraria o build** — só
 * passaria a mostrar a capa de uma mídia com o título de outra, em silêncio. É o mesmo
 * raciocínio, e a mesma solução, de `mapa-agenda-wire.ts` na onda 1 (05-01, desvio 3).
 *
 * A REGRA DESTE ARQUIVO: **zero import por valor**. Só `import type`. É isso que o torna
 * seguro para os dois lados de DP-F, e é o que o gate transitivo mede.
 *
 * POR QUE TUPLA E NÃO OBJETO NOMEADO — a aritmética, medida, não estimada. Com campo
 * nomeado o catálogo das 529 mede **98.524 bytes SEM O RESUMO** e 164.906 com ele. Só os
 * NOMES dos campos, repetidos 529 vezes, custam ~32 KB. Em tupla o mesmo conteúdo mede
 * 79 KB. O teto declarado do plano é 100 KB e ele é inalcançável em objeto nomeado por
 * aritmética, não por desleixo — exatamente como 05-01 mediu para o mapa da agenda.
 */

/**
 * As 8 dimensões, na ordem da estrutura da fonte — e esta ordem É o formato do fio: o
 * bit `i` da máscara é a dimensão `i` desta lista. Trocar duas de lugar aqui troca o
 * significado de toda máscara já serializada, então a ordem é contrato.
 *
 * `Record` completo de propósito: acrescentar dimensão em `tipos.ts` sem escrever o
 * rótulo aqui vira erro de compilação, e não uma tela que silenciosamente conta 8 de 9.
 * É a mesma disciplina de `ficha-acessibilidade.tsx`, que mantém a sua própria tabela —
 * a duplicação é deliberada: aquela folha é de servidor e não pode exportar valor para
 * um módulo que atravessa a fronteira do cliente sem arrastar a árvore dela junto.
 */
export const ROTULOS_DE_DIMENSAO: Record<DimensaoAcessibilidade, string> = {
  audio_description: "Audiodescrição",
  libras: "Libras",
  descriptive_subtitle: "Legenda descritiva",
  closed_caption: "Closed caption",
  open_caption: "Legenda aberta",
  simultaneous_translation: "Tradução simultânea",
  stenotypy: "Estenotipia",
  subtitle: "Legendagem",
};

/** A ordem canônica das dimensões. O índice nesta lista é o número do bit na máscara. */
export const DIMENSOES = Object.keys(ROTULOS_DE_DIMENSAO) as DimensaoAcessibilidade[];

/**
 * As três dimensões que a tela 19 pede como filtro — legenda, Libras e audiodescrição.
 *
 * Elas moram aqui, e não numa condicional espalhada pela tela, porque D-90 exige que as
 * três apareçam COM O NÚMERO AO LADO antes de qualquer marcação. Medido: `libras` recorta
 * 3 de 529 e as outras duas recortam ZERO. A tela não pode oferecê-las como três recortes
 * equivalentes — oferecer «audiodescrição» como filtro sem dizer que ele devolve nada é
 * prometer um acervo que não existe.
 */
export const DIMENSOES_DO_FILTRO: DimensaoAcessibilidade[] = [
  "subtitle",
  "libras",
  "audio_description",
];

/** Máscara de bits → os 8 booleanos nomeados. */
export function expandirAcessibilidade(mascara: number): Acessibilidade {
  const saida = {} as Acessibilidade;
  DIMENSOES.forEach((dimensao, i) => {
    saida[dimensao] = (mascara & (1 << i)) !== 0;
  });
  return saida;
}

/** Os 8 booleanos → máscara de bits. Inversa exata de `expandirAcessibilidade`. */
export function comprimirAcessibilidade(acessibilidade: Acessibilidade): number {
  return DIMENSOES.reduce(
    (acumulado, dimensao, i) => acumulado | (acessibilidade[dimensao] ? 1 << i : 0),
    0,
  );
}

/**
 * O item do catálogo NO FIO.
 *
 * Quatro campos do item nomeado NÃO viajam, porque são deriváveis e derivar custa zero:
 * `id` (não é usado no cliente — a chave do catálogo é o slug, e os 529 slugs são
 * únicos), `rota` (`/play/{slug}/`), `rotuloCategoria` (a tabela de rótulos viaja UMA
 * vez, não 529) e `procedencia` (as 529 são `ic`, sem exceção — repetir a constante 529
 * vezes custaria 10 KB para afirmar 529 vezes a mesma coisa).
 *
 * E um campo é CORTADO, não derivado: o `resumo`. Ver `CORTE_DO_RESUMO` em `play.ts`.
 */
export type ItemNoFio = readonly [
  /** 0 — slug, a chave do catálogo e o que compõe a rota. */
  slug: string,
  /** 1 — título. */
  titulo: string,
  /** 2 — índice em `CatalogoNoFio.categorias`. */
  categoria: number,
  /** 3 — o nome do arquivo em `/acervo/`, sem o diretório. Vazio quando não há imagem. */
  imagem: string,
  /** 4 — crédito da imagem. Vazio quando não há. Obrigatório quando há imagem. */
  creditoImagem: string,
  /** 5 — a data de publicação como número `AAAAMMDD`. Ver `NOTA_DA_DATA`. */
  dia: number,
  /** 6 — índices em `CatalogoNoFio.linguagens`. */
  linguagens: readonly number[],
  /** 7 — máscara das 8 dimensões de acessibilidade. */
  acessibilidade: number,
];

/**
 * A DATA VIAJA COMO NÚMERO `AAAAMMDD`, e não como string, por dois motivos que já
 * custaram tempo nesta obra:
 *
 * 1. **Comparação.** Ordenar e comparar datas entre os formatos `DD.MM.AAAA` e ISO está
 *    quebrado por construção, e a regra da casa é comparar por NÚMERO. `20241113` ordena
 *    corretamente com `<` sem uma linha de parsing.
 * 2. **Fuso.** O acervo grava `2024-11-13T14:00:00.000-03:00`. Construir um `Date` a
 *    partir disso e formatá-lo no cliente devolve um dia diferente conforme o fuso de
 *    quem avalia — e sob `output: "export"` o HTML foi gerado no build, então o dia do
 *    HTML e o dia da hidratação divergiriam. Cortando os 10 primeiros caracteres, o dia
 *    é o que a fonte escreveu, para todo mundo, sempre.
 */
export const NOTA_DA_DATA =
  "A data de publicação é a que o acervo declara, sem conversão de fuso.";

export function diaParaTexto(dia: number): string {
  const s = String(dia).padStart(8, "0");
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(0, 4)}`;
}

export function diaParaIso(dia: number): string {
  const s = String(dia).padStart(8, "0");
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/**
 * Os valores de `creditoImagem` que NÃO NOMEIAM NINGUÉM, medidos no acervo.
 *
 * «Foto: divulgação» não é crédito: é a etiqueta que o material de imprensa usa quando não
 * há autoria a declarar. Ela aparece em 175 das 529 mídias, e mais 17 trazem «frame de
 * vídeo» ou «frame do filme» — juntos, 36% do catálogo carregava uma linha de crédito que
 * não credita. Numa tela onde a capa sangra, essa linha é ruído embaixo de cada imagem.
 *
 * O QUE FICA: tudo que nomeia alguém ou alguma instituição — «Matheus Dias», «Agência
 * Ophelia», «Itaú Cultural», «Acervo Funarte». Crédito de verdade é obrigatório e não
 * negociável: o acervo é de terceiros e a procedência é argumento da proposta, não rodapé.
 * «Acervo pessoal» também fica: ele diz de ONDE a imagem veio, que é mais do que nada.
 *
 * A lista é fechada e escrita à mão porque foi MEDIDA, não adivinhada. Um valor novo que
 * também não credite passa a aparecer — e aparecer é o comportamento seguro: o erro de
 * mostrar um crédito a mais é menor que o de engolir a autoria de alguém.
 */
const CREDITOS_QUE_NAO_CREDITAM = new Set([
  "divulgacao",
  "frame de video",
  "frame do filme",
  "reproducao",
  "sem credito",
]);

/** O crédito quando ele nomeia alguém; `undefined` quando não nomeia. */
export function creditoQueCredita(credito?: string): string | undefined {
  if (!credito) return undefined;
  const chave = credito
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    // `\p{M}` e não uma faixa escrita à mão: a faixa exigiria acentos combinantes
    // literais no código, que são invisíveis no editor e no diff.
    .replace(/\p{M}/gu, "");
  return CREDITOS_QUE_NAO_CREDITAM.has(chave) ? undefined : credito;
}

/** Uma categoria do acervo, contada. `valor` é a chave crua do CMS; `rotulo` é a tela. */
export interface CategoriaContada {
  valor: string;
  rotulo: string;
  n: number;
}

/** Uma dimensão de acessibilidade contada sobre as 529. */
export interface DimensaoContada {
  campo: DimensaoAcessibilidade;
  rotulo: string;
  n: number;
  de: number;
  /** Falso quando `n` é zero: o acervo não sustenta este recorte, e a tela declara. */
  sustentada: boolean;
}

/**
 * Uma FILEIRA da vitrine — a coleção, o tema ou a categoria de sobra que reúne
 * um punhado de mídias. Como ela é derivada está em `prateleiras.ts`.
 *
 * Os itens viajam como ÍNDICE em `CatalogoNoFio.itens`, e não como slug: o slug
 * já viajou uma vez dentro do item, e repeti-lo aqui custaria ~8 KB para dizer
 * de novo o que a posição diz de graça. A ESTRUTURA É A FILEIRA — não há uma
 * segunda passada de agrupamento no cliente para divergir da que o build
 * conferiu.
 */
export interface PrateleiraNoFio {
  /** Chave estável para o estado do recorte e para `data-prateleira`. */
  valor: string;
  rotulo: string;
  /** Índices em `CatalogoNoFio.itens`, na ordem do catálogo (mais recente primeiro). */
  itens: readonly number[];
  /** O índice do item que dá a capa da fileira. Ver `rostoDa` em `prateleiras.ts`. */
  rosto: number;
}

/** O catálogo inteiro como ele atravessa a fronteira RSC. */
export interface CatalogoNoFio {
  itens: readonly ItemNoFio[];
  categorias: readonly CategoriaContada[];
  /** As fileiras da vitrine. Somam `total` e nenhum item aparece em duas. */
  prateleiras: readonly PrateleiraNoFio[];
  /** O vocabulário de linguagens, indexado pela posição. */
  linguagens: readonly string[];
  /** Quantas mídias o acervo tem, contadas. */
  total: number;
  /** Bytes medidos deste objeto, e o teto. A tela os declara. */
  bytes: number;
  teto: number;
}

/**
 * A PEÇA DE DESTAQUE — a mídia que abre a vitrine.
 *
 * Ela viaja NOMEADA e com o `resumo`, contra a regra do catálogo, e a exceção é
 * aritmética: a tupla existe porque o nome do campo repetido 113 vezes custa ~7 KB e o
 * resumo das 113 custa ~11 KB. Aqui é UM item — o nome custa ~120 bytes e o resumo
 * ~200. Comprimir isso seria pagar a complexidade da tupla para economizar 0,3% do
 * orçamento, e a peça que abre a tela é justamente onde o resumo trabalha.
 *
 * Quem escolhe qual é o destaque é `play.ts`, e a escolha é ORDEM, não curadoria: a mais
 * recente do recorte. Uma «seleção editorial» aqui seria uma afirmação sobre o acervo que
 * ninguém fez.
 */
export interface DestaqueNoFio {
  slug: string;
  titulo: string;
  rota: string;
  rotuloCategoria: string;
  resumo: string;
  imagem?: string;
  creditoImagem?: string;
  /** A data de publicação como número `AAAAMMDD`. Ver `NOTA_DA_DATA`. */
  dia: number;
}

/** O item do catálogo já nomeado — é isto que o componente manipula. */
export interface ItemDoPlayNoCliente {
  slug: string;
  titulo: string;
  rota: string;
  categoria: string;
  rotuloCategoria: string;
  imagem?: string;
  creditoImagem?: string;
  dia: number;
  linguagens: string[];
  acessibilidade: Acessibilidade;
  mascara: number;
}

/**
 * Tupla → objeto nomeado. Custo zero de fio: acontece no cliente, uma vez, e o que
 * viajou foi só a posição.
 */
export function expandirItem(
  fio: ItemNoFio,
  categorias: readonly CategoriaContada[],
  linguagens: readonly string[],
): ItemDoPlayNoCliente {
  const [slug, titulo, categoria, imagem, creditoImagem, dia, ling, mascara] = fio;
  const cat = categorias[categoria];
  return {
    slug,
    titulo,
    rota: `/play/${slug}/`,
    categoria: cat?.valor ?? "",
    rotuloCategoria: cat?.rotulo ?? "",
    imagem: imagem ? `/acervo/${imagem}` : undefined,
    creditoImagem: creditoImagem || undefined,
    dia,
    linguagens: ling.map((i) => linguagens[i]).filter(Boolean),
    acessibilidade: expandirAcessibilidade(mascara),
    mascara,
  };
}
