"use client";

import { useMemo } from "react";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  LIVROS_DO_PRODUTOR,
  O_QUE_ESTA_INSTRUMENTADO,
  O_QUE_O_ALCANCE_NAO_SUSTENTA,
  REGRA_DO_ALCANCE,
  type EstadoDaMedida,
} from "@/dados/tipos-organizacao";
import type { EventoParaPrograma, InstituicaoDoAcervo } from "@/dados/organizacao";

/**
 * studio-org-alcance.tsx — O9 · Alcance consolidado (funcionalidade 152), na V2 dos três livros.
 *
 * O QUE A V2 TROCA SÃO OS KPIs, NÃO O DESENHO. O vocabulário visual continua sendo o de
 * sempre: `.web-denominadores` — número grande, rótulo micro —, que é o que faz esta tela ser
 * lida a três metros numa banca. Substituir o cartão de número por prosa transformaria um
 * painel em documento, e documento ninguém confere de pé.
 *
 * A PROSA VIROU ATRIBUTO. Cada motivo — por que uma medida não coleta, por que a recusa
 * existe — mora em `title` no cartão e por extenso APENAS na coluna da direita, que é onde a
 * V1 já os punha. No corpo do painel, uma linha por bloco, no máximo.
 *
 * TRÊS LIVROS COM DENOMINADORES DIFERENTES: o catálogo dela, quem apareceu, e o que ela
 * injetou no programa. Uma faixa de KPI por livro; dentro da faixa, «o que eu fiz» antes de
 * «o que resultou», na ordem de leitura e sem virar duas colunas — o painel é uma régua só.
 *
 * O CARTÃO SEM COLETA MOSTRA «—», E NÃO ZERO. Espaço em branco é lido como zero, e zero é uma
 * afirmação que ninguém contou. O traço, em tinta recuada, é o único jeito de o cartão
 * ocupar o lugar sem afirmar quantidade.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Catalogo {
  eventosDoAcervo: number;
  eventosComLink: number;
  recompensas: number;
  missoes: number;
  comunidades: number;
}

interface Props {
  instituicoes: InstituicaoDoAcervo[];
  eventos: EventoParaPrograma[];
  inicial: string | null;
  ocorrencias: number;
  ocorrenciasComEspaco: number;
  catalogo: Catalogo;
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

interface Kpi {
  rotulo: string;
  /** `null` = instrumentado sem coleta. O cartão mostra «—». */
  valor: number | null;
  de: string;
  coluna: "fiz" | "resultou";
  estado: EstadoDaMedida;
  porque?: string;
}

function Cartao({ kpi }: { kpi: Kpi }) {
  return (
    <li className="web-denominador org-kpi" data-estado={kpi.estado} title={kpi.porque}>
      <span className="web-denominador-numero" data-vazio={kpi.valor === null ? "sim" : "nao"}>
        {kpi.valor === null ? "—" : kpi.valor.toLocaleString("pt-BR")}
      </span>
      <span className="web-denominador-rotulo">{kpi.rotulo}</span>
      <span className="org-kpi-de">de {kpi.de}</span>
    </li>
  );
}

function Faixa({ kpis }: { kpis: Kpi[] }) {
  const fiz = kpis.filter((k) => k.coluna === "fiz");
  const resultou = kpis.filter((k) => k.coluna === "resultou");
  return (
    <div className="org-kpis">
      {fiz.length > 0 && (
        <div className="org-kpi-grupo" data-coluna="fiz">
          <p className="org-kpi-grupo-nome">O que eu fiz</p>
          <ul className="web-denominadores">
            {fiz.map((k) => (
              <Cartao key={k.rotulo} kpi={k} />
            ))}
          </ul>
        </div>
      )}
      {resultou.length > 0 && (
        <div className="org-kpi-grupo" data-coluna="resultou">
          <p className="org-kpi-grupo-nome">O que resultou</p>
          <ul className="web-denominadores">
            {resultou.map((k) => (
              <Cartao key={k.rotulo} kpi={k} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** A barra de participação — o recorte por linguagem e por território, em proporção. */
function Barras({ dados, total }: { dados: [string, number][]; total: number }) {
  return (
    <ul className="org-barras">
      {dados.map(([rotulo, quantos]) => (
        <li key={rotulo} className="org-barra" data-vazio={rotulo.startsWith("sem ") ? "sim" : "nao"}>
          <span className="org-barra-rotulo">{rotulo}</span>
          <span
            className="org-barra-trilho"
            style={{ ["--parte" as string]: `${total === 0 ? 0 : (quantos / total) * 100}%` }}
          />
          <span className="org-barra-numero">{quantos}</span>
        </li>
      ))}
    </ul>
  );
}

export function StudioOrgAlcance({
  instituicoes,
  eventos,
  inicial,
  ocorrencias,
  ocorrenciasComEspaco,
  catalogo,
  organizacao,
  autor,
  gestorEAutorado,
  dataDeReferencia,
}: Props) {
  const contexto = useMemo(
    () => ({ dataDeReferencia, autor, organizacao }),
    [dataDeReferencia, autor, organizacao],
  );
  const semente = useMemo(() => ({ instituicaoId: inicial }), [inicial]);
  const org = useOrganizacao(contexto, semente);

  const atual =
    instituicoes.find((i) => i.id === org.atualInstituicaoId) ??
    instituicoes.find((i) => i.id === inicial) ??
    instituicoes[0] ??
    null;

  const meus = useMemo(
    () => (atual ? eventos.filter((e) => e.realizadoPorIds.includes(atual.id)) : []),
    [eventos, atual],
  );
  const sessoes = meus.reduce((s, e) => s + e.ocorrencias, 0);

  const porLinguagem = useMemo(() => {
    const conta = new Map<string, number>();
    for (const e of meus) for (const l of e.linguagens) conta.set(l, (conta.get(l) ?? 0) + 1);
    return [...conta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [meus]);

  const porTerritorio = useMemo(() => {
    const conta = new Map<string, number>();
    for (const e of meus) {
      const t = e.territorio ?? "sem território declarado";
      conta.set(t, (conta.get(t) ?? 0) + 1);
    }
    return [...conta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [meus]);

  const semEventos = instituicoes.filter((i) => i.eventosRealizados === 0).length;

  const porLivro: Record<string, Kpi[]> = {
    publiquei: [
      { rotulo: "eventos realizados", valor: meus.length, de: `${catalogo.eventosDoAcervo} do acervo`, coluna: "fiz", estado: "conta" },
      { rotulo: "sessões somadas", valor: sessoes, de: `${ocorrencias} ocorrências`, coluna: "fiz", estado: "conta" },
      { rotulo: "linguagens cobertas", valor: porLinguagem.length, de: "33 do vocabulário", coluna: "fiz", estado: "conta" },
      { rotulo: "territórios cobertos", valor: porTerritorio.length, de: `${meus.length} eventos`, coluna: "fiz", estado: "conta" },
      { rotulo: "com link de compra", valor: catalogo.eventosComLink, de: `${catalogo.eventosDoAcervo} do acervo`, coluna: "fiz", estado: "conta", porque: "O acervo não tem campo de link de compra. A plataforma não vende — a compra acontece fora." },
      { rotulo: "sessões com espaço", valor: ocorrenciasComEspaco, de: `${ocorrencias} ocorrências`, coluna: "resultou", estado: "conta" },
      { rotulo: "saída para o ingresso", valor: null, de: `${catalogo.eventosComLink} com link`, coluna: "resultou", estado: "instrumentado", porque: "ingresso.saida.clicada — mede intenção, nunca conversão: sem retorno da plataforma de venda não há bilhete." },
    ],
    chegou: [
      { rotulo: "taxa de resposta", valor: null, de: "comentários recebidos", coluna: "fiz", estado: "instrumentado", porque: "comunidade.comentario.criado — espelho do produtor para ele mesmo, nunca comparação entre produtores." },
      { rotulo: "comunidades paradas", valor: null, de: `${catalogo.comunidades} do marketplace`, coluna: "fiz", estado: "instrumentado", porque: "Sem publicação há 30 dias." },
      { rotulo: "presenças confirmadas", valor: null, de: "código do produtor", coluna: "resultou", estado: "instrumentado", porque: "ocorrencia.presenca.confirmada — entra por código, nunca por autodeclaração. É piso de público, não público." },
      { rotulo: "taxa de lotação", valor: null, de: "capacidade declarada", coluna: "resultou", estado: "instrumentado", porque: "Presenças ÷ capacidade da ficha do espaço. Sem teto declarado não há porcentagem." },
      { rotulo: "conclusões", valor: null, de: "itens publicados", coluna: "resultou", estado: "instrumentado", porque: "play.midia.concluida · cast.episodio.concluido · leitura.materia.concluida — conclusão, não visualização." },
      { rotulo: "nota da sessão", valor: null, de: "presenças confirmadas", coluna: "resultou", estado: "instrumentado", porque: "ocorrencia.avaliada, travada em presença. Média só a partir de 5; abaixo disso, distribuição." },
    ],
    devolvi: [
      { rotulo: "benefícios no catálogo", valor: catalogo.recompensas, de: "5 famílias", coluna: "fiz", estado: "conta", porque: "Do catálogo do programa — nenhum publicado por esta organização ainda." },
      { rotulo: "missões publicadas", valor: catalogo.missoes, de: "16 emblemas", coluna: "fiz", estado: "conta", porque: "Do catálogo do programa — nenhuma publicada por esta organização ainda." },
      { rotulo: "resgates entregues", valor: null, de: "resgates abertos", coluna: "resultou", estado: "instrumentado", porque: "recompensa.resgatada — a esteira tem 7 fases e não termina em «entregue»." },
      { rotulo: "taxa de contestação", valor: null, de: "marcados entregues", coluna: "resultou", estado: "instrumentado", porque: "«Entregue» é a organização dizendo que despachou; só quem recebeu sabe se chegou." },
      { rotulo: "reprovação de prova", valor: null, de: "provas com veredito", coluna: "resultou", estado: "instrumentado", porque: "missao.prova.aprovada — reprovação alta é missão mal escrita, não gente desonesta." },
    ],
  };

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Alcance consolidado</h1>
        </div>
        <p className="studio-objetivo">
          O retorno para quem publica. {organizacao} · {autor} · medido em {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="alcance" />
      </header>

      {!org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo o estado guardado neste navegador…</p>
        </section>
      ) : atual === null ? (
        <section className="studio-painel">
          <p className="studio-nota">O acervo não tem instituição nenhuma.</p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          <div className="studio-forma">
            {LIVROS_DO_PRODUTOR.map((l) => (
              <section key={l.id} className="studio-painel">
                <div className="studio-painel-cabeca">
                  <h2 className="studio-painel-nome">
                    <span className="org-livro-ordem">{l.ordem}</span> {l.rotulo}
                  </h2>
                  <span className="studio-pastilha">de {l.denominador}</span>
                </div>
                <Faixa kpis={porLivro[l.id] ?? []} />
              </section>
            ))}

            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">L1 · Por linguagem</h2>
                <span className="studio-pastilha">{porLinguagem.length} de 33</span>
              </div>
              {porLinguagem.length === 0 ? (
                <p className="studio-campo-nota">
                  Não realiza evento nenhum no acervo — são {semEventos} de {instituicoes.length}
                  {" "}nessa situação.
                </p>
              ) : (
                <Barras dados={porLinguagem} total={meus.length} />
              )}
            </section>

            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">L1 · Por território</h2>
                <span className="studio-pastilha">{porTerritorio.length} recortes</span>
              </div>
              {porTerritorio.length === 0 ? (
                <p className="studio-campo-nota">Sem eventos, não há território a recortar.</p>
              ) : (
                <Barras dados={porTerritorio} total={meus.length} />
              )}
            </section>
          </div>

          <aside className="org-colada studio-forma">
            <section className="studio-painel">
              <h2 className="studio-painel-nome">A regra desta tela</h2>
              <div className="web-declaracao">
                <strong>Se o dado não sustenta, a tela diz</strong>
                <span>{REGRA_DO_ALCANCE}</span>
              </div>
            </section>

            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">Instrumentado, sem coleta</h2>
                <span className="studio-pastilha">
                  <span className="studio-pastilha-numero">{O_QUE_ESTA_INSTRUMENTADO.length}</span>{" "}
                  com evento escrito
                </span>
              </div>
              <ul className="org-falta">
                {O_QUE_ESTA_INSTRUMENTADO.map((m) => (
                  <li key={m.medida} className="org-falta-item" data-bloqueia="nao">
                    <span>
                      <strong>{m.medida}</strong> — {m.porque}
                    </span>
                    <span className="org-falta-dono">{m.evento}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">O que este painel não exibe</h2>
                <span className="studio-pastilha studio-pastilha-marca">
                  <span className="studio-pastilha-numero">
                    {O_QUE_O_ALCANCE_NAO_SUSTENTA.length}
                  </span>{" "}
                  recusadas
                </span>
              </div>
              <ul className="org-falta">
                {O_QUE_O_ALCANCE_NAO_SUSTENTA.map((m) => (
                  <li key={m.medida} className="org-falta-item" data-bloqueia="sim">
                    <span>
                      <strong>{m.medida}</strong> — {m.porque}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
