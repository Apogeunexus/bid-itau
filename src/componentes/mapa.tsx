"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chip, TrilhoDeChips } from "@/componentes/base/chip";
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

/** `[chave, id, título, classe, x, y, método, via, cor, célula, dentroDoBrasil, eventos]` */
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
  /** Quantos eventos do acervo se ligam a esta entidade — contado no build. Ver `geo.ts`. */
  number,
];

/** A posição do campo na tupla, nomeada — `p[11]` num `sort` não diz nada a ninguém. */
const EVENTOS = 11;
const TITULO = 2;

export interface VoltaPadrao {
  href: string;
  rotulo: string;
}

export interface DadosDoMapa {
  viewBox: string;
  contorno: string;
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

/** O retângulo do desenho que está na tela, em unidades do `viewBox` do build. */
interface Vista {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/** Quanto dá para aproximar. Além de 24× o desenho vira mancha: ele é esquemático. */
const ZOOM_MAXIMO = 24;

/**
 * A partir daqui os contornos dos estados aparecem.
 *
 * Abaixo desse ponto vê-se o Brasil e as divisas seriam risco no meio do desenho;
 * a partir dele a pessoa está olhando UMA região, e a divisa é o que diz onde ela
 * está. É o mesmo princípio de um mapa de rua que só mostra o nome do bairro
 * depois de certo nível — detalhe que aparece cedo demais é ruído.
 */
const ZOOM_DAS_DIVISAS = 2.2;

function lerViewBox(vb: string): Vista {
  const [x, y, largura, altura] = vb.split(/\s+/).map(Number);
  return { x: x ?? 0, y: y ?? 0, largura: largura ?? 100, altura: altura ?? 100 };
}

/** Onde o cursor está dentro do desenho, em fração (0..1) — o ponto que o zoom ancora. */
function focoDoEvento(e: { clientX: number; clientY: number; currentTarget: SVGSVGElement }) {
  const r = e.currentTarget.getBoundingClientRect();
  return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
}

/**
 * As classes do acervo agrupadas como a pessoa pensa nelas.
 *
 * «pessoa» e «coletivo» são duas classes no modelo e uma só ideia para quem
 * procura — gente. O mesmo para espaço, instituição e território, que são três
 * jeitos de dizer lugar. O chip fala a língua de quem lê o mapa; o filtro
 * traduz para as classes na hora de aplicar.
 */
interface Familia {
  id: string;
  rotulo: string;
  classes: readonly string[];
}

const FAMILIAS: readonly Familia[] = [
  { id: "", rotulo: "Tudo", classes: [] },
  { id: "gente", rotulo: "Pessoas", classes: ["pessoa", "coletivo"] },
  { id: "lugares", rotulo: "Lugares", classes: ["espaco", "instituicao", "territorio"] },
  { id: "eventos", rotulo: "Eventos", classes: ["evento"] },
  { id: "obras", rotulo: "Obras", classes: ["obra"] },
];

export function Mapa({ dados }: { dados: DadosDoMapa }) {
  const [lente, definirLente] = useState<Lente | null>(null);
  const [selecionada, definirSelecionada] = useState<string | null>(null);
  const [desertos, definirDesertos] = useState(false);
  const [familia, definirFamilia] = useState<string>("");
  const [busca, definirBusca] = useState("");
  /**
   * A VISTA — o retângulo do desenho que está na tela.
   *
   * Zoom aqui é `viewBox`, e não `transform` com escala: `viewBox` é o
   * enquadramento do próprio SVG, então o traço não engorda ao aproximar (todo
   * traço da tela usa `vector-effect: non-scaling-stroke`) e o pino continua do
   * mesmo tamanho em qualquer nível. Com `transform: scale()` o mapa inteiro
   * inflaria junto — pinos gigantes, contorno grosso — que é o defeito clássico
   * de zoom em SVG.
   *
   * `null` é «vista inteira»: o retângulo base que veio do build. Guardar null em
   * vez de copiar o valor faz o botão de reenquadrar não precisar lembrar de nada.
   */
  const [vista, definirVista] = useState<Vista | null>(null);
  const arrastando = useRef<{ x: number; y: number; vista: Vista } | null>(null);

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
   * O RECORTE DE TELA — família e texto — aplicado sobre o que já está posicionado.
   *
   * Ele NÃO toca `recorte`, e essa separação importa: `recorte` é o conjunto que a lente
   * trouxe, e é dele que a legenda tira «quantos ficaram sem posição». Filtrar aquilo aqui
   * faria o número de ausências mudar conforme o usuário digita — a declaração de
   * procedência é sobre o conjunto, não sobre a vista.
   *
   * Normaliza acento nos dois lados: quem procura «belem» tem de achar «Belém».
   */
  const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const visiveis = useMemo(() => {
    const classes = FAMILIAS.find((f) => f.id === familia)?.classes ?? [];
    const termo = semAcento(busca.trim());
    return recorte.posicionados
      .filter((p) => {
        if (classes.length && !classes.includes(p[3])) return false;
        if (termo && !semAcento(p[TITULO]).includes(termo)) return false;
        return true;
      })
      /**
       * QUEM TEM MAIS EVENTOS PRIMEIRO, e o alfabeto só desempata.
       *
       * A ordem alfabética abria a lista em «86» e «A. C. D'Ávila» — os primeiros
       * do alfabeto, que não são os mais relevantes de nada. Quem tem mais eventos
       * no acervo é quem ele mais documenta, e é por onde faz sentido começar.
       *
       * `localeCompare` com `pt` no desempate porque o alfabeto daqui tem acento:
       * comparação binária põe «Álvaro» depois de «Zé», e a lista fica com um
       * bloco de acentuados no fim que ninguém entende.
       */
      .sort(
        (a, b) =>
          b[EVENTOS] - a[EVENTOS] || a[TITULO].localeCompare(b[TITULO], "pt"),
      );
  }, [recorte.posicionados, familia, busca]);

  /** Quantos de cada família existem no recorte — o número que vai no chip. */
  const porFamilia = useMemo(() => {
    const conta = new Map<string, number>();
    for (const f of FAMILIAS) {
      conta.set(
        f.id,
        f.classes.length
          ? recorte.posicionados.filter((p) => f.classes.includes(p[3])).length
          : recorte.posicionados.length,
      );
    }
    return conta;
  }, [recorte.posicionados]);

  /**
   * O agrupamento é uma CONSULTA pela célula que o servidor já calculou, e não um segundo
   * cálculo de geometria. É isso que garante que dois pinos fundidos aqui seriam fundidos
   * em qualquer outro recorte que os contivesse.
   */
  const grupos = useMemo<Grupo[]>(() => {
    const mapa = new Map<string, PinoIndexado[]>();
    for (const p of visiveis) {
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
  }, [visiveis]);

  // ---- zoom e arrasto -------------------------------------------------------
  const base = useMemo(() => lerViewBox(dados.viewBox), [dados.viewBox]);
  const atual = vista ?? base;
  const zoom = base.largura / atual.largura;

  /** O miolo dos pontos que estão na tela — a âncora do zoom sem cursor. */
  const centroDoConteudo = useMemo(() => {
    if (grupos.length === 0) return { x: base.x + base.largura / 2, y: base.y + base.altura / 2 };
    return {
      x: grupos.reduce((s, g) => s + g.x, 0) / grupos.length,
      y: grupos.reduce((s, g) => s + g.y, 0) / grupos.length,
    };
  }, [grupos, base]);

  /** Mantém a vista dentro do desenho: não dá para arrastar o Brasil para fora da moldura. */
  const conter = useCallback(
    (v: Vista): Vista => ({
      largura: v.largura,
      altura: v.altura,
      x: Math.min(Math.max(v.x, base.x), base.x + base.largura - v.largura),
      y: Math.min(Math.max(v.y, base.y), base.y + base.altura - v.altura),
    }),
    [base],
  );

  /**
   * Aproxima mantendo o ponto sob o cursor parado.
   *
   * É o que separa um zoom que obedece de um que foge: aproximar sempre no centro
   * faz o lugar que a pessoa está olhando escapar da tela, e ela passa a corrigir
   * com arrasto a cada passo. `foco` vem em fração (0..1) do retângulo atual.
   */
  const aproximar = useCallback(
    (fator: number, foco?: { fx: number; fy: number }) => {
      definirVista((anterior) => {
        const v = anterior ?? base;
        const zoomAtual = base.largura / v.largura;
        const alvo = Math.min(Math.max(zoomAtual * fator, 1), ZOOM_MAXIMO);
        if (alvo === zoomAtual) return anterior;
        const largura = base.largura / alvo;
        const altura = base.altura / alvo;
        // SEM FOCO — o caso do botão — a âncora é o CENTRO DO CONTEÚDO, e não o
        // centro do retângulo. O `viewBox` do build é um envelope com folga, e o
        // seu meio geométrico cai no interior vazio do país: aproximar por ele
        // levava a uma tela sem nenhum ponto, e a pessoa concluía que o zoom
        // estava quebrado. Ancorar no miolo dos pinos põe a aproximação onde há
        // o que ver.
        const fx = foco?.fx ?? (centroDoConteudo.x - v.x) / v.largura;
        const fy = foco?.fy ?? (centroDoConteudo.y - v.y) / v.altura;
        // O ponto sob o cursor, em unidades do desenho, tem de cair no mesmo lugar.
        const ancoraX = v.x + v.largura * fx;
        const ancoraY = v.y + v.altura * fy;
        return conter({ largura, altura, x: ancoraX - largura * fx, y: ancoraY - altura * fy });
      });
    },
    // `centroDoConteudo` entra aqui porque o zoom sem cursor o LÊ: sem ele na
    // lista, a função ficaria presa ao miolo do primeiro recorte, e aproximar
    // depois de filtrar levaria ao centro do conjunto antigo.
    [base, conter, centroDoConteudo],
  );

  const grupoSelecionado = grupos.find((g) => g.celula === selecionada) ?? null;
  const voltas = lente?.volta
    ? [{ href: lente.volta, rotulo: `Voltar para ${lente.titulo}` }]
    : dados.voltas;

  return (
    <div className="mapa-tela">
      {/* O CABEÇALHO TEM DUAS VOZES, e a diferença é o estado da tela.
          COM LENTE ele nomeia o recorte de onde a pessoa veio — «Lente sobre X» —
          porque aí o mapa é ferramenta a serviço de um conjunto que já existia.
          SEM LENTE ele é a porta do acervo por território, e fala como tal: quem
          chega aqui pelo menu não veio consertar um recorte, veio explorar. A
          versão anterior dizia «Você chegou sem recorte» nos dois casos — abrir
          uma tela avisando o que ela NÃO é começa pedindo desculpa. */}
      <header className="mapa-cabecalho">
        {lente ? (
          <>
            {/* SEM `uppercase` aqui, e a razão é de contrato: `innerText` devolve o
                texto TRANSFORMADO, então caixa alta faria o cabeçalho dizer «LENTE
                SOBRE» — e `verificar-fase3.mjs:1213` compara com
                `.includes("Lente sobre")`, que diferencia maiúscula de minúscula.
                O portão passaria a reprovar uma tela correta. O «ACERVO» do outro
                estado continua em caixa alta: lá não há string a honrar. */}
            <p className="mapa-sobretitulo mapa-sobretitulo-lente">Lente sobre</p>
            <h1 className="mapa-titulo">{lente.titulo}</h1>
            <p className="mapa-linha">
              {recorte.total} {recorte.total === 1 ? "item" : "itens"} do conjunto que você já
              estava vendo, situados no Brasil.
            </p>
          </>
        ) : (
          <>
            <p className="mapa-sobretitulo">Acervo</p>
            <h1 className="mapa-titulo">Descubra a cultura brasileira por território</h1>
            <p className="mapa-linha">
              Pessoas, lugares, obras e eventos de todo o país — no ponto do mapa onde cada
              um acontece.
            </p>
          </>
        )}
      </header>

      <label className="mapa-busca">
        <span className="sr-only">Buscar no que está no mapa</span>
        <svg aria-hidden viewBox="0 0 20 20" className="mapa-busca-lupa">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M13.5 13.5 L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={busca}
          onChange={(e) => definirBusca(e.target.value)}
          placeholder="Buscar no mapa…"
          className="mapa-busca-campo"
        />
      </label>

      {/* Os controles viraram UM trilho de chips, do mesmo vocabulário do resto do
          app. Antes eram três botões de aparência técnica — «Desertos culturais»,
          «Voltar para Acontece» — que liam como comandos de sistema no meio de uma
          tela de conteúdo. A camada e a volta continuam aqui porque pertencem a
          esta tela; o que mudou é que agora se parecem com filtro, que é o que
          elas são para quem usa. */}
      <TrilhoDeChips rotulo="Recortar o mapa">
        {FAMILIAS.map((f) => (
          <Chip
            key={f.id || "tudo"}
            data-familia={f.id || "tudo"}
            selecionado={familia === f.id}
            onClick={() => definirFamilia(f.id === familia ? "" : f.id)}
            contagem={porFamilia.get(f.id) ?? 0}
          >
            {f.rotulo}
          </Chip>
        ))}
        <Chip
          data-ligar-desertos
          selecionado={desertos}
          onClick={() => definirDesertos((ligada) => !ligada)}
        >
          Desertos culturais
        </Chip>
        {/* `a.mapa-botao` com «Voltar» no texto é contrato de portão
            (`verificar-fase3.mjs:1237`): é por ele que a verificação prova que a
            volta preserva o recorte de origem. O chip carrega a classe junto. */}
        {voltas.map((v) => (
          <Chip key={v.href} href={v.href} className="mapa-botao">
            {v.rotulo}
          </Chip>
        ))}
      </TrilhoDeChips>

      <div className="mapa-quadro" data-zoom={zoom > 1 ? "sim" : "nao"}>
        <svg
          // `data-mapa-viewbox` guarda o retângulo BASE, o que veio do build, e não
          // o que está na tela: é por ele que os portões acham o SVG, e um valor
          // que muda com o gesto do usuário faria a verificação medir outra coisa
          // a cada execução. O enquadramento vivo é o `viewBox` logo abaixo.
          data-mapa-viewbox={dados.viewBox}
          viewBox={`${atual.x} ${atual.y} ${atual.largura} ${atual.altura}`}
          role="img"
          aria-label={`Mapa esquemático do Brasil com ${grupos.length} pontos do recorte`}
          className="mapa-desenho"
          onWheel={(e) => {
            // Sem `preventDefault`: o React registra `onWheel` como ouvinte
            // passivo e chamá-lo só produziria um aviso no console. O
            // `overscroll-behavior: contain` do quadro é o que impede a página
            // de rolar junto.
            aproximar(e.deltaY < 0 ? 1.25 : 1 / 1.25, focoDoEvento(e));
          }}
          onDoubleClick={(e) => aproximar(2, focoDoEvento(e))}
          onPointerDown={(e) => {
            if (zoom <= 1) return;
            arrastando.current = { x: e.clientX, y: e.clientY, vista: atual };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const inicio = arrastando.current;
            if (!inicio) return;
            const r = e.currentTarget.getBoundingClientRect();
            // Converte o deslocamento em pixels para unidades do desenho.
            const dx = ((e.clientX - inicio.x) / r.width) * inicio.vista.largura;
            const dy = ((e.clientY - inicio.y) / r.height) * inicio.vista.altura;
            definirVista(conter({ ...inicio.vista, x: inicio.vista.x - dx, y: inicio.vista.y - dy }));
          }}
          onPointerUp={(e) => {
            arrastando.current = null;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
        >
          <path className="mapa-contorno" d={dados.contorno} />
          {/* AS DIVISAS SÓ APARECEM APROXIMADO. De longe elas seriam risco no meio
              do Brasil; de perto são o que diz em que estado a pessoa está. Os
              polígonos já vêm projetados do build — é o mesmo desenho que a camada
              de desertos usa, aqui sem preenchimento. */}
          {zoom >= ZOOM_DAS_DIVISAS && !desertos ? (
            <g className="mapa-divisas" aria-hidden>
              {dados.desertos.ufs.map((uf) => (
                <path key={uf.sigla} d={uf.d} />
              ))}
            </g>
          ) : null}
          {desertos ? <CamadaDesertos dados={dados.desertos} /> : null}
          <g className="mapa-pinos" data-sob-camada={desertos ? "sim" : "nao"}>
            {/* O PINO É LARANJA, SEMPRE — e a cor de linguagem saiu do mapa.
                Ela é dado (D-08) e continua no selo, na capa e no chip de filtro,
                onde há um item por vez e a cor ENSINA. Aqui são oitenta pontos na
                mesma vista: seis cores simultâneas viravam um arco-íris em que
                nenhuma significava nada, e o olho parava de procurar o que
                importa, que é ONDE as coisas estão. O que cada ponto É está na
                lista logo abaixo, escrito. */}
            {grupos.map((g) => {
              const n = g.membros.length;
              // O RAIO É DIVIDIDO PELO ZOOM. `viewBox` resolve o traço — todo
              // `stroke` aqui usa `vector-effect: non-scaling-stroke` — mas NÃO
              // resolve geometria: `r` está em unidades do desenho, então a 10×
              // um pino de 4 unidades ocupa dez vezes mais tela e o mapa vira
              // um borrão laranja. Dividir mantém o ponto do mesmo tamanho em
              // qualquer aproximação, que é o que um pino deve fazer.
              const raio = (3 + Math.min(7, Math.sqrt(n) * 1.6)) / zoom;
              // O número só entra quando o disco comporta: abaixo disso ele vira
              // borrão e piora a leitura em vez de melhorar.
              // O teto é comparado com o raio EM TELA, não no desenho — por isso
              // multiplica de volta pelo zoom.
              const cabeONumero = n > 1 && raio * zoom >= 6;
              return (
                <g key={g.celula}>
                  <circle
                    data-pino={g.membros[0][1]}
                    data-pinos={n}
                    data-selecionado={g.celula === selecionada ? "sim" : undefined}
                    role="button"
                    tabIndex={0}
                    aria-label={`${n} ${n === 1 ? "registro" : "registros"} — ${g.membros[0][2]}`}
                    className="mapa-pino"
                    cx={g.x}
                    cy={g.y}
                    r={raio}
                    onClick={() => definirSelecionada(g.celula === selecionada ? null : g.celula)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") definirSelecionada(g.celula);
                    }}
                  />
                  {cabeONumero ? (
                    <text
                      aria-hidden
                      className="mapa-cluster-n"
                      // Mesma razão do raio: `font-size` em SVG é unidade de
                      // desenho e escalaria junto com o enquadramento.
                      style={{ fontSize: 7 / zoom }}
                      x={g.x}
                      y={g.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {n}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>

        {/* OS BOTÕES SÃO O CAMINHO SEM MOUSE. Roda e arrasto atendem quem tem
            trackpad; num telefone e no teclado, eles não existem. Sem estes três
            o zoom seria um recurso só para parte das pessoas. */}
        <div className="mapa-zoom" role="group" aria-label="Aproximar o mapa">
          <button
            type="button"
            onClick={() => aproximar(1.6)}
            disabled={zoom >= ZOOM_MAXIMO}
            aria-label="Aproximar"
            className="mapa-zoom-botao"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => aproximar(1 / 1.6)}
            disabled={zoom <= 1}
            aria-label="Afastar"
            className="mapa-zoom-botao"
          >
            −
          </button>
          {zoom > 1 ? (
            <button
              type="button"
              onClick={() => definirVista(null)}
              aria-label="Ver o Brasil inteiro"
              className="mapa-zoom-botao mapa-zoom-reenquadrar"
            >
              ⤢
            </button>
          ) : null}
        </div>

        {zoom > 1 ? (
          <p aria-live="polite" className="mapa-zoom-nivel">
            {zoom.toFixed(1)}×
          </p>
        ) : null}
      </div>

      {/* COM A CAMADA LIGADA O PAINEL É DA CAMADA. A leitura de D-62 precisa caber inteira
          na mesma vista do desenho, sem rolar, porque é uma imagem para ser projetada; as
          listas suplementares da legenda voltam quando a camada sai. O que NÃO sai é a
          declaração de procedência das coordenadas — ela vale nos dois estados da tela. */}
      {/* A FOLHA DE RESULTADOS. Ela sobe sobre o mapa quando um ponto é tocado e
          fica embaixo dele quando não há seleção — o mesmo bloco, dois estados, em
          vez de um cartão que aparecia solto no meio da tela empurrando a legenda
          para longe. O puxador de cima é o que diz «isto se move». */}
      <div className="mapa-folha" data-aberta={grupoSelecionado ? "sim" : "nao"}>
        <div aria-hidden className="mapa-folha-puxador" />

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
                aoFechar={() => definirSelecionada(null)}
              />
            ) : (
              <ListaDoRecorte
                visiveis={visiveis}
                total={recorte.posicionados.length}
                filtrando={Boolean(familia || busca.trim())}
              />
            )}

            <Legenda
              semCoordenada={recorte.semCoordenada}
              foraDoBrasil={recorte.foraDoBrasil}
              voltaRecusada={Boolean(lente?.voltaRecusada)}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** O nome que a classe tem para quem lê, e não o que ela tem no modelo. */
const NOME_DA_CLASSE: Record<string, string> = {
  pessoa: "Pessoa",
  coletivo: "Coletivo",
  espaco: "Espaço",
  instituicao: "Instituição",
  territorio: "Território",
  evento: "Evento",
  obra: "Obra",
};

function nomeDaClasse(classe: string): string {
  return NOME_DA_CLASSE[classe] ?? classe;
}

/**
 * A lista do que está no mapa agora — o estado de repouso da folha.
 *
 * Antes desta tela não haver lista, o único jeito de saber o que o mapa tinha era
 * tocar ponto por ponto. Um mapa com 165 registros e nenhuma lista obriga a caçar.
 *
 * O TETO É DECLARADO, e não silencioso: mostrar 40 de 165 sem dizer seria a
 * mesma mentira que um filtro que não filtra. Quem quer estreitar tem o campo de
 * busca e os chips logo acima.
 */
const TETO_DA_LISTA = 40;

function ListaDoRecorte({
  visiveis,
  total,
  filtrando,
}: {
  visiveis: PinoIndexado[];
  total: number;
  filtrando: boolean;
}) {
  if (visiveis.length === 0) {
    return (
      <section className="mapa-lista">
        <p className="mapa-lista-titulo">Nenhum resultado</p>
        <p className="tipo-legenda text-tinta-2">
          {filtrando
            ? "Nada no mapa corresponde a este recorte. Toque em «Tudo» ou limpe a busca."
            : "Este conjunto não tem nada que o mapa consiga situar no Brasil."}
        </p>
      </section>
    );
  }

  return (
    <section className="mapa-lista">
      <p className="mapa-lista-titulo">
        {visiveis.length} {visiveis.length === 1 ? "resultado" : "resultados"}
        {filtrando && visiveis.length !== total ? (
          <span className="mapa-lista-de"> de {total}</span>
        ) : null}
      </p>
      <ul className="mapa-lista-itens">
        {visiveis.slice(0, TETO_DA_LISTA).map((p) => {
          const rota = rotaDe(p[3], p[0]);
          const conteudo = (
            <>
              <span className="mapa-item-nome">{p[TITULO]}</span>
              {/* O NÚMERO QUE ORDENA FICA VISÍVEL. Sem ele a lista pareceria em
                  ordem arbitrária — nem alfabética nem nada —, e ordem que não se
                  explica lê como bug. Com ele, a primeira linha já ensina a regra. */}
              {p[EVENTOS] > 0 ? (
                <span className="mapa-item-eventos">
                  {p[EVENTOS]} {p[EVENTOS] === 1 ? "evento" : "eventos"}
                </span>
              ) : (
                <span className="mapa-item-classe">{nomeDaClasse(p[3])}</span>
              )}
            </>
          );
          return (
            <li key={p[0]} className="mapa-item">
              {rota ? (
                <Link href={rota} className="mapa-item-alvo">
                  {conteudo}
                  <span aria-hidden className="mapa-item-seta">
                    ›
                  </span>
                </Link>
              ) : (
                <div className="mapa-item-alvo">{conteudo}</div>
              )}
            </li>
          );
        })}
      </ul>
      {visiveis.length > TETO_DA_LISTA ? (
        <p className="tipo-legenda text-tinta-3">
          Mostrando os primeiros {TETO_DA_LISTA} de {visiveis.length} — use a busca acima
          para estreitar.
        </p>
      ) : null}
    </section>
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
  aoFechar,
}: {
  grupo: Grupo;
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
      {/* O MÉTODO DA COORDENADA SAIU DA LINHA DE CADA ITEM. Ele dizia «coordenada
          derivada por centroide-estado, resolvida pelo território a que se liga» —
          uma frase de geoprocessamento repetida oito vezes numa lista que a pessoa
          abriu para saber O QUE tem ali. A informação não se perdeu: a legenda
          logo abaixo declara que NENHUMA coordenada foi lida da fonte e nomeia os
          três métodos, que é onde a afirmação vale, dita uma vez. */}
      <ul className="mapa-lista-itens">
        {grupo.membros.slice(0, 8).map((m) => {
          const rota = rotaDe(m[3], m[0]);
          const conteudo = (
            <>
              <span className="mapa-item-nome">{m[2]}</span>
              <span className="mapa-item-classe">{nomeDaClasse(m[3])}</span>
            </>
          );
          return (
            <li key={m[0]} className="mapa-item">
              {rota ? (
                <Link href={rota} className="mapa-item-alvo">
                  {conteudo}
                  <span aria-hidden className="mapa-item-seta">
                    ›
                  </span>
                </Link>
              ) : (
                <div className="mapa-item-alvo">{conteudo}</div>
              )}
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
 * A legenda (D-61) — reduzida à AUSÊNCIA em 23/08, e a redução é o ponto.
 *
 * Havia quatro parágrafos permanentes debaixo de todo mapa: de onde vem a coordenada, de
 * onde vem o desenho, quantos pinos foram fundidos e «nada ficou sem posição». Eles
 * explicavam COMO o mapa foi feito, e o pé da tela virou uma nota de rodapé metodológica
 * competindo com a lista de resultados. Saíram.
 *
 * O QUE CONTINUA É A AUSÊNCIA. «Fora do desenho: N sem coordenada» não explica o método:
 * ela avisa que a lista na tela é menor que o recorte, e quem lê precisa disso para não
 * tomar o mapa por completo. Este bloco só aparece quando há de fato algo fora — e quando
 * não há, não sobra nem a moldura, porque «nada ficou sem posição» é o silêncio esperado,
 * não uma notícia.
 */
function Legenda({
  semCoordenada,
  foraDoBrasil,
  voltaRecusada,
}: {
  semCoordenada: string[];
  foraDoBrasil: readonly PinoIndexado[];
  voltaRecusada: boolean;
}) {
  const foraDoDesenho = semCoordenada.length > 0 || foraDoBrasil.length > 0;

  return (
    <>
      {foraDoDesenho || voltaRecusada ? (
        <section data-legenda-mapa className="mapa-legenda">
          {foraDoDesenho ? (
            <p>
              <strong className="font-semibold text-tinta">Fora do desenho:</strong>{" "}
              {semCoordenada.length} sem coordenada que o acervo sustente e{" "}
              {foraDoBrasil.length} com coordenada fora do Brasil. Nenhuma delas foi empurrada
              para a borda — um ponto sem dado não vira posição.
            </p>
          ) : null}
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
      ) : null}
    </>
  );
}
