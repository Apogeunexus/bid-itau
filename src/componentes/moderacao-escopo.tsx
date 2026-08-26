"use client";

import Link from "next/link";
import { OpcaoDeSegmento, Segmento } from "./base/segmento";
import { useMemo, useState } from "react";
import type {
  ConcentracaoMedida,
  Delegacao,
  Escalonamento,
  Escopo,
  IdDoEscopo,
  ItemDaFila,
  Ordenacao,
} from "@/dados/moderacao";

/**
 * moderacao-escopo.tsx — escopo, escalonamento e delegação (M8; funcionalidades 122 a 125).
 *
 * O QUE ERA A SESSÃO S4, e a razão de ela ter sido dissolvida aqui é a mesma que dá sentido
 * a esta tela: escopo não é uma variação da moderação, é a condição para ela ser nacional.
 * SP e RJ concentram 458 dos 773 registros de lugar do acervo, e dois estados não aparecem
 * em lugar nenhum. Uma fila centralizada reproduziria na governança o deserto que o mapa
 * denuncia — quem tem mais acervo receberia mais atenção, e quem não tem continuaria sem.
 *
 * TRÊS COISAS QUE ESTA TELA FAZ E AS OUTRAS NÃO.
 *
 * O ESCOPO IMPRESSO (122): o moderador vê o que ele **não** está vendo, com o número. Um
 * recorte que só mostra o que alcança faz quem opera confundir a própria fila com a fila
 * inteira — e a diferença entre as duas é justamente a parte do país que ninguém está
 * olhando.
 *
 * O ESCALONAMENTO (123): o que cai fora do escopo vai para um DESTINATÁRIO NOMEADO, e não
 * para «a equipe». Item fora do escopo que só some da lista vira trabalho de ninguém.
 *
 * A DELEGAÇÃO (125): com início, fim e quem assumiu. Uma delegação sem fim declarado é
 * transferência de responsabilidade sem data de volta, e ninguém consegue dizer depois quem
 * respondia por aquele escopo naquela semana.
 *
 * DP-F: `"use client"`, e `@/dados/moderacao` entra **apenas por tipo**.
 */

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function ModeracaoEscopo({
  fila,
  escopos,
  ordenacoes,
  concentracao,
  escalonamentos,
  delegacoes,
  regraDaDelegacao,
  moderador,
}: {
  fila: ItemDaFila[];
  escopos: readonly Escopo[];
  ordenacoes: readonly Ordenacao[];
  concentracao: ConcentracaoMedida;
  escalonamentos: readonly Escalonamento[];
  delegacoes: readonly Delegacao[];
  regraDaDelegacao: string;
  moderador: string;
}) {
  const [escopo, setEscopo] = useState<IdDoEscopo>("nacional");

  const escopoAtivo = useMemo(
    () => escopos.find((e) => e.id === escopo) ?? escopos[0],
    [escopos, escopo],
  );

  /** O mesmo despachante da fila, sobre `Escopo.campo`. A regra viaja como dado. */
  const noEscopo = (item: ItemDaFila) => {
    if (escopoAtivo.campo === "territorio") return item.territorio !== null;
    if (escopoAtivo.campo === "linguagens") return item.linguagens.length > 0;
    return true;
  };

  const dentro = useMemo(() => fila.filter(noEscopo).length, [fila, escopoAtivo]);
  const fora = fila.length - dentro;

  /** A cobertura por UF, medida sobre a fila — não sobre o acervo. */
  const porUf = useMemo(() => {
    const mapa = new Map<string, { itens: number; registros: number }>();
    for (const i of fila) {
      if (!i.uf) continue;
      const atual = mapa.get(i.uf) ?? { itens: 0, registros: i.registrosNaUf ?? 0 };
      atual.itens += 1;
      mapa.set(i.uf, atual);
    }
    return [...mapa.entries()]
      .map(([uf, v]) => ({ uf, ...v }))
      .sort((a, b) => a.registros - b.registros);
  }, [fila]);

  const semUf = fila.filter((i) => i.uf === null).length;
  const pctConcentracao = Math.round(
    (concentracao.doisMaiores / concentracao.total) * 100,
  );

  const vigentes = delegacoes.filter((d) => d.vigente);

  return (
    <div className="studio moderacao" data-escopo-moderacao>
      <header className="studio-cabecalho">
        <span className="studio-superficie">Moderação · escopo e escalonamento</span>
        <h1 className="studio-titulo">
          {comSeparador(concentracao.comRegistro)} de{" "}
          {comSeparador(concentracao.unidades)} unidades federativas no acervo
        </h1>
        <p className="studio-objetivo">
          O escopo é o que torna a moderação nacional possível sem centralizar tudo em São
          Paulo. Esta tela mostra o alcance de cada recorte, para onde vai o que cai fora
          dele, e quem está respondendo por qual escopo agora.
        </p>
        <div className="moderacao-ficha-atalhos">
          <Link className="studio-botao" href="/moderacao/fila/">
            ← voltar à fila
          </Link>
          <span className="studio-pastilha">
            operando como <strong>{moderador}</strong>
          </span>
        </div>
      </header>

      <div className="moderacao-colunas">
        {/* ================================================================ */}
        {/* A COBERTURA — o que cada escopo alcança, e o que ele NÃO alcança  */}
        {/* ================================================================ */}
        <section className="web-painel moderacao-coluna-ficha">
          <h2 className="web-painel-titulo">o alcance de cada escopo, medido</h2>

          <Segmento rotulo="escopo">
            {escopos.map((e) => (
              <OpcaoDeSegmento
                key={e.id}
                data-escopo-curador={e.id}
                selecionado={escopo === e.id}
                onClick={() => setEscopo(e.id)}
              >
                {e.rotulo} · {comSeparador(e.alcance)}
              </OpcaoDeSegmento>
            ))}
          </Segmento>

          <p className="moderacao-escopo-descricao">{escopoAtivo.descricao}</p>

          {/* 122 — O ESCOPO IMPRESSO. O número do que fica de fora tem o mesmo peso
              tipográfico do que fica dentro, de propósito: são as duas metades da mesma
              informação, e destacar só uma é o que faz o recorte parecer a fila inteira. */}
          <div className="web-denominadores" data-escopo-impresso={escopo}>
            <span className="web-denominador" data-alcance="dentro">
              <span className="web-denominador-numero">{comSeparador(dentro)}</span>
              <span className="web-denominador-rotulo">itens que este escopo alcança</span>
            </span>
            <span className="web-denominador" data-alcance="fora">
              <span className="web-denominador-numero">{comSeparador(fora)}</span>
              <span className="web-denominador-rotulo">
                itens que ele NÃO alcança — e alguém precisa ver
              </span>
            </span>
          </div>

          {/* ---- O mapa de cobertura por UF ---- */}
          <div className="moderacao-cobertura">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A fila por unidade federativa</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{porUf.length}</span>
                UFs na fila
              </span>
            </div>
            <ul className="moderacao-ufs">
              {porUf.map((u) => (
                <li key={u.uf} className="moderacao-uf" data-uf-na-fila={u.uf}>
                  <span className="moderacao-uf-sigla">{u.uf}</span>
                  <span className="moderacao-uf-itens">
                    {comSeparador(u.itens)} na fila
                  </span>
                  {/* O REGISTRO DO ESTADO ao lado do item na fila é o que torna a
                      prioridade por vazio conferível: quem lê vê que o Ceará tem 17
                      registros e São Paulo 274, e entende por que o primeiro sobe. */}
                  <span className="moderacao-uf-registros">
                    {comSeparador(u.registros)} registros no acervo
                  </span>
                </li>
              ))}
            </ul>
            <p className="studio-nota" data-sem-uf={semUf}>
              <strong>{comSeparador(semUf)}</strong> dos {comSeparador(fila.length)} itens
              não têm unidade federativa resolvida — o acervo não os situa em território
              nenhum. Eles não são falha da resolução: são itens que nenhum escopo
              territorial alcança, e é por isso que o escalonamento abaixo tem uma linha só
              para eles.
            </p>
          </div>

          {/* ---- 124: a justificativa da ordem, com o número que a sustenta ---- */}
          <div className="studio-nao-sustenta" data-nao-sustenta data-concentracao>
            <span className="studio-nao-sustenta-rotulo">
              por que a fila ordena por vazio, e não por volume
            </span>
            <p>
              <strong>
                {comSeparador(concentracao.doisMaiores)} dos{" "}
                {comSeparador(concentracao.total)}
              </strong>{" "}
              registros de lugar do acervo estão em dois dos{" "}
              {comSeparador(concentracao.unidades)} estados — {pctConcentracao}%.{" "}
              <strong>{concentracao.semRegistro.join(" e ")}</strong> não aparecem em lugar
              nenhum, e {comSeparador(concentracao.comUmRegistro.length)} estados têm um
              registro só ({concentracao.comUmRegistro.join(", ")}).
            </p>
            <p>
              {ordenacoes.find((o) => o.id === "vazio")?.porque}
            </p>
          </div>
        </section>

        {/* ================================================================ */}
        {/* ESCALONAMENTO E DELEGAÇÃO                                        */}
        {/* ================================================================ */}
        <div className="moderacao-coluna-decisao">
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Para onde vai o que cai fora</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{escalonamentos.length}</span>
                caminhos
              </span>
            </div>
            <ul className="moderacao-escalonamentos">
              {escalonamentos.map((e) => (
                <li
                  key={e.id}
                  className="moderacao-escalonamento"
                  data-escalonamento={e.id}
                >
                  <span className="studio-rotulo">quando</span>
                  <span>{e.quando}</span>
                  {/* O DESTINATÁRIO É NOMEADO. «Vai para a equipe» é o mesmo que não ir
                      para lugar nenhum — e um item que não vai para ninguém fica parado
                      até alguém tropeçar nele. */}
                  <span className="studio-rotulo">vai para</span>
                  <strong data-destinatario={e.id}>{e.paraQuem}</strong>
                  <span className="studio-nota">{e.porque}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Delegações de escopo</span>
              <span className="studio-pastilha studio-pastilha-marca">
                <span className="studio-pastilha-numero">{vigentes.length}</span>
                {vigentes.length === 1 ? "vigente" : "vigentes"}
              </span>
            </div>
            <ul className="moderacao-delegacoes">
              {delegacoes.map((d) => (
                <li
                  key={d.id}
                  className="moderacao-delegacao"
                  data-delegacao={d.id}
                  data-vigente={d.vigente ? "sim" : "nao"}
                >
                  <span className="moderacao-delegacao-cabeca">
                    <strong>{d.para}</strong>
                    <span className="studio-pastilha">escopo {d.escopo}</span>
                    <span className="studio-pastilha">
                      {d.vigente ? "vigente" : "encerrada"}
                    </span>
                  </span>
                  {/* INÍCIO E FIM SEMPRE. A delegação encerrada continua listada: a
                      pergunta «quem respondia por isto naquela semana» é a que uma
                      auditoria faz, e ela não pode deixar de ter resposta quando a pessoa
                      volta de férias. */}
                  <span
                    className="moderacao-delegacao-periodo"
                    data-inicio={d.inicio}
                    data-fim={d.fim}
                  >
                    <span className="studio-rotulo">de</span>
                    {d.inicio}
                    <span className="studio-rotulo">até</span>
                    {d.fim}
                  </span>
                  <span className="studio-nota">{d.motivo}</span>
                  <span className="moderacao-decisao-assinatura">
                    delegado por {d.de}
                  </span>
                </li>
              ))}
            </ul>
            <p className="studio-nota">{regraDaDelegacao}</p>
          </section>

          <section className="web-painel">
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">
                o que o protótipo não sustenta aqui
              </span>
              <p>
                As delegações são <strong>autoradas</strong>, como o perfil de quem modera:
                não há autenticação neste protótipo, e inventar um cadastro de pessoas seria
                fabricar o que o acervo não tem. O que a tela demonstra é a FORMA da
                delegação — quem, qual escopo, de quando a quando, e por quê —, não um
                sistema de contas.
              </p>
              <p>
                As datas derivam da data de referência do build, e por isso a delegação
                vigente e a encerrada continuam as mesmas a cada abertura. Um relógio de
                verdade faria a tela mudar sozinha entre duas visitas, e o protótipo se
                proibiu de ler relógio.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
