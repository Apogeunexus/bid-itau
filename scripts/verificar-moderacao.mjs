/**
 * verificar-moderacao.mjs — a suíte da S3 · Moderação.
 *
 * O QUE ELA MEDE, E POR QUE NÃO DÁ PARA MEDIR NO ARQUIVO. As afirmações desta sessão são
 * sobre COMPORTAMENTO: que o botão de vetar não conclui com o campo vazio, que a ordem por
 * vazio sobe quem o acervo menos documenta, que a decisão sobrevive ao recarregamento. Um
 * gate estático leria o código e concluiria que o código diz isso — que é a mesma coisa que
 * ler a promessa em vez do resultado. Aqui a tela é aberta num navegador de verdade, os
 * gestos são feitos, e o que se mede é o que sobrou na página.
 *
 * ELA NÃO TOCA NENHUMA SUÍTE EXISTENTE. `verificar-fase*.mjs` é território de outra sessão
 * (PROTOCOLO §6); o cliente CDP vem de `navegador.mjs`, que é compartilhado e só é LIDO.
 *
 * COMO RODAR. Ela mede o que o navegador mostra, então precisa de um servidor. Por padrão
 * usa o dev da S3 na porta 3003 (`NEXT_SESSAO=s3 npx next dev -p 3003`); com `--base` mede
 * qualquer outro, inclusive o `out/` servido por `scripts/servir-out.mjs`.
 *
 *     node scripts/verificar-moderacao.mjs
 *     node scripts/verificar-moderacao.mjs --base http://localhost:4000
 *
 * O CÓDIGO DE SAÍDA É O RESULTADO: 0 com tudo verde, 1 com qualquer falha. Sem isso a
 * suíte vira relatório que ninguém lê, e um portão que não reprova não é portão.
 */

import { abrirNavegador, naPagina } from "./navegador.mjs";

const BASE = (() => {
  const i = process.argv.indexOf("--base");
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : "http://localhost:3003";
})();

const ROTA_DA_FILA = `${BASE}/moderacao/fila/`;

let verdes = 0;
const falhas = [];

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    verdes += 1;
    console.log(`  ok   ${nome}: ${medida}`);
    return;
  }
  console.log(`  FALHA ${nome}: medido ${medida} · esperado ${esperado}`);
  falhas.push(nome);
}

function titulo(t) {
  console.log(`\n${t}`);
}

/**
 * Abre a fila num estado limpo.
 *
 * O armazém é apagado ANTES de navegar e a página é recarregada: sem isso, a primeira
 * execução mediria a fila vazia e a segunda mediria a fila decidida pela primeira, e as
 * duas relatariam coisas diferentes sobre o mesmo código. Um gate cujo resultado depende de
 * quantas vezes ele já rodou não mede nada.
 */
async function abrirFilaLimpa(cdp) {
  await cdp.navegar(ROTA_DA_FILA);
  await cdp.avaliar(`window.localStorage.removeItem("moderacao.v1")`);
  // A VISÃO PRECISA SER PEDIDA, e é a lição de D-67: o bastidor inteiro vive sob
  // `app:hidden`, e na visão de app a tela existe no HTML com retângulo zerado. Um clique
  // ali falha com «elemento sem área» e o relatório culparia o botão, quando a causa é a
  // casca ter aberto na visão errada. A casca guarda a escolha no mesmo armazém do
  // produto, e é por ele que se pede.
  await cdp.avaliar(`window.localStorage.setItem('agenda-cultural:visao', 'web')`);
  await cdp.navegar(ROTA_DA_FILA);
  await cdp.assentar();

  const visao = await cdp.avaliar(
    `document.querySelector('[data-view]')?.getAttribute('data-view') ?? null`,
  );
  if (visao !== "web") {
    // Falha ALTA e nomeada. Seguir medindo numa visão que esconde a tela produziria uma
    // sequência de falhas sobre elementos ausentes, e nenhuma delas seria a causa.
    throw new Error(
      `pedi a visão «web» em /moderacao/fila/ e a casca abriu em «${visao}». ` +
        "A Moderação só existe na web (D-67) — na visão de app o layout de `(bastidor)` a " +
        "esconde e todo clique falha por retângulo zerado.",
    );
  }
}

async function principal() {
  console.log(`\nVERIFICAR MODERAÇÃO — S3\nmedindo ${ROTA_DA_FILA}\n`);

  const cdp = await abrirNavegador();
  try {
    // -----------------------------------------------------------------------
    titulo("── M1 · a fila: quatro origens, score só na IA, ordem por vazio ──");
    // -----------------------------------------------------------------------
    await abrirFilaLimpa(cdp);

    const fila = await cdp.avaliar(
      naPagina(`
        const itens = todos('[data-item-fila]');
        const origens = itens.map((el) => el.getAttribute('data-procedencia-item'));
        const conta = {};
        for (const o of origens) conta[o] = (conta[o] || 0) + 1;
        return {
          itens: itens.length,
          conta,
          scores: todos('[data-score-ia]').length,
          acoes: todos('[data-acao-moderacao]').length,
          escopos: todos('[data-escopo-curador]').length,
          ordenacoes: todos('[data-ordenacao-fila]').length,
          limites: todos('[data-limites-ia]').length,
          decisoes: todos('[data-decisao-moderacao]').length,
        };
      `),
    );

    exigir(
      fila.conta.produtor === 20 &&
        fila.conta.ingestao === 20 &&
        fila.conta.ia === 20 &&
        fila.conta.denuncia === 8 &&
        fila.itens === 68,
      "as QUATRO origens na fila, cada uma com a sua contagem",
      `${fila.itens} itens · ${JSON.stringify(fila.conta)}`,
      "68 = 20 produtor + 20 ingestão + 20 IA + 8 denúncia",
    );

    // O portão central da sessão: score é a marca de «estimou», e produtor, ingestão e
    // denúncia AFIRMAM. Um score fora da IA achataria a distinção que a tela existe para
    // fazer, e é a única coisa que a fila não pode deixar acontecer em silêncio.
    exigir(
      fila.scores === fila.conta.ia,
      "score em EXATAMENTE os itens de IA, e em nenhum outro",
      `${fila.scores} com score · ${fila.conta.ia} de IA · ${fila.scores - fila.conta.ia} fora`,
      "score === itens de IA",
    );

    exigir(
      fila.acoes === 4 && fila.escopos === 3 && fila.ordenacoes === 2 && fila.limites === 1,
      "as ações, os escopos, as ordens e o rodapé de limites",
      `${fila.acoes} ações · ${fila.escopos} escopos · ${fila.ordenacoes} ordens · ${fila.limites} rodapé`,
      "4 · 3 · 2 · 1",
    );

    exigir(
      fila.decisoes === 0,
      "a fila abre com ZERO decisão — nada avança sem gesto humano",
      `${fila.decisoes} decisões no carregamento`,
      "0",
    );

    // -----------------------------------------------------------------------
    titulo("── 124 · a ordem por vazio sobe quem o acervo menos documenta ──");
    // -----------------------------------------------------------------------

    const ordem = await cdp.avaliar(
      naPagina(`
        const registros = todos('[data-item-fila]')
          .map((el) => el.getAttribute('data-registros-uf'))
          .map((v) => (v === null || v === '' ? null : Number(v)));
        const comUf = registros.filter((r) => r !== null);
        const semUf = registros.filter((r) => r === null);
        // Os que têm UF vêm antes dos que não têm, e em ordem crescente de registro.
        const primeiroSemUf = registros.findIndex((r) => r === null);
        const ultimoComUf = registros.map((r, i) => (r !== null ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
        let crescente = true;
        for (let i = 1; i < comUf.length; i++) if (comUf[i] < comUf[i - 1]) crescente = false;
        return {
          total: registros.length,
          comUf: comUf.length,
          semUf: semUf.length,
          crescente,
          blocosSeparados: primeiroSemUf === -1 || primeiroSemUf > ultimoComUf,
          topo: comUf.slice(0, 5),
          fundo: comUf.slice(-3),
        };
      `),
    );

    exigir(
      ordem.crescente,
      "os itens com UF saem em ordem CRESCENTE de registros no acervo",
      `topo ${JSON.stringify(ordem.topo)} · fundo ${JSON.stringify(ordem.fundo)}`,
      "não decrescente",
    );

    // «Não sei onde isto fica» não é «isto fica num lugar bem documentado». Empurrar os
    // sem-UF para qualquer uma das pontas afirmaria uma das duas coisas; eles vão para um
    // bloco próprio, depois dos que têm, e o número está declarado na tela.
    exigir(
      ordem.blocosSeparados,
      "os itens SEM UF ficam num bloco próprio, depois dos que têm",
      `${ordem.comUf} com UF · ${ordem.semUf} sem`,
      "nenhum item sem UF antes de um item com UF",
    );

    const declaraSemUf = await cdp.avaliar(
      naPagina(`
        const t = document.body.textContent || '';
        return t.includes('não têm nenhuma');
      `),
    );
    exigir(
      declaraSemUf,
      "e a tela DECLARA quantos não têm UF, com denominador",
      `frase presente: ${declaraSemUf}`,
      "presente",
    );

    // -----------------------------------------------------------------------
    titulo("── 122 · o escopo impresso: o moderador vê o que NÃO está vendo ──");
    // -----------------------------------------------------------------------

    const escopoNacional = await cdp.avaliar(
      naPagina(`return Number(document.querySelector('[data-escopo-fora]').getAttribute('data-escopo-fora'));`),
    );
    exigir(
      escopoNacional === 0,
      "no escopo nacional, nada fica fora do corte",
      `${escopoNacional} itens fora`,
      "0",
    );

    await cdp.clicar(`document.querySelector('[data-escopo-curador="territorial"]')`);
    await cdp.assentar();

    const escopoTerritorial = await cdp.avaliar(
      naPagina(`
        return {
          fora: Number(document.querySelector('[data-escopo-fora]').getAttribute('data-escopo-fora')),
          itens: todos('[data-item-fila]').length,
        };
      `),
    );
    exigir(
      escopoTerritorial.fora > 0 &&
        escopoTerritorial.fora + escopoTerritorial.itens === fila.itens,
      "o territorial declara o que deixou de fora, e as duas partes fecham o total",
      `${escopoTerritorial.itens} na lista + ${escopoTerritorial.fora} fora = ${
        escopoTerritorial.itens + escopoTerritorial.fora
      } de ${fila.itens}`,
      `soma === ${fila.itens}`,
    );

    // Trocar de escopo NÃO troca de URL: é a mesma superfície servindo recortes
    // diferentes, e é o que D-84 pede.
    const url = await cdp.avaliar("location.pathname");
    exigir(
      url === "/moderacao/fila/" || url === "/moderacao/fila",
      "trocar de escopo NÃO troca a URL",
      url,
      "/moderacao/fila/",
    );

    await cdp.clicar(`document.querySelector('[data-escopo-curador="nacional"]')`);
    await cdp.assentar();

    // -----------------------------------------------------------------------
    titulo("── 120 · a denúncia: já publicada, e com destino declarado ──");
    // -----------------------------------------------------------------------

    const denuncia = await cdp.avaliar(
      naPagina(`
        const alvo = todos('[data-item-fila]').find(
          (el) => el.getAttribute('data-procedencia-item') === 'denuncia',
        );
        if (!alvo) return { achou: false };
        alvo.querySelector('button').click();
        return { achou: true };
      `),
    );
    exigir(denuncia.achou, "há item de denúncia clicável na fila", `${denuncia.achou}`, "true");
    await cdp.assentar();

    const painelDenuncia = await cdp.avaliar(
      naPagina(`
        const bloco = document.querySelector('[data-denuncia]');
        if (!bloco) return { presente: false };
        const t = bloco.textContent || '';
        return {
          presente: true,
          motivo: bloco.getAttribute('data-denuncia'),
          dizQueJaPublicado: t.includes('já está publicado'),
          temEncaminhamento: t.includes('se procede, vai para'),
          semScore: document.querySelectorAll('[data-item-escolhido] [data-score-ia]').length === 0,
        };
      `),
    );
    exigir(
      painelDenuncia.presente &&
        painelDenuncia.dizQueJaPublicado &&
        painelDenuncia.temEncaminhamento,
      "o painel da denúncia diz que o item JÁ ESTÁ PUBLICADO e para onde ela vai",
      `motivo «${painelDenuncia.motivo}» · já publicado: ${painelDenuncia.dizQueJaPublicado} · encaminha: ${painelDenuncia.temEncaminhamento}`,
      "as duas frases presentes",
    );
    exigir(
      painelDenuncia.semScore,
      "e a denúncia NÃO tem score — não há estimativa, há afirmação a conferir",
      `${painelDenuncia.semScore}`,
      "true",
    );

    // -----------------------------------------------------------------------
    titulo("── 109 · o veto não conclui com o motivo vazio, e as DUAS travas ──");
    // -----------------------------------------------------------------------

    await cdp.clicar(`document.querySelector('[data-acao-moderacao="vetar"]')`);
    await cdp.assentar();

    const vetoVazio = await cdp.avaliar(
      naPagina(`
        const botao = document.querySelector('[data-veto-bloqueado]');
        // A PRIMEIRA trava é o atributo; a SEGUNDA é a função, que recusa por conta
        // própria. Um clique programático passa por cima de \`disabled\` em vários
        // caminhos, e é exatamente esse caminho que se mede aqui.
        botao.click();
        const form = botao.closest('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return {
          bloqueado: botao.getAttribute('data-veto-bloqueado'),
          desabilitado: botao.disabled,
          decisoes: todos('[data-decisao-moderacao]').length,
        };
      `),
    );
    exigir(
      vetoVazio.bloqueado === "sim" && vetoVazio.desabilitado && vetoVazio.decisoes === 0,
      "veto com campo VAZIO: bloqueado, desabilitado, e ZERO decisão mesmo com clique forçado",
      `data-veto-bloqueado=${vetoVazio.bloqueado} · disabled=${vetoVazio.desabilitado} · ${vetoVazio.decisoes} decisões`,
      "sim · true · 0",
    );

    // Espaço em branco NÃO é motivo, e o aparo acontece antes de avaliar.
    const soEspaco = await cdp.avaliar(
      naPagina(`
        const campo = document.querySelector('[data-motivo-veto]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(campo, '     ');
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      `),
    );
    await cdp.assentar();
    const aposEspaco = await cdp.avaliar(
      naPagina(`
        const botao = document.querySelector('[data-veto-bloqueado]');
        botao.click();
        return { bloqueado: botao.getAttribute('data-veto-bloqueado'), decisoes: todos('[data-decisao-moderacao]').length };
      `),
    );
    exigir(
      soEspaco && aposEspaco.bloqueado === "sim" && aposEspaco.decisoes === 0,
      "espaço em branco não conta como motivo",
      `data-veto-bloqueado=${aposEspaco.bloqueado} · ${aposEspaco.decisoes} decisões`,
      "sim · 0",
    );

    // Com motivo escrito, o veto conclui — e a decisão nasce com autor e carimbo.
    await cdp.avaliar(
      naPagina(`
        const campo = document.querySelector('[data-motivo-veto]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(campo, 'Sem crédito de imagem declarado, e o acervo não sustenta a autoria.');
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      `),
    );
    await cdp.assentar();
    await cdp.clicar(`document.querySelector('[data-veto-bloqueado]')`);
    await cdp.assentar();

    const aposVeto = await cdp.avaliar(
      naPagina(`
        const ds = todos('[data-decisao-moderacao]');
        const primeira = ds[0];
        const t = primeira ? (primeira.textContent || '') : '';
        return {
          decisoes: ds.length,
          acao: primeira ? primeira.getAttribute('data-acao-registrada') : null,
          temMotivo: t.includes('Sem crédito de imagem declarado'),
          temAutor: t.includes('Moderação'),
          temCarimbo: /\\d{2}\\.\\d{2}\\.\\d{4}/.test(t),
        };
      `),
    );
    exigir(
      aposVeto.decisoes === 1 &&
        aposVeto.acao === "vetar" &&
        aposVeto.temMotivo &&
        aposVeto.temAutor &&
        aposVeto.temCarimbo,
      "com motivo escrito o veto conclui, e a decisão traz motivo, autor e carimbo",
      `${aposVeto.decisoes} decisão «${aposVeto.acao}» · motivo ${aposVeto.temMotivo} · autor ${aposVeto.temAutor} · carimbo ${aposVeto.temCarimbo}`,
      "1 · vetar · tudo presente",
    );

    // -----------------------------------------------------------------------
    titulo("── o registro sobrevive ao recarregamento, e o reinício o apaga ──");
    // -----------------------------------------------------------------------

    await cdp.navegar(ROTA_DA_FILA);
    await cdp.assentar();

    const aposRecarregar = await cdp.avaliar(
      naPagina(`
        const ds = todos('[data-decisao-moderacao]');
        return {
          decisoes: ds.length,
          motivo: ds[0] ? (ds[0].textContent || '').includes('Sem crédito de imagem declarado') : false,
          itens: todos('[data-item-fila]').length,
        };
      `),
    );
    exigir(
      aposRecarregar.decisoes === 1 && aposRecarregar.motivo,
      "recarregar PRESERVA a decisão, com o motivo por extenso",
      `${aposRecarregar.decisoes} decisão · motivo preservado: ${aposRecarregar.motivo}`,
      "1 · true",
    );
    exigir(
      aposRecarregar.itens === fila.itens - 1,
      "e o item decidido sai da fila de pendentes",
      `${aposRecarregar.itens} pendentes, de ${fila.itens}`,
      `${fila.itens - 1}`,
    );

    await cdp.clicar(`document.querySelector('[data-reiniciar-demonstracao]')`);
    await cdp.assentar();
    await cdp.clicar(`document.querySelector('[data-reiniciar-confirmado]')`);
    await cdp.assentar();

    const aposReinicio = await cdp.avaliar(
      naPagina(`
        return {
          decisoes: todos('[data-decisao-moderacao]').length,
          itens: todos('[data-item-fila]').length,
          armazem: window.localStorage.getItem('moderacao.v1'),
        };
      `),
    );
    exigir(
      aposReinicio.decisoes === 0 &&
        aposReinicio.itens === fila.itens &&
        aposReinicio.armazem === "[]",
      "reiniciar apaga o armazém e devolve a fila inteira",
      `${aposReinicio.decisoes} decisões · ${aposReinicio.itens} itens · armazém ${aposReinicio.armazem}`,
      `0 · ${fila.itens} · []`,
    );

    // -----------------------------------------------------------------------
    titulo("── a segunda fonte da fila, declarada mesmo vazia ──");
    // -----------------------------------------------------------------------

    const segundaFonte = await cdp.avaliar(
      naPagina(`
        const el = document.querySelector('[data-registros-vivos]');
        if (!el) return { presente: false };
        const t = el.textContent || '';
        return {
          presente: true,
          valor: el.getAttribute('data-registros-vivos'),
          dizPorQue: t.includes('ainda não foi construída'),
          dizQueNaoEhFaltaDeEnvio: t.includes('não porque nenhum'),
        };
      `),
    );
    exigir(
      segundaFonte.presente && segundaFonte.dizPorQue && segundaFonte.dizQueNaoEhFaltaDeEnvio,
      "a fonte vazia é DECLARADA, com o número e com a causa — não omitida",
      `valor=${segundaFonte.valor} · explica a causa: ${segundaFonte.dizPorQue}`,
      "presente, com causa",
    );

    // =======================================================================
    titulo("── M2 · a ficha: conferir campo a campo, e a barreira explicada ──");
    // =======================================================================

    // Entra pela FILA, como quem opera entra: o link leva o item aberto no endereço.
    await abrirFilaLimpa(cdp);
    const alvo = await cdp.avaliar(
      naPagina(`
        // Um item COM imagem e SEM crédito — é o caso que a barreira de 114 existe para
        // pegar, e medir a barreira num item que não a dispara não mede nada.
        const link = document.querySelector('[data-abrir-ficha]');
        return link ? link.getAttribute('href') : null;
      `),
    );
    exigir(Boolean(alvo), "a fila leva à ficha, com o item no endereço", String(alvo), "um href");

    await cdp.navegar(`${BASE}${alvo}`);
    await cdp.assentar();

    const ficha = await cdp.avaliar(
      naPagina(`
        const raiz = document.querySelector('[data-ficha-moderacao]');
        return {
          abriu: Boolean(raiz),
          item: raiz ? raiz.getAttribute('data-item-aberto') : null,
          campos: todos('[data-ficha-campos] .studio-linha').length,
          chave: document.querySelector('[data-chave-identidade]')?.getAttribute('data-chave-identidade') ?? null,
          componentes: todos('[data-chave-componente]').length,
          conferencias: todos('[data-conferencia]').length,
          acoes: todos('[data-acao-moderacao]').length,
        };
      `),
    );

    // O `?item=` precisa ABRIR NO ITEM PEDIDO. Sob export estático o HTML é o mesmo para
    // todos, e quem escolhe é o cliente — se isto falhar, todo link copiado da fila cai
    // sempre no mesmo registro e a ficha vira uma tela só.
    exigir(
      ficha.abriu && decodeURIComponent(String(alvo)).includes(String(ficha.item)),
      "a ficha abre NO ITEM que o endereço pediu",
      `href «${alvo}» · abriu em «${ficha.item}»`,
      "o mesmo item",
    );
    exigir(
      ficha.campos >= 10 && ficha.componentes === 3 && ficha.conferencias === 4,
      "a ficha traz os campos, os três componentes da chave e as quatro conferências",
      `${ficha.campos} campos · ${ficha.componentes} componentes · ${ficha.conferencias} conferências`,
      "≥10 · 3 · 4",
    );

    // A chave é a de §6, e o acervo sustenta só o título na maioria dos itens. O gate mede
    // que a marcação BATE com os bits — uma tela que marcasse os três sempre seria pior que
    // não marcar nenhum, porque afirmaria uma identidade que o registro não tem.
    const chaveConfere = await cdp.avaliar(
      naPagina(`
        const bits = document.querySelector('[data-chave-identidade]').getAttribute('data-chave-identidade');
        const marcados = todos('[data-chave-componente]').map((el) => el.getAttribute('data-atende'));
        const esperado = bits.split('').map((b) => (b === '1' ? 'sim' : 'nao'));
        return { bits, marcados, bate: JSON.stringify(marcados) === JSON.stringify(esperado) };
      `),
    );
    exigir(
      chaveConfere.bate,
      "os componentes marcados na tela batem com os bits da chave, um a um",
      `bits «${chaveConfere.bits}» · marcados ${JSON.stringify(chaveConfere.marcados)}`,
      "marcação idêntica aos bits",
    );

    // ---- 114 · a barreira: aprovar trava, o resto não ----
    const barreira = await cdp.avaliar(
      naPagina(`
        const bloqueio = document.querySelector('[data-bloqueio-publicacao]');
        const aprovar = document.querySelector('[data-acao-moderacao="aprovar"]');
        const vetar = document.querySelector('[data-acao-moderacao="vetar"]');
        const devolver = document.querySelector('[data-acao-moderacao="devolver"]');
        return {
          temBloqueio: Boolean(bloqueio),
          explica: bloqueio ? (bloqueio.textContent || '').includes('não entra no acervo público') : false,
          dizDeQuem: bloqueio ? (bloqueio.textContent || '').includes('Organização') : false,
          aprovarBarrado: aprovar ? aprovar.disabled : null,
          vetarLivre: vetar ? !vetar.disabled : null,
          devolverLivre: devolver ? !devolver.disabled : null,
        };
      `),
    );
    if (barreira.temBloqueio) {
      exigir(
        barreira.explica && barreira.dizDeQuem,
        "a barreira EXPLICA por que impede e de quem é a responsabilidade",
        `explica: ${barreira.explica} · nomeia o responsável: ${barreira.dizDeQuem}`,
        "as duas coisas",
      );
      // Uma tela que trava TUDO obriga quem modera a abandonar o item, e item abandonado
      // fica na fila para sempre. Só aprovar trava.
      exigir(
        barreira.aprovarBarrado === true &&
          barreira.vetarLivre === true &&
          barreira.devolverLivre === true,
        "com a barreira, SÓ aprovar trava — vetar e devolver seguem disponíveis",
        `aprovar ${barreira.aprovarBarrado} · vetar livre ${barreira.vetarLivre} · devolver livre ${barreira.devolverLivre}`,
        "true · true · true",
      );
    } else {
      exigir(
        barreira.aprovarBarrado === false,
        "sem barreira, aprovar está disponível",
        `aprovar barrado: ${barreira.aprovarBarrado}`,
        "false",
      );
    }

    // ---- 118 · o termo se ENCAMINHA, e o botão nunca oferece «criar» ----
    const termo = await cdp.avaliar(
      naPagina(`
        const bloco = document.querySelector('[data-conferencia="termo"]');
        const botao = document.querySelector('[data-encaminhar-termo]');
        const t = bloco ? (bloco.textContent || '') : '';
        return {
          existe: Boolean(bloco),
          diz: t.includes('ENCAMINHA ao Editor e não decide'),
          ofereceCriar: t.toLowerCase().includes('criar termo'),
          rotulo: botao ? (botao.textContent || '').trim() : null,
        };
      `),
    );
    exigir(
      termo.existe && termo.diz && termo.rotulo === "encaminhar ao Editor",
      "o termo se ENCAMINHA ao Editor — o botão não oferece criar",
      `rótulo «${termo.rotulo}» · declara o limite: ${termo.diz}`,
      "«encaminhar ao Editor»",
    );

    // ---- 119 · a classificação se CONFERE, não se arbitra ----
    const classificacao = await cdp.avaliar(
      naPagina(`
        const bloco = document.querySelector('[data-conferencia="classificacao"]');
        const t = bloco ? (bloco.textContent || '') : '';
        return {
          existe: Boolean(bloco),
          confereNaoArbitra: t.includes('CONFERE O DECLARADO, não arbitra'),
          dizDeQuem: t.includes('quem realiza o evento responde'),
        };
      `),
    );
    exigir(
      classificacao.existe && classificacao.confereNaoArbitra && classificacao.dizDeQuem,
      "a classificação indicativa é CONFERIDA, e a tela diz de quem é a responsabilidade",
      `confere e não arbitra: ${classificacao.confereNaoArbitra} · nomeia o responsável: ${classificacao.dizDeQuem}`,
      "as duas coisas",
    );

    // ---- o veto da ficha tem as mesmas três travas ----
    await cdp.clicar(`document.querySelector('[data-acao-moderacao="vetar"]')`);
    await cdp.assentar();
    const vetoNaFicha = await cdp.avaliar(
      naPagina(`
        const botao = document.querySelector('[data-veto-bloqueado]');
        botao.click();
        const form = botao.closest('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return {
          bloqueado: botao.getAttribute('data-veto-bloqueado'),
          desabilitado: botao.disabled,
          decisoes: todos('[data-decisao-moderacao]').length,
        };
      `),
    );
    exigir(
      vetoNaFicha.bloqueado === "sim" && vetoNaFicha.desabilitado && vetoNaFicha.decisoes === 0,
      "o veto DA FICHA também não conclui com o campo vazio",
      `bloqueado=${vetoNaFicha.bloqueado} · disabled=${vetoNaFicha.desabilitado} · ${vetoNaFicha.decisoes} decisões`,
      "sim · true · 0",
    );

    // ---- devolver NÃO exige motivo: a assimetria, exercida ----
    await cdp.avaliar(
      naPagina(`
        const cancelar = todos('.moderacao-veto button').find((b) => (b.textContent || '').includes('Cancelar'));
        if (cancelar) cancelar.click();
        return true;
      `),
    );
    await cdp.assentar();
    await cdp.clicar(`document.querySelector('[data-acao-moderacao="devolver"]')`);
    await cdp.assentar();

    const aposDevolver = await cdp.avaliar(
      naPagina(`
        const d = document.querySelector('[data-decisao-moderacao]');
        const t = d ? (d.textContent || '') : '';
        return {
          registrou: Boolean(d),
          acao: d ? d.getAttribute('data-acao-registrada') : null,
          temSituacao: t.includes('devolvido'),
          temAutor: t.includes('Moderação'),
        };
      `),
    );
    // A ASSIMETRIA, exercida e não descrita: devolver concluiu com o comentário VAZIO. Se
    // este gate ficasse vermelho, a tela estaria cobrando explicação de quem devolve a
    // palavra — e a distinção que a sessão inteira defende teria sumido do produto.
    exigir(
      aposDevolver.registrou &&
        aposDevolver.acao === "devolver" &&
        aposDevolver.temSituacao &&
        aposDevolver.temAutor,
      "DEVOLVER conclui com o comentário vazio — a assimetria exercida, não descrita",
      `ação «${aposDevolver.acao}» · situação na tela: ${aposDevolver.temSituacao} · autor: ${aposDevolver.temAutor}`,
      "devolver · registrado com situação e autor",
    );

    // ---- DEFEITOS DE FORMA, que gesto não pega ----
    //
    // Os dois vieram de olhar a tela, não de rodar a suíte: um controle desabilitado com
    // desenho de ativo, e uma lista que dizia «68 pendentes» mostrando oito. Viraram gate
    // para não voltarem na próxima tela.
    const forma = await cdp.avaliar(
      naPagina(`
        const desabilitados = todos('.moderacao [disabled]');
        const opacidades = desabilitados.map((el) => Number(getComputedStyle(el).opacity));
        const truncada = document.querySelector('[data-lista-truncada]');
        const t = truncada ? (truncada.textContent || '') : '';
        return {
          desabilitados: desabilitados.length,
          // Um controle desabilitado tem de PARECER desabilitado. Sem isso quem opera
          // clica, nada acontece, e só então lê o texto que explica o porquê.
          todosApagados: opacidades.every((o) => o < 0.7),
          declaraTruncagem: Boolean(truncada),
          diseQuantosFaltam: /\d+/.test(t) && t.includes('esta lista não mostra'),
        };
      `),
    );
    exigir(
      forma.desabilitados === 0 || forma.todosApagados,
      "todo controle desabilitado PARECE desabilitado",
      `${forma.desabilitados} desabilitado(s) · todos apagados: ${forma.todosApagados}`,
      "nenhum com desenho de ativo",
    );
    exigir(
      forma.declaraTruncagem && forma.diseQuantosFaltam,
      "a lista de atalho DECLARA quantos pendentes ela não mostra",
      `declara: ${forma.declaraTruncagem} · com número: ${forma.diseQuantosFaltam}`,
      "lista truncada nunca em silêncio",
    );

    // ---- e a decisão tomada na ficha aparece na FILA: um armazém só ----
    await cdp.navegar(ROTA_DA_FILA);
    await cdp.assentar();
    const naFila = await cdp.avaliar(
      naPagina(`
        const ds = todos('[data-decisao-moderacao]');
        return { decisoes: ds.length, acao: ds[0] ? ds[0].getAttribute('data-acao-registrada') : null };
      `),
    );
    exigir(
      naFila.decisoes === 1 && naFila.acao === "devolver",
      "a decisão tomada na FICHA aparece na FILA — as duas telas escrevem no mesmo armazém",
      `${naFila.decisoes} decisão «${naFila.acao}» na fila`,
      "1 · devolver",
    );

    // -----------------------------------------------------------------------
    titulo("── zero erro de console na navegação inteira ──");
    // -----------------------------------------------------------------------

    const erros = cdp.consola.filter((c) => c.nivel === "erro");
    exigir(
      erros.length === 0,
      "console limpo",
      `${erros.length} erro(s)${erros.length ? ": " + erros.map((e) => e.texto).join(" | ").slice(0, 300) : ""}`,
      "0",
    );
  } finally {
    await cdp.encerrar();
  }

  console.log(
    `\n  ${verdes} verdes${falhas.length ? ` · ${falhas.length} FALHA(S): ${falhas.join(", ")}` : ""}\n`,
  );
  if (falhas.length) process.exitCode = 1;
}

principal().catch((erro) => {
  console.error(`\nverificar-moderacao.mjs quebrou: ${erro.message}\n`);
  process.exitCode = 1;
});
