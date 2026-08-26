/**
 * verificar-organizacao.mjs — a suíte do nível 6 · Organização (S6).
 *
 * ARQUIVO NOVO E DESTA SESSÃO. O §6 do protocolo das seis sessões proíbe editar as suítes
 * `verificar-fase*.mjs` que já existem; cada sessão cria a sua. Esta não toca em nenhuma
 * delas, e nenhuma delas precisa saber que esta existe.
 *
 * ELA MEDE OS OITO PORTÕES DO §8 DO PRD, e mede em vez de afirmar. A diferença importa: um
 * portão que lê o código-fonte procurando a frase certa passa quando alguém escreve a frase;
 * um portão que abre a tela e conta nó passa quando a tela faz a coisa.
 *
 * DUAS ARMADILHAS DE MÉTODO QUE ESTA SUÍTE JÁ NASCE EVITANDO, as duas pagas em falso
 * negativo durante a construção das dez telas:
 *
 *  1. **Nunca `innerText` de string montada.** React separa `Capítulos (` · `{n}` · `)` em
 *     nós de texto vizinhos, e `innerText` — que é baseado em layout — não os junta como
 *     `textContent`. `innerText.includes('Capítulos (1)')` devolve `false` sobre uma tela
 *     correta. Pior: pode devolver `true` por acaso sobre uma tela quebrada. Aqui se mede
 *     por `textContent` de elemento e por CONTAGEM DE NÓ.
 *  2. **A primeira navegação nunca é para a raiz.** Com a máquina carregada, o `next dev`
 *     levou 26 s só para responder `/`, contra o teto de 30 s do cliente CDP — e o smoke
 *     morria em `tempo esgotado em Page.navigate` sem nada a ver com a tela. O teto aqui é
 *     folgado e a navegação vai direto para a rota medida.
 *
 * COMO RODAR. Ela precisa de um servidor de pé, porque `npm run build` é fila compartilhada
 * entre seis sessões:
 *
 *     NEXT_SESSAO=s6 npx next dev -p 3006
 *     node scripts/verificar-organizacao.mjs
 *
 * `--base` troca o endereço, para rodar contra `out/` servido quando houver build.
 *
 * `--provar-ausencias` roda o modo do §9.1 do protocolo: **teste de ausência só vale depois
 * de ser visto VERMELHO com o defeito injetado.** Sete portões desta suíte afirmam que algo
 * NÃO existe — campo de latitude, escrita de «verificada», função de emitir chave, literal
 * de procedência, import por valor, segunda ficha, relógio. Um `grep` mal escrito passa
 * verde sobre todos eles, e um portão verde sobre o defeito é pior do que portão nenhum:
 * a tela ganha uma garantia que ninguém confere.
 *
 * O modo injeta cada defeito, confere que o portão correspondente acusa, e RESTAURA do
 * conteúdo que guardou em memória — nunca com `git checkout`, que apagaria trabalho não
 * commitado. Ele escreve em arquivo-fonte por milissegundos: **não rode com um build em
 * curso.**
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { abrirNavegador } from "./navegador.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SRC = path.join(RAIZ, "src");
const BASE =
  process.argv.find((a) => a.startsWith("--base="))?.slice("--base=".length) ??
  "http://localhost:3006";

/** As dez rotas da sessão, na ordem em que a navegação as percorre. */
const TELAS = [
  "instituicao",
  "espacos",
  "equipe",
  "midia",
  "programa",
  "formacao",
  "editais",
  "integracao",
  "alcance",
  "conformidade",
];

/** Os arquivos que esta sessão escreveu. Os portões estáticos só valem sobre eles: medir o
 *  código de outra sessão faria esta suíte falhar por trabalho que não é dela. */
const MEUS = [
  "src/dados/tipos-organizacao.ts",
  "src/dados/organizacao.ts",
  "src/componentes/studio-org-estado.ts",
  "src/componentes/studio-org-acessibilidade.tsx",
  "src/componentes/studio-org-navegacao.tsx",
  "src/componentes/studio-org-espacos.tsx",
  "src/componentes/studio-org-instituicao.tsx",
  "src/componentes/studio-org-equipe.tsx",
  "src/componentes/studio-org-midia.tsx",
  "src/componentes/studio-org-programa.tsx",
  "src/componentes/studio-org-formacao.tsx",
  "src/componentes/studio-org-editais.tsx",
  "src/componentes/studio-org-integracao.tsx",
  "src/componentes/studio-org-alcance.tsx",
  "src/componentes/studio-org-conformidade.tsx",
];

let verdes = 0;
const falhas = [];

function exigir(condicao, nome, medida, esperado = "") {
  if (condicao) {
    verdes += 1;
    console.log(`  ok   ${nome}: ${medida}`);
    return;
  }
  console.log(`  FALHA ${nome}: medido ${medida}${esperado ? ` · esperado ${esperado}` : ""}`);
  falhas.push(nome);
}

function titulo(t) {
  console.log(`\n${t}`);
}

const semComentarios = (codigo) =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

async function lerMeus() {
  const saida = [];
  for (const rel of MEUS) {
    saida.push({ rel, cru: await readFile(path.join(RAIZ, rel), "utf8") });
  }
  return saida;
}

// ===========================================================================
// (a) PORTÕES ESTÁTICOS — o que se mede sem abrir o navegador
// ===========================================================================

async function portoesEstaticos() {
  titulo("── (a) portões estáticos ──");
  const meus = await lerMeus();
  const limpos = meus.map((m) => ({ ...m, limpo: semComentarios(m.cru) }));

  // 1. Nenhuma SEGUNDA ficha de acessibilidade.
  //
  // O portão do PRD é «componentes da S7 reusados, não duplicados». A medida é a lista das
  // oito dimensões: se ela aparecer escrita mais de uma vez nos meus arquivos, existe uma
  // segunda ficha — porque quem redesenha a ficha redigita as oito.
  {
    const comAsOito = limpos.filter(
      (m) => /closed_caption/.test(m.limpo) && /descriptive_subtitle/.test(m.limpo),
    );
    exigir(
      comAsOito.length <= 1,
      "nenhuma segunda ficha de acessibilidade",
      comAsOito.length === 0
        ? "0 arquivos redigitam as 8 dimensões"
        : comAsOito.map((m) => path.basename(m.rel)).join(", "),
      "no máximo 1 (o editor compartilhado)",
    );
  }

  // 2. O editor da ficha é UM, e as telas que coletam acessibilidade o importam.
  {
    const coletam = ["studio-org-espacos.tsx", "studio-org-instituicao.tsx", "studio-org-midia.tsx"];
    const semImportar = coletam.filter((nome) => {
      const m = limpos.find((x) => x.rel.endsWith(nome));
      return !m || !/EditorDeAcessibilidade/.test(m.limpo);
    });
    exigir(
      semImportar.length === 0,
      "as três telas que coletam acessibilidade usam o MESMO editor",
      semImportar.length === 0 ? "3 de 3" : `sem importar: ${semImportar.join(", ")}`,
      "3 de 3",
    );
  }

  // 3. Não existe campo de latitude em lugar nenhum.
  //
  // `coordenada.procedencia` é o literal `"derivado"` no tipo. Um campo de lat/lon no
  // formulário produziria coordenada autorada, que o tipo proíbe — e a proibição do tipo não
  // aparece como erro se ninguém tentar atribuir; ela aparece como tela que mente.
  {
    const hits = [];
    for (const m of limpos) {
      for (const achado of m.limpo.matchAll(/(?:name|id|placeholder)="[^"]*(?:lat|lon)[^"]*"/gi)) {
        hits.push(`${path.basename(m.rel)}: ${achado[0]}`);
      }
    }
    exigir(hits.length === 0, "nenhum campo de latitude ou longitude", `${hits.length}`, "0");
  }

  // 4. Sem relógio e sem sorteio: o HTML exportado e a página hidratada precisam coincidir.
  {
    const hits = [];
    for (const m of limpos) {
      if (/new Date\(/.test(m.limpo)) hits.push(`${path.basename(m.rel)}: new Date`);
      if (/Math\.random\(/.test(m.limpo)) hits.push(`${path.basename(m.rel)}: Math.random`);
    }
    exigir(hits.length === 0, "sem relógio e sem sorteio", hits.join(", ") || "0", "0");
  }

  // 5. As três segregações moram no CÓDIGO, e não num aviso.
  //
  // A Organização não se verifica, não emite chave de integração e não declara fato de
  // evento. A medida é a ausência do verbo: nenhum módulo desta sessão sabe escrever
  // `"verificada"`, nem tem função de emitir chave.
  {
    const escreveVerificada = limpos.filter((m) =>
      /verificacao:\s*"verificada"|verificacao,\s*"verificada"/.test(m.limpo),
    );
    exigir(
      escreveVerificada.length === 0,
      "nenhum módulo da Organização escreve «verificada» — quem verifica é o Admin (92)",
      `${escreveVerificada.length}`,
      "0",
    );

    const emiteChave = limpos.filter((m) => /function\s+emitirChave|emitirChave\s*[:=]/.test(m.limpo));
    exigir(
      emiteChave.length === 0,
      "nenhuma função de emitir chave — quem emite é o Admin (97)",
      `${emiteChave.length}`,
      "0",
    );
  }

  // 6. A procedência de chegada é UMA constante, e nenhuma tela a digita.
  {
    const literais = limpos
      .filter((m) => m.rel.endsWith(".tsx"))
      .filter((m) => /"parceiro"|'parceiro'/.test(m.limpo));
    exigir(
      literais.length === 0,
      "nenhuma tela digita a procedência — ela sai de PROCEDENCIA_DA_ORGANIZACAO",
      literais.map((m) => path.basename(m.rel)).join(", ") || "0",
      "0",
    );
  }

  // 7. DP-F: componente de cliente não importa o módulo de dado POR VALOR.
  {
    const hits = [];
    for (const m of limpos.filter((x) => x.rel.endsWith(".tsx") || x.rel.endsWith("estado.ts"))) {
      for (const achado of m.limpo.matchAll(/^import\s+(?!type)([^;]*?)from\s+"@\/dados\/organizacao"/gm)) {
        hits.push(`${path.basename(m.rel)}: ${achado[1].trim()}`);
      }
    }
    exigir(
      hits.length === 0,
      "nenhum componente de cliente importa @/dados/organizacao por valor (DP-F)",
      hits.join(" | ") || "0",
      "0",
    );
  }

  // 8. As dez telas existem como rota, e a navegação não promete o que não existe.
  {
    const dir = path.join(SRC, "app", "(bastidor)", "studio");
    const rotas = new Set(
      (await readdir(dir, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name),
    );
    const faltando = TELAS.filter((t) => !rotas.has(t));
    exigir(
      faltando.length === 0,
      "as dez rotas da Organização existem no disco",
      faltando.length === 0 ? `${TELAS.length} de ${TELAS.length}` : `faltam ${faltando.join(", ")}`,
      "10 de 10",
    );

    const contrato = await readFile(path.join(SRC, "dados", "tipos-organizacao.ts"), "utf8");
    const prontas = [...contrato.matchAll(/id:\s*"([a-z]+)",[\s\S]{0,400}?pronta:\s*(true|false)/g)]
      .filter(([, id]) => TELAS.includes(id))
      .map(([, id, pronta]) => ({ id, pronta: pronta === "true" }));
    const mentindo = prontas.filter((p) => p.pronta && !rotas.has(p.id));
    exigir(
      mentindo.length === 0,
      "nenhuma tela marcada «pronta» sem rota no disco",
      mentindo.map((p) => p.id).join(", ") || "0",
      "0",
    );
  }
}

// ===========================================================================
// (b) PORTÕES DE NAVEGADOR — o que só a tela aberta mostra
// ===========================================================================

const esperar = (cdp, texto, voltas = 160) =>
  cdp.avaliar(
    `(async()=>{for(let i=0;i<${voltas};i++){if(document.body.textContent.includes(${JSON.stringify(texto)}))return true;await new Promise(r=>setTimeout(r,250));}return false;})()`,
  );
const pausa = (cdp) => cdp.avaliar(`new Promise(r=>setTimeout(r,400))`);
const clicar = (cdp, re) =>
  cdp.avaliar(
    `(()=>{const b=[...document.querySelectorAll('button')].find(x=>${re}.test(x.textContent.trim()));if(!b)return false;b.click();return true;})()`,
  );
const digitar = (cdp, seletor, valor) =>
  cdp.avaliar(
    `(()=>{const c=document.querySelector(${JSON.stringify(seletor)});if(!c)return false;
      const p=c.tagName==='TEXTAREA'?window.HTMLTextAreaElement:window.HTMLInputElement;
      Object.getOwnPropertyDescriptor(p.prototype,'value').set.call(c,${JSON.stringify(valor)});
      c.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`,
  );
/** Um denominador, lido pelos FILHOS e não por `innerText`. Ver o cabeçalho do arquivo. */
const denominador = (cdp, re) =>
  cdp.avaliar(
    `[...document.querySelectorAll('.web-denominador')].map(n=>[...n.children].map(c=>c.textContent.trim()).join(' ')).find(t=>${re}.test(t)) ?? '—'`,
  );

async function portoesDeNavegador(cdp) {
  // ---- O2 · espaços: conversão, ato explícito, coordenada -----------------
  titulo("── (b) O2 · espaços ──");
  await cdp.navegar(`${BASE}/studio/espacos/`);
  await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao','web')`);
  await cdp.avaliar(`localStorage.removeItem('studio.org.v1')`);
  await cdp.navegar(`${BASE}/studio/espacos/`);
  exigir(await esperar(cdp, "Cadastro"), "a tela de espaços hidrata", "sim");

  const naoDeclarado = await cdp.avaliar(
    `document.querySelectorAll('.org-caixa[data-estado="nao-declarado"]').length`,
  );
  exigir(naoDeclarado === 13, "a ficha do espaço abre com as 13 em «não declarado»", `${naoDeclarado}`, "13");

  exigir(
    (await cdp.avaliar(`document.querySelectorAll('.org-ato').length`)) >= 1,
    "existe o ato explícito de declarar ausência",
    "1",
  );
  await clicar(cdp, /^Declaro que não oferece/);
  await pausa(cdp);
  const ausentes = await cdp.avaliar(
    `document.querySelectorAll('.org-caixa[data-estado="declarado-ausente"]').length`,
  );
  exigir(
    ausentes === 13,
    "o ato move as 13 para «declarado ausente», e NÃO para «não declarado»",
    `${ausentes}`,
    "13",
  );

  const de = await cdp.avaliar(`document.querySelector('.org-conversao-de')?.textContent ?? '—'`);
  exigir(de === "derivado", "o selo mostra a procedência de saída", de, "derivado");
  await digitar(cdp, 'input[placeholder="Rua, número"]', "Rua Leopoldo Couto de Magalhães Jr., 110");
  await pausa(cdp);
  const para = await cdp.avaliar(`document.querySelector('.org-conversao-para')?.textContent ?? '—'`);
  exigir(para !== "aguardando cadastro" && para !== "derivado", "o cadastro converte a procedência", para);
  exigir(
    (await cdp.avaliar(
      `[...document.querySelectorAll('input')].some(i=>/lat|lon|coorden/i.test((i.getAttribute('placeholder')??'')+(i.name??'')+(i.id??'')))`,
    )) === false,
    "nenhum campo de latitude na tela",
    "0",
  );
  exigir(
    (await cdp.avaliar(`document.body.textContent.includes('centroide-municipio')`)) === true,
    "a coordenada troca de MÉTODO e continua derivada",
    "centroide-municipio",
  );

  // ---- O5 · mídia: nenhuma publica sem crédito ---------------------------
  titulo("── (b) O5 · mídia ──");
  await cdp.navegar(`${BASE}/studio/midia/`);
  exigir(await esperar(cdp, "Direito de distribuição"), "a tela de mídia hidrata", "sim");
  const fila = await denominador(cdp, /na fila, sem publicar/);
  const naFila = Number(fila.split(" ")[0]);
  exigir(naFila > 0, "a fila do crédito abre nomeada e não vazia", fila);
  const semCredito = await cdp.avaliar(
    `document.querySelectorAll('.web-lista-densa li').length`,
  );
  exigir(
    semCredito === naFila,
    "a lista abre NA fila — os itens sem crédito, e só eles",
    `${semCredito} linhas para ${naFila} na fila`,
  );
  await digitar(cdp, 'aside input[placeholder="Foto de …"]', "Foto de Fulano/Itaú Cultural");
  await pausa(cdp);
  const filaDepois = await denominador(cdp, /na fila, sem publicar/);
  exigir(
    Number(filaDepois.split(" ")[0]) === naFila - 1,
    "creditar tira o item da fila — o crédito é a condição de publicar",
    `${fila} → ${filaDepois}`,
  );

  // ---- O7 · equipe: sucessão com autor e carimbo -------------------------
  titulo("── (b) O7 · equipe ──");
  await cdp.navegar(`${BASE}/studio/equipe/`);
  exigir(await esperar(cdp, "Sucessão de titularidade"), "a tela de equipe hidrata", "sim");
  await clicar(cdp, /^Transferir para/);
  await pausa(cdp);
  const historico = await cdp.avaliar(
    `[...document.querySelectorAll('.org-falta-item')].map(n=>n.textContent).find(t=>/transferiu a titularidade/.test(t)) ?? '—'`,
  );
  exigir(/transferiu a titularidade/.test(historico), "a sucessão grava linha de histórico", "sim");
  exigir(
    /Gestão institucional/.test(historico) && /\d{4}-\d{2}-\d{2}/.test(historico),
    "e a linha carrega autor E carimbo de data",
    historico.slice(-60),
  );

  // ---- O8 · integração: nada grava sem chave de identidade ---------------
  titulo("── (b) O8 · integração ──");
  await cdp.navegar(`${BASE}/studio/integracao/`);
  exigir(await esperar(cdp, "Prévia do lote"), "a tela de integração hidrata", "sim");
  await digitar(
    cdp,
    "textarea",
    "BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:20261002T140000\nEND:VEVENT\nEND:VCALENDAR",
  );
  await pausa(cdp);
  const semTitulo = await denominador(cdp, /sem título, não gravam/);
  exigir(/^1 /.test(semTitulo), "linha sem título é contada como não gravável", semTitulo);
  exigir(
    (await cdp.avaliar(
      `[...document.querySelectorAll('button')].find(b=>/Guardar esta prévia/.test(b.textContent))?.disabled`,
    )) === true,
    "e o lote inteiro não grava — a chave de identidade começa no título",
    "desabilitado",
  );

  // ---- O9 · alcance: nenhum número que o acervo não sustenta -------------
  titulo("── (b) O9 · alcance ──");
  await cdp.navegar(`${BASE}/studio/alcance/`);
  exigir(await esperar(cdp, "O que este painel não exibe"), "a tela de alcance hidrata", "sim");
  const recusadas = await cdp.avaliar(`document.querySelectorAll('aside .org-falta-item').length`);
  exigir(recusadas >= 5, "as medidas recusadas aparecem nomeadas, com motivo", `${recusadas}`, "≥ 5");
  // O portão certo NÃO é «não aparece a palavra público»: a tela precisa citar «público
  // presente» para dizer que se recusa a medi-lo, e cita «3 pessoas-usuárias» como o número
  // medido que explica outra recusa. Uma varredura de texto acusaria as duas declarações
  // honestas e passaria por um indicador chamado «alcance» com número ao lado.
  //
  // A medida certa é o RÓTULO DOS INDICADORES: o que a tela exibe como número é o que está
  // sob `.web-denominador`, e nenhum deles pode prometer público.
  {
    const rotulos = await cdp.avaliar(
      `[...document.querySelectorAll('.web-denominador-rotulo')].map(n=>n.textContent.trim()).join(' | ')`,
    );
    const prometePublico =
      /p[úu]blico|audi[êe]ncia|alcance|espectador|visualiza|acesso|engajamento/i.test(rotulos);
    exigir(
      !prometePublico,
      "nenhum indicador com número promete público",
      rotulos || "(nenhum indicador)",
      "só contagens de grafo",
    );

    const recusadas = await cdp.avaliar(
      `[...document.querySelectorAll('aside .org-falta-item strong')].map(n=>n.textContent.trim()).join(' | ')`,
    );
    exigir(
      /p[úu]blico presente/.test(recusadas),
      "«público presente» aparece como medida RECUSADA, e não como indicador",
      recusadas,
    );
  }

  // ---- Navegação completa: medida de pixel e zero erro de console --------
  //
  // O PORTÃO 4 DO PRD PEDE MEDIDA DE PIXEL, e `scripts/medidas.mjs` é arquivo compartilhado
  // que esta sessão não edita (PEDIDO-S6-07). A medida mora aqui, e mede as duas coisas que
  // quebram numa tela de bastidor larga: transbordo horizontal — que faz a página inteira
  // rolar para o lado e some com a coluna da direita —, e coluna colada mais alta que a
  // janela, que nunca rola até o próprio fim.
  titulo("── (b) as dez telas, em sequência: medida e console ──");
  for (const tela of TELAS) {
    await cdp.navegar(`${BASE}/studio/${tela}/`);
    await esperar(cdp, "Studio · Organização", 40);
    const medida = await cdp.avaliar(`(() => {
      const colada = document.querySelector('.org-colada, .web-colada');
      return {
        nav: document.querySelectorAll('.org-telas .org-tela').length,
        transbordo: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        alturaColada: colada ? Math.round(colada.getBoundingClientRect().height) : 0,
        rolaPorDentro: colada ? getComputedStyle(colada).overflowY === 'auto' : true,
        janela: window.innerHeight,
      };
    })()`);

    // A coluna colada precisa CABER ou ROLAR POR DENTRO. Sticky mais alto que a janela
    // gruda no topo e nunca revela o próprio pé — e o pé é justamente onde mora «o que
    // falta», que é o motivo de o padrão existir.
    const coladaOk =
      medida.alturaColada === 0 || medida.alturaColada <= medida.janela || medida.rolaPorDentro;
    const ok = medida.nav === 10 && medida.transbordo <= 0 && coladaOk;

    if (!ok) {
      exigir(
        false,
        `${tela}: dez telas, sem transbordo, coluna colada alcançável`,
        `nav ${medida.nav} · transbordo ${medida.transbordo}px · colada ${medida.alturaColada}px em janela de ${medida.janela}px · rola por dentro: ${medida.rolaPorDentro}`,
        "nav 10 · transbordo ≤ 0 · colada cabe ou rola",
      );
    } else {
      verdes += 1;
      console.log(
        `  ok   ${tela}: nav 10 · transbordo ${medida.transbordo}px · colada ${medida.alturaColada}px ${medida.rolaPorDentro ? "com rolagem própria" : "cabendo na janela"}`,
      );
    }
  }

  const erros = cdp.consola.filter((c) => c.nivel === "erro");
  exigir(
    erros.length === 0,
    "zero erro de console numa navegação completa pelas dez telas",
    erros.length === 0 ? "0" : erros.slice(0, 3).map((e) => e.texto).join(" | "),
    "0",
  );
}

// ===========================================================================
// (c) A PROVA DOS PORTÕES DE AUSÊNCIA — §9.1 do protocolo
// ===========================================================================

/** Cada caso é um defeito real, na âncora exata onde ele nasceria. */
const DEFEITOS = [
  {
    portao: "nenhum campo de latitude ou longitude",
    arquivo: "src/componentes/studio-org-espacos.tsx",
    de: 'placeholder="Rua, número"',
    para: 'placeholder="latitude"',
  },
  {
    portao: "nenhum módulo da Organização escreve «verificada»",
    arquivo: "src/componentes/studio-org-estado.ts",
    de: 'comFicha(id, (c) => ({ ...c, verificacao: "solicitada" }));',
    para: 'comFicha(id, (c) => ({ ...c, verificacao: "verificada" }));',
  },
  {
    portao: "nenhuma função de emitir chave",
    arquivo: "src/componentes/studio-org-estado.ts",
    de: "  const revogarChave = useCallback((id: string) => {",
    para: "  const emitirChave = (r: string) => r;\n  const revogarChave = useCallback((id: string) => {",
  },
  {
    portao: "nenhuma tela digita a procedência",
    arquivo: "src/componentes/studio-org-espacos.tsx",
    de: '{foiCadastrado ? PROCEDENCIA_DA_ORGANIZACAO : "aguardando cadastro"}',
    para: '{foiCadastrado ? "parceiro" : "aguardando cadastro"}',
  },
  {
    portao: "nenhum componente de cliente importa @/dados/organizacao por valor",
    arquivo: "src/componentes/studio-org-alcance.tsx",
    de: 'import type { EventoParaPrograma, InstituicaoDoAcervo } from "@/dados/organizacao";',
    para:
      'import { UNIDADES_DA_FEDERACAO } from "@/dados/organizacao";\n' +
      'import type { EventoParaPrograma, InstituicaoDoAcervo } from "@/dados/organizacao";',
  },
  {
    portao: "nenhuma segunda ficha de acessibilidade",
    arquivo: "src/componentes/studio-org-espacos.tsx",
    de: "export function StudioOrgEspacos({",
    para:
      "const SEGUNDA_FICHA = ['audio_description','descriptive_subtitle','closed_caption'];\n" +
      "void SEGUNDA_FICHA;\nexport function StudioOrgEspacos({",
  },
  {
    portao: "sem relógio e sem sorteio",
    arquivo: "src/componentes/studio-org-equipe.tsx",
    de: "  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);",
    para:
      "  const agora = new Date();\n  void agora;\n" +
      "  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);",
  },
];

/** Roda só os portões estáticos e devolve a saída, sem tocar no navegador. */
async function saidaDosEstaticos() {
  const linhas = [];
  const console_log = console.log;
  const verdesAntes = verdes;
  const falhasAntes = falhas.length;
  console.log = (...args) => linhas.push(args.join(" "));
  try {
    await portoesEstaticos();
  } finally {
    console.log = console_log;
    verdes = verdesAntes;
    falhas.length = falhasAntes;
  }
  return linhas.join("\n");
}

async function provarAusencias() {
  titulo("── (c) prova dos portões de ausência (§9.1) ──");
  for (const d of DEFEITOS) {
    const caminho = path.join(RAIZ, d.arquivo);
    const original = await readFile(caminho, "utf8");
    if (!original.includes(d.de)) {
      exigir(false, `prova: ${d.portao}`, `âncora não encontrada em ${d.arquivo}`, "âncora presente");
      continue;
    }
    await writeFile(caminho, original.replace(d.de, d.para));
    let saida = "";
    try {
      saida = await saidaDosEstaticos();
    } finally {
      await writeFile(caminho, original);
    }
    const restaurado = await readFile(caminho, "utf8");
    const linha = saida.split("\n").find((l) => l.includes(d.portao));
    const vermelho = Boolean(linha && linha.trim().startsWith("FALHA"));
    exigir(
      vermelho && restaurado === original,
      `prova: ${d.portao}`,
      vermelho
        ? restaurado === original
          ? "vermelho com o defeito, e o arquivo voltou byte a byte"
          : "vermelho, mas o arquivo NÃO voltou igual"
        : `verde com o defeito injetado — o portão não vale (${(linha ?? "sem linha").trim()})`,
      "vermelho e restaurado",
    );
  }
}

// ===========================================================================

console.log("\nverificar-organizacao — os portões do nível 6");
console.log(`base: ${BASE}`);

await portoesEstaticos();

if (process.argv.includes("--provar-ausencias")) {
  await provarAusencias();
}

let cdp = null;
try {
  cdp = await abrirNavegador({ tetoNavegacao: 240_000, tetoHidratacao: 120_000 });
  await portoesDeNavegador(cdp);
} catch (erro) {
  console.log(`\n  FALHA navegador: ${erro instanceof Error ? erro.message : String(erro)}`);
  console.log("  (a suíte precisa de um servidor de pé: NEXT_SESSAO=s6 npx next dev -p 3006)");
  falhas.push("navegador");
} finally {
  if (cdp) await cdp.encerrar();
}

console.log(
  `\n  ${verdes} verdes · ${falhas.length} FALHA(S)${falhas.length ? `: ${falhas.join(", ")}` : ""}\n`,
);
process.exit(falhas.length ? 1 : 0);
