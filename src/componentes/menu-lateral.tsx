"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grafismo } from "@/componentes/grafismo";
import { useSessao } from "@/contexto/sessao";
import { personaPorId } from "@/dados/personas";

/**
 * menu-lateral.tsx — a navegação principal nas DUAS visões, num único componente
 * (D-05: proibido componente irmão por visão). Substitui a barra de abas — decisão
 * do cliente na reformulação de 2026-08: o produto vai ganhar muitas seções e um
 * menu inferior de cinco itens não carrega a árvore.
 *
 * Na web o painel é um trilho permanente à esquerda; no app é uma gaveta
 * sobreposta aberta pelo cabeçalho fino. A divergência mora em
 * `src/estilos/menu-lateral.css`, sob `[data-view="…"]` — aqui a árvore de JSX é
 * uma só. A gaveta posiciona `absolute` contra a moldura (que não rola mais; quem
 * rola é `.moldura-rolagem`) — nunca `fixed` (D-03/D-04).
 *
 * A árvore de itens foi FIXADA PELO CLIENTE (22/08): Descobrir · Buscar ·
 * Acontece · Play · Cast · Notícias · Museu · IA · Cursos · Blog. Planejar
 * (Mapa/Salvos) e Meu perfil formam o grupo secundário; o bastidor só aparece
 * na visão web, porque as rotas dele se declaram «só web» (AvisoDesktop).
 */

const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Icone({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-6 shrink-0">
      {children}
    </svg>
  );
}

interface Item {
  href: string;
  rotulo: string;
  icone?: React.ReactNode;
  /** Subitens (ex.: Exposições dentro de Museu) — só renderizados com o pai ativo. */
  filhos?: { href: string; rotulo: string }[];
}

const PRINCIPAIS: Item[] = [
  {
    href: "/descobrir",
    rotulo: "Descobrir",
    icone: (
      <Icone>
        <circle cx="12" cy="12" r="9" {...traco} />
        <path d="M15.5 8.5 10.9 10.9 8.5 15.5l4.6-2.4 2.4-4.6Z" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/buscar",
    rotulo: "Buscar",
    icone: (
      <Icone>
        <circle cx="11" cy="11" r="6.5" {...traco} />
        <path d="m15.8 15.8 4 4" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/acontece",
    rotulo: "Acontece",
    icone: (
      <Icone>
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...traco} />
        <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/play",
    rotulo: "Play",
    icone: (
      <Icone>
        <circle cx="12" cy="12" r="9" {...traco} />
        <path d="M10.2 8.6v6.8L15.8 12l-5.6-3.4Z" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/cast",
    rotulo: "Cast",
    icone: (
      <Icone>
        <rect x="9" y="3.5" width="6" height="11" rx="3" {...traco} />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/noticias",
    rotulo: "Notícias",
    icone: (
      <Icone>
        <path d="M4 5.5h13v13a2 2 0 0 0 2-2v-9" {...traco} />
        <path d="M4 5.5v11a2 2 0 0 0 2 2h13M7.5 9h6M7.5 12h6M7.5 15h4" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/museu",
    rotulo: "Museu",
    icone: (
      <Icone>
        <path d="m12 3.5 8.5 4.5H3.5L12 3.5ZM5 8v8M9.5 8v8M14.5 8v8M19 8v8M3.5 19.5h17" {...traco} />
      </Icone>
    ),
    filhos: [{ href: "/museu/exposicoes", rotulo: "Exposições" }],
  },
  {
    href: "/ia",
    rotulo: "IA",
    icone: (
      <Icone>
        <path d="M12 4.5c.7 3.6 2.9 5.8 6.5 6.5-3.6.7-5.8 2.9-6.5 6.5-.7-3.6-2.9-5.8-6.5-6.5 3.6-.7 5.8-2.9 6.5-6.5Z" {...traco} />
        <path d="M18.5 15.5c.3 1.5 1.2 2.4 2.7 2.7-1.5.3-2.4 1.2-2.7 2.7-.3-1.5-1.2-2.4-2.7-2.7 1.5-.3 2.4-1.2 2.7-2.7Z" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/cursos",
    rotulo: "Cursos",
    icone: (
      <Icone>
        <path d="m12 5 9 4-9 4-9-4 9-4Z" {...traco} />
        <path d="M6.5 10.8v4.7c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.7M21 9v5" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/blog",
    rotulo: "Blog",
    icone: (
      <Icone>
        <path d="M15.5 4.5 19 8l-9.5 9.5-4.5 1 1-4.5L15.5 4.5Z" {...traco} />
        <path d="M13.5 6.5 17 10" {...traco} />
      </Icone>
    ),
  },
];

const PLANEJAR: Item[] = [
  {
    href: "/mapa",
    rotulo: "Mapa",
    icone: (
      <Icone>
        <path d="M12 20.5s6.5-5.4 6.5-10a6.5 6.5 0 0 0-13 0c0 4.6 6.5 10 6.5 10Z" {...traco} />
        <circle cx="12" cy="10.3" r="2.3" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/salvos",
    rotulo: "Salvos",
    icone: (
      <Icone>
        <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-6-3.8-6 3.8v-14a1 1 0 0 1 1-1Z" {...traco} />
      </Icone>
    ),
  },
  {
    href: "/meu",
    rotulo: "Meu perfil",
    icone: (
      <Icone>
        <circle cx="12" cy="8.5" r="3.8" {...traco} />
        <path d="M4.8 20c.6-3.7 3.6-5.8 7.2-5.8s6.6 2.1 7.2 5.8" {...traco} />
      </Icone>
    ),
  },
];

/** Só na visão web: as rotas de bastidor se declaram «só web» no app (AvisoDesktop). */
const BASTIDOR: Item[] = [
  { href: "/studio/duplicatas", rotulo: "Studio" },
  { href: "/redacao/fila", rotulo: "Redação" },
  { href: "/observatorio", rotulo: "Observatório" },
  { href: "/roteiro", rotulo: "Roteiro guiado" },
];

function ItemDeMenu({
  item,
  caminho,
  aoNavegar,
}: {
  item: Item;
  caminho: string;
  aoNavegar: () => void;
}) {
  const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
  return (
    <li>
      <Link
        href={item.href}
        aria-current={caminho === item.href ? "page" : undefined}
        onClick={aoNavegar}
        className="menu-item tipo-detalhe"
      >
        {item.icone}
        <span>{item.rotulo}</span>
      </Link>
      {item.filhos && ativo ? (
        <ul>
          {item.filhos.map((filho) => (
            <li key={filho.href}>
              <Link
                href={filho.href}
                aria-current={caminho === filho.href ? "page" : undefined}
                onClick={aoNavegar}
                className="menu-item menu-subitem tipo-detalhe"
              >
                {filho.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function MenuLateral() {
  // Sem a barra final: `trailingSlash: true` faz o pathname canônico vir como
  // `/descobrir/`, e a igualdade exata do aria-current nunca acenderia contra os
  // hrefs sem barra (regressão pega pelo flow-critic — a barra de abas antiga
  // normalizava com startsWith).
  const caminho = (usePathname() ?? "").replace(/\/$/, "");
  const { personaId } = useSessao();
  const persona = personaPorId(personaId);
  const [aberto, setAberto] = useState(false);

  const fechar = useCallback(() => setAberto(false), []);

  // Gaveta aberta fecha com Escape — teclado alcança tudo que o toque alcança.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, fechar]);

  return (
    <>
      {/* Cabeçalho fino — só existe visualmente na visão app (CSS esconde na web). */}
      <header className="menu-cabecalho">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={aberto}
          onClick={() => setAberto(true)}
          className="flex size-10 items-center justify-center rounded-m text-tinta"
        >
          <Icone>
            <path d="M4 6.5h16M4 12h16M4 17.5h16" {...traco} />
          </Icone>
        </button>
        <span className="flex items-center gap-2 font-display font-bold">
          <Grafismo variacao="completo" className="h-5 w-auto text-acao" />
          Agenda Cultural BR
        </span>
      </header>

      <div className="menu-scrim" data-aberto={aberto ? "sim" : "nao"} onClick={fechar} aria-hidden />

      <nav className="menu-lateral" data-aberto={aberto ? "sim" : "nao"} aria-label="Navegação principal">
        <div className="menu-marca">
          <Grafismo variacao="completo" className="h-5 w-auto shrink-0 text-acao" />
          <span>Agenda Cultural BR</span>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={fechar}
            className="menu-fechar ml-auto flex size-10 items-center justify-center rounded-m text-tinta-2"
          >
            <Icone>
              <path d="m6 6 12 12M18 6 6 18" {...traco} />
            </Icone>
          </button>
        </div>

        <div className="menu-grupos">
          <ul>
            {PRINCIPAIS.map((item) => (
              <ItemDeMenu key={item.href} item={item} caminho={caminho} aoNavegar={fechar} />
            ))}
          </ul>

          <p className="menu-rotulo-grupo tipo-micro">Planejar</p>
          <ul>
            {PLANEJAR.map((item) => (
              <ItemDeMenu key={item.href} item={item} caminho={caminho} aoNavegar={fechar} />
            ))}
          </ul>

          {/* Bastidor: as rotas existem nas duas visões, mas no app cada uma se declara
              «só web» — o atalho só na web evita anunciar um beco. */}
          <div className="hidden desk:block">
            <p className="menu-rotulo-grupo tipo-micro">Bastidor</p>
            <ul>
              {BASTIDOR.map((item) => (
                <ItemDeMenu key={item.href} item={item} caminho={caminho} aoNavegar={fechar} />
              ))}
            </ul>
          </div>
        </div>

        <div className="menu-rodape">
          <Link href="/meu" onClick={fechar} className="tipo-legenda block text-tinta-2">
            Você está como <strong className="text-tinta">{persona?.nome ?? "…"}</strong>
            <span className="text-acao"> · trocar</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
