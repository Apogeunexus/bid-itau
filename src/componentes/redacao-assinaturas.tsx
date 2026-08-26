"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { rotaDaEntidade } from "@/dados/rotas";
import {
  CHAVE_DAS_PONTES,
  CHAVE_DAS_TRILHAS,
  lerPontes,
  lerTrilhasPublicadas,
} from "@/dados/redacao-registro";
import type { TrilhaPublicada } from "@/dados/redacao-registro";
import type { AfirmacaoDoAcervo, ArestaAutorada, FatiaAutorada } from "@/dados/redacao";

/**
 * redacao-assinaturas.tsx — «O que eu assinei» (E9). A contrapartida da M9.
 *
 * ESTA TELA NÃO ESCREVE NADA. Ela lê os registros das outras duas e a fatia autorada do
 * acervo, e é a única da Redação sem botão que altere o grafo. Curadoria é autoria, e
 * autoria responde: o valor dela está em mostrar, junto, o que uma pessoa afirmou.
 *
 * A DIFERENÇA PARA A M9 NÃO É DE FORMATO, É DE OBJETO. O moderador registra DECISÕES SOBRE O
 * TRABALHO DE OUTROS; o editor registra AFIRMAÇÕES PRÓPRIAS. Uma auditoria procura coisas
 * diferentes em cada uma — lá, se o critério valeu igual para todos; aqui, se quem afirmou
 * assina o que afirmou. Duas telas com a mesma cara e perguntas diferentes.
 *
 * O NÚMERO QUE ESTA TELA ABRE É 1, E NÃO 47. O acervo tem 47 nós de procedência `autorado`,
 * e apresentá-los como «afirmação assinada» inflaria a curadoria por um fator de quarenta e
 * sete: 40 são duplicatas semeadas para a fila de moderação ter o que julgar e 6 são as
 * personas do protótipo com os repertórios delas. Exatamente UM é curadoria. Numa tela cujo
 * assunto é auditar autoria, contar as três naturezas juntas seria o defeito.
 *
 * DP-F: `"use client"`. A fatia chega achatada da página de servidor; `rotas.ts` e
 * `redacao-registro.ts` são importáveis daqui porque não alcançam o grafo.
 */

type TipoDeAfirmacao = "trilha" | "ponte";

interface Afirmacao {
  chave: string;
  tipo: TipoDeAfirmacao;
  titulo: string;
  motivo: string;
  assinatura: string;
  carimbo: string;
  detalhe: string;
  /** Onde a afirmação aparece ao público. `null` quando não há endereço. */
  rotaDoOutroLado: string | null;
  semRotaPorque: string | null;
}

const ROTULO_DA_NATUREZA: Record<AfirmacaoDoAcervo["natureza"], string> = {
  curadoria: "curadoria",
  "duplicata-semeada": "duplicata semeada para a fila de moderação",
  "persona-do-prototipo": "persona do protótipo e o repertório dela",
};

function daTrilha(t: TrilhaPublicada): Afirmacao {
  return {
    chave: `trilha:${t.slug}`,
    tipo: "trilha",
    titulo: t.titulo,
    motivo: `Trilha de ${t.passos} passo(s), agendada para ${t.agendadaPara}.`,
    assinatura: t.assinatura,
    carimbo: t.carimbo,
    detalhe: "trilha curada",
    rotaDoOutroLado: `/trilha/${t.slug}/`,
    semRotaPorque: null,
  };
}

function daPonte(p: ArestaAutorada): Afirmacao {
  // A ponte não tem página própria: ela aparece como selo NAS PÁGINAS DAS DUAS PONTAS. O
  // outro lado dela é, portanto, a página da origem — e quando essa classe não tem página no
  // app, a tela diz isso em vez de apontar para um endereço que daria 404.
  const rota = p.deSlug ? rotaDaEntidade(p.deClasse, p.deSlug) : null;
  return {
    chave: `ponte:${p.deId}:${p.relacao}:${p.paraId}`,
    tipo: "ponte",
    titulo: `${p.deTitulo} → ${p.paraTitulo}`,
    motivo: p.motivo,
    assinatura: p.assinatura,
    carimbo: p.carimbo,
    detalhe: `relação «${p.relacao}»`,
    rotaDoOutroLado: rota,
    semRotaPorque: rota
      ? null
      : p.deSlug
        ? `A classe «${p.deClasse}» não tem página própria no app: esta ponte aparece dentro ` +
          "de outras telas, e não há endereço para onde apontar."
        : "Esta ponte foi registrada antes de o endereço público viajar junto. A afirmação " +
          "vale; o link para o outro lado é que não pode ser montado.",
  };
}

// ---------------------------------------------------------------------------

export function RedacaoAssinaturas({
  fatia,
  diferencaParaAModeracao,
  ausenciaDoFiltroDePeriodo,
}: {
  fatia: FatiaAutorada;
  diferencaParaAModeracao: string;
  ausenciaDoFiltroDePeriodo: string;
}) {
  const [afirmacoes, setAfirmacoes] = useState<Afirmacao[]>([]);
  const [tipo, setTipo] = useState<TipoDeAfirmacao | "todas">("todas");

  useEffect(() => {
    // Leitura no efeito, e não no render: sob `output: "export"` o HTML sai do build, e ler
    // `localStorage` na primeira renderização divergiria da hidratação (D-02).
    setAfirmacoes([...lerTrilhasPublicadas().map(daTrilha), ...lerPontes().map(daPonte)]);
  }, []);

  const visiveis = useMemo(
    () => (tipo === "todas" ? afirmacoes : afirmacoes.filter((a) => a.tipo === tipo)),
    [afirmacoes, tipo],
  );

  const porTipo = useMemo(
    () => ({
      trilha: afirmacoes.filter((a) => a.tipo === "trilha").length,
      ponte: afirmacoes.filter((a) => a.tipo === "ponte").length,
    }),
    [afirmacoes],
  );

  const deCuradoria = fatia.nos.filter((n) => n.natureza === "curadoria");
  const outrasNaturezas = fatia.nos.filter((n) => n.natureza !== "curadoria");
  const contagemPorNatureza = outrasNaturezas.reduce<Record<string, number>>((acc, n) => {
    acc[n.natureza] = (acc[n.natureza] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="studio redacao redacao-assinaturas">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Redação · o que eu assinei</span>
        <h1 className="studio-titulo">Curadoria é autoria, e autoria responde</h1>
        <p className="studio-objetivo">
          Esta tela não escreve nada. Ela reúne o que a Redação afirmou — as trilhas
          publicadas, as pontes de sentido — e mostra onde cada afirmação aparece ao público.
        </p>
        <div className="redacao-escopos">
          <span className="studio-pastilha">
            lê <code className="studio-literal">{CHAVE_DAS_TRILHAS}</code>
          </span>
          <span className="studio-pastilha">
            e <code className="studio-literal">{CHAVE_DAS_PONTES}</code>
          </span>
        </div>
      </header>

      <div className="redacao-colunas redacao-colunas-assinaturas">
        {/* ---------------------------------------------------------------- */}
        {/* As afirmações desta sessão                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="redacao-coluna-painel">
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Assinado nesta sessão</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{afirmacoes.length}</span>
                afirmação(ões)
              </span>
            </div>

            <div className="studio-acoes redacao-filtros" role="group" aria-label="filtrar por tipo">
              {(
                [
                  ["todas", `todas (${afirmacoes.length})`],
                  ["trilha", `trilhas (${porTipo.trilha})`],
                  ["ponte", `pontes (${porTipo.ponte})`],
                ] as const
              ).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  className="studio-botao"
                  data-filtro-afirmacao={valor}
                  data-ativo={tipo === valor ? "sim" : "nao"}
                  aria-pressed={tipo === valor}
                  onClick={() => setTipo(valor)}
                >
                  {rotulo}
                </button>
              ))}
            </div>

            {afirmacoes.length === 0 ? (
              <div className="studio-nao-sustenta" data-vazio-assinaturas>
                <span className="studio-nao-sustenta-rotulo">nada assinado ainda</span>
                <p>
                  Publique uma trilha no <Link href="/redacao/trilha/">editor de trilha</Link>{" "}
                  ou autore uma ponte em{" "}
                  <Link href="/redacao/pontes/">arestas de sentido</Link>, e o que você
                  assinar aparece aqui com autor, carimbo e o endereço público da afirmação.
                </p>
              </div>
            ) : visiveis.length === 0 ? (
              <p className="studio-nota">
                Nenhuma afirmação deste tipo. Há {afirmacoes.length} no total — troque o
                filtro acima.
              </p>
            ) : (
              <ul className="redacao-lista-afirmacoes">
                {visiveis.map((a) => (
                  <li key={a.chave} className="redacao-afirmacao" data-afirmacao={a.tipo}>
                    <div className="redacao-afirmacao-cabeca">
                      <span className="studio-pastilha studio-pastilha-marca">{a.detalhe}</span>
                      <strong>{a.titulo}</strong>
                    </div>
                    <p className="selo-motivo" data-motivo-afirmado={a.motivo}>
                      <span>{a.motivo}</span>
                    </p>
                    <p className="studio-nota redacao-decisao-assinatura">
                      procedência autorado · {a.assinatura} · {a.carimbo}
                    </p>
                    {a.rotaDoOutroLado ? (
                      <Link
                        href={a.rotaDoOutroLado}
                        className="studio-botao"
                        data-outro-lado={a.rotaDoOutroLado}
                      >
                        onde esta afirmação aparece ao público ↗
                      </Link>
                    ) : (
                      <p className="studio-nota" data-sem-outro-lado data-nao-sustenta>
                        {a.semRotaPorque}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">por que não há filtro por período</span>
              <p>{ausenciaDoFiltroDePeriodo}</p>
            </div>
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* A fatia autorada do grafo                                         */}
        {/* ---------------------------------------------------------------- */}
        <aside className="redacao-coluna-fatia">
          <section className="web-painel redacao-fatia" data-fatia-autorada={fatia.nosDeCuradoria}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A fatia autorada do acervo</span>
            </div>

            <p className="studio-nota">
              O grafo tem <strong>{fatia.nosDeclarados.toLocaleString("pt-BR")}</strong> nós
              de procedência «autorado» em {fatia.nosTotal.toLocaleString("pt-BR")}, e{" "}
              <strong>{fatia.arestasDeclaradas.toLocaleString("pt-BR")}</strong> ligações
              autoradas em {fatia.arestasTotal.toLocaleString("pt-BR")}.
            </p>

            <p className="studio-nota">
              Mas «autorado» quer dizer «não veio de fonte externa», e isso reúne coisas de
              naturezas diferentes. Dos {fatia.nosVarridos.toLocaleString("pt-BR")} nós
              varridos, <strong>{fatia.nosDeCuradoria}</strong> é de curadoria:
            </p>

            <ul className="redacao-lista-fatia">
              {deCuradoria.map((n) => (
                <li key={n.id} className="redacao-item-fatia" data-no-autorado={n.natureza}>
                  <span className="redacao-classe">{n.classe}</span>
                  <strong>{n.titulo}</strong>
                  <span className="studio-rotulo">
                    {n.ligacoesAutoradas} ligação(ões) autorada(s) tocam este nó
                  </span>
                  {n.rotaDoOutroLado ? (
                    <Link
                      href={n.rotaDoOutroLado}
                      className="studio-botao"
                      data-outro-lado={n.rotaDoOutroLado}
                    >
                      ver ao público ↗
                    </Link>
                  ) : (
                    <span className="studio-nota" data-nao-sustenta>
                      {n.semRotaPorque}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">o resto dos nós autorados</span>
              <p>
                Os outros {outrasNaturezas.length} não são afirmação editorial, e apresentá-los
                como tal inflaria a curadoria por um fator de{" "}
                {fatia.nosVarridos}:{" "}
                {Object.entries(contagemPorNatureza)
                  .map(
                    ([natureza, quantos]) =>
                      `${quantos} ${ROTULO_DA_NATUREZA[natureza as AfirmacaoDoAcervo["natureza"]]}`,
                  )
                  .join(" · ")}
                . A classificação é lida da estrutura do grafo — quem participa de
                `duplicata_suspeita` é semeadura da fila —, e não de marca no nome.
              </p>
            </div>

            <div className="studio-nao-sustenta" data-nao-sustenta data-arestas-alcancadas={fatia.arestasAlcancadas}>
              <span className="studio-nao-sustenta-rotulo">o que esta varredura não alcança</span>
              <p>
                Das {fatia.arestasDeclaradas} ligações autoradas do acervo, esta tela enxerga{" "}
                {fatia.arestasAlcancadas} — as que tocam um nó também autorado. Uma ponte
                autorada entre dois nós vindos da fonte não aparece na varredura, porque
                `grafo.ts` não expõe iteração sobre todas as arestas. Os dois números ficam
                lado a lado em vez de o alcançado ser apresentado como total.
              </p>
            </div>
          </section>

          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Por que não é a tela da Moderação</span>
            </div>
            <p className="studio-nota">{diferencaParaAModeracao}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
