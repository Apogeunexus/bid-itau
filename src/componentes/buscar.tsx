"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chip, TrilhoDeChips } from "@/componentes/base/chip";
import { CapaSemImagem } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import { useSessao } from "@/contexto/sessao";
import { DISPOSICOES } from "@/dados/disposicoes";
// A frase literal do Cenário 5 do RFP, e ela vem de `frase.ts` em vez de ser redigitada
// aqui: duas cópias de uma frase de roteiro divergem na primeira correção, e a que a banca
// leria seria a errada. `frase.ts` importa SÓ `./indice` e `./tipos`, os mesmos dois que
// este arquivo já importava — DP-F continua valendo, e nenhum caminho novo alcança
// `@/dados/grafo` (T-05-05).
//
// O QUE ESTE IMPORT CUSTA, MEDIDO E NÃO ESTIMADO: 10.311 bytes no bundle de `/buscar`.
// O empacotador NÃO sacode a árvore de `frase.ts` — o chunk da rota passou de 45.349 para
// 57.292 bytes, e `traduzir`, `regras` e `montarVizinhancaDeSemelhanca` viajam junto, sem
// serem chamados, por causa de uma constante de 51 caracteres. Cabe no orçamento de 20 KB
// deste plano e por isso fica, mas o caminho barato existe e custa ZERO byte de chunk:
// `src/app/(app)/buscar/page.tsx` é componente de SERVIDOR, e uma constante lida lá e
// passada por prop viaja no HTML da página estática, não no JavaScript. Aquele arquivo
// não é deste plano; quem o abrir a seguir deve fazer a troca.
import { FRASE_DO_CENARIO_5 } from "@/dados/frase";
import {
  consultar,
  expandirIndice,
  facetasDe,
  type CampoCriterio,
  type Criterio,
  type EntradaIndice,
  type IndiceDTO,
  type OpcaoFaceta,
} from "@/dados/indice";
import type { ClasseEntidade } from "@/dados/tipos";

/**
 * buscar.tsx — Buscar (AGEN-06, `docs/telas.md` tela 16, D-63 e D-66).
 *
 * BUSCA COMO RECURSO, NÃO COMO PROTAGONISTA. Quem chega aqui já tentou Descobrir e não
 * achou o caminho; a tela não disputa com o feed, ela atende quem tem um nome na cabeça.
 *
 * O QUE ESTA TELA PRECISA PROVAR, e o que cada parte dela faz:
 *
 * 1. D-63 — ÍNDICE ÚNICO MISTURANDO TIPOS. Um campo só, sobre as 5.092 entidades de 15
 *    classes. O resultado traz evento ao lado de verbete, artista ao lado de vídeo, e
 *    cada um com o TIPO ETIQUETADO em texto visível — não só em atributo. Uma busca que
 *    devolvesse apenas eventos transformaria a proposta numa agenda.
 *
 * 2. D-63 — SEM BIBLIOTECA DE BUSCA. `consultar` é filtro linear em memória sobre o DTO
 *    colunar que chegou por props. Nenhuma chamada de rede, nenhum serviço por trás, e a
 *    tela DIZ isso em texto de produto: a afirmação de que não há caixa preta é
 *    argumento da proposta e não anotação sobre ela.
 *
 * 3. D-66 — ZERO-RESULTADO NUNCA É BECO. Quando não há resultado, a tela lista qual
 *    critério soltar e QUANTOS resultados aquilo traria, em um toque. O site de hoje tem
 *    duas rotas de beco sem saída; este bloco é o argumento de que elas não deveriam
 *    existir.
 *
 * DP-F: este arquivo NÃO alcança `@/dados/grafo`, nem transitivamente. `@/dados/indice`
 * foi escrito de propósito sem nenhum import do grafo — o acervo entra injetado no
 * componente de servidor de `/buscar`, que monta o índice no build e passa o DTO por
 * props. `entidades.json` tem 9,4 MB e não atravessa a fronteira.
 *
 * NENHUMA POSIÇÃO ANCORADA NA JANELA neste arquivo: dentro da moldura de 390px da visão
 * app, `fixed` escaparia do telefone (D-03). O estilo mora em `src/estilos/busca.css`.
 */

// ---------------------------------------------------------------------------
// Constantes de tela
// ---------------------------------------------------------------------------

/**
 * Teto de resultados exibidos (T-03-21). Uma consulta de uma letra casa milhares de
 * entradas, e renderizar todas travaria a rolagem dentro da moldura. O TOTAL REAL é
 * declarado ao lado do recorte, como a fase 2 fixou para toda exibição cortada.
 */
const TETO_EXIBICAO = 100;

/** Quantos ids cabem na gramática de lente sem estourar a URL. O corte é declarado. */
const TETO_LENTE = 60;

/**
 * Buscas recentes em CHAVE PRÓPRIA (T-03-25). Nunca em `agenda-cultural:salvos`: o que a
 * pessoa procurou não é o que ela salvou, e misturar os dois faria o histórico de busca
 * vazar para Meu Repertório. Mesma separação que a 02-02 fez para «quero mais assim».
 */
const CHAVE_RECENTES = "agenda-cultural:buscas-recentes";
const MAX_RECENTES = 6;

/** Quantos temas a faceta mostra antes de pedir «ver todos». São 94 no vocabulário. */
const TEMAS_VISIVEIS = 10;

/**
 * Classe da ontologia → o nome que se usa em português na tela.
 *
 * `termo` é verbete da Enciclopédia e `conteudo` é matéria editorial: mostrar os nomes
 * internos da ontologia faria a etiqueta de tipo — o elemento que sustenta D-63 — pedir
 * tradução justamente de quem está vendo a tela pela primeira vez.
 */
const ROTULO_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  conteudo: "editorial",
  pessoa: "pessoa",
  midia: "mídia",
  termo: "verbete",
  territorio: "território",
  evento: "evento",
  instituicao: "instituição",
  obra: "obra",
  coletivo: "coletivo",
  espaco: "espaço",
  tema: "tema",
  formacao: "formação",
  publicacao: "publicação",
  linguagem: "linguagem",
  trilha: "trilha",
};

function rotuloDaClasse(classe: ClasseEntidade): string {
  return ROTULO_CLASSE[classe] ?? classe;
}

/**
 * As rotas de entidade que a fase 1 realmente exportou. As classes ausentes deste mapa
 * não têm rota, e por isso não recebem link: fabricar `/termo/[slug]` para o resultado
 * parecer completo produziria 404 na demonstração ao vivo, que é pior do que um resultado
 * sem link. Mesma decisão, e mesma lista, de `cartao.tsx`.
 */
const ROTA_POR_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  evento: "/evento",
  pessoa: "/artista",
  coletivo: "/artista",
  obra: "/obra",
  instituicao: "/produtor",
  espaco: "/produtor",
  trilha: "/trilha",
};

const ROTULO_CAMPO: Record<CampoCriterio, string> = {
  texto: "texto",
  classe: "tipo",
  linguagem: "linguagem",
  tema: "tema",
  procedencia: "procedência",
  territorio: "território",
};

// ---------------------------------------------------------------------------
// Ajudantes puros
// ---------------------------------------------------------------------------

/**
 * Milhar com ponto, à mão.
 *
 * `toLocaleString` é proibido aqui: sob `output: "export"` o HTML nasce no build e é
 * hidratado no navegador do avaliador, e se as duas pontas tiverem ICU diferente o
 * número renderizado diverge — o React acusa a divergência no console, e o gate de
 * console limpo cai por causa de um separador de milhar.
 */
function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Fatia o título em pedaços casados e não casados, para destacar o casamento.
 *
 * FATIAMENTO DE STRING, NUNCA MARCAÇÃO INJETADA (T-03-23). O texto digitado é entrada não
 * confiável; ele volta ao DOM como nó de texto do React e em lugar nenhum como HTML.
 *
 * O casamento do destaque é literal e sem acento removido, enquanto o casamento da BUSCA
 * é normalizado. A diferença é deliberada: o índice acha «São Paulo» a partir de «sao
 * paulo», mas mapear a posição de volta exigiria reconstruir o deslocamento que a
 * decomposição NFD introduz. Na dúvida o destaque não pinta nada — errar para menos num
 * realce é inofensivo, errar para mais pintaria o pedaço errado do título.
 */
function pedacos(titulo: string, texto: string): Array<{ t: string; casa: boolean }> {
  const termo = texto.trim();
  if (!termo) return [{ t: titulo, casa: false }];
  const alvo = titulo.toLowerCase();
  const agulha = termo.toLowerCase();
  const saida: Array<{ t: string; casa: boolean }> = [];
  let cursor = 0;
  for (;;) {
    const i = alvo.indexOf(agulha, cursor);
    if (i < 0) break;
    if (i > cursor) saida.push({ t: titulo.slice(cursor, i), casa: false });
    saida.push({ t: titulo.slice(i, i + agulha.length), casa: true });
    cursor = i + agulha.length;
  }
  if (!saida.length) return [{ t: titulo, casa: false }];
  if (cursor < titulo.length) saida.push({ t: titulo.slice(cursor), casa: false });
  return saida;
}

/** Chave de identidade de um critério, para marcar, desmarcar e comparar. */
function chaveCriterio(criterio: { campo: CampoCriterio; valor: string }): string {
  return `${criterio.campo}:${criterio.valor}`;
}

// ---------------------------------------------------------------------------
// O hash desta rota, e a gramática de lente do mapa
// ---------------------------------------------------------------------------

/**
 * O estado da busca espelhado no hash de `/buscar/`: `q` texto, `f` facetas marcadas.
 *
 * É o que faz a ida ao mapa e a volta não perderem o recorte — o endereço de volta que
 * viaja na chave `v` da lente é esta rota MAIS este hash.
 */
function escreverHash(texto: string, criterios: Criterio[]): string {
  const partes: string[] = [];
  if (texto.trim()) partes.push(`q=${encodeURIComponent(texto.trim())}`);
  if (criterios.length) {
    partes.push(`f=${criterios.map((c) => `${c.campo}:${c.valor}`).join("~")}`);
  }
  return partes.length ? `#${partes.join("&")}` : "";
}

/**
 * Lê o hash de volta, VALIDANDO cada faceta contra as facetas do DTO (T-03-22).
 *
 * O hash é controlado por quem digita a URL. Valor desconhecido é DESCARTADO e a
 * quantidade de descartes é declarada na tela — silenciar o descarte faria a pessoa ver
 * um recorte diferente do que pediu sem nenhum sinal, que é o defeito que
 * `personaIdValido` fechou na 02-01.
 */
function lerHash(
  hash: string,
  conhecidas: Map<string, OpcaoFaceta>,
): { texto: string; criterios: Criterio[]; descartados: number } {
  const bruto = hash.startsWith("#") ? hash.slice(1) : hash;
  let texto = "";
  const criterios: Criterio[] = [];
  let descartados = 0;

  for (const parte of bruto.split("&")) {
    const igual = parte.indexOf("=");
    if (igual < 0) continue;
    const chave = parte.slice(0, igual);
    const valor = parte.slice(igual + 1);
    if (chave === "q") {
      try {
        texto = decodeURIComponent(valor);
      } catch {
        descartados += 1;
      }
    } else if (chave === "f") {
      for (const ficha of valor.split("~")) {
        if (!ficha) continue;
        const opcao = conhecidas.get(ficha);
        if (!opcao) {
          descartados += 1;
          continue;
        }
        criterios.push({ campo: opcao.campo, valor: opcao.valor, rotulo: opcao.rotulo });
      }
    }
  }
  return { texto, criterios, descartados };
}

// ---------------------------------------------------------------------------
// O componente
// ---------------------------------------------------------------------------

export function Buscar({ indice }: { indice: IndiceDTO }) {
  const { definirDisposicoes } = useSessao();

  const [texto, setTexto] = useState("");
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [recentes, setRecentes] = useState<string[]>([]);
  const [descartados, setDescartados] = useState(0);
  const [lidoDoHash, setLidoDoHash] = useState(false);
  const [todosOsTemas, setTodosOsTemas] = useState(false);

  /** Todas as opções de faceta do índice, por `campo:valor`. Valida o hash e nomeia. */
  const conhecidas = useMemo(() => {
    const mapa = new Map<string, OpcaoFaceta>();
    for (const grupo of Object.values(indice.facetas)) {
      for (const opcao of grupo) mapa.set(chaveCriterio(opcao), opcao);
    }
    return mapa;
  }, [indice]);

  // Leitura do hash e do histórico. Mora em efeito, e não no estado inicial, porque sob
  // `output: "export"` o HTML nasce no build: ler `location` no primeiro render divergiria
  // da hidratação. Mesmo padrão de `sessao.tsx`.
  useEffect(() => {
    const lido = lerHash(window.location.hash, conhecidas);
    setTexto(lido.texto);
    setCriterios(lido.criterios);
    setDescartados(lido.descartados);
    try {
      const bruto = window.localStorage.getItem(CHAVE_RECENTES);
      const valor: unknown = bruto ? JSON.parse(bruto) : [];
      setRecentes(
        Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [],
      );
    } catch {
      setRecentes([]);
    }
    setLidoDoHash(true);
  }, [conhecidas]);

  // Espelho do estado no hash. `replaceState` e não navegação: digitar NÃO pode trocar de
  // rota — a tela filtra em memória, e `/buscar/` continua sendo `/buscar/`.
  useEffect(() => {
    if (!lidoDoHash) return;
    const novo = escreverHash(texto, criterios);
    const atual = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", `${atual}${novo}`);
  }, [texto, criterios, lidoDoHash]);

  const registrarRecente = useCallback((termo: string) => {
    const limpo = termo.trim();
    if (limpo.length < 2) return;
    setRecentes((atual) => {
      const proxima = [limpo, ...atual.filter((r) => r !== limpo)].slice(0, MAX_RECENTES);
      try {
        window.localStorage.setItem(CHAVE_RECENTES, JSON.stringify(proxima));
      } catch {
        // Storage bloqueado: o histórico é conveniência, não requisito.
      }
      return proxima;
    });
  }, []);

  const alternarCriterio = useCallback((opcao: OpcaoFaceta | Criterio) => {
    const chave = chaveCriterio(opcao);
    setCriterios((atual) =>
      atual.some((c) => chaveCriterio(c) === chave)
        ? atual.filter((c) => chaveCriterio(c) !== chave)
        : [...atual, { campo: opcao.campo, valor: opcao.valor, rotulo: opcao.rotulo }],
    );
  }, []);

  const ativa = texto.trim().length > 0 || criterios.length > 0;

  // A CONSULTA. Filtro em memória sobre o DTO recebido por props — nenhuma travessia de
  // grafo no navegador, nenhuma chamada de rede, nenhuma biblioteca de busca (D-63).
  const resposta = useMemo(
    () => (ativa ? consultar({ texto, criterios, limite: TETO_EXIBICAO }, indice) : null),
    [ativa, texto, criterios, indice],
  );

  // As facetas recontadas contra o recorte em curso: a contagem que a opção mostra é
  // exatamente quantos resultados ela devolve se for marcada.
  const facetas = useMemo(
    () => facetasDe({ texto, criterios }, indice),
    [texto, criterios, indice],
  );

  const marcados = useMemo(
    () => new Set(criterios.map((c) => chaveCriterio(c))),
    [criterios],
  );

  // A VITRINE do estado inicial (reformulação 2026-08: a busca vira índice de acervo,
  // não campo vazio). Duas entradas por classe navegável, preferindo as que declaram
  // linguagem — é a linguagem que dá cor à capa (D-08). Ordem do índice, determinística.
  const vitrine = useMemo(() => {
    const porClasse = new Map<ClasseEntidade, EntradaIndice[]>();
    for (const preferir of [true, false]) {
      for (const e of expandirIndice(indice)) {
        if (!ROTA_POR_CLASSE[e.classe]) continue;
        if (preferir && e.linguagens.length === 0) continue;
        const lista = porClasse.get(e.classe) ?? [];
        if (lista.length < 2 && !lista.some((x) => x.chave === e.chave)) lista.push(e);
        porClasse.set(e.classe, lista);
      }
    }
    return [...porClasse.values()].flat().slice(0, 12);
  }, [indice]);

  // --- a gramática de lente do mapa (D-59) --------------------------------
  // Três chaves, escritas igual nos planos 03-01, 03-03 e 03-04: `r` os ids do recorte
  // juntados por `~`, `t` o título legível, `v` o endereço de volta — que inclui o hash
  // desta tela, para o recorte sobreviver à ida e à volta.
  const idsLente = (resposta?.resultados ?? []).slice(0, TETO_LENTE).map((r) => r.chave);
  const tituloLente = ativa
    ? [texto.trim() ? `«${texto.trim()}»` : "", ...criterios.map((c) => c.rotulo)]
        .filter(Boolean)
        .join(" · ")
    : "sem recorte";
  const volta = `/buscar/${escreverHash(texto, criterios)}`;
  const lente = `/mapa/#r=${idsLente.join("~")}&t=${encodeURIComponent(tituloLente)}&v=${encodeURIComponent(volta)}`;

  const total = resposta?.total ?? 0;
  const exibidos = resposta?.resultados.length ?? 0;

  return (
    // `desk:max-w-6xl` e não `5xl`: a moldura da visão web já é `max-w-6xl` em `casca.tsx`,
    // e com o teto de 5xl a coluna de facetas de 20rem deixaria 616px para os resultados —
    // duas colunas de 296px, estreitas demais para o título mais a etiqueta de tipo mais os
    // selos de linguagem. Com 1.088px úteis sobram 744px, que dão dois resultados de 360px.
    <div className="flex flex-col gap-4 p-5 desk:mx-auto desk:max-w-6xl desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Buscar</h1>
        </div>

        {/* O QUE ESTA FRASE PRECISA DIZER é o que a pessoa ganha: um campo só
            para tudo. A versão anterior dizia «um índice único do grafo … roda no
            seu navegador, em memória: não há serviço de busca por trás» — três
            afirmações de arquitetura na primeira linha de uma tela de busca. Quem
            usa quer saber que
            procurar «Lygia Clark» acha a artista, a obra e o verbete de uma vez. */}
        <p className="text-sm leading-snug">
          Uma busca só para o acervo inteiro: eventos, artistas, obras, vídeos e verbetes
          aparecem no mesmo resultado, cada um com o seu tipo.
        </p>

      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 1. O campo único                                                    */}
      {/* ------------------------------------------------------------------ */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          registrarRecente(texto);
        }}
      >
        <label className="sr-only" htmlFor="busca-campo">
          Buscar no acervo
        </label>
        <input
          id="busca-campo"
          className="busca-campo"
          type="search"
          autoFocus
          autoComplete="off"
          placeholder="bienal, teatro, Belém, Lygia Clark…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => registrarRecente(texto)}
        />
      </form>

      {/* Critérios marcados: fichas visíveis e removíveis, cada uma dizendo quantos
          resultados haveria SEM ela (D-64). É a informação que o plano 03-06 usa para
          recalcular ao vivo quando a pessoa tira uma ficha. */}
      {criterios.length ? (
        <section className="flex flex-col gap-1.5">
          <p className="busca-bloco-titulo">critérios marcados · toque para tirar</p>
          <TrilhoDeChips rotulo="Critérios marcados">
            {criterios.map((criterio) => (
              // O «sem ela: 340» saiu daqui. Era o número do que a tela mostraria
              // se este critério fosse retirado — informação útil UMA vez, e ruído
              // quando repetida em cada chip de uma fileira. Quem quer saber o
              // efeito de tirar um critério tira: a contagem do resultado responde.
              <Chip
                key={chaveCriterio(criterio)}
                selecionado
                data-faceta={chaveCriterio(criterio)}
                onClick={() => alternarCriterio(criterio)}
              >
                <span className="tipo-micro opacity-70">{ROTULO_CAMPO[criterio.campo]}</span>{" "}
                {criterio.rotulo} <span aria-hidden>×</span>
              </Chip>
            ))}
          </TrilhoDeChips>
        </section>
      ) : null}

      {descartados > 0 ? (
        <p className="text-sm leading-snug text-tinta-2">
          {descartados === 1
            ? "Um critério do endereço não existe neste índice e foi descartado."
            : `${milhar(descartados)} critérios do endereço não existem neste índice e foram descartados.`}{" "}
          O recorte abaixo é o que sobrou — preferimos dizer isso a mostrar um recorte
          diferente do que foi pedido.
        </p>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* O CORPO DA TELA — uma coluna na visão app, DUAS na web (D-80)       */}
      {/* ------------------------------------------------------------------ */}
      {/* Na visão app este invólucro é o `flex flex-col gap-4` que as classes dizem, e os
          dois filhos empilham na ordem em que estão no DOM: resultados e, abaixo, as
          facetas — exatamente a tela que a fase 3 deixou, com o mesmo respiro entre as
          seções, porque cada coluna repete o `gap-4` do contêiner que as continha.

          Na web, `.web-duas-colunas` de `web.css` transforma o mesmo elemento em grade e
          `web-buscar.css` põe as FACETAS NA COLUNA 1 e os resultados na 2. Nada disso é
          decidido em JavaScript: não há um `if (visao === "web")` neste arquivo, e não
          pode haver — a visão só é conhecida depois de ler o `localStorage`, e ramificar
          por ela renderizaria no servidor uma árvore diferente da do navegador.

          A ORDEM DO DOM É DE PROPÓSITO E É A DA FASE 3. Bastaria trocar os dois filhos de
          lugar para as facetas caírem à esquerda sem uma linha de CSS — e isso mudaria a
          ordem de leitura da visão app, onde as facetas vêm depois dos resultados desde
          que a tela existe. Assim, quem navega por teclado ou por leitor de tela ouve a
          mesma sequência nas duas visões, e quem enxerga vê a coluna à esquerda na web. */}
      <div className="busca-corpo web-duas-colunas flex flex-col gap-4">
        <div data-coluna-resultados="sim" className="flex min-w-0 flex-col gap-4">
          {/* A TRADUÇÃO DA BUSCA EM LINGUAGEM NATURAL, SEMPRE VISÍVEL NA WEB (tela 28).

              Na visão app o convite para `/buscar/frase/` mora no bloco «antes de digitar»
              e some assim que se digita, porque dentro da moldura de 390px cada bloco
              permanente é altura roubada do primeiro resultado. Na web não há esse aperto:
              a tradução da frase é uma das duas coisas que a tela 28 pede à vista o tempo
              todo, e ela fica — com a frase do Cenário 5 escrita por extenso, e não só com
              o convite, porque é a frase que mostra o que «traduzir» quer dizer.

              É UM SEGUNDO BLOCO, e não o mesmo movido de lugar: mover o de lá para cá
              mudaria a visão app, que tem de continuar como a fase 3 a deixou. Quem some
              em cada visão é a caixa, por CSS, em `web-buscar.css` — nunca as duas juntas,
              nunca nenhuma. */}
          <section data-frase-natural="sim" className="web-painel">
            <p className="web-painel-titulo">não sabe o nome do que procura?</p>
            <p className="text-sm leading-snug">
              Descreva com uma frase — <strong>«{FRASE_DO_CENARIO_5}»</strong> — e ela vira{" "}
              <strong>critérios visíveis e editáveis</strong>, um a um, com o que não foi
              entendido dito na cara: não é uma resposta de chatbot.
            </p>
            <Chip href="/buscar/frase/" className="w-fit font-semibold">
              <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0 text-acao-tinta" />
              traduzir esta frase em critérios
            </Chip>
          </section>
          {/* ------------------------------------------------------------------ */}
          {/* 2. Antes de digitar — o estado que a banca vê primeiro              */}
          {/* ------------------------------------------------------------------ */}
          {!ativa ? (
            <div className="flex flex-col gap-3">
              {/* AS SEÇÕES DO ACERVO — o pedido do cliente na reformulação de 2026-08: a
                  busca abre como um índice de blog, com as seções selecionáveis e a
                  contagem REAL de cada uma. Marcar uma seção é marcar o critério de
                  classe: o mesmo mecanismo de faceta de sempre, só que na porta. */}
              <section className="busca-bloco">
                <p className="busca-bloco-titulo">explore por seção</p>
                {/* A contagem FICA aqui, e sai dos filtros abaixo. A diferença não é
                    de gosto: numa lista de seções o número é o conteúdo — «quantas
                    exposições existem» é a pergunta que a seção responde. Num chip
                    de filtro ele é o mesmo dado repetido dez vezes ao lado de algo
                    que o usuário já vai medir no resultado. */}
                <TrilhoDeChips rotulo="Explorar por seção do acervo">
                  {facetas.classe.map((opcao) => (
                    <Chip
                      key={chaveCriterio(opcao)}
                      data-faceta={chaveCriterio(opcao)}
                      onClick={() => alternarCriterio(opcao)}
                      contagem={milhar(opcao.n)}
                    >
                      {opcao.rotulo}
                    </Chip>
                  ))}
                </TrilhoDeChips>
              </section>

              {/* A VITRINE: cartões reais do índice com a capa na cor da linguagem —
                  a aparência dominante do produto (M-6), sem custo novo de bytes. */}
              <section className="busca-bloco">
                <p className="busca-bloco-titulo">uma amostra do acervo</p>
                <div className="grid grid-cols-2 gap-3 desk:grid-cols-3">
                  {vitrine.map((entrada) => (
                    <Link
                      key={entrada.chave}
                      href={`${ROTA_POR_CLASSE[entrada.classe]}/${entrada.slug}/`}
                      className="flex flex-col gap-1.5 no-underline"
                    >
                      <CapaSemImagem
                        titulo={entrada.titulo}
                        classe={entrada.classe}
                        linguagens={entrada.linguagens}
                        className="aspect-square w-full rounded-p"
                      />
                      <span className="line-clamp-2 text-sm leading-snug font-semibold">
                        {entrada.titulo}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="busca-bloco">
                <p className="busca-bloco-titulo">em vez de buscar, deixe levar</p>
                <p className="text-sm leading-snug">
                  Disposição não é critério de busca: ela <strong>pondera a caminhada</strong> de
                  Descobrir. Tocar leva para lá com a disposição já marcada.
                </p>
                <TrilhoDeChips rotulo="Ir para Descobrir com uma disposição marcada">
                  {DISPOSICOES.map((disposicao) => (
                    <Chip
                      key={disposicao.id}
                      href="/descobrir/"
                      onClick={() => definirDisposicoes([disposicao.id])}
                    >
                      {disposicao.rotulo}
                    </Chip>
                  ))}
                </TrilhoDeChips>
              </section>

              <section className="busca-bloco">
                <p className="busca-bloco-titulo">atalhos por linguagem</p>
                <TrilhoDeChips rotulo="Atalhos por linguagem artística">
                  {facetas.linguagem.slice(0, 12).map((opcao) => (
                    <Chip
                      key={chaveCriterio(opcao)}
                      data-faceta={chaveCriterio(opcao)}
                      cor={opcao.cor ?? "--ic-preto"}
                      onClick={() => alternarCriterio(opcao)}
                    >
                      {opcao.rotulo}
                    </Chip>
                  ))}
                </TrilhoDeChips>
              </section>

              <section className="busca-bloco">
                <p className="busca-bloco-titulo">buscas recentes</p>
                {recentes.length ? (
                  <TrilhoDeChips rotulo="Buscas recentes">
                    {recentes.map((termo) => (
                      <Chip key={termo} onClick={() => setTexto(termo)}>
                        {termo}
                      </Chip>
                    ))}
                  </TrilhoDeChips>
                ) : (
                  <p className="text-sm leading-snug text-tinta-2">
                    Você ainda não buscou nada neste navegador.
                  </p>
                )}
                <p className="text-xs leading-snug text-tinta-2">
                  O histórico fica só neste navegador, em chave própria, e não vai para lugar
                  nenhum — nem para os salvos.
                </p>
              </section>

              {/* O convite da fase 3, intacto — e some na WEB, onde o bloco permanente
                  `[data-frase-natural]` já diz a mesma coisa com a frase por extenso e
                  sem depender de a busca estar vazia. Dois convites para a mesma tela na
                  mesma página seriam ruído; quem some é a caixa, por CSS. */}
              <section data-convite-frase="app" className="busca-bloco">
                <p className="busca-bloco-titulo">não sabe o nome do que procura?</p>
                <p className="text-sm leading-snug">
                  Descreva com uma frase — «algo parecido com a Bienal, gratuito e perto de mim» —
                  e a frase vira <strong>critérios visíveis e editáveis</strong>, não uma resposta
                  de chatbot.
                </p>
                <Chip href="/buscar/frase/" className="w-fit font-semibold">
                  <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0 text-acao-tinta" />
                  buscar por frase
                </Chip>
              </section>
            </div>
          ) : null}

          {/* ------------------------------------------------------------------ */}
          {/* 3. Resultados misturando tipos, com o tipo etiquetado (D-63)        */}
          {/* ------------------------------------------------------------------ */}
          {ativa && resposta ? (
            // `data-resultados-total` e `data-resultados-exibidos` deixam o corte de exibição
            // MEDÍVEL de fora: a fase 2 fixou que todo recorte declara o total, e uma frase em
            // texto só prova isso para quem lê. Com os dois números no DOM, o roteiro por
            // clique confere que o afrouxamento entrega exatamente o número que prometeu,
            // mesmo quando a lista mostrada para no teto de exibição.
            <section
              className="flex flex-col gap-2"
              data-resultados-total={total}
              data-resultados-exibidos={exibidos}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-sm font-semibold">
                  {total === 0
                    ? "Nenhum resultado"
                    : exibidos < total
                      ? `Mostrando ${milhar(exibidos)} de ${milhar(total)} resultados`
                      : `${milhar(total)} resultado${total > 1 ? "s" : ""}`}
                </p>
                {total > 0 ? (
                  <p className="text-sm text-tinta-2">
                    em{" "}
                    {Object.entries(resposta.porClasse)
                      .sort((a, b) => b[1] - a[1])
                      .map(([classe, n]) => `${rotuloDaClasse(classe as ClasseEntidade)} ${n}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>

              {total > 0 ? (
                <>
                  {/* Na web a lista vira grade de duas colunas (D-80: densidade). O
                      `flex flex-col` continua e continua valendo na visão app; na web
                      `.web-grade` ganha por ser regra fora de camada, e os utilitários do
                      Tailwind moram em `@layer utilities`. Cada resultado segue com a
                      capa desenhada e a etiqueta de tipo que a fase 3 pôs — e segue SEM
                      `<Cartao>`: 03-04 registrou por escrito que um resultado de busca não
                      chegou por aresta nenhuma, e carimbar nele um motivo composto
                      afirmaria uma relação que não existe (T-05-07). */}
                  <ul
                    data-grade-resultados="sim"
                    className="web-grade flex list-none flex-col gap-2 p-0"
                  >
                    {resposta.resultados.map((resultado) => {
                      const base = ROTA_POR_CLASSE[resultado.classe];
                      const rota = base ? `${base}/${resultado.slug}/` : null;
                      const etiqueta = (
                        <span className="busca-tipo" data-tipo-rotulo>
                          {rotuloDaClasse(resultado.classe)}
                        </span>
                      );
                      const titulo = (
                        <span className="text-base leading-snug font-bold">
                          {pedacos(resultado.titulo, texto).map((pedaco, i) => (
                            <span key={i} className={pedaco.casa ? "busca-casamento" : undefined}>
                              {pedaco.t}
                            </span>
                          ))}
                        </span>
                      );

                      return (
                        <li
                          key={resultado.chave}
                          className="busca-resultado"
                          data-resultado={resultado.chave}
                          data-tipo={resultado.classe}
                        >
                          {/* A capa desenhada de `<CapaSemImagem>`: o índice carrega se a
                              entidade TEM imagem local, mas não o caminho dela — a imagem não
                              viaja sem o crédito, e caminho mais crédito somam 108 KB medidos
                              num orçamento de 480 KB. A imagem com crédito continua na página
                              da entidade, que é onde ela é argumento. */}
                          <CapaSemImagem
                            titulo={resultado.titulo}
                            classe={resultado.classe}
                            linguagens={resultado.linguagens}
                            className="size-14 shrink-0 rounded-lg"
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {etiqueta}
                              {resultado.territorioRotulo ? (
                                <span className="text-xs text-tinta-2">
                                  {resultado.territorioRotulo}
                                </span>
                              ) : null}
                              {resultado.temImagem ? (
                                <span className="text-xs text-tinta-3">com imagem no acervo</span>
                              ) : null}
                            </div>
                            {rota ? (
                              <Link href={rota} className="no-underline">
                                {titulo}
                              </Link>
                            ) : (
                              titulo
                            )}
                            {resultado.linguagens.length ? (
                              <SelosDeLinguagem ids={resultado.linguagens} limite={2} />
                            ) : null}
                            {!rota ? (
                              <span className="text-xs text-tinta-3">
                                sem página própria 
                              </span>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {exibidos < total ? (
                    <p className="text-sm leading-snug text-tinta-2">
                      A lista mostra {milhar(exibidos)} de {milhar(total)}. O corte é de exibição —
                      as contagens acima e as facetas ao lado são sobre os {milhar(total)}.
                    </p>
                  ) : null}
                </>
              ) : null}

              {/* -------------------------------------------------------------- */}
              {/* 4. Zero-resultado, e ele nunca é beco (D-66)                    */}
              {/* -------------------------------------------------------------- */}
              {total === 0 ? (
                <section className="flex flex-col gap-2">
                  <p className="text-sm leading-snug">
                    Nenhuma das {milhar(indice.total)} entradas casa com{" "}
                    <strong>{tituloLente}</strong>. Isto não é um beco: abaixo está{" "}
                    <strong>qual critério soltar</strong> e quantos resultados aquilo traria.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {resposta.afrouxamentos.map((afrouxamento) => (
                      <button
                        key={`${afrouxamento.tipo}:${chaveCriterio(afrouxamento)}`}
                        type="button"
                        className="busca-afrouxamento"
                        data-afrouxamento={afrouxamento.campo}
                        data-afrouxamento-n={afrouxamento.resultados}
                        onClick={() => {
                          setTexto(afrouxamento.consulta.texto ?? "");
                          setCriterios(afrouxamento.consulta.criterios ?? []);
                        }}
                      >
                        <Grafismo
                          variacao="barra"
                          className="h-3.5 w-auto shrink-0 text-acao-tinta"
                        />
                        <span>{afrouxamento.rotulo}</span>
                        <span className="busca-afrouxamento-n">
                          {milhar(afrouxamento.resultados)} resultado
                          {afrouxamento.resultados > 1 ? "s" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>
          ) : null}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* A COLUNA DE FACETAS — permanente na web, seção empilhada no app     */}
        {/* ------------------------------------------------------------------ */}
        {/* D-80: na web não se troca de tela para filtrar. O recorte e o resultado ficam
            à vista ao mesmo tempo, que é a diferença entre filtrar e navegar — e a coluna
            acompanha a rolagem por `.web-coluna-fixa`, que a cola no topo e a faz rolar
            POR DENTRO. Sem esse rolar por dentro, uma coluna com cinco campos de faceta
            ficaria mais alta que a janela e o pé dela seria inalcançável: coluna colada
            nunca rola para revelar o próprio fim.

            NA VISÃO APP NADA DISTO EXISTE. `.web-coluna-fixa` é escrita inteira sob
            `[data-view="web"]`, então aqui o `div` é uma caixa de bloco comum e as
            facetas seguem sendo a seção empilhada de sempre, no mesmo lugar. */}
        <div data-coluna-facetas="sim" className="web-coluna-fixa flex flex-col gap-4">
          {/* ------------------------------------------------------------------ */}
          {/* 5. Facetas derivadas da ontologia                                   */}
          {/* ------------------------------------------------------------------ */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="busca-bloco-titulo">recortar</p>
              {/* «As facetas saem da própria ontologia — classe, linguagem, tema,
                  procedência e território da entidade» era a lista dos CAMPOS do
                  modelo de dados, dita a quem só queria filtrar. O que a pessoa
                  precisa saber é a promessa: o número ao lado é o resultado real,
                  e não há caminho que leve a nada. Os títulos de cada trilho já
                  dizem por que se está recortando. */}
              <p className="text-sm leading-snug text-tinta-2">
                O número ao lado de cada opção é quanto ela devolve agora. Nenhuma leva a
                zero resultado — as que levariam não aparecem.
              </p>
            </div>

            {/* A PORTA PARA `/filtros/`, E O QUE ELA DIZ IMPORTA MAIS QUE ELA EXISTIR.
                As facetas acima saem da ontologia e recortam o índice; a acessibilidade
                não está entre elas, e a razão não é esquecimento — ela é CRITÉRIO DE
                PRIMEIRA CLASSE (D-91) e mora numa tela que sabe distinguir «declarado
                ausente» de «não declarado», distinção que uma ficha de faceta com um
                número ao lado não comporta.

                `/filtros/` é criada pelo plano 05-06, nesta mesma onda, e NÃO EXISTE
                enquanto este arquivo é escrito. O export estático não valida href interno
                e o build não quebra; quem prova que o link resolve é o gate de 05-08. É
                link para frente, do mesmo tipo que a fase 2 fez para `/trilha/[slug]`.

                Ele fica FORA da visão app por CSS: a porta de entrada de Filtros no app é
                de 05-06, e abrir uma segunda aqui empurraria a tela que a fase 3 congelou. */}
            <Chip href="/filtros/" data-link-filtros="sim" className="w-fit font-semibold">
              <Grafismo
                variacao="barra"
                className="h-3.5 w-auto shrink-0 text-acao-tinta"
              />
              filtrar por acessibilidade — as 8 dimensões como critério, não como selo
            </Chip>

            <BlocoFaceta
              titulo="tipo"
              opcoes={facetas.classe}
              marcados={marcados}
              rotulo={(valor) => rotuloDaClasse(valor as ClasseEntidade)}
              aoTocar={alternarCriterio}
            />
            <BlocoFaceta titulo="linguagem" opcoes={facetas.linguagem.slice(0, 12)} marcados={marcados} aoTocar={alternarCriterio} />
            <BlocoFaceta
              titulo="tema"
              opcoes={todosOsTemas ? facetas.tema : facetas.tema.slice(0, TEMAS_VISIVEIS)}
              marcados={marcados}
              aoTocar={alternarCriterio}
              rodape={
                facetas.tema.length > TEMAS_VISIVEIS ? (
                  <button
                    type="button"
                    className="w-fit text-xs font-semibold text-acao-tinta underline underline-offset-2"
                    onClick={() => setTodosOsTemas((v) => !v)}
                  >
                    {todosOsTemas
                      ? "mostrar menos temas"
                      : `ver os ${milhar(facetas.tema.length)} temas`}
                  </button>
                ) : null
              }
            />
            <BlocoFaceta titulo="procedência" opcoes={facetas.procedencia} marcados={marcados} aoTocar={alternarCriterio} />
            <BlocoFaceta
              titulo="território"
              opcoes={facetas.territorio.slice(0, 12)}
              marcados={marcados}
              aoTocar={alternarCriterio}
              rodape={
                <p className="text-xs leading-snug text-tinta-2">
                  {milhar(indice.diagnostico.comTerritorioBrasileiro)} das {milhar(indice.total)}{" "}
                  entradas estão situadas num estado brasileiro. O território vem da hierarquia
                  `situado_em` do acervo, não de um campo de endereço.
                </p>
              }
            />

            {/* T-03-24: a gratuidade NÃO é oferecida, e o motivo fica na tela. Um filtro que
                não filtra e não avisa faria quem avalia concluir que o acervo é todo gratuito. */}
            <p className="text-sm leading-snug text-tinta-2">
              <strong>Não há faceta de gratuidade</strong>, e o motivo é do dado: as 2.425 sessões
              do acervo saem todas gratuitas porque `gratuito` é a negação de um campo de ingresso
              que nenhum dos 300 eventos declara. Um filtro de gratuidade passaria 100% dos eventos
              datados — ele não recortaria nada, e oferecê-lo sem dizer isso seria pior do que não
              tê-lo.
            </p>
          </section>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. A lente do mapa (D-59)                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="busca-bloco">
        <p className="busca-bloco-titulo">ver este recorte no mapa</p>
        <p className="text-sm leading-snug">
          O mapa é <strong>lente sobre este resultado</strong>, não uma porta de entrada: ele
          abre com o conjunto que está aqui e com o endereço de volta para esta busca.
        </p>
        <Chip href={lente} className="w-fit font-semibold">
          <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0 text-acao-tinta" />
          {idsLente.length
            ? `abrir ${milhar(idsLente.length)} no mapa`
            : "abrir o mapa sem recorte"}
        </Chip>
        {total > idsLente.length ? (
          <p className="text-xs leading-snug text-tinta-2">
            A lente leva os primeiros {milhar(idsLente.length)} de {milhar(total)} — o corte é
            do endereço, que não comporta a lista inteira, e está declarado aqui em vez de
            acontecer em silêncio.
          </p>
        ) : null}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bloco de faceta
// ---------------------------------------------------------------------------

function BlocoFaceta({
  titulo,
  opcoes,
  marcados,
  aoTocar,
  rotulo,
  rodape,
}: {
  titulo: string;
  opcoes: OpcaoFaceta[];
  marcados: Set<string>;
  aoTocar: (opcao: OpcaoFaceta) => void;
  rotulo?: (valor: string) => string;
  rodape?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="busca-bloco-titulo">{titulo}</p>
      {opcoes.length ? (
        // A CONTAGEM FICA AQUI, e não é exceção arbitrária: o parágrafo acima
        // promete que «o número é quantos resultados aquela opção devolve
        // agora». Tirá-la, como esta migração chegou a fazer, deixou a frase
        // apontando para um dado que não estava na tela — e a promessa de que
        // nenhum recorte leva a lugar nenhum (D-66) é argumento do produto, não
        // decoração de chip. O que continua fora é o «sem ela: 340» dos
        // critérios já marcados: aquele é o mesmo número repetido em cada
        // pílula de uma fileira, e ninguém prometeu nada sobre ele.
        <TrilhoDeChips rotulo={`Recortar por ${titulo}`}>
          {opcoes.map((opcao) => {
            const chave = chaveCriterio(opcao);
            return (
              <Chip
                key={chave}
                selecionado={marcados.has(chave)}
                data-faceta={chave}
                cor={opcao.cor ?? undefined}
                contagem={milhar(opcao.n)}
                onClick={() => aoTocar(opcao)}
              >
                {rotulo ? rotulo(opcao.valor) : opcao.rotulo}
              </Chip>
            );
          })}
        </TrilhoDeChips>
      ) : (
        <p className="text-sm text-tinta-2">
          Nenhuma opção deste campo recorta o resultado atual.
        </p>
      )}
      {rodape}
    </div>
  );
}
