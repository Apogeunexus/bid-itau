/**
 * navegador.mjs — o cliente CDP da verificação, compartilhado.
 *
 * POR QUE ELE FOI EXTRAÍDO DE `verificar-fase2.mjs`. Este bloco é a única forma que o
 * projeto tem de medir o que APARECE NA TELA, e não o que está no arquivo. Quando uma
 * segunda suíte precisou da mesma medição, havia duas saídas: copiar 300 linhas de cliente
 * CDP para um segundo arquivo, ou movê-las para cá. Cópia é a saída errada — as duas cópias
 * divergem na primeira correção, e o sintoma seria uma verificação medindo um viewport e a
 * outra medindo outro, com as duas relatando verde.
 *
 * O QUE MUDOU NA MUDANÇA: nada de comportamento. As constantes que eram de módulo em
 * `verificar-fase2.mjs` viraram opções com o MESMO valor padrão — 1440×960, 30s por
 * navegação, 15s de hidratação — para que o relatório da fase 2 continue sendo sobre
 * exatamente o mesmo navegador de antes.
 *
 * ZERO DEPENDÊNCIA NOVA. O cliente são ~120 linhas sobre o `WebSocket` global do Node 24.
 * Instalar puppeteer aqui exigiria a auditoria de legitimidade de pacote que a fase não fez.
 */

import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const LARGURA_PADRAO = 1440;
export const ALTURA_PADRAO = 960;
export const TETO_NAVEGACAO_PADRAO = 30_000;
export const TETO_HIDRATACAO_PADRAO = 15_000;

// A lista é montada por plataforma, e não concatenada de uma vez, porque no Windows os
// caminhos NASCEM de variáveis de ambiente: «Program Files» muda de nome em máquina com
// Windows em outro idioma, e `%ProgramFiles(x86)%` nem sequer existe em instalação de 32
// bits. Escrever os caminhos literais faria a verificação passar aqui e falhar na máquina do
// lado — que é o tipo de verde falso que T-02-22 existe para impedir.
function caminhosDoSistema() {
  if (process.platform !== "win32") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
    ];
  }

  // Edge fecha a lista, e não a abre: ele é Chromium e fala o mesmo CDP, mas medir num
  // motor que não é o do resto do projeto é decisão, não acaso. Só entra quando não há
  // Chrome nenhum — e aí é melhor que a alternativa, que é não medir.
  const raizes = [
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.LOCALAPPDATA,
  ].filter(Boolean);

  return [
    ...raizes.map((r) => path.join(r, "Google", "Chrome", "Application", "chrome.exe")),
    ...raizes.map((r) => path.join(r, "Chromium", "Application", "chrome.exe")),
    ...raizes.map((r) => path.join(r, "Microsoft", "Edge", "Application", "msedge.exe")),
  ];
}

const CAMINHOS_CHROME = caminhosDoSistema();

export function acharChrome() {
  // CHROME_BIN é ESCOLHA EXPLÍCITA, não sugestão. Se estiver definido e não existir, falha
  // aqui em vez de cair na lista padrão: cair silenciosamente mediria um binário diferente do
  // que foi pedido, e o relatório diria «passou» sobre outro navegador. Mesmo raciocínio de
  // T-02-22, um nível acima — a verificação também não pode se autossubstituir.
  if (process.env.CHROME_BIN) {
    if (existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
    throw new Error(
      `CHROME_BIN aponta para «${process.env.CHROME_BIN}», que não existe. ` +
        `Corrija a variável ou remova-a para usar a lista padrão. NÃO caio no Chrome do sistema: ` +
        `verificar num binário diferente do pedido produz um relatório sobre outra coisa.`,
    );
  }
  for (const c of CAMINHOS_CHROME) if (existsSync(c)) return c;
  // T-02-22. Falhar alto é o comportamento correto: um `return null` que faz o script
  // pular os gates produz relatório verde sobre nada.
  throw new Error(
    `Chrome não encontrado. Procurei em:\n  ${CAMINHOS_CHROME.join("\n  ")}\n` +
      `Defina CHROME_BIN apontando para o binário. A verificação NÃO se pula.`,
  );
}

export async function abrirNavegador({
  largura = LARGURA_PADRAO,
  altura = ALTURA_PADRAO,
  tetoNavegacao = TETO_NAVEGACAO_PADRAO,
  tetoHidratacao = TETO_HIDRATACAO_PADRAO,
} = {}) {
  const LARGURA = largura;
  const ALTURA = altura;
  const TETO_NAVEGACAO = tetoNavegacao;
  const TETO_HIDRATACAO = tetoHidratacao;
  const bin = acharChrome();
  const perfil = await mkdtemp(path.join(tmpdir(), "verificar-fase2-"));

  const chrome = spawn(
    bin,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${perfil}`,
      `--window-size=${LARGURA},${ALTURA}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-gpu",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  // T-02-21. O encerramento tem de estar amarrado ao PROCESSO, não ao caminho feliz: se
  // qualquer coisa entre o spawn e o `cdp` pronto lançar, o `finally` de `principal()` ainda
  // não tem objeto nenhum para encerrar e o Chrome fica órfão, adotado pelo init, segurando
  // o perfil temporário. Foi exatamente o que aconteceu quando `Target.createTarget` recusou
  // os parâmetros de tamanho: um Chrome de 11 minutos com ppid 1. Daí a limpeza ser definida
  // AQUI, logo depois do spawn, e ser chamada por todos os caminhos de saída.
  let encerrado = false;
  const matarChrome = async () => {
    if (encerrado) return;
    encerrado = true;
    process.off("exit", matarSincrono);
    try {
      chrome.kill("SIGTERM");
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
    try {
      chrome.kill("SIGKILL");
    } catch {}
    await rm(perfil, { recursive: true, force: true }).catch(() => {});
  };
  // Rede de segurança para saída abrupta (throw não capturado, Ctrl-C): `process.on('exit')`
  // só admite trabalho síncrono, então aqui é só o sinal — o perfil temporário fica para o
  // sistema, que é o custo aceitável de uma saída que não passou por lugar nenhum.
  function matarSincrono() {
    try {
      chrome.kill("SIGKILL");
    } catch {}
  }
  process.on("exit", matarSincrono);
  process.once("SIGINT", () => {
    matarSincrono();
    process.exit(130);
  });

  try {
    return await conectar();
  } catch (erro) {
    await matarChrome();
    throw erro;
  }

  async function conectar() {
  // A porta REAL vem da linha que o Chrome escreve em stderr. Não presumir porta fixa e não
  // sondar às cegas: sondagem cega esconde «o Chrome nem subiu» atrás de um timeout genérico.
  const wsNavegador = await new Promise((resolve, reject) => {
    let buffer = "";
    const relogio = setTimeout(
      () => reject(new Error(`Chrome não anunciou a porta de depuração em 20s.\nstderr:\n${buffer}`)),
      20_000,
    );
    chrome.stderr.on("data", (d) => {
      buffer += d.toString();
      const m = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) {
        clearTimeout(relogio);
        resolve(m[1]);
      }
    });
    chrome.on("exit", (codigo) => {
      clearTimeout(relogio);
      reject(new Error(`Chrome saiu com código ${codigo} antes de abrir.\nstderr:\n${buffer}`));
    });
  });

  const ws = new WebSocket(wsNavegador);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error("WebSocket do Chrome não abriu"));
  });

  let proximoId = 0;
  const pendentes = new Map();
  const ouvintes = [];

  ws.onmessage = (evento) => {
    const msg = JSON.parse(evento.data);
    if (msg.id !== undefined && pendentes.has(msg.id)) {
      const { resolver: r, rejeitar } = pendentes.get(msg.id);
      pendentes.delete(msg.id);
      if (msg.error) rejeitar(new Error(`${msg.error.message} (${JSON.stringify(msg.error.data ?? "")})`));
      else r(msg.result);
      return;
    }
    if (msg.method) for (const o of ouvintes) o(msg);
  };

  function enviar(metodo, params = {}, sessionId) {
    const id = (proximoId += 1);
    return new Promise((resolver, rejeitar) => {
      pendentes.set(id, { resolver, rejeitar });
      ws.send(JSON.stringify({ id, method: metodo, params, ...(sessionId ? { sessionId } : {}) }));
      setTimeout(() => {
        if (pendentes.has(id)) {
          pendentes.delete(id);
          rejeitar(new Error(`tempo esgotado em ${metodo}`)); // T-02-21
        }
      }, TETO_NAVEGACAO);
    });
  }

  // `width`/`height` aqui só valem para janela nova; o tamanho vem de `--window-size` e é
  // TRAVADO logo abaixo por `Emulation.setDeviceMetricsOverride`. Travar em vez de confiar
  // na janela é o que torna a medição reprodutível entre máquinas: o viewport de 1440×960 é
  // premissa de todos os gates de tela, e uma barra de ferramentas a mais mudaria o número.
  const { targetId } = await enviar("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await enviar("Target.attachToTarget", { targetId, flatten: true });

  await enviar(
    "Emulation.setDeviceMetricsOverride",
    { width: LARGURA, height: ALTURA, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );

  const consola = [];
  ouvintes.push((msg) => {
    if (msg.sessionId && msg.sessionId !== sessionId) return;
    if (msg.method === "Runtime.consoleAPICalled") {
      const tipo = msg.params.type;
      if (tipo === "error" || tipo === "warning" || tipo === "assert") {
        consola.push({
          nivel: tipo === "warning" ? "aviso" : "erro",
          texto: (msg.params.args ?? []).map((a) => a.value ?? a.description ?? a.type).join(" "),
        });
      }
    }
    if (msg.method === "Log.entryAdded") {
      const { level, text, url } = msg.params.entry;
      if (level === "error" || level === "warning") {
        consola.push({ nivel: level === "warning" ? "aviso" : "erro", texto: `${text} ${url ?? ""}`.trim() });
      }
    }
    if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      consola.push({ nivel: "erro", texto: d.exception?.description ?? d.text });
    }
  });

  await enviar("Page.enable", {}, sessionId);
  await enviar("Runtime.enable", {}, sessionId);
  await enviar("Log.enable", {}, sessionId);

  const cdp = {
    consola,
    navegacoes: 0,
    encerrar: async () => {
      try {
        ws.close();
      } catch {}
      await matarChrome();
    },

    /**
     * Finge, para a página, que o SISTEMA está em claro ou em escuro.
     *
     * Desde 23/08 o tema do produto não tem interruptor: quem decide é
     * `prefers-color-scheme`, e a única forma de um portão exercitar os dois lados
     * é emular a preferência do sistema operacional. `null` devolve o padrão do
     * Chrome sem tela — que é o claro.
     */
    async emularEsquemaDeCor(esquema) {
      await enviar(
        "Emulation.setEmulatedMedia",
        esquema
          ? { features: [{ name: "prefers-color-scheme", value: esquema }] }
          : { features: [] },
        sessionId,
      );
    },

    /** Avalia no contexto da página. `awaitPromise` + `returnByValue`: valor de verdade. */
    async avaliar(expressao) {
      const r = await enviar(
        "Runtime.evaluate",
        { expression: expressao, awaitPromise: true, returnByValue: true },
        sessionId,
      );
      if (r.exceptionDetails) {
        throw new Error(
          `erro ao avaliar na página: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`,
        );
      }
      return r.result.value;
    },

    async navegar(url) {
      const carregou = new Promise((resolve) => {
        const o = (msg) => {
          if (msg.method === "Page.loadEventFired" && (!msg.sessionId || msg.sessionId === sessionId)) {
            ouvintes.splice(ouvintes.indexOf(o), 1);
            resolve();
          }
        };
        ouvintes.push(o);
        setTimeout(resolve, TETO_NAVEGACAO); // T-02-21: teto por navegação
      });
      await enviar("Page.navigate", { url }, sessionId);
      cdp.navegacoes += 1;
      await carregou;
      await cdp.assentar();
    },

    /**
     * Espera a HIDRATAÇÃO, não um tempo arbitrário. `casca.tsx` escreve
     * `data-hidratado="sim"` depois que o `localStorage` foi lido. Antes disso o feed é o da
     * persona padrão, e vários gates dependem do estado pós-hidratação — medir antes mediria
     * a tela errada e o defeito seria intermitente, que é o pior tipo.
     */
    async assentar() {
      const limite = Date.now() + TETO_HIDRATACAO;
      for (;;) {
        const pronto = await cdp.avaliar(
          `document.readyState === 'complete' &&
           (!document.querySelector('[data-hidratado]') ||
             document.querySelector('[data-hidratado]').getAttribute('data-hidratado') === 'sim')`,
        );
        if (pronto) break;
        if (Date.now() > limite) throw new Error("a página não hidratou dentro do teto");
        await new Promise((r) => setTimeout(r, 100));
      }
      // Folga curta para efeitos de React que rodam depois do sinalizador.
      await new Promise((r) => setTimeout(r, 250));
    },

    /**
     * CLIQUE DE VERDADE: rola o elemento à vista, confere que o ponto central dele é ele
     * mesmo (`elementFromPoint`) e despacha mouse no CDP. Não é `el.click()`.
     * A diferença importa: `el.click()` dispara mesmo em elemento coberto por outra camada.
     * O defeito «link presente que não navega» só aparece com hit-test de verdade.
     */
    async clicar(seletorJs) {
      const alvo = await cdp.avaliar(`(() => {
        const el = ${seletorJs};
        if (!el) return { erro: 'elemento não encontrado' };
        el.scrollIntoView({ block: 'center', inline: 'center' });
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return { erro: 'elemento com retângulo zerado' };
        const x = Math.round(r.left + r.width / 2);
        const y = Math.round(r.top + r.height / 2);
        const sob = document.elementFromPoint(x, y);
        if (!sob || !(el === sob || el.contains(sob) || sob.contains(el))) {
          return { erro: 'ponto central coberto por ' + (sob ? sob.tagName + '.' + sob.className : 'nada') };
        }
        return { x, y, texto: (el.textContent || '').trim().slice(0, 60) };
      })()`);
      if (alvo.erro) throw new Error(`clique falhou: ${alvo.erro}`);
      const comum = { x: alvo.x, y: alvo.y, button: "left", clickCount: 1 };
      await enviar("Input.dispatchMouseEvent", { type: "mouseMoved", ...comum }, sessionId);
      await enviar("Input.dispatchMouseEvent", { type: "mousePressed", ...comum }, sessionId);
      await enviar("Input.dispatchMouseEvent", { type: "mouseReleased", ...comum }, sessionId);
      return alvo.texto;
    },

    /** Clica e espera a URL satisfazer o predicado — navegação de cliente não dá loadEvent. */
    async clicarEEsperarUrl(seletorJs, predicado, rotulo) {
      const antes = await cdp.avaliar("location.pathname");
      const texto = await cdp.clicar(seletorJs);
      const limite = Date.now() + TETO_NAVEGACAO;
      for (;;) {
        const agora = await cdp.avaliar("location.pathname");
        if (agora !== antes && predicado(agora)) {
          cdp.navegacoes += 1;
          await cdp.assentar();
          return { de: antes, para: agora, texto };
        }
        if (Date.now() > limite) {
          throw new Error(`${rotulo}: cliquei em «${texto}» e a URL ficou em ${agora} (era ${antes})`);
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    },

    /**
     * Foto da página, em PNG base64. `captureBeyondViewport: false` de propósito: o que
     * interessa é o que CABE no viewport travado de 1440×960, que é a medida de todos os
     * outros gates. Foto do documento inteiro mostraria uma tela que ninguém vê.
     */
    async capturar() {
      const r = await enviar(
        "Page.captureScreenshot",
        { format: "png", captureBeyondViewport: false },
        sessionId,
      );
      return r.data;
    },

    async recarregar() {
      const carregou = new Promise((resolve) => {
        const o = (msg) => {
          if (msg.method === "Page.loadEventFired") {
            ouvintes.splice(ouvintes.indexOf(o), 1);
            resolve();
          }
        };
        ouvintes.push(o);
        setTimeout(resolve, TETO_NAVEGACAO);
      });
      await enviar("Page.reload", { ignoreCache: false }, sessionId);
      cdp.navegacoes += 1;
      await carregou;
      await cdp.assentar();
    },
  };

    return cdp;
  }
}

// ---------------------------------------------------------------------------
// Ajudantes que rodam DENTRO da página.
// `visivel` é a definição operante da fase: presença no DOM não é presença na tela.
// ---------------------------------------------------------------------------

export const PRELUDIO = `
  const visivel = (el) => {
    if (!el) return false;
    const e = getComputedStyle(el);
    if (e.display === 'none' || e.visibility === 'hidden' || Number(e.opacity) === 0) return false;
    if (!el.offsetParent && e.position !== 'fixed') return false;
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.width > 0;
  };
  const todos = (s) => Array.from(document.querySelectorAll(s));
  const visiveis = (s) => todos(s).filter(visivel);
`;

export function naPagina(corpo) {
  return `(() => { ${PRELUDIO} ${corpo} })()`;
}

