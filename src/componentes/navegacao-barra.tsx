"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ICONE_ACONTECE,
  ICONE_APPS,
  ICONE_BUSCAR,
  ICONE_DESCOBRIR,
  ICONE_SALVOS,
} from "@/componentes/base/icones";
import { Grafismo } from "@/componentes/grafismo";
import { useSessao } from "@/contexto/sessao";
import { personaPorId } from "@/dados/personas";

/**
 * navegacao-barra.tsx — a navegação da VISÃO APP desde 2026-08-23: cabeçalho
 * fino em cima, quatro abas embaixo e um quinto botão que abre o hub.
 *
 * A REGRA DE CORTE DAS QUATRO. Não são «as quatro primeiras do menu»: são as
 * quatro que alguém abre sem ter decidido nada antes — o feed, a busca, a
 * agenda e o que ela já guardou. Tudo que exige uma escolha prévia («quero
 * assistir», «quero ler», «quero um curso») está a um toque em `/apps`, que é
 * onde essa escolha tem espaço para ser mostrada com imagem em vez de rótulo.
 *
 * O QUINTO BOTÃO É REDONDO E SEPARADO, e não uma quinta aba. Ele não é um
 * destino de mesma natureza que os outros quatro: é a porta para o resto do
 * produto inteiro. Desenhá-lo igual às abas afirmaria que «Apps» é uma seção
 * entre seções — a forma diferente é o que diz que ali dentro tem outra coisa.
 * Laranja porque abrir o hub é AÇÃO, que é o único papel que o laranja tem
 * neste design system (DESIGN-SYSTEM.md §1.2).
 *
 * A BARRA POSICIONA `absolute` CONTRA A MOLDURA, nunca `fixed` — mesma regra da
 * gaveta do menu lateral (D-03/D-04). `fixed` se ancoraria na janela e a barra
 * escaparia para a largura toda da tela, fora do telefone.
 *
 * O CABEÇALHO CARREGA A TROCA DE PERSONA porque o rodapé do menu lateral
 * carregava, e sem o menu ela não teria mais onde existir. A demonstração
 * inteira depende de alternar entre Maria, Carlos e Joana ao vivo.
 */

interface Aba {
  href: string;
  rotulo: string;
  icone: React.ReactNode;
}

const ABAS: Aba[] = [
  { href: "/descobrir", rotulo: "Descobrir", icone: ICONE_DESCOBRIR },
  { href: "/buscar", rotulo: "Buscar", icone: ICONE_BUSCAR },
  { href: "/acontece", rotulo: "Acontece", icone: ICONE_ACONTECE },
  { href: "/salvos", rotulo: "Salvos", icone: ICONE_SALVOS },
];

const HREF_APPS = "/apps";

export function NavegacaoBarra() {
  // Sem a barra final: `trailingSlash: true` publica `/descobrir/`, e a
  // igualdade exata contra os hrefs sem barra nunca acenderia (mesma correção
  // que o menu lateral carrega).
  const caminho = (usePathname() ?? "").replace(/\/$/, "");
  const { personaId } = useSessao();
  const persona = personaPorId(personaId);

  const dentroDe = (href: string) => caminho === href || caminho.startsWith(`${href}/`);

  return (
    <>
      <header className="barra-topo">
        <span className="flex items-center gap-2 font-display font-bold">
          <Grafismo variacao="completo" className="h-5 w-auto text-acao-tinta" />
          Agenda Cultural BR
        </span>
        <Link href="/meu" className="barra-persona tipo-legenda">
          {persona?.nome ?? "…"}
        </Link>
      </header>

      <nav className="barra-inferior" aria-label="Navegação principal">
        <ul className="barra-abas">
          {ABAS.map((aba) => (
            <li key={aba.href}>
              <Link
                href={aba.href}
                aria-current={dentroDe(aba.href) ? "page" : undefined}
                className="barra-aba"
              >
                {aba.icone}
                <span className="tipo-legenda">{aba.rotulo}</span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href={HREF_APPS}
          aria-current={dentroDe(HREF_APPS) ? "page" : undefined}
          className="barra-apps"
        >
          {ICONE_APPS}
          <span className="tipo-micro">Apps</span>
        </Link>
      </nav>
    </>
  );
}
