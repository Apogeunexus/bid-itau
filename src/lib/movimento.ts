/**
 * movimento.ts — o ritmo da interface em um lugar só.
 *
 * CSS já declara `--dur-*` e `--ease-*` em `tokens.css`. Aqui mora o que o
 * JavaScript precisa para decidir QUAL animação corre, e o espelho numérico
 * daqueles tokens para o Motion e o Anime.js (os dois falam em ms/s, não em
 * custom property).
 *
 * A curva é a do design system, a mesma do iOS: cubic-bezier(0.2, 0, 0, 1).
 * Sem mola, sem bounce — mola é o que faz animação parecer biblioteca.
 */

export const EASE_BLOCO = [0.2, 0, 0, 1] as const
export const EASE_ANIME = "cubic-bezier(0.2, 0, 0, 1)"

export type TipoDeNavegacao =
  | "nav-forward"
  | "nav-back"
  | "nav-irma"
  | "nav-hub-abre"
  | "nav-hub-fecha"

/** As quatro abas da barra. Troca entre elas é irmã, não empilha. */
const ABAS = new Set(["/descobrir", "/buscar", "/acontece", "/salvos"])
const HUB = "/apps"

export function normalizarCaminho(caminho: string): string {
  const cru = caminho.trim()
  if (!cru) return "/"
  const pathname = cru.startsWith("http://") || cru.startsWith("https://")
    ? safePathname(cru)
    : cru.split(/[?#]/)[0] ?? cru
  const semBarra = pathname.replace(/\/+$/, "")
  return semBarra.length > 0 ? semBarra : "/"
}

function safePathname(href: string): string {
  try {
    return new URL(href).pathname
  } catch {
    return href
  }
}

function profundidade(caminho: string): number {
  return caminho === "/" ? 0 : caminho.split("/").filter(Boolean).length
}

function raiz(caminho: string): string {
  const primeiro = caminho.split("/").filter(Boolean)[0]
  return primeiro ? `/${primeiro}` : "/"
}

function ehAbaRaiz(caminho: string): boolean {
  return ABAS.has(caminho)
}

function ehRamoDeAba(caminho: string): boolean {
  return ABAS.has(raiz(caminho))
}

/**
 * Infere o tipo da troca a partir dos dois endereços.
 *
 * Não anotar cada `<Link>`: com dezenas de telas a anotação diverge na primeira
 * rota nova. A árvore da URL já diz se a pessoa está empilhando, voltando,
 * trocando de aba ou abrindo o hub.
 */
export function tipoDeNavegacao(de: string, para: string): TipoDeNavegacao {
  const a = normalizarCaminho(de)
  const b = normalizarCaminho(para)
  if (a === b) return "nav-irma"

  if (b === HUB) return "nav-hub-abre"
  if (a === HUB && ehRamoDeAba(b)) return "nav-hub-fecha"
  if (a === HUB) return "nav-forward"

  if (b.startsWith(`${a}/`)) return "nav-forward"
  if (a.startsWith(`${b}/`)) return "nav-back"

  // Destino é uma das quatro abas: é troca de aba, mesmo saindo de um
  // aninhado (`/descobrir/porque/…` → `/buscar`). Sem isto a profundidade
  // vira `nav-back` e a pessoa vê um “voltar” mentiroso.
  if (ehAbaRaiz(b) && ehRamoDeAba(a)) return "nav-irma"
  if (ehAbaRaiz(a) && ehAbaRaiz(b)) return "nav-irma"
  if (ehRamoDeAba(a) && !ehRamoDeAba(b)) return "nav-forward"
  if (!ehRamoDeAba(a) && ehRamoDeAba(b)) return "nav-back"

  const pa = profundidade(a)
  const pb = profundidade(b)
  if (pb > pa) return "nav-forward"
  if (pb < pa) return "nav-back"
  return "nav-irma"
}

export function marcarNavegacao(de: string, para: string): void {
  if (typeof document === "undefined") return
  document.documentElement.dataset.nav = tipoDeNavegacao(de, para)
}

export function durMs(token: "--dur-1" | "--dur-2" | "--dur-3"): number {
  if (typeof document === "undefined") return 0
  const cru = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const n = Number.parseFloat(cru)
  return Number.isFinite(n) ? n : 0
}

export function transicaoDe(
  token: "--dur-1" | "--dur-2" | "--dur-3",
  reduzir: boolean | null,
): { duration: number; ease: typeof EASE_BLOCO } {
  if (reduzir) return { duration: 0, ease: EASE_BLOCO }
  // Sem documento (SSR) não há token para ler; 0ms no cliente É o reduced-motion
  // de tokens.css e tem de sobreviver — não é “ausente”.
  if (typeof document === "undefined") return { duration: 0.2, ease: EASE_BLOCO }
  const ms = durMs(token)
  if (!Number.isFinite(ms)) return { duration: 0.2, ease: EASE_BLOCO }
  return { duration: ms / 1000, ease: EASE_BLOCO }
}
