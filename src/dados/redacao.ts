/**
 * redacao.ts — o dado da Redação: o editor de trilha curada (tela 35, D-85 e D-86).
 *
 * A FILA DE MODERAÇÃO SAIU DAQUI. Ela mora em `moderacao.ts` desde a tarefa 1 da S3, e a
 * separação é de território: a fila é do moderador (níveis 3 e 4), a trilha é do editor
 * (nível 5), e duas sessões editando o mesmo arquivo é a colisão que o merge não resolve.
 * O que a trilha ainda consome — o carimbo da decisão e os três limites da IA — é
 * REEXPORTADO daqui, para `redacao/trilha` continuar importando de um lugar só.
 *
 * DP-F: roda NO BUILD. Alcança `grafo.ts` (23 MB de JSON) por `trilha.ts`, por `motivo.ts`
 * e diretamente. NENHUM arquivo `"use client"` pode importar este módulo por valor — o que
 * atravessa a fronteira são os DTOs abaixo, que são só primitivo. D-47: toda leitura do
 * acervo passa por `grafo.ts`, nunca por `entidades.json`.
 *
 * O QUE ESTE MÓDULO NÃO FAZ, E É O PONTO. Ele NÃO reescreve a travessia da trilha.
 * `passosParaEditor` é construído SOBRE `passosDaTrilha` e `trilhaCompletaPorSlug` de
 * `trilha.ts`, e o campo `motivo` que ele devolve é o MESMO campo `PassoTrilha.motivo` que
 * `/trilha/[slug]/` imprime no selo público. D-85 exige que as duas pontas concordem
 * caractere a caractere; a única forma de garantir isso é elas lerem a mesma fonte, e não
 * duas cópias que divergem na primeira edição. Uma segunda travessia escrita aqui seria
 * exatamente o defeito.
 */

import { contagens, porId, porSlug, slugsPorTipo, vizinhos } from "./grafo";
import { motivoDaAresta } from "./motivo";
import { DATA_DE_REFERENCIA } from "./alerta";
import { trilhaCompletaPorSlug, trilhaEhPublicavel, trilhas } from "./trilha";
import { CARIMBO_DA_DECISAO, LIMITES_DA_IA, TETO_DO_DTO, numerosDaModeracao } from "./moderacao";
import type { NumerosDaModeracao } from "./moderacao";
import type { OrigemMotivo } from "./cartao";
import type { ClasseEntidade, Entidade, Procedencia, Relacao } from "./tipos";

/**
 * O que a Redação consome da Moderação, reexportado para a tela da trilha importar de um
 * lugar só. São CONSTANTES DE TEXTO E DE NÚMERO, não regra: o carimbo tem uma definição
 * só no projeto — duas derivações da data de referência divergiriam na primeira vez que
 * alguém mudasse a hora autorada em uma delas.
 */
export { CARIMBO_DA_DECISAO, LIMITES_DA_IA, TETO_DO_DTO };

/** A data de referência do build. NUNCA o relógio do runtime (T-03-10). */
export const DATA_DE_REFERENCIA_DA_REDACAO = DATA_DE_REFERENCIA;

/**
 * Quem assina a trilha. D-25: **não há autenticação neste protótipo**. O nome é autorado e
 * a tela diz que é — ele está aqui para mostrar que a curadoria FICA ASSINADA, não para
 * simular um login que o protótipo não tem. O perfil da Moderação é outro
 * (`MODERADOR_AUTORADO`, em `moderacao.ts`): são níveis de acesso diferentes, e um perfil
 * só para os dois apagaria justamente a distinção que o bastidor existe para provar.
 */
export const CURADOR_AUTORADO = "Redação · curadoria editorial (perfil autorado)";

export const CURADOR_E_AUTORADO =
  "Não há autenticação neste protótipo. O nome de quem assina é autorado e aparece " +
  "rotulado, em vez de simular um login: o que esta tela precisa provar é que toda " +
  "curadoria fica registrada com autor e carimbo, e não que sabemos quem está do outro " +
  `lado. O carimbo é derivado da data de referência do build (${DATA_DE_REFERENCIA}), ` +
  "nunca do relógio de quem abre a página.";

/** Comparação por ponto de código, estável entre plataformas — nunca `localeCompare`. */
function porIdEstavel(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Amostra com passo fixo. `n >= lista.length` devolve a lista inteira. */
function amostrar<T>(lista: readonly T[], n: number): T[] {
  if (lista.length <= n) return [...lista];
  const passo = Math.floor(lista.length / n);
  const saida: T[] = [];
  for (let i = 0; i < n; i++) saida.push(lista[i * passo]);
  return saida;
}
// ---------------------------------------------------------------------------
// D-85 — os passos da trilha, LIDOS DE `trilha.ts` e não reescritos aqui
// ---------------------------------------------------------------------------

export interface PassoDoEditor {
  /** Chave estável do passo no editor. */
  chave: string;
  ordem: number;
  deId: string;
  deTitulo: string;
  deClasse: ClasseEntidade;
  paraId: string;
  paraTitulo: string;
  paraClasse: ClasseEntidade;
  relacao: Relacao | null;
  /**
   * **O MESMO campo `PassoTrilha.motivo` que `/trilha/[slug]/` imprime no selo público.**
   * Não é cópia, não é reformatação, não tem prefixo: é o objeto atravessando. É por
   * construção, e não por disciplina, que os dois textos batem caractere a caractere
   * (D-85) — e 05-08 compara os dois.
   */
  motivo: string;
  origemMotivo: OrigemMotivo;
  procedenciaAresta: Procedencia | null;
  /** `true` nos passos que vieram do acervo; o editor acrescenta passos com `false`. */
  doAcervo: boolean;
}

export interface TrilhaDoEditor {
  slug: string;
  titulo: string;
  resumo: string | null;
  assinatura: string;
  /** Publicabilidade pelas TRÊS regras que `trilhaEhPublicavel` já cobre. */
  publicavelNoAcervo: boolean;
  motivoNaoPublicavelNoAcervo: string | null;
  passos: PassoDoEditor[];
}

/**
 * Os passos de uma trilha, prontos para o editor.
 *
 * Construído SOBRE `passosDaTrilha`. A tentação seria reimplementar a travessia aqui, com
 * os campos que o editor quer; o custo disso não é código duplicado, é o selo público e o
 * campo do editor virarem duas strings diferentes na primeira vez que alguém mexer numa
 * das duas. D-85 diz que as duas pontas concordam, e concordância por cópia é concordância
 * até a próxima edição.
 */
export function passosParaEditor(slug: string): PassoDoEditor[] {
  const completa = trilhaCompletaPorSlug(slug);
  if (!completa) {
    throw new Error(
      `redacao.ts: nenhuma trilha do acervo responde por «${slug}». O editor de trilha da ` +
        "tela 35 abre sobre a trilha existente do acervo, e uma trilha ausente aqui " +
        "significa que a fonte mudou por baixo — melhor parar de compilar que abrir um " +
        "editor vazio que parece funcionar.",
    );
  }

  return completa.passos.map((p) => {
    // `PassoTrilha.motivo` é documentado como NUNCA VAZIO. Um motivo vazio chegando aqui
    // significa que `motivo.ts` ou `trilha.ts` mudaram por baixo, e o desfecho seria um
    // selo em branco publicado ao público. Parar de compilar é melhor.
    if (!p.motivo || !p.motivo.trim()) {
      throw new Error(
        `redacao.ts: o passo ${p.ordem} da trilha «${slug}» chegou com motivo vazio. ` +
          "`PassoTrilha.motivo` é documentado como nunca vazio e é ele que vira o selo " +
          "público em /trilha/[slug]/. Um motivo vazio aqui publicaria um selo em " +
          "branco. CORRIJA a fonte em trilha.ts/motivo.ts — não relaxe esta conferência.",
      );
    }
    return {
      chave: `passo:${p.ordem}:${p.de.id}->${p.para.id}`,
      ordem: p.ordem,
      deId: p.de.id,
      deTitulo: p.de.titulo,
      deClasse: p.de.classe,
      paraId: p.para.id,
      paraTitulo: p.para.titulo,
      paraClasse: p.para.classe,
      relacao: p.relacao,
      motivo: p.motivo,
      origemMotivo: p.origemMotivo,
      procedenciaAresta: p.procedenciaAresta,
      doAcervo: true,
    };
  });
}

/** O slug da trilha que o editor abre. Fixado em constante, nunca sorteado a cada build. */
export function slugDaTrilhaDoEditor(): string {
  const todas = trilhas();
  if (!todas.length) {
    throw new Error(
      "redacao.ts: o grafo não tem nenhuma trilha. A tela 35 edita a trilha do traçador " +
        "da fase 2, e sem ela o editor não tem sobre o que abrir.",
    );
  }
  return todas[0].slug;
}

export function trilhaParaEditor(slug: string): TrilhaDoEditor {
  const completa = trilhaCompletaPorSlug(slug);
  if (!completa) {
    throw new Error(`redacao.ts: trilha «${slug}» não existe no acervo.`);
  }
  const pub = trilhaEhPublicavel(completa.id);
  return {
    slug: completa.slug,
    titulo: completa.titulo,
    resumo: completa.resumo ?? null,
    assinatura: completa.assinatura,
    publicavelNoAcervo: pub.publicavel,
    motivoNaoPublicavelNoAcervo: pub.motivo,
    passos: passosParaEditor(slug),
  };
}

/**
 * A QUARTA regra de publicabilidade, que é a deste plano.
 *
 * As três primeiras — cadeia vazia, cadeia que não termina em evento, evento sem sessão
 * datada — moram em `trilhaEhPublicavel` desde a fase 2 e são consumidas de lá, não
 * reimplementadas. Esta soma a de D-85: passo sem motivo não publica. Ela é a única que o
 * editor pode CRIAR, porque é a única que depende do que o curador acabou de fazer.
 */
export const REGRA_DO_MOTIVO_OBRIGATORIO =
  "Um passo sem motivo escrito impede a publicação da trilha inteira. O motivo não é nota " +
  "interna: é o texto que aparece ao público como selo do passo em Descobrir, e uma trilha " +
  "que publica um selo em branco entrega ao leitor uma ponte sem explicação. As outras três " +
  "regras de publicabilidade — cadeia vazia, cadeia que não termina em evento, evento sem " +
  "sessão datada — vêm de `trilhaEhPublicavel`, da fase 2, e não são reescritas aqui.";

// ---------------------------------------------------------------------------
// D-86 — a sugestão de próximo passo, e o que ela NÃO é
// ---------------------------------------------------------------------------

export interface SugestaoDeProximoPasso {
  entidadeId: string;
  titulo: string;
  classe: ClasseEntidade;
  relacao: Relacao;
  /** A frase DA ARESTA, por `motivoDaAresta`. Não é texto de modelo. */
  motivo: string;
  origemMotivo: OrigemMotivo;
  procedenciaAresta: Procedencia;
  /** De qual nó a travessia partiu — o último da cadeia. */
  aPartirDeId: string;
  aPartirDeTitulo: string;
  /** A regra determinística que produziu esta sugestão, para a tela imprimir ao lado. */
  regra: string;
}

export const REGRA_DA_SUGESTAO =
  "A sugestão de próximo passo é TRAVESSIA DO GRAFO, não modelo: a partir do último nó da " +
  "cadeia, o vizinho de maior preferência de relação que ainda não está na trilha, com a " +
  "frase da própria ligação como justificativa. É determinística — a mesma trilha produz " +
  "sempre a mesma sugestão — e é sempre descartável: nenhuma sugestão entra na trilha sem " +
  "um clique humano.";

export function sugestaoDeProximoPasso(slug: string): SugestaoDeProximoPasso | null {
  const passos = passosParaEditor(slug);
  if (!passos.length) return null;

  const ultimoId = passos[passos.length - 1].paraId;
  const jaNaTrilha = new Set<string>([passos[0].deId, ...passos.map((p) => p.paraId)]);
  const ultimo = porId(ultimoId);
  if (!ultimo) return null;

  // `vizinhos()` já devolve a adjacência ordenada por preferência de relação, então o
  // primeiro que não está na trilha É a escolha — não há segundo critério escondido.
  for (const v of vizinhos(ultimoId)) {
    if (jaNaTrilha.has(v.entidade.id)) continue;
    if (v.entidade.classe === "ocorrencia" || v.entidade.classe === "temporada") continue;
    const ladoDe = porId(v.aresta.de) ?? ultimo;
    const ladoPara = porId(v.aresta.para) ?? v.entidade;
    const m = motivoDaAresta(v.aresta, ladoDe, ladoPara);
    return {
      entidadeId: v.entidade.id,
      titulo: v.entidade.titulo,
      classe: v.entidade.classe,
      relacao: v.aresta.relacao,
      motivo: m.texto,
      origemMotivo: m.origemMotivo,
      procedenciaAresta: v.aresta.procedencia,
      aPartirDeId: ultimoId,
      aPartirDeTitulo: ultimo.titulo,
      regra: REGRA_DA_SUGESTAO,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// O catálogo de arrasto — e o peso dele, medido
// ---------------------------------------------------------------------------

export interface CandidatoDoCatalogo {
  id: string;
  titulo: string;
  classe: ClasseEntidade;
}

export interface CatalogoDeArrasto {
  itens: CandidatoDoCatalogo[];
  /** O grafo inteiro. É o denominador honesto da frase da tela. */
  total: number;
  /** Quantos passam na regra do recorte, ANTES do teto. */
  elegiveis: number;
  regra: string;
}

/** As classes que o catálogo varre. `ocorrencia` fica fora: ela não é passo de trilha. */
const CLASSES_DO_CATALOGO: readonly ClasseEntidade[] = [
  "pessoa",
  "coletivo",
  "instituicao",
  "espaco",
  "obra",
  "termo",
  "programa",
  "evento",
  "temporada",
  "conteudo",
  "midia",
  "publicacao",
  "formacao",
  "linguagem",
  "tema",
  "territorio",
  "trilha",
];
// `pessoa-usuaria` e `repertorio` ficam fora pelo mesmo motivo de
// `CLASSES_QUE_NAO_SE_PUBLICAM`: uma trilha curada não tem como passo a lista de salvos
// de alguém. `ocorrencia` também não está aqui — ela é uma sessão datada, não um nó de
// travessia.

/** Quantos candidatos viajam. Medido contra o teto de 60 KB do plano. */
export const TETO_DO_CATALOGO = 150;

/**
 * O grafo inteiro, CONTADO e não digitado. É o denominador da frase «N de 7.810» na tela,
 * e um número escrito à mão passaria a mentir na primeira regeração do grafo — que é
 * exatamente o defeito que a frase existe para não ter.
 */
export const TOTAL_DE_ENTIDADES = Object.values(contagens().porClasse).reduce(
  (a, b) => a + b,
  0,
);

function comPonto(n: number): string {
  return n.toLocaleString("pt-BR").replace(/ /g, " ");
}

export const REGRA_DO_CATALOGO =
  `O grafo tem ${comPonto(TOTAL_DE_ENTIDADES)} entidades e mandar todas ao navegador ` +
  "estoura o orçamento de 60 KB deste plano por uma ordem de grandeza. O catálogo recorta " +
  "por regra declarada — entidade " +
  "com resumo de pelo menos 60 caracteres e grau 2 ou mais no acervo, para o curador poder " +
  "julgar o candidato e para o passo ter ponte de onde sair — e depois amostra com passo " +
  "fixo sobre a ordem de `id`, atravessando todas as classes. A tela diz «N de " +
  `${comPonto(TOTAL_DE_ENTIDADES)}», e não «o grafo completo»: dizer «completo» sobre um ` +
  "recorte seria a mentira barata que esta obra recusa.";

let catalogoMemo: CatalogoDeArrasto | null = null;

export function catalogoParaArrastar(): CatalogoDeArrasto {
  if (catalogoMemo) return catalogoMemo;

  const todas: Entidade[] = [];
  for (const classe of CLASSES_DO_CATALOGO) {
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      if (e) todas.push(e);
    }
  }

  const elegiveis = todas
    .filter((e) => (e.resumo ?? "").length >= 60 && vizinhos(e.id).length >= 2)
    .sort(porIdEstavel);

  catalogoMemo = {
    itens: amostrar(elegiveis, TETO_DO_CATALOGO).map((e) => ({
      id: e.id,
      titulo: e.titulo,
      classe: e.classe,
    })),
    total: TOTAL_DE_ENTIDADES,
    elegiveis: elegiveis.length,
    regra: REGRA_DO_CATALOGO,
  };
  return catalogoMemo;
}

// ---------------------------------------------------------------------------
// Os números — o que a tela cita e o que 05-08 mede contra ela
// ---------------------------------------------------------------------------

/**
 * Os números das DUAS superfícies, no formato que a sonda de 05-08 já lê.
 *
 * Os campos da fila chegam de `numerosDaModeracao()` e não são recalculados aqui: são a
 * mesma contagem, sobre o mesmo dado, e uma segunda soma escrita neste arquivo divergiria
 * da primeira no dia em que a fila mudasse de tamanho — que é exatamente o defeito que os
 * números medidos existem para não ter. O que este módulo acrescenta é o que é dele: os
 * passos da trilha e o catálogo de arrasto.
 */
export interface NumerosDaRedacao extends NumerosDaModeracao {
  passosDaTrilha: number;
  passosComMotivo: number;
  catalogoItens: number;
  catalogoElegiveis: number;
  catalogoTotal: number;
  /** Os bytes do DTO da TELA DA TRILHA — o catálogo. A fila é medida em `moderacao.ts`. */
  bytesDoCatalogo: number;
}

let numerosMemo: NumerosDaRedacao | null = null;

export function numerosDaRedacao(): NumerosDaRedacao {
  if (numerosMemo) return numerosMemo;

  const catalogo = catalogoParaArrastar();
  const slug = slugDaTrilhaDoEditor();
  const passos = passosParaEditor(slug);

  // O MESMO objeto que a página da trilha passa ao componente. Medir outra coisa mediria
  // outra coisa: foi assim que 05-01 descobriu, tarde, que o DTO dele tinha 148 KB.
  const bytesDoCatalogo = JSON.stringify({ cat: catalogo }).length;
  if (bytesDoCatalogo > TETO_DO_DTO) {
    throw new Error(
      `redacao.ts: o DTO do catálogo ficou com ${bytesDoCatalogo} bytes, acima do teto ` +
        `declarado de ${TETO_DO_DTO} (60 KB, orçamento de uma página). REDUZA ` +
        `TETO_DO_CATALOGO (${TETO_DO_CATALOGO}) — não relaxe o teto: ele é o que impede as ` +
        "7.810 entidades de irem para o navegador.",
    );
  }

  numerosMemo = {
    ...numerosDaModeracao(),
    passosDaTrilha: passos.length,
    passosComMotivo: passos.filter((p) => p.motivo.trim().length > 0).length,
    catalogoItens: catalogo.itens.length,
    catalogoElegiveis: catalogo.elegiveis,
    catalogoTotal: catalogo.total,
    bytesDoCatalogo,
  };
  return numerosMemo;
}
