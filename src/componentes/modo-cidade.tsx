"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chip, TrilhoDeChips } from "@/componentes/base/chip";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import { MapaDoDia } from "@/componentes/mapa-do-dia";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import type { AlternativaCompacta, DadosDaCidade, DiaCompacto } from "@/dados/cidade";

/**
 * modo-cidade.tsx — a resposta ao Cenário 2, e a tela onde a decisão que destravou a fase
 * fica visível.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O CONTROLE DO TOPO É A DECISÃO DA FASE, MATERIALIZADA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Não existe seletor de data nesta tela.** A janela é «quantos dias você fica», nunca
 * «quando você vem» — e essa distinção não é detalhe de interface: é D-48 e D-49 virando
 * controle. O acervo do Itaú Cultural não tem um único registro com data futura E lugar;
 * uma consulta por data aqui devolveria vazio, e fabricar a data para salvar a consulta
 * destruiria o argumento central da proposta, que é procedência honesta.
 *
 * Pelo mesmo motivo não existe nesta tela filtro de janela temporal, contagem de «eventos
 * nesta semana», nem qualquer texto que prometa programação. Se a tela precisasse de uma
 * data para funcionar, o desenho estaria errado.
 *
 * **A frase de enquadramento (D-52) é CONTEÚDO DE PRODUTO e fica sempre.** Ela não é
 * rodapé: é ela que converte a limitação do acervo em demonstração do produto, apontando
 * para o Studio que a fase 4 constrói. Quem conduzir a apresentação vai lê-la em voz alta
 * e usá-la como transição.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DP-F — ESTE ARQUIVO NÃO ALCANÇA O GRAFO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Tudo o que ele mostra chega por propriedade, já calculado no build por
 * `cidade/[slug]/page.tsx`: os roteiros de 2, 3, 4 e 5 dias e, para cada posição de cada
 * dia, a fila de substitutos com o deslocamento já medido. O único import daqui para
 * `@/dados/cidade` é `import type`, que o compilador apaga — o mesmo contrato que
 * `acontece.tsx` mantém com `agenda.ts`.
 *
 * A CONSEQUÊNCIA DISSO É UMA REGRA DE PRODUTO, e ela está dita na tela: **uma troca ativa
 * por dia**. Cada alternativa foi medida contra o dia original com aquela posição trocada;
 * duas trocas simultâneas produziriam um dia que ninguém mediu, e o número de quilômetros
 * viraria estimativa feita no navegador sem `geo.ts`. Trocar outro item do mesmo dia
 * devolve o anterior, e a tela avisa.
 */

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

/**
 * Quilômetros em português: vírgula decimal, uma casa.
 *
 * Escrito aqui e não importado de `@/dados/cidade` porque importar VALOR de lá arrastaria o
 * grafo para o navegador (DP-F). Isto é formatação de texto, não a conta — a haversine
 * continua tendo uma implementação só, em `geo.ts`, e o número já chega pronto.
 */
function km(valor: number): string {
  return valor.toFixed(1).replace(".", ",");
}

function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

// ---------------------------------------------------------------------------
// A lente para o mapa — D-59
// ---------------------------------------------------------------------------

/**
 * A gramática de três chaves, a mesma de 03-01, 03-03 e 03-04:
 *   `r` — as chaves `{classe}_{slug}` do recorte, juntadas por `~`
 *   `t` — o título legível
 *   `v` — o endereço de volta, com o estado DESTA tela dentro
 *
 * A barra antes do `#` acompanha `trailingSlash: true` do `next.config.ts`: sem ela o
 * servidor estático responde com um redirecionamento antes de o hash ser lido.
 */
function hashDeLente(recorte: readonly string[], titulo: string, volta: string): string {
  const r = recorte.map(encodeURIComponent).join("~");
  return `/mapa/#r=${r}&t=${encodeURIComponent(titulo)}&v=${encodeURIComponent(volta)}`;
}

// ---------------------------------------------------------------------------
// Estado de troca
// ---------------------------------------------------------------------------

/** A troca ativa de um dia: qual POSIÇÃO ORIGINAL foi trocada e por qual substituto da fila. */
interface TrocaAtiva {
  posicao: number;
  n: number;
}

interface DiaResolvido {
  numero: number;
  /** Índices no acervo, na ordem do percurso. */
  ordem: number[];
  deslocamentoKm: number;
  ancoradosNoCentroide: number;
  ancoradosEmEspaco: number;
  justificativa: string;
  troca: TrocaAtiva | null;
  alternativa: AlternativaCompacta | null;
}

function resolverDia(dia: DiaCompacto, troca: TrocaAtiva | null): DiaResolvido {
  const alternativa = troca ? (dia.alternativas[troca.posicao]?.[troca.n] ?? null) : null;
  if (!alternativa) {
    return {
      numero: dia.numero,
      ordem: dia.itens,
      deslocamentoKm: dia.deslocamentoKm,
      ancoradosNoCentroide: dia.ancoradosNoCentroide,
      ancoradosEmEspaco: dia.ancoradosEmEspaco,
      justificativa: dia.justificativa,
      troca: null,
      alternativa: null,
    };
  }
  return {
    numero: dia.numero,
    ordem: alternativa.ordem,
    deslocamentoKm: alternativa.deslocamentoKm,
    ancoradosNoCentroide: alternativa.ancoradosNoCentroide,
    // O número de âncoras em espaço sai da ordem nova, contado na renderização abaixo.
    ancoradosEmEspaco: alternativa.ordem.length - alternativa.ancoradosNoCentroide,
    justificativa: alternativa.justificativa,
    troca,
    alternativa,
  };
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function ModoCidade({ dados }: { dados: DadosDaCidade }) {
  const { acervo, enquadramento, opcoesDeDias, roteiros } = dados;

  /* A primeira renderização usa o PADRÃO, nunca o hash: sob `output: "export"` o HTML é
   * gerado no build, e ler `location` no primeiro render divergiria da hidratação. A
   * leitura do hash mora no efeito abaixo, que só roda no cliente — mesmo padrão de
   * `acontece.tsx` e `mapa.tsx`. */
  const [dias, setDias] = useState<number>(dados.diasPadrao);
  const [trocas, setTrocas] = useState<Record<number, TrocaAtiva>>({});
  const [texto, setTexto] = useState<string | null>(null);
  const [recadoDaCopia, setRecadoDaCopia] = useState<string | null>(null);

  /**
   * T-03-31 — o número de dias vindo do hash é entrada de fora.
   *
   * Só passa valor que existe entre as combinações PRÉ-COMPUTADAS. Qualquer outro cai no
   * padrão, em vez de procurar um roteiro que não foi calculado e renderizar tela vazia no
   * meio da apresentação. É o mesmo tratamento que a 03-01 deu ao dia digitado no hash.
   */
  const aplicarDias = useCallback(
    (candidato: number) => {
      if (!opcoesDeDias.includes(candidato)) return false;
      setDias(candidato);
      setTrocas({});
      return true;
    },
    [opcoesDeDias],
  );

  useEffect(() => {
    const ler = () => {
      const achado = /(?:^#|[#&])dias=(\d+)/.exec(window.location.hash);
      if (!achado) return;
      aplicarDias(Number(achado[1]));
    };
    ler();
    window.addEventListener("hashchange", ler);
    return () => window.removeEventListener("hashchange", ler);
  }, [aplicarDias]);

  const escolherDias = useCallback(
    (candidato: number) => {
      if (!aplicarDias(candidato)) return;
      setTexto(null);
      setRecadoDaCopia(null);
      /* `replaceState` e não `pushState`: mudar quantos dias você fica é refazer o recorte,
       * não navegar. A rota permanece `/cidade/{slug}/`, e o gate de navegador mede
       * exatamente isso. */
      try {
        window.history.replaceState(null, "", `#dias=${candidato}`);
      } catch {
        // Contexto sem history acessível: espelhar o recorte é conveniência, não requisito.
      }
    },
    [aplicarDias],
  );

  const roteiro = roteiros[String(dias)] ?? roteiros[String(dados.diasPadrao)];

  const resolvidos = useMemo(
    () => roteiro.dias.map((dia, i) => resolverDia(dia, trocas[i] ?? null)),
    [roteiro, trocas],
  );

  /**
   * Alterna o item de uma posição SEM refazer o roteiro: só o dia clicado muda.
   *
   * Clicar de novo na mesma posição anda na fila de substitutos; clicar em outra posição do
   * mesmo dia devolve o item anterior e troca a nova — é a consequência de manter todo
   * número de deslocamento medido no build, e a tela diz isso ao lado do controle.
   */
  const alternar = useCallback(
    (diaIndice: number, posicaoOriginal: number) => {
      setTrocas((atual) => {
        const fila = roteiro.dias[diaIndice]?.alternativas[posicaoOriginal] ?? [];
        if (!fila.length) return atual;
        const ativa = atual[diaIndice];
        const proxima: TrocaAtiva =
          ativa && ativa.posicao === posicaoOriginal
            ? { posicao: posicaoOriginal, n: (ativa.n + 1) % fila.length }
            : { posicao: posicaoOriginal, n: 0 };
        return { ...atual, [diaIndice]: proxima };
      });
    },
    [roteiro],
  );

  // --- Exportar: sem rede e sem biblioteca (tela 11) ------------------------
  const roteiroEmTexto = useMemo(() => {
    const linhas: string[] = [];
    linhas.push(`Roteiro de ${dados.titulo} · ${plural(resolvidos.length, "dia", "dias")}`);
    linhas.push("");
    linhas.push(enquadramento.frase);
    linhas.push(enquadramento.fraseDoStudio);
    linhas.push("");
    for (const dia of resolvidos) {
      linhas.push(
        `Dia ${dia.numero} — ${km(dia.deslocamentoKm)} km em linha reta · ${dia.justificativa}`,
      );
      for (const i of dia.ordem) {
        const item = acervo[i];
        const data = item.dataDeclarada ?? item.ausenciaDeData;
        linhas.push(`  · ${item.titulo} (${item.rotuloClasse}) — ${data}`);
      }
      linhas.push("");
    }
    linhas.push(dados.fonteDaDistancia);
    return linhas.join("\n");
  }, [acervo, dados.titulo, dados.fonteDaDistancia, enquadramento, resolvidos]);

  const exportar = useCallback(() => {
    setTexto(roteiroEmTexto);
    void (async () => {
      try {
        await navigator.clipboard.writeText(roteiroEmTexto);
        setRecadoDaCopia("copiado para a área de transferência");
      } catch {
        /* Permissão de área de transferência recusada é o caso COMUM em navegador sem
         * gesto confiável, e por isso o texto já está na tela antes da tentativa: quem
         * exporta seleciona e copia à mão. Um erro no lugar do roteiro seria a resposta
         * errada para uma permissão que nunca foi obrigatória. */
        setRecadoDaCopia("a área de transferência não liberou — o texto está aqui para copiar");
      }
    })();
  }, [roteiroEmTexto]);

  // --- A volta para o mapa (D-59) ------------------------------------------
  const chavesComCoordenada = resolvidos
    .flatMap((dia) => dia.ordem)
    .map((i) => acervo[i])
    .filter((item) => item.ancora)
    .map((item) => item.chave);

  const lente = hashDeLente(
    chavesComCoordenada,
    `Roteiro de ${dados.titulo} · ${plural(resolvidos.length, "dia", "dias")}`,
    `/cidade/${dados.slug}/#dias=${dias}`,
  );

  return (
    <div className="cidade-tela" data-cidade={dados.slug}>
      {/* ================================================================== */}
      {/* 1 — A CIDADE E A JANELA. «Quantos dias você fica», nunca «quando    */}
      {/*     você vem»: a decisão da fase inteira, materializada num          */}
      {/*     controle. Não existe seletor de data nesta tela.                */}
      {/* ================================================================== */}
      <header className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{dados.titulo}</h1>
        </div>

        {/* D-51 na contagem: quantos registros trazem data e quantos não. Os números
            saíram da frase de enquadramento para ela caber na primeira vista, e vieram
            para cá — não sumiram, que é o que importa. */}
        <p className="text-[0.65rem] tracking-wide text-tinta-3 uppercase">
          {[dados.estado, dados.pais].filter(Boolean).join(" · ")}
          {` · ${enquadramento.total} registros · ${enquadramento.comData} com data · ${enquadramento.semData} sem`}
        </p>

        <div className="cidade-janela">
          <span className="cidade-janela-rotulo">quantos dias você fica</span>
          <TrilhoDeChips rotulo="Quantos dias você fica" className="cidade-dias">
            {opcoesDeDias.map((n) => (
              <Chip key={n} data-dias={n} selecionado={n === dias} onClick={() => escolherDias(n)}>
                {n}
              </Chip>
            ))}
          </TrilhoDeChips>
        </div>
      </header>

      {/* ================================================================== */}
      {/* 2 — A FRASE DE ENQUADRAMENTO (D-49, D-52).                          */}
      {/*     TEXTO DE PRODUTO. É a frase mais                                */}
      {/*     importante da fase e a ponte narrativa para o Studio.            */}
      {/* ================================================================== */}
      <section className="cidade-enquadramento" data-enquadramento={dados.slug}>
        <Grafismo variacao="barra" className="h-4 w-auto shrink-0 text-acao-tinta" />
        <div className="flex flex-col gap-1.5">
          <p className="cidade-enquadramento-frase">{enquadramento.frase}</p>
          <p className="cidade-enquadramento-adiante">{enquadramento.fraseDoStudio}</p>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 3 — UM CARTÃO POR DIA (D-50).                                       */}
      {/* ================================================================== */}
      <section className="flex flex-col gap-3">
        {resolvidos.map((dia, diaIndice) => {
          const itens = dia.ordem.map((i) => acervo[i]);
          const todosNoCentroide = dia.ancoradosNoCentroide === itens.length;
          const original = roteiro.dias[diaIndice];

          return (
            <article key={dia.numero} className="cidade-dia" data-dia-roteiro={dia.numero}>
              <header className="cidade-dia-cabeca">
                <h2 className="cidade-dia-titulo">{`Dia ${dia.numero}`}</h2>
                <p className="cidade-dia-deslocamento">
                  {todosNoCentroide
                    ? /* NUNCA «0 km» quando todos os itens ancoram no mesmo ponto: um zero
                         ali se leria como defeito do cálculo, quando é o que o dado sabe. */
                      `deslocamento não estimável — ${plural(itens.length, "item ancorado", "itens ancorados")} no centroide do município, que é um ponto só`
                    : `${km(dia.deslocamentoKm)} km em linha reta`}
                </p>
              </header>

              <p className="cidade-dia-justificativa">{dia.justificativa}</p>

              {/* O PERCURSO DESENHADO (reformulação 2026-08): as paradas do dia como pinos
                  numerados. Os pontos chegam projetados do build — este arquivo continua
                  sem alcançar geo.ts (DP-F). A troca de item redesenha junto, porque os
                  itens vêm da mesma ordem resolvida. */}
              <MapaDoDia itens={itens} numero={dia.numero} />

              <ol className="cidade-itens">
                {itens.map((item, posicaoVisivel) => {
                  /* A POSIÇÃO ORIGINAL, e não a visível: a fila de substitutos foi
                     pré-computada por posição do dia original, e o item que entrou ocupa a
                     posição de quem saiu. */
                  const naOrdemOriginal = original.itens.indexOf(dia.ordem[posicaoVisivel]);
                  const posicaoOriginal =
                    naOrdemOriginal >= 0 ? naOrdemOriginal : (dia.troca?.posicao ?? 0);
                  const fila = original.alternativas[posicaoOriginal] ?? [];
                  const entrou = naOrdemOriginal < 0;

                  return (
                    <li key={item.chave} className="cidade-item" data-item-roteiro={item.chave}>
                      {/* A COLUNA DA ESQUERDA CARREGA A CAPA E O CONTROLE DE TROCA.
                          O controle mora aqui, e não embaixo do texto, por medida: no texto
                          ele custava uma linha inteira por item e empurrava o primeiro dia
                          para fora da primeira vista da moldura — que é a foto do slide.
                          Debaixo da capa ele ocupa espaço que já estava vazio. */}
                      <div className="cidade-item-capa">
                        <CapaDeCartao
                          titulo={item.titulo}
                          classe={item.classe}
                          linguagens={item.linguagens}
                          imagem={item.imagem}
                          creditoImagem={item.creditoImagem}
                          className="h-14 w-full rounded-lg"
                        />
                        <button
                          type="button"
                          data-alternar-item={item.chave}
                          disabled={!fila.length}
                          onClick={() => alternar(diaIndice, posicaoOriginal)}
                          className="cidade-alternar"
                          title={
                            fila.length
                              ? "trocar este item por outro do acervo deste território"
                              : "o acervo não tem outro item que caiba neste dia"
                          }
                        >
                          trocar
                        </button>
                      </div>

                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="cidade-item-classe">
                          {item.rotuloClasse}
                          {item.ancora
                            ? item.ancora.noCentroide
                              ? ` · centroide de ${item.ancora.origemTitulo}`
                              : ` · ${item.ancora.origemTitulo}`
                            : " · sem posição sustentada pelo acervo"}
                          {entrou ? " · trocado" : ""}
                        </p>

                        {item.rota ? (
                          <Link href={item.rota} className="cidade-item-titulo">
                            {item.titulo}
                          </Link>
                        ) : (
                          <span className="cidade-item-titulo">{item.titulo}</span>
                        )}

                        {item.linguagens.length ? (
                          <SelosDeLinguagem ids={item.linguagens} limite={1} />
                        ) : null}

                        {/* D-51: com data, a data; sem data, a ausência dita. */}
                        <p
                          className={
                            item.dataDeclarada ? "cidade-item-data" : "cidade-item-sem-data"
                          }
                        >
                          {item.dataDeclarada
                            ? `data declarada na fonte: ${item.dataDeclarada}`
                            : item.ausenciaDeData}
                        </p>

                        {/* T-03-30: a marca vem com o número que a sustenta. */}
                        {item.proprioDoTerritorio ? (
                          <p
                            className="cidade-item-proprio"
                            data-proprio={item.proprioDoTerritorio.contagem}
                            title={item.proprioDoTerritorio.frase}
                          >
                            <Grafismo
                              variacao="barra"
                              className="mt-px h-3 w-auto shrink-0 text-acao-tinta"
                            />
                            <span>{item.proprioDoTerritorio.curta}</span>
                          </p>
                        ) : null}

                      </div>
                    </li>
                  );
                })}
              </ol>

              <p className="cidade-dia-nota">
                {dia.alternativa
                  ? dia.alternativa.motivo
                  : "uma troca por dia de cada vez"}
              </p>
            </article>
          );
        })}
      </section>

      {/* A DECLARAÇÃO DA FONTE DA DISTÂNCIA (T-03-29) mora depois dos dias, e não antes:
          cada dia já diz «em linha reta» junto do seu número, e o parágrafo que qualifica a
          medida empurraria o primeiro dia para fora da primeira vista da moldura — que é a
          foto que vai para o slide. Ela continua na tela, e continua obrigatória. */}
      <p className="cidade-fonte-distancia">{dados.fonteDaDistancia}</p>

      {/* A legenda da marca aparece UMA VEZ, e não em cada cartão: o número precisa estar
          junto do item, mas a definição do que ele conta cabe numa linha só da tela. */}
      <p className="cidade-legenda-proprio">
        {`«só em ${dados.titulo}» marca o registro que o acervo situa num único município; o número diz quantas entidades do mesmo conjunto daqui também não aparecem em nenhum outro território — ${enquadramento.proprios} dos ${enquadramento.total} registros de ${dados.titulo} recebem a marca.`}
      </p>

      {/* ================================================================== */}
      {/* 4 — EXPORTAR e a LENTE PARA O MAPA (D-59).                          */}
      {/* ================================================================== */}
      <section className="cidade-acoes">
        <button type="button" onClick={exportar} className="cidade-acao" data-exportar>
          exportar o roteiro em texto
        </button>
        <Link href={lente} className="cidade-acao" data-lente>
          {`ver os ${plural(chavesComCoordenada.length, "item", "itens")} deste roteiro no mapa`}
        </Link>
      </section>

      {texto ? (
        <section className="cidade-exportado">
          {recadoDaCopia ? <p className="cidade-exportado-recado">{recadoDaCopia}</p> : null}
          <pre className="cidade-exportado-texto">{texto}</pre>
        </section>
      ) : null}

      {/* ================================================================== */}
      {/* 5 — OUTRAS CIDADES, para a tela não ser um beco.                    */}
      {/* ================================================================== */}
      <section className="flex flex-col gap-1.5">
        <p className="text-[0.65rem] tracking-wide text-tinta-3 uppercase">
          {`os ${dados.outrasCidades.length + 1} municípios que o acervo documenta com 8 ou mais registros`}
        </p>
        <div className="cidade-outras">
          {dados.outrasCidades.map((outra) => (
            <Link
              key={outra.slug}
              href={`/cidade/${outra.slug}/`}
              className="cidade-outra"
              data-outra-cidade={outra.slug}
            >
              {`${outra.titulo} · ${outra.total}`}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
