"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ICONE_ACONTECE,
  ICONE_BUSCAR,
  ICONE_CAST,
  ICONE_CURSOS,
  ICONE_DESCOBRIR,
  ICONE_IA,
  ICONE_MAPA,
  ICONE_MUSEU,
  ICONE_NOTICIAS,
  ICONE_PERFIL,
  ICONE_PLAY,
  ICONE_SALVOS,
} from "@/componentes/base/icones";
import { Grafismo } from "@/componentes/grafismo";
import { useSessao } from "@/contexto/sessao";
import { personaPorId } from "@/dados/personas";

/**
 * menu-lateral.tsx — a navegação da VISÃO WEB: trilho permanente à esquerda.
 *
 * Foi a navegação das duas visões entre a reformulação de agosto e 23/08, quando
 * o app passou a ter barra inferior (`navegacao-barra.tsx`) e o menu ficou só na
 * web. Uma gaveta com hambúrguer num telefone que já tem barra seria a mesma
 * árvore duas vezes; uma barra de abas no pé de uma janela de 1440px seria um
 * padrão de telefone posto onde não resolve nada. Quem escolhe entre os dois é
 * `navegacao-principal.tsx`.
 *
 * A árvore de itens foi FIXADA PELO CLIENTE (22/08): Descobrir · Buscar ·
 * Acontece · Play · Cast · Notícias · Museu · IA · Cursos · Blog. Planejar
 * (Mapa/Salvos) e Meu perfil formam o grupo secundário; o bastidor só aparece
 * na visão web, porque as rotas dele se declaram «só web» (AvisoDesktop).
 *
 * O CABEÇALHO FINO, O SCRIM E A GAVETA SAÍRAM em 23/08, junto com o estado
 * `aberto`, o atalho de Escape e o `aoNavegar` que fechava a gaveta a cada
 * clique. Um trilho permanente nunca esteve fechado: não havia o que abrir, o
 * que fechar nem o que fechar depois de navegar. As suítes das fases 2, 3 e 5 e
 * o roteiro de captura foram reescritos na mesma mudança para medir a barra
 * inferior em vez do hambúrguer.
 *
 * OS ÍCONES SAÍRAM DAQUI em 23/08, para `base/icones.tsx`: a barra inferior
 * desenha os mesmos cinco primeiros, e duas cópias do mesmo `<path>` divergem na
 * primeira edição — a bússola de Descobrir com um traço na barra e outro no
 * menu, na mesma tela.
 */

interface Item {
  href: string;
  rotulo: string;
  icone?: React.ReactNode;
  /** Subitens (ex.: Exposições dentro de Museu) — só renderizados com o pai ativo. */
  filhos?: { href: string; rotulo: string }[];
}

const PRINCIPAIS: Item[] = [
  { href: "/descobrir", rotulo: "Descobrir", icone: ICONE_DESCOBRIR },
  { href: "/buscar", rotulo: "Buscar", icone: ICONE_BUSCAR },
  { href: "/acontece", rotulo: "Acontece", icone: ICONE_ACONTECE },
  { href: "/play", rotulo: "Play", icone: ICONE_PLAY },
  { href: "/cast", rotulo: "Cast", icone: ICONE_CAST },
  { href: "/noticias", rotulo: "Notícias", icone: ICONE_NOTICIAS },
  {
    href: "/museu",
    rotulo: "Museu",
    icone: ICONE_MUSEU,
    filhos: [{ href: "/museu/exposicoes", rotulo: "Exposições" }],
  },
  { href: "/ia", rotulo: "IA", icone: ICONE_IA },
  { href: "/cursos", rotulo: "Cursos", icone: ICONE_CURSOS },
];

const PLANEJAR: Item[] = [
  { href: "/mapa", rotulo: "Mapa", icone: ICONE_MAPA },
  { href: "/salvos", rotulo: "Salvos", icone: ICONE_SALVOS },
  { href: "/meu", rotulo: "Meu perfil", icone: ICONE_PERFIL },
];

/** Só na visão web: as rotas de bastidor se declaram «só web» no app (AvisoDesktop). */
const BASTIDOR: Item[] = [
  { href: "/studio/duplicatas", rotulo: "Studio" },
  { href: "/redacao/fila", rotulo: "Redação" },
  { href: "/observatorio", rotulo: "Observatório" },
  { href: "/roteiro", rotulo: "Roteiro guiado" },
];

function ItemDeMenu({ item, caminho }: { item: Item; caminho: string }) {
  const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
  return (
    <li>
      <Link
        href={item.href}
        aria-current={caminho === item.href ? "page" : undefined}
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

  return (
    <nav className="menu-lateral" aria-label="Navegação principal">
      <div className="menu-marca">
        <Grafismo variacao="completo" className="h-5 w-auto shrink-0 text-acao-tinta" />
        <span>Itaú Cultural</span>
      </div>

      <div className="menu-grupos">
        <ul>
          {PRINCIPAIS.map((item) => (
            <ItemDeMenu key={item.href} item={item} caminho={caminho} />
          ))}
        </ul>

        <p className="menu-rotulo-grupo tipo-micro">Planejar</p>
        <ul>
          {PLANEJAR.map((item) => (
            <ItemDeMenu key={item.href} item={item} caminho={caminho} />
          ))}
        </ul>

        {/* Bastidor: as rotas existem nas duas visões, mas no app cada uma se declara
            «só web» — o atalho só na web evita anunciar um beco. */}
        <div className="hidden desk:block">
          <p className="menu-rotulo-grupo tipo-micro">Bastidor</p>
          <ul>
            {BASTIDOR.map((item) => (
              <ItemDeMenu key={item.href} item={item} caminho={caminho} />
            ))}
          </ul>
        </div>
      </div>

      <div className="menu-rodape">
        <Link href="/meu" className="tipo-legenda block text-tinta-2">
          Você está como <strong className="text-tinta">{persona?.nome ?? "…"}</strong>
          <span className="text-acao-tinta"> · trocar</span>
        </Link>
      </div>
    </nav>
  );
}
