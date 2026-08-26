/**
 * VERIFICAÇÃO DA SUPERFÍCIE DO GESTOR — S2 · Observatório (funcionalidades 101 a 107 e 169).
 *
 * O PORTÃO CENTRAL DESTA SUÍTE É O PRIMEIRO: nenhuma tela desta superfície tem ação de
 * escrita. É a definição do nível de acesso, e não uma preferência — quem prova impacto não
 * pode ser quem produz o dado que prova, ou o indicador vira autorreferência e a proposta
 * perde o argumento inteiro. Uma tela do Observatório que ganhasse um formulário passaria
 * despercebida em `tsc` e em `verificar-ds`, e este arquivo existe por causa disso.
 *
 * DUAS PARTES, E A SEGUNDA É OPCIONAL POR NECESSIDADE:
 *
 *  - a ESTÁTICA lê o código-fonte e roda o módulo de dados por `tsx`. Não precisa de build,
 *    não precisa de navegador, e é a que roda sempre;
 *  - a de NAVEGADOR mede o que só existe depois de desenhado — denominador com altura,
 *    troca de público sem trocar de URL, nada transbordando. Ela precisa de um servidor, e
 *    por isso só roda quando `BASE` é passada no ambiente:
 *
 *        BASE=http://localhost:3002 node scripts/verificar-gestor.mjs
 *
 *    Sem `BASE`, a suíte DECLARA que não mediu em vez de passar em silêncio. Um portão que
 *    fica verde porque não rodou é pior do que um portão vermelho.
 *
 * NENHUM NÚMERO ESPERADO É LITERAL AQUI. Os valores vêm do próprio módulo, e o que esta
 * suíte confere são INVARIANTES — «não sustentado implica valor nulo», «os quatro públicos
 * trazem o mesmo conjunto» —, nunca «este indicador vale 4.826». Uma suíte que congelasse o
 * número quebraria na próxima geração do grafo sem que nada estivesse errado, e o hábito de
 * afrouxar suíte que quebra à toa é como um portão deixa de valer.
 */

import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const COMPONENTES = path.join(RAIZ, "src", "componentes");
const ROTAS = path.join(RAIZ, "src", "app", "(bastidor)", "observatorio");

/**
 * A ÚNICA escrita que esta superfície pode fazer, e ela não toca a ontologia: a escolha de
 * público de quem está olhando, no navegador de quem está olhando. Qualquer outra chamada de
 * escrita na camada de tela é violação do nível de acesso.
 */
const CHAVE_AUTORIZADA = "agenda-cultural:observatorio-publico";

/**
 * Números que podem aparecer na camada de tela porque não afirmam nada sobre o acervo.
 * `100` é conversão para por cento; os outros são aritmética de posição e de teto declarado.
 * Qualquer outro literal de 3+ dígitos na tela é um número do acervo digitado à mão — e um
 * número copiado à mão mente em silêncio na primeira regeração do grafo.
 */
const LITERAIS_PERMITIDOS = new Set(["0", "1", "2", "3", "4", "8", "12", "100"]);

let verdes = 0;
const falhas = [];
const naoMedidos = [];

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    verdes += 1;
    console.log(`  ok   ${nome}: ${medida}`);
    return;
  }
  console.log(`  FALHA ${nome}: medido ${medida} · esperado ${esperado}`);
  falhas.push(nome);
}

function naoMedido(nome, porque) {
  console.log(`  ----  ${nome}: NÃO MEDIDO — ${porque}`);
  naoMedidos.push(nome);
}

/** Tira comentário de bloco e de linha antes de procurar literal — comentário explica, não afirma. */
function semComentarios(fonte) {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

async function arquivosDaSuperficie() {
  const nomes = await readdir(COMPONENTES);
  const componentes = nomes
    .filter((n) => n.startsWith("observatorio") && n.endsWith(".tsx"))
    .map((n) => path.join(COMPONENTES, n));

  const paginas = [];
  async function varrer(dir) {
    for (const entrada of await readdir(dir, { withFileTypes: true })) {
      const alvo = path.join(dir, entrada.name);
      if (entrada.isDirectory()) await varrer(alvo);
      else if (entrada.name.endsWith(".tsx")) paginas.push(alvo);
    }
  }
  await varrer(ROTAS);
  return { componentes, paginas, todos: [...componentes, ...paginas] };
}

console.log("\n── S2 · Observatório — a superfície que não escreve ──\n");

const { componentes, paginas, todos } = await arquivosDaSuperficie();
const fontes = new Map();
for (const arquivo of todos) fontes.set(arquivo, await readFile(arquivo, "utf8"));

// ---------------------------------------------------------------------------
// 1. O PORTÃO CENTRAL — nenhuma ação de escrita
// ---------------------------------------------------------------------------

const ESCRITAS_PROIBIDAS = [
  [/<form[\s>]/, "elemento <form>"],
  [/onSubmit\s*=/, "onSubmit"],
  [/\bfetch\s*\(/, "fetch()"],
  [/XMLHttpRequest/, "XMLHttpRequest"],
  [/navigator\.sendBeacon/, "sendBeacon"],
  [/\bformAction\b/, "formAction"],
  [/"use server"/, "diretiva use server"],
];

const violacoes = [];
for (const [arquivo, fonte] of fontes) {
  const limpo = semComentarios(fonte);
  for (const [padrao, nome] of ESCRITAS_PROIBIDAS) {
    if (padrao.test(limpo)) violacoes.push(`${path.basename(arquivo)}: ${nome}`);
  }
  for (const chamada of limpo.matchAll(/localStorage\.(setItem|removeItem|clear)\s*\(\s*([^,)]*)/g)) {
    const alvo = (chamada[2] ?? "").trim();
    const autorizada = alvo.includes("CHAVE_DO_PUBLICO") || alvo.includes(CHAVE_AUTORIZADA);
    if (!autorizada) {
      violacoes.push(`${path.basename(arquivo)}: localStorage.${chamada[1]}(${alvo})`);
    }
  }
}
exigir(
  violacoes.length === 0,
  "o portão central · nenhuma tela da superfície tem ação de escrita",
  violacoes.length === 0
    ? `${todos.length} arquivos varridos, 0 violações — a única escrita autorizada é «${CHAVE_AUTORIZADA}», que é preferência de quem olha e não toca a ontologia`
    : violacoes.join(" · "),
  "0 violações",
);

// ---------------------------------------------------------------------------
// 2. Nenhum literal de número na camada de tela
// ---------------------------------------------------------------------------

const literais = [];
for (const [arquivo, fonte] of fontes) {
  const limpo = semComentarios(fonte);
  // A borda exige que o dígito não esteja colado a letra nem a hífen: `data-par-d90`
  // e `obs-par-d90` são NOMES, não números do acervo, e um gate que os acusasse seria um
  // gate que alguém desliga na terceira vez.
  for (const achado of limpo.matchAll(/(?<![\w-])\d[\d.]*(?![\w-])/g)) {
    const bruto = achado[0];
    if (LITERAIS_PERMITIDOS.has(bruto)) continue;
    // Versão de dependência ou fração de CSS não chegam aqui; o que sobra é número do acervo.
    literais.push(`${path.basename(arquivo)}: ${bruto}`);
  }
}
exigir(
  literais.length === 0,
  "nenhum literal de número na camada de tela",
  literais.length === 0
    ? `${todos.length} arquivos varridos · permitidos por nome: ${[...LITERAIS_PERMITIDOS].join(", ")}`
    : literais.slice(0, 8).join(" · "),
  "0 literais",
);

// ---------------------------------------------------------------------------
// 3. A G8 não expõe nome de moderador
// ---------------------------------------------------------------------------

const g8 = fontes.get(path.join(COMPONENTES, "observatorio-moderacao.tsx")) ?? "";
const paginaG8 = fontes.get(path.join(ROTAS, "moderacao", "page.tsx")) ?? "";
const vazamentos = [];
for (const [fonte, onde] of [
  [g8, "observatorio-moderacao.tsx"],
  [paginaG8, "moderacao/page.tsx"],
]) {
  const limpo = semComentarios(fonte);
  // O `\b` FINAL É O DEFEITO QUE ESTE COMENTÁRIO EXISTE PARA NÃO DEIXAR VOLTAR. Num teste de
  // AUSÊNCIA, `\b` no fim do padrão faz o gate ficar verde sobre o vazamento: em
  // `/\bautor\b/`, depois de «autor» vem «D» de `autorDaDecisao`, que é caractere de palavra,
  // a fronteira não casa e o padrão não dispara. Medido antes do conserto: `autor:` pegava,
  // `autorDaDecisao:` e `autorId:` passavam. Num gate de FORMA isso custa um defeito visual;
  // num gate de PRIVACIDADE custa o nome de um moderador numa tela que existe para não
  // expor nome de moderador. O sufixo aberto `[A-Za-z]*` é o que fecha a porta.
  for (const padrao of [
    /MODERADOR_AUTORADO/,
    /MODERADOR_E_AUTORADO/,
    /\bquem[A-Za-z]*\s*:/,
    /\bautor[A-Za-z]*\s*[:.]/,
    /\bmoderador[A-Za-z]*\s*[:.]/,
  ]) {
    if (padrao.test(limpo)) vazamentos.push(`${onde}: ${padrao}`);
  }
}
exigir(
  vazamentos.length === 0,
  "a G8 não expõe nome de moderador",
  vazamentos.length === 0
    ? "nem o componente nem a página importam identidade de moderador — o DTO não tem campo para isso"
    : vazamentos.join(" · "),
  "0 vazamentos",
);

// ---------------------------------------------------------------------------
// 4. As invariantes do MÓDULO, rodadas de verdade
// ---------------------------------------------------------------------------

const SONDA = `
import { indicadores, PUBLICOS, montarImpacto, montarProduto, montarProcedencia,
  ausenciasDeclaradas, montarLeituraDaModeracao, montarTerritorio, montarDadosAbertos,
  montarObservatorio, TELAS, TETO_DO_DTO } from "./src/dados/observatorio.ts";

const problemas = [];
const todos = [
  ...indicadores(),
  ...montarProduto().medidos, ...montarProduto().semLastro,
  ...montarLeituraDaModeracao().semLastro,
  ...(montarImpacto().zeroMedido ? [montarImpacto().zeroMedido] : []),
];

for (const i of todos) {
  if (!i.sustentado && i.valor !== null) problemas.push(\`\${i.id}: sustentado false com valor \${i.valor}\`);
  if (i.sustentado && i.valor === null) problemas.push(\`\${i.id}: sustentado true com valor nulo\`);
  if (!i.sustentado && !i.declaracao) problemas.push(\`\${i.id}: sem lastro e sem declaração\`);
  if (!i.procedenciaDoNumero) problemas.push(\`\${i.id}: sem origem do número\`);
  if (!i.denominador || typeof i.denominador.n !== "number" || !i.denominador.do_que)
    problemas.push(\`\${i.id}: sem denominador nomeado\`);
}

const conjuntos = new Set(PUBLICOS.map((p) => [...p.ordem].sort().join(",")));
const ordens = new Set(PUBLICOS.map((p) => p.ordem.join(">")));
if (conjuntos.size !== 1) problemas.push("os públicos não trazem o mesmo CONJUNTO de indicadores");
if (ordens.size !== PUBLICOS.length) problemas.push("dois públicos trazem a MESMA ordem — o recorte não recorta");

const recortes = {
  "visao-geral": { dados: montarObservatorio(), telas: TELAS },
  impacto: { dados: montarImpacto(), telas: TELAS },
  procedencia: { dados: montarProcedencia(), telas: TELAS },
  ausencia: { ausencias: ausenciasDeclaradas(), telas: TELAS },
  territorio: { dados: montarTerritorio(), telas: TELAS },
  produto: { dados: montarProduto(), telas: TELAS },
  dados: { dados: montarDadosAbertos(), telas: TELAS },
  moderacao: { dados: montarLeituraDaModeracao(), telas: TELAS },
};
const tamanhos = {};
for (const [tela, dto] of Object.entries(recortes)) {
  const bytes = JSON.stringify(dto).length;
  tamanhos[tela] = bytes;
  if (bytes > TETO_DO_DTO) problemas.push(\`DTO de \${tela}: \${bytes} acima do teto \${TETO_DO_DTO}\`);
}

const semDono = ausenciasDeclaradas().filter((a) => !a.nivelQuePreenche || !a.projecao);
if (semDono.length) problemas.push(\`ausências sem dono ou sem projeção: \${semDono.map((a) => a.id).join(", ")}\`);

const moderacao = montarLeituraDaModeracao();
const serializada = JSON.stringify(moderacao);
// Mesmo defeito, mesma correção: sem o sufixo aberto, uma chave \`quemDecidiu\` serializa
// como "quemDecidiu": e escapa de /"quem"\\s*:/ sem que o gate note.
if (/"(quem|autor|moderador)[A-Za-z]*"\\s*:/.test(serializada)) problemas.push("o DTO da G8 carrega identidade de moderador");

console.log(JSON.stringify({
  problemas,
  indicadores: todos.length,
  semLastro: todos.filter((i) => !i.sustentado).length,
  publicos: PUBLICOS.length,
  ausencias: ausenciasDeclaradas().length,
  telas: TELAS.length,
  tamanhos,
  teto: TETO_DO_DTO,
}));
`;

const execucao = spawnSync("npx", ["tsx", "--eval", SONDA], {
  cwd: RAIZ,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});

let sonda = null;
if (execucao.status !== 0) {
  const erro = (execucao.stderr || execucao.stdout || "").trim().split("\n").slice(-3).join(" · ");
  exigir(false, "o módulo carrega e as invariantes valem", `tsx saiu com ${execucao.status}: ${erro}`, "saída 0");
} else {
  const linha = (execucao.stdout || "").trim().split("\n").at(-1) ?? "{}";
  sonda = JSON.parse(linha);
  exigir(
    sonda.problemas.length === 0,
    "as invariantes do módulo · D-90, recorte e teto do DTO",
    sonda.problemas.length === 0
      ? `${sonda.indicadores} indicadores conferidos (${sonda.semLastro} sem lastro, todos com declaração) · ` +
        `${sonda.publicos} públicos com o mesmo conjunto em ${sonda.publicos} ordens distintas · ` +
        `${sonda.ausencias} ausências com dono e projeção`
      : sonda.problemas.join(" · "),
    "0 problemas",
  );

  const acima = Object.entries(sonda.tamanhos).filter(([, b]) => b > sonda.teto);
  exigir(
    acima.length === 0,
    `o teto do DTO em cada uma das ${sonda.telas} telas`,
    Object.entries(sonda.tamanhos)
      .sort((a, b) => b[1] - a[1])
      .map(([tela, bytes]) => `${tela} ${bytes}`)
      .join(" · ") + ` · teto ${sonda.teto}`,
    `todas abaixo de ${sonda.teto}`,
  );
}

// ---------------------------------------------------------------------------
// 5. A parte de navegador — só com BASE, e declarada quando não roda
// ---------------------------------------------------------------------------

const BASE = process.env.BASE;
if (!BASE) {
  naoMedido(
    "denominador com altura, troca de público sem trocar de URL, nada transbordando",
    "precisa de servidor: rode `BASE=http://localhost:3002 node scripts/verificar-gestor.mjs` com o dev de pé",
  );
} else {
  const { abrirNavegador } = await import("./navegador.mjs");
  const cdp = await abrirNavegador();
  try {
    await cdp.navegar(`${BASE}/observatorio/`);
    await cdp.avaliar(`localStorage.setItem("agenda-cultural:visao", "web")`);
    await cdp.recarregar();
    await cdp.avaliar(
      `new Promise((r) => { const t = () => document.querySelector('[data-hidratado="sim"]') ? r(1) : setTimeout(t, 50); t(); })`,
    );

    const publicos = await cdp.avaliar(`(async () => {
      const urls = [], ordens = [];
      for (const b of Array.from(document.querySelectorAll('[data-publico]'))) {
        b.click();
        await new Promise((r) => setTimeout(r, 350));
        urls.push(location.pathname);
        ordens.push(Array.from(document.querySelectorAll('[data-indicador]')).map((e) => e.getAttribute('data-indicador')).join('>'));
      }
      const semAltura = Array.from(document.querySelectorAll('[data-denominador]'))
        .filter((d) => d.getBoundingClientRect().height <= 0).length;
      return {
        urls: [...new Set(urls)],
        ordens: [...new Set(ordens)],
        conjuntos: [...new Set(ordens.map((o) => o.split('>').sort().join(',')))],
        denominadores: document.querySelectorAll('[data-denominador]').length,
        semAltura,
        transborda: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    })()`);

    exigir(
      publicos.urls.length === 1 && publicos.conjuntos.length === 1 && publicos.ordens.length > 1,
      "trocar de público reordena, não remove, e não muda a URL",
      `${publicos.urls.length} URL distinta (${publicos.urls[0]}) · ${publicos.ordens.length} ordens · ${publicos.conjuntos.length} conjunto`,
      "1 URL, 1 conjunto, mais de uma ordem",
    );
    exigir(
      publicos.semAltura === 0 && publicos.denominadores > 0 && !publicos.transborda,
      "todo denominador tem altura, e nada transborda na horizontal",
      `${publicos.denominadores} denominadores, ${publicos.semAltura} sem altura · transborda=${publicos.transborda}`,
      "todos com altura, nada transbordando",
    );

    for (const tela of ["impacto", "procedencia", "ausencia", "territorio", "produto", "dados", "moderacao"]) {
      await cdp.navegar(`${BASE}/observatorio/${tela}/`);
      await cdp.avaliar(
        `new Promise((r) => { const t = () => document.querySelector('[data-hidratado="sim"]') ? r(1) : setTimeout(t, 50); t(); })`,
      );
      const medida = await cdp.avaliar(`({
        navegacao: document.querySelectorAll('[data-tela-do-observatorio]').length,
        semAltura: Array.from(document.querySelectorAll('[data-denominador]'))
          .filter((d) => d.getBoundingClientRect().height <= 0).length,
        transborda: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      })`);
      exigir(
        medida.navegacao === (sonda?.telas ?? 8) && medida.semAltura === 0 && !medida.transborda,
        `/observatorio/${tela}/ desenha, navega e não transborda`,
        `${medida.navegacao} telas na navegação · ${medida.semAltura} denominadores sem altura · transborda=${medida.transborda}`,
        `${sonda?.telas ?? 8} telas, 0 sem altura, nada transbordando`,
      );
    }
  } finally {
    await cdp.encerrar();
  }
}

console.log(
  `\n  ${verdes} verdes · ${falhas.length} FALHA(S)${falhas.length ? `: ${falhas.join(" · ")}` : ""}` +
    `${naoMedidos.length ? ` · ${naoMedidos.length} NÃO MEDIDO(S): ${naoMedidos.join(" · ")}` : ""}\n`,
);

process.exit(falhas.length ? 1 : 0);
