"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { CamadaDesertos, LeituraDesertos, type DadosDesertos } from "@/componentes/desertos";
import type {
  DadosDoObservatorio,
  FatiaDeProcedencia,
  Indicador,
  LinhaDeIndicador,
} from "@/dados/observatorio";

/**
 * observatorio.tsx — o Observatório (D-87, D-88, D-89, D-90).
 *
 * O PAINEL DE PROCEDÊNCIA ABRE A TELA, NÃO A FECHA. Ele é a primeira coisa depois do
 * cabeçalho, com peso visual de primeira ordem, e isso é a decisão de projeto inteira: um
 * painel de procedência em rodapé, em cinza, é uma nota de rodapé sobre honestidade;
 * no topo, em número grande, ele é o argumento. D-88 pede a segunda coisa.
 *
 * A FRASE SOBRE «AUTORADO» NÃO PODE SER SUAVIZADA. Ela vem do módulo, em
 * `SIGNIFICADO_DA_PROCEDENCIA`, e diz que aquelas 47 entidades nós inventamos para o
 * protótipo. Nenhum concorrente vai escrever isso na própria tela — e é justamente por
 * escrever que os outros 4.826 passam a ser verificáveis em vez de acreditáveis.
 *
 * SEM BIBLIOTECA DE GRÁFICO E SEM UMA ÚNICA REQUISIÇÃO DE REDE. As barras são elementos de
 * HTML com largura em porcentagem calculada do número. Duas razões, e as duas são de
 * engenharia: uma biblioteca de gráfico derrubaria o gate de zero requisição externa que o
 * artefato estático mantém desde a fase 2; e `visiveis()` do prelúdio de verificação FALHA
 * sobre SVG, porque `offsetParent` é nulo em elemento SVG — barra em HTML é mensurável
 * pelos gates sem ginástica. O SVG fica onde ele já é a forma certa: o mapa.
 *
 * NENHUMA LARGURA DE BARRA É LITERAL. Ela sai de `fatia.fracao`, por `style` calculado. Uma
 * barra desenhada à mão que não acompanhe o dado é a mentira mais fácil de cometer nesta
 * tela — e passaria num gate de presença sem sintoma nenhum.
 *
 * DP-F: este arquivo é `"use client"` e importa `@/dados/observatorio` APENAS POR TIPO. O
 * módulo alcança 23 MB de grafo; o que chega aqui é o DTO, montado no build pela página de
 * servidor.
 *
 * O painel, os números, os denominadores e as declarações de D-90 são PRODUTO: eles
 * respondem ao RFP, e nenhum deles é nota sobre o protótipo.
 */

export interface TelaDoObservatorio {
  dados: DadosDoObservatorio;
  desertos: DadosDesertos;
  viewBox: string;
  contorno: string;
  rotuloContorno: string;
  atalhos: readonly { href: string; rotulo: string }[];
}

/**
 * Separador de milhar escrito à mão, e não `toLocaleString`.
 *
 * `toLocaleString("pt-BR")` depende do ICU do ambiente: o Node do build e o navegador de
 * quem avalia podem formatar diferente, e o React acusaria divergência de hidratação num
 * número que é o argumento da tela. Uma função pura de dez caracteres não tem esse risco.
 */
function milhar(n: number): string {
  const [inteiro, decimal] = String(n).split(".");
  const agrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimal ? `${agrupado},${decimal}` : agrupado;
}

/** A composição de uma fatia, em uma linha só. Três linhas empilhadas custariam a dobra. */
function composicaoEmLinha(linhas: LinhaDeIndicador[]): string {
  return linhas.map((l) => `${l.rotulo} ${milhar(l.valor ?? 0)}`).join(" · ");
}

// ---------------------------------------------------------------------------
// O painel de procedência (D-88)
// ---------------------------------------------------------------------------

function Fatia({ fatia, leitura }: { fatia: FatiaDeProcedencia; leitura: string }) {
  return (
    <div
      data-procedencia-fatia={fatia.procedencia}
      data-leitura-procedencia={leitura}
      className="obs-fatia"
    >
      <p className="obs-fatia-cabeca">
        <span className="obs-fatia-numero">{milhar(fatia.n)}</span>
        <span className="obs-fatia-percentual">{milhar(fatia.percentual)}%</span>
      </p>

      {/* A barra. `width` sai do dado; `min-width` mora na folha, para a fatia de 0,1% não
          desaparecer da tela — some a barra, some a informação de que ela é minúscula. */}
      <span className="obs-trilho">
        <span
          className="obs-barra"
          data-procedencia={fatia.procedencia}
          style={{ width: `${(fatia.fracao * 100).toFixed(2)}%` }}
        />
      </span>

      <p className="obs-fatia-composicao">{composicaoEmLinha(fatia.composicao)}</p>
      <p className="obs-fatia-exemplo">
        <span className="obs-etiqueta">{fatia.regraDoExemplo}</span> {fatia.exemplo}
      </p>
    </div>
  );
}

/**
 * Uma procedência, com as DUAS leituras na mesma linha.
 *
 * Este arranjo é a decisão de composição do painel, e ela vem do que os números dizem: a
 * proporção de `ic` cai de 61,8% em entidade para 22,4% em aresta, e a de `derivado` sobe
 * de 37,6% para 77,5%. Em duas colunas independentes, essa inversão — que é o achado —
 * exigiria comparar dois blocos separados por 500 px. Lado a lado, na mesma linha, ela
 * salta.
 *
 * E o significado da procedência aparece UMA VEZ, atravessando as duas colunas: a frase
 * «nós inventamos para o protótipo» é a mesma para a entidade e para a aresta, e repeti-la
 * duas vezes por procedência gastaria seis parágrafos idênticos e empurraria o painel para
 * fora da primeira vista — que é justamente o que D-88 não admite.
 */
function LinhaDeProcedencia({
  entidade,
  aresta,
}: {
  entidade: FatiaDeProcedencia;
  aresta: FatiaDeProcedencia;
}) {
  return (
    <div className="obs-linha" data-procedencia={entidade.procedencia}>
      <p className="obs-linha-nome" data-procedencia={entidade.procedencia}>
        {entidade.rotulo}
      </p>
      <Fatia fatia={entidade} leitura="entidades" />
      <Fatia fatia={aresta} leitura="arestas" />
      <p className="obs-linha-significado">{entidade.significado}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Um indicador (D-87, D-90)
// ---------------------------------------------------------------------------

function Denominador({
  id,
  chave,
  n,
  do_que,
}: {
  id: string;
  chave: string;
  n: number;
  do_que: string;
}) {
  return (
    <li className="web-denominador obs-denominador" data-denominador={`${id}:${chave}`}>
      <span className="web-denominador-numero">{milhar(n)}</span>
      <span className="web-denominador-rotulo">{do_que}</span>
    </li>
  );
}

function CartaoDeIndicador({
  indicador,
  destacado,
  primeiro,
}: {
  indicador: Indicador;
  destacado: boolean;
  primeiro: boolean;
}) {
  const i = indicador;
  return (
    <li
      data-indicador={i.id}
      data-sustentado={i.sustentado ? "sim" : "nao"}
      data-destaque={destacado ? "sim" : "nao"}
      className={clsx("web-painel obs-indicador", primeiro && "web-grade-largo")}
    >
      <h3 className="obs-indicador-titulo">{i.rotulo}</h3>

      <p className="obs-valor">
        {i.valor === null ? (
          <span className="obs-sem-lastro">o dado não sustenta</span>
        ) : (
          <span className="obs-numero">{milhar(i.valor)}</span>
        )}
        <span className="obs-unidade">{i.unidade}</span>
      </p>

      {/* Os denominadores são PRODUTO e aparecem sustentado ou não. «Um indicador sem lastro
          não some e não aparece zerado: ele aparece dizendo quantos de quantos.» */}
      <ul className="web-denominadores obs-denominadores">
        <Denominador id={i.id} chave="principal" n={i.denominador.n} do_que={i.denominador.do_que} />
        {i.denominadorSecundario ? (
          <Denominador
            id={i.id}
            chave="secundario"
            n={i.denominadorSecundario.n}
            do_que={i.denominadorSecundario.do_que}
          />
        ) : null}
      </ul>

      {!i.sustentado && i.declaracao ? (
        <p data-nao-sustenta={i.id} className="web-declaracao obs-declaracao">
          {i.declaracao}
        </p>
      ) : null}

      <p className="obs-indicador-leitura">{i.leitura}</p>

      {/* AS BARRAS DE DETALHE SÓ EXISTEM ONDE O DADO SUSTENTA O INDICADOR, e isto é
          conserto de um defeito medido, não preferência. Com barra, a linha «ocorrências
          marcadas gratuitas · 2.425 de 2.425» desenhava uma barra CHEIA — que é
          exatamente «a barra de 100% gratuito» que D-90 proíbe. O denominador ao lado não
          desfaz a imagem: quem passa o olho lê a barra, não a fração, e sai com a
          impressão de que o acervo é todo gratuito. Onde o corte não recorta, o detalhe
          fica em número e denominador, sem desenho. */}
      {i.detalhe.length ? (
        <ul className="obs-detalhe" data-com-barra={i.sustentado ? "sim" : "nao"}>
          {i.detalhe.map((l) => (
            <li key={`${i.id}-${l.rotulo}`} className="obs-detalhe-linha" title={l.nota}>
              <span className="obs-detalhe-rotulo">{l.rotulo}</span>
              {i.sustentado ? (
                <span className="obs-detalhe-trilho">
                  <span
                    className="obs-detalhe-barra"
                    style={{ width: `${l.de > 0 ? ((l.valor ?? 0) / l.de) * 100 : 0}%` }}
                  />
                </span>
              ) : (
                <span className="obs-detalhe-sem-barra">não recorta</span>
              )}
              <span className="obs-detalhe-valor">
                {milhar(l.valor ?? 0)}
                <span className="obs-detalhe-de"> de {milhar(l.de)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="obs-origem">
        <span className="obs-etiqueta">origem do número</span>
        {i.procedenciaDoNumero}
      </p>
    </li>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function Observatorio({
  dados,
  desertos,
  viewBox,
  contorno,
  rotuloContorno,
  atalhos,
}: TelaDoObservatorio) {
  const { painel, indicadores, publicos, numeros } = dados;
  const [publicoId, definirPublico] = useState(dados.publicoInicial);

  /**
   * A CAMADA DE DESERTOS MONTA DEPOIS DA HIDRATAÇÃO, e isto é conserto de um defeito real
   * — não preferência.
   *
   * `desertos.tsx` (fase 3, e arquivo que este plano não pode editar) dá ao `<title>` de
   * cada estado uma LISTA de filhos: `{uf.titulo} — {uf.registros}{" "}…`. React 19 exige
   * que `children` de `<title>` seja uma string única; com lista, o renderizador de
   * SERVIDOR emite `<title></title>` vazio e o de cliente escreve o texto — e a diferença
   * entre os dois derruba a hidratação da rota inteira com o erro #418. Medido: as 27
   * `<title>` saíam vazias no HTML exportado, e o console acusava a divergência.
   *
   * A fase 3 nunca esbarrou nisso porque `/mapa` só monta a camada DEPOIS de um clique —
   * ela nunca é renderizada no servidor lá. Montá-la aqui do mesmo jeito é repetir o
   * comportamento herdado em vez de inventar um novo, e o `<title>` volta a sair com o
   * texto certo (conferido no DOM vivo: «Acre — 2 registros»).
   *
   * O QUE NÃO SE PERDE: o contorno do Brasil continua no HTML estático, e `LeituraDesertos`
   * é HTML puro e continua servida no artefato — Sergipe, Tocantins e a frase que distingue
   * registro no acervo de oferta cultural do estado estão no arquivo, não dependem de
   * JavaScript.
   *
   * O CONSERTO DEFINITIVO É DE 05-08, e é de uma linha em `desertos.tsx`: trocar os filhos
   * do `<title>` por uma template string única.
   */
  const [camada, definirCamada] = useState(false);
  useEffect(() => definirCamada(true), []);
  const publico = publicos.find((p) => p.id === publicoId) ?? publicos[0];

  // O RECORTE, e não a tela: os MESMOS indicadores, reordenados. Nada é filtrado, nada é
  // exclusivo de um público — trocar a lista por um subconjunto transformaria o seletor em
  // filtro, e um filtro que some com o número inconveniente é o oposto desta tela.
  const porId = new Map(indicadores.map((i) => [i.id, i]));
  const ordenados = publico.ordem
    .map((id) => porId.get(id))
    .filter((i): i is Indicador => Boolean(i));

  return (
    <section data-observatorio className="obs">
      <header className="obs-cabecalho">
        <div className="obs-cabecalho-texto">
          <p className="obs-superficie">Bastidor · Observatório</p>
          <h1 className="obs-titulo">Impacto cultural, medido no acervo</h1>
        </div>
        <nav className="obs-atalhos" aria-label="outras superfícies de bastidor">
          {atalhos.map((a) => (
            <a key={a.href} href={a.href} className="obs-atalho">
              {a.rotulo}
            </a>
          ))}
        </nav>
      </header>

      {/* ---------------------------------------------------------------
          O PAINEL DE PROCEDÊNCIA — primeira coisa da tela (D-88).
          --------------------------------------------------------------- */}
      <section data-procedencia-painel="acervo" className="obs-procedencia">
        <div className="obs-procedencia-topo">
          <h2 className="obs-procedencia-titulo">De onde veio cada coisa que esta tela mostra</h2>
          <p className="obs-procedencia-tese">
            Das <strong>{milhar(painel.totalDeEntidades)}</strong> entidades e das{" "}
            <strong>{milhar(painel.totalDeArestas)}</strong> ligações: o que veio do Itaú
            Cultural, o que foi derivado e o que foi autorado.
          </p>
        </div>

        <div className="obs-tabela">
          <p className="obs-colunas" aria-hidden="true">
            <span className="obs-coluna-vazia" />
            <span className="obs-coluna-cabeca">
              <span className="obs-coluna-rotulo">Entidades</span>
              <span className="obs-coluna-total">{milhar(painel.totalDeEntidades)}</span>
              <span className="obs-coluna-nota">
                as coisas do acervo: pessoas, obras, eventos, territórios, conteúdos
              </span>
            </span>
            <span className="obs-coluna-cabeca">
              <span className="obs-coluna-rotulo">Ligações</span>
              <span className="obs-coluna-total">{milhar(painel.totalDeArestas)}</span>
              <span className="obs-coluna-nota">
                as ligações entre elas: é a ligação, e não a coisa, que faz o grafo explicar
              </span>
            </span>
          </p>

          {painel.entidades.map((f) => {
            const par = painel.arestas.find((a) => a.procedencia === f.procedencia);
            return par ? (
              <LinhaDeProcedencia key={f.procedencia} entidade={f} aresta={par} />
            ) : null;
          })}
        </div>

        <p className="obs-diferenca">{painel.leituraDaDiferenca}</p>

        <p className="obs-conferencia">
          <span className="obs-etiqueta">conferência</span>
          As fatias somam {milhar(painel.conferencia.somaDeEntidades)} entidades e{" "}
          {milhar(painel.conferencia.somaDeArestas)} ligações, exatamente os totais do acervo.
          Três fontes independentes precisam concordar para esta tela abrir —{" "}
          {painel.conferencia.fontes.length} contagens feitas em processos separados; se
          divergirem, o build quebra em vez de exibir. Grafo gerado em{" "}
          {painel.conferencia.geradoEm}.
        </p>

      </section>

      {/* ---------------------------------------------------------------
          O SELETOR DE PÚBLICO (D-89) — troca o recorte, não a tela.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-recorte-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-recorte-titulo" className="obs-secao-titulo">
            Indicadores de impacto cultural
          </h2>
          <Segmento rotulo="público" className="obs-publicos">
            {publicos.map((p) => (
              <OpcaoDeSegmento
                key={p.id}
                data-publico={p.id}
                selecionado={p.id === publico.id}
                onClick={() => definirPublico(p.id)}
              >
                {p.rotulo}
              </OpcaoDeSegmento>
            ))}
          </Segmento>
        </div>
        <p className="obs-publico-nota">
          <strong>{publico.rotulo}</strong> — {publico.resumo}. A pergunta que ele faz é «
          {publico.pergunta}», e é ela que ordena os {indicadores.length} blocos abaixo. Os
          quatro públicos veem <strong>os mesmos {indicadores.length} indicadores</strong>:
          muda a ordem e a ênfase, não o conjunto.
        </p>

        <ul className="web-grade obs-indicadores" data-publico-ativo={publico.id}>
          {ordenados.map((i, pos) => (
            <CartaoDeIndicador
              key={i.id}
              indicador={i}
              destacado={pos < publico.destaques}
              primeiro={pos === 0}
            />
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------------
          O MAPA DE DESERTOS CULTURAIS (D-62), na tela do Observatório.
          --------------------------------------------------------------- */}
      <section className="obs-desertos" data-desertos-observatorio>
        <div className="obs-desertos-mapa">
          <svg
            viewBox={viewBox}
            role="img"
            aria-label={`${rotuloContorno} — ${desertos.ufs.length} unidades federativas pintadas pela contagem de registros do acervo`}
            className="web-mapa obs-mapa"
            data-mapa-desertos
            data-camada={camada ? "sim" : "nao"}
          >
            <path className="mapa-contorno" d={contorno} />
            {camada ? <CamadaDesertos dados={desertos} /> : null}
          </svg>
        </div>
        <div className="obs-desertos-leitura">
          <LeituraDesertos dados={desertos} />
        </div>
      </section>
    </section>
  );
}
