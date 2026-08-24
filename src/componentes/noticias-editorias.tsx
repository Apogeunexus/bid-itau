"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/**
 * O trilho de cadernos. É cliente por UM motivo: na visão app o trilho rola, e
 * a editoria da página tem de entrar na tela — senão «Opinião» fica cortada e
 * a pessoa não vê onde está. O recorte em si vem do servidor, serializado.
 */
export function NoticiasEditorias({
  atual,
  secoes,
}: {
  atual: string;
  secoes: readonly { slug: string; rotulo: string }[];
}) {
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    nav.current
      ?.querySelector("[aria-current='page']")
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
  }, [atual]);

  return (
    <nav ref={nav} aria-label="Editorias" className="noticias-editorias">
      <Link
        href="/noticias/"
        aria-current={atual === "capa" ? "page" : undefined}
        className="noticias-editoria"
      >
        Capa
      </Link>
      {secoes.map((s) => (
        <Link
          key={s.slug}
          href={`/noticias/${s.slug}/`}
          aria-current={atual === s.slug ? "page" : undefined}
          className="noticias-editoria"
        >
          {s.rotulo}
        </Link>
      ))}
    </nav>
  );
}
