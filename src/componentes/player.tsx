"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CapaSemImagem } from "@/componentes/capa-sem-imagem";
import { FichaDeAcessibilidade } from "@/componentes/ficha-acessibilidade";
import { gravarConcluidas, lerConcluidas } from "@/componentes/play";
import {
  diaParaIso,
  diaParaTexto,
  DIMENSOES_DO_FILTRO,
  ROTULOS_DE_DIMENSAO,
} from "@/dados/play-wire";
import type { Acessibilidade } from "@/dados/tipos";

/**
 * player.tsx — a página de uma mídia (D-92, `docs/telas.md` tela 20).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * O PLAYER NÃO TOCA MÍDIA, E ISSO NÃO É UM DEFEITO ESCONDIDO: É A TELA DIZENDO O QUE É.
 *
 * Duas coisas diferentes, as duas verdadeiras, e a tela declara AS DUAS:
 *
 * 1. O acervo carregado traz a FICHA e a CAPA de cada mídia. O arquivo de áudio ou vídeo
 *    não faz parte destes dados — não há o que tocar, e fingir um controle de reprodução
 *    sobre nada seria a mentira mais barata desta fase.
 * 2. `fonte` aponta para itaucultural.org.br, e buscar de lá quebraria a promessa medida
 *    de ZERO REQUISIÇÃO EXTERNA, que vale para o protótipo inteiro desde a fase 2 e é
 *    medida a cada verificação, de dentro da página.
 *
 * Por isso NADA aqui carrega de fora: nem `<img>` remoto, nem `<iframe>`, nem `<video>`
 * ou `<audio>` com `src` remoto, nem `fetch`, nem `preconnect`, nem `dns-prefetch`.
 * `fonte` aparece como LINK que a pessoa clica — **um link que a pessoa clica não é uma
 * requisição que o protótipo faz**, e a diferença é exatamente o que o gate mede
 * (T-05-33).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * A CONCLUSÃO É UM GESTO HUMANO, NUNCA AUTOMÁTICA (D-92, T-05-36).
 *
 * Nada de temporizador, nada de gravar ao abrir, nada de «assistido» por rolagem.
 * `data-assistido` mede ZERO até o clique — é a mesma disciplina de «zero decisão antes
 * do clique» que a fase 4 fixou no Studio, e o gate a mede do mesmo jeito. Um protótipo
 * que registra sozinho estaria inventando um dado de uso que ninguém produziu.
 *
 * O registro é um CONJUNTO, não uma pilha: concluir a mesma mídia duas vezes deixa uma
 * entrada. E ele mora numa chave própria do espaço `agenda-cultural:`, definida em
 * `play.tsx` — **`src/contexto/sessao.tsx` não foi tocado**, porque é compartilhado com
 * a fase inteira.
 */

/**
 * O carimbo da conclusão vem da DATA DE REFERÊNCIA DO BUILD, jamais do relógio do
 * runtime. Sob `output: "export"` o HTML é gerado no build: um `new Date()` no cliente
 * faria o HTML exportado e a página hidratada divergirem, e ainda exporia o fuso de quem
 * avalia. É o mesmo padrão de `DATA_DE_REFERENCIA_DO_STUDIO`.
 *
 * Ela chega por propriedade, do módulo de servidor — este arquivo não a inventa.
 */
export interface MidiaDoPlayer {
  slug: string;
  titulo: string;
  rotuloCategoria: string;
  resumo: string;
  imagem?: string;
  imagemAlt?: string;
  creditoImagem?: string;
  dia: number;
  linguagens: string[];
  temas: string[];
  fonte?: string;
  acessibilidade: Acessibilidade;
  declaraAcessibilidade: boolean;
  procedencia: string;
}

export interface LigacaoNomeada {
  slug: string;
  titulo: string;
  rota: string;
  motivo?: string;
}

export function Player({
  midia,
  eventos,
  aprofunda,
  dataDeReferencia,
  semArquivo,
  coberturaDaPonte,
}: {
  midia: MidiaDoPlayer;
  /** Os eventos de que ESTA mídia fala — `fala_sobre`, a única ponte real. */
  eventos: LigacaoNomeada[];
  /** As arestas `aprofunda` que saem desta mídia. Medido no acervo: ZERO nas 529. */
  aprofunda: LigacaoNomeada[];
  dataDeReferencia: string;
  semArquivo: { titulo: string; acervo: string; rede: string };
  coberturaDaPonte: { midiasDistintas: number; deQuantas: number; eventosAlcancados: number };
}) {
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);

  // A leitura mora no efeito: ler `localStorage` no primeiro render divergiria da
  // hidratação, porque o HTML foi gerado no build.
  useEffect(() => {
    setConcluidas(lerConcluidas());
    setHidratado(true);
  }, []);

  const assistida = concluidas.includes(midia.slug);

  function concluir() {
    // CONJUNTO, não pilha: o `Set` é o que torna a conclusão idempotente.
    const proximo = [...new Set([...concluidas, midia.slug])];
    setConcluidas(proximo);
    gravarConcluidas(proximo);
  }

  function desfazer() {
    const proximo = concluidas.filter((s) => s !== midia.slug);
    setConcluidas(proximo);
    gravarConcluidas(proximo);
  }

  return (
    <article
      data-player={midia.slug}
      data-assistido={assistida ? "1" : "0"}
      className="flex flex-col gap-6 p-4 desk:mx-auto desk:max-w-[64rem] desk:p-8"
    >
      {/* ------------------------------------------------------------------- cabeçalho */}
      <header className="flex flex-col gap-2">
        <p className="text-[0.65rem] font-bold tracking-widest text-tinta-3 uppercase">
          {midia.rotuloCategoria}
        </p>
        <h1 className="text-xl leading-tight font-bold desk:text-3xl">{midia.titulo}</h1>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-tinta-2">
          <time dateTime={diaParaIso(midia.dia)}>Publicado em {diaParaTexto(midia.dia)}</time>
          <span>Acervo do Itaú Cultural</span>
        </p>
      </header>

      {/* ------------------------------------------------------------------------ capa */}
      <figure className="flex flex-col gap-1">
        {midia.imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={midia.imagem}
            alt={midia.imagemAlt ?? midia.titulo}
            decoding="async"
            className="w-full rounded-lg bg-superficie-2 object-cover"
          />
        ) : (
          <CapaSemImagem
            titulo={midia.titulo}
            classe="midia"
            linguagens={midia.linguagens}
            className="aspect-video w-full rounded-lg"
          />
        )}
        {midia.creditoImagem ? (
          /* Crédito obrigatório quando há imagem: o acervo é de terceiros e a procedência
             é argumento da proposta, não rodapé. */
          <figcaption className="text-xs text-tinta-2">Foto: {midia.creditoImagem}</figcaption>
        ) : null}
      </figure>

      {/* --------------------------------------- o arquivo que não existe (T-05-33) */}
      <section
        data-sem-arquivo
        className="flex flex-col gap-2 rounded-lg border border-dashed border-borda-forte p-3"
      >
        <h2 className="text-sm font-bold">{semArquivo.titulo}</h2>
        <p className="text-xs leading-relaxed">{semArquivo.acervo}</p>
        <p className="text-xs leading-relaxed">{semArquivo.rede}</p>
        {midia.fonte ? (
          <p className="text-xs leading-relaxed">
            <a
              data-fonte
              href={midia.fonte}
              target="_blank"
              rel="noreferrer noopener"
              className="break-all underline decoration-borda-forte underline-offset-4"
            >
              {midia.fonte}
            </a>
          </p>
        ) : null}
      </section>

      {/* --------------------------------------------------------------------- resumo */}
      {midia.resumo ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-bold">Sobre</h2>
          {/* O resumo INTEIRO. Ele não viaja no catálogo — esta rota é de servidor e não
              paga chunk, então é aqui que ele aparece sem corte. */}
          <p data-resumo className="text-sm leading-relaxed">
            {midia.resumo}
          </p>
        </section>
      ) : null}

      {/* --------------------------------------- acessibilidade em evidência (tela 20) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold">Recursos de acessibilidade desta mídia</h2>

        {/* Os TRÊS da tela 20 como controles de primeira ordem — legenda, Libras e
            audiodescrição —, cada um dizendo se ESTA mídia declara aquela dimensão. E,
            quando não declara, se é DECLARADO-AUSENTE ou NÃO-DECLARADO (D-43): «ausência
            de declaração não é negação», e achatar as duas afirmaria, em nome do Itaú
            Cultural, que o recurso não existe quando a fonte só não falou dele. */}
        <ul className="flex flex-wrap gap-1.5">
          {DIMENSOES_DO_FILTRO.map((campo) => {
            const presente = midia.acessibilidade[campo];
            const estado = presente
              ? "presente"
              : midia.declaraAcessibilidade
                ? "ausente-declarada"
                : "nao-declarada";
            return (
              <li
                key={campo}
                data-recurso-em-evidencia={campo}
                data-estado={estado}
                className="player-recurso"
              >
                <span className="player-recurso-nome">{ROTULOS_DE_DIMENSAO[campo]}</span>
                <span className="player-recurso-estado">
                  {estado === "presente"
                    ? "declarado"
                    : estado === "ausente-declarada"
                      ? "declarado ausente"
                      : "não declarado"}
                </span>
              </li>
            );
          })}
        </ul>

        {/* A ficha das 8, sempre as 8, no vocabulário que a fase 2 já fixou. Reusada em
            vez de reescrita: um segundo vocabulário para a mesma coisa divergiria. */}
        <FichaDeAcessibilidade
          acessibilidade={midia.acessibilidade}
          declaraDimensoes={midia.declaraAcessibilidade}
          fonteDaDeclaracao="Enciclopédia Itaú Cultural"
        />
      </section>

      {/* ------------------------------------------- concluir → repertório (D-92) */}
      <section className="flex flex-col gap-2 rounded-lg border border-borda p-3">
        <h2 className="text-sm font-bold">Marcar no meu repertório</h2>

        {assistida ? (
          <>
            <p data-registro className="text-sm">
              Registrada no seu repertório em{" "}
              <time dateTime={dataDeReferencia}>
                {diaParaTexto(Number(dataDeReferencia.replace(/-/g, "")))}
              </time>
              .
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" data-concluir onClick={concluir} className="player-botao" aria-pressed>
                Concluída
              </button>
              <button
                type="button"
                data-desfazer
                onClick={desfazer}
                className="text-xs underline decoration-borda-forte underline-offset-4"
              >
                desfazer
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-tinta-2">
              {hidratado
                ? "Nada foi registrado ainda."
                : "Lendo o que ficou guardado neste navegador…"}
            </p>
            <button
              type="button"
              data-concluir
              onClick={concluir}
              className="player-botao"
              aria-pressed={false}
            >
              Marcar como concluída
            </button>
          </>
        )}

      </section>

      {/* ------------------------------------------------ o que isto aprofunda (tela 20) */}
      <section
        data-veja-isto
        className="flex flex-col gap-2 rounded-lg border border-borda p-3"
      >
        <h2 className="text-sm font-bold">O que esta mídia aprofunda</h2>

        {eventos.length || aprofunda.length ? (
          <ul className="flex flex-col gap-1">
            {[...eventos, ...aprofunda].map((l) => (
              <li key={l.rota}>
                <Link
                  href={l.rota}
                  data-ligacao={l.slug}
                  className="text-sm underline decoration-borda-forte underline-offset-4 hover:decoration-current"
                >
                  {l.titulo}
                </Link>
                {l.motivo ? <span className="text-xs text-tinta-2"> — {l.motivo}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          /* O bloco NÃO some: declara com o denominador. Sumir faria parecer que a
             funcionalidade não existe; declarado, o vazio vira a medida do acervo. */
          <p data-sem-ligacao className="text-sm leading-relaxed">
            Esta mídia não declara ligação com nenhum evento do acervo. Só{" "}
            <strong data-denominador="com-ponte">{coberturaDaPonte.midiasDistintas}</strong>{" "}
            das <strong data-denominador="total">{coberturaDaPonte.deQuantas}</strong> mídias
            declaram — juntas elas alcançam {coberturaDaPonte.eventosAlcancados} eventos.
          </p>
        )}
      </section>

      <p className="text-xs">
        <Link href="/play/" className="underline decoration-borda-forte underline-offset-4">
          ← voltar ao catálogo
        </Link>
      </p>
    </article>
  );
}
