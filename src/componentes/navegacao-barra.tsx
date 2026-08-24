"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ICONE_ACONTECE,
  ICONE_APPS,
  ICONE_BUSCAR,
  ICONE_DESCOBRIR,
  ICONE_PERFIL,
  ICONE_SALVOS,
} from "@/componentes/base/icones";
import { AssinaturaIc } from "@/componentes/marca";
import { SeletorDeTema } from "@/componentes/seletor-tema";
import { useSessao } from "@/contexto/sessao";
import { ATALHOS_CONTA } from "@/dados/apps";
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
  const [contaAberta, setContaAberta] = useState(false);

  // Trocar de tela FECHA o menu. Sem isto ele sobreviveria à navegação e
  // reapareceria aberto sobre a tela seguinte, que nunca é o que se espera.
  useEffect(() => setContaAberta(false), [caminho]);

  const dentroDe = (href: string) => caminho === href || caminho.startsWith(`${href}/`);

  return (
    <>
      <header className="barra-topo">
        <AssinaturaIc prioridade />

        {/* A CONTA VIRA ÍCONE, e o que era a seção «Sua conta» no fim de /apps
            mora aqui dentro (pedido de 23/08). O nome da persona saiu do
            cabeçalho: ele ocupava a única linha do topo com um dado que só
            interessa a quem está avaliando a demonstração, e continua visível no
            menu, no perfil e no rodapé do trilho da web.

            SEM SCRIM, e o fechamento é por foco: um scrim precisaria posicionar
            contra a moldura e este cabeçalho é `sticky`, ou seja o contêiner
            dele — o scrim cobriria só a faixa do topo. Fechar em `Escape`, ao
            sair o foco e ao tocar num item cobre teclado e dedo sem inventar
            camada nova. */}
        <div
          className="barra-conta"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setContaAberta(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setContaAberta(false);
          }}
        >
          <button
            type="button"
            data-conta
            aria-expanded={contaAberta}
            aria-controls="menu-da-conta"
            aria-label={`Sua conta — você está como ${persona?.nome ?? "…"}`}
            className="barra-conta-botao"
            onClick={() => setContaAberta((v) => !v)}
          >
            {ICONE_PERFIL}
          </button>

          {contaAberta ? (
            <div id="menu-da-conta" className="barra-conta-menu">
              <p className="barra-conta-persona tipo-micro">
                você está como {persona?.nome ?? "…"}
              </p>
              {ATALHOS_CONTA.map((atalho) => (
                <Link
                  key={atalho.href}
                  href={atalho.href}
                  className="barra-conta-item"
                  onClick={() => setContaAberta(false)}
                >
                  <span className="barra-conta-rotulo tipo-detalhe">{atalho.rotulo}</span>
                  <span className="barra-conta-descricao tipo-legenda">{atalho.descricao}</span>
                </Link>
              ))}
              <SeletorDeTema />
            </div>
          ) : null}
        </div>
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

        {/* O botão SOME quando a pessoa já está no hub. Ele é uma porta, não uma
            aba: uma porta que continua acesa depois de atravessada convida a um
            toque que não leva a lugar nenhum — e, sendo laranja, ela seria a
            única AÇÃO em destaque da tela sem ter ação para oferecer. As quatro
            abas continuam, que é por onde se sai daqui. */}
        {dentroDe(HREF_APPS) ? null : (
          <Link href={HREF_APPS} className="barra-apps">
            {ICONE_APPS}
            <span className="tipo-micro">Apps</span>
          </Link>
        )}
      </nav>
    </>
  );
}
