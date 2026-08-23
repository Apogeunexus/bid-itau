"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CamadaDesertos, LeituraDesertos, type DadosDesertos } from "@/componentes/desertos";

/**
 * mapa.tsx — o mapa como LENTE (D-59), desenhado por projeção própria em SVG (D-60).
 *
 * COMPONENTE DE CLIENTE, e por DP-F ele NÃO IMPORTA `@/dados/geo` nem `@/dados/grafo`, nem
 * transitivamente. Tudo o que ele desenha chega por propriedade, já projetado no build por
 * um componente de servidor: o contorno como caminho pronto, os pinos como tuplas com `x`,
 * `y` e célula de agrupamento. O navegador não faz travessia de grafo e não faz projeção —
 * ele agrupa por chave de célula, que é uma consulta, não uma segunda implementação da
 * geometria.
 *
 * A LENTE É UMA GRAMÁTICA DE HASH DE TRÊS CHAVES, contrato desta fase, escrita igual em
 * 03-01, 03-03 e 03-04:
 *   `r` — as chaves `{classe}_{slug}` do recorte, juntadas por `~`
 *   `t` — o título legível do recorte
 *   `v` — o endereço de volta
 * Quem chama carrega o próprio endereço de volta. É isso que faz o mapa não conhecer
 * Acontece nem Buscar: ele não sabe de onde veio, e não precisa saber.
 *
 * SEM HASH, o mapa abre com o acervo situado no Brasil E DIZ NA TELA que chegou sem
 * recorte. Mapa não é porta de entrada (D-59), e a tela precisa dizer isso em vez de fingir
 * que é.
 */

/** `[chave, id, título, classe, x, y, método, via, cor, célula, dentroDoBrasil]` */
export type PinoIndexado = readonly [
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  number,
  string,
  string,
  0 | 1,
];

export interface VoltaPadrao {
  href: string;
  rotulo: string;
}

export interface DadosDoMapa {
  viewBox: string;
  contorno: string;
  rotuloContorno: string;
  pinos: readonly PinoIndexado[];
  /** As chaves do recorte padrão — o acervo situado no Brasil. */
  padrao: readonly string[];
  metodos: readonly string[];
  vias: readonly string[];
  /** Lado da célula de agrupamento, em unidades de `viewBox`, e o mesmo em quilômetros. */
  raio: number;
  raioKm: number;
  voltas: readonly VoltaPadrao[];
  /** A camada de desertos culturais (D-62), já projetada e já contada no build. */
  desertos: DadosDesertos;
}

interface Lente {
  chaves: string[];
  titulo: string;
  volta: string | null;
  /** O `v` chegou e foi RECUSADO por não ser caminho interno (T-03-13). */
  voltaRecusada: boolean;
}

/**
 * T-03-13 — o endereço de volta vem do hash, logo é entrada não confiável.
 *
 * Só caminho INTERNO passa: começa por uma barra e não por duas (`//exemplo.invalido` é
 * endereço absoluto de protocolo relativo e o navegador o trataria como externo), nem por
 * `/\`, que alguns navegadores normalizam para `//`. Qualquer outra forma cai nas voltas
 * padrão da página — sem isso, um hash preparado transformaria o botão de volta em link
 * externo no meio da apresentação.
 */
function voltaSegura(bruta: string | null): string | null {
  if (!bruta) return null;
  let decodificada: string;
  try {
    decodificada = decodeURIComponent(bruta);
  } catch {
    return null;
  }
  if (!decodificada.startsWith("/")) return null;
  if (decodificada.startsWith("//") || decodificada.startsWith("/\\")) return null;
  return decodificada;
}

function lerHash(hash: string): Lente | null {
  const cru = hash.replace(/^#/, "");
  if (!cru) return null;
  const p = new URLSearchParams(cru);
  const r = p.get("r");
  if (!r) return null;
  const bruta = p.get("v");
  const volta = voltaSegura(bruta);
  return {
    chaves: r.split("~").filter(Boolean),
    titulo: p.get("t") ? decodeURIComponent(p.get("t") as string) : "recorte sem título",
    volta,
    voltaRecusada: Boolean(bruta) && volta === null,
  };
}

interface Grupo {
  celula: string;
  x: number;
  y: number;
  membros: PinoIndexado[];
}

export function Mapa({ dados }: { dados: DadosDoMapa }) {
  const [lente, definirLente] = useState<Lente | null>(null);
  const [selecionada, definirSelecionada] = useState<string | null>(null);
  const [desertos, definirDesertos] = useState(false);

  // O hash só é lido no cliente: sob export estático o HTML é o mesmo para todo recorte, e
  // ler `location` durante a renderização de servidor produziria divergência de hidratação.
  useEffect(() => {
    const ler = () => {
      definirLente(lerHash(window.location.hash));
      definirSelecionada(null);
    };
    ler();
    window.addEventListener("hashchange", ler);
    return () => window.removeEventListener("hashchange", ler);
  }, []);

  const indice = useMemo(
    () => new Map(dados.pinos.map((p) => [p[0], p])),
    [dados.pinos],
  );

  const recorte = useMemo(() => {
    const chaves = lente ? lente.chaves : dados.padrao;
    const posicionados: PinoIndexado[] = [];
    const foraDoBrasil: PinoIndexado[] = [];
    const semCoordenada: string[] = [];
    for (const chave of chaves) {
      const pino = indice.get(chave);
      if (!pino) semCoordenada.push(chave);
      else if (pino[10] === 1) posicionados.push(pino);
      else foraDoBrasil.push(pino);
    }
    return { total: chaves.length, posicionados, foraDoBrasil, semCoordenada };
  }, [lente, dados.padrao, indice]);

  /**
   * O agrupamento é uma CONSULTA pela célula que o servidor já calculou, e não um segundo
   * cálculo de geometria. É isso que garante que dois pinos fundidos aqui seriam fundidos
   * em qualquer outro recorte que os contivesse.
   */
  const grupos = useMemo<Grupo[]>(() => {
    const mapa = new Map<string, PinoIndexado[]>();
    for (const p of recorte.posicionados) {
      const lista = mapa.get(p[9]);
      if (lista) lista.push(p);
      else mapa.set(p[9], [p]);
    }
    return [...mapa]
      .map(([celula, membros]) => ({
        celula,
        x: membros.reduce((s, m) => s + m[4], 0) / membros.length,
        y: membros.reduce((s, m) => s + m[5], 0) / membros.length,
        membros,
      }))
      // Os menores por último: um grupo grande nunca cobre um pino solitário.
      .sort((a, b) => b.membros.length - a.membros.length);
  }, [recorte.posicionados]);

  const grupoSelecionado = grupos.find((g) => g.celula === selecionada) ?? null;
  const voltas = lente?.volta
    ? [{ href: lente.volta, rotulo: `Voltar para ${lente.titulo}` }]
    : dados.voltas;

  return (
    <div className="mapa-tela">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-lg leading-tight font-semibold">Mapa</h1>
        {lente ? (
          <p className="text-xs leading-snug text-tinta-2">
            Lente sobre{" "}
            <strong className="font-semibold text-tinta">{lente.titulo}</strong>{" "}
            — {recorte.total} {recorte.total === 1 ? "item" : "itens"} do conjunto que você
            já estava vendo.
          </p>
        ) : (
          <p className="text-xs leading-snug text-tinta-2">
            Você chegou <strong className="font-semibold">sem recorte</strong>: o mapa é
            lente sobre um resultado, não porta de entrada. Sem conjunto, ele mostra
            todo o acervo que consegue situar no Brasil.
          </p>
        )}
      </header>

      <div className="mapa-controles">
        {/* A camada liga e desliga SEM NAVEGAR: o recorte que a pessoa estava vendo
            continua na tela, e é a sobreposição que faz a leitura. Sair para outra rota
            perderia o conjunto, que é justamente o que D-59 protege. */}
        <button
          type="button"
          data-ligar-desertos
          aria-pressed={desertos}
          onClick={() => definirDesertos((ligada) => !ligada)}
          className="mapa-botao mapa-botao-camada"
        >
          {desertos ? "✓ " : ""}Desertos culturais
        </button>
        {voltas.map((v) => (
          <Link key={v.href} href={v.href} className="mapa-botao">
            {v.rotulo}
          </Link>
        ))}
      </div>

      <div className="mapa-quadro">
        <svg
          data-mapa-viewbox={dados.viewBox}
          viewBox={dados.viewBox}
          role="img"
          aria-label={`Mapa esquemático do Brasil com ${grupos.length} pontos do recorte`}
          className="mapa-desenho"
        >
          <path className="mapa-contorno" d={dados.contorno} />
          {desertos ? <CamadaDesertos dados={dados.desertos} /> : null}
          <g className="mapa-pinos" data-sob-camada={desertos ? "sim" : "nao"}>
            {grupos.map((g) => {
              const n = g.membros.length;
              const cor = g.membros.map((m) => m[8]).find(Boolean);
              return (
                <circle
                  key={g.celula}
                  data-pino={g.membros[0][1]}
                  data-pinos={n}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n} ${n === 1 ? "registro" : "registros"} — ${g.membros[0][2]}`}
                  className="mapa-pino"
                  style={cor ? ({ "--cor-pino": `var(${cor})` } as React.CSSProperties) : undefined}
                  cx={g.x}
                  cy={g.y}
                  r={3 + Math.min(7, Math.sqrt(n) * 1.6)}
                  onClick={() => definirSelecionada(g.celula === selecionada ? null : g.celula)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") definirSelecionada(g.celula);
                  }}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* COM A CAMADA LIGADA O PAINEL É DA CAMADA. A leitura de D-62 precisa caber inteira
          na mesma vista do desenho, sem rolar, porque é uma imagem para ser projetada; as
          listas suplementares da legenda voltam quando a camada sai. O que NÃO sai é a
          declaração de procedência das coordenadas — ela vale nos dois estados da tela. */}
      <div className="mapa-painel">
        {desertos ? (
          <>
            <LeituraDesertos dados={dados.desertos} />
            <p data-legenda-mapa className="mapa-legenda">
              Coordenadas derivadas de centroide e de deslocamento por espaço, nunca lidas
              da fonte. Os {dados.desertos.ufs.length} polígonos são esquemáticos e
              autorados — a contagem vem do acervo, não do desenho.
            </p>
          </>
        ) : (
          <>
            {grupoSelecionado ? (
              <CartaoItem
                grupo={grupoSelecionado}
                dados={dados}
                aoFechar={() => definirSelecionada(null)}
              />
            ) : null}

            <Legenda
              dados={dados}
              semCoordenada={recorte.semCoordenada}
              foraDoBrasil={recorte.foraDoBrasil}
              posicionados={recorte.posicionados.length}
              grupos={grupos.length}
              voltaRecusada={Boolean(lente?.voltaRecusada)}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** A rota de cada classe. Classe sem rota não vira link falso — vira ausência declarada. */
function rotaDe(classe: string, chave: string): string | null {
  const slug = chave.slice(classe.length + 1);
  if (classe === "pessoa" || classe === "coletivo") return `/artista/${slug}`;
  if (classe === "instituicao" || classe === "espaco") return `/produtor/${slug}`;
  if (classe === "obra") return `/obra/${slug}`;
  if (classe === "evento") return `/evento/${slug}`;
  return null;
}

/**
 * O cartão do item selecionado. Mostra o MÉTODO da coordenada daquele item e o caminho
 * pelo qual ela foi resolvida — «centroide de município» e «deslocamento por espaço» são
 * afirmações diferentes sobre onde a coisa está, e apagar a diferença apagaria o único
 * dado de qualidade que o protótipo tem sobre posição.
 */
function CartaoItem({
  grupo,
  dados,
  aoFechar,
}: {
  grupo: Grupo;
  dados: DadosDoMapa;
  aoFechar: () => void;
}) {
  const n = grupo.membros.length;
  return (
    <section data-cartao-item className="mapa-cartao">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {n === 1 ? "1 registro neste ponto" : `${n} registros no mesmo ponto`}
        </h2>
        <button type="button" onClick={aoFechar} className="mapa-fechar">
          fechar
        </button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {grupo.membros.slice(0, 8).map((m) => {
          const rota = rotaDe(m[3], m[0]);
          const metodo = dados.metodos[m[6]] ?? "método não declarado";
          const via = dados.vias[m[7]] ?? "";
          return (
            <li key={m[0]} className="flex flex-col">
              <span className="text-sm leading-tight font-semibold">
                {rota ? (
                  <Link href={rota} className="underline decoration-borda-forte underline-offset-2">
                    {m[2]}
                  </Link>
                ) : (
                  m[2]
                )}
              </span>
              <span className="text-xs text-tinta-2">
                {m[3]} · coordenada derivada por {metodo}
                {via === "espaco" ? ", resolvida pelo espaço a que se liga" : null}
                {via === "territorio" ? ", resolvida pelo território a que se liga" : null}
                {via === "propria" ? ", própria da entidade" : null}
              </span>
            </li>
          );
        })}
      </ul>
      {n > 8 ? (
        <p className="text-xs text-tinta-2">e mais {n - 8} no mesmo ponto.</p>
      ) : null}
    </section>
  );
}

/**
 * A legenda (D-61). Quatro declarações, e as quatro são o argumento da proposta:
 * de onde vem a coordenada, de onde vem o desenho, o que foi agrupado, e o que o mapa NÃO
 * conseguiu posicionar. É texto de PRODUTO — fica fora do modo comentado, porque é
 * exatamente isto que a banca precisa ler.
 */
function Legenda({
  dados,
  semCoordenada,
  foraDoBrasil,
  posicionados,
  grupos,
  voltaRecusada,
}: {
  dados: DadosDoMapa;
  semCoordenada: string[];
  foraDoBrasil: readonly PinoIndexado[];
  posicionados: number;
  grupos: number;
  voltaRecusada: boolean;
}) {
  return (
    <section data-legenda-mapa className="mapa-legenda">
      <p>
        <strong className="font-semibold text-tinta">
          Nenhuma coordenada deste mapa foi lida da fonte.
        </strong>{" "}
        Elas são derivadas: centroide de município, centroide de estado, ou deslocamento a
        partir do espaço onde a coisa acontece. O cartão de cada ponto diz qual dos três.
      </p>
      <p>{dados.rotuloContorno}</p>
      <p>
        {posicionados} {posicionados === 1 ? "registro posicionado" : "registros posicionados"}{" "}
        em {grupos} {grupos === 1 ? "ponto" : "pontos"}: pinos na mesma célula de{" "}
        {(dados.raio / 10).toFixed(0)} grau (cerca de {dados.raioKm} km) foram fundidos, com a
        contagem no tamanho do disco.
      </p>
      <p>
        {semCoordenada.length === 0 && foraDoBrasil.length === 0 ? (
          <>Todo o recorte coube no desenho: nada ficou sem posição.</>
        ) : (
          <>
            <strong className="font-semibold text-tinta">
              Fora do desenho:
            </strong>{" "}
            {semCoordenada.length} sem coordenada que o acervo sustente e{" "}
            {foraDoBrasil.length} com coordenada fora do Brasil. Nenhuma delas foi
            empurrada para a borda — um ponto sem dado não vira posição.
          </>
        )}
      </p>
      {semCoordenada.length ? (
        <p className="text-tinta-3">
          Sem posição: {semCoordenada.slice(0, 12).join(", ")}
          {semCoordenada.length > 12 ? ` e mais ${semCoordenada.length - 12}` : ""}.
        </p>
      ) : null}
      {foraDoBrasil.length ? (
        <p className="text-tinta-3">
          Fora do Brasil: {foraDoBrasil.slice(0, 8).map((p) => p[2]).join(", ")}
          {foraDoBrasil.length > 8 ? ` e mais ${foraDoBrasil.length - 8}` : ""}.
        </p>
      ) : null}
      {voltaRecusada ? (
        <p className="text-tinta-3">
          O endereço de volta que veio na URL não é um caminho interno e foi recusado; as
          voltas acima são as da própria tela.
        </p>
      ) : null}
    </section>
  );
}
