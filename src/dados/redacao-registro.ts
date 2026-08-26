/**
 * redacao-registro.ts — o que a Redação assina, guardado no navegador.
 *
 * POR QUE ELE É SEPARADO DE `redacao.ts`. Aquele módulo alcança 23 MB de grafo e nenhum
 * arquivo `"use client"` pode importá-lo por valor (DP-F). Estas chaves e estes leitores
 * precisam rodar NO CLIENTE, nas três telas da Redação, e não tocam o acervo — é o mesmo
 * arranjo de `rotas.ts`, que é importável do cliente porque não alcança o grafo. Os tipos
 * vêm de `redacao.ts` por `import type`, que o compilador apaga.
 *
 * POR QUE ELE EXISTE. A E9 pergunta «o que eu assinei», e a resposta tem de vir de um lugar
 * só. Com cada tela guardando o seu formato na sua chave, a tela de auditoria teria de
 * conhecer três formatos e ficaria desatualizada na primeira mudança de qualquer um deles —
 * que é exatamente o defeito que uma tela de auditoria não pode ter.
 *
 * A VALIDAÇÃO MORA NA LEITURA, E NÃO SÓ NA ESCRITA. T-05-17: o `localStorage` é editável
 * pelo avaliador, e numa banca alguém abre o inspetor. Validar na escrita protege contra
 * quem se distrai; validar na leitura protege contra quem experimenta. Um registro sem
 * motivo ou sem assinatura não entra, venha de onde vier.
 */
import type { ArestaAutorada } from "./redacao";

/**
 * Uma data ISO escrita como se lê em português.
 *
 * MORA AQUI, e não em `redacao.ts`, porque as três telas precisam dela NO CLIENTE — o
 * campo `<input type="date">` fala ISO por obrigação do HTML, e o que o curador lê embaixo
 * dele não pode falar. Uma segunda cópia no módulo de servidor divergiria da primeira no
 * dia em que alguém trocasse o separador.
 *
 * A conversão é sobre as PARTES da string, e não por `new Date`: `new Date("2026-08-22")` é
 * meia-noite UTC e volta como dia 21 em fuso brasileiro. Uma data que anda um dia para trás
 * é pior que uma data em formato errado. Entrada fora do formato volta intacta — inventar
 * uma data para um valor que não é data seria pior que mostrar o valor cru.
 */
export function comoSeLe(iso: string): string {
  const partes = iso.split("-");
  if (partes.length !== 3) return iso;
  const [ano, mes, dia] = partes;
  return `${dia}.${mes}.${ano}`;
}

/** Chaves versionadas, do espaço `agenda-cultural:`, e DECLARADAS nas telas. */
export const CHAVE_DAS_PONTES = "agenda-cultural:pontes-autoradas-v1";
export const CHAVE_DAS_TRILHAS = "agenda-cultural:trilhas-publicadas-v1";
export const CHAVE_DO_DESTAQUE = "agenda-cultural:destaque-do-feed-v1";
export const CHAVE_DO_TESAURO = "agenda-cultural:mudancas-de-tesauro-v1";
export const CHAVE_DAS_MATERIAS = "agenda-cultural:materias-editoriais-v1";

/** Uma trilha publicada pelo editor, com autor e carimbo. */
export interface TrilhaPublicada {
  slug: string;
  titulo: string;
  assinatura: string;
  carimbo: string;
  agendadaPara: string;
  passos: number;
}

function ler(chave: string): unknown[] {
  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

/**
 * Grava, e DIZ se conseguiu.
 *
 * O storage recusa em janela privada e dentro de iframe. Engolir isso deixaria quem opera
 * achando que o registro ficou guardado quando ele vive só na memória da aba — e a tela
 * prefere avisar, porque o trabalho continua visível e a pessoa decide o que fazer.
 */
function gravar(chave: string, valor: unknown): boolean {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

function ehTexto(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function lerPontes(): ArestaAutorada[] {
  return ler(CHAVE_DAS_PONTES).filter((v): v is ArestaAutorada => {
    if (typeof v !== "object" || v === null) return false;
    const p = v as Partial<ArestaAutorada>;
    // As cinco condições da E3, conferidas de novo na leitura: sem motivo e sem assinatura
    // não é afirmação autorada, é uma linha que ninguém consegue contestar.
    // `deSlug`/`paraSlug` NÃO entram na exigência: registros gravados antes de eles
    // existirem continuam válidos como afirmação, e o que falta é só o endereço público —
    // a E9 diz «sem rota» em vez de descartar a assinatura de alguém por causa disso.
    return (
      ehTexto(p.deId) &&
      ehTexto(p.paraId) &&
      ehTexto(p.relacao) &&
      ehTexto(p.motivo) &&
      ehTexto(p.assinatura)
    );
  });
}

export function gravarPontes(pontes: readonly ArestaAutorada[]): boolean {
  return gravar(CHAVE_DAS_PONTES, pontes);
}

export function lerTrilhasPublicadas(): TrilhaPublicada[] {
  return ler(CHAVE_DAS_TRILHAS).filter((v): v is TrilhaPublicada => {
    if (typeof v !== "object" || v === null) return false;
    const t = v as Partial<TrilhaPublicada>;
    return ehTexto(t.slug) && ehTexto(t.titulo) && ehTexto(t.assinatura) && ehTexto(t.carimbo);
  });
}

/**
 * O destaque que a Redação assinou para um feed.
 *
 * `feedDe` é a persona cujo feed ele sobrepõe: o teto de UM é por feed, e sem essa chave a
 * regra viraria «um destaque no mundo», que é outra coisa e mais frouxa.
 */
export interface DestaqueAssinado {
  feedDe: string;
  entidadeId: string;
  titulo: string;
  classe: string;
  motivo: string;
  assinatura: string;
  carimbo: string;
  agendadoPara: string;
  /** O que a caminhada teria entregue e que este destaque empurrou para fora. */
  substituiu: string | null;
}

export function lerDestaques(): DestaqueAssinado[] {
  return ler(CHAVE_DO_DESTAQUE).filter((v): v is DestaqueAssinado => {
    if (typeof v !== "object" || v === null) return false;
    const d = v as Partial<DestaqueAssinado>;
    return (
      ehTexto(d.feedDe) && ehTexto(d.entidadeId) && ehTexto(d.motivo) && ehTexto(d.assinatura)
    );
  });
}

/**
 * Grava o destaque de um feed. **Um por feed, e o novo SUBSTITUI o antigo** — é a regra do
 * produto virando código: empilhar dois destaques para a mesma persona faria a tela mostrar
 * um teto que o registro não sustenta, e o segundo apareceria como se o primeiro não
 * existisse.
 */
export function registrarDestaque(novo: DestaqueAssinado): boolean {
  const antes = lerDestaques().filter((d) => d.feedDe !== novo.feedDe);
  return gravar(CHAVE_DO_DESTAQUE, [novo, ...antes]);
}

/** Uma ligação editorial: a aresta que sai da matéria para uma entidade do acervo. */
export interface LigacaoEditorial {
  relacao: string;
  entidadeId: string;
  entidadeTitulo: string;
  entidadeClasse: string;
  entidadeSlug: string | null;
  motivo: string;
}

/**
 * Uma matéria editorial, com as ligações que ela declara.
 *
 * `creditoImagem` é `string | null` e NUNCA opcional, pelo mesmo motivo de
 * `declaraAcessibilidade`: campo ausente teria de ser lido como «não declarou», e ler
 * ausência como declaração é o erro que a ontologia proíbe. `null` aqui significa «não há
 * imagem»; com imagem, o crédito é exigido antes de a matéria existir.
 */
export interface MateriaEditorial {
  formato: string;
  titulo: string;
  texto: string;
  imagem: string | null;
  creditoImagem: string | null;
  ligacoes: LigacaoEditorial[];
  assinatura: string;
  carimbo: string;
  agendadaPara: string;
}

export function lerMaterias(): MateriaEditorial[] {
  return ler(CHAVE_DAS_MATERIAS).filter((v): v is MateriaEditorial => {
    if (typeof v !== "object" || v === null) return false;
    const m = v as Partial<MateriaEditorial>;
    // Imagem sem crédito não entra, venha de onde vier: é a regra da tela conferida de novo
    // na leitura, porque o storage é editável por quem abre o inspetor.
    if (ehTexto(m.imagem) && !ehTexto(m.creditoImagem)) return false;
    return (
      ehTexto(m.formato) && ehTexto(m.titulo) && ehTexto(m.texto) && ehTexto(m.assinatura)
    );
  });
}

export function registrarMateria(nova: MateriaEditorial): boolean {
  return gravar(CHAVE_DAS_MATERIAS, [nova, ...lerMaterias()]);
}

/** As quatro operações da camada 0. Vocabulário fechado, como as relações. */
export type TipoDeMudanca = "promocao" | "fusao" | "sinonimia" | "hierarquia";

/**
 * Uma mudança no vocabulário controlado, proposta pela Redação.
 *
 * `alcance` é o número de vínculos que a mudança toca, MEDIDO antes de ela ser proposta. Ele
 * fica gravado junto: uma proposta que o Admin lê três dias depois precisa dizer quanto ela
 * alcançava quando foi escrita, e não quanto alcança agora — senão a decisão dele é sobre
 * outro número, e ninguém percebe.
 *
 * `aprovadaPor` é sempre `null` aqui, e é de propósito: quem aprova é o Admin, e esta tela
 * não tem como escrever esse campo. Deixá-lo declarado e vazio é o que mostra que a
 * separação existe — um campo ausente seria lido como «não precisa de aprovação».
 */
export interface MudancaDeTesauro {
  tipo: TipoDeMudanca;
  alvoId: string;
  alvoRotulo: string;
  /** O segundo termo, nas operações que têm dois lados. `null` na promoção. */
  destinoId: string | null;
  destinoRotulo: string | null;
  /** Token de cor do manual. Obrigatório ao promover linguagem; `null` no resto. */
  cor: string | null;
  motivo: string;
  alcance: number;
  assinatura: string;
  carimbo: string;
  aprovadaPor: null;
}

export function lerMudancasDeTesauro(): MudancaDeTesauro[] {
  return ler(CHAVE_DO_TESAURO).filter((v): v is MudancaDeTesauro => {
    if (typeof v !== "object" || v === null) return false;
    const m = v as Partial<MudancaDeTesauro>;
    return ehTexto(m.tipo) && ehTexto(m.alvoId) && ehTexto(m.motivo) && ehTexto(m.assinatura);
  });
}

export function registrarMudancaDeTesauro(nova: MudancaDeTesauro): boolean {
  return gravar(CHAVE_DO_TESAURO, [nova, ...lerMudancasDeTesauro()]);
}

/**
 * Registra a publicação. A MESMA trilha publicada de novo substitui a anterior, em vez de
 * empilhar: o registro é o estado do que está publicado, e duas linhas para o mesmo slug
 * fariam a auditoria contar duas afirmações onde existe uma.
 */
export function registrarTrilhaPublicada(nova: TrilhaPublicada): boolean {
  const antes = lerTrilhasPublicadas().filter((t) => t.slug !== nova.slug);
  return gravar(CHAVE_DAS_TRILHAS, [nova, ...antes]);
}
