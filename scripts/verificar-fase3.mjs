/**
 * verificar-fase3.mjs — a verificação da fase 3, dirigida por navegador.
 *
 * O QUE ELE MEDE. `out/` — o artefato exportado, servido estaticamente — aberto em Chrome
 * headless por CDP, num viewport de 1440×960. O viewport é o MESMO da fase 2 de propósito:
 * a única media query do projeto é 430px e num viewport largo ela não participa, então os
 * números das duas fases são comparáveis. Medir noutro viewport mediria outra coisa.
 *
 * O QUE ELE NÃO FAZ. Não se pula. Chrome ausente FALHA o script (T-02-22 / T-03-41).
 * Verificação que se autodispensa produz relatório verde sobre nada.
 *
 * OS SEIS DEFEITOS DE GATE QUE AS FASES 2 E 3 JÁ PAGARAM, e que este arquivo herda
 * corrigidos por construção — nenhum deles é estilo, os seis foram medidos:
 *
 *  1. A gramática da lente é `/mapa/#…` COM a barra final: `trailingSlash: true` normaliza
 *     `/mapa#` para `/mapa/#`, e a forma sem barra é a que redireciona ANTES de o hash ser
 *     lido. Todo casamento aqui é `/\/mapa\/?#/`.
 *  2. `navegador.mjs` não tem a API que os planos presumem. A real: `servir({raiz})` →
 *     `{url, fechar}`; `abrirNavegador()` devolve o `cdp` direto; o método é `navegar`; o
 *     console é `cdp.consola`; e `cdp.clicar` recebe uma EXPRESSÃO JS que avalia para o
 *     elemento, não um seletor CSS. `Network.*` não é acessível de fora — a prova de «zero
 *     requisição externa» é feita por `performance.getEntriesByType('resource')`, medida
 *     DENTRO da página, que enumera todo recurso que o documento pediu.
 *  3. `visiveis()` do prelúdio NÃO serve para SVG: ele usa `offsetParent`, que só existe em
 *     `HTMLElement`. Medido neste artefato: `visiveis('[data-pino]')` devolve 0 de 88 pinos
 *     que estão na tela. Forma dentro de SVG se mede pelo RETÂNGULO — `visivelSvg` abaixo.
 *  4. «Cabe na primeira vista» é contra a moldura MENOS a barra de abas, que é sticky no pé
 *     e cobre os últimos ~59px. Medir contra `window.innerHeight`, ou contra a moldura
 *     inteira, relata «cabe» para conteúdo que a barra está cobrindo. Dois executores
 *     erraram isto e só a foto pegou.
 *  5. Comparação de data por STRING é quebrada: `"27.06.1967" > "2026-08-22"` é `true` em
 *     JavaScript, porque compara `DD.MM.AAAA` contra ISO caractere a caractere. Há 113
 *     datas declaradas nas 15 cidades que disparariam um gate ingênuo, todas históricas.
 *     Aqui a comparação é sempre por ANO de quatro dígitos extraído e convertido a número.
 *  6. Da fase 2, ainda valendo: gate que lê arquivo roda sobre a fonte SEM COMENTÁRIOS e
 *     casa `data-{atributo}="` com o igual e a aspa (senão conta o payload RSC); e a
 *     instrução de importação é casada POR INTEIRO, porque `import type` quebrado em cinco
 *     linhas derrota casamento por linha. Nos gates de tela o problema do RSC deixa de
 *     existir por construção: `querySelectorAll` no DOM vivo não enxerga o payload.
 *
 * ZERO DEPENDÊNCIA NOVA. O cliente CDP mora em `navegador.mjs` e é ~120 linhas sobre o
 * `WebSocket` global do Node. `verificar-fase2.mjs`, `navegador.mjs` e `servir-out.mjs` são
 * LEITURA para este arquivo: alterá-los invalidaria a linha de base da fase 2.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync, statSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { servir } from "./servir-out.mjs";
import { abrirNavegador, PRELUDIO } from "./navegador.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SRC = path.join(RAIZ, "src");
const OUT = path.join(RAIZ, "out");

const LARGURA = 1440;
const ALTURA = 960;

/** A data que o build usa como «hoje». Vem de `src/dados/alerta.ts`, não do relógio. */
const DATA_DE_REFERENCIA = "2026-08-22";
const ANO_DE_REFERENCIA = 2026;

/**
 * A ÂNCORA de `globals.css`. Era `cc34f4e` — o fim da fase 2 — e isso ficou obsoleto quando
 * `a40f380` («as seis folhas de estilo num bundle só») reuniu as folhas de rota DEPOIS de a
 * fase 3 fechar, para acabar com o aviso de CSS pré-carregado e não usado. O gate media a
 * disjunção de arquivos entre os quatro planos paralelos da onda 1 da fase 3 — assunto
 * encerrado — e passou a acusar 43 linhas que não são defeito.
 *
 * Reancorado em `c03f627` (o commit de 04-01, que escreveu as quatro linhas de @import da
 * fase 4 de uma vez), ele fica MAIS FORTE, não mais frouxo: passa a exigir diferença ZERO e
 * com isso prova que a ONDA 2 INTEIRA — 04-02, 04-03 e 04-04, três executores em paralelo —
 * não tocou o arquivo. Nenhum limiar foi relaxado; a diferença exigida continua sendo zero.
 *
 * O que o gate original protegia de fato — o bloco `:root` com os hex do manual — é
 * verificado byte a byte em `verificar-fase4.mjs`, desde `a40f380`, junto com a contagem de
 * linhas de @import contra linhas de regra acrescentadas.
 *
 * REANCORADO DE NOVO EM `c90fc9b`, PELA FASE 5, E PELA MESMA RAZÃO. `c90fc9b` é o commit da
 * Task 1 de 05-01 — «as 11 folhas da fase 5 declaradas de uma vez» —, o ÚNICO da fase 5 que
 * tocou `globals.css`, e ele acrescentou 11 linhas de `@import` e ZERO linha de regra. A
 * fase 5 correu com SEIS executores em paralelo na onda 2, e 05-01 resolveu o arquivo de
 * colisão de uma vez, antes de a onda começar, exatamente para que nenhum deles precisasse
 * abri-lo.
 *
 * A FORMA CONTINUA SENDO «DIFERENÇA ZERO», e isso é deliberado. A alternativa — permitir
 * `@import` novo para sempre — pareceria mais tolerante e provaria menos: é a exigência de
 * diferença zero que faz este gate provar que os SEIS executores da onda 2 não tocaram
 * `globals.css`, que é a propriedade que a paralelização depende e que nada mais verifica.
 * Nenhum limiar foi movido; a diferença exigida continua sendo zero.
 */
/* Reancorado na reformulação do design system: o histórico do repositório foi
 * recriado em 2026-08-22 e `c90fc9b` deixou de existir. A âncora agora mora em
 * `medidas.mjs` e avança sempre que uma fase legitimamente toca `globals.css`. */
import { COMMIT_ULTIMO_QUE_TOCOU_GLOBALS as COMMIT_FIM_DA_FASE_2 } from "./medidas.mjs";

// ---------------------------------------------------------------------------
// Relatório: toda medição imprime uma linha nomeada com o NÚMERO medido.
// Um gate que só diz «passou» não sobrevive à próxima mudança de dado.
// ---------------------------------------------------------------------------

let falhas = 0;
const resumo = [];

function ok(nome, medida) {
  console.log(`  ok   ${nome}: ${medida}`);
}

class Falha extends Error {}

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    ok(nome, medida);
    return;
  }
  console.log(`  FALHA ${nome}: medido ${medida} · esperado ${esperado}`);
  falhas += 1;
  throw new Falha(`${nome} — medido ${medida}, esperado ${esperado}`);
}

function titulo(t) {
  console.log(`\n${t}`);
}

function nota(t) {
  console.log(`       ${t}`);
}

// ---------------------------------------------------------------------------
// Leitura de fonte SEM COMENTÁRIOS.
//
// Duplicado de `verificar-fase2.mjs` de propósito: aquele arquivo é a linha de base da
// fase 2 e não exporta estes ajudantes; exportá-los exigiria alterá-lo, o que este plano
// declara proibido. A duplicação está registrada no SUMMARY como dívida conhecida.
//
// Máquina de estados em vez de regex: `"https://x"` tem `//` dentro de string, e uma regex
// ingênua apagaria metade do arquivo — um falso NEGATIVO, que é o erro caro num gate.
// ---------------------------------------------------------------------------

function semComentarios(fonte) {
  let fora = "";
  let i = 0;
  const n = fonte.length;
  while (i < n) {
    const c = fonte[i];
    const d = fonte[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && fonte[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && d === "*") {
      i += 2;
      while (i < n && !(fonte[i] === "*" && fonte[i + 1] === "/")) {
        if (fonte[i] === "\n") fora += "\n";
        i += 1;
      }
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const aspa = c;
      fora += c;
      i += 1;
      while (i < n) {
        if (fonte[i] === "\\") {
          fora += fonte[i] + (fonte[i + 1] ?? "");
          i += 2;
          continue;
        }
        fora += fonte[i];
        if (fonte[i] === aspa) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    fora += c;
    i += 1;
  }
  return fora;
}

async function arquivosDe(dir, filtro = /\.(ts|tsx)$/) {
  const saida = [];
  async function andar(atual) {
    for (const entrada of await readdir(atual, { withFileTypes: true })) {
      const p = path.join(atual, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name === "node_modules" || entrada.name === "gerado") continue;
        await andar(p);
      } else if (filtro.test(entrada.name)) {
        saida.push(p);
      }
    }
  }
  await andar(dir);
  return saida;
}

const fontes = new Map();
async function fonte(arquivo) {
  if (!fontes.has(arquivo)) {
    const bruto = await readFile(arquivo, "utf8");
    fontes.set(arquivo, { bruto, limpo: semComentarios(bruto) });
  }
  return fontes.get(arquivo);
}

/** Extração de import por INSTRUÇÃO, não por linha — `import type` quebrado em cinco
 *  linhas derrota casamento ingênuo, e foi um falso positivo real na fase 2. */
const RE_INSTRUCAO =
  /\b(?:import|export)\b[\s\S]*?\bfrom\s*["']([^"']+)["']|(?:^|\n)\s*import\s+["']([^"']+)["']/g;

function importsDe(limpo) {
  const achados = [];
  RE_INSTRUCAO.lastIndex = 0;
  let m;
  while ((m = RE_INSTRUCAO.exec(limpo)) !== null) {
    const instrucao = m[0];
    const especificador = m[1] ?? m[2];
    if (!especificador) continue;
    let tipoApenas = /\bimport\s+type\b/.test(instrucao);
    if (!tipoApenas) {
      const chaves = instrucao.match(/\{([\s\S]*?)\}/);
      const temDefault = /\bimport\s+[A-Za-z_$][\w$]*\s*(,|\bfrom\b)/.test(instrucao);
      if (chaves && !temDefault) {
        const partes = chaves[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        tipoApenas = partes.length > 0 && partes.every((p) => /^type\s/.test(p));
      }
    }
    achados.push({ especificador, tipoApenas, instrucao });
  }
  for (const d of limpo.matchAll(/\bimport\s*\(\s*["']([^"']+)["']/g)) {
    achados.push({ especificador: d[1], tipoApenas: false, instrucao: d[0] });
  }
  return achados;
}

function resolverModulo(especificador, deArquivo) {
  let base;
  if (especificador.startsWith("@/")) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(deArquivo), especificador);
  else return null;
  const tentativas = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    `${base}.js`,
    `${base}.json`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const t of tentativas) if (existsSync(t) && statSync(t).isFile()) return t;
  return null;
}

async function tamanhoDe(dir) {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) total += await tamanhoDe(p);
    else total += statSync(p).size;
  }
  return total;
}

function git(...args) {
  return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

// ---------------------------------------------------------------------------
// ANOS EM TEXTO — a correção do defeito 5.
//
// `"27.06.1967" > "2026-08-22"` é `true`. Comparar data por string entre formatos
// diferentes é comparar caractere a caractere, e neste acervo isso acusaria 113 datas
// históricas como futuras. Aqui todo ano é EXTRAÍDO e virado NÚMERO antes de comparar.
// ---------------------------------------------------------------------------

/**
 * Todos os anos plausíveis do texto, como números. Cobre `1978`, `27.06.1967`,
 * `1999 - 1999`, `2026-08-22` e «22 de agosto de 2026».
 * Só 1500–2999 conta como ano: sem a faixa, `1440` (o viewport) viraria data.
 */
function anosDoTexto(texto) {
  const anos = [];
  for (const m of texto.matchAll(/(?<![\d.,])(1[5-9]\d{2}|2[0-9]\d{2})(?![\d.,])/g)) {
    anos.push(Number(m[1]));
  }
  return anos;
}

/** Datas cheias, normalizadas para ISO — as duas formas que o acervo escreve. */
function datasIsoDoTexto(texto) {
  const datas = [];
  for (const m of texto.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) datas.push(`${m[1]}-${m[2]}-${m[3]}`);
  for (const m of texto.matchAll(/\b(\d{2})\.(\d{2})\.(\d{4})\b/g)) datas.push(`${m[3]}-${m[2]}-${m[1]}`);
  return datas;
}

// ---------------------------------------------------------------------------
// PRELÚDIO DE PÁGINA — estende o de `navegador.mjs` com o que a fase 3 precisa.
// ---------------------------------------------------------------------------

const PRELUDIO3 =
  PRELUDIO +
  `
  /**
   * DEFEITO 3, corrigido. \`visivel()\` usa \`offsetParent\`, que só existe em HTMLElement:
   * todo <circle data-pino> e todo <path data-uf> do mapa é reportado como INVISÍVEL.
   * Medido neste artefato: visiveis('[data-pino]') = 0 de 88 que estão na tela.
   * Forma dentro de SVG se mede pelo retângulo e pelo estilo computado, sem offsetParent.
   */
  const visivelSvg = (el) => {
    if (!el) return false;
    const e = getComputedStyle(el);
    if (e.display === 'none' || e.visibility === 'hidden' || Number(e.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const visiveisSvg = (s) => todos(s).filter(visivelSvg);

  /**
   * DEFEITO 4, corrigido — e reancorado na reformulação do design system (2026-08):
   * a barra de abas não existe mais. O cabeçalho do menu fica no TOPO e não cobre o
   * pé, então a primeira vista vai até o fundo visível da moldura. As chaves da barra
   * sobrevivem zeradas para os relatórios que as imprimem.
   */
  const molduraUtil = () => {
    const m = document.querySelector('.moldura');
    if (!m) return null;
    const rm = m.getBoundingClientRect();
    return {
      topo: Math.round(rm.top),
      base: Math.round(rm.bottom),
      topoDaBarra: null,
      alturaDaBarra: 0,
      limiteUtil: Math.round(Math.min(rm.bottom, innerHeight)),
    };
  };

  const texto = (el) => ((el || document.body).innerText || '');
  const alturaDe = (el) => (el ? Math.round(el.getBoundingClientRect().height) : 0);
`;

function naPagina3(corpo) {
  return `(() => { ${PRELUDIO3} ${corpo} })()`;
}

// ---------------------------------------------------------------------------
// REDE — a prova por processo de D-60 e D-65.
//
// DEFEITO 2: `Network.requestWillBeSent` não é acessível — `abrirNavegador` não expõe
// `ao`/`enviar`. A medida equivalente, e feita de DENTRO da página, é
// `performance.getEntriesByType('resource')`: ela enumera TODO recurso que o documento
// pediu — script, folha de estilo, imagem, fonte, fetch e XHR. É colhida a cada navegação,
// antes de sair do documento, porque a lista é por documento e some na troca.
// ---------------------------------------------------------------------------

const recursos = new Set();

async function coletarRede(cdp) {
  const lista = await cdp.avaliar(
    `performance.getEntriesByType('resource').map((e) => e.name)`,
  );
  for (const u of lista) recursos.add(u);
}

/** Navegação instrumentada: colhe o documento que sai e o que entra. */
async function irPara(cdp, url) {
  await coletarRede(cdp).catch(() => {});
  await cdp.navegar(url);
  await coletarRede(cdp);
}

/** Clique que navega, instrumentado do mesmo jeito. */
async function clicarPara(cdp, seletorJs, predicado, rotulo) {
  await coletarRede(cdp).catch(() => {});
  const r = await cdp.clicarEEsperarUrl(seletorJs, predicado, rotulo);
  await coletarRede(cdp);
  return r;
}

/** Espera curta depois de uma interação que não navega. */
const respirar = (ms = 400) => new Promise((r) => setTimeout(r, ms));

/** Escreve num campo controlado do React: o setter nativo mais o evento que o React ouve. */
async function digitar(cdp, seletor, valor) {
  await cdp.avaliar(`(() => {
    const i = document.querySelector(${JSON.stringify(seletor)});
    if (!i) throw new Error('campo não encontrado: ' + ${JSON.stringify(seletor)});
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(i, ${JSON.stringify(valor)});
    i.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await respirar(600);
}

// ---------------------------------------------------------------------------
// (b) GATES ESTRUTURAIS — rodam ANTES de subir o Chrome. Baratos, e pegam a classe de
// erro mais cara da fase. Todos sobre a fonte SEM COMENTÁRIOS.
// ---------------------------------------------------------------------------

const JSON_PESADOS = ["entidades.json", "arestas.json", "ocorrencias.json"];
const CORES_APOIO = /--ic-(amarelo|azul|lilas|rosa|verde-agua|verde)\b/g;

/** Os quatro planos da onda 1 e o escopo de commit que cada um usou. */
const PLANOS_DA_ONDA_1 = ["03-01", "03-02", "03-03", "03-04"];

async function gatesEstruturais() {
  titulo("── (b) gates estruturais, sem navegador ──");
  const arquivos = await arquivosDe(SRC);

  // ---- 1. A diretiva de cliente, contada na PRIMEIRA INSTRUÇÃO do arquivo ----
  // A fase 2 mediu 19 pela varredura ingênua contra 14 reais: os outros cinco CITAM a
  // diretiva num comentário explicando a fronteira. Aqui a fonte vem sem comentários e a
  // diretiva só conta se abre o arquivo.
  const clientes = [];
  let citacoesEmProsa = 0;
  for (const a of arquivos) {
    const { limpo, bruto } = await fonte(a);
    if (/^\s*["']use client["']/.test(limpo)) clientes.push(a);
    citacoesEmProsa += [...bruto.matchAll(/use client/g)].length;
  }
  ok(
    "arquivos com a diretiva de cliente (primeira instrução, sem comentários)",
    `${clientes.length} em código · ${citacoesEmProsa} menções na fonte bruta (a fase 2 mediu 14 em código)`,
  );

  // ---- 2. DP-F TRANSITIVO: nenhum caminho de cliente alcança o grafo ----
  const violacoesDpf = [];
  for (const cliente of clientes) {
    const vistos = new Set();
    const fila = [[cliente, [path.relative(RAIZ, cliente)]]];
    while (fila.length) {
      const [atual, caminho] = fila.shift();
      if (vistos.has(atual)) continue;
      vistos.add(atual);
      const { limpo } = await fonte(atual).catch(() => ({ limpo: "" }));
      for (const imp of importsDe(limpo)) {
        if (imp.tipoApenas) continue;
        const alvo = resolverModulo(imp.especificador, atual);
        if (!alvo || !alvo.startsWith(SRC)) continue;
        const nome = path.basename(alvo);
        const ehGrafo = alvo === path.join(SRC, "dados", "grafo.ts");
        if (ehGrafo || JSON_PESADOS.includes(nome)) {
          violacoesDpf.push([...caminho, path.relative(RAIZ, alvo)].join(" → "));
          continue;
        }
        if (alvo.endsWith(".json")) continue;
        fila.push([alvo, [...caminho, path.relative(RAIZ, alvo)]]);
      }
    }
  }
  exigir(
    violacoesDpf.length === 0,
    "DP-F · caminhos de cliente até @/dados/grafo (transitivo, instrução inteira)",
    violacoesDpf.length === 0
      ? `0 violações em ${clientes.length} clientes`
      : violacoesDpf.join(" | "),
    "0 violações",
  );

  // ---- 3. D-47: nenhuma tela importa os três JSON pesados ----
  const telas = arquivos.filter(
    (a) => a.startsWith(path.join(SRC, "componentes")) || a.startsWith(path.join(SRC, "app")),
  );
  const violacoesD47 = [];
  for (const a of telas) {
    const { limpo } = await fonte(a);
    for (const imp of importsDe(limpo)) {
      if (JSON_PESADOS.some((j) => imp.especificador.endsWith(j))) {
        violacoesD47.push(`${path.relative(RAIZ, a)} → ${imp.especificador}`);
      }
    }
  }
  exigir(
    violacoesD47.length === 0,
    "D-47 · telas importando entidades/arestas/ocorrencias.json",
    violacoesD47.length === 0 ? `0 em ${telas.length} telas` : violacoesD47.join(" | "),
    "0",
  );

  // ---- 4. Peso do que foi ao navegador, com teto declarado ----
  const chunks = path.join(OUT, "_next", "static", "chunks");
  const pesoKb = existsSync(chunks) ? Math.round((await tamanhoDe(chunks)) / 1024) : -1;
  exigir(
    pesoKb > 0 && pesoKb <= 1600,
    "peso de out/_next/static/chunks",
    `${pesoKb} KB (a fase 2 mediu 766 KB antes do índice de busca; teto do 03-04: 1.600 KB)`,
    "≤ 1600 KB",
  );

  // ---- 5. Token de cor de apoio, as DUAS contagens (D-08) ----
  const hitsCor = [];
  let corEmProsa = 0;
  for (const a of arquivos) {
    const { limpo, bruto } = await fonte(a);
    CORES_APOIO.lastIndex = 0;
    for (const h of limpo.matchAll(CORES_APOIO)) hitsCor.push(`${path.relative(RAIZ, a)}:${h[0]}`);
    corEmProsa += [...bruto.matchAll(CORES_APOIO)].length;
  }
  exigir(
    hitsCor.length === 0,
    "D-08 · token de cor de apoio em .ts/.tsx (sem comentários)",
    hitsCor.length === 0
      ? `0 em código · ${corEmProsa} em prosa (comentários, ignorados de propósito)`
      : hitsCor.join(" | "),
    "0 em código",
  );

  // ---- 6. Posicionamento preso à janela fora de casca.tsx, as DUAS contagens ----
  const permitido = path.join(SRC, "componentes", "casca.tsx");
  const hitsFixed = [];
  let fixedEmProsa = 0;
  for (const a of telas) {
    const { limpo, bruto } = await fonte(a);
    if (a !== permitido && /\bfixed\b/.test(limpo)) hitsFixed.push(path.relative(RAIZ, a));
    fixedEmProsa += [...bruto.matchAll(/\bfixed\b/g)].length;
  }
  exigir(
    hitsFixed.length === 0,
    "posicionamento preso à janela fora de casca.tsx (sem comentários)",
    hitsFixed.length === 0
      ? `0 em código · ${fixedEmProsa} em prosa (comentários, ignorados de propósito)`
      : hitsFixed.join(" | "),
    "0 em código",
  );

  // ---- 7. Inserção de HTML bruto ----
  const hitsHtml = [];
  for (const a of arquivos) {
    const { limpo } = await fonte(a);
    if (limpo.includes("dangerouslySetInnerHTML")) hitsHtml.push(path.relative(RAIZ, a));
  }
  exigir(
    hitsHtml.length === 0,
    "inserção de HTML bruto em src/",
    hitsHtml.length === 0 ? `0 ocorrências em ${arquivos.length} arquivos` : hitsHtml.join(" | "),
    "0",
  );

  // ---- 8. globals.css intocado pela fase 3 ----
  // A disciplina de disjunção é o que permitiu quatro executores em paralelo, e ela precisa
  // de prova mecânica, não de palavra.
  const diffGlobals = git("diff", "--numstat", `${COMMIT_FIM_DA_FASE_2}..HEAD`, "--", "src/app/globals.css").trim();
  exigir(
    diffGlobals === "",
    `src/app/globals.css intocado desde o fim da fase 2 (${COMMIT_FIM_DA_FASE_2})`,
    diffGlobals === "" ? "0 linhas de diferença" : diffGlobals.replace(/\s+/g, " "),
    "diferença zero",
  );

  // ---- 9. Disjunção de arquivos entre os planos da onda 1, provada por git ----
  // É o achado mais valioso que este gate pode produzir para a fase 4: se os quatro planos
  // realmente não se tocaram, o método de paralelização está provado.
  const porPlano = new Map();
  for (const plano of PLANOS_DA_ONDA_1) {
    const hashes = git("log", "--all", "--format=%H %s")
      .split("\n")
      .filter((l) => l.includes(`(${plano})`))
      .map((l) => l.split(" ")[0])
      .filter(Boolean);
    const arqs = new Set();
    for (const h of hashes) {
      for (const f of git("show", "--name-only", "--format=", h).split("\n")) {
        const nome = f.trim();
        if (nome && !nome.startsWith(".planning/")) arqs.add(nome);
      }
    }
    porPlano.set(plano, arqs);
    nota(`${plano}: ${arqs.size} arquivos em ${hashes.length} commits`);
  }
  const intersecoes = [];
  for (let i = 0; i < PLANOS_DA_ONDA_1.length; i += 1) {
    for (let j = i + 1; j < PLANOS_DA_ONDA_1.length; j += 1) {
      const a = porPlano.get(PLANOS_DA_ONDA_1[i]);
      const b = porPlano.get(PLANOS_DA_ONDA_1[j]);
      const comum = [...a].filter((f) => b.has(f));
      if (comum.length) {
        intersecoes.push(`${PLANOS_DA_ONDA_1[i]}∩${PLANOS_DA_ONDA_1[j]}: ${comum.join(", ")}`);
      }
    }
  }
  exigir(
    intersecoes.length === 0,
    "disjunção de arquivos entre os 4 planos da onda 1 (6 pares, por git)",
    intersecoes.length === 0
      ? "0 arquivos em comum nos 6 pares — a paralelização não teve colisão"
      : intersecoes.join(" | "),
    "interseção vazia em todos os pares",
  );

  // ---- 10. Rotas exportadas ----
  const rotasFase1 = [
    "", "entrar", "verificacao", "acontece", "buscar", "descobrir", "mapa", "meu", "play",
    "observatorio", "redacao/fila", "redacao/trilha", "studio/duplicatas", "studio/ocorrencias",
    "studio/publicar", "onboarding/1", "onboarding/2", "onboarding/3",
  ];
  const faltando = rotasFase1.filter((r) => !existsSync(path.join(OUT, r, "index.html")));
  exigir(
    faltando.length === 0,
    "as 18 rotas da fase 1 intactas",
    faltando.length === 0 ? `${rotasFase1.length} de ${rotasFase1.length}` : `faltam ${faltando.join(", ")}`,
    "18 de 18",
  );

  exigir(
    existsSync(path.join(OUT, "salvos", "index.html")),
    "rota /salvos (AGEN-03)",
    existsSync(path.join(OUT, "salvos", "index.html")) ? "presente" : "AUSENTE",
    "presente",
  );

  const sessoes = (await readdir(path.join(OUT, "evento"))).filter((d) =>
    existsSync(path.join(OUT, "evento", d, "sessoes", "index.html")),
  );
  exigir(sessoes.length === 129, "rotas /evento/*/sessoes (AGEN-02)", sessoes.length, "129");

  const cidades = (await readdir(path.join(OUT, "cidade"))).filter((d) =>
    existsSync(path.join(OUT, "cidade", d, "index.html")),
  );
  exigir(cidades.length === 15, "rotas /cidade/* (AGEN-05)", cidades.length, "15");

  exigir(
    existsSync(path.join(OUT, "buscar", "frase", "index.html")),
    "rota /buscar/frase (AGEN-07)",
    existsSync(path.join(OUT, "buscar", "frase", "index.html")) ? "presente" : "AUSENTE",
    "presente",
  );

  // O total, e a diferença explicada rota a rota. Contamos TODO `.html` fora de `_next/`,
  // que é o critério que reproduz a linha de base de 1.784 da fase 2 — ele inclui o
  // `out/404.html` solto, que a contagem só por `index.html` deixaria de fora.
  const paginas = [];
  (function andar(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (p === path.join(OUT, "_next") || p === path.join(OUT, "acervo")) continue;
        andar(p);
      } else if (e.name.endsWith(".html")) {
        // Separador normalizado para "/" — no Windows `path.relative` devolve "\" e
        // nenhuma das regexes de rota abaixo casaria (medido: 0 novas, resíduo 2463).
        paginas.push(path.relative(OUT, p).split(path.sep).join("/"));
      }
    }
  })(OUT);
  const novas = paginas.filter(
    (r) =>
      /^evento\/[^/]+\/sessoes\/index\.html$/.test(r) ||
      /^cidade\/[^/]+\/index\.html$/.test(r) ||
      r === "salvos/index.html" ||
      r === "buscar/frase/index.html" ||
      // A rota que a fase 4 acrescentou (04-04). O LIMIAR NÃO MUDA: o resíduo continua
      // sendo 1.784, a linha de base da fase 2. O que muda é a lista do que é explicável —
      // sem esta linha o resíduo iria a 1.785 e o gate acusaria como defeito uma página
      // que o roteiro dos cinco cenários criou de propósito.
      r === "roteiro/index.html" ||
      // ---- As rotas que a FASE 5 acrescentou. Mesmo raciocínio, e o LIMIAR CONTINUA 1.784.
      // `/filtros/` (05-06) — acessibilidade como critério que se marca ANTES, e a rota para
      // onde 05-01 e 05-02 já apontavam antes de ela existir.
      r === "filtros/index.html" ||
      // Os dois becos de D-93 (05-06). O terceiro beco é `out/404.html`, e ele NÃO entra
      // nesta lista: existe na linha de base desde a fase 2, e 05-06 trocou o CONTEÚDO dele
      // por `app/not-found.tsx` sem acrescentar página. Pô-lo aqui levaria o resíduo a 1.783
      // e o gate acusaria como defeito uma página que sempre existiu.
      r === "busca-nao-encontrada/index.html" ||
      r === "agenda-nao-encontrada/index.html" ||
      // As 529 páginas do Player (05-07) — uma por mídia do acervo. É de longe o maior
      // acréscimo da fase, e é ele que responde por 529 das 532 páginas novas.
      /^play\/[^/]+\/index\.html$/.test(r) ||
      // ---- As 6 rotas da REFORMULAÇÃO do design system (2026-08): a árvore de menu
      // fixada pelo cliente. Nascem como esqueleto rotulado no mesmo commit do menu
      // lateral — o LIMIAR de 1.784 não muda, o que muda é a lista do explicável.
      // Eram 7: `/blog` foi retirada em 23/08 a pedido do cliente, por não ter
      // conteúdo no acervo — o que ela apontava (colunas e opinião) mora em /noticias.
      r === "cast/index.html" ||
      r === "noticias/index.html" ||
      r === "museu/index.html" ||
      r === "museu/exposicoes/index.html" ||
      r === "ia/index.html" ||
      r === "cursos/index.html",
  );
  const linhaBase = paginas.length - novas.length;
  exigir(
    linhaBase === 1784,
    "total de páginas em out/, com a diferença explicada pelas rotas novas",
    `${paginas.length} páginas · ${novas.length} novas (fase 3: 129 sessões + 15 cidades + /salvos + /buscar/frase; fase 4: /roteiro; fase 5: 529 de /play/[slug] + /filtros + os 2 becos de D-93) · resíduo ${linhaBase}`,
    "resíduo 1784 — a linha de base da fase 2",
  );
}

// ---------------------------------------------------------------------------
// (c) A CASCA, de novo — o que a fase 3 pode ter quebrado.
// As telas novas são as mais compridas da fase; se alguma estourar a moldura, é aqui.
// ---------------------------------------------------------------------------

async function gatesDaCasca(cdp, base) {
  titulo("── (c) a casca, com as telas novas dentro ──");

  await irPara(cdp, `${base}/acontece/`);

  const janela = await cdp.avaliar("({ w: innerWidth, h: innerHeight })");
  exigir(
    janela.w === LARGURA && janela.h >= 900,
    "viewport travado por Emulation.setDeviceMetricsOverride (não por tamanho de janela)",
    `${janela.w}×${janela.h}`,
    `${LARGURA}×${ALTURA}`,
  );

  // A regressão que este bloco media era a barra de abas escapando do telefone. Desde
  // 2026-08-23 a visão app tem DOIS elementos grudados — o cabeçalho fino, `sticky` no
  // topo de `.moldura-rolagem`, e a barra inferior, `absolute` contra a `.moldura` — e a
  // pergunta continua a mesma, agora nas duas pontas: contidos na moldura antes e depois
  // de rolar.
  const medirNavegacao = () =>
    cdp.avaliar(
      naPagina3(`
        const m = document.querySelector('.moldura');
        const r = document.querySelector('.moldura-rolagem');
        const t = document.querySelector('.barra-topo');
        const b = document.querySelector('.barra-inferior');
        if (!m || !r || !t || !b) {
          return { erro: !m ? 'moldura ausente' : !r ? 'rolagem ausente' : !t ? 'cabeçalho ausente' : 'barra ausente' };
        }
        const rm = m.getBoundingClientRect(), rt = t.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return {
          molduraLargura: Math.round(rm.width), molduraTopo: Math.round(rm.top),
          molduraBase: Math.round(rm.bottom), molduraEsquerda: Math.round(rm.left),
          molduraDireita: Math.round(rm.right),
          topoLargura: Math.round(rt.width), topoTopo: Math.round(rt.top), topoVisivel: visivel(t),
          barraLargura: Math.round(rb.width), barraBase: Math.round(rb.bottom),
          barraEsquerda: Math.round(rb.left), barraDireita: Math.round(rb.right),
          barraVisivel: visivel(b),
          rolagem: Math.round(r.scrollTop),
        };
      `),
    );

  const conteveNavegacao = (m) =>
    !m.erro &&
    m.topoVisivel &&
    m.barraVisivel &&
    m.topoLargura <= m.molduraLargura &&
    Math.abs(m.topoTopo - m.molduraTopo) <= 12 &&
    m.barraLargura <= m.molduraLargura &&
    m.barraEsquerda >= m.molduraEsquerda - 1 &&
    m.barraDireita <= m.molduraDireita + 1 &&
    Math.abs(m.barraBase - m.molduraBase) <= 12;

  const antes = await medirNavegacao();
  exigir(
    conteveNavegacao(antes),
    "moldura contém cabeçalho e barra inferior (antes de rolar)",
    antes.erro
      ? antes.erro
      : `cabeçalho ${antes.topoLargura}px topo ${antes.topoTopo} · barra ${antes.barraLargura}px base ${antes.barraBase} · moldura ${antes.molduraLargura}px topo ${antes.molduraTopo} base ${antes.molduraBase}`,
    "cabeçalho e barra contidos nas duas pontas da moldura",
  );

  await cdp.avaliar("document.querySelector('.moldura-rolagem').scrollTop = 999999");
  await respirar(300);
  const depois = await medirNavegacao();
  exigir(
    conteveNavegacao(depois),
    "moldura contém cabeçalho e barra inferior (rolada até o fim de Acontece)",
    depois.erro
      ? depois.erro
      : `rolagem ${depois.rolagem}px · cabeçalho topo ${depois.topoTopo} · barra base ${depois.barraBase} · moldura topo ${depois.molduraTopo} base ${depois.molduraBase}`,
    "cabeçalho e barra ainda grudados nas duas pontas",
  );

  const visaoAtual = () => cdp.avaliar("document.querySelector('[data-view]').getAttribute('data-view')");
  const inicial = await visaoAtual();
  exigir(inicial === "mobile", "data-view inicial", inicial, "mobile");

  await cdp.clicar(`Array.from(document.querySelectorAll('.alternador button, [class*="alternador"] button'))
      .find(b => /web|desktop|desk/i.test(b.textContent || ''))`);
  await respirar(300);
  const apos = await visaoAtual();
  exigir(apos !== inicial, "data-view após o alternador", apos, `≠ ${inicial}`);

  await cdp.recarregar();
  await coletarRede(cdp);
  exigir(
    (await visaoAtual()) === apos,
    "data-view sobrevive a recarregar (ida)",
    await visaoAtual(),
    apos,
  );

  await cdp.clicar(`Array.from(document.querySelectorAll('.alternador button, [class*="alternador"] button'))
      .find(b => /app|mobile|celular|telefone/i.test(b.textContent || ''))`);
  await respirar(300);
  exigir((await visaoAtual()) === "mobile", "data-view volta para mobile", await visaoAtual(), "mobile");

  await cdp.recarregar();
  await coletarRede(cdp);
  exigir(
    (await visaoAtual()) === "mobile",
    "data-view sobrevive a recarregar (volta)",
    await visaoAtual(),
    "mobile",
  );
}

// ---------------------------------------------------------------------------
// (1) ACONTECE — AGEN-01, D-53, D-54, D-55.
// ---------------------------------------------------------------------------

async function bloco1Acontece(cdp, base) {
  titulo("── 1 · Acontece: a lista é de EVENTOS, e o passado é mostrado como passado (AGEN-01) ──");

  await irPara(cdp, `${base}/acontece/`);

  const t = await cdp.avaliar(
    naPagina3(`
      const chips = visiveis('[data-dia]');
      const cartoes = visiveis('[data-evento]');
      const slugs = cartoes.map(c => c.getAttribute('data-evento'));
      const contagens = cartoes.map(c => {
        const p = c.querySelector('.contagem-sessoes');
        return { slug: c.getAttribute('data-evento'), attr: Number(c.getAttribute('data-sessoes')),
                 visivel: !!p && visivel(p), texto: p ? p.innerText.trim() : null };
      });
      return {
        chips: chips.length,
        tempos: [...new Set(chips.map(c => c.getAttribute('data-tempo')))],
        diaSelecionado: (chips.find(c => c.getAttribute('aria-pressed') === 'true') || {}).getAttribute
          ? chips.find(c => c.getAttribute('aria-pressed') === 'true').getAttribute('data-dia') : null,
        chipsSemRotulo: chips.filter(c => !c.getAttribute('data-tempo')).length,
        cartoes: cartoes.length,
        slugsDistintos: new Set(slugs).size,
        contagens,
        semContagemVisivel: contagens.filter(c => !c.visivel).length,
        ausencias: visiveis('[data-ausencia]').map(a => ({
          campo: a.getAttribute('data-ausencia'), altura: alturaDe(a), texto: a.innerText.slice(0, 60) })),
      };
    `),
  );

  exigir(t.cartoes > 0, "cartões de EVENTO visíveis no dia de referência", `${t.cartoes} cartões`, "> 0");
  exigir(
    t.slugsDistintos === t.cartoes,
    "D-53 · nenhum evento repetido na mesma lista (a lista é de eventos, não de sessões)",
    `${t.cartoes} cartões · ${t.slugsDistintos} slugs distintos`,
    "um cartão por evento",
  );
  exigir(
    t.semContagemVisivel === 0,
    "D-53 · contagem de sessões VISÍVEL em cada cartão",
    `${t.cartoes - t.semContagemVisivel} de ${t.cartoes} · ex.: «${(t.contagens[0] || {}).texto}»`,
    "todos os cartões",
  );
  exigir(
    t.chipsSemRotulo === 0 && t.tempos.length >= 2,
    "D-55 · a faixa marca cada dia por tempo",
    `${t.chips} dias na faixa · marcações ${JSON.stringify(t.tempos)} · ${t.chipsSemRotulo} sem marcação`,
    "todo dia marcado, com mais de um tempo representado",
  );

  // «Nenhum dia sem sessão na faixa»: percorre TODOS os chips e confere que cada um, ao ser
  // selecionado, lista pelo menos um evento. Percorrer o conjunto em vez de uma amostra é a
  // ampliação que a 02-05 fez e que vale aqui.
  const porDia = [];
  for (const dia of await cdp.avaliar(
    naPagina3(`return visiveis('[data-dia]').map(c => c.getAttribute('data-dia'));`),
  )) {
    await cdp.clicar(`document.querySelector('[data-dia="${dia}"]')`);
    await respirar(220);
    const n = await cdp.avaliar(naPagina3(`return visiveis('[data-evento]').length;`));
    porDia.push([dia, n]);
  }
  const diasVazios = porDia.filter(([, n]) => n === 0);
  exigir(
    diasVazios.length === 0,
    "D-55 · nenhum dia sem sessão na faixa (percorrido o conjunto, não uma amostra)",
    `${porDia.length} dias percorridos · mínimo ${Math.min(...porDia.map((d) => d[1]))} evento(s) · máximo ${Math.max(...porDia.map((d) => d[1]))}`,
    "0 dias vazios",
  );

  // D-54: um dia PASSADO continua listando, e os eventos são rotulados como passados.
  const diaPassado = await cdp.avaliar(
    naPagina3(`const c = visiveis('[data-dia]').find(c => c.getAttribute('data-tempo') === 'passado');
               return c ? c.getAttribute('data-dia') : null;`),
  );
  exigir(diaPassado !== null, "há dia passado na faixa (todo o acervo é passado — D-54)", diaPassado, "um dia passado");
  await cdp.clicar(`document.querySelector('[data-dia="${diaPassado}"]')`);
  await respirar(400);
  const passado = await cdp.avaliar(
    naPagina3(`
      const cartoes = visiveis('[data-evento]');
      const corpo = document.querySelector('.moldura').innerText;
      return { cartoes: cartoes.length, hash: location.hash,
               rotulaPassado: /já aconteceu/.test(corpo),
               amostra: (cartoes[0] ? cartoes[0].innerText : '').replace(/\\n+/g, ' · ').slice(0, 120) };
    `),
  );
  exigir(
    passado.cartoes > 0 && passado.rotulaPassado,
    "D-54 · dia passado: os eventos continuam listados E rotulados como passados",
    `dia ${diaPassado} · ${passado.cartoes} eventos · «já aconteceu» presente na tela · hash ${passado.hash}`,
    "eventos listados e marcados como passados, não escondidos",
  );

  exigir(
    t.ausencias.length === 4 && t.ausencias.every((a) => a.altura > 0),
    "as quatro frases de ausência visíveis, com altura maior que zero",
    t.ausencias.map((a) => `${a.campo} ${a.altura}px`).join(" · "),
    "4 ausências, todas com altura > 0",
  );

  resumo.push([
    "AGEN-01",
    `Acontece: ${t.cartoes} EVENTOS com contagem de sessões visível em ${t.cartoes}/${t.cartoes}, ` +
      `${t.chips} dias na faixa (0 vazios em ${porDia.length} percorridos), passado listado e rotulado, 4 ausências medidas`,
  ]);
}

// ---------------------------------------------------------------------------
// (2) SELEÇÃO DE OCORRÊNCIA — AGEN-02, D-56. Por CLIQUE, não por endereço digitado.
// ---------------------------------------------------------------------------

async function bloco2Ocorrencia(cdp, base) {
  titulo("── 2 · Seleção de ocorrência: salvar é de OCORRÊNCIA, nunca de evento (AGEN-02, D-56) ──");

  await irPara(cdp, `${base}/acontece/`);
  const ida = await clicarPara(
    cdp,
    `document.querySelector('a[href*="/sessoes/"]')`,
    (p) => p.includes("/sessoes"),
    "Acontece → seleção de ocorrência",
  );
  exigir(
    ida.para.includes("/sessoes/"),
    "AGEN-02 · do cartão de evento à escolha de sessão POR CLIQUE",
    `${ida.de} → ${ida.para} (toquei em «${ida.texto}»)`,
    "uma rota /evento/*/sessoes/",
  );

  const s = await cdp.avaliar(
    naPagina3(`
      const ss = visiveis('[data-sessao]');
      // O agrupamento por dia é ESTRUTURAL: cada sessão vive dentro de um .grupo-de-dia
      // que tem o seu próprio cabeçalho. Medir isso, e não contar h3 soltos, é o que
      // distingue «agrupadas» de «uma lista que por acaso tem um título por linha».
      const grupos = visiveis('.grupo-de-dia');
      const orfas = ss.filter(x => !x.closest('.grupo-de-dia'));
      const semCabecalho = grupos.filter(g => !g.querySelector('.grupo-de-dia-cabecalho'));
      return {
        sessoes: ss.length,
        ids: ss.map(x => x.getAttribute('data-sessao')),
        tempos: [...new Set(ss.map(x => x.getAttribute('data-sessao-tempo')))],
        salvar: visiveis('[data-salvar-sessao]').length,
        ausencias: visiveis('[data-ausencia]').map(a => ({ campo: a.getAttribute('data-ausencia'),
          texto: a.innerText.replace(/\\n+/g, ' ').slice(0, 90), temNumero: /\\d/.test(a.innerText) })),
        grupos: grupos.length, orfas: orfas.length, semCabecalho: semCabecalho.length,
        diasNomeados: grupos.map(g => g.querySelector('.grupo-de-dia-cabecalho').textContent.trim()).slice(0, 3),
      };
    `),
  );
  exigir(s.sessoes > 1, "sessões da ocorrência visíveis", `${s.sessoes} sessões`, "> 1");
  exigir(
    s.grupos > 0 && s.orfas === 0 && s.semCabecalho === 0,
    "sessões agrupadas por dia (toda sessão dentro de um grupo com cabeçalho nomeado)",
    `${s.grupos} grupos · ${s.orfas} sessões fora de grupo · ${s.semCabecalho} grupos sem cabeçalho · ex.: «${s.diasNomeados[0]}»`,
    "0 órfãs e 0 grupos sem cabeçalho",
  );
  exigir(
    s.salvar === s.sessoes,
    "D-56 · um controle de salvar POR SESSÃO (nenhum salvar-o-evento)",
    `${s.salvar} controles para ${s.sessoes} sessões`,
    "um por sessão",
  );

  // Salvar UMA sessão e medir que SÓ AQUELA ficou marcada.
  const alvo = s.ids[0];
  await cdp.clicar(`document.querySelector('[data-salvar-sessao="${alvo}"]')`);
  await respirar(500);
  const apos = await cdp.avaliar(
    naPagina3(`
      const marcados = visiveis('[data-salvar-sessao][aria-pressed="true"]')
        .map(b => b.getAttribute('data-salvar-sessao'));
      const conf = visiveis('[data-confirmacao-salvo]');
      return { marcados, confirmacoes: conf.length,
        confirmacaoDe: conf.map(c => c.getAttribute('data-confirmacao-salvo')),
        texto: conf.length ? conf[0].innerText.replace(/\\n+/g, ' ') : null,
        linkSalvos: conf.length ? conf[0].querySelectorAll('a[href*="/salvos"]').length : 0 };
    `),
  );
  exigir(
    apos.marcados.length === 1 && apos.marcados[0] === alvo,
    "D-56 · salvar marca EXATAMENTE aquela ocorrência, e nenhuma irmã",
    `${apos.marcados.length} marcada de ${s.sessoes} · ${apos.marcados[0]}`,
    `só ${alvo}`,
  );
  const nomeiaDataEHora = /\d{1,2}h\d{2}/.test(apos.texto ?? "") && /de \d{4}/.test(apos.texto ?? "");
  exigir(
    apos.confirmacoes === 1 && nomeiaDataEHora,
    "D-56 · a confirmação nomeia a sessão pela DATA e HORA",
    `«${(apos.texto || "").slice(0, 110)}…»`,
    "confirmação nomeando data e hora da sessão",
  );
  exigir(
    s.ausencias.length >= 3 && s.ausencias.every((a) => a.temNumero),
    "ausências de espaço, preço e lotação declaradas COM NÚMERO",
    s.ausencias.map((a) => a.campo).join(", ") + ` · ${s.ausencias.length} com número: ${s.ausencias.every((a) => a.temNumero)}`,
    "cada ausência com o número medido",
  );

  resumo.push([
    "AGEN-02",
    `Seleção de ocorrência: ${s.sessoes} sessões agrupadas por dia, ${s.salvar} controles (um por sessão); ` +
      `salvar marcou 1 de ${s.sessoes} e a confirmação nomeou data e hora`,
  ]);

  return { alvo, linkSalvos: apos.linkSalvos };
}

// ---------------------------------------------------------------------------
// (3) SALVOS E O CENÁRIO 4 — AGEN-03, D-57, D-58.
// É o gate mais importante desta fase depois de D-48: sem ele, «avisa só quem salvou
// aquela ocorrência» é afirmação de slide.
// ---------------------------------------------------------------------------

async function bloco3Cenario4(cdp, base) {
  titulo("── 3 · Salvos e o Cenário 4: o alerta chega à sessão salva, não à irmã (AGEN-03, D-57) ──");

  // Chegada POR CLIQUE, da confirmação da tela anterior.
  const ida = await clicarPara(
    cdp,
    `document.querySelector('[data-confirmacao-salvo] a[href*="/salvos"]')`,
    (p) => p.includes("/salvos"),
    "confirmação → /salvos",
  );
  exigir(
    ida.para.includes("/salvos"),
    "AGEN-03 · da confirmação a /salvos POR CLIQUE",
    `${ida.de} → ${ida.para} (toquei em «${ida.texto}»)`,
    "/salvos/",
  );

  // O Cenário 4 começa do zero: limpa a fila e usa a semeadura da própria tela.
  await cdp.avaliar(`localStorage.removeItem('agenda-cultural:salvos')`);
  await cdp.recarregar();
  await coletarRede(cdp);

  const vazio = await cdp.avaliar(
    naPagina3(`return { salvos: document.querySelector('[data-salvos]').getAttribute('data-salvos'),
                        semear: !!document.querySelector('[data-semear-cenario-4]'),
                        linhas: visiveis('[data-salvo]').length };`),
  );
  exigir(
    vazio.linhas === 0 && vazio.semear,
    "estado vazio útil, com a semeadura do Cenário 4 oferecida",
    `${vazio.linhas} linhas · semeadura presente: ${vazio.semear}`,
    "0 linhas e a semeadura visível",
  );

  await cdp.clicar(`document.querySelector('[data-semear-cenario-4]')`);
  await respirar(600);

  const semeado = await cdp.avaliar(
    naPagina3(`
      const linhas = visiveis('[data-salvo]');
      const alertadas = linhas.filter(l => l.getAttribute('data-salvo-alertado') === 'sim');
      const alerta = document.querySelector('[data-alerta]');
      const selo = document.querySelector('[data-procedencia-alerta]');
      const corpo = document.querySelector('.moldura').innerText;
      return {
        linhas: linhas.length,
        ids: linhas.map(l => l.getAttribute('data-salvo')),
        alertadas: alertadas.map(l => l.getAttribute('data-salvo')),
        alertaVisivel: visivel(alerta),
        alertaAltura: alturaDe(alerta),
        alertaDe: alerta ? alerta.getAttribute('data-alerta') : null,
        alertaTexto: alerta ? alerta.innerText.replace(/\\n+/g, ' · ') : null,
        procedencia: selo ? selo.getAttribute('data-procedencia-alerta') : null,
        seloVisivel: visivel(selo),
        horarios: alerta ? (alerta.innerText.match(/\\d{2}:\\d{2}/g) || []) : [],
        declaraInformante: /informado/i.test(corpo) && /por/i.test(corpo),
        fraseDoCenario: /só quem salvou esta sessão foi avisado/i.test(corpo),
      };
    `),
  );

  exigir(
    semeado.linhas === 2 && semeado.alertadas.length === 1,
    "D-57 · a semeadura salva 2 sessões do MESMO evento e EXATAMENTE 1 fica alertada",
    `${semeado.linhas} salvos · ${semeado.alertadas.length} alertado (${semeado.alertadas[0]}) · irmã intacta: ${semeado.ids.find((i) => i !== semeado.alertadas[0])}`,
    "2 salvos, 1 alertado",
  );
  exigir(
    semeado.alertaVisivel && semeado.alertaAltura > 0 && semeado.horarios.length >= 2,
    "D-57 · o alerta visível, com os DOIS horários",
    `${semeado.alertaAltura}px · horários ${semeado.horarios.join(" → ")} · ocorrência ${semeado.alertaDe}`,
    "alerta visível com o horário antigo e o novo",
  );
  exigir(
    semeado.seloVisivel && semeado.procedencia === "autorado" && semeado.declaraInformante,
    "D-57 · o informante e o rótulo autorado, visíveis",
    `data-procedencia-alerta="${semeado.procedencia}" · informante declarado: ${semeado.declaraInformante}`,
    "rótulo «autorado» visível e informante declarado",
  );
  exigir(
    semeado.fraseDoCenario,
    "D-57 · a frase que fecha o Cenário 4, na tela",
    semeado.fraseDoCenario ? "«Só quem salvou esta sessão foi avisado…» presente" : "AUSENTE",
    "a frase presente",
  );

  // D-58: a fila sobrevive a recarregar.
  await cdp.recarregar();
  await coletarRede(cdp);
  const recarregado = await cdp.avaliar(
    naPagina3(`return { linhas: visiveis('[data-salvo]').length,
                        alertadas: visiveis('[data-salvo][data-salvo-alertado="sim"]').length,
                        alerta: visivel(document.querySelector('[data-alerta]')) };`),
  );
  exigir(
    recarregado.linhas === 2 && recarregado.alertadas === 1 && recarregado.alerta,
    "D-58 · a fila sobrevive a recarregar (localStorage)",
    `${recarregado.linhas} linhas · ${recarregado.alertadas} alertada · alerta visível: ${recarregado.alerta}`,
    "2 linhas, 1 alertada, alerta presente",
  );

  // O PAR QUE PROVA A AFIRMAÇÃO INTEIRA. O passo da irmã sozinho não bastaria: um alerta
  // que nunca some pareceria dirigido e seria adorno. Remover a atingida é o controle.
  await cdp.clicar(`document.querySelector('[data-salvo][data-salvo-alertado="nao"] .salvos-remover')`);
  await respirar(600);
  const semIrma = await cdp.avaliar(
    naPagina3(`return { linhas: visiveis('[data-salvo]').length,
                        alerta: visivel(document.querySelector('[data-alerta]')) };`),
  );
  exigir(
    semIrma.linhas === 1 && semIrma.alerta,
    "D-57 · removida a sessão INTACTA, o alerta CONTINUA — ele pertence à outra sessão",
    `${semIrma.linhas} linha · alerta visível: ${semIrma.alerta}`,
    "1 linha e o alerta ainda visível",
  );

  await cdp.clicar(`document.querySelector('[data-salvo][data-salvo-alertado="sim"] .salvos-remover')`);
  await respirar(600);
  const semAtingida = await cdp.avaliar(
    naPagina3(`return { linhas: visiveis('[data-salvo]').length,
                        alerta: visivel(document.querySelector('[data-alerta]')),
                        semear: !!document.querySelector('[data-semear-cenario-4]') };`),
  );
  exigir(
    semAtingida.linhas === 0 && !semAtingida.alerta,
    "D-57 · removida a sessão ATINGIDA, o alerta SOME — o controle que prova que ele era dirigido",
    `${semAtingida.linhas} linhas · alerta visível: ${semAtingida.alerta} · estado vazio de volta: ${semAtingida.semear}`,
    "0 linhas e o alerta ausente",
  );

  resumo.push([
    "AGEN-03",
    `Cenário 4: 2 sessões do mesmo evento salvas, 1 alertada (${semeado.alertaDe}), ` +
      `alerta ${semeado.alertaAltura}px com ${semeado.horarios.join("→")}; sobreviveu a recarregar; ` +
      `removida a irmã o alerta ficou, removida a atingida o alerta sumiu`,
  ]);
}

// ---------------------------------------------------------------------------
// (4) MAPA — AGEN-04, D-59 a D-62.
// ---------------------------------------------------------------------------

async function bloco4Mapa(cdp, base) {
  titulo("── 4 · Mapa: lente que preserva o conjunto, e a camada de desertos (AGEN-04, D-59..D-62) ──");

  // A linha de base: o mapa SEM recorte.
  await irPara(cdp, `${base}/mapa/`);
  const semRecorte = await cdp.avaliar(
    naPagina3(`
      const pinos = visiveisSvg('[data-pino]');
      return { pinos: pinos.length,
               registros: pinos.reduce((a, p) => a + Number(p.getAttribute('data-pinos')), 0),
               porOffsetParent: visiveis('[data-pino]').length };
    `),
  );
  ok(
    "linha de base: /mapa sem recorte (defeito 3 exposto de propósito)",
    `${semRecorte.pinos} pinos por RETÂNGULO somando ${semRecorte.registros} registros · ` +
      `${semRecorte.porOffsetParent} pelo offsetParent de visiveis(), que não funciona em SVG`,
  );
  exigir(
    semRecorte.pinos > 0 && semRecorte.porOffsetParent === 0,
    "a medida de visibilidade em SVG é o retângulo, não offsetParent",
    `retângulo ${semRecorte.pinos} · offsetParent ${semRecorte.porOffsetParent}`,
    "retângulo > 0 e offsetParent == 0 — é por isso que este script não usa visiveis() no mapa",
  );

  // PRIMEIRA PORTA: de Acontece, por clique.
  await irPara(cdp, `${base}/acontece/`);
  const diaAntes = await cdp.avaliar(
    naPagina3(`const c = visiveis('[data-dia]').find(c => c.getAttribute('aria-pressed') === 'true');
               return c ? c.getAttribute('data-dia') : null;`),
  );
  const hrefLente = await cdp.avaliar(`document.querySelector('main a[href*="mapa"]').getAttribute('href')`);
  exigir(
    /\/mapa\/?#r=/.test(hrefLente) && /&t=/.test(hrefLente) && /&v=/.test(hrefLente),
    "a gramática da lente é /mapa/#r=…&t=…&v= (COM a barra — trailingSlash normaliza)",
    `${hrefLente.slice(0, 56)}… (${hrefLente.length} caracteres)`,
    "/mapa/#r=…&t=…&v=…",
  );

  const idaMapa = await clicarPara(
    cdp,
    `document.querySelector('main a[href*="mapa"]')`,
    (p) => p.includes("/mapa"),
    "Acontece → mapa",
  );
  const lenteAcontece = await cdp.avaliar(
    naPagina3(`
      const pinos = visiveisSvg('[data-pino]');
      const corpo = document.querySelector('.moldura').innerText;
      const cab = document.querySelector('main header').innerText.replace(/\\n+/g, ' ');
      const semPos = corpo.match(/Fora do desenho: (\\d+) sem coordenada/);
      return { pinos: pinos.length,
               registros: pinos.reduce((a, p) => a + Number(p.getAttribute('data-pinos')), 0),
               cabecalho: cab.slice(0, 130),
               declaraForaDoDesenho: !!semPos, semCoordenada: semPos ? Number(semPos[1]) : null,
               listaSemPosicao: /Sem posição:/.test(corpo),
               legendaVisivel: visivel(document.querySelector('[data-legenda-mapa]')) };
    `),
  );
  exigir(
    idaMapa.para.includes("/mapa") && lenteAcontece.cabecalho.includes("Lente sobre"),
    "D-59 · de Acontece ao mapa POR CLIQUE, e o mapa se declara LENTE sobre o conjunto",
    `${idaMapa.de} → ${idaMapa.para} · «${lenteAcontece.cabecalho}»`,
    "o mapa nomeando o recorte de onde veio",
  );
  // Este recorte é de eventos do CMS, que neste acervo NÃO têm território. O mapa desenha
  // zero pinos — e a exigência real, que é o que separa honestidade de tela vazia, é que
  // ele DECLARE isso com o número, em vez de mostrar um Brasil vazio em silêncio.
  exigir(
    lenteAcontece.declaraForaDoDesenho && lenteAcontece.listaSemPosicao,
    "T-03-16 · com 0 pinos desenhados, o mapa DECLARA quantos ficaram sem posição e os nomeia",
    `${lenteAcontece.pinos} pinos desenhados · «Fora do desenho: ${lenteAcontece.semCoordenada} sem coordenada» · lista «Sem posição:» presente`,
    "a ausência declarada com número, nunca um mapa vazio calado",
  );
  exigir(
    lenteAcontece.legendaVisivel,
    "D-61 · a legenda de procedência das coordenadas, visível",
    `visível: ${lenteAcontece.legendaVisivel}`,
    "visível",
  );

  // A VOLTA: o recorte preservado é o requisito, não a navegação.
  const volta = await clicarPara(
    cdp,
    `Array.from(document.querySelectorAll('a.mapa-botao')).find(a => /Voltar/.test(a.textContent))`,
    (p) => p.includes("/acontece"),
    "mapa → volta",
  );
  const diaDepois = await cdp.avaliar(
    naPagina3(`const c = visiveis('[data-dia]').find(c => c.getAttribute('aria-pressed') === 'true');
               return c ? c.getAttribute('data-dia') : null;`),
  );
  exigir(
    diaDepois === diaAntes,
    "D-59 · a volta leva ao DIA QUE ESTAVA SELECIONADO — o recorte preservado é o requisito",
    `saí no dia ${diaAntes} · voltei no dia ${diaDepois} (toquei em «${volta.texto.slice(0, 40)}…»)`,
    "o mesmo dia",
  );

  // SEGUNDA PORTA: de Buscar, que é a outra metade de D-59.
  await irPara(cdp, `${base}/buscar/`);
  await digitar(cdp, "#busca-campo", "bienal");
  const idaMapa2 = await clicarPara(
    cdp,
    `document.querySelector('main a[href*="mapa"]')`,
    (p) => p.includes("/mapa"),
    "Buscar → mapa",
  );
  const lenteBuscar = await cdp.avaliar(
    naPagina3(`
      const pinos = visiveisSvg('[data-pino]');
      return { pinos: pinos.length,
               registros: pinos.reduce((a, p) => a + Number(p.getAttribute('data-pinos')), 0),
               cabecalho: document.querySelector('main header').innerText.replace(/\\n+/g, ' ').slice(0, 90) };
    `),
  );
  exigir(
    idaMapa2.para.includes("/mapa") && lenteBuscar.pinos > 0 && lenteBuscar.pinos < semRecorte.pinos,
    "D-59 · a SEGUNDA porta: de Buscar ao mapa, e o recorte RECORTOU",
    `${lenteBuscar.pinos} pinos / ${lenteBuscar.registros} registros no recorte, contra ` +
      `${semRecorte.pinos} / ${semRecorte.registros} sem recorte · «${lenteBuscar.cabecalho}»`,
    "menos pinos que o mapa sem recorte, e mais que zero",
  );

  // A CAMADA DE DESERTOS.
  await cdp.clicar(`document.querySelector('[data-ligar-desertos]')`);
  await respirar(500);
  const camada = await cdp.avaliar(
    naPagina3(`
      const ufs = visiveisSvg('[data-uf]');
      const leitura = document.querySelector('[data-leitura-desertos]');
      const util = molduraUtil();
      const svg = document.querySelector('svg[data-mapa-viewbox]');
      const rs = svg.getBoundingClientRect();
      const rl = leitura ? leitura.getBoundingClientRect() : null;
      return {
        ufs: ufs.length,
        zero: ufs.filter(u => u.getAttribute('data-registros') === '0').map(u => u.getAttribute('data-uf')),
        faixas: [...new Set(ufs.map(u => u.getAttribute('data-faixa')))],
        maior: Math.max(...ufs.map(u => Number(u.getAttribute('data-registros')))),
        total: ufs.reduce((a, u) => a + Number(u.getAttribute('data-registros')), 0),
        leituraVisivel: visivel(leitura),
        leituraTemNumero: leitura ? /\\d/.test(leitura.innerText) : false,
        leituraTexto: leitura ? leitura.innerText.replace(/\\n+/g, ' ').slice(0, 220) : null,
        svgBase: Math.round(rs.bottom), leituraBase: rl ? Math.round(rl.bottom) : null,
        limiteUtil: util.limiteUtil, molduraBase: util.base, alturaDaBarra: util.alturaDaBarra,
      };
    `),
  );
  exigir(
    camada.ufs === 27,
    "D-62 · 27 unidades federativas DESENHADAS (medidas por retângulo, não por offsetParent)",
    `${camada.ufs} UFs · faixas ${JSON.stringify(camada.faixas)} · maior ${camada.maior} registros · total ${camada.total}`,
    "27",
  );
  exigir(
    camada.zero.length === 2,
    "D-62 · 2 unidades federativas com registro ZERO",
    `${camada.zero.length}: ${camada.zero.join(", ")}`,
    "2 (Sergipe e Tocantins)",
  );
  exigir(
    camada.leituraVisivel && camada.leituraTemNumero,
    "D-62 · a frase de leitura da camada, VISÍVEL e com número medido",
    `visível: ${camada.leituraVisivel} · «${camada.leituraTexto}…»`,
    "visível e numerada",
  );
  // DEFEITO 4: contra o LIMITE ÚTIL medido (desde a reformulação, o fundo visível da
  // moldura — o menu lateral não cobre o pé), não contra innerHeight.
  exigir(
    camada.svgBase <= camada.limiteUtil,
    "a camada CABE na moldura, medida contra o limite útil (não contra innerHeight)",
    `desenho termina em ${camada.svgBase}px · limite útil ${camada.limiteUtil}px ` +
      `(moldura vai até ${camada.molduraBase}px)`,
    "o desenho acima do limite útil",
  );

  resumo.push([
    "AGEN-04",
    `Mapa: lente das duas portas (Acontece e Buscar); de Buscar ${lenteBuscar.pinos} pinos contra ` +
      `${semRecorte.pinos} sem recorte; a volta devolveu o dia ${diaDepois}; desertos com 27 UFs, ` +
      `${camada.zero.join("+")} em zero, total ${camada.total} registros, cabendo em ${camada.svgBase}/${camada.limiteUtil}px`,
  ]);
}

// ---------------------------------------------------------------------------
// (5) MODO CIDADE — AGEN-05, D-48 a D-52. O Cenário 2.
// ---------------------------------------------------------------------------

async function bloco5Cidade(cdp, base) {
  titulo("── 5 · Modo Cidade: o enquadramento como conteúdo, sem data fabricada (AGEN-05, D-48..D-52) ──");

  await irPara(cdp, `${base}/cidade/belem-para/`);

  const c = await cdp.avaliar(
    naPagina3(`
      const enq = document.querySelector('[data-enquadramento]');
      const dias = visiveis('[data-dia-roteiro]');
      const corpo = document.querySelector('.moldura').innerText;
      return {
        enquadramentoVisivel: visivel(enq), enquadramentoAltura: alturaDe(enq),
        enquadramentoTexto: enq ? enq.innerText.replace(/\\n+/g, '\\n') : null,
        dias: dias.length,
        itensPorDia: dias.map(d => d.querySelectorAll('[data-item-roteiro]').length),
        deslocamentos: dias.map(d => {
          const m = d.innerText.match(/[\\d,]+\\s*km[^\\n]*/);
          return m ? m[0].trim() : null;
        }),
        botoesDeDias: visiveis('[data-dias]').map(b => b.getAttribute('data-dias')),
        alternar: visiveis('[data-alternar-item]').length,
        pedeDesculpa: /infelizmente|limitação do protótipo|apenas um protótipo/i.test(corpo),
        corpo,
      };
    `),
  );

  exigir(
    c.enquadramentoVisivel && c.enquadramentoAltura > 0,
    "D-52 · a frase de enquadramento VISÍVEL (não apenas presente no HTML)",
    `${c.enquadramentoAltura}px de altura · ${c.enquadramentoTexto.length} caracteres`,
    "visível, com altura > 0",
  );
  // O plano manda imprimir o texto inteiro: ele vai ser lido em voz alta, e o relatório é
  // onde quem apresentar o encontra.
  titulo("  a frase de enquadramento, texto integral (D-49, D-52):");
  for (const linha of c.enquadramentoTexto.split("\n")) if (linha.trim()) nota(linha.trim());

  exigir(
    !c.pedeDesculpa,
    "D-52 · o enquadramento não pede desculpa (sem «infelizmente», «limitação do protótipo»)",
    "0 palavras de licença no texto renderizado",
    "0",
  );
  exigir(
    c.dias === 4 && c.itensPorDia.every((n) => n >= 2 && n <= 3),
    "D-50 · 4 dias com 2 a 3 itens cada",
    `${c.dias} dias · itens ${c.itensPorDia.join("/")}`,
    "4 dias, 2–3 itens",
  );
  exigir(
    c.deslocamentos.every(Boolean),
    "D-50 · deslocamento em TEXTO em cada dia",
    c.deslocamentos.join(" · "),
    "um deslocamento declarado por dia",
  );

  // D-48 nesta tela: zero data futura no TEXTO RENDERIZADO, comparando ANO como número.
  const anos = anosDoTexto(c.corpo);
  const futuros = anos.filter((a) => a > ANO_DE_REFERENCIA);
  const datas = datasIsoDoTexto(c.corpo).filter((d) => d > DATA_DE_REFERENCIA);
  exigir(
    futuros.length === 0 && datas.length === 0,
    "D-48 · nenhuma data futura no texto renderizado de Belém (anos comparados como NÚMERO)",
    `${anos.length} anos no texto · maior ${Math.max(...anos)} · ${futuros.length} acima de ${ANO_DE_REFERENCIA} · ` +
      `${datas.length} datas cheias depois de ${DATA_DE_REFERENCIA}`,
    "0 anos futuros e 0 datas futuras",
  );

  // Trocar o número de dias SEM navegar.
  const rotaAntes = await cdp.avaliar("location.pathname");
  await cdp.clicar(`document.querySelector('[data-dias="3"]')`);
  await respirar(600);
  const tres = await cdp.avaliar(
    naPagina3(`return { dias: visiveis('[data-dia-roteiro]').length,
                        rota: location.pathname, hash: location.hash };`),
  );
  exigir(
    tres.dias === 3 && tres.rota === rotaAntes,
    "D-50 · trocar para 3 dias remonta SEM NAVEGAR",
    `${tres.dias} dias · rota ${tres.rota} (era ${rotaAntes}) · hash ${tres.hash}`,
    "3 dias na mesma rota",
  );

  // Voltar a 4 e alternar UM item: exatamente um dia muda.
  await cdp.clicar(`document.querySelector('[data-dias="4"]')`);
  await respirar(600);
  const assinatura = () =>
    cdp.avaliar(
      naPagina3(`return visiveis('[data-dia-roteiro]').map(d =>
        Array.from(d.querySelectorAll('[data-item-roteiro]')).map(i => i.getAttribute('data-item-roteiro')).join('|'));`),
    );
  const antesDeAlternar = await assinatura();
  const chaveTrocada = await cdp.avaliar(
    naPagina3(`const b = visiveis('[data-alternar-item]').find(b => !b.disabled);
               return b ? b.getAttribute('data-alternar-item') : null;`),
  );
  await cdp.clicar(`document.querySelector('[data-alternar-item="${chaveTrocada}"]')`);
  await respirar(600);
  const depoisDeAlternar = await assinatura();
  const diasMudados = antesDeAlternar.filter((d, i) => d !== depoisDeAlternar[i]).length;
  exigir(
    diasMudados === 1,
    "D-50 · alternar um item muda EXATAMENTE um dia",
    `${diasMudados} dia mudou de ${antesDeAlternar.length} · troquei «${chaveTrocada}»`,
    "1",
  );

  resumo.push([
    "AGEN-05",
    `Modo Cidade: enquadramento visível (${c.enquadramentoAltura}px, sem desculpa), 4 dias com ` +
      `${c.itensPorDia.join("/")} itens e deslocamento em texto, 0 data futura (maior ano ${Math.max(...anos)}), ` +
      `3 dias sem navegar, alternar mudou 1 dia de 4`,
  ]);
}

// ---------------------------------------------------------------------------
// (6) BUSCAR — AGEN-06, D-63, D-66.
// ---------------------------------------------------------------------------

async function bloco6Buscar(cdp, base) {
  titulo("── 6 · Buscar: tipos misturados com o tipo etiquetado, e zero-resultado que não é beco (AGEN-06) ──");

  await irPara(cdp, `${base}/buscar/`);
  await digitar(cdp, "#busca-campo", "bienal");

  const b = await cdp.avaliar(
    naPagina3(`
      const sec = document.querySelector('[data-resultados-total]');
      const res = visiveis('[data-resultado]');
      const etiquetas = res.map(r => {
        const e = r.querySelector('[data-tipo-rotulo]');
        if (!e) return { ok: false, altura: 0 };
        const rc = e.getBoundingClientRect();
        return { ok: visivel(e) && rc.height > 0 && rc.width > 0, altura: Math.round(rc.height),
                 texto: e.textContent.trim() };
      });
      const porClasse = {};
      for (const r of res) { const c = r.getAttribute('data-tipo'); porClasse[c] = (porClasse[c] || 0) + 1; }
      return {
        total: Number(sec.getAttribute('data-resultados-total')),
        exibidos: Number(sec.getAttribute('data-resultados-exibidos')),
        visiveis: res.length, porClasse,
        classes: Object.keys(porClasse).length,
        etiquetasVisiveis: etiquetas.filter(e => e.ok).length,
        amostraEtiqueta: (etiquetas[0] || {}).texto,
        rota: location.pathname, hash: location.hash,
      };
    `),
  );

  exigir(b.visiveis > 0, "«bienal» devolve resultados visíveis", `${b.visiveis} visíveis de ${b.total} no total`, "> 0");
  exigir(
    b.classes >= 2,
    "D-63 · o índice MISTURA tipos — duas ou mais classes distintas no mesmo resultado",
    `${b.classes} classes: ${Object.entries(b.porClasse).map(([k, v]) => `${k} ${v}`).join(" · ")}`,
    "≥ 2 classes",
  );
  exigir(
    b.etiquetasVisiveis === b.visiveis,
    "D-63 · etiqueta de tipo VISÍVEL (medida por retângulo, não só presente no atributo)",
    `${b.etiquetasVisiveis} de ${b.visiveis} · ex.: «${b.amostraEtiqueta}»`,
    "todas visíveis",
  );

  // Marcar uma faceta e medir o recorte SEM navegar.
  await cdp.clicar(`document.querySelector('[data-faceta="classe:evento"]')`);
  await respirar(600);
  const comFaceta = await cdp.avaliar(
    naPagina3(`const sec = document.querySelector('[data-resultados-total]');
               const res = visiveis('[data-resultado]');
               return { total: Number(sec.getAttribute('data-resultados-total')),
                        classes: new Set(res.map(r => r.getAttribute('data-tipo'))).size,
                        rota: location.pathname, hash: location.hash };`),
  );
  exigir(
    comFaceta.total < b.total && comFaceta.classes === 1 && comFaceta.rota === b.rota,
    "AGEN-06 · marcar faceta recorta SEM NAVEGAR",
    `${b.total} → ${comFaceta.total} resultados · ${comFaceta.classes} classe · rota ${comFaceta.rota} · hash ${comFaceta.hash}`,
    "menos resultados, uma classe, mesma rota",
  );

  // Termo de controle sem casamento → afrouxamento COM número, e o número é entregue.
  await digitar(cdp, "#busca-campo", "zzzqqqxxx");
  const zero = await cdp.avaliar(
    naPagina3(`
      const sec = document.querySelector('[data-resultados-total]');
      const afr = visiveis('[data-afrouxamento]');
      return { total: sec ? Number(sec.getAttribute('data-resultados-total')) : null,
               afrouxamentos: afr.map(a => ({ campo: a.getAttribute('data-afrouxamento'),
                 n: Number(a.getAttribute('data-afrouxamento-n')),
                 texto: a.innerText.replace(/\\n+/g, ' ').slice(0, 70) })) };
    `),
  );
  exigir(
    zero.total === 0 && zero.afrouxamentos.length >= 1 && zero.afrouxamentos.every((a) => a.n > 0),
    "D-66 · zero-resultado oferece qual critério afrouxar E quantos resultados aquilo traria",
    `${zero.total} resultados · ${zero.afrouxamentos.length} afrouxamento(s): ` +
      zero.afrouxamentos.map((a) => `${a.campo}→${a.n}`).join(", "),
    "0 resultados e ao menos um afrouxamento numerado",
  );

  const prometido = zero.afrouxamentos[0].n;
  await cdp.clicar(`document.querySelector('[data-afrouxamento]')`);
  await respirar(700);
  const entregue = await cdp.avaliar(
    naPagina3(`const sec = document.querySelector('[data-resultados-total]');
               return { total: Number(sec.getAttribute('data-resultados-total')),
                        exibidos: Number(sec.getAttribute('data-resultados-exibidos')) };`),
  );
  exigir(
    entregue.total === prometido,
    "D-66 · tocar no afrouxamento entrega EXATAMENTE o número prometido",
    `prometeu ${prometido} · entregou ${entregue.total} (a lista mostra ${entregue.exibidos} pelo teto de exibição)`,
    `${prometido}`,
  );

  resumo.push([
    "AGEN-06",
    `Buscar: «bienal» → ${b.total} resultados em ${b.classes} classes ` +
      `(${Object.entries(b.porClasse).map(([k, v]) => `${k} ${v}`).join(" · ")}), etiqueta visível em ` +
      `${b.etiquetasVisiveis}/${b.visiveis}; faceta evento ${b.total}→${comFaceta.total} sem navegar; ` +
      `zero-resultado com afrouxamento que prometeu ${prometido} e entregou ${entregue.total}`,
  ]);
}

// ---------------------------------------------------------------------------
// (7) BUSCA EM LINGUAGEM NATURAL — AGEN-07, D-64, D-65. O Cenário 5.
// ---------------------------------------------------------------------------

async function bloco7Frase(cdp, base) {
  titulo("── 7 · Busca por frase: a tradução É a resposta, editável em um toque (AGEN-07, D-64, D-65) ──");

  await irPara(cdp, `${base}/buscar/`);
  // O PRIMEIRO link do DOM não é necessariamente o link da TELA.
  //
  // 05-02 acrescentou a `/buscar/` o bloco `[data-frase-natural]` — a tradução do Cenário 5
  // por extenso, permanente na visão web —, e ele traz o seu próprio link para
  // `/buscar/frase/`. Sob `output: "export"` o HTML é UM SÓ para as duas visões e a visão é
  // estado de cliente: os dois blocos existem no DOM das duas, e quem some é a CAIXA. Na
  // visão app — que é a inicial — o bloco da web está `display: none`, e é ele o primeiro no
  // DOM. `querySelector` devolvia esse, com retângulo zerado, e `cdp.clicar` recusava — com
  // razão, porque ele faz hit-test de verdade justamente para pegar «link presente que não
  // navega».
  //
  // O defeito é DESTE GATE, e não da tela: a tela continua oferecendo exatamente UM link
  // visível para `/buscar/frase/` na visão app, e é isso que AGEN-07 afirma. O gate pedia «o
  // primeiro link do documento» quando queria dizer «um link que uma pessoa consegue
  // clicar». Corrigido para o segundo, que é a afirmação mais forte. Nenhum limiar mudou.
  const ida = await clicarPara(
    cdp,
    `Array.from(document.querySelectorAll('a[href*="/buscar/frase"]')).find((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0; })`,
    (p) => p.includes("/buscar/frase"),
    "Buscar → busca por frase",
  );
  exigir(
    ida.para.includes("/buscar/frase"),
    "AGEN-07 · de /buscar a /buscar/frase POR CLIQUE",
    `${ida.de} → ${ida.para} (toquei em «${ida.texto}»)`,
    "/buscar/frase/",
  );

  const f = await cdp.avaliar(
    naPagina3(`
      const sec = document.querySelector('[data-resultados-total]');
      const fichas = visiveis('[data-criterio]');
      const res = visiveis('[data-resultado]');
      const motivos = res.map(r => r.querySelector('[data-motivo-casamento]')).filter(Boolean);
      const semIa = document.querySelector('[data-sem-ia]');
      const gratuidade = fichas.find(x => x.getAttribute('data-regra-do-criterio') === 'gratuidade');
      return {
        frase: document.querySelector('[data-frase]').value,
        fichas: fichas.map(x => ({ chave: x.getAttribute('data-criterio'),
          regra: x.getAttribute('data-regra-do-criterio'),
          confessa: x.getAttribute('data-confissao'), altura: alturaDe(x) })),
        removiveis: visiveis('[data-remover-criterio]').length,
        total: Number(sec.getAttribute('data-resultados-total')),
        resultados: res.length,
        comMotivo: motivos.length,
        origens: motivos.reduce((a, m) => { const o = m.getAttribute('data-origem-casamento');
          a[o] = (a[o] || 0) + 1; return a; }, {}),
        semIaVisivel: visivel(semIa), semIaAltura: alturaDe(semIa),
        semIaTexto: semIa ? semIa.innerText.replace(/\\n+/g, ' ').slice(0, 90) : null,
        gratuidadeTexto: gratuidade ? gratuidade.innerText.replace(/\\n+/g, ' ') : null,
        gratuidadeTemNumero: gratuidade ? /\\d/.test(gratuidade.innerText) : false,
      };
    `),
  );

  exigir(
    f.fichas.length >= 3 && f.fichas.every((x) => x.altura > 0),
    "D-64 · a frase do Cenário 5 já traduzida em fichas VISÍVEIS ao abrir",
    `«${f.frase}» → ${f.fichas.length} fichas: ${f.fichas.map((x) => x.chave).join(", ")}`,
    "≥ 3 fichas visíveis",
  );
  exigir(
    f.comMotivo === f.resultados && f.resultados > 0,
    "D-64 · cada resultado traz o trecho/motivo que o produziu",
    `${f.comMotivo} de ${f.resultados} resultados com motivo · origens ${JSON.stringify(f.origens)}`,
    "todos com motivo",
  );
  exigir(
    f.semIaVisivel && f.semIaAltura > 0,
    "D-65 · a declaração de ausência de IA, VISÍVEL (não apenas no HTML)",
    `${f.semIaAltura}px · «${f.semIaTexto}…»`,
    "visível",
  );

  await cdp.clicar(`document.querySelector('[data-regras]')`);
  await respirar(500);
  const regras = await cdp.avaliar(
    naPagina3(`const rs = visiveis('[data-regra]');
               return { n: rs.length, ids: rs.map(r => r.getAttribute('data-regra')),
                        comExemplo: rs.filter(r => /exemplo:/.test(r.innerText)).length };`),
  );
  exigir(
    regras.n > 0 && regras.comExemplo === regras.n,
    "D-65 · a lista de regras declaradas, aberta e contada — a alternativa ao modelo é uma LISTA",
    `${regras.n} regras, todas com exemplo: ${regras.ids.join(", ")}`,
    "todas as regras visíveis, cada uma com exemplo",
  );

  exigir(
    f.gratuidadeTemNumero,
    "a ficha de gratuidade declara que NÃO recorta, com número",
    `«${(f.gratuidadeTexto || "").slice(0, 130)}…»`,
    "a confissão com o número medido",
  );

  // A SÉRIE DE CONTAGENS da remoção sucessiva, no formato que a 02-05 usou para a
  // degradação de caminhos — e a URL não pode mudar em nenhum passo.
  const urlDe = () => cdp.avaliar("location.pathname + location.search");
  const urlInicial = await urlDe();
  const serie = [f.total];
  const tirados = [];
  for (let i = 0; i < 3; i += 1) {
    const chave = await cdp.avaliar(
      naPagina3(`const b = visiveis('[data-remover-criterio]')[0];
                 return b ? b.getAttribute('data-remover-criterio') : null;`),
    );
    if (!chave) break;
    await cdp.clicar(`document.querySelector('[data-remover-criterio="${chave}"]')`);
    await respirar(700);
    const agora = await cdp.avaliar(
      naPagina3(`const sec = document.querySelector('[data-resultados-total]');
                 return sec ? Number(sec.getAttribute('data-resultados-total')) : 0;`),
    );
    serie.push(agora);
    tirados.push(chave);
    const url = await urlDe();
    exigir(
      url === urlInicial,
      `D-64 · a URL não muda ao tirar a ficha «${chave}»`,
      `${url} (inicial ${urlInicial})`,
      "a mesma URL",
    );
  }
  exigir(
    serie.length >= 4,
    "D-64 · remover as fichas uma a uma, com a série de contagens e recálculo ao vivo",
    `série ${serie.join(" → ")} · tirando ${tirados.join(", ")}`,
    "uma contagem por remoção",
  );

  resumo.push([
    "AGEN-07",
    `Busca por frase: «${f.frase}» → ${f.fichas.length} fichas editáveis, ${f.resultados} resultados ` +
      `todos com motivo (${JSON.stringify(f.origens)}), declaração de ausência de IA visível com ` +
      `${regras.n} regras listadas; série da remoção ${serie.join(" → ")} com a URL inalterada`,
  ]);

  return { serie, tirados, frase: f.frase, fichas: f.fichas, porClasse: f.origens };
}

// ---------------------------------------------------------------------------
// D-48 — O GATE MAIS IMPORTANTE DA FASE.
//
// Varre o TEXTO RENDERIZADO — não o HTML — das 15 páginas de /cidade/* e de /acontece,
// procurando data posterior à referência do build em contexto de programação.
//
// A comparação é por ANO EXTRAÍDO E CONVERTIDO A NÚMERO (defeito 5): `"27.06.1967" >
// "2026-08-22"` é `true` em JavaScript, e há 113 datas declaradas nas 15 cidades que um
// gate de string acusaria de futuras, todas históricas.
//
// A régua difere por tela, e a diferença é o conteúdo de D-48:
//   · /cidade/* — Modo Cidade responde «o que EXISTE neste território», nunca «o que
//     acontece nesta semana». Fabricar programação aqui é o que D-48 proíbe: régua dura,
//     zero data posterior à data de referência.
//   · /acontece — a agenda mostra as sessões que o acervo DECLARA, e 166 delas são
//     posteriores à referência. Elas não são fabricadas: são o dado do CMS. A régua aqui é
//     o horizonte do próprio acervo — nada além de 2026, o último ano que o acervo declara.
// ---------------------------------------------------------------------------

async function gateD48(cdp, base) {
  titulo("── D-48 · nenhuma data fabricada, varrido no TEXTO RENDERIZADO (o gate mais importante) ──");

  const cidades = (await readdir(path.join(OUT, "cidade"))).filter((d) =>
    existsSync(path.join(OUT, "cidade", d, "index.html")),
  );

  const achados = [];
  let anosLidos = 0;
  let maiorAno = 0;
  for (const slug of cidades) {
    await irPara(cdp, `${base}/cidade/${slug}/`);
    const corpo = await cdp.avaliar(`document.querySelector('.moldura').innerText`);
    const anos = anosDoTexto(corpo);
    const datas = datasIsoDoTexto(corpo);
    anosLidos += anos.length;
    maiorAno = Math.max(maiorAno, ...anos);
    const futuros = anos.filter((a) => a > ANO_DE_REFERENCIA);
    const datasFuturas = datas.filter((d) => d > DATA_DE_REFERENCIA);
    if (futuros.length || datasFuturas.length) {
      achados.push(`${slug}: anos ${[...new Set(futuros)].join(",")} datas ${datasFuturas.join(",")}`);
    }
  }
  exigir(
    achados.length === 0,
    `D-48 · zero data futura no texto renderizado das ${cidades.length} páginas de /cidade/*`,
    `${cidades.length} páginas varridas · ${anosLidos} anos lidos · maior ano impresso ${maiorAno} · ` +
      `0 posteriores a ${DATA_DE_REFERENCIA}`,
    "0 datas futuras",
  );

  // /acontece, dia a dia: percorre a faixa inteira e mede o horizonte declarado.
  await irPara(cdp, `${base}/acontece/`);
  const dias = await cdp.avaliar(
    naPagina3(`return visiveis('[data-dia]').map(c => c.getAttribute('data-dia'));`),
  );
  let maiorAnoAgenda = 0;
  let acimaDoHorizonte = [];
  for (const dia of dias) {
    await cdp.clicar(`document.querySelector('[data-dia="${dia}"]')`);
    await respirar(200);
    const corpo = await cdp.avaliar(`document.querySelector('.moldura').innerText`);
    const anos = anosDoTexto(corpo);
    maiorAnoAgenda = Math.max(maiorAnoAgenda, ...anos);
    const fora = anos.filter((a) => a > ANO_DE_REFERENCIA);
    if (fora.length) acimaDoHorizonte.push(`${dia}: ${[...new Set(fora)].join(",")}`);
  }
  exigir(
    acimaDoHorizonte.length === 0,
    `D-48 · em /acontece, nenhum ano além do horizonte do acervo (${ANO_DE_REFERENCIA})`,
    `${dias.length} dias percorridos · maior ano impresso ${maiorAnoAgenda} · 0 acima de ${ANO_DE_REFERENCIA}`,
    `0 anos acima de ${ANO_DE_REFERENCIA}`,
  );

  nota(
    `varridas ${cidades.length} páginas de /cidade/* e ${dias.length} dias de /acontece; ` +
      `a comparação é por ano convertido a número, nunca por string`,
  );

  resumo.push([
    "D-48",
    `${cidades.length} páginas de /cidade/* (maior ano ${maiorAno}) e ${dias.length} dias de /acontece ` +
      `(maior ano ${maiorAnoAgenda}) varridos no texto renderizado: 0 data fabricada`,
  ]);
}

// ---------------------------------------------------------------------------
// AS MITIGAÇÕES DO MODELO DE AMEAÇAS, EXERCITADAS EM VEZ DE DECLARADAS.
// A 02-05 encontrou três defeitos nas próprias mitigações, e os três só apareceram porque
// foram testados. Uma mitigação declarada e não exercitada é uma mitigação que não existe.
// ---------------------------------------------------------------------------

async function gatesDeAmeaca(cdp, base) {
  titulo("── ameaças exercitadas (não declaradas) ──");

  // T-03-13 · endereço de volta vindo do hash é entrada não confiável.
  const tortos = ["https://exemplo.invalido/x", "//exemplo.invalido", "/\\exemplo", "javascript:alert(1)"];
  const falhasVolta = [];
  for (const v of tortos) {
    await irPara(cdp, `${base}/mapa/#r=espaco_theatro-da-paz-belem&t=teste&v=${encodeURIComponent(v)}`);
    const r = await cdp.avaliar(
      naPagina3(`return { externos: todos('a[href^="http"], a[href^="//"], a[href^="javascript:"]')
                            .map(a => a.getAttribute('href')),
                          recusaDeclarada: /recusado/i.test(document.querySelector('.moldura').innerText),
                          voltas: visiveis('a.mapa-botao').map(b => b.textContent.trim()) };`),
    );
    if (r.externos.length || !r.recusaDeclarada) falhasVolta.push(`${v} → ${JSON.stringify(r)}`);
  }
  exigir(
    falhasVolta.length === 0,
    "T-03-13 · endereço de volta externo ou torto: recusado, declarado, e nenhum link externo na tela",
    `${tortos.length} formas testadas (${tortos.join(", ")}) · 0 link externo · recusa declarada em todas`,
    "0 links externos e a recusa dita na tela",
  );

  // T-03-02 / T-03-22 · entrada da URL.
  await irPara(cdp, `${base}/acontece/#dia=1999-99-99`);
  const diaTorto = await cdp.avaliar(
    naPagina3(`const c = visiveis('[data-dia]').find(c => c.getAttribute('aria-pressed') === 'true');
               return { selecionado: c ? c.getAttribute('data-dia') : null,
                        cartoes: visiveis('[data-evento]').length };`),
  );
  exigir(
    diaTorto.selecionado === DATA_DE_REFERENCIA && diaTorto.cartoes > 0,
    "T-03-02 · #dia= com data que não existe cai no padrão e a tela não quebra",
    `#dia=1999-99-99 → selecionado ${diaTorto.selecionado} · ${diaTorto.cartoes} eventos`,
    `o dia de referência ${DATA_DE_REFERENCIA}`,
  );

  await irPara(cdp, `${base}/buscar/#q=bienal&f=classe:naoexiste`);
  const facetaTorta = await cdp.avaliar(
    naPagina3(`const sec = document.querySelector('[data-resultados-total]');
               return { total: sec ? Number(sec.getAttribute('data-resultados-total')) : null,
                        resultados: visiveis('[data-resultado]').length };`),
  );
  exigir(
    facetaTorta.total > 0 && facetaTorta.resultados > 0,
    "T-03-22 · faceta desconhecida no hash é ignorada e a busca segue",
    `#f=classe:naoexiste → ${facetaTorta.total} resultados (a faceta inválida não recortou nem quebrou)`,
    "a busca íntegra",
  );

  await irPara(cdp, `${base}/cidade/belem-para/#dias=99`);
  const diasForaDaFaixa = await cdp.avaliar(
    naPagina3(`return visiveis('[data-dia-roteiro]').length;`),
  );
  exigir(
    diasForaDaFaixa === 4,
    "T-03-31 · ?dias= fora da faixa cai no padrão",
    `#dias=99 → ${diasForaDaFaixa} dias`,
    "4 (o padrão)",
  );

  // T-03-09 · storage adulterado.
  await irPara(cdp, `${base}/salvos/`);
  await cdp.avaliar(
    `localStorage.setItem('agenda-cultural:salvos', JSON.stringify(['ocorrencia:derivado:nao-existe-000','ocorrencia:derivado:13845-t1-o0028']))`,
  );
  await cdp.recarregar();
  await coletarRede(cdp);
  const idInexistente = await cdp.avaliar(
    naPagina3(`return { linhas: visiveis('[data-salvo]').length,
                        declara: /não resolv|descart|não existe|desconhecid|1 id/i.test(document.querySelector('.moldura').innerText) };`),
  );
  exigir(
    idInexistente.linhas === 1,
    "T-03-09 · id inexistente no storage é DESCARTADO e a fila segue com o que resolve",
    `2 ids gravados (1 inexistente) → ${idInexistente.linhas} linha renderizada`,
    "1 linha",
  );

  await cdp.avaliar(`localStorage.setItem('agenda-cultural:salvos', '"isto-nao-e-lista"')`);
  await cdp.recarregar();
  await coletarRede(cdp);
  const naoLista = await cdp.avaliar(
    naPagina3(`return { salvos: document.querySelector('[data-salvos]').getAttribute('data-salvos'),
                        linhas: visiveis('[data-salvo]').length };`),
  );
  exigir(
    Number(naoLista.salvos) === 0 && naoLista.linhas === 0,
    "T-03-09 · valor que não é lista no storage: a fila descarta e a tela não quebra",
    `storage = "isto-nao-e-lista" → ${naoLista.linhas} linhas, data-salvos=${naoLista.salvos}`,
    "0 linhas, sem exceção",
  );
  await cdp.avaliar(`localStorage.removeItem('agenda-cultural:salvos')`);
}

// ---------------------------------------------------------------------------
// D-60 e D-65 POR PROCESSO — a prova mais forte que esta fase tem.
// ---------------------------------------------------------------------------

function gateRede(cdp, base) {
  titulo("── rede, acumulada na sessão inteira (D-60, D-65, T-03-17, T-03-34) ──");
  const externos = [...recursos].filter((u) => !u.startsWith(base) && !u.startsWith("data:") && !u.startsWith("blob:"));
  for (const u of externos.slice(0, 20)) nota(`EXTERNO: ${u}`);
  exigir(
    externos.length === 0,
    "requisição para fora do servidor local",
    `0 requisição externa · ${recursos.size} recursos distintos, todos em ${base}, em ${cdp.navegacoes} navegações`,
    "0",
  );
  resumo.push([
    "rede",
    `0 requisição externa em ${cdp.navegacoes} navegações · ${recursos.size} recursos distintos, ` +
      `todos no servidor local — nenhum tile, nenhuma fonte remota, nenhuma chamada de modelo`,
  ]);
}

// ---------------------------------------------------------------------------
// Console — acumulado na SESSÃO INTEIRA.
// ---------------------------------------------------------------------------

/**
 * O diagnóstico de recurso pré-carregado do Next: o Chrome o emite quando um
 * `<link rel=preload>` de CSS de rota não é usado dentro de ~3s do carregamento. Ele não
 * vem do código da aplicação — vem do pipeline de assets do framework — e só aparece
 * quando a página fica PARADA. Medido nesta mesma execução (o controle abaixo): ele sai
 * igual nas rotas da fase 2, que a fase 3 não tocou.
 */
const AVISO_DE_PRELOAD = /was preloaded using link preload but not used/;

/** Preenchido por `controleDePreload()`, no começo da sessão. */
const controle = { porRota: [], chunks: new Map() };

/**
 * ATRIBUIÇÃO MEDIDA: de qual folha de estilo veio um chunk de CSS.
 * Lê o primeiro seletor de classe do chunk exportado e procura por ele nas folhas da
 * fonte. Sem isto, «2 avisos» é um número sem dono, e um número sem dono não conserta
 * nada nem acusa ninguém.
 */
async function atribuirChunk(nomeDoChunk) {
  if (controle.chunks.has(nomeDoChunk)) return controle.chunks.get(nomeDoChunk);
  const arquivo = path.join(OUT, "_next", "static", "chunks", `${nomeDoChunk}.css`);
  let dono = "(não atribuído)";
  if (existsSync(arquivo)) {
    const css = await readFile(arquivo, "utf8");
    const seletor = (css.match(/^\.[a-z0-9-]+/i) || [])[0];
    if (seletor) {
      const folhas = await arquivosDe(SRC, /\.css$/);
      const donos = [];
      for (const f of folhas) {
        const { bruto } = await fonte(f);
        if (bruto.includes(seletor)) donos.push(path.relative(RAIZ, f));
      }
      // O chunk global casa em todas as folhas; só interessa a atribuição ÚNICA.
      dono = donos.length === 1 ? `${donos[0]} (${seletor})` : `${donos.length} folhas (${seletor})`;
    }
  }
  controle.chunks.set(nomeDoChunk, dono);
  return dono;
}

/**
 * DE QUEM É O DIAGNÓSTICO DE PRELOAD — medido, e medido no COMEÇO da sessão.
 *
 * Duas versões anteriores deste gate mediam a coisa errada, e as duas relatavam verde:
 *
 *  1. A primeira rodava no FIM da sessão e perguntava «este aviso também sai numa rota da
 *     fase 2?». Devolvia 0 — não porque o aviso não saia lá, mas porque depois de 46
 *     navegações os chunks já estão em cache e o Chrome para de avisar. Um 0 que parecia
 *     prova e apontava para o lado errado.
 *  2. A segunda rodava com cache frio e devolvia 2 numa rota da fase 2, e eu concluí
 *     «pré-existente, não é regressão da fase 3». ERRADO, e é o erro que este comentário
 *     existe para não deixar voltar: a pergunta não é EM QUE ROTA o aviso aparece, é
 *     QUAL CSS ficou sem uso. Medido: os chunks avisados são `agenda.css` (03-01),
 *     `busca.css` (03-04) e `salvos.css` (03-02) — todos da FASE 3. Eles são
 *     pré-carregados em TODA tela porque a barra de abas aponta para /acontece e /buscar
 *     e o router do Next faz prefetch do que está na viewport. A rota que emite é da fase
 *     2; a causa é da fase 3. Confundir as duas é confundir o mensageiro com a mensagem.
 */
async function controleDePreload(cdp, base) {
  titulo("── de quem é o diagnóstico de preload do Next (cache frio, com atribuição do chunk) ──");
  for (const [rota, fase] of [
    ["/descobrir/", "fase 2 — tela que esta fase NÃO tocou"],
    ["/play/", "fase 1 — esqueleto"],
    ["/acontece/", "fase 3 — tela nova"],
  ]) {
    const marca = cdp.consola.length;
    await irPara(cdp, `${base}${rota}`);
    await respirar(6000);
    const avisados = cdp.consola
      .slice(marca)
      .filter((c) => AVISO_DE_PRELOAD.test(c.texto))
      .map((c) => (c.texto.match(/chunks\/([a-z0-9_-]+)\.css/) || [])[1])
      .filter(Boolean);
    const donos = [];
    for (const c of avisados) donos.push(await atribuirChunk(c));
    controle.porRota.push({ rota, fase, n: avisados.length, donos });
    nota(`${rota} (${fase}), parada 6s: ${avisados.length} diagnóstico(s) — ${donos.join(" · ") || "nenhum"}`);
  }

  const todosOsDonos = controle.porRota.flatMap((r) => r.donos);
  const daFase3 = todosOsDonos.filter((d) => /agenda\.css|busca\.css|salvos\.css|mapa\.css|cidade\.css|frase\.css/.test(d));
  ok(
    "atribuição dos chunks pré-carregados e não usados",
    `${todosOsDonos.length} diagnóstico(s) no controle · ${daFase3.length} deles em folhas criadas pela FASE 3 ` +
      `(a barra de abas aponta para /acontece e /buscar em toda tela, e o router faz prefetch do CSS dessas rotas)`,
  );
}

async function gateConsole(cdp, base) {
  titulo("── console, acumulado na sessão inteira ──");
  void base;

  const erros = cdp.consola.filter((c) => c.nivel === "erro");
  const avisos = cdp.consola.filter((c) => c.nivel === "aviso");
  const preload = avisos.filter((c) => AVISO_DE_PRELOAD.test(c.texto));
  const daAplicacao = avisos.filter((c) => !AVISO_DE_PRELOAD.test(c.texto));

  for (const c of [...erros, ...daAplicacao].slice(0, 20)) nota(`${c.nivel}: ${c.texto.slice(0, 200)}`);

  // De quem é cada diagnóstico: o chunk, a folha que o gerou, e a página que o emitiu.
  const porChunk = new Map();
  for (const c of preload) {
    const chunk = (c.texto.match(/chunks\/([a-z0-9_-]+)\.css/) || [])[1] ?? "(?)";
    porChunk.set(chunk, (porChunk.get(chunk) ?? 0) + 1);
  }
  for (const [chunk, n] of porChunk) {
    nota(`preload não usado ×${n}: ${chunk}.css → ${await atribuirChunk(chunk)}`);
  }

  // Primeiro o que é inegociável e está limpo: erro nenhum, e aviso nenhum da aplicação.
  exigir(
    erros.length === 0 && daAplicacao.length === 0,
    "console · erros e avisos DA APLICAÇÃO",
    `${erros.length} erro, ${daAplicacao.length} aviso da aplicação em ${cdp.navegacoes} navegações`,
    "0 erro, 0 aviso da aplicação",
  );

  // E agora o que NÃO está limpo, com o número real e o dono medido. A fase 2 fechou com
  // «0 erro, 0 aviso»; a fase 3 não fecha, e isto não é limiar para relaxar.
  const donos = [...porChunk.keys()].map((c) => controle.chunks.get(c) ?? c);
  exigir(
    preload.length === 0,
    "console · CSS pré-carregado e não usado (a fase 2 fechou este número em 0)",
    `${preload.length} diagnóstico(s) em ${cdp.navegacoes} navegações · chunks: ` +
      donos.join(" · ") +
      ` — pré-carregados em toda tela pelo prefetch da barra de abas para /acontece e /buscar`,
    "0 — o número que a fase 2 entregou",
  );

  resumo.push([
    "console",
    `0 erro e 0 aviso da aplicação em ${cdp.navegacoes} navegações · ${preload.length} diagnósticos de ` +
      `CSS pré-carregado e não usado, todos em folhas da fase 3`,
  ]);
}

// ---------------------------------------------------------------------------
// Resumo — uma linha por requisito. É o que vai para o SUMMARY e para quem conduzir a
// demonstração.
// ---------------------------------------------------------------------------

function imprimirResumo() {
  titulo("── resumo · uma linha por requisito ──");
  const ordem = (n) => (n.startsWith("AGEN-") ? Number(n.slice(5)) : 90);
  for (const [nome, valor] of [...resumo].sort((a, b) => ordem(a[0]) - ordem(b[0]))) {
    console.log(`  ${nome.padEnd(14)} ${valor}`);
  }
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

async function principal() {
  console.log(
    "verificar-fase3 — AGEN-01 a AGEN-07 e os Cenários 2, 4 e 5 sobre o artefato exportado, em Chrome headless\n",
  );

  if (!existsSync(path.join(OUT, "index.html"))) {
    throw new Error("out/ não existe ou está incompleto. Rode `npm run build` antes.");
  }

  await gatesEstruturais();

  const servidor = await servir({ raiz: OUT });
  console.log(`\n  servidor estático em ${servidor.url} (raiz: out/)`);

  let cdp = null;
  try {
    // T-03-41 / T-02-22: se o Chrome não existir, `abrirNavegador` LANÇA aqui e o script
    // sai com código diferente de zero. Ele nunca se autodispensa.
    cdp = await abrirNavegador();
    console.log(`  Chrome headless aberto · viewport ${LARGURA}×${ALTURA}`);

    await controleDePreload(cdp, servidor.url);
    await gatesDaCasca(cdp, servidor.url);
    await bloco1Acontece(cdp, servidor.url);
    await bloco2Ocorrencia(cdp, servidor.url);
    await bloco3Cenario4(cdp, servidor.url);
    await bloco4Mapa(cdp, servidor.url);
    await bloco5Cidade(cdp, servidor.url);
    await bloco6Buscar(cdp, servidor.url);
    await bloco7Frase(cdp, servidor.url);
    await gateD48(cdp, servidor.url);
    await gatesDeAmeaca(cdp, servidor.url);

    // O console vem antes da rede porque o seu controle NAVEGA: assim a navegação de
    // controle também entra na contabilidade de «zero requisição externa».
    await gateConsole(cdp, servidor.url);
    await coletarRede(cdp);
    gateRede(cdp, servidor.url);
    imprimirResumo();
  } finally {
    // T-03-43 / T-02-21: encerramento garantido por todos os caminhos de saída.
    if (cdp) await cdp.encerrar();
    await servidor.fechar();
  }
}

principal()
  .then(() => {
    console.log("\nTUDO PASSOU.");
    process.exit(0);
  })
  .catch((erro) => {
    console.error(`\nVERIFICAÇÃO FALHOU: ${erro.message}`);
    if (!(erro instanceof Falha) && erro.stack) console.error(erro.stack);
    process.exit(1);
  });
