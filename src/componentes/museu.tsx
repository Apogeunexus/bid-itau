import { cloneElement, type ReactElement } from "react";
import Link from "next/link";
import { Chip } from "@/componentes/base/chip";
import {
  ICONE_ACONTECE,
  ICONE_APPS,
  ICONE_CHEVRON_DIREITA,
  ICONE_FONES,
  ICONE_MAPA,
  ICONE_PERFIL,
  ICONE_SETA,
} from "@/componentes/base/icones";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import {
  hubDoMuseu,
  TETO_DA_LISTA_DE_ESPACOS,
  type CartazDoMuseu,
  type EspacoDoMuseu,
  type PortaDoMuseu,
} from "@/dados/museu";

/**
 * museu.tsx — o hub do Museu virtual.
 *
 * COMPONENTE DE SERVIDOR (DP-F). O recorte vive em `museu.ts`; daqui para baixo
 * só primitivo. A forma é a da referência de 23/08: abertura com as três portas,
 * mosaico de cartaz (um em pé, dois paisagem, o resto em faixa) e a lista dos
 * espaços-museu. O que a referência inventava — data de encerramento, «online»
 * em ocupação presencial — não atravessa. As fachadas dos espaços vêm da web
 * (Wikimedia Commons), não do acervo do IC, que não publica imagem de espaço.
 *
 * Os chips NÃO recortam a grade. A referência pinta «Exposições» como ativo e
 * mesmo assim mostra ocupações embaixo: são atalhos, não filtro. Recortar de
 * verdade esconderia o Machado, que é o cartaz de abertura.
 */

const GLIFO_DA_PORTA: Record<PortaDoMuseu["id"], ReactElement<{ className?: string }>> = {
  exposicoes: ICONE_APPS,
  ocupacoes: ICONE_PERFIL,
  visitas: ICONE_FONES,
};

function glifo(icone: ReactElement<{ className?: string }>) {
  return cloneElement(icone, { className: "museu-glifo" });
}

function IlustracaoDoMuseu() {
  return (
    <svg
      viewBox="0 0 200 240"
      className="museu-ilustra"
      aria-hidden
      focusable="false"
    >
      <path
        className="museu-ilustra-arco"
        d="M78 176V122a22 22 0 0 1 44 0v54Z"
      />
      <path
        d="M100 18c-18 0-32 12-36 28h72c-4-16-18-28-36-28Z"
        fill="currentColor"
        opacity={0.18}
      />
      <path
        d="M64 52h72v10H64Z"
        fill="currentColor"
        opacity={0.22}
      />
      <path d="M22 86 100 42l78 44H22Z" fill="currentColor" opacity={0.14} />
      <path d="M22 86 100 42l78 44" fill="none" stroke="currentColor" strokeWidth={2.2} />
      <path d="M28 86h144v12H28Z" fill="currentColor" opacity={0.2} />
      <path d="M34 98h132v8H34Z" fill="currentColor" opacity={0.12} />
      <path d="M40 106v70M62 106v70M138 106v70M160 106v70" stroke="currentColor" strokeWidth={3.2} />
      <path d="M36 176h40M124 176h40" stroke="currentColor" strokeWidth={3.2} />
      <path
        d="M78 122a22 22 0 0 1 44 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
      />
      <path d="M20 186h160v8H20Z" fill="currentColor" opacity={0.2} />
      <path d="M32 194h136v8H32Z" fill="currentColor" opacity={0.14} />
      <path d="M44 202h112v8H44Z" fill="currentColor" opacity={0.1} />
      <path d="M16 210h168" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

function Cartaz({ item }: { item: CartazDoMuseu }) {
  return (
    <li className={`museu-cartaz museu-cartaz--${item.porte}`}>
      <Link href={item.rota} className="museu-cartaz-link" data-cartaz={item.slug}>
        {item.imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imagem}
            alt={item.altImagem}
            className="museu-cartaz-foto"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <CapaDeCartao
            titulo={item.titulo}
            classe="evento"
            rotulo={item.rotuloCategoria}
            linguagens={item.linguagens}
            compacta
            className="museu-cartaz-foto"
          />
        )}
        <span className="museu-cartaz-veu" aria-hidden />
        <span className="museu-cartaz-miolo">
          <span className="museu-cartaz-selos">
            <span className="museu-cartaz-selo tipo-micro">Evento</span>
            <span className="museu-cartaz-selo museu-cartaz-selo--tipo tipo-micro">
              {item.rotuloCategoria}
            </span>
          </span>
          <span className="museu-cartaz-titulo tipo-destaque">{item.titulo}</span>
          {item.meta ? (
            <span className="museu-cartaz-meta tipo-legenda">
              {glifo(ICONE_ACONTECE)}
              {item.meta}
            </span>
          ) : null}
        </span>
        <span className="museu-cartaz-ir" aria-hidden>
          {glifo(ICONE_SETA)}
        </span>
      </Link>
    </li>
  );
}

function LinhaDeEspaco({ espaco }: { espaco: EspacoDoMuseu }) {
  return (
    <li>
      <Link href={espaco.rota} className="museu-espaco" data-espaco={espaco.slug}>
        <CapaDeCartao
          titulo={espaco.titulo}
          classe="espaco"
          rotulo="Museu"
          linguagens={espaco.linguagens}
          imagem={espaco.imagem}
          creditoImagem={espaco.creditoImagem}
          alt={espaco.altImagem}
          compacta
          className="museu-espaco-capa"
        />
        <span className="museu-espaco-texto">
          <span className="museu-espaco-titulo tipo-detalhe">{espaco.titulo}</span>
          {espaco.resumo ? (
            <span className="museu-espaco-resumo tipo-legenda">{espaco.resumo}</span>
          ) : null}
          {espaco.lugar ? (
            <span className="museu-espaco-lugar tipo-legenda">
              {glifo(ICONE_MAPA)}
              {espaco.lugar}
            </span>
          ) : null}
        </span>
        <span className="museu-espaco-ir" aria-hidden>
          {glifo(ICONE_CHEVRON_DIREITA)}
        </span>
      </Link>
    </li>
  );
}

export function Museu() {
  const hub = hubDoMuseu();
  const vitrine = hub.espacos.slice(0, TETO_DA_LISTA_DE_ESPACOS);
  const resto = hub.espacos.slice(TETO_DA_LISTA_DE_ESPACOS);

  return (
    <div className="museu">
      <header className="museu-destaque">
        <div className="museu-destaque-texto">
          <p className="museu-kicker tipo-micro">Destaque</p>
          <h1 className="museu-titulo tipo-cartaz">Museu virtual</h1>
          <p className="museu-linha tipo-detalhe">
            Exposições, ocupações e visitas digitais do acervo — e os espaços-museu que a
            Enciclopédia cita.
          </p>
          <div role="group" aria-label="Portas do museu" className="museu-portas">
            {hub.portas.map((porta) => (
              <Chip key={porta.id} href={porta.href}>
                {glifo(GLIFO_DA_PORTA[porta.id])}
                {porta.rotulo}
              </Chip>
            ))}
          </div>
        </div>
        <IlustracaoDoMuseu />
      </header>

      <section className="museu-secao" id="cartaz" aria-labelledby="museu-cartaz-titulo">
        <div className="museu-secao-cabecalho">
          <h2 id="museu-cartaz-titulo" className="museu-secao-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
            Em cartaz e ocupações
            <span className="museu-secao-n tipo-legenda" data-denominador="cartaz">
              {hub.cartaz.length}
            </span>
          </h2>
          <Link href="/museu/exposicoes/" className="museu-secao-tudo tipo-detalhe">
            Ver todas
          </Link>
        </div>
        <ul className="museu-grade">
          {hub.cartaz.map((item) => (
            <Cartaz key={item.slug} item={item} />
          ))}
        </ul>
      </section>

      <section className="museu-secao" id="espacos" aria-labelledby="museu-espacos-titulo">
        <div className="museu-secao-cabecalho">
          <h2 id="museu-espacos-titulo" className="museu-secao-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
            Espaços-museu do acervo
            <span className="museu-secao-n tipo-legenda" data-denominador="espacos">
              {hub.espacos.length}
            </span>
          </h2>
          <a href="#explorar-espacos" className="museu-secao-tudo tipo-detalhe">
            Ver todos
          </a>
        </div>
        <ul className="museu-espacos">
          {vitrine.map((espaco) => (
            <LinhaDeEspaco key={espaco.slug} espaco={espaco} />
          ))}
        </ul>
        {resto.length ? (
          <details id="explorar-espacos" className="museu-explorar">
            <summary>
              {glifo(ICONE_SETA)}
              Explorar todos os espaços
            </summary>
            <ul className="museu-espacos">
              {resto.map((espaco) => (
                <LinhaDeEspaco key={espaco.slug} espaco={espaco} />
              ))}
            </ul>
          </details>
        ) : null}
      </section>
    </div>
  );
}
