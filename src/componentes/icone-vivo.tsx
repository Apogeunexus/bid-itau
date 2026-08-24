"use client"

import { animate } from "animejs"
import { useEffect, useRef, type ReactNode } from "react"
import { durMs, EASE_ANIME } from "@/lib/movimento"

/**
 * icone-vivo.tsx — o traço SVG reage a estado, com Anime.js.
 *
 * Motion cuida de bloco (caixa, painel, dropdown). O vetor — o path, o rect —
 * é o Anime.js, porque é ele que fala a língua do SVG. Um pulso de escala no
 * ícone que ACENDE, e mais nada: desenhar o path a cada troca de aba enjoaria
 * no segundo dia.
 */

export function IconeVivo({
  ativo,
  children,
}: {
  ativo: boolean
  children: ReactNode
}) {
  const raiz = useRef<HTMLSpanElement>(null)
  const anterior = useRef(ativo)

  useEffect(() => {
    const svg = raiz.current?.querySelector("svg")
    if (!svg) return
    const mudou = anterior.current !== ativo
    anterior.current = ativo
    if (!mudou || !ativo) return
    const duracao = durMs("--dur-2")
    if (duracao === 0) return
    const anim = animate(svg, {
      scale: [1, 1.12, 1],
      duration: duracao,
      ease: EASE_ANIME,
    })
    return () => {
      anim.revert()
    }
  }, [ativo])

  return (
    <span ref={raiz} className="icone-vivo">
      {children}
    </span>
  )
}

/** Os quatro campos do botão Apps se abrem um milímetro e voltam — o vetor
 *  diz que dali se entra num conjunto, não numa aba. */
export function pulsarGradeApps(alvo: EventTarget | null) {
  if (!(alvo instanceof Element)) return
  const duracao = durMs("--dur-2")
  if (duracao === 0) return
  const rects = alvo.querySelectorAll("rect")
  if (rects.length === 0) return
  const dx = [-1.25, 1.25, -1.25, 1.25]
  const dy = [-1.25, -1.25, 1.25, 1.25]
  for (const [i, rect] of rects.entries()) {
    animate(rect, {
      translateX: [0, dx[i] ?? 0, 0],
      translateY: [0, dy[i] ?? 0, 0],
      duration: duracao,
      ease: EASE_ANIME,
    })
  }
}
