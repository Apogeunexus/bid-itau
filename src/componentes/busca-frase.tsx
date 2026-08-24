"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Grafismo } from "@/componentes/grafismo";
import {
  consultar,
  normalizar,
  type Afrouxamento,
  type IndiceDTO,
  type ResultadoBusca,
} from "@/dados/indice";
import {
  motivoDoCasamento,
  regras,
  traduzir,
  FRASE_DO_CENARIO_5,
  type CriterioTraduzido,
  type VizinhancaDeSemelhanca,
} from "@/dados/frase";
import { ROTA_POR_CLASSE } from "@/dados/rotas";
import type { ClasseEntidade } from "@/dados/tipos";

/**
 * busca-frase.tsx — busca em linguagem natural (AGEN-07, D-64, D-65, D-66).
 *
 * É A RESPOSTA AO CENÁRIO 5 do RFP: «quero algo parecido com a Bienal, gratuito e perto
 * de mim». A tela abre com a frase já escrita e já traduzida — o roteiro da banca não
 * depende de ninguém digitar certo sob pressão.
 *
 * O QUE ESTA TELA PRECISA PROVAR, e o que cada parte dela faz:
 *
 * 1. D-64 — A TRADUÇÃO É A RESPOSTA, e não um passo intermediário escondido. A frase
 *    vira fichas visíveis, cada uma ligada ao trecho que a produziu (destacado na frase
 *    de cima), e cada uma removível com recálculo NA HORA e sem navegar. Se quem avalia
 *    não puder ver no que a sentença foi transformada e mudar isso em um gesto, a tela
 *    falhou mesmo com o casamento correto por trás.
 *
 * 2. D-65 — SEM MODELO, E A TELA DIZ ISSO. Nenhuma chamada de IA, nenhuma chamada de
 *    rede, nenhum pacote de PLN. O casamento é por regra declarada, e a lista inteira das
 *    regras abre aqui dentro: a lista É o argumento, e por isso ela é produto e não
 *    anotação sobre o produto.
 *
 * 3. D-66 — ZERO-RESULTADO NUNCA É BECO. Quando a combinação não devolve nada, a tela
 *    lista qual critério soltar e QUANTOS resultados aquilo traria, em um toque.
 *
 * 4. T-03-36 — RESULTADO SEM MOTIVO NÃO RENDERIZA. Cada resultado diz por que casa, e a
 *    ORIGEM do texto viaja com ele: `aresta` quando o motivo está escrito no acervo,
 *    `criterio` quando a frase foi composta por nós a partir dos critérios. É a mesma
 *    distinção que a 02-01 fixou em `motivo.ts` e que T-02-05 existe para proteger — sem
 *    ela, texto nosso passaria por texto do Itaú Cultural.
 *
 * DP-F: este arquivo NÃO alcança `@/dados/grafo`, nem transitivamente. `@/dados/indice` e
 * `@/dados/frase` foram escritos de propósito sem nenhum import do grafo; o acervo entra
 * injetado no componente de servidor de `/buscar/frase`, que monta o índice e lê as
 * arestas de semelhança no build e passa os dois por props.
 *
 * POR QUE A CONSULTA RODA AQUI, e não pré-computada por subconjunto no build: a frase é
 * EDITÁVEL, e a tradução tem de acompanhar a edição — um precômputo combinatório só
 * cobriria as combinações da frase original e a primeira letra digitada cairia fora dele.
 * `consultar` é filtro linear em memória sobre o DTO colunar, o MESMO que `/buscar` roda
 * a cada tecla. Nenhuma travessia de grafo atravessa a fronteira: a única travessia desta
 * tela — as 856 arestas `semelhante_a` — foi feita no build e chega como mapa de texto.
 *
 * NENHUMA POSIÇÃO ANCORADA NA JANELA neste arquivo (D-03). O estilo mora em
 * `src/estilos/frase.css`.
 */

// ---------------------------------------------------------------------------
// Constantes de tela
// ---------------------------------------------------------------------------

/** Teto de resultados exibidos. O TOTAL REAL é declarado ao lado, e medível no DOM. */
const TETO_EXIBICAO = 100;

/** Quantos ids cabem na gramática de lente sem estourar a URL. O corte é declarado. */
const TETO_LENTE = 60;

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



// ---------------------------------------------------------------------------
// Ajudantes puros
// ---------------------------------------------------------------------------

/**
 * Milhar com ponto, à mão. `toLocaleString` é proibido: sob `output: "export"` o HTML
 * nasce no build e é hidratado no navegador do avaliador; ICU diferente entre as duas
 * pontas divergiria e o gate de console limpo cairia por causa de um separador.
 */
function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function chaveCriterio(criterio: { campo: string; valor: string }): string {
  return `${criterio.campo}:${criterio.valor}`;
}

/**
 * A frase fatiada nos trechos que viraram ficha.
 *
 * FATIAMENTO DE STRING, NUNCA MARCAÇÃO INJETADA (T-03-38). A frase é entrada não
 * confiável; ela volta ao DOM como nó de texto do React e em lugar nenhum como HTML. Os
 * limites vêm de `inicio`/`fim`, que `traduzir` mediu sobre a frase ORIGINAL — é para
 * isso que `frase.ts` achata preservando o índice em vez de usar `normalizar`.
 */
function fatiar(
  frase: string,
  criterios: CriterioTraduzido[],
): Array<{ texto: string; criterio: CriterioTraduzido | null }> {
  const ordenados = [...criterios].sort((a, b) => a.inicio - b.inicio);
  const saida: Array<{ texto: string; criterio: CriterioTraduzido | null }> = [];
  let cursor = 0;
  for (const criterio of ordenados) {
    if (criterio.inicio < cursor) continue;
    if (criterio.inicio > cursor) {
      saida.push({ texto: frase.slice(cursor, criterio.inicio), criterio: null });
    }
    saida.push({ texto: frase.slice(criterio.inicio, criterio.fim), criterio });
    cursor = criterio.fim;
  }
  if (cursor < frase.length) saida.push({ texto: frase.slice(cursor), criterio: null });
  return saida;
}

/**
 * Este resultado casa com este critério?
 *
 * Serve só para COMPOR o «por que casa» quando o acervo não escreveu um motivo. O
 * recorte de verdade é de `consultar`; aqui só se pergunta, sobre o resultado que já
 * passou, qual das fichas ele satisfaz — porque critérios do mesmo campo somam, e dizer
 * «é evento» sobre um resultado que entrou por ser publicação seria afirmação falsa.
 *
 * `tema` devolve `null`: o DTO de resultado não carrega tema (ele não cabia no orçamento
 * de 480 KB do índice). Quando a ficha de tema é a única do campo, o resultado
 * necessariamente casou com ela; quando há mais de uma, a tela se cala em vez de chutar.
 */
function casouCom(resultado: ResultadoBusca, criterio: CriterioTraduzido): boolean | null {
  switch (criterio.campo) {
    case "classe":
      return resultado.classe === criterio.valor;
    case "linguagem":
      return resultado.linguagens.includes(criterio.valor);
    case "procedencia":
      return resultado.procedencia === criterio.valor;
    case "territorio":
      return resultado.territorio === criterio.valor;
    case "texto": {
      const alvo = normalizar(resultado.titulo);
      return normalizar(criterio.valor)
        .split(" ")
        .filter(Boolean)
        .every((termo) => alvo.includes(termo));
    }
    case "tema":
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// O hash desta rota
// ---------------------------------------------------------------------------

/**
 * O estado espelhado no hash: `q` a frase, `x` as fichas removidas, `g` o território
 * escolhido. Hash e `replaceState`, nunca navegação: editar e remover ficha NÃO podem
 * trocar de rota — `/buscar/frase/` continua sendo `/buscar/frase/`.
 */
function escreverHash(frase: string, removidos: string[], territorio: string | null): string {
  const partes: string[] = [];
  if (frase.trim() && frase !== FRASE_DO_CENARIO_5) {
    partes.push(`q=${encodeURIComponent(frase)}`);
  }
  if (removidos.length) partes.push(`x=${removidos.map(encodeURIComponent).join("~")}`);
  if (territorio) partes.push(`g=${encodeURIComponent(territorio)}`);
  return partes.length ? `#${partes.join("&")}` : "";
}

// ---------------------------------------------------------------------------
// O componente
// ---------------------------------------------------------------------------

export function BuscaFrase({
  indice,
  vizinhanca,
}: {
  indice: IndiceDTO;
  /** As 856 arestas `semelhante_a` da âncora do Cenário 5, lidas no build. */
  vizinhanca: VizinhancaDeSemelhanca;
}) {
  const [frase, setFrase] = useState(FRASE_DO_CENARIO_5);
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [territorio, setTerritorio] = useState<string | null>(null);
  const [regrasAbertas, setRegrasAbertas] = useState(false);
  const [confissaoAberta, setConfissaoAberta] = useState<string | null>(null);
  const [lidoDoHash, setLidoDoHash] = useState(false);
  const [descartados, setDescartados] = useState(0);

  const AS_REGRAS = useMemo(() => regras(), []);

  // A TRADUÇÃO. Roda a cada tecla, é determinística e não chama nada (D-65). O estado
  // inicial é a frase constante do Cenário 5, então o que o servidor desenhou no build e
  // o que o navegador desenha na hidratação são idênticos — nenhuma divergência.
  const traducao = useMemo(() => traduzir(frase, indice), [frase, indice]);

  // A escolha de território da pessoa substitui o valor da ficha de proximidade. A marca
  // de substituição declarada CONTINUA: trocar o território não apaga o fato de que
  // «perto de mim» nunca foi respondido por proximidade.
  const todos = useMemo<CriterioTraduzido[]>(() => {
    if (!territorio) return traducao.criterios;
    return traducao.criterios.map((criterio) => {
      if (criterio.campo !== "territorio") return criterio;
      const opcao = criterio.opcoes?.find((o) => o.valor === territorio);
      if (!opcao) return criterio;
      return {
        ...criterio,
        valor: opcao.valor,
        rotulo: criterio.rotulo.replace(/→ .*$/, `→ ${opcao.rotulo}`),
        rotuloCurto: opcao.rotulo,
      };
    });
  }, [traducao, territorio]);

  const removidosSet = useMemo(() => new Set(removidos), [removidos]);
  const ativos = useMemo(
    () => todos.filter((criterio) => !removidosSet.has(chaveCriterio(criterio))),
    [todos, removidosSet],
  );

  // A CONSULTA — a MESMA `consultar` de `/buscar`, sobre o MESMO índice (D-63). Filtro
  // linear em memória: nenhuma travessia, nenhuma rede, nenhuma biblioteca de busca.
  const resposta = useMemo(
    () =>
      ativos.length
        ? consultar({ criterios: ativos, limite: TETO_EXIBICAO }, indice)
        : null,
    [ativos, indice],
  );

  // Leitura do hash em efeito, e não no estado inicial: sob `output: "export"` o HTML
  // nasce no build, e ler `location` no primeiro render divergiria da hidratação.
  useEffect(() => {
    const bruto = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (!bruto) {
      setLidoDoHash(true);
      return;
    }
    let perdidos = 0;
    for (const parte of bruto.split("&")) {
      const igual = parte.indexOf("=");
      if (igual < 0) continue;
      const chave = parte.slice(0, igual);
      let valor = "";
      try {
        valor = decodeURIComponent(parte.slice(igual + 1));
      } catch {
        perdidos += 1;
        continue;
      }
      if (chave === "q") setFrase(valor);
      else if (chave === "x") setRemovidos(valor.split("~").filter(Boolean));
      else if (chave === "g") {
        // T-03-38: o território do endereço é conferido contra as facetas do índice.
        // Valor desconhecido é descartado, e o descarte é DECLARADO na tela.
        const conhecido = indice.facetas.territorio.some((o) => o.valor === valor);
        if (conhecido) setTerritorio(valor);
        else perdidos += 1;
      }
    }
    setDescartados(perdidos);
    setLidoDoHash(true);
  }, [indice]);

  useEffect(() => {
    if (!lidoDoHash) return;
    const atual = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", `${atual}${escreverHash(frase, removidos, territorio)}`);
  }, [frase, removidos, territorio, lidoDoHash]);

  const removerCriterio = useCallback((chave: string) => {
    setRemovidos((atual) => (atual.includes(chave) ? atual : [...atual, chave]));
  }, []);

  const recolocarCriterio = useCallback((chave: string) => {
    setRemovidos((atual) => atual.filter((c) => c !== chave));
  }, []);

  /**
   * Um afrouxamento em um toque (D-66).
   *
   * `remover` e `manter-apenas` são expressos no MESMO estado de fichas removidas, então
   * a saída de zero-resultado e o gesto de tirar uma ficha são literalmente a mesma
   * operação — é isso que faz o número prometido ser entregue. `descoberta` propõe um
   * critério que não é pedaço desta frase, e por isso ele sai desta tela em vez de
   * aparecer aqui como uma ficha que a frase não produziu.
   */
  const aplicarAfrouxamento = useCallback(
    (afrouxamento: Afrouxamento) => {
      const chave = `${afrouxamento.campo}:${afrouxamento.valor}`;
      if (afrouxamento.tipo === "remover") {
        removerCriterio(chave);
        return;
      }
      if (afrouxamento.tipo === "manter-apenas") {
        setRemovidos(todos.map(chaveCriterio).filter((c) => c !== chave));
      }
    },
    [todos, removerCriterio],
  );

  const total = resposta?.total ?? 0;
  const exibidos = resposta?.resultados.length ?? 0;

  // --- a gramática de lente do mapa (D-59) --------------------------------
  // Três chaves, escritas igual nos planos 03-01, 03-03, 03-04 e aqui: `r` os ids do
  // recorte juntados por `~`, `t` o título legível, `v` o endereço de volta com o hash
  // desta tela — o recorte sobrevive à ida e à volta.
  const idsLente = (resposta?.resultados ?? []).slice(0, TETO_LENTE).map((r) => r.chave);
  const tituloLente = ativos.length
    ? ativos.map((criterio) => criterio.rotulo).join(" · ")
    : "sem critério";
  const volta = `/buscar/frase/${escreverHash(frase, removidos, territorio)}`;
  const lente = `/mapa#r=${idsLente.join("~")}&t=${encodeURIComponent(tituloLente)}&v=${encodeURIComponent(volta)}`;

  return (
    <div className="flex flex-col gap-2 p-5 desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Buscar por frase</h1>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 1. A frase, editável, já preenchida com a do Cenário 5              */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col">
        <label className="sr-only" htmlFor="frase-campo">
          Descreva com uma frase o que você procura
        </label>
        <input
          id="frase-campo"
          data-frase
          className="frase-campo"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="algo parecido com a Bienal, gratuito e perto de mim"
          value={frase}
          onChange={(e) => setFrase(e.target.value)}
        />

        {/* A leitura: a MESMA frase, com o pedaço que virou ficha destacado. É o fio
            visível entre o que se digitou e o que a regra fez (D-64). */}
        <p className="frase-leitura">
          {fatiar(frase, todos).map((pedaco, i) =>
            pedaco.criterio ? (
              <span
                key={i}
                className="frase-trecho"
                data-marca={
                  pedaco.criterio.naoRecorta || pedaco.criterio.substituicaoDeclarada
                    ? "confissao"
                    : "recorte"
                }
                style={
                  removidosSet.has(chaveCriterio(pedaco.criterio))
                    ? { opacity: 0.35, textDecoration: "line-through" }
                    : undefined
                }
              >
                {pedaco.texto}
              </span>
            ) : (
              <span key={i}>{pedaco.texto}</span>
            ),
          )}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. A TRADUÇÃO — e ela É a resposta (D-64)                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col">
        <p className="frase-bloco-titulo">
          a tradução · {ativos.length} de {todos.length} critérios de pé
        </p>

        {todos.length ? (
          todos.map((criterio) => {
            const chave = chaveCriterio(criterio);
            const fora = removidosSet.has(chave);
            const contagem = resposta?.porCriterio.find(
              (c) => chaveCriterio(c.criterio) === chave,
            );
            const confessa = Boolean(criterio.naoRecorta || criterio.substituicaoDeclarada);

            // A ÂNCORA CABE EM UMA LINHA na ficha, e o parágrafo inteiro abre no toque —
            // pelo mesmo motivo das confissões. A moldura tem 785px de caixa menos o
            // cabeçalho, e cinco linhas de âncora empurrariam o primeiro resultado para
            // trás da barra de abas, matando a foto de slide do Cenário 5. O que encolhe
            // é o texto que NÓS escrevemos; o motivo escrito no acervo, lá embaixo, não.
            const ancoraCurta =
              criterio.regra === "semelhanca" && criterio.ancora
                ? criterio.ancora.entradas
                  ? `${milhar(criterio.ancora.entradas)} entradas do índice casam · ${milhar(vizinhanca.arestas)} ligações «semelhante a» com motivo escrito`
                  : "nenhuma entrada do índice casa com esta âncora"
                : null;
            const ancoraLonga =
              criterio.regra === "semelhanca" && criterio.ancora?.entradas
                ? `«${criterio.ancora.termo}» casa com ${milhar(criterio.ancora.entradas)} entradas do índice; a mais próxima é «${criterio.ancora.titulo}». Do que casa saem ${milhar(vizinhanca.arestas)} ligações «semelhante a», ${milhar(vizinhanca.vizinhos)} delas para entidades distintas, TODAS com motivo escrito em português — e é desse texto que vem o porquê de cada resultado abaixo. O casamento em si é por TEXTO sobre o índice: ${milhar(vizinhanca.alcancaveis)} dessas entidades também casam por título e se explicam aqui pelo acervo; ${milhar(vizinhanca.foraDoAlcance)} ficam fora do alcance deste critério.`
                : null;

            const detalhe =
              criterio.naoRecortaFrase ?? criterio.substituicaoFrase ?? ancoraLonga ?? "";
            const marcaCurta = criterio.naoRecorta
              ? "não recorta neste acervo · 2.425 de 2.425 sessões saem gratuitas"
              : criterio.substituicaoDeclarada
                ? "substituição declarada · o protótipo não pede sua localização"
                : ancoraCurta;

            return (
              <div
                key={chave}
                className="frase-ficha"
                data-criterio={chave}
                data-regra-do-criterio={criterio.regra}
                data-confissao={confessa ? "sim" : "nao"}
                data-fora={fora ? "sim" : "nao"}
                style={fora ? { opacity: 0.45 } : undefined}
              >
                <div className="frase-ficha-topo">
                  <span className="frase-ficha-regra">{criterio.regra}</span>
                  <span className="frase-ficha-rotulo">{criterio.rotulo}</span>
                  {contagem && !fora ? (
                    <span className="frase-ficha-n" data-sem-ela={contagem.semEle}>
                      sem ela: {milhar(contagem.semEle)}
                    </span>
                  ) : null}
                </div>

                <p className="frase-ficha-marca">
                  veio de «{criterio.trecho}» na sua frase
                  {marcaCurta ? ` — ${marcaCurta}` : ""}
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  {fora ? (
                    <button
                      type="button"
                      className="frase-botao"
                      data-recolocar-criterio={chave}
                      onClick={() => recolocarCriterio(chave)}
                    >
                      recolocar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="frase-botao"
                      data-remover-criterio={chave}
                      onClick={() => removerCriterio(chave)}
                    >
                      tirar esta ficha
                      {contagem ? ` · +${milhar(Math.max(0, contagem.semEle - total))}` : ""}
                    </button>
                  )}

                  {detalhe ? (
                    <button
                      type="button"
                      className="frase-botao"
                      aria-pressed={confissaoAberta === chave}
                      onClick={() =>
                        setConfissaoAberta((atual) => (atual === chave ? null : chave))
                      }
                    >
                      {confissaoAberta === chave ? "fechar" : "por quê?"}
                    </button>
                  ) : null}

                  {/* A escolha de território fica NA FICHA de proximidade, porque é ali
                      que a substituição foi declarada — pedir a escolha em outro lugar
                      separaria a pergunta da confissão que a motivou. */}
                  {criterio.opcoes?.length ? (
                    <select
                      className="frase-botao"
                      aria-label="território"
                      data-escolha-territorio
                      value={criterio.valor}
                      onChange={(e) => setTerritorio(e.target.value)}
                    >
                      {criterio.opcoes.map((opcao) => (
                        <option key={opcao.valor} value={opcao.valor}>
                          {opcao.rotulo} ({milhar(opcao.n)})
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>

                {confissaoAberta === chave && detalhe ? (
                  <p className="frase-ficha-detalhe">{detalhe}</p>
                ) : null}

              </div>
            );
          })
        ) : (
          <p className="text-sm leading-snug text-tinta-2">
            Nenhuma regra reconheceu nada nesta frase. As {AS_REGRAS.length} regras que
            existem estão listadas abaixo, com um exemplo de frase para cada uma.
          </p>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. O que a regra NÃO entendeu — bloco que não some                  */}
      {/* ------------------------------------------------------------------ */}
      {/* O bloco NÃO SOME quando está vazio: ele declara que a frase foi lida por
          inteiro, no padrão da fase 2. O rótulo é inline em vez de título próprio porque
          a moldura é apertada e uma linha de título aqui empurraria o primeiro resultado
          para fora da primeira vista — e a foto de slide do Cenário 5 é frase + fichas +
          primeiro resultado juntos. */}
      <section data-nao-entendido={traducao.naoEntendido.length} className="text-sm leading-snug">
        {traducao.naoEntendido.length ? (
          <p>
            <strong className="frase-ficha-regra">não entendi isto:</strong>{" "}
            <strong>{traducao.naoEntendido.join(", ")}</strong> — nenhuma das{" "}
            {AS_REGRAS.length} regras reconheceu {traducao.naoEntendido.length === 1 ? "esta palavra" : "estas palavras"}, e
            {traducao.naoEntendido.length === 1 ? " ela" : " elas"} não recortou nada. Dizer
            isso é o contrário de descartar em silêncio.
          </p>
        ) : (
          <p className="text-tinta-2">
            <strong className="frase-ficha-regra">não entendi isto:</strong> nada ficou de
            fora — as {traducao.diagnostico.palavrasTotais} palavras com
            conteúdo desta frase foram lidas por alguma regra.
            {traducao.diagnostico.vagos.length
              ? ` «${traducao.diagnostico.vagos.map((v) => v.termo).join("», «")}» é o pedaço vago — ${traducao.diagnostico.vagos[0].leitura}.`
              : ""}
          </p>
        )}
      </section>

      {descartados > 0 ? (
        <p className="text-sm leading-snug text-tinta-2">
          {milhar(descartados)} valor{descartados > 1 ? "es" : ""} do endereço não existe
          neste índice e foi descartado. O recorte abaixo é o que sobrou — preferimos dizer
          isso a mostrar um recorte diferente do que foi pedido.
        </p>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* 4. Os resultados, cada um com por que casa                          */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="flex flex-col gap-1"
        data-resultados-total={total}
        data-resultados-exibidos={exibidos}
      >
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-sm font-semibold">
            {!ativos.length
              ? "Nenhum critério de pé"
              : total === 0
                ? "Nenhum resultado"
                : exibidos < total
                  ? `Mostrando ${milhar(exibidos)} de ${milhar(total)} resultados`
                  : `${milhar(total)} resultado${total > 1 ? "s" : ""}`}
          </p>
          {total > 0 && resposta ? (
            <p className="text-sm text-tinta-2">
              em{" "}
              {Object.entries(resposta.porClasse)
                .sort((a, b) => b[1] - a[1])
                .map(([classe, n]) => `${ROTULO_CLASSE[classe as ClasseEntidade] ?? classe} ${n}`)
                .join(" · ")}
            </p>
          ) : null}
        </div>

        {!ativos.length ? (
          <p className="text-sm leading-snug text-tinta-2">
            Você tirou todas as fichas. Sem nenhum critério de pé não há por que mostrar
            coisa alguma — listar o acervo inteiro aqui seria devolver 5.092 resultados sem
            um motivo para nenhum deles. Recoloque uma ficha acima, ou reescreva a frase.
          </p>
        ) : null}

        {resposta && total > 0 ? (
          <ul className="flex list-none flex-col p-0">
            {resposta.resultados.map((resultado) => {
              const motivo = motivoDoCasamento(resultado.chave, ativos, vizinhanca, (criterio) =>
                casouCom(resultado, criterio) === true ||
                (casouCom(resultado, criterio) === null &&
                  ativos.filter((c) => c.campo === criterio.campo).length === 1),
              );

              // T-03-36 / D-28: resultado sem motivo NÃO RENDERIZA, e a falha é alta.
              // Um item mudo projetado na parede em cima do palco é a falha silenciosa
              // que a regra proíbe; derrubar o build é a falha visível que ela pede.
              if (!motivo) {
                throw new Error(
                  `D-28: resultado «${resultado.chave}» sem motivo de casamento em /buscar/frase. ` +
                    `Todo resultado explica por que casa, ou não aparece.`,
                );
              }

              const base = ROTA_POR_CLASSE[resultado.classe];
              const rota = base ? `${base}/${resultado.slug}/` : null;
              const titulo = (
                <span className="text-sm leading-snug font-bold">{resultado.titulo}</span>
              );

              return (
                <li
                  key={resultado.chave}
                  className="frase-resultado"
                  data-resultado={resultado.chave}
                  data-tipo={resultado.classe}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="frase-tipo" data-tipo-rotulo>
                      {ROTULO_CLASSE[resultado.classe] ?? resultado.classe}
                    </span>
                    {resultado.territorioRotulo ? (
                      <span className="text-xs text-tinta-2">{resultado.territorioRotulo}</span>
                    ) : null}
                  </div>
                  {rota ? (
                    <Link href={rota} className="no-underline">
                      {titulo}
                    </Link>
                  ) : (
                    titulo
                  )}
                  <p
                    className="frase-motivo"
                    data-motivo-casamento
                    data-origem-casamento={motivo.origem}
                  >
                    {motivo.origem === "aresta"
                      ? `«${motivo.texto}» — escrito no acervo`
                      : `casou por: ${motivo.texto}`}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : null}

        {resposta && exibidos < total ? (
          <p className="text-xs leading-snug text-tinta-2">
            A lista mostra {milhar(exibidos)} de {milhar(total)}. O corte é de exibição — as
            contagens acima e os números das fichas são sobre os {milhar(total)}.
          </p>
        ) : null}

        {/* ---------------------------------------------------------------- */}
        {/* 6. Zero-resultado, e ele nunca é beco (D-66)                      */}
        {/* ---------------------------------------------------------------- */}
        {resposta && total === 0 ? (
          <div className="mt-1 flex flex-col gap-1.5">
            <p className="text-sm leading-snug">
              Nenhuma das {milhar(indice.total)} entradas casa com todas as fichas de pé.
              Isto não é um beco: abaixo está <strong>qual ficha soltar</strong> e quantos
              resultados aquilo traria.
            </p>
            {resposta.afrouxamentos.map((afrouxamento) =>
              afrouxamento.tipo === "descoberta" ? (
                <Link
                  key={`${afrouxamento.tipo}:${afrouxamento.campo}:${afrouxamento.valor}`}
                  href={`/buscar/#f=${afrouxamento.campo}:${afrouxamento.valor}`}
                  className="frase-afrouxamento no-underline"
                  data-afrouxamento={afrouxamento.campo}
                  data-afrouxamento-n={afrouxamento.resultados}
                >
                  <span>{afrouxamento.rotulo} — na Buscar</span>
                  <span className="frase-afrouxamento-n">
                    {milhar(afrouxamento.resultados)}
                  </span>
                </Link>
              ) : (
                <button
                  key={`${afrouxamento.tipo}:${afrouxamento.campo}:${afrouxamento.valor}`}
                  type="button"
                  className="frase-afrouxamento"
                  data-afrouxamento={afrouxamento.campo}
                  data-afrouxamento-n={afrouxamento.resultados}
                  onClick={() => aplicarAfrouxamento(afrouxamento)}
                >
                  <span>{afrouxamento.rotulo}</span>
                  <span className="frase-afrouxamento-n">
                    {milhar(afrouxamento.resultados)} resultado
                    {afrouxamento.resultados > 1 ? "s" : ""}
                  </span>
                </button>
              ),
            )}
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. As regras que leem a frase (D-65)                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="frase-sem-ia" data-sem-ia>
        <button
          type="button"
          className="frase-botao w-fit"
          data-regras
          aria-pressed={regrasAbertas}
          onClick={() => setRegrasAbertas((v) => !v)}
        >
          {regrasAbertas
            ? "fechar as regras"
            : `ver as ${AS_REGRAS.length} regras que leem a frase`}
        </button>

        {regrasAbertas ? (
          <div className="flex flex-col">
            {AS_REGRAS.map((regra) => (
              <div key={regra.id} className="frase-regra" data-regra={regra.id}>
                <span className="frase-regra-nome">{regra.nome}</span>
                <span>{regra.padrao}</span>
                <span className="frase-regra-exemplo">exemplo: «{regra.exemplo}»</span>
                <span className="text-tinta-2">produz: {regra.produz}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. A lente do mapa (D-59)                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-1.5">
        <p className="frase-bloco-titulo">ver este recorte no mapa</p>
        <Link href={lente} className="frase-botao w-fit no-underline">
          <Grafismo variacao="barra" className="h-3 w-auto shrink-0 text-acao-tinta" />
          {idsLente.length ? `abrir ${milhar(idsLente.length)} no mapa` : "abrir o mapa sem recorte"}
        </Link>
        {total > idsLente.length ? (
          <p className="text-xs leading-snug text-tinta-2">
            A lente leva os primeiros {milhar(idsLente.length)} de {milhar(total)} — o corte
            é do endereço, que não comporta a lista inteira, e está declarado aqui em vez de
            acontecer em silêncio.
          </p>
        ) : null}
      </section>

    </div>
  );
}
