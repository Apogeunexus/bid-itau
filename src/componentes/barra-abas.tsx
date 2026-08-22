"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grafismo } from "@/componentes/grafismo";

/**
 * barra-abas.tsx — as cinco abas de D-13, num ÚNICO componente para as duas visões.
 *
 * É proibido criar um componente irmão por visão — um para o app, outro para a web
 * (D-05): a divergência mora nos utilitários `app:` e `desk:` daqui. Na visão app a
 * barra fica no pé; na visão web, no topo. A ordem visual troca por `order`, e não por
 * duas árvores de JSX.
 *
 * CINCO ABAS, NUNCA SEIS (D-14). Mapa é lente sobre um resultado, não destino de
 * primeiro nível — chega-se a ele de dentro de Acontece e de Buscar. Formação e
 * Oportunidades também não têm aba: vivem dentro de Evento/Espaço e de Meu (PRD §7).
 *
 * O POSICIONAMENTO É O PONTO DELICADO DESTE ARQUIVO. Na visão app a barra usa
 * `sticky`, jamais ancoragem à janela: dentro da moldura de celular, uma barra presa à
 * janela escaparia para a largura toda da tela e destruiria a ilusão que D-03 existe
 * para criar. Quem rola é a moldura (ver `globals.css`), e a barra gruda no pé dela.
 */

interface Aba {
  href: string;
  rotulo: string;
  icone: React.ReactNode;
}

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

const ABAS: Aba[] = [
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
    href: "/meu",
    rotulo: "Meu",
    icone: (
      <Icone>
        <circle cx="12" cy="8.5" r="3.8" {...traco} />
        <path d="M4.8 20c.6-3.7 3.6-5.8 7.2-5.8s6.6 2.1 7.2 5.8" {...traco} />
      </Icone>
    ),
  },
];

export function BarraAbas() {
  const caminho = usePathname() ?? "";

  return (
    <nav
      aria-label="Navegação principal"
      className={clsx(
        "barra-abas sticky z-30 bg-[var(--ic-branco)]",
        // visão app: pé da moldura, ancorada ao contêiner de rolagem que é a própria
        // moldura — nunca à janela.
        "app:bottom-0 app:order-2 app:border-t app:border-black/10",
        // visão web: topo da página, com a marca ao lado das abas.
        "desk:top-0 desk:order-1 desk:border-b desk:border-black/10",
      )}
    >
      <div className="flex items-stretch desk:mx-auto desk:max-w-6xl desk:gap-6 desk:px-6">
        <span className="hidden items-center gap-2 pr-2 font-bold whitespace-nowrap desk:flex">
          <Grafismo variacao="completo" className="h-5 w-auto text-acao" />
          Agenda Cultural BR
        </span>

        <ul className="flex flex-1 items-stretch app:justify-around desk:justify-start desk:gap-1">
          {ABAS.map((aba) => {
            const ativa = caminho === aba.href || caminho.startsWith(`${aba.href}/`);
            return (
              <li key={aba.href} className="app:flex-1">
                <Link
                  href={aba.href}
                  aria-current={ativa ? "page" : undefined}
                  className={clsx(
                    "flex h-full items-center justify-center gap-2 font-semibold transition-colors",
                    "app:flex-col app:gap-0.5 app:px-1 app:py-2 app:text-[11px]",
                    "desk:border-b-2 desk:px-3 desk:py-4 desk:text-sm",
                    ativa
                      ? "text-acao desk:border-acao"
                      : "text-black/55 hover:text-[var(--ic-preto)] desk:border-transparent",
                  )}
                >
                  {aba.icone}
                  <span>{aba.rotulo}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
