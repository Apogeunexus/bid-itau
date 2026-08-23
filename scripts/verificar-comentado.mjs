/**
 * verificar-comentado.mjs — a verificação do modo comentado, dirigida por navegador.
 *
 * O QUE ELE MEDE, E POR QUE ESTAS MEDIDAS. O interruptor tem quatro promessas, e três delas
 * são fáceis de afirmar e caras de errar:
 *
 *   1. o atributo troca e SOBREVIVE A RECARREGAR — sem isso o modo é um estado de tela que
 *      some no primeiro F5, e a banca perderia a anotação no meio da apresentação;
 *   2. desligado, cada bloco de comentário tem ALTURA ZERO — não basta ficar transparente:
 *      comentário que continua no fluxo deixa a tela furada exatamente onde o texto saiu;
 *   3. o selo de motivo e os rótulos de procedência continuam VISÍVEIS NOS DOIS ESTADOS —
 *      é a metade que importa. Esconder o argumento junto com o comentário sobre ele
 *      esvaziaria a tela que o interruptor existe para salvar;
 *   4. a tela não fica com BURACO onde o comentário estava — medido como a diferença de
 *      altura do conteúdo, que tem de bater com a soma das alturas que sumiram.
 *
 * Roda sobre `out/` — o artefato exportado, servido estaticamente — no MESMO Chrome
 * headless e no MESMO viewport de 1440×960 da verificação da fase 2, pelo cliente CDP
 * compartilhado de `navegador.mjs`. Medir em outro viewport mediria outra coisa.
 *
 * NÃO SE PULA. Chrome ausente FALHA o script, como na fase 2: verificação que se
 * autodispensa produz relatório verde sobre nada.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { servir } from "./servir-out.mjs";
import { abrirNavegador, naPagina, LARGURA_PADRAO, ALTURA_PADRAO } from "./navegador.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const OUT = path.join(RAIZ, "out");

/** Onde as fotos vão. Sobrescrevível para a verificação rodar fora do diretório padrão. */
const FOTOS = process.env.FOTOS_COMENTADO ?? path.join(RAIZ, "capturas");

/**
 * As rotas medidas, e por que estas quatro.
 *
 * As duas primeiras são as que a migração mais mexeu. As duas últimas estão aqui por um
 * motivo diferente e mais importante: em Descobrir e em Meu Repertório os seletores de
 * PROCEDÊNCIA e de ACESSIBILIDADE não existem, então o gate «o argumento sobrevive» passaria
 * neles por vacuidade — 0 igual a 0. A trilha traz os três rótulos `autorado` de D-37, e o
 * evento rico traz as 8 dimensões de D-43 em dois estados distintos («declarado ausente»
 * contra «declarado»). São exatamente as frases que o modo comentado NÃO pode tocar, e é
 * nestas duas páginas que a afirmação deixa de ser vazia.
 *
 * `minimoComentarios: 0` diz que a rota está na lista para provar o que NÃO some. O evento
 * não recebeu comentário nenhum na migração, e exigir dele um bloco seria exigir que se
 * inventasse um.
 */
const ROTAS = [
  { nome: "descobrir", rota: "/descobrir/", minimoComentarios: 2 },
  { nome: "meu", rota: "/meu/", minimoComentarios: 2 },
  { nome: "trilha", rota: "/trilha/do-rap-ao-teatro-documentario/", minimoComentarios: 2 },
  {
    nome: "evento",
    rota: "/evento/artistas-do-vestir-uma-costura-dos-afetos-a-moda-chega-ao-itau-cultural/",
    minimoComentarios: 0,
  },
];

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

let falhas = 0;
const resumo = [];

class Falha extends Error {}

function ok(nome, medida) {
  console.log(`  ok   ${nome}: ${medida}`);
}

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

// ---------------------------------------------------------------------------
// Leituras dentro da página
// ---------------------------------------------------------------------------

/** O atributo, lido do MESMO elemento que carrega `data-view`. */
const LER_ATRIBUTOS = `(() => {
  const raiz = document.querySelector('[data-view]');
  return {
    view: raiz ? raiz.getAttribute('data-view') : null,
    comentado: raiz ? raiz.getAttribute('data-comentado') : null,
    mesmoElemento: !!raiz && raiz.hasAttribute('data-comentado'),
    botao: document.querySelector('[data-comentado-alternar]')?.getAttribute('aria-pressed') ?? 'ausente',
  };
})()`;

/**
 * Cada bloco de comentário, com a ALTURA e a LARGURA que ele ocupa de fato.
 *
 * `getBoundingClientRect` e não `offsetHeight`: o retângulo é o que o layout reservou, e é
 * ele que decide se sobrou buraco. Um elemento com `visibility: hidden` devolveria altura
 * cheia aqui — que é exatamente o defeito que esta medição existe para pegar.
 */
const LER_COMENTARIOS = naPagina(`
  const cs = todos('[data-comentario]');
  return {
    total: cs.length,
    visiveis: cs.filter(visivel).length,
    alturaTotal: cs.reduce((s, c) => s + c.getBoundingClientRect().height, 0),
    maiorAltura: cs.reduce((m, c) => Math.max(m, c.getBoundingClientRect().height), 0),
    comAltura: cs.filter((c) => c.getBoundingClientRect().height > 0).length,
    comLargura: cs.filter((c) => c.getBoundingClientRect().width > 0).length,
    displayNone: cs.filter((c) => getComputedStyle(c).display === 'none').length,
    amostra: cs.slice(0, 3).map((c) => (c.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 58)),
  };
`);

/**
 * O ARGUMENTO — o que NÃO pode sumir. Selo de motivo, procedência do texto do motivo,
 * rótulos `ic`/`derivado`/`autorado`, a ficha de acessibilidade e as frases de ausência.
 */
const LER_ARGUMENTO = naPagina(`
  const texto = (el) => (el.textContent || '').trim().replace(/\\s+/g, ' ');
  const selos = visiveis('.selo-motivo[data-motivo], .selo-motivo[data-motivo-passo]');
  const rodapesDeMotivo = visiveis('footer span').filter((s) => /^motivo /.test(texto(s)));
  const procedencias = visiveis('[data-procedencia-aresta], [data-verbete]');
  const dimensoes = visiveis('[data-dimensao]');
  // Os ESTADOS da ficha, com o texto de cada um: é a distinção «declarado ausente» contra
  // «não declarado», que precisa continuar legível — não basta o item existir.
  const estados = {};
  for (const d of dimensoes) {
    const e = d.getAttribute('data-estado');
    if (!estados[e]) estados[e] = texto(d).slice(0, 40);
  }
  return {
    selos: selos.length,
    seloAlturaMinima: selos.length ? Math.min(...selos.map((s) => Math.round(s.getBoundingClientRect().height))) : -1,
    seloTextoVazio: selos.filter((s) => !((s.getAttribute('data-motivo') || s.getAttribute('data-motivo-passo') || '').trim())).length,
    primeiroSelo: selos.length ? texto(selos[0]).slice(0, 58) : '',
    rodapesDeMotivo: rodapesDeMotivo.length,
    primeiroRodape: rodapesDeMotivo.length ? texto(rodapesDeMotivo[0]).slice(0, 48) : '',
    procedencias: procedencias.length,
    // Os rótulos ic/derivado/autorado, pelo VALOR do atributo — o que a banca lê na tela.
    rotulosProcedencia: visiveis('[data-procedencia-aresta]').map((p) => p.getAttribute('data-procedencia-aresta')),
    ausencias: visiveis('[data-ponte-ausente]').length,
    dimensoes: dimensoes.length,
    estados,
    adjacentes: visiveis('[data-adjacente]').length,
    atravessados: visiveis('[data-atravessado]').length,
    // As duas frases de honestidade sobre o acervo que o brief nomeou. Casadas por texto,
    // e não por atributo: elas não têm marcação própria, e é o texto que precisa aparecer.
    fraseEspaco: visiveis('p, span').filter((p) => /não publica o espaço desta sessão/.test(texto(p))).length,
    fraseElenco: visiveis('p').filter((p) => /Sem elenco no grafo/.test(texto(p))).length,
    // A assinatura do destaque curado (D-29) e a faixa do cartão especial (D-29/D-30): a
    // curadoria humana assinada é literalmente o oposto de um recomendador opaco, e some
    // junto com o comentário se o invólucro for posto no lugar errado.
    assinaturas: visiveis('article.cartao p.italic, article.cartao p[class*="italic"]').length,
    especiais: visiveis('.cartao-faixa').length,
  };
`);

/** Os marcadores que, se existirem na rota, têm de sobreviver ao interruptor. */
const MARCADORES = [
  ["selo de motivo", "selos"],
  ["procedência do texto do motivo", "rodapesDeMotivo"],
  ["bloco de procedência (ic/derivado/autorado)", "procedencias"],
  ["ausência declarada", "ausencias"],
  ["dimensão de acessibilidade", "dimensoes"],
  ["adjacente a um passo", "adjacentes"],
  ["linguagem atravessada", "atravessados"],
  ["frase «o acervo não publica o espaço»", "fraseEspaco"],
  ["frase «sem elenco no grafo»", "fraseElenco"],
  ["assinatura do destaque curado", "assinaturas"],
  ["faixa de cartão especial", "especiais"],
];

/** A altura REAL do conteúdo dentro da moldura — é ela que denuncia buraco sobrando. */
const LER_MOLDURA = naPagina(`
  // Desde a reformulação (2026-08) quem rola é .moldura-rolagem, filha da moldura.
  const m = document.querySelector('.moldura-rolagem') || document.querySelector('.moldura');
  const filhos = Array.from(m.querySelectorAll(':scope > * > *'));
  return {
    conteudo: Math.round(m.scrollHeight),
    util: Math.round(m.clientHeight),
    filhosVisiveis: filhos.filter(visivel).length,
  };
`);

/**
 * O MAIOR VÃO VERTICAL entre dois irmãos consecutivos e visíveis do miolo da tela.
 *
 * É esta a medida de «não sobrou buraco». Um comentário meramente invisível deixaria de
 * pintar mas continuaria reservando a caixa, e o vão entre os vizinhos dele saltaria. Como
 * a regra é `display: none`, a caixa nem é gerada — o gap do flexbox também não abre, e o
 * vão máximo tem de continuar da ordem do espaçamento de projeto da tela.
 */
const LER_VAOS = naPagina(`
  const raiz = document.querySelector('.moldura main > div') || document.querySelector('.moldura-rolagem') || document.querySelector('.moldura');
  const irmaos = Array.from(raiz.children).filter(visivel);
  const vaos = [];
  for (let i = 1; i < irmaos.length; i++) {
    const a = irmaos[i - 1].getBoundingClientRect();
    const b = irmaos[i].getBoundingClientRect();
    vaos.push({ vao: Math.round(b.top - a.bottom), depois: (irmaos[i - 1].textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 34) });
  }
  return { irmaos: irmaos.length, vaos, maior: vaos.reduce((m, v) => Math.max(m, v.vao), 0) };
`);

// ---------------------------------------------------------------------------
// Foto
// ---------------------------------------------------------------------------

async function fotografar(cdp, arquivo) {
  const dados = await cdp.capturar();
  mkdirSync(path.dirname(arquivo), { recursive: true });
  writeFileSync(arquivo, Buffer.from(dados, "base64"));
  return arquivo;
}

// ---------------------------------------------------------------------------
// Os gates
// ---------------------------------------------------------------------------

/** Liga ou desliga pelo BOTÃO, com hit-test — nunca escrevendo no localStorage. */
async function definirModo(cdp, ligado) {
  const atual = await cdp.avaliar(
    `document.querySelector('[data-comentado-alternar]')?.getAttribute('aria-pressed') === 'true'`,
  );
  if (atual === ligado) return false;
  await cdp.clicar("document.querySelector('[data-comentado-alternar]')");
  await new Promise((r) => setTimeout(r, 300));
  return true;
}

async function gates(cdp, base) {
  // ---- 1. O padrão é DESLIGADO -------------------------------------------
  titulo("── 1 · o padrão, num navegador sem estado ──");
  await cdp.navegar(`${base}/descobrir/`);

  const inicial = await cdp.avaliar(LER_ATRIBUTOS);
  exigir(
    inicial.comentado === "nao",
    "data-comentado num navegador limpo",
    inicial.comentado ?? "AUSENTE",
    "nao — se a demonstração abrir comentada, o interruptor não resolveu nada",
  );
  exigir(
    inicial.mesmoElemento && inicial.view === "mobile",
    "data-comentado mora no MESMO elemento que data-view",
    `data-view="${inicial.view}" e data-comentado="${inicial.comentado}" no mesmo nó`,
    "os dois atributos no mesmo elemento raiz",
  );
  exigir(
    inicial.botao === "false",
    "aria-pressed do interruptor acompanha o estado",
    inicial.botao,
    "false",
  );
  resumo.push([
    "padrão",
    `navegador limpo abre em data-comentado="nao", no mesmo nó de data-view="${inicial.view}"`,
  ]);

  // ---- 2. O interruptor troca o atributo e SOBREVIVE A RECARREGAR --------
  titulo("── 2 · o interruptor, e a sobrevivência ao recarregar ──");
  await definirModo(cdp, true);
  const ligado = await cdp.avaliar(LER_ATRIBUTOS);
  exigir(
    ligado.comentado === "sim" && ligado.botao === "true",
    "data-comentado após um clique no interruptor",
    `${ligado.comentado} · aria-pressed ${ligado.botao}`,
    "sim · true",
  );

  await cdp.recarregar();
  const aposRecarga = await cdp.avaliar(LER_ATRIBUTOS);
  exigir(
    aposRecarga.comentado === "sim",
    "data-comentado sobrevive a recarregar (ida)",
    aposRecarga.comentado ?? "AUSENTE",
    "sim",
  );

  await definirModo(cdp, false);
  const devolta = await cdp.avaliar(LER_ATRIBUTOS);
  exigir(devolta.comentado === "nao", "data-comentado volta para nao", devolta.comentado, "nao");

  await cdp.recarregar();
  const devoltaRecarga = await cdp.avaliar(LER_ATRIBUTOS);
  exigir(
    devoltaRecarga.comentado === "nao",
    "data-comentado sobrevive a recarregar (volta)",
    devoltaRecarga.comentado,
    "nao",
  );

  // A visão NÃO pode ter sido arrastada junto: são dois espelhos independentes.
  exigir(
    devoltaRecarga.view === inicial.view,
    "trocar o modo comentado não mexe na visão",
    `data-view ${inicial.view} → ${devoltaRecarga.view}`,
    inicial.view,
  );
  resumo.push([
    "persistência",
    `sim→recarrega→sim e nao→recarrega→nao, nas duas direções, sem arrastar data-view junto`,
  ]);

  // ---- 3 a 6. Por rota ----------------------------------------------------
  const medidas = {};

  for (const { nome, rota, minimoComentarios } of ROTAS) {
    titulo(`── ${rota} · os dois estados ──`);
    await cdp.navegar(`${base}${rota}`);
    await definirModo(cdp, false);

    const desligado = {
      comentarios: await cdp.avaliar(LER_COMENTARIOS),
      argumento: await cdp.avaliar(LER_ARGUMENTO),
      moldura: await cdp.avaliar(LER_MOLDURA),
      vaos: await cdp.avaliar(LER_VAOS),
    };
    const fotoOff = await fotografar(cdp, path.join(FOTOS, `comentado-${nome}-off.png`));

    await definirModo(cdp, true);
    const aceso = {
      comentarios: await cdp.avaliar(LER_COMENTARIOS),
      argumento: await cdp.avaliar(LER_ARGUMENTO),
      moldura: await cdp.avaliar(LER_MOLDURA),
      vaos: await cdp.avaliar(LER_VAOS),
    };
    const fotoOn = await fotografar(cdp, path.join(FOTOS, `comentado-${nome}-on.png`));

    // 3. Há comentário para medir. Uma tela sem comentário nenhum passaria os gates de
    // altura por vacuidade, e o relatório diria «verde» sobre uma migração vazia.
    exigir(
      aceso.comentarios.total >= minimoComentarios,
      `${rota} · blocos de comentário no DOM`,
      `${aceso.comentarios.total}${
        aceso.comentarios.amostra.length
          ? ` · ex.: ${aceso.comentarios.amostra.map((t) => `«${t}»`).join(" · ")}`
          : " (rota medida só pelo que NÃO some)"
      }`,
      `≥ ${minimoComentarios}`,
    );

    // 4. LIGADO eles aparecem; DESLIGADO ocupam altura ZERO.
    if (aceso.comentarios.total > 0) {
      exigir(
        aceso.comentarios.visiveis === aceso.comentarios.total &&
          aceso.comentarios.maiorAltura > 0,
        `${rota} · ligado, todo comentário está VISÍVEL`,
        `${aceso.comentarios.visiveis} de ${aceso.comentarios.total} visíveis · ` +
          `altura somada ${Math.round(aceso.comentarios.alturaTotal)}px`,
        "todos, com altura > 0",
      );
      exigir(
        desligado.comentarios.comAltura === 0 &&
          desligado.comentarios.comLargura === 0 &&
          desligado.comentarios.alturaTotal === 0 &&
          desligado.comentarios.displayNone === desligado.comentarios.total,
        `${rota} · desligado, todo comentário ocupa altura ZERO`,
        `${desligado.comentarios.total} blocos · ${desligado.comentarios.comAltura} com altura · ` +
          `${desligado.comentarios.comLargura} com largura · altura somada ` +
          `${Math.round(desligado.comentarios.alturaTotal)}px · ` +
          `${desligado.comentarios.displayNone} em display:none`,
        "0 com altura, 0 com largura, todos em display:none",
      );
    }

    // 5. O ARGUMENTO SOBREVIVE AOS DOIS ESTADOS. É o gate que importa.
    //
    // Contado marcador a marcador, e SÓ SOBRE OS QUE ESTA ROTA TEM. Um marcador ausente da
    // rota entra como «0 igual a 0», que é verdade e não é prova — daí a exigência separada
    // de que a rota exercite pelo menos três marcadores de verdade. Sem ela, uma página em
    // branco passaria este gate.
    const presentes = MARCADORES.filter(([, chave]) => aceso.argumento[chave] > 0);
    const divergentes = MARCADORES.filter(
      ([, chave]) => desligado.argumento[chave] !== aceso.argumento[chave],
    );
    exigir(
      divergentes.length === 0 && presentes.length >= 3,
      `${rota} · o ARGUMENTO fica igual nos DOIS estados`,
      `${presentes.length} marcadores exercitados, ${divergentes.length} divergentes · ` +
        presentes
          .map(([r, c]) => `${r} ${desligado.argumento[c]}→${aceso.argumento[c]}`)
          .join(" · "),
      "0 divergências e ≥ 3 marcadores realmente presentes na rota",
    );

    if (desligado.argumento.selos > 0) {
      exigir(
        desligado.argumento.seloAlturaMinima > 0 && desligado.argumento.seloTextoVazio === 0,
        `${rota} · desligado, o selo de motivo tem ALTURA e TEXTO`,
        `${desligado.argumento.selos} selos · menor altura ${desligado.argumento.seloAlturaMinima}px · ` +
          `${desligado.argumento.seloTextoVazio} vazios · «${desligado.argumento.primeiroSelo}»`,
        "altura > 0 e nenhum vazio",
      );
    }
    if (desligado.argumento.rodapesDeMotivo > 0) {
      ok(
        `${rota} · procedência do texto do motivo, desligado`,
        `${desligado.argumento.rodapesDeMotivo}× «${desligado.argumento.primeiroRodape}»`,
      );
    }
    if (desligado.argumento.rotulosProcedencia.length) {
      ok(
        `${rota} · rótulos de procedência da aresta, desligado`,
        desligado.argumento.rotulosProcedencia.join(", "),
      );
    }
    // A distinção de D-43 tem de continuar LEGÍVEL, não só presente: dois estados na tela,
    // cada um com o seu texto. Escondê-la converteria «não declarado» em «não tem».
    if (desligado.argumento.dimensoes > 0) {
      const chavesOff = Object.keys(desligado.argumento.estados).sort().join("+");
      const chavesOn = Object.keys(aceso.argumento.estados).sort().join("+");
      const textos = Object.entries(desligado.argumento.estados);
      exigir(
        chavesOff === chavesOn && new Set(textos.map(([, t]) => t)).size === textos.length,
        `${rota} · os estados da acessibilidade se distinguem NOS DOIS`,
        `${desligado.argumento.dimensoes} dimensões · estados ${chavesOff} (desligado) contra ` +
          `${chavesOn} (ligado) · ` +
          textos.map(([e, t]) => `${e}: «${t}»`).join(" · "),
        "os mesmos estados nos dois, cada um com texto próprio",
      );
    }

    // 6. NÃO SOBROU BURACO. A tela encolhe pelo que sumiu, e o maior vão entre irmãos
    // visíveis fica na ordem do espaçamento de projeto — não no da caixa que sumiu.
    const encolheu = aceso.moldura.conteudo - desligado.moldura.conteudo;
    if (aceso.comentarios.total > 0) {
      exigir(
        encolheu > 0,
        `${rota} · desligar ENCOLHE a tela (o comentário saiu do fluxo)`,
        `altura de conteúdo ${aceso.moldura.conteudo}px ligado → ${desligado.moldura.conteudo}px desligado ` +
          `(${encolheu}px a menos, contra ${Math.round(aceso.comentarios.alturaTotal)}px de comentário medido)`,
        "> 0",
      );
      exigir(
        desligado.vaos.maior <= aceso.vaos.maior + 1,
        `${rota} · nenhum vão NOVO onde o comentário estava`,
        `maior vão entre irmãos visíveis: ${aceso.vaos.maior}px ligado → ${desligado.vaos.maior}px desligado ` +
          `(${desligado.vaos.irmaos} irmãos)`,
        "o maior vão não cresce ao desligar",
      );
    } else {
      exigir(
        encolheu === 0,
        `${rota} · rota sem comentário não muda de altura`,
        `${aceso.moldura.conteudo}px nos dois estados`,
        "0px de diferença",
      );
    }

    medidas[nome] = { desligado, aceso, encolheu, fotoOff, fotoOn };
    ok(`${rota} · fotos`, `${path.basename(fotoOff)} e ${path.basename(fotoOn)}`);

    resumo.push([
      rota,
      `${aceso.comentarios.total} comentários · ligado somam ${Math.round(aceso.comentarios.alturaTotal)}px, ` +
        `desligado 0px em ${desligado.comentarios.displayNone}/${desligado.comentarios.total} display:none · ` +
        `tela encolhe ${encolheu}px · maior vão ${aceso.vaos.maior}→${desligado.vaos.maior}px · ` +
        `${presentes.length} marcadores de produto, iguais nos dois estados`,
    ]);

    await definirModo(cdp, false); // a próxima rota começa do padrão
  }

  return { medidas, navegacoes: cdp.navegacoes };
}

// ---------------------------------------------------------------------------
// A janela estreita — a ÚNICA media query do projeto, e ela mudou de alvo.
//
// A regra de 430px empurrava `.alternador` para cima para não cair sobre a barra de abas.
// Com o interruptor, quem carrega a ancoragem passou a ser `.canto`, e a regra teve de
// mudar de seletor junto. Uma regra apontando para um seletor que deixou de ser posicionado
// não dá erro em lugar nenhum: ela simplesmente não faz nada, e o sintoma seria dois
// controles em cima da barra de abas num celular de verdade. Por isso este gate existe, e
// por isso ele abre um SEGUNDO navegador — os outros medem 1440px de propósito, onde a
// media query não participa.
// ---------------------------------------------------------------------------

async function gateJanelaEstreita(base) {
  titulo("── janela estreita (400px) · o canto continua inteiro na janela ──");
  const cdp = await abrirNavegador({ largura: 400, altura: 860 });
  try {
    await cdp.navegar(`${base}/descobrir/`);
    // Desde a reformulação (menu lateral, 2026-08) não existe barra no pé para o canto
    // desviar — a pergunta que resta é se os dois controles seguem fixos, visíveis e
    // inteiramente dentro da janela estreita.
    const m = await cdp.avaliar(
      naPagina(`
        const canto = document.querySelector('.canto');
        const alternador = document.querySelector('.alternador');
        const interruptor = document.querySelector('[data-comentado-alternar]');
        const rc = canto.getBoundingClientRect();
        return {
          cantoBase: Math.round(rc.bottom),
          cantoTopo: Math.round(rc.top),
          posicao: getComputedStyle(canto).position,
          folga: Math.round(innerHeight - rc.bottom),
          ambosVisiveis: visivel(alternador) && visivel(interruptor),
        };
      `),
    );
    exigir(
      m.posicao === "fixed" && m.ambosVisiveis && m.folga >= 0 && m.cantoTopo >= 0,
      "os dois controles do canto ficam inteiros na janela em 400px",
      `canto (position: ${m.posicao}) de ${m.cantoTopo} a ${m.cantoBase}px · folga até o fundo ${m.folga}px ` +
        `· alternador e interruptor visíveis: ${m.ambosVisiveis}`,
      "canto fixo, os dois visíveis e dentro da janela",
    );
    resumo.push([
      "400px",
      `o canto fica inteiro na janela estreita: folga de ${m.folga}px até o fundo`,
    ]);
    return cdp.consola.filter((c) => c.nivel === "erro" || c.nivel === "aviso").length;
  } finally {
    await cdp.encerrar();
  }
}

// ---------------------------------------------------------------------------
// Console
// ---------------------------------------------------------------------------

function gateConsole(cdp) {
  titulo("── console, acumulado na sessão inteira ──");
  const erros = cdp.consola.filter((c) => c.nivel === "erro");
  const avisos = cdp.consola.filter((c) => c.nivel === "aviso");
  for (const c of cdp.consola.slice(0, 20)) console.log(`       ${c.nivel}: ${c.texto}`);
  exigir(
    erros.length === 0 && avisos.length === 0,
    "console",
    `${erros.length} erro, ${avisos.length} aviso em ${cdp.navegacoes} navegações`,
    "0 erro, 0 aviso — divergência de hidratação apareceria aqui",
  );
  resumo.push(["console limpo", `0 erro, 0 aviso em ${cdp.navegacoes} navegações`]);
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

async function principal() {
  console.log("verificar-comentado — o interruptor sobre o artefato exportado, em Chrome headless\n");

  if (!existsSync(path.join(OUT, "index.html"))) {
    throw new Error("out/ não existe ou está incompleto. Rode `npm run build` antes.");
  }

  const servidor = await servir({ raiz: OUT });
  console.log(`  servidor estático em ${servidor.url} (raiz: out/)`);

  let cdp = null;
  try {
    cdp = await abrirNavegador();
    console.log(`  Chrome headless aberto · viewport ${LARGURA_PADRAO}×${ALTURA_PADRAO}`);
    await gates(cdp, servidor.url);
    const ruidoEstreito = await gateJanelaEstreita(servidor.url);
    gateConsole(cdp);
    exigir(
      ruidoEstreito === 0,
      "console da janela estreita",
      `${ruidoEstreito} erro ou aviso`,
      "0",
    );

    titulo("── resumo · uma linha por promessa ──");
    for (const [nome, valor] of resumo) console.log(`  ${nome.padEnd(14)} ${valor}`);
    console.log(`\n  fotos em ${FOTOS}`);
  } finally {
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
