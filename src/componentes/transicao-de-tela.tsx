"use client"

import type {} from "react/canary"
import { ViewTransition } from "react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"
import { marcarNavegacao } from "@/lib/movimento"

function reduzirMovimento(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function esperarRestore(): Promise<void> {
  // Não usar rAF: durante o callback de startViewTransition o quadro está
  // congelado e o rAF nunca dispara — o Chrome aborta com timeout no DOM update.
  // 32ms é um quadro: o restore do Next já aplicou o React nesse intervalo.
  return new Promise((resolve) => {
    setTimeout(resolve, 32)
  })
}

/**
 * transicao-de-tela.tsx — a troca de rota do grupo (app).
 *
 * O Next 16 anima navegação com `<ViewTransition>` do React, sem biblioteca
 * por cima. Este envelope vive no layout (que persiste) e troca de `key` com o
 * pathname: é isso que dispara entrada/saída em dezenas de telas sem wrapping
 * em cada `page.tsx`.
 *
 * O TIPO da animação não viaja no `<Link>`. Com esse tanto de destino, anotar
 * cada um divergiria. Um listener em captura lê o href antes do Next começar a
 * transição e escreve `data-nav` na raiz — o CSS escolhe o quadro a partir daí.
 *
 * A BARRA e o CABEÇALHO ficam FORA deste envelope de propósito: layout persiste
 * o chrome, e os `view-transition-name` em `transicao.css` impedem que a troca
 * de tela arraste a navegação junto (o lampejo que a barra dava ao abrir /apps).
 */

function destinoDoClique(a: HTMLAnchorElement): string | null {
  if (a.target === "_blank" || a.hasAttribute("download")) return null
  const href = a.getAttribute("href")
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null
  }
  let url: URL
  try {
    url = new URL(a.href)
  } catch {
    return null
  }
  if (url.origin !== window.location.origin) return null
  return url.pathname
}

function useRastrearNavegacao() {
  const caminho = usePathname() ?? ""
  const anterior = useRef(caminho)

  useEffect(() => {
    anterior.current = caminho
  }, [caminho])

  useEffect(() => {
    const noClique = (evento: MouseEvent) => {
      if (evento.defaultPrevented || evento.button !== 0) return
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return
      const alvo = evento.target
      if (!(alvo instanceof Element)) return
      const ancora = alvo.closest("a")
      if (!(ancora instanceof HTMLAnchorElement)) return
      const para = destinoDoClique(ancora)
      if (!para) return
      marcarNavegacao(window.location.pathname, para)
    }
    const noVoltar = () => {
      marcarNavegacao(anterior.current, window.location.pathname)
      // ACTION_RESTORE do Next não dispara ViewTransition do React (o restore
      // aplica o estado fora de startTransition). Sem isto o voltar corta.
      // Captura: o snapshot “antes” ainda é a tela atual; o callback espera o
      // Next pintar o restore e aí o par anima com o `data-nav` já escrito.
      if (reduzirMovimento()) return
      if (typeof document.startViewTransition !== "function") return
      const transicao = document.startViewTransition(async () => {
        await esperarRestore()
      })
      void transicao.ready.catch(() => undefined)
      void transicao.finished.catch(() => undefined)
    }
    document.addEventListener("click", noClique, true)
    window.addEventListener("popstate", noVoltar, true)
    return () => {
      document.removeEventListener("click", noClique, true)
      window.removeEventListener("popstate", noVoltar, true)
    }
  }, [])
}

export function TransicaoDeTela({ children }: { children: ReactNode }) {
  const caminho = (usePathname() ?? "").replace(/\/$/, "") || "/"
  useRastrearNavegacao()

  return (
    <ViewTransition
      key={caminho}
      name="tela"
      enter="tela"
      exit="tela"
      update="tela"
      default="none"
    >
      <div className="tela-em-transicao">{children}</div>
    </ViewTransition>
  )
}
