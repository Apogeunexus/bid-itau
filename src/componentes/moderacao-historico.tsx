"use client";

import Link from "next/link";
import { OpcaoDeSegmento, Segmento } from "./base/segmento";
import { useEffect, useMemo, useState } from "react";
import { ROTULO_DA_ACAO } from "@/dados/tipos-acesso";
import { CHAVE_DO_ARMAZEM, gravarArmazem, lerArmazem } from "./moderacao-armazem";
import type {
  AcaoDaModeracao,
  AcaoDeclarada,
  DecisaoRegistrada,
  DestinoDaAcao,
  Escopo,
  OrigemDeclarada,
  OrigemDoItem,
} from "@/dados/moderacao";

/**
 * moderacao-historico.tsx — o histórico das próprias decisões (M9, funcionalidade 121).
 *
 * A MODERAÇÃO AUDITÁVEL POR QUEM A EXERCE. Uma decisão registrada num armazém que ninguém
 * consegue ler é a mesma coisa que uma decisão não registrada: o que torna a moderação
 * prestável de contas não é gravar, é **conseguir mostrar depois** — com autor, carimbo,
 * ação, motivo e o item, e sem precisar reabrir a fila para descobrir de que item se trata.
 *
 * OS VETOS APARECEM SEPARADOS, e é a decisão de produto desta tela. Das quatro ações, o
 * veto é a única que encerra o assunto sem devolver a palavra a quem submeteu; é o que uma
 * auditoria procura primeiro, e um veto cujo motivo estivesse a três cliques de distância
 * seria, na prática, um veto sem motivo.
 *
 * ELA NÃO ESCREVE NADA — com uma exceção nomeada: desfazer. Uma tela de histórico que só
 * lê e não permite corrigir um engano obriga quem operou a ir procurar o item na fila para
 * desfazer lá, e a maior parte das pessoas simplesmente deixa o engano registrado.
 *
 * O QUE ELA NÃO É. Ela não compara moderadores, não mede tempo de fila e não pontua
 * concordância: isso é a funcionalidade 169, é do Admin, e misturar as duas aqui
 * transformaria a ferramenta de quem responde pelas próprias decisões na ferramenta de quem
 * avalia o desempenho dela. A tela diz isso, em vez de apenas não fazer.
 *
 * DP-F: `"use client"`, e `@/dados/moderacao` entra **apenas por tipo**.
 */

const ROTULO_ORIGEM: Record<OrigemDoItem, string> = {
  produtor: "produtor",
  ingestao: "ingestão automática",
  ia: "sugestão de IA",
  denuncia: "denúncia do público",
};

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

type FiltroDeAcao = AcaoDaModeracao | "todas";
type FiltroDeOrigem = OrigemDoItem | "todas";

export function ModeracaoHistorico({
  acoes,
  origens,
  escopos,
  destinos,
  oHistoricoEDoModerador,
  porQueOVetoSeparado,
  moderador,
  carimbo,
}: {
  acoes: readonly AcaoDeclarada[];
  origens: readonly OrigemDeclarada[];
  escopos: readonly Escopo[];
  destinos: readonly DestinoDaAcao[];
  oHistoricoEDoModerador: string;
  porQueOVetoSeparado: string;
  moderador: string;
  carimbo: string;
}) {
  const [decisoes, setDecisoes] = useState<DecisaoRegistrada[]>([]);
  const [armazemLido, setArmazemLido] = useState(false);
  const [falhaDoArmazem, setFalhaDoArmazem] = useState<string | null>(null);

  const [filtroAcao, setFiltroAcao] = useState<FiltroDeAcao>("todas");
  const [filtroOrigem, setFiltroOrigem] = useState<FiltroDeOrigem>("todas");
  const [filtroEscopo, setFiltroEscopo] = useState<string>("todos");

  useEffect(() => {
    const lido = lerArmazem();
    setDecisoes(lido.decisoes);
    setFalhaDoArmazem(lido.falha);
    setArmazemLido(true);
  }, []);

  useEffect(() => {
    if (armazemLido) setFalhaDoArmazem(gravarArmazem(decisoes));
  }, [decisoes, armazemLido]);

  const filtradas = useMemo(
    () =>
      decisoes.filter(
        (d) =>
          (filtroAcao === "todas" || d.acao === filtroAcao) &&
          (filtroOrigem === "todas" || d.origem === filtroOrigem) &&
          (filtroEscopo === "todos" || d.escopo === filtroEscopo),
      ),
    [decisoes, filtroAcao, filtroOrigem, filtroEscopo],
  );

  /** Os vetos, sempre sobre o conjunto FILTRADO — senão os dois números discordariam. */
  const vetos = useMemo(() => filtradas.filter((d) => d.acao === "vetar"), [filtradas]);

  const contagemPorAcao = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of decisoes) c[d.acao] = (c[d.acao] ?? 0) + 1;
    return c;
  }, [decisoes]);

  const desfazer = (itemId: string) =>
    setDecisoes((antes) => antes.filter((d) => d.itemId !== itemId));

  const filtrando =
    filtroAcao !== "todas" || filtroOrigem !== "todas" || filtroEscopo !== "todos";

  return (
    <div className="studio moderacao" data-historico-moderacao>
      <header className="studio-cabecalho">
        <span className="studio-superficie">Moderação · meu histórico</span>
        <h1 className="studio-titulo">
          {comSeparador(decisoes.length)}{" "}
          {decisoes.length === 1 ? "decisão registrada" : "decisões registradas"}
        </h1>
        <p className="studio-objetivo">
          Toda decisão com autor, carimbo, ação, motivo e o item — e para onde ela foi, do
          lado de quem recebeu. É o que permite a quem modera responder pelo que decidiu.
        </p>
        <div className="moderacao-ficha-atalhos">
          <Link className="studio-botao" href="/moderacao/fila/">
            ← voltar à fila
          </Link>
          <Link className="studio-botao" data-ir-para="ia" href="/moderacao/ia/">
            revisão da IA
          </Link>
          <span className="studio-pastilha">
            operando como <strong>{moderador}</strong>
          </span>
        </div>
      </header>

      <div className="moderacao-colunas">
        {/* ================================================================ */}
        {/* A TABELA — toda decisão, com o destino do outro lado              */}
        {/* ================================================================ */}
        <section className="web-painel moderacao-coluna-ficha">
          <div className="studio-painel-cabeca">
            <span className="studio-painel-nome">As decisões</span>
            <span className="studio-pastilha">
              <span className="studio-pastilha-numero">
                {comSeparador(filtradas.length)}
              </span>
              {filtrando ? "no filtro" : "no total"}
            </span>
          </div>

          {/* ---- Filtros: ação, origem e escopo ---- */}
          <div className="moderacao-filtros">
            <div className="moderacao-filtro">
              <span className="studio-rotulo">ação</span>
              <Segmento rotulo="filtrar por ação">
                <OpcaoDeSegmento
                  data-filtro-acao="todas"
                  selecionado={filtroAcao === "todas"}
                  onClick={() => setFiltroAcao("todas")}
                >
                  todas · {comSeparador(decisoes.length)}
                </OpcaoDeSegmento>
                {acoes.map((a) => (
                  <OpcaoDeSegmento
                    key={a.id}
                    data-filtro-acao={a.id}
                    selecionado={filtroAcao === a.id}
                    onClick={() => setFiltroAcao(a.id)}
                  >
                    {/* A contagem vem do conjunto INTEIRO, não do filtrado: é o que
                        permite ver que existem três vetos antes de clicar em vetos. */}
                    {a.rotulo} · {comSeparador(contagemPorAcao[a.id] ?? 0)}
                  </OpcaoDeSegmento>
                ))}
              </Segmento>
            </div>

            <div className="moderacao-filtro">
              <span className="studio-rotulo">origem do item</span>
              <Segmento rotulo="filtrar por origem">
                <OpcaoDeSegmento
                  data-filtro-origem="todas"
                  selecionado={filtroOrigem === "todas"}
                  onClick={() => setFiltroOrigem("todas")}
                >
                  todas
                </OpcaoDeSegmento>
                {origens.map((o) => (
                  <OpcaoDeSegmento
                    key={o.id}
                    data-filtro-origem={o.id}
                    selecionado={filtroOrigem === o.id}
                    onClick={() => setFiltroOrigem(o.id)}
                  >
                    {o.rotulo}
                  </OpcaoDeSegmento>
                ))}
              </Segmento>
            </div>

            <div className="moderacao-filtro">
              <span className="studio-rotulo">escopo em que decidi</span>
              <Segmento rotulo="filtrar por escopo">
                <OpcaoDeSegmento
                  data-filtro-escopo="todos"
                  selecionado={filtroEscopo === "todos"}
                  onClick={() => setFiltroEscopo("todos")}
                >
                  todos
                </OpcaoDeSegmento>
                {escopos.map((e) => (
                  <OpcaoDeSegmento
                    key={e.id}
                    data-filtro-escopo={e.id}
                    selecionado={filtroEscopo === e.id}
                    onClick={() => setFiltroEscopo(e.id)}
                  >
                    {e.rotulo}
                  </OpcaoDeSegmento>
                ))}
              </Segmento>
            </div>
          </div>

          {filtradas.length ? (
            <ul className="moderacao-decisoes" data-tabela-historico>
              {filtradas.map((d) => {
                const destino = destinos.find((x) => x.acao === d.acao);
                return (
                  <li
                    key={d.itemId}
                    className="moderacao-decisao"
                    data-decisao-moderacao={d.itemId}
                    data-acao-registrada={d.acao}
                  >
                    <span className="moderacao-decisao-cabeca">
                      <strong>{ROTULO_DA_ACAO[d.acao]}</strong>
                      <span className="moderacao-selo-origem" data-origem={d.origem}>
                        {ROTULO_ORIGEM[d.origem]}
                      </span>
                      <span className="studio-pastilha">situação: {d.situacao}</span>
                      {d.escopo ? (
                        <span className="studio-pastilha">escopo: {d.escopo}</span>
                      ) : null}
                    </span>
                    <span className="moderacao-decisao-titulo">{d.itemTitulo}</span>
                    {d.motivo ? (
                      <span className="moderacao-decisao-motivo">
                        <span className="studio-rotulo">
                          {d.acao === "vetar" ? "motivo do veto" : "comentário"}
                        </span>
                        {d.motivo}
                      </span>
                    ) : (
                      <span className="studio-rotulo" data-nao-sustenta>
                        sem motivo escrito — e nesta ação ele não é exigido
                      </span>
                    )}

                    {/* PARA ONDE A DECISÃO FOI, do lado de quem recebeu. Sem isto o
                        histórico mostra «devolvido» e ninguém sabe onde procurar. */}
                    <span className="moderacao-decisao-destino" data-destino={d.acao}>
                      <span className="studio-rotulo">do outro lado</span>
                      {destino?.doOutroLado}
                      {destino?.rotaDoOutroLado ? (
                        <>
                          {" "}
                          <Link href={destino.rotaDoOutroLado}>ver onde isso aparece</Link>
                        </>
                      ) : destino?.porqueSemRota ? (
                        <span data-nao-sustenta> {destino.porqueSemRota}</span>
                      ) : null}
                    </span>

                    <span className="moderacao-decisao-assinatura" data-carimbo={d.quando} data-autor={d.autor}>
                      {d.autor} · {d.quando}
                    </span>
                    <button
                      type="button"
                      className="studio-botao moderacao-desfazer"
                      data-desfazer-decisao={d.itemId}
                      onClick={() => desfazer(d.itemId)}
                    >
                      desfazer
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="studio-nota" data-historico-vazio>
              {decisoes.length === 0
                ? "Nenhuma decisão ainda. Este histórico começa vazio de propósito: nada nesta plataforma avança sem alguém decidir, e enquanto ninguém decidir não há o que auditar."
                : "Nenhuma decisão neste filtro. As outras continuam registradas — trocar o filtro acima as devolve."}
            </p>
          )}
        </section>

        {/* ================================================================ */}
        {/* OS VETOS, separados — é o que uma auditoria abre primeiro          */}
        {/* ================================================================ */}
        <div className="moderacao-coluna-decisao">
          <section className="web-painel moderacao-vetos" data-painel-vetos>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Os vetos, com o motivo por extenso</span>
              <span className="studio-pastilha studio-pastilha-marca">
                <span className="studio-pastilha-numero">{comSeparador(vetos.length)}</span>
                {vetos.length === 1 ? "veto" : "vetos"}
              </span>
            </div>

            {vetos.length ? (
              <ul className="moderacao-decisoes">
                {vetos.map((d) => (
                  <li
                    key={d.itemId}
                    className="moderacao-decisao"
                    data-veto-registrado={d.itemId}
                  >
                    <span className="moderacao-decisao-titulo">{d.itemTitulo}</span>
                    <span className="moderacao-decisao-motivo">{d.motivo}</span>
                    <span className="moderacao-decisao-assinatura" data-carimbo={d.quando} data-autor={d.autor}>
                      {d.autor} · {d.quando}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="studio-nota">
                Nenhum veto registrado{filtrando ? " neste filtro" : ""}. Quando houver, cada
                um aparece aqui com o motivo inteiro — nunca resumido, nunca atrás de um
                clique.
              </p>
            )}
            <p className="studio-nota">{porQueOVetoSeparado}</p>
          </section>

          <section className="web-painel">
            <div className="studio-nao-sustenta" data-nao-sustenta data-limite-do-historico>
              <span className="studio-nao-sustenta-rotulo">o que este histórico não é</span>
              <p>{oHistoricoEDoModerador}</p>
            </div>

            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">
                o que o protótipo não sustenta aqui
              </span>
              <p>
                O histórico é o <strong>desta sessão</strong>, guardado no navegador sob a
                chave <code className="studio-literal">{CHAVE_DO_ARMAZEM}</code>. Não há
                servidor: um histórico de verdade viveria fora do navegador de quem decide, e
                é isso que permitiria a uma auditoria lê-lo sem depender da máquina dele.
              </p>
              <p>
                O carimbo de todas as decisões é <strong>{carimbo}</strong>, derivado da data
                de referência do build. Não há relógio: duas decisões tomadas com minutos de
                diferença recebem o mesmo carimbo, e por isso este histórico{" "}
                <strong>não ordena por tempo</strong> — ele lista na ordem em que as decisões
                foram tomadas nesta sessão, que é a informação que ele de fato tem.
              </p>
              {falhaDoArmazem ? <p data-falha-armazem>{falhaDoArmazem}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
