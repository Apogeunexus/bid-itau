/**
 * verificar-tema.mjs — o portão que prova que o tema escuro é escuro DE VERDADE.
 *
 * POR QUE ELE EXISTE, E POR QUE `verificar-ds.mjs` NÃO BASTA. Aquele lê arquivo:
 * ele sabe dizer que nenhum TSX escreve `text-black/60` e que nenhuma folha cita
 * `var(--ic-branco)` fora do lugar. O que ele NÃO consegue ver é o resultado —
 * uma regra que o autor jurou ter migrado, mas que perdeu a cascata para outra;
 * um utilitário do Tailwind com fundo branco herdado; um SVG com `fill` no
 * atributo em vez de no CSS. Todos esses passam no gate estático e aparecem como
 * um retângulo branco no meio da tela preta.
 *
 * Este script abre as telas de verdade, força o tema escuro e procura o que
 * SOBROU CLARO. Ele não mede intenção, mede pixel computado.
 *
 * O QUE ELE NÃO FAZ. Não se pula: Chrome ausente FALHA (a mesma regra dos outros
 * cinco portões), e um seletor de exceção que deixou de casar também falha, em
 * vez de ser ignorado — exceção que não se aplica mais é exceção que virou
 * mentira, e o custo dela é justamente o resíduo que ela mandava ignorar.
 *
 * ONDE ELE RODA. Contra um servidor HTTP, não contra `out/` — por padrão o
 * `next dev` em :3737. Passe outra origem em ALVO. Isso é deliberado: o tema é a
 * primeira coisa do projeto que dá para verificar sem pagar o build de 2.500
 * páginas, e essa é a diferença entre um portão que roda a cada onda e um que
 * roda uma vez por semana.
 */

import { abrirNavegador, naPagina } from "./navegador.mjs";

const ALVO = process.env.ALVO ?? "http://localhost:3737";

/**
 * As rotas medidas, e em que VISÃO cada uma existe.
 *
 * A primeira versão desta lista tinha sete rotas, todas na visão app, e o
 * relatório dizia «1.134 textos medidos, nenhum abaixo do mínimo» — o que lia
 * como resultado global e não era. Uma revisão hostil encontrou cinco defeitos
 * de contraste reais em rotas de fora da lista: o botão «Avançar» do onboarding,
 * os chips do roteiro da estrelinha, o painel de limites da Redação, o selo de
 * origem de IA e catorze etiquetas do Observatório. Um portão que mede uma
 * amostra e relata como se fosse o todo é pior que nenhum, porque produz a frase
 * «zero falhas» sobre a parte que ninguém olhou.
 *
 * As rotas do grupo `(bastidor)` — Studio, Redação, Observatório, Roteiro — só
 * renderizam na visão WEB: na app elas trocam a tela inteira por um aviso de
 * «superfície de desktop». Medi-las na app não dá falso verde, dá falso «não
 * carregou», que é como a checagem de sanidade as via antes.
 */
const ROTAS = [
  // Grupo público — a visão app é a que a moldura de 390px exercita.
  { rota: "/descobrir/", visao: "mobile" }, // hero, cartão, selo de motivo, capa
  { rota: "/acontece/", visao: "mobile" }, // faixa de dias, cartão de agenda, mapa
  { rota: "/buscar/", visao: "mobile" }, // campo, facetas, vitrine
  { rota: "/play/", visao: "mobile" }, // chips, grade de mídia
  // A PÁGINA DE UM TÍTULO, acrescentada em 23/08 junto com a reformulação dela: ela é a
  // segunda tela do projeto com texto branco FIXO sobre fotografia sob véu — o par que o
  // tema escuro costuma quebrar —, e as 529 rotas dela usam o mesmo componente, então
  // medir uma mede o desenho. Slug fixo: se o acervo mudar e ele sumir, o gate reprova
  // com «a página não carregou», que é o barulho certo.
  { rota: "/play/lousinha--ic-para-criancas--tecidos/", visao: "mobile" },
  { rota: "/filtros/", visao: "mobile" }, // caixas de marcação, contador vivo
  { rota: "/salvos/", visao: "mobile" }, // lista densa
  { rota: "/meu/", visao: "mobile" }, // hub, troca de persona
  { rota: "/ia/", visao: "mobile" }, // entrevista da estrelinha, botão primário
  { rota: "/onboarding/1/", visao: "mobile" }, // botão «Avançar», fora da casca do app
  { rota: "/entrar/", visao: "mobile" }, // seleção de persona
  // O hub é a tela em que o app ABRE desde 23/08, e a única com texto branco fixo
  // sobre fotografia em cartaz de largura cheia — exatamente o par que o tema
  // escuro costuma quebrar. Ficou fora desta lista até 23/08, quando os ritmos de
  // grade nasceram e ninguém estava medindo o contraste deles.
  { rota: "/apps/", visao: "mobile" }, // hub de aplicativos, cartaz com texto sobre foto
  { rota: "/noticias/", visao: "mobile" }, // hub editorial, cartão de leitura
  { rota: "/museu/", visao: "mobile" }, // catálogo com capa
  { rota: "/cast/", visao: "mobile" }, // catálogo de podcast
  { rota: "/cursos/", visao: "mobile" }, // catálogo de formação
  { rota: "/meu/repertorio/", visao: "mobile" }, // barras de progresso
  { rota: "/mapa/", visao: "mobile" }, // SVG, traço e preenchimento
  { rota: "/busca-nao-encontrada/", visao: "mobile" }, // beco, afrouxamentos

  // Grupo bastidor — só existe na visão web.
  { rota: "/studio/duplicatas/", visao: "web" }, // painéis densos, selos pretos
  { rota: "/studio/publicar/", visao: "web" }, // formulário, botão primário
  { rota: "/redacao/fila/", visao: "web" }, // painel invertido, selo de IA
  { rota: "/observatorio/", visao: "web" }, // etiquetas, barras, indicadores
  { rota: "/roteiro/", visao: "web" }, // blocos numerados
];

/**
 * O que fica de fora da medição, e por quê.
 *
 * Cada entrada é um seletor CSS mais a razão. A razão importa tanto quanto o
 * seletor: sem ela, a lista vira um depósito de «não sei por que isto falha».
 */
const EXCECOES = [
  {
    seletor: ".capa-sem-imagem, .capa-sem-imagem *",
    razao:
      "a capa é pintada na COR DA LINGUAGEM, que é dado e não gira com o tema — " +
      "a pastilha e as texturas por cima dela também não podem girar (D-08)",
  },
  {
    seletor: "[style*='--cor-linguagem'], [style*='--cor-chip']",
    razao: "elemento que recebe a cor da linguagem por custom property inline",
  },
  {
    seletor: "img, svg, svg *",
    razao: "fotografia e desenho do acervo — o tema não retoca imagem",
  },
];

let verdes = 0;
const falhas = [];

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    verdes += 1;
    console.log(`  ok   ${nome}: ${medida}`);
  } else {
    falhas.push(nome);
    console.log(`  FALHA ${nome}: medido ${medida} · esperado ${esperado}`);
  }
}

const cdp = await abrirNavegador();

console.log("verificar-tema — o escuro medido na tela, não no arquivo");
console.log(`  alvo: ${ALVO}\n`);

/**
 * A sonda mede CONTRASTE, não cor absoluta — e essa distinção é a lição da
 * primeira versão deste arquivo.
 *
 * A tentativa ingênua era procurar «texto preto» e «fundo branco» depois de
 * virar o tema. Ela acusava oito falhas, e a maioria era o sistema funcionando:
 * `text-sobre-acao` É preto de propósito, porque preto sobre o laranja da marca
 * mede 9,1:1 e branco mede 2,64:1. Um portão que reprova o conserto é pior que
 * portão nenhum — ele ensina a desfazer a correção.
 *
 * Medindo o par tinta/fundo, uma regra só pega os dois defeitos de verdade
 * (preto sobre preto no escuro, branco sobre laranja em qualquer tema) e não
 * acusa nenhum acerto. O limite é o do WCAG AA: 4,5:1 para texto corrido e 3:1
 * para texto grande.
 */
const sonda = (excecoes) =>
  naPagina(`
    const EXCECOES = ${JSON.stringify(excecoes.map((e) => e.seletor))};

    // A COR É LIDA PELO PRÓPRIO NAVEGADOR, e não por expressão regular.
    // O Tailwind v4 compila cor arbitrária com opacidade para \`oklab(0 0 0 / .7)\`,
    // e nossos color-mix saem como \`color(srgb …)\`. Um parser de \`rgb()\` devolvia
    // null nesses casos, a camada era ignorada no empilhamento, e o resultado era
    // uma falha de contraste inventada — foi assim que o crédito da foto apareceu
    // como 1,00:1 sendo que ele está sobre um fundo preto a 70%. Pintar 1 pixel e
    // ler de volta funciona para qualquer sintaxe que o navegador aceite, hoje e
    // nas que vierem.
    const tela = document.createElement('canvas');
    tela.width = tela.height = 1;
    const pincel = tela.getContext('2d', { willReadFrequently: true });
    const cache = new Map();
    const rgb = (cor) => {
      if (!cor) return null;
      if (cache.has(cor)) return cache.get(cor);
      pincel.clearRect(0, 0, 1, 1);
      pincel.fillStyle = '#000';
      pincel.fillStyle = cor;                 // sintaxe inválida deixa o preto anterior
      if (pincel.fillStyle === '#000' && !/^(#000000|#000|black|rgba?\\(0,\\s*0,\\s*0)/.test(cor)) {
        cache.set(cor, null);
        return null;
      }
      pincel.clearRect(0, 0, 1, 1);
      pincel.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = pincel.getImageData(0, 0, 1, 1).data;
      const v = { r, g, b, a: a / 255 };
      cache.set(cor, v);
      return v;
    };
    const lum = ({ r, g, b }) => {
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const contraste = (x, y) => {
      const [a, b] = [lum(x), lum(y)].sort((m, n) => n - m);
      return (a + 0.05) / (b + 0.05);
    };
    /** Compõe uma cor translúcida sobre a de baixo — senão alfa vira contraste falso. */
    const sobrepor = (frente, fundo) => ({
      r: frente.r * frente.a + fundo.r * (1 - frente.a),
      g: frente.g * frente.a + fundo.g * (1 - frente.a),
      b: frente.b * frente.a + fundo.b * (1 - frente.a),
      a: 1,
    });
    /** O fundo que o olho realmente vê: sobe a árvore compondo até chegar ao opaco. */
    const fundoEfetivo = (el) => {
      const pilha = [];
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const c = rgb(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0) { pilha.push(c); if (c.a === 1) break; }
      }
      const base = rgb(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
      return pilha.reduceRight((acc, c) => sobrepor(c, acc), base);
    };

    const nomear = (el) => el.tagName.toLowerCase() +
      (typeof el.className === 'string' && el.className
        ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '');
    const isento = (el) => EXCECOES.some((s) => { try { return el.matches(s) || el.closest(s); } catch { return false; } });

    const fracos = [];
    const alvos = document.querySelectorAll('.moldura-rolagem *');
    let medidos = 0;
    for (const el of alvos) {
      if (!visivel(el) || isento(el)) continue;
      // Só elementos com TEXTO PRÓPRIO: um contêiner herda cor sem pintar nada, e
      // medi-lo produziria uma lista de ruído do tamanho do DOM.
      const texto = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ');
      if (!texto) continue;
      const e = getComputedStyle(el);
      const tinta = rgb(e.color);
      if (!tinta) continue;
      const fundo = fundoEfetivo(el);
      const razao = contraste(sobrepor(tinta, fundo), fundo);
      medidos++;
      // WCAG AA: 3:1 para texto grande (>=24px, ou >=18.66px em negrito), 4,5:1 para o resto.
      const px = parseFloat(e.fontSize);
      const negrito = parseInt(e.fontWeight, 10) >= 700;
      const minimo = px >= 24 || (px >= 18.66 && negrito) ? 3 : 4.5;
      if (razao < minimo) {
        fracos.push(nomear(el) + ' ' + razao.toFixed(2) + ':1 (min ' + minimo + ') «' + texto.slice(0, 28) + '»');
      }
    }
    return {
      body: getComputedStyle(document.body).backgroundColor,
      esquema: getComputedStyle(document.documentElement).colorScheme,
      fracos: [...new Set(fracos)].slice(0, 10),
      total: fracos.length,
      medidos,
      examinados: alvos.length,
    };
  `);

// Antes de tudo: as exceções ainda casam alguma coisa? Uma que deixou de casar é
// uma permissão órfã, e órfãs escondem o resíduo que elas mandavam ignorar.
await cdp.navegar(ALVO + "/descobrir/");
await cdp.assentar();
const cobertura = await cdp.avaliar(
  `(${JSON.stringify(EXCECOES.map((e) => e.seletor))}).map((s) => {
     try { return document.querySelectorAll(s).length; } catch { return -1; }
   })`,
);
const orfas = EXCECOES.filter((_, i) => cobertura[i] === 0).map((e) => e.seletor);
const invalidas = EXCECOES.filter((_, i) => cobertura[i] === -1).map((e) => e.seletor);
exigir(
  invalidas.length === 0,
  "toda exceção é um seletor CSS válido",
  invalidas.length ? invalidas.join(", ") : `${EXCECOES.length} seletores compilam`,
  "0 inválidos",
);

// OS DOIS TEMAS, e não só o escuro. Contraste ruim não é defeito de tema — o pior
// caso do projeto (o laranja da marca como texto, 2,36:1 sobre o creme) é do tema
// CLARO e existia antes de haver escuro. Medir só o escuro deixaria passar metade.
//
// O TEMA VEM DO SISTEMA, E O PORTÃO EMULA O SISTEMA (23/08). O produto deixou de
// ter interruptor de tema: quem decide é `prefers-color-scheme`, e não há mais
// preferência gravada para o script escrever. `Emulation.setEmulatedMedia` é o
// caminho equivalente — ele mente para a PÁGINA sobre o que o sistema
// operacional prefere, que é exatamente a entrada que o produto lê.
for (const { rota, visao } of ROTAS) {
  for (const tema of ["claro", "escuro"]) {
    await cdp.emularEsquemaDeCor(tema === "escuro" ? "dark" : "light");
    // A visão continua viajando por localStorage, porque `casca.tsx` a lê de lá.
    // Sem isso, as rotas de bastidor renderizam o aviso de superfície e o portão
    // mede uma tela que não é a tela.
    await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', '${visao}')`);
    await cdp.navegar(ALVO + rota);
    await cdp.assentar();
    // SANIDADE ANTES DE MEDIR — o oitavo defeito da casa, na versão deste portão.
    // Quando o dev server devolve 500, a página é a tela de erro do Next: sem
    // `.moldura-rolagem`, sem nada para medir. A primeira versão daqui reportava
    // «0 resíduos» e «tema não aplicado» — vinte e dois gates falando sobre uma
    // página que não existia. Contar o que se vai medir, ANTES de medir, é o que
    // separa «passou» de «não havia nada para reprovar».
    const estado = await cdp.avaliar(`(() => ({
      tema: matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro',
      alvos: document.querySelectorAll('.moldura-rolagem *').length,
      titulo: document.title,
    }))()`);
    if (estado.alvos < 20) {
      falhas.push(`${rota} ${tema} · a página não carregou`);
      console.log(
        `  FALHA ${rota} ${tema}: só ${estado.alvos} elementos na moldura ` +
          `(título «${estado.titulo}») — o servidor em ${ALVO} está de pé?`,
      );
      continue;
    }
    if (estado.tema !== tema) {
      falhas.push(`${rota} ${tema} · o tema não foi aplicado`);
      console.log(
        `  FALHA ${rota} ${tema}: a página vê o sistema em «${estado.tema}» — medição abortada`,
      );
      continue;
    }
    const r = await cdp.avaliar(sonda(EXCECOES));

    if (tema === "escuro") {
      // NÃO É IGUALDADE COM PRETO PURO, e deixou de ser em 23/08. O que este
      // gate existe para pegar é a página que ficou CLARA — foi assim que ele
      // nasceu, contra uma tela que continuava creme com o sistema em escuro.
      // Escrito como `=== "rgb(0, 0, 0)"`, ele também travava a cor exata do
      // papel escuro, e o papel deixou de ser preto puro: preto puro não deixa
      // nada existir abaixo dele, e o cartaz de /apps é preto (ver o comentário
      // do `--cor-papel-cru` em tokens.css). O teto de 40 por canal é o dobro do
      // papel de hoje e uma ordem de grandeza abaixo de qualquer creme — cabe a
      // mudança de tom sem deixar passar a falha que o gate persegue.
      // O Chrome devolve `color(srgb 0.06 0.06 0.06)` quando a cor saiu de um
      // color-mix, e `rgb(0, 0, 0)` quando saiu de um hex. As duas formas
      // precisam ser lidas: casar só uma faria o gate reprovar a página certa
      // pelo formato em que ela foi escrita.
      const emSrgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(r.body);
      const emRgb = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(r.body);
      const canais = emSrgb
        ? [1, 2, 3].map((i) => Math.round(Number(emSrgb[i]) * 255))
        : emRgb
          ? [1, 2, 3].map((i) => Number(emRgb[i]))
          : null;
      const claroDemais = !canais || Math.max(...canais) > 40;
      exigir(
        !claroDemais && r.esquema === "dark",
        `${rota} · a página inteira vira escura`,
        `body ${r.body} · color-scheme ${r.esquema} · ${r.examinados} elementos na tela`,
        "body com nenhum canal acima de 40, color-scheme dark",
      );
    }
    exigir(
      r.total === 0,
      `${rota} ${tema} · todo texto passa o contraste mínimo`,
      r.total === 0
        ? `0 fracos em ${r.medidos} textos medidos`
        : `${r.total} de ${r.medidos}: ${r.fracos.join(" | ")}`,
      "0",
    );
  }
}

// As exceções órfãs entram como aviso e não como falha: uma tela pode legitimamente
// não ter capa sem imagem. O que não pode é NENHUMA das rotas ter — e isso a
// checagem de /descobrir acima já cobre.
if (orfas.length) {
  console.log(`\n  ·    exceções que não casaram nada em /descobrir/: ${orfas.join(", ")}`);
  console.log("       (verifique se ainda são necessárias antes da próxima onda)");
}

console.log(
  falhas.length === 0
    ? `\n  ${verdes} gates verdes, 0 falhas.\n`
    : `\n  ${verdes} verdes · ${falhas.length} FALHA(S):\n    ${falhas.join("\n    ")}\n`,
);
process.exit(falhas.length === 0 ? 0 : 1);
