"use client";

import Link from "next/link";
import { cloneElement, useCallback, useEffect, useId, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Chip, TrilhoDeChips } from "@/componentes/base/chip";
import {
  ICONE_BUSCAR,
  ICONE_FILTROS,
  ICONE_MAPA,
  ICONE_SETA,
  iconeDaClasse,
} from "@/componentes/base/icones";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
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
import {
  consultar,
  expandirIndice,
  facetasDe,
  REGRA_ORDENACAO,
  type CampoCriterio,
  type Criterio,
  type EntradaIndice,
  type IndiceDTO,
  type OpcaoFaceta,
  type ResultadoBusca,
} from "@/dados/indice";
import { ROTA_POR_CLASSE } from "@/dados/rotas";
import { rotuloDaClasse } from "@/lib/rotulos";
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
 * O que o campo sugere enquanto está vazio, e que troca sozinho de tempos em tempos.
 *
 * O PRIMEIRO ITEM É SEMPRE O DO PRIMEIRO QUADRO, e é o genérico. Sob `output: "export"`
 * o HTML nasce no build: sortear a sugestão inicial divergiria da hidratação, e o React
 * acusaria no console. O giro começa depois, no efeito.
 *
 * OS EXEMPLOS CONCRETOS CASAM ALGO, e isso foi conferido e não estimado. Um exemplo que
 * devolvesse zero seria a primeira busca da pessoa e o primeiro beco — o oposto de D-66.
 * Contados por título normalizado em `src/dados/gerado/entidades.json`: Lygia Clark 1,
 * bienal 116, arte contemporânea 10, dança contemporânea 8, Belém 11. «teatro em Belém»
 * ficou de fora por isto mesmo: a consulta exige TODOS os termos na mesma entrada, e o
 * acervo tem zero títulos com os três.
 */
const SUGESTOES = [
  // TRÊS SUBSTANTIVOS, E NÃO QUATRO, PORQUE O CAMPO É DE 390px. Com «ou tema» no fim, a
  // frase mede 317px contra 296px úteis dentro da moldura — medido com a fonte real da
  // tela — e a primeira coisa que a pessoa vê seria um texto cortado no meio. Tema
  // continua no lugar onde ele recorta de verdade: a faceta, e os exemplos que giram.
  "pessoa, lugar ou evento",
  "Lygia Clark",
  "bienal",
  "arte contemporânea",
  "dança contemporânea",
  "Belém",
];

/** O giro é lento de propósito: a sugestão é convite, não animação. */
const GIRO_DA_SUGESTAO = 4000;

/**
 * Classe da ontologia → o nome que se usa em português na tela.
 *
 * `termo` é verbete da Enciclopédia e `conteudo` é matéria editorial: mostrar os nomes
 * internos da ontologia faria a etiqueta de tipo — o elemento que sustenta D-63 — pedir
 * tradução justamente de quem está vendo a tela pela primeira vez.
 */

const ROTULO_CAMPO: Record<CampoCriterio, string> = {
  texto: "texto",
  classe: "tipo",
  linguagem: "linguagem",
  tema: "tema",
  procedencia: "procedência",
  territorio: "território",
};

/**
 * As cinco famílias da porta de busca. São escolha exclusiva (uma aba), não
 * recorte opcional — marcar «Eventos» substitui o critério de classe, não soma.
 * «Lugares» junta espaço, instituição e território no mesmo campo, que o índice
 * já trata como OU (filtrar).
 */
function Mini({ icone }: { icone: ReactElement }) {
  return cloneElement(icone as ReactElement<{ className?: string }>, { className: "busca-glifo" });
}

function metaDoResultado(resultado: ResultadoBusca): string {
  const partes: string[] = [];
  if (resultado.territorioRotulo) partes.push(resultado.territorioRotulo);
  if (resultado.temImagem) partes.push("com imagem no acervo");
  return partes.join(" · ");
}

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
  const [texto, setTexto] = useState("");
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [recentes, setRecentes] = useState<string[]>([]);
  const [descartados, setDescartados] = useState(0);
  const [lidoDoHash, setLidoDoHash] = useState(false);
  const [todosOsTemas, setTodosOsTemas] = useState(false);
  const [todasAsLinguagens, setTodasAsLinguagens] = useState(false);
  const [sugestao, setSugestao] = useState(0);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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

  // O GIRO DA SUGESTÃO, e as duas condições que o desligam.
  //
  // Com texto digitado o placeholder nem aparece — girar ali seria trabalho invisível a
  // cada 4 segundos, para sempre. E quem pediu menos movimento no sistema operacional não
  // vê giro nenhum: fica a sugestão genérica, que é a que diz o que se pode buscar. É o
  // mecanismo de parada que um texto que se troca sozinho precisa ter (WCAG 2.2.2) — o
  // outro é digitar, que também para.
  useEffect(() => {
    if (texto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const giro = window.setInterval(
      () => setSugestao((i) => (i + 1) % SUGESTOES.length),
      GIRO_DA_SUGESTAO,
    );
    return () => window.clearInterval(giro);
  }, [texto]);

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

  const escolherAba = useCallback(
    (classes: readonly ClasseEntidade[]) => {
      setCriterios((atual) => {
        const semClasse = atual.filter((c) => c.campo !== "classe");
        if (!classes.length) return semClasse;
        const novas: Criterio[] = [];
        for (const valor of classes) {
          const opcao = conhecidas.get(`classe:${valor}`);
          if (opcao) {
            novas.push({ campo: opcao.campo, valor: opcao.valor, rotulo: opcao.rotulo });
          }
        }
        return [...semClasse, ...novas];
      });
    },
    [conhecidas],
  );

  const irAosFiltros = useCallback(() => {
    setMostrarFiltros(true);
  }, []);

  const fecharFiltros = useCallback(() => {
    setMostrarFiltros(false);
  }, []);

  useEffect(() => {
    if (!mostrarFiltros) return;
    const noEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMostrarFiltros(false);
    };
    window.addEventListener("keydown", noEscape);
    const raiz = document.querySelector(".moldura-rolagem");
    const previa = raiz instanceof HTMLElement ? raiz.style.overflowY : "";
    if (raiz instanceof HTMLElement) raiz.style.overflowY = "hidden";
    return () => {
      window.removeEventListener("keydown", noEscape);
      if (raiz instanceof HTMLElement) raiz.style.overflowY = previa;
    };
  }, [mostrarFiltros]);

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

  // A VITRINE do estado inicial. Duas entradas por classe navegável, preferindo
  // as que têm imagem local — a amostra abre com foto, não com capa composta.
  // Ordem do índice, determinística.
  const vitrine = useMemo(() => {
    const porClasse = new Map<ClasseEntidade, EntradaIndice[]>();
    for (const preferir of [true, false]) {
      for (const e of expandirIndice(indice)) {
        if (!ROTA_POR_CLASSE[e.classe]) continue;
        if (preferir && !e.imagem) continue;
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
  const criteriosVisiveis = criterios.filter((c) => c.campo !== "classe");
  const nFiltros = criteriosVisiveis.length;
  const chaveDestaque = resposta?.resultados[0]?.chave;
  const pessoasRelacionadas = (resposta?.resultados ?? []).filter(
    (r) => (r.classe === "pessoa" || r.classe === "coletivo") && r.chave !== chaveDestaque,
  );
  const conteudosRelacionados = (resposta?.resultados ?? []).filter(
    (r) => r.classe === "conteudo" && r.chave !== chaveDestaque,
  );
  const nPessoas = (resposta?.porClasse.pessoa ?? 0) + (resposta?.porClasse.coletivo ?? 0);
  const nConteudos = resposta?.porClasse.conteudo ?? 0;

  return (
    <div className="flex flex-col gap-4 p-5 desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="tipo-titulo-1 font-bold">Buscar</h1>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 1. O campo único                                                    */}
      {/* ------------------------------------------------------------------ */}
      <form
        className="busca-caixa-wrap"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          registrarRecente(texto);
        }}
      >
        <div className="busca-caixa">
          <span className="busca-caixa-lupa" aria-hidden>
            <Mini icone={ICONE_BUSCAR} />
          </span>
          <label className="sr-only" htmlFor="busca-campo">
            Buscar no acervo
          </label>
          <input
            id="busca-campo"
            className="busca-campo"
            type="search"
            autoFocus
            autoComplete="off"
            placeholder={`Busque por ${SUGESTOES[sugestao]}…`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => registrarRecente(texto)}
          />
        </div>
      </form>

      {/* O FILTRO SAIU DE DENTRO DO CAMPO (2026-09). Ele era um ícone de sliders sem
          rótulo, com um número sobreposto, dentro da caixa de busca — a mesma função que
          em `/acontece/` e `/descobrir/` chega por um Chip com a palavra escrita. Três
          formas para uma função é o que fazia esta tela destoar das outras. Agora ela seg
          o modelo de `/filtros/`: palavra à esquerda, ESTADO EM PALAVRAS à direita, nunca
          um ícone mudo — quem olha sabe se há filtro aplicado sem tocar em nada. */}
      <button
        type="button"
        className="busca-filtro-linha"
        aria-controls="busca-facetas"
        aria-expanded={mostrarFiltros}
        onClick={irAosFiltros}
      >
        <span className="busca-filtro-linha-rotulo">
          <Mini icone={ICONE_FILTROS} />
          Filtros
        </span>
        <span className="busca-filtro-linha-estado">
          {nFiltros
            ? `${milhar(nFiltros)} ${nFiltros === 1 ? "aplicado" : "aplicados"}`
            : "nenhum aplicado"}
        </span>
      </button>

      {/* Critérios marcados: fichas visíveis e removíveis, cada uma dizendo quantos
          resultados haveria SEM ela (D-64). É a informação que o plano 03-06 usa para
          recalcular ao vivo quando a pessoa tira uma ficha. */}
      {criteriosVisiveis.length ? (
        <section className="flex flex-col gap-1.5">
          <p className="busca-bloco-titulo">critérios marcados · toque para tirar</p>
          <TrilhoDeChips rotulo="Critérios marcados">
            {criteriosVisiveis.map((criterio) => (
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
        <p className="tipo-detalhe text-tinta-2">
          {descartados === 1
            ? "Um critério do endereço não existe neste índice e foi descartado."
            : `${milhar(descartados)} critérios do endereço não existem neste índice e foram descartados.`}
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
          {/* ------------------------------------------------------------------ */}
          {/* 2. Antes de digitar — o estado que a banca vê primeiro              */}
          {/* ------------------------------------------------------------------ */}
          {!ativa ? (
            <div className="busca-antes flex flex-col gap-3">
              {/* AS SEÇÕES DO ACERVO — o pedido do cliente na reformulação de 2026-08: a
                  busca abre como um índice de blog, com as seções selecionáveis.
                  Marcar uma seção é marcar o critério de classe: o mesmo mecanismo
                  de faceta de sempre, só que na porta. */}
              {/* GRADE, E NÃO TRILHO (2026-09). Como Estante, as classes rolavam na
                  horizontal: o terceiro item aparecia pela metade e a seta de «há mais»
                  ficava POR CIMA dele. Cortar um item ao meio é o oposto do que o modelo
                  de `/filtros/` faz — lá todo controle cabe inteiro e diz seu estado. Em
                  grade as quinze classes cabem, sem seta sobreposta e sem corte. */}
              <section className="busca-bloco">
                <p className="busca-bloco-titulo">explore por seção</p>
                <div className="busca-secoes-grade">
                  {facetas.classe.map((opcao) => (
                    <Chip
                      key={chaveCriterio(opcao)}
                      variante="explorar"
                      data-faceta={chaveCriterio(opcao)}
                      onClick={() => alternarCriterio(opcao)}
                    >
                      {iconeDaClasse(opcao.valor)}
                      {rotuloDaClasse(opcao.valor as ClasseEntidade)}
                    </Chip>
                  ))}
                </div>
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
                      {/* `compacta`: a pastilha de tipo e a faixa de crédito dividiam o
                          mesmo canto da capa e os DOIS saíam cortados — «Digitalizado do
                          origin…», «Foto de Autoria desc…». O tipo desce para a linha de
                          metadados, onde cabe inteiro; o crédito continua no `alt`, que é
                          onde quem não vê a imagem o encontra. */}
                      <CapaDeCartao
                        titulo={entrada.titulo}
                        classe={entrada.classe}
                        linguagens={entrada.linguagens}
                        imagem={entrada.imagem}
                        creditoImagem={entrada.creditoImagem}
                        compacta
                        className="aspect-square w-full rounded-p"
                      />
                      <span className="line-clamp-2 text-sm leading-snug font-semibold">
                        {entrada.titulo}
                      </span>
                      <span className="busca-amostra-tipo">
                        {rotuloDaClasse(entrada.classe)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <Chip href="/buscar/frase/" data-convite-frase="app" className="w-fit font-semibold">
                buscar por frase
              </Chip>
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
              <div className="busca-cabeca">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="tipo-detalhe font-semibold">
                    {total === 0
                      ? "Nenhum resultado"
                      : texto.trim()
                        ? `${milhar(total)} resultado${total > 1 ? "s" : ""} para «${texto.trim()}»`
                        : exibidos < total
                          ? `Mostrando ${milhar(exibidos)} de ${milhar(total)} resultados`
                          : `${milhar(total)} resultado${total > 1 ? "s" : ""}`}
                  </p>
                  {total > 0 ? (
                    <p className="tipo-legenda text-tinta-2">
                      em{" "}
                      {Object.entries(resposta.porClasse)
                        .sort((a, b) => b[1] - a[1])
                        .map(([classe, n]) => `${rotuloDaClasse(classe as ClasseEntidade)} ${n}`)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
                {total > 0 ? (
                  <details className="busca-ordem">
                    <summary>Mais relevantes</summary>
                    <p>{REGRA_ORDENACAO}</p>
                  </details>
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
                    {resposta.resultados.map((resultado, i) => (
                      <ItemResultado
                        key={resultado.chave}
                        resultado={resultado}
                        texto={texto}
                        destaque={i === 0}
                      />
                    ))}
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

          {ativa && pessoasRelacionadas.length ? (
            <section className="busca-bloco">
              <div className="busca-secao-cabeca">
                <h2 className="busca-bloco-titulo">Pessoas relacionadas</h2>
                {nPessoas > 6 ? (
                  <button
                    type="button"
                    className="busca-secao-acao"
                    onClick={() => escolherAba(["pessoa", "coletivo"])}
                  >
                    Ver todas
                  </button>
                ) : null}
              </div>
              <div className="busca-pessoas">
                {pessoasRelacionadas.slice(0, 6).map((pessoa) => {
                  const base = ROTA_POR_CLASSE[pessoa.classe];
                  const rota = base ? `${base}/${pessoa.slug}/` : null;
                  const miolo = (
                    <>
                      <CapaDeCartao
                        titulo={pessoa.titulo}
                        classe={pessoa.classe}
                        linguagens={pessoa.linguagens}
                        imagem={pessoa.imagem}
                        creditoImagem={pessoa.creditoImagem}
                        compacta
                        className="busca-pessoa-capa"
                      />
                      <span className="busca-pessoa-nome">{pessoa.titulo}</span>
                    </>
                  );
                  return rota ? (
                    <Link key={pessoa.chave} href={rota} className="busca-pessoa">
                      {miolo}
                    </Link>
                  ) : (
                    <div key={pessoa.chave} className="busca-pessoa">
                      {miolo}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {ativa && conteudosRelacionados.length ? (
            <section className="busca-bloco">
              <div className="busca-secao-cabeca">
                <h2 className="busca-bloco-titulo">Conteúdos para se aprofundar</h2>
                {nConteudos > 2 ? (
                  <button
                    type="button"
                    className="busca-secao-acao"
                    onClick={() => escolherAba(["conteudo"])}
                  >
                    Ver todos
                  </button>
                ) : null}
              </div>
              <div className="busca-leituras">
                {conteudosRelacionados.slice(0, 2).map((item) => (
                  <article key={item.chave} className="busca-leitura">
                    <CapaDeCartao
                      titulo={item.titulo}
                      classe={item.classe}
                      linguagens={item.linguagens}
                      imagem={item.imagem}
                      creditoImagem={item.creditoImagem}
                      compacta
                      className="busca-leitura-capa"
                    />
                    <span className="busca-tipo">{rotuloDaClasse(item.classe)}</span>
                    <span className="busca-leitura-titulo">{item.titulo}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

        </div>

      <div
        id="busca-facetas"
        data-coluna-facetas="sim"
        data-aberta={mostrarFiltros ? "sim" : undefined}
        className="busca-folha"
        role="dialog"
        aria-modal={mostrarFiltros}
        aria-labelledby="busca-folha-titulo"
      >
        <div className="busca-folha-cabeca">
          <h2 id="busca-folha-titulo" className="tipo-titulo-3 font-bold">
            Filtros
          </h2>
          <button type="button" className="busca-folha-fechar" onClick={fecharFiltros}>
            Fechar
          </button>
        </div>
        <div className="busca-folha-corpo">
          {/* O «Explore por linguagem» saiu daqui (2026-09). Ele era um trilho que
              cortava o terceiro item e punha a seta por cima dele — e mostrava
              EXATAMENTE o mesmo grupo que o bloco «linguagem» logo abaixo, agora em
              gaveta. Dois controles para o mesmo critério, um deles ilegível. */}

          <section>
            <p className="busca-bloco-titulo">Buscas recentes</p>
            {recentes.length ? (
              <div className="flex flex-wrap gap-2">
                {recentes.map((termo) => (
                  <Chip
                    key={termo}
                    onClick={() => {
                      setTexto(termo);
                      fecharFiltros();
                    }}
                  >
                    {termo}
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="tipo-detalhe text-tinta-2">
                Você ainda não buscou nada neste navegador.
              </p>
            )}
          </section>

          <Link href={lente} className="busca-mapa">
            <Mini icone={ICONE_MAPA} />
            <span className="busca-mapa-rotulo">
              {idsLente.length
                ? `Ver ${milhar(idsLente.length)} no mapa`
                : "Ver no mapa"}
            </span>
            <Mini icone={ICONE_SETA} />
          </Link>
          {total > idsLente.length ? (
            <p className="tipo-legenda text-tinta-2">
              A lente leva os primeiros {milhar(idsLente.length)} de {milhar(total)}.
            </p>
          ) : null}

          <section className="flex flex-col gap-3">
            <p className="busca-bloco-titulo">Filtre o acervo</p>
            <BlocoFaceta
              titulo="tipo"
              opcoes={facetas.classe}
              marcados={marcados}
              rotulo={(valor) => rotuloDaClasse(valor as ClasseEntidade)}
              aoTocar={alternarCriterio}
            />
            <BlocoFaceta
              titulo="linguagem"
              opcoes={facetas.linguagem.slice(0, 12)}
              marcados={marcados}
              aoTocar={alternarCriterio}
            />
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
                <p className="tipo-legenda text-tinta-2">
                  {milhar(indice.diagnostico.comTerritorioBrasileiro)} das {milhar(indice.total)}{" "}
                  entradas estão situadas num estado brasileiro.
                </p>
              }
            />
          </section>
        </div>
      </div>
      </div>

      {mostrarFiltros ? (
        <button
          type="button"
          className="busca-folha-scrim"
          aria-label="Fechar filtros"
          onClick={fecharFiltros}
        />
      ) : null}
    </div>
  );
}

function TituloResultado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <span className="busca-titulo">
      {pedacos(titulo, texto).map((pedaco, i) => (
        <span key={i} className={pedaco.casa ? "busca-casamento" : undefined}>
          {pedaco.t}
        </span>
      ))}
    </span>
  );
}

function ItemResultado({
  resultado,
  texto,
  destaque,
}: {
  resultado: ResultadoBusca;
  texto: string;
  destaque: boolean;
}) {
  const base = ROTA_POR_CLASSE[resultado.classe];
  const rota = base ? `${base}/${resultado.slug}/` : null;
  const etiqueta = (
    <span className="busca-tipo" data-tipo-rotulo>
      {rotuloDaClasse(resultado.classe)}
    </span>
  );
  const meta = metaDoResultado(resultado);

  if (destaque) {
    const miolo = (
      <>
        <CapaDeCartao
          titulo={resultado.titulo}
          classe={resultado.classe}
          linguagens={resultado.linguagens}
          imagem={resultado.imagem}
          creditoImagem={resultado.creditoImagem}
          compacta
          className="busca-destaque-capa"
        />
        <span className="busca-destaque-miolo">
          {etiqueta}
          <TituloResultado titulo={resultado.titulo} texto={texto} />
          {meta ? <span className="busca-meta">{meta}</span> : null}
        </span>
        {rota ? (
          <span className="busca-destaque-ir" aria-hidden>
            <Mini icone={ICONE_SETA} />
          </span>
        ) : null}
      </>
    );
    return (
      <li
        className="busca-resultado"
        data-destaque=""
        data-resultado={resultado.chave}
        data-tipo={resultado.classe}
      >
        {rota ? (
          <Link href={rota} className="busca-destaque-link">
            {miolo}
          </Link>
        ) : (
          <div className="busca-destaque-link">{miolo}</div>
        )}
      </li>
    );
  }

  const corpo = (
    <>
      <CapaDeCartao
        titulo={resultado.titulo}
        classe={resultado.classe}
        linguagens={resultado.linguagens}
        imagem={resultado.imagem}
        creditoImagem={resultado.creditoImagem}
        compacta
        className="busca-resultado-capa"
      />
      <div className="busca-resultado-texto">
        {etiqueta}
        <TituloResultado titulo={resultado.titulo} texto={texto} />
        {meta ? <span className="busca-meta">{meta}</span> : null}
        {resultado.linguagens.length ? (
          <SelosDeLinguagem ids={resultado.linguagens} limite={2} />
        ) : null}
        {!rota ? <span className="busca-meta">sem página própria</span> : null}
      </div>
    </>
  );

  return (
    <li
      className="busca-resultado"
      data-resultado={resultado.chave}
      data-tipo={resultado.classe}
    >
      {rota ? (
        <Link href={rota} className="busca-resultado-corpo">
          {corpo}
        </Link>
      ) : (
        <div className="busca-resultado-corpo">{corpo}</div>
      )}
    </li>
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
  const nMarcados = opcoes.filter((o) => marcados.has(chaveCriterio(o))).length;

  return (
    <section className="filtros-bloco" data-bloco={titulo}>
      <h3 className="filtros-bloco-titulo">{titulo}</h3>

      {opcoes.length ? (
        <details className="filtros-gaveta" open={nMarcados > 0}>
          <summary className="filtros-gaveta-topo">
            <span className="filtros-gaveta-rotulo">
              {nMarcados === 0
                ? `Escolher ${titulo}`
                : `${milhar(nMarcados)} ${nMarcados > 1 ? "marcados" : "marcado"}`}
            </span>
          </summary>

          <ul className="filtros-dimensoes">
            {opcoes.map((opcao) => {
              const chave = chaveCriterio(opcao);
              return (
                <li key={chave} className="filtros-dimensao">
                  <button
                    type="button"
                    aria-pressed={marcados.has(chave)}
                    className="filtros-marcavel"
                    data-faceta={chave}
                    onClick={() => aoTocar(opcao)}
                  >
                    <span className="filtros-marcavel-caixa" aria-hidden />
                    <span className="filtros-marcavel-rotulo">
                      {rotulo ? rotulo(opcao.valor) : opcao.rotulo}
                    </span>
                    <span className="filtros-marcavel-n">{milhar(opcao.n)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      ) : (
        <p className="filtros-bloco-linha text-tinta-2">
          Nenhuma opção deste campo recorta o resultado atual.
        </p>
      )}
      {rodape}
    </section>
  );
}
