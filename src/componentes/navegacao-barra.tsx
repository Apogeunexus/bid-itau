"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ICONE_APPS,
  ICONE_DESCOBRIR,
  ICONE_PERFIL,
  ICONE_ACONTECE,
  ICONE_BUSCAR,
  ICONE_SALVOS,
  ICONE_RECOMPENSAS,
  ICONE_IA,
} from "@/componentes/base/icones";
import { IconeVivo, pulsarGradeApps } from "@/componentes/icone-vivo";
import { Grafismo } from "@/componentes/grafismo";
import { SeloDoPerfil } from "@/componentes/selo-do-perfil";
import { SinoDeAvisos } from "@/componentes/sino-de-avisos";
import { ContadorDeFichas } from "@/componentes/contador-fichas";
import { transicaoDe } from "@/lib/movimento";

const AbaLink = motion.create(Link);

/**
 * navegacao-barra.tsx — a navegação da VISÃO APP desde 2026-08-23: cabeçalho
 * fino em cima, as abas embaixo e um botão redondo à parte que abre o hub.
 *
 * A REGRA DE CORTE DAS QUATRO. Não são «as quatro primeiras do menu»: são as
 * quatro que alguém abre sem ter decidido nada antes — o feed, a agenda do que
 * está acontecendo, o que ela ganha por percorrer e o que já guardou. Tudo que
 * exige uma escolha prévia («quero assistir», «quero ler», «quero um curso»)
 * está a um toque em `/apps`, que é onde essa escolha tem espaço para ser
 * mostrada com imagem em vez de rótulo.
 *
 * A BUSCA SUBIU PARA O CABEÇALHO, e não é rebaixamento: procurar não é um
 * DESTINO como os outros quatro, é uma ação que se faz de qualquer lugar. Como
 * aba, ela disputava um dos quatro alvos do polegar com uma seção inteira do
 * produto; como lupa ao lado dos saldos, ela fica alcançável de toda tela sem
 * gastar aba nenhuma — que é o lugar onde a lupa mora em quase todo aplicativo.
 *
 * Comunidade saiu da barra e continua com cartaz próprio em `/apps` — ela exige
 * uma decisão prévia («quero conversar»), que é o critério de corte acima.
 * Roteiros com IA é a exceção declarada: pelo critério ele também sairia, e fica
 * por decisão de produto — ver o comentário na lista.
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
 * O AVATAR ABRE `/meu`, e não uma gaveta. Ele já carregou uma lista de seis
 * atalhos mais o seletor de tema — a mesma lista que a tela de perfil já tinha,
 * repetida por cima do conteúdo e em outra ordem. Agora é um link: quem toca no
 * próprio rosto vai para a tela que fala dele, com nível, saldos e as duas
 * portas do programa. O tema foi junto e mora no fim daquela tela.
 */

interface Aba {
  href: string;
  rotulo: string;
  icone: React.ReactNode;
}

const ABAS: Aba[] = [
  { href: "/descobrir", rotulo: "Descobrir", icone: ICONE_DESCOBRIR },
  { href: "/acontece", rotulo: "Acontece", icone: ICONE_ACONTECE },
  { href: "/recompensas", rotulo: "Recompensas", icone: ICONE_RECOMPENSAS },
  { href: "/salvos", rotulo: "Salvos", icone: ICONE_SALVOS },
  /* Roteiros com IA fecha a fileira. Ele já tem cartaz em `/apps`, mas o hub é o quinto
     botão: a pergunta em linguagem natural é o caminho que se abre primeiro numa
     demonstração, e de lá estava a dois toques. Cabe porque as abas não têm rótulo — com
     texto, cinco alvos não entram em 390px sem truncar todos. */
  { href: "/ia", rotulo: "Roteiros com IA", icone: ICONE_IA },
];

const HREF_APPS = "/apps";

export function NavegacaoBarra() {
  // Sem a barra final: `trailingSlash: true` publica `/descobrir/`, e a
  // igualdade exata contra os hrefs sem barra nunca acenderia (mesma correção
  // que o menu lateral carrega).
  const caminho = (usePathname() ?? "").replace(/\/$/, "");
  const reduzir = useReducedMotion();
  const toque = transicaoDe("--dur-1", reduzir === true);

  const dentroDe = (href: string) => caminho === href || caminho.startsWith(`${href}/`);

  return (
    <>
      <header className="barra-topo">
        {/* O GRAFISMO NO LUGAR DA ASSINATURA. O `\C` é o marcador oficial do
            manual (D-11, FUND-03) — não é a assinatura recortada, que o manual
            proíbe alterar em proporção ou lettering. A assinatura completa segue
            no menu lateral e no rodapé, onde há largura para ela respirar. */}
        <Link href="/" className="barra-marca no-underline" aria-label="Início">
          <Grafismo variacao="completo" rotulo="Itaú Cultural" />
        </Link>

        <ContadorDeFichas />

        {/* A LUPA AO LADO DOS SALDOS. Mesmo alvo de 36px do botão da conta, porque as duas
            são ações do cabeçalho e um alvo menor que o vizinho lê como secundário sem
            que ninguém tenha decidido isso. */}
        <Link
          href="/buscar/"
          className="barra-busca no-underline"
          aria-label="Buscar eventos, artistas, obras e espaços"
        >
          {ICONE_BUSCAR}
        </Link>

        {/* O SINO ENTRE A LUPA E O PERFIL. Buscar é ação de quem procura; o sino é o que
            o produto tem a dizer; o avatar é quem você é. A ordem vai do que a pessoa faz
            para o que é dela, e o aviso fica no meio, onde o polegar passa. */}
        <SinoDeAvisos />

        {/* O AVATAR É UM LINK, E NÃO MAIS UM MENU. Ele abria uma gaveta com seis atalhos
            e o seletor de tema — uma lista de rótulos empilhada por cima do conteúdo, que
            dizia para onde ir mas nada sobre quem você é. Agora ele abre `/meu`, onde o
            nível, o percurso, as fichas e as duas portas principais têm espaço para ser
            mostrados em vez de listados. O tema foi junto e mora no fim daquela tela.

            O selo GRUDA NO ÍCONE, não fica ao lado: ao lado seria mais um item disputando
            a única linha do topo; grudado, é lido como propriedade da pessoa — um
            distintivo na lapela, não um número no painel. */}
        <Link
          href="/meu/"
          className="barra-conta-botao no-underline"
          aria-label="Seu perfil: nível, fichas e desafios"
          aria-current={dentroDe("/meu") ? "page" : undefined}
        >
          <IconeVivo ativo={dentroDe("/meu")}>{ICONE_PERFIL}</IconeVivo>
          <SeloDoPerfil />
        </Link>
      </header>

      <nav className="barra-inferior" aria-label="Navegação principal">
        <ul className="barra-abas">
          {ABAS.map((aba) => (
            <li key={aba.href}>
              <AbaLink
                href={aba.href}
                aria-current={dentroDe(aba.href) ? "page" : undefined}
                /* O rótulo saiu da barra e virou `aria-label`: sem ele o leitor de tela
                   anunciaria «link» quatro vezes. Nome escondido não é nome ausente. */
                aria-label={aba.rotulo}
                className="barra-aba"
                whileTap={reduzir ? undefined : { scale: 0.96 }}
                transition={toque}
              >
                <IconeVivo ativo={dentroDe(aba.href)}>{aba.icone}</IconeVivo>
              </AbaLink>
            </li>
          ))}
        </ul>

        {/* O botão SOME quando a pessoa já está no hub. Ele é uma porta, não uma
            aba: uma porta que continua acesa depois de atravessada convida a um
            toque que não leva a lugar nenhum — e, sendo laranja, ela seria a
            única AÇÃO em destaque da tela sem ter ação para oferecer. As quatro
            abas continuam, que é por onde se sai daqui. */}
        {dentroDe(HREF_APPS) ? null : (
          <Link
            href={HREF_APPS}
            aria-label="Apps"
            className="barra-apps"
            onPointerDown={(evento) => pulsarGradeApps(evento.currentTarget)}
          >
            {ICONE_APPS}
          </Link>
        )}
      </nav>
    </>
  );
}
