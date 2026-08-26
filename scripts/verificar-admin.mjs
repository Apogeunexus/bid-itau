/**
 * verificar-admin.mjs — a suíte da superfície de Admin (funcionalidades 87 a 100, e a 169).
 *
 * O QUE ELA TRAVA, E POR QUE NENHUM DOS PORTÕES EXISTENTES TRAVA ISSO. `tsc` prova que o
 * código compila e `verificar-ds` prova que a folha usa token. Nenhum dos dois vê um botão
 * de apagar aparecendo numa tela de auditoria, um parâmetro exibido sem custo, ou uma
 * concessão de papel gravada sem autor. As regras desta sessão são de PRODUTO, e é aqui que
 * elas viram gate.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE ELA NÃO É DIRIGIDA POR NAVEGADOR, ao contrário das suítes de fase
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * As suítes das fases 2 a 5 abrem `out/` num Chrome e medem a página. Esta não: as seis
 * regras abaixo são sobre o CÓDIGO e sobre o DADO, e as duas coisas existem antes de
 * qualquer build. Amarrá-la ao artefato faria a única suíte que protege as regras desta
 * superfície depender de uma vez de build — e uma verificação que só roda quando há espaço
 * em disco e fila livre é uma verificação que não roda.
 *
 * A metade que precisa do dado real roda o módulo em `npx tsx -e`, o mesmo interpretador que
 * o resto do projeto usa para scripts em TypeScript. O que ela afirma sobre os números sai da
 * MESMA função que a página chama, não de uma releitura do `meta.json`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A ARMADILHA QUE ESTA SUÍTE EVITA DE PROPÓSITO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Nenhuma asserção aqui casa texto de interface montado em JSX. `Capítulos (` · `{n}` · `)`
 * são três nós de texto vizinhos, e uma verificação que procurasse a string inteira daria
 * falso negativo — ou, pior, passaria por acaso sobre uma tela quebrada. O que se mede aqui
 * é estrutura: elementos, atributos, e o valor que a função devolve.
 *
 * Rode com `node scripts/verificar-admin.mjs`.
 */

import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SRC = path.join(RAIZ, "src");

/**
 * Os verbos que uma tela desta superfície não pode oferecer. Não existe apagar: existe
 * suspender com rastro, e a diferença é o argumento da proposta inteira.
 *
 * SEM FRONTEIRA DE PALAVRA NO FIM, e isso não é descuido — foi medido. Com `\b` no fim, o
 * gate passava verde sobre `onClick={() => apagarRegistros()}` com o rótulo «Confirmar»:
 * depois de «apagar» vem «R», que é caractere de palavra, e a fronteira não casa. Era
 * exatamente a forma que o gate existe para pegar, e ela passava. A fronteira fica só no
 * começo, que é o que impede «suspender» de casar com «remover».
 */
const VERBOS_DESTRUTIVOS = /\b(apagar|apague|excluir|exclua|deletar|delete|remover|remova|limpar|limpe)/i;

let verdes = 0;
const falhas = [];

/**
 * O PISO de uma asserção de ausência.
 *
 * «Nenhum X» fica verde quando o conjunto varrido vira vazio — um prefixo renomeado, uma
 * pasta movida, um seletor que deixou de casar. O gate não quebra: ele para de medir e
 * continua reportando verde, que é o pior estado possível para uma verificação.
 *
 * Por isso toda ausência aqui declara sobre QUANTOS ela foi medida, e falha se o
 * denominador for zero. `nenhum X entre N` é verificação; `nenhum X` sozinho é uma frase.
 *
 * Esta função nasceu de uma auditoria das suítes das outras sessões — e a primeira coisa
 * que ela achou foi que três gates DESTE arquivo tinham o mesmo buraco.
 */
function piso(quantos, oQue) {
  return quantos > 0 ? null : `o conjunto varrido está VAZIO (${oQue}) — a ausência não foi medida`;
}

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    verdes += 1;
    console.log(`  ok   ${nome}: ${medida}`);
    return;
  }
  console.log(`  FALHA ${nome}: medido ${medida} · esperado ${esperado}`);
  falhas.push(nome);
}

/** Roda uma expressão contra os módulos de dados reais e devolve o JSON que ela imprimir. */
function medirNoModulo(expressao) {
  const saida = execFileSync("npx", ["tsx", "-e", expressao], {
    cwd: RAIZ,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const linha = saida.trim().split("\n").at(-1);
  return JSON.parse(linha);
}

/** Os arquivos de componente da superfície — `admin-*.tsx`, e nada além deles. */
async function componentesDoAdmin() {
  const dir = path.join(SRC, "componentes");
  const nomes = (await readdir(dir)).filter((n) => n.startsWith("admin-") && n.endsWith(".tsx"));
  return Promise.all(
    nomes.map(async (n) => ({ nome: n, fonte: await readFile(path.join(dir, n), "utf8") })),
  );
}

/** As páginas de rota da superfície. */
async function paginasDoAdmin() {
  const dir = path.join(SRC, "app", "(bastidor)", "admin");
  const saida = [];
  for (const e of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile() && e.name === "page.tsx") {
      const caminho = path.join(e.parentPath, e.name);
      saida.push({ nome: path.relative(dir, caminho), fonte: await readFile(caminho, "utf8") });
    }
  }
  return saida;
}

/**
 * Cada elemento `<button>` do arquivo, inteiro — atributos e rótulo.
 *
 * CASA O ELEMENTO, E NÃO A FONTE INTEIRA. «Não há como remover um limite daqui» é prosa que a
 * tela precisa dizer, e proibir a palavra no arquivo proibiria a própria declaração de que a
 * ação não existe. Dentro do botão vale o contrário: ali a palavra é oferta.
 *
 * O elemento inteiro, e não só o rótulo, porque o verbo destrutivo aparece nos dois lugares —
 * `onClick={() => apagarTudo()}` com o rótulo «Confirmar» é exatamente a forma que passaria
 * por um gate que só lesse o texto visível.
 */
function botoesDe(fonte) {
  return [...fonte.matchAll(/<button\b[\s\S]*?<\/button>/g)].map((m) => m[0]);
}

/** Só o rótulo, para a mensagem de falha dizer qual botão é sem despejar o JSX inteiro. */
function rotuloDe(botao) {
  const m = botao.match(/>\s*([^<>{}]{2,60}?)\s*</);
  return m ? m[1].trim() : botao.slice(0, 50).replace(/\s+/g, " ");
}

console.log("\nverificar-admin — as regras da superfície de governança");

// ---- 1. Todo parâmetro exibido tem custo medido OU declaração de não-medido ----
{
  const parametros = medirNoModulo(
    'import { parametrosDoMotor } from "./src/dados/admin";' +
      "console.log(JSON.stringify(parametrosDoMotor()));",
  );
  const semCusto = parametros.filter((p) => {
    if (!p.custo) return true;
    if (p.custo.medido === true) {
      return !p.custo.alternativo || !p.custo.oQueCustaria || !p.custo.oQueGanharia;
    }
    if (p.custo.medido === false) return !p.custo.porQueNaoFoiMedido;
    return true;
  });
  const medidos = parametros.filter((p) => p.custo?.medido === true).length;
  exigir(
    parametros.length > 0 && semCusto.length === 0,
    "todo parâmetro do motor traz custo medido ou a declaração de que não foi medido",
    semCusto.length === 0
      ? `${parametros.length} parâmetros · ${medidos} com alternativo medido · ${parametros.length - medidos} declarando não-medição`
      : semCusto.map((p) => p.id).join(", "),
    "0 sem custo",
  );
}

// ---- 2. Nenhuma tela do Admin oferece apagar ----
{
  const componentes = await componentesDoAdmin();
  const paginas = await paginasDoAdmin();
  const arquivos = [...componentes, ...paginas];
  const hits = [];
  for (const { nome, fonte } of arquivos) {
    for (const botao of botoesDe(fonte)) {
      if (VERBOS_DESTRUTIVOS.test(botao)) hits.push(`${nome}: «${rotuloDe(botao)}»`);
    }
  }
  // O PISO É POR FONTE, e não sobre a união — medido com o defeito injetado. Renomeando só
  // o prefixo dos componentes, o conjunto de componentes ia a zero e as dez páginas
  // sustentavam o piso da união sozinhas: o gate seguia verde afirmando sobre um conjunto
  // que tinha deixado de ser varrido. Duas fontes, dois pisos.
  const vazio =
    piso(componentes.length, "componentes admin-*") ??
    piso(paginas.length, "páginas de (bastidor)/admin");
  exigir(
    !vazio && hits.length === 0,
    "nenhuma tela do Admin oferece apagar (existe suspender, com rastro)",
    vazio ?? (hits.length === 0 ? `0 verbos destrutivos em ${arquivos.length} arquivos` : hits.join(" | ")),
    "0 verbos, sobre pelo menos 1 arquivo",
  );
}

// ---- 3. A trilha de auditoria não tem NENHUMA ação de escrita ----
{
  const auditoria = (await componentesDoAdmin()).find((c) => c.nome === "admin-auditoria.tsx");
  const problemas = [];
  if (!auditoria) {
    problemas.push("admin-auditoria.tsx não existe — a trilha é a tela que não se corta");
  } else {
    if (/localStorage\.setItem|localStorage\.removeItem|localStorage\.clear/.test(auditoria.fonte)) {
      problemas.push("escreve no armazenamento");
    }
    if (/<form\b/.test(auditoria.fonte)) problemas.push("tem formulário");
    if (/<input\b|<textarea\b|<select\b/.test(auditoria.fonte)) problemas.push("tem campo de entrada");
    // Os botões que ela pode ter são os do filtro, e o filtro só chama `setFiltro`.
    const acoes = [...auditoria.fonte.matchAll(/onClick=\{\(\) => (\w+)\(/g)].map((m) => m[1]);
    const forasteiras = acoes.filter((a) => a !== "setFiltro");
    if (forasteiras.length) problemas.push(`chama ${forasteiras.join(", ")} num clique`);
  }
  exigir(
    problemas.length === 0,
    "a trilha de auditoria não tem ação de escrita — o administrador lê e não apaga",
    problemas.length === 0 ? "0 escrita, 0 formulário, 0 campo; o único clique muda o filtro" : problemas.join(" · "),
    "0",
  );
}

// ---- 4. Toda escrita do Admin grava autor, carimbo e motivo ----
{
  const resultado = medirNoModulo(
    'import { eventosValidos } from "./src/dados/admin";' +
      "const completo = { tipo: 'papel', pessoa: 'x', papel: 'Moderador', territorio: '', classe: '', fila: '', procedenciaAutorizada: 'curador', motivo: 'porque sim', autor: 'a', carimbo: 'c' };" +
      "const semAutor = { ...completo, autor: undefined };" +
      "const semCarimbo = { ...completo, carimbo: undefined };" +
      "const semMotivo = { ...completo, motivo: undefined };" +
      "const semEscopo = { ...completo, territorio: undefined };" +
      "console.log(JSON.stringify({" +
      "  aceitaCompleto: eventosValidos([completo]).length," +
      "  recusaSemAutor: eventosValidos([semAutor]).length," +
      "  recusaSemCarimbo: eventosValidos([semCarimbo]).length," +
      "  recusaSemMotivo: eventosValidos([semMotivo]).length," +
      "  recusaSemEscopo: eventosValidos([semEscopo]).length," +
      "}));",
  );
  const ok =
    resultado.aceitaCompleto === 1 &&
    resultado.recusaSemAutor === 0 &&
    resultado.recusaSemCarimbo === 0 &&
    resultado.recusaSemMotivo === 0 &&
    resultado.recusaSemEscopo === 0;
  exigir(
    ok,
    "concessão de papel sem autor, carimbo, motivo ou escopo é RECUSADA pela trilha",
    JSON.stringify(resultado),
    "aceita 1 completo e recusa os quatro incompletos",
  );
}

// ---- 5. `coordenada.procedencia` continua sendo sempre `derivado` ----
{
  const tipos = await readFile(path.join(SRC, "dados", "tipos.ts"), "utf8");
  const declaracao = /interface Coordenada \{[\s\S]*?procedencia:\s*"derivado";[\s\S]*?\}/.test(tipos);

  // E nenhuma tela do Admin escreve procedência de coordenada — ela edita a TABELA.
  const arquivos = await componentesDoAdmin();
  const escrevem = arquivos
    .filter(({ fonte }) => /coordenada[\s\S]{0,60}procedencia\s*[:=]/.test(fonte))
    .map((a) => a.nome);

  const vazio = piso(arquivos.length, "componentes admin-*");
  exigir(
    declaracao && !vazio && escrevem.length === 0,
    "coordenada.procedencia é o literal «derivado» no tipo, e nenhuma tela do Admin a escreve",
    !declaracao
      ? "o literal saiu de tipos.ts"
      : (vazio ??
        (escrevem.length === 0
          ? `o tipo recusa outro valor; ${arquivos.length} telas varridas, nenhuma escreve coordenada`
          : `escrita em ${escrevem.join(", ")}`)),
    "o literal no tipo e 0 escritas, sobre pelo menos 1 tela",
  );
}

// ---- 6. A conferência de três pontas fecha, e a cobertura bate com meta.json ----
{
  const obs = medirNoModulo(
    'import { observabilidadeDoAdmin } from "./src/dados/admin";' +
      "import meta from './src/dados/gerado/meta.json' with { type: 'json' };" +
      "const o = observabilidadeDoAdmin();" +
      "console.log(JSON.stringify({" +
      "  fecha: o.conferencia.fecha," +
      "  divergencias: o.conferencia.divergencias," +
      "  nos: o.totalDeNos, arestas: o.totalDeArestas," +
      "  metaNos: meta.totais.entidades, metaArestas: meta.totais.arestas," +
      "  semDenominador: o.coberturas.filter((c) => !c.de).length," +
      "}));",
  );
  const ok =
    obs.nos > 0 &&
    obs.arestas > 0 &&
    obs.fecha &&
    obs.divergencias.length === 0 &&
    obs.nos === obs.metaNos &&
    obs.arestas === obs.metaArestas &&
    obs.semDenominador === 0;
  exigir(
    ok,
    "a conferência de três pontas fecha e toda cobertura exibida tem denominador",
    ok
      ? `${obs.nos} nós e ${obs.arestas} ligações conferidos · 0 divergências · 0 coberturas sem denominador`
      : JSON.stringify(obs),
    "fecha, sem divergência, sem cobertura solta",
  );
}

// ---- 7. Nenhum componente do Admin importa o módulo de dados por VALOR indevido ----
//
// DP-F: `admin.ts` alcança o grafo por `geo.ts` e por `duplicatas.ts`. Um `"use client"` que
// chamasse uma das funções de travessia arrastaria o acervo para o navegador. As constantes
// e a validação do formulário viajam — elas são primitivo e função pura; as funções que
// varrem o grafo, não.
{
  const travessia = [
    "parametrosDoMotor",
    "concentradores",
    "territoriosDoAdmin",
    "observabilidadeDoAdmin",
    "matrizDeAutoria",
    "procedenciasDoModelo",
    "vocabularioDoAdmin",
    "medidasDaModeracao",
    "tiposDeTitular",
  ];
  const hits = [];
  let clientes = 0;
  for (const { nome, fonte } of await componentesDoAdmin()) {
    if (!/^"use client";/m.test(fonte)) continue;
    clientes += 1;
    for (const f of travessia) {
      if (new RegExp(`\\b${f}\\s*\\(`).test(fonte)) hits.push(`${nome}: ${f}()`);
    }
  }
  const vazio = piso(clientes, "componentes admin-* marcados «use client»");
  exigir(
    !vazio && hits.length === 0,
    "nenhum componente de cliente chama função que atravessa o grafo (DP-F)",
    vazio ?? (hits.length === 0 ? `0 chamadas de travessia em ${clientes} componentes de cliente` : hits.join(" | ")),
    "0 chamadas, sobre pelo menos 1 componente de cliente",
  );
}

// ---- 8. As dez telas da superfície existem ----
//
// Sob `output: "export"` uma rota que ninguém escreveu não dá 404 no desenvolvimento: ela
// simplesmente não sai no artefato, e o sintoma aparece na frente de quem avalia.
{
  const esperadas = [
    "papeis",
    "motor",
    "territorio",
    "vocabulario",
    "ia",
    "observabilidade",
    "auditoria",
    "titulares",
    "governanca",
    "moderacao",
  ];
  const paginas = (await paginasDoAdmin()).map((p) => p.nome.replace(/[\\/]page\.tsx$/, ""));
  const faltando = esperadas.filter((e) => !paginas.includes(e));
  exigir(
    faltando.length === 0,
    "as dez telas do Admin existem como rota",
    faltando.length === 0 ? `${paginas.length} rotas: ${paginas.sort().join(", ")}` : `faltam ${faltando.join(", ")}`,
    "10 rotas",
  );
}

console.log(
  falhas.length === 0
    ? `\n  ${verdes} gates verdes, 0 falhas.\n`
    : `\n  ${verdes} verdes · ${falhas.length} FALHA(S): ${falhas.join(" · ")}\n`,
);
process.exitCode = falhas.length === 0 ? 0 : 1;
