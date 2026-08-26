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

import { contagens, ocorrenciasDe, porId, porSlug, slugsPorTipo, vizinhos } from "./grafo";
import { motivoDaAresta } from "./motivo";
import { DATA_DE_REFERENCIA } from "./alerta";
import meta from "./gerado/meta.json";
import { trilhaCompletaPorSlug, trilhaEhPublicavel, trilhas } from "./trilha";
import { CARIMBO_DA_DECISAO, LIMITES_DA_IA, TETO_DO_DTO, numerosDaModeracao } from "./moderacao";
import type { NumerosDaModeracao } from "./moderacao";
import type { OrigemMotivo } from "./cartao";
import { POSICAO_CURADO, POSICAO_SERENDIPIDADE, montarFeed } from "./caminhada";
import { PERSONAS } from "./personas";
import { comoSeLe } from "./redacao-registro";
import { rotaDaEntidade } from "./rotas";
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

export const DATA_DE_REFERENCIA_LEGIVEL = comoSeLe(DATA_DE_REFERENCIA);

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
  `lado. O carimbo é derivado da data de referência do build (${comoSeLe(DATA_DE_REFERENCIA)}), ` +
  "nunca do relógio de quem abre a página.";

/**
 * As sessões datadas de um nó, para as regras 2 e 3 da publicabilidade viajarem como FATO.
 *
 * `null` quando o nó não é evento: a pergunta não se aplica, e um `0` ali seria lido como
 * «é evento e não tem sessão», que é outra coisa. Ver `REGRA_DO_DESTINO`.
 */
function sessoesDatadasDe(id: string, classe: ClasseEntidade): number | null {
  return classe === "evento" ? ocorrenciasDe(id).length : null;
}

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
  /**
   * Quantas sessões datadas o acervo publica para o nó de destino. `null` quando ele não
   * é `evento` — e `null` é «a pergunta não se aplica», nunca «não tem»: ler ausência
   * como declaração é o erro exato que a seção 10 da ontologia proíbe.
   *
   * Ele existe porque o editor REORDENA, e reordenar troca qual nó é o último da cadeia —
   * que é a única coisa de que as regras 2 e 3 da publicabilidade dependem. O número vem
   * de `ocorrenciasDe`, a MESMA função que `destinoFinal` chama dentro de `trilha.ts`:
   * não é uma segunda contagem, é a mesma leitura atravessando o DTO.
   */
  paraSessoesDatadas: number | null;
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
      paraSessoesDatadas: sessoesDatadasDe(p.para.id, p.para.classe),
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

/**
 * A REGRA DO DESTINO — e por que ela viaja como texto em vez de como código.
 *
 * Duas das três regras da fase 2 dependem SÓ do último nó da cadeia: ele tem de ser
 * `evento`, e o acervo tem de publicar sessão datada para ele. O editor reordena passos, e
 * reordenar troca qual nó é o último — então o veredito que `trilhaEhPublicavel` calculou
 * no build, para a ordem original, deixa de responder pela cadeia que está na tela.
 *
 * O cliente NÃO pode chamar `trilhaEhPublicavel`: ela alcança 23 MB de grafo, e DP-F proíbe
 * um arquivo `"use client"` de importar este módulo por valor. A saída é mandar o FATO que
 * a regra lê — `paraClasse` e `paraSessoesDatadas`, os dois medidos pelas mesmas funções de
 * `grafo.ts` que `trilha.ts` usa — e deixar o cliente aplicar o mesmo teste sobre ele.
 *
 * O QUE ISSO NÃO É: uma segunda definição da regra. A regra continua uma só, em
 * `trilhaEhPublicavel`, e é ela que decide a trilha do acervo — o campo
 * `motivoNaoPublicavelNoAcervo` chega daqui VERBATIM e é o que a tela mostra enquanto a
 * cadeia não muda. O que o cliente avalia é a cadeia REORDENADA, que não existe no acervo e
 * sobre a qual `trilhaEhPublicavel` não tem o que dizer. A frase abaixo é a explicação
 * dessa avaliação, escrita uma vez e citada na tela — e não uma cópia da prosa de
 * `trilha.ts`, que ficaria divergindo dela na primeira edição.
 */
export const REGRA_DO_DESTINO =
  "Uma trilha de primeira vez termina em algo a que se possa IR, com data — é a regra da " +
  "fase 2, e ela vive em `trilhaEhPublicavel`. Enquanto a cadeia está na ordem do acervo, " +
  "quem responde por ela é o veredito do acervo, com a frase que veio de lá. Ao reordenar " +
  "ou acrescentar passos, o curador monta uma cadeia que o acervo não conhece: aí a tela " +
  "aplica a MESMA regra sobre os fatos que vieram medidos do grafo — a classe do último nó " +
  "e quantas sessões datadas o acervo publica para ele. A regra não é reescrita; o que " +
  "muda é a cadeia sobre a qual ela é lida.";

// ---------------------------------------------------------------------------
// D-86 — a sugestão de próximo passo, e o que ela NÃO é
// ---------------------------------------------------------------------------

export interface SugestaoDeProximoPasso {
  entidadeId: string;
  titulo: string;
  classe: ClasseEntidade;
  /** Ver `PassoDoEditor.paraSessoesDatadas`: aceitar a sugestão a põe no fim da cadeia. */
  sessoesDatadas: number | null;
  /** Ver `CandidatoDoCatalogo.slug`: a sugestão vira candidato quando o curador aceita. */
  slug: string;
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
      sessoesDatadas: sessoesDatadasDe(v.entidade.id, v.entidade.classe),
      slug: v.entidade.slug,
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
  /**
   * O slug, e ele viaja por um motivo só: sem ele a E9 não consegue montar o endereço
   * público da entidade, e o «onde esta afirmação aparece ao público» que ela promete
   * viraria uma frase sem link. `rotaDaEntidade` precisa de classe E slug.
   */
  slug: string;
  /** Ver `PassoDoEditor.paraSessoesDatadas`: qualquer candidato pode virar o último passo. */
  sessoesDatadas: number | null;
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
      slug: e.slug,
      sessoesDatadas: sessoesDatadasDe(e.id, e.classe),
    })),
    total: TOTAL_DE_ENTIDADES,
    elegiveis: elegiveis.length,
    regra: REGRA_DO_CATALOGO,
  };
  return catalogoMemo;
}

// ---------------------------------------------------------------------------
// E3 — as arestas de sentido, que é onde o Editor AFIRMA
// ---------------------------------------------------------------------------

/**
 * A FRONTEIRA, e ela é a razão de ser desta tela.
 *
 * Os outros níveis escrevem fato, decisão ou regra. O Editor escreve AFIRMAÇÃO — «o rap
 * dialoga com o slam» não está em fonte nenhuma, e nenhuma fonte pode confirmá-la. É por
 * isso que ela sai assinada, e é por isso que a linha existe: autorar uma ponte de sentido
 * entre duas entidades é afirmação editorial, rotulada e defensável; autorar fato sobre
 * pessoa real — elenco, data, presença — seria afirmação factual falsa, de outra ordem. A
 * equipe recusou a segunda desde o plano 02-01 e manteve a primeira. Esta tela opera
 * exatamente essa fronteira, e a imprime em vez de confiar que quem usa já sabe.
 */
export const FRONTEIRA_DA_AFIRMACAO =
  "Autorar uma ponte de sentido entre duas entidades é afirmação editorial: ela é rotulada " +
  "como autorada, sai assinada e pode ser defendida ou contestada por quem a lê. Autorar " +
  "fato sobre pessoa real — quem atuou, quando, onde — seria outra coisa, e esta tela não " +
  "faz isso: nenhuma relação daqui declara acontecimento, e as que declarariam não estão " +
  "nesta lista.";

/**
 * O motivo obrigatório em TODAS, e por que o tipo base não basta.
 *
 * `tipos.ts` obriga `motivo` só em `semelhante_a` — porque ali são 47.259 arestas de
 * máquina e a frase é o único jeito de o leitor saber por que aquilo apareceu. Nas quatro
 * do Editor o tipo não obriga, e é justamente onde a obrigação importa mais: são as únicas
 * arestas do grafo que uma pessoa afirmou. Esta sessão obriga em todas, e a regra mais dura
 * é a que vale.
 */
export const REGRA_DO_MOTIVO_DA_PONTE =
  "Toda ponte escrita aqui carrega motivo em português legível e assinatura, sem exceção. " +
  "O tipo base obriga o motivo só em `semelhante_a`; esta tela obriga nas cinco, porque uma " +
  "afirmação sem justificativa não é curadoria — é uma linha no banco que ninguém consegue " +
  "contestar. O texto que o curador escreve aqui é o MESMO que aparece ao público no selo " +
  "da ligação, como na trilha.";

export interface RelacaoDeSentido {
  relacao: Relacao;
  rotulo: string;
  /** O que a aresta AFIRMA, em português, para o curador escolher sabendo o que assina. */
  afirma: string;
  /** Quantas existem no acervo hoje. `0` é o número mais importante desta tela. */
  instancias: number;
}

/**
 * As cinco relações que o Editor autora, com a contagem MEDIDA de `meta.json`.
 *
 * Três delas — `influenciou`, `deriva_de` e `curou` — estão no vocabulário fechado, o motor
 * de caminhada as percorre, e o acervo tem ZERO. Não é lacuna do protótipo: é a descrição
 * exata do buraco que o nível 5 existe para fechar. O número vem da contagem e não da mão:
 * uma relação que saia do zero muda a tela sem ninguém tocar em código, que é o ponto.
 */
const INSTANCIAS_POR_RELACAO = meta.porRelacao as Partial<Record<Relacao, number>>;

export const RELACOES_DE_SENTIDO: readonly RelacaoDeSentido[] = [
  {
    relacao: "influenciou",
    rotulo: "influenciou",
    afirma: "o primeiro deixou marca no segundo — é afirmação de linhagem, não de contato",
    instancias: INSTANCIAS_POR_RELACAO.influenciou ?? 0,
  },
  {
    relacao: "dialoga_com",
    rotulo: "dialoga com",
    afirma: "os dois se respondem, sem que um venha do outro — é a ponte simétrica",
    instancias: INSTANCIAS_POR_RELACAO.dialoga_com ?? 0,
  },
  {
    relacao: "deriva_de",
    rotulo: "deriva de",
    afirma: "o primeiro nasce do segundo — é filiação declarada, mais forte que influência",
    instancias: INSTANCIAS_POR_RELACAO.deriva_de ?? 0,
  },
  {
    relacao: "curou",
    rotulo: "curou",
    afirma: "o primeiro assinou a seleção do segundo — é atribuição de curadoria",
    instancias: INSTANCIAS_POR_RELACAO.curou ?? 0,
  },
  {
    relacao: "semelhante_a",
    rotulo: "semelhante a",
    afirma:
      "os dois se parecem, e aqui a semelhança é AFIRMADA por pessoa — as 47 mil do acervo " +
      "são de máquina e nenhuma foi revisada",
    instancias: INSTANCIAS_POR_RELACAO.semelhante_a ?? 0,
  },
];

/** O peso da autoria no grafo, medido. É o denominador honesto da frase da tela. */
export interface PesoDaAutoria {
  arestasAutoradas: number;
  arestasTotal: number;
  nosAutorados: number;
  nosTotal: number;
}

export const PESO_DA_AUTORIA: PesoDaAutoria = {
  arestasAutoradas: meta.porProcedenciaDeAresta.autorado,
  arestasTotal: meta.totais.arestas,
  nosAutorados: meta.porProcedencia.autorado,
  nosTotal: meta.totais.entidades,
};

/**
 * Uma ponte autorada, pronta para a tela e para o registro.
 *
 * `motivo` é obrigatório no TIPO, e não só na validação: um campo opcional aqui deixaria o
 * compilador aceitar a ponte sem justificativa, e a regra passaria a depender de quem
 * escreve a próxima tela lembrar dela. `assinatura` e `carimbo` pelo mesmo motivo — uma
 * afirmação sem autor não é contestável, e o que não é contestável não é curadoria.
 */
export interface ArestaAutorada {
  deId: string;
  deTitulo: string;
  deClasse: ClasseEntidade;
  /** `null` em registro gravado antes de o slug viajar — a E9 diz «sem rota» e não mente. */
  deSlug: string | null;
  paraId: string;
  paraTitulo: string;
  paraClasse: ClasseEntidade;
  paraSlug: string | null;
  relacao: Relacao;
  motivo: string;
  assinatura: string;
  carimbo: string;
}

// ---------------------------------------------------------------------------
// E2 — o destaque do feed: a curadoria com poder de sobrepor o algoritmo
// ---------------------------------------------------------------------------

/** Um cartão do feed, achatado para a tela. Só primitivo atravessa (DP-F). */
export interface CartaoDoDestaque {
  id: string;
  titulo: string;
  classe: ClasseEntidade;
  /** A frase que o público lê no selo daquele cartão. */
  motivo: string;
  procedencia: Procedencia;
  posicao: number;
  rotaPublica: string | null;
}

export interface DestaqueDoFeed {
  personaId: string;
  personaNome: string;
  /** O cartão `curado` — o único do feed que uma pessoa escolheu. `null` se não houver. */
  destaque: CartaoDoDestaque | null;
  /** O cartão que a caminhada teria entregue e que o destaque empurrou para fora. */
  substituido: CartaoDoDestaque | null;
  /** A serendipidade, ao lado e para contraste. Ela NÃO é curada. */
  serendipidade: CartaoDoDestaque | null;
  /** O feed inteiro, na ordem em que o público o recebe. É o «depois» da tela. */
  cartoes: CartaoDoDestaque[];
  totalDeCartoes: number;
  posicaoDoCurado: number;
  posicaoDaSerendipidade: number;
}

/**
 * O TETO DE UM, e por que ele é o produto e não uma limitação técnica.
 *
 * `TipoCartaoEspecial` tem dois valores e o feed reserva uma posição fixa para cada um.
 * Um destaque por feed é curadoria: a pessoa que assina responde por aquela escolha, e
 * quem lê consegue apontá-la. Dez destaques seriam editorial disfarçado de algoritmo —
 * o leitor deixaria de distinguir o que a máquina achou do que a Redação escolheu, que
 * é exatamente a distinção que esta plataforma existe para tornar visível.
 */
export const REGRA_DO_DESTAQUE_UNICO =
  `Exatamente UM destaque por feed, na posição fixa ${POSICAO_CURADO}. O teto não é ` +
  "limitação técnica, é o produto: um destaque é curadoria — assinada, apontável, " +
  "contestável. Dez seriam editorial disfarçado de algoritmo, e o leitor perderia a " +
  "única coisa que esta tela existe para deixar visível: o que a máquina achou e o que " +
  "uma pessoa escolheu são coisas diferentes.";

/**
 * A SERENDIPIDADE NÃO É CURADA, e a tela precisa dizer isso ao lado do destaque.
 *
 * Ela também sobrepõe o rodízio e também ocupa posição fixa, o que a faz PARECER a mesma
 * coisa. Não é: ela é escolhida pelo motor, fora do conjunto de ids que a caminhada tocou,
 * e a dose dela é parâmetro do Admin — ninguém da Redação assina aquele cartão. Apresentar
 * as duas sem essa distinção ensinaria o operador a confundir escolha com dosagem.
 */
export const SERENDIPIDADE_NAO_E_CURADORIA =
  `A serendipidade ocupa a posição fixa ${POSICAO_SERENDIPIDADE} e também sobrepõe o ` +
  "rodízio, o que a faz parecer o mesmo tipo de coisa. Não é. Ela é escolhida pelo motor " +
  "FORA do conjunto de ids que a caminhada alcançou, a dose é parâmetro do Admin " +
  "(«dose de serendipidade», 1 cartão por feed), e ninguém da Redação assina aquele " +
  "cartão. Uma é escolha; a outra é dosagem.";

/**
 * COMO O CARTÃO SUBSTITUÍDO É DESCOBERTO, e por que não é adivinhação.
 *
 * O destaque ocupa uma das vagas do feed, então o rodízio preenche uma a menos: existe um
 * cartão que a caminhada teria entregue e que ficou de fora. `montarFeed` é determinística
 * e não aceita «monte sem o destaque», e reimplementar a montagem aqui seria a segunda
 * travessia que este módulo recusa em toda parte. O que ela aceita é `limite`: montar o
 * mesmo feed com uma vaga a mais devolve exatamente o cartão que não coube — o próximo do
 * rodízio, com todo o resto idêntico. É diferença medida entre duas execuções da MESMA
 * função, não uma segunda montagem escrita aqui.
 */
export const COMO_SE_SABE_O_SUBSTITUIDO =
  "O destaque ocupa uma das vagas do feed, e o rodízio preenche uma a menos — existe um " +
  "cartão que a caminhada teria entregue e ficou de fora. Para saber qual, o mesmo feed é " +
  "montado com uma vaga a mais pela MESMA função determinística: o cartão que aparece a " +
  "mais é o que o destaque empurrou. Não é uma segunda montagem escrita na Redação, é a " +
  "diferença entre duas execuções da montagem oficial.";

function achatarCartao(
  c: { id: string; titulo: string; classe: ClasseEntidade; slug: string; procedencia: Procedencia; motivo: { texto: string } },
  posicao: number,
): CartaoDoDestaque {
  return {
    id: c.id,
    titulo: c.titulo,
    classe: c.classe,
    motivo: c.motivo.texto,
    procedencia: c.procedencia,
    posicao,
    rotaPublica: rotaDaEntidade(c.classe, c.slug),
  };
}

let destaqueMemo: DestaqueDoFeed | null = null;

export function destaqueDoFeed(): DestaqueDoFeed {
  if (destaqueMemo) return destaqueMemo;

  const persona = PERSONAS[0];
  if (!persona) {
    throw new Error(
      "redacao.ts: o acervo não tem persona nenhuma. A tela do destaque mostra o feed de " +
        "uma pessoa concreta, e sem persona não há feed sobre o que a curadoria sobreponha.",
    );
  }

  const LIMITE = 12;
  const feed = montarFeed({ personaId: persona.id, limite: LIMITE });
  const comFolga = montarFeed({ personaId: persona.id, limite: LIMITE + 1 });

  const curado = feed.cartoes.find((c) => c.especial === "curado") ?? null;
  const serendipidade = feed.cartoes.find((c) => c.especial === "serendipidade") ?? null;

  const jaNoFeed = new Set(feed.cartoes.map((c) => c.id));
  const extra = comFolga.cartoes.find((c) => !jaNoFeed.has(c.id)) ?? null;

  destaqueMemo = {
    personaId: persona.id,
    personaNome: persona.nome,
    destaque: curado ? achatarCartao(curado, POSICAO_CURADO) : null,
    substituido: extra
      ? achatarCartao(extra, comFolga.cartoes.findIndex((c) => c.id === extra.id))
      : null,
    serendipidade: serendipidade
      ? achatarCartao(serendipidade, POSICAO_SERENDIPIDADE)
      : null,
    cartoes: feed.cartoes.map((c, i) => achatarCartao(c, i)),
    totalDeCartoes: feed.cartoes.length,
    posicaoDoCurado: POSICAO_CURADO,
    posicaoDaSerendipidade: POSICAO_SERENDIPIDADE,
  };
  return destaqueMemo;
}

// ---------------------------------------------------------------------------
// E9 — a fatia autorada do grafo, VARRIDA e conferida contra `meta.json`
// ---------------------------------------------------------------------------

/**
 * As 20 classes, como `Record` de propósito.
 *
 * Uma lista solta aqui envelheceria em silêncio: acrescentar classe em `tipos.ts` sem
 * incluí-la nesta varredura faria a contagem de nós autorados ficar MENOR que a real, e uma
 * tela que se propõe a auditar autoria contando a menos é pior que nenhuma tela. Com
 * `Record<ClasseEntidade, true>` o compilador recusa a omissão.
 */
const TODAS_AS_CLASSES: Record<ClasseEntidade, true> = {
  pessoa: true,
  coletivo: true,
  instituicao: true,
  espaco: true,
  obra: true,
  termo: true,
  programa: true,
  evento: true,
  temporada: true,
  ocorrencia: true,
  conteudo: true,
  midia: true,
  publicacao: true,
  formacao: true,
  linguagem: true,
  tema: true,
  territorio: true,
  "pessoa-usuaria": true,
  repertorio: true,
  trilha: true,
};

/**
 * O que um nó autorado É, decidido pela ESTRUTURA e não pelo nome.
 *
 * `procedencia: "autorado"` quer dizer «não veio de fonte externa» — e isso engloba coisas
 * de naturezas muito diferentes: a trilha que a curadoria montou, as duplicatas semeadas
 * para a fila de moderação ter o que julgar, e as personas do protótipo com os repertórios
 * delas. Apresentar as três como «afirmação assinada» inflaria a curadoria por um fator de
 * quarenta e sete, numa tela cujo assunto é exatamente auditar isso.
 *
 * A classificação é lida do grafo: quem participa de `duplicata_suspeita` é semeadura da
 * fila; `pessoa-usuaria` e `repertorio` são a persona e os salvos dela. O que sobra é
 * curadoria. Fosse por marca no slug, a conta quebraria na primeira mudança de convenção.
 */
export type NaturezaDaAutoria = "curadoria" | "duplicata-semeada" | "persona-do-prototipo";

export interface AfirmacaoDoAcervo {
  id: string;
  titulo: string;
  classe: ClasseEntidade;
  natureza: NaturezaDaAutoria;
  /** Onde esta afirmação aparece ao público. `null` quando a classe não tem página. */
  rotaDoOutroLado: string | null;
  /** Por que não há outro lado, quando não há. Nunca fica em branco junto com a rota. */
  semRotaPorque: string | null;
  /** Quantas ligações autoradas tocam este nó, contadas na varredura. */
  ligacoesAutoradas: number;
}

export interface FatiaAutorada {
  /** Os nós autorados, nomeados um a um. */
  nos: AfirmacaoDoAcervo[];
  /** Quantos a varredura achou. Comparado com `meta.json` na própria tela. */
  nosVarridos: number;
  nosDeclarados: number;
  nosTotal: number;
  /** Ligações autoradas ALCANÇADAS a partir dos nós autorados — não são as 81. */
  arestasAlcancadas: number;
  arestasDeclaradas: number;
  arestasTotal: number;
  /** Quantos dos nós autorados são de fato curadoria. É o número que a tela abre. */
  nosDeCuradoria: number;
}

let fatiaMemo: FatiaAutorada | null = null;

/**
 * A fatia autorada do grafo, varrida por `grafo.ts` e conferida contra `meta.json`.
 *
 * D-47: a leitura passa por `grafo.ts`, nunca por `entidades.json` ou `arestas.json` — é por
 * isso que os nós são varridos classe a classe em vez de filtrados no JSON bruto, que seria
 * mais curto e proibido.
 *
 * AS LIGAÇÕES SÃO AS ALCANÇÁVEIS, E NÃO AS 81. `grafo.ts` não exporta iteração sobre todas
 * as arestas, então o que esta varredura consegue ver são as ligações autoradas que TOCAM um
 * nó autorado. Uma ponte autorada entre dois nós do acervo — os dois de procedência `ic` —
 * não aparece nesta contagem, e é por isso que a tela mostra os DOIS números lado a lado em
 * vez de apresentar o alcançado como se fosse o total. Declarar o recorte é o que separa
 * este painel de uma contagem que mente por omissão.
 */
export function fatiaAutorada(): FatiaAutorada {
  if (fatiaMemo) return fatiaMemo;

  const nos: AfirmacaoDoAcervo[] = [];
  const arestasVistas = new Set<string>();

  for (const classe of Object.keys(TODAS_AS_CLASSES) as ClasseEntidade[]) {
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      if (!e || e.procedencia !== "autorado") continue;

      let ligacoes = 0;
      let ehDuplicataSemeada = false;
      for (const v of vizinhos(e.id)) {
        if (v.aresta.relacao === "duplicata_suspeita") ehDuplicataSemeada = true;
        if (v.aresta.procedencia !== "autorado") continue;
        ligacoes += 1;
        // A mesma aresta aparece dos dois lados quando as duas pontas são autoradas.
        // A chave ordenada impede que ela conte duas vezes no total.
        const par = [v.aresta.de, v.aresta.para].sort();
        arestasVistas.add(`${par[0]}|${v.aresta.relacao}|${par[1]}`);
      }

      const rota = rotaDaEntidade(e.classe, e.slug);
      const natureza: NaturezaDaAutoria = ehDuplicataSemeada
        ? "duplicata-semeada"
        : e.classe === "pessoa-usuaria" || e.classe === "repertorio"
          ? "persona-do-prototipo"
          : "curadoria";
      nos.push({
        id: e.id,
        titulo: e.titulo,
        classe: e.classe,
        natureza,
        rotaDoOutroLado: rota,
        semRotaPorque: rota
          ? null
          : `A classe «${e.classe}» não tem página própria no app: ela aparece dentro de ` +
            "outras telas, e não há endereço para onde apontar. Linkar para o vazio seria " +
            "prometer um outro lado que não existe.",
        ligacoesAutoradas: ligacoes,
      });
    }
  }

  nos.sort(porIdEstavel);

  fatiaMemo = {
    nos,
    nosVarridos: nos.length,
    nosDeclarados: meta.porProcedencia.autorado,
    nosTotal: meta.totais.entidades,
    arestasAlcancadas: arestasVistas.size,
    arestasDeclaradas: meta.porProcedenciaDeAresta.autorado,
    arestasTotal: meta.totais.arestas,
    nosDeCuradoria: nos.filter((n) => n.natureza === "curadoria").length,
  };
  return fatiaMemo;
}

/**
 * A diferença entre esta tela e a M9 da Moderação, que é a razão de as duas existirem.
 *
 * O moderador registra DECISÕES SOBRE O TRABALHO DE OUTROS — o que ele aprovou, vetou,
 * devolveu. O editor registra AFIRMAÇÕES PRÓPRIAS: coisas que ninguém disse antes dele. Uma
 * auditoria procura coisas diferentes em cada uma: na M9, se o critério foi aplicado igual
 * para todos; aqui, se quem afirmou está disposto a defender o que afirmou.
 */
export const DIFERENCA_PARA_A_MODERACAO =
  "A Moderação registra decisões sobre o trabalho de outras pessoas — aprovar, vetar, " +
  "devolver. Esta tela registra afirmações próprias: pontes de sentido, trilhas e termos " +
  "que ninguém tinha dito antes. São registros diferentes porque respondem a perguntas " +
  "diferentes: lá se audita se o critério valeu igual para todos; aqui, se quem afirmou " +
  "assina o que afirmou.";

/**
 * Por que NÃO há filtro por período, dito em vez de simulado.
 *
 * T-03-10 proíbe o relógio: o carimbo de toda afirmação deriva de `DATA_DE_REFERENCIA`, o
 * que significa que tudo o que esta sessão assina carrega a MESMA data. Um seletor de
 * período sobre uma data só seria um controle que não filtra nada — teatro de interface, e
 * numa tela cujo assunto é auditoria isso é pior do que a ausência.
 */
export const AUSENCIA_DO_FILTRO_DE_PERIODO =
  `Não há filtro por período, e a razão é do protótipo: sem relógio (o carimbo deriva de ` +
  `${comoSeLe(DATA_DE_REFERENCIA)}, a data de referência do build), toda afirmação ` +
  "assinada aqui " +
  "carrega a mesma data. Um seletor de período sobre uma data só seria um controle que não " +
  "filtra nada. O filtro por tipo de afirmação, esse, filtra — e está acima.";

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
