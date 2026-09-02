"use client";

import { useMemo } from "react";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  INGRESSO_NAO_E_VENDA,
  LIVROS_DO_PRODUTOR,
  O_QUE_ESTA_INSTRUMENTADO,
  O_QUE_O_ALCANCE_NAO_SUSTENTA,
  REGRA_DOS_TRES_ESTADOS,
  REGRA_DO_ALCANCE,
  ROTULO_DO_ESTADO,
  type EstadoDaMedida,
} from "@/dados/tipos-organizacao";
import type { EventoParaPrograma, InstituicaoDoAcervo } from "@/dados/organizacao";

/**
 * studio-org-alcance.tsx — O9 · Alcance consolidado (funcionalidade 152), na V2 dos três livros.
 *
 * É A TELA ONDE É MAIS FÁCIL MENTIR, e por isso metade dela continua sendo a lista do que ela
 * se recusa a exibir. O que a V2 muda não é a disciplina — é o número de gavetas.
 *
 * A RECUSA DEIXOU DE SER BINÁRIA. A V1 tinha dois estados: o número que conta e a medida que
 * recusa. Isso punha na mesma gaveta «não há como medir isto» e «o instrumento está escrito,
 * a coleta é que não roda» — e três das cinco recusas originais eram do segundo tipo desde
 * que o motor de pontos entrou. Agora são três estados, e cada medida declara o seu.
 *
 * OS TRÊS LIVROS TÊM DENOMINADORES DIFERENTES, e é isso que os separa: o catálogo do
 * produtor, quem apareceu, e o que a organização injetou no programa. Empilhar os três numa
 * lista única de indicadores faria comparar coisas cujo «de quantos» não é o mesmo.
 *
 * DENTRO DE CADA LIVRO, «O QUE EU FIZ» E «O QUE RESULTOU». A separação é proteção, não
 * arrumação: a coluna «eu fiz» descreve o comportamento de uma pessoa identificada, e
 * `CONFORMIDADE_NAO_E_VIGILANCIA` proíbe que ela vire nota de desempenho.
 *
 * A INSTITUIÇÃO É A QUE A O1 ESCOLHEU. As duas telas leem o mesmo campo do mesmo estado.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Catalogo {
  eventosDoAcervo: number;
  eventosComLink: number;
  ingressosAutorados: number;
  recompensas: number;
  familiasDeRecompensa: number;
  missoes: number;
  emblemas: number;
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

/** Uma linha de medida dentro de um livro. `valor === null` é o que ainda não tem coleta. */
interface Medida {
  coluna: "fiz" | "resultou";
  rotulo: string;
  valor: string | null;
  de: string;
  estado: EstadoDaMedida;
}

function Estado({ estado }: { estado: EstadoDaMedida }) {
  return (
    <span className="org-estado" data-estado={estado}>
      {ROTULO_DO_ESTADO[estado]}
    </span>
  );
}

function Livro({
  ordem,
  rotulo,
  pergunta,
  denominador,
  quando,
  medidas,
  nota,
}: {
  ordem: string;
  rotulo: string;
  pergunta: string;
  denominador: string;
  quando: string;
  medidas: Medida[];
  nota: string;
}) {
  const fiz = medidas.filter((m) => m.coluna === "fiz");
  const resultou = medidas.filter((m) => m.coluna === "resultou");

  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">
          <span className="org-livro-ordem">{ordem}</span> {rotulo}
        </h2>
        <span className="studio-pastilha">denominador: {denominador}</span>
      </div>
      <p className="studio-objetivo">{pergunta}</p>
      <p className="studio-campo-nota">Abre {quando}.</p>

      <div className="org-livro-colunas">
        <div className="org-livro-coluna">
          <h3 className="org-livro-coluna-nome">O que eu fiz</h3>
          <ul className="org-medidas">
            {fiz.map((m) => (
              <Linha key={m.rotulo} medida={m} />
            ))}
          </ul>
        </div>
        <div className="org-livro-coluna">
          <h3 className="org-livro-coluna-nome">O que resultou</h3>
          <ul className="org-medidas">
            {resultou.map((m) => (
              <Linha key={m.rotulo} medida={m} />
            ))}
          </ul>
        </div>
      </div>

      <p className="studio-campo-nota">{nota}</p>
    </section>
  );
}

function Linha({ medida }: { medida: Medida }) {
  return (
    <li className="org-medida" data-estado={medida.estado}>
      <span className="org-medida-valor" data-vazio={medida.valor === null ? "sim" : "nao"}>
        {medida.valor ?? "sem coleta"}
      </span>
      <span className="org-medida-rotulo">{medida.rotulo}</span>
      <span className="org-medida-de">de {medida.de}</span>
      <Estado estado={medida.estado} />
    </li>
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

  /**
   * As medidas de cada livro. Elas moram aqui e não em `tipos-organizacao.ts` porque
   * dependem do estado da tela — a constante lá é o CONTRATO (quais livros existem, quais
   * estados existem), e o contrato não sabe quantos eventos esta instituição realiza.
   */
  const livros: Record<string, { medidas: Medida[]; nota: string }> = {
    publiquei: {
      medidas: [
        {
          coluna: "fiz",
          rotulo: "eventos que ela realiza",
          valor: String(meus.length),
          de: `${catalogo.eventosDoAcervo} do acervo`,
          estado: "conta",
        },
        {
          coluna: "fiz",
          rotulo: "sessões somadas",
          valor: String(sessoes),
          de: `${ocorrencias} do acervo`,
          estado: "conta",
        },
        {
          coluna: "fiz",
          rotulo: "linguagens cobertas",
          valor: String(porLinguagem.length),
          de: "33 do vocabulário",
          estado: "conta",
        },
        {
          coluna: "fiz",
          rotulo: "territórios cobertos",
          valor: String(porTerritorio.length),
          de: `${meus.length} eventos dela`,
          estado: "conta",
        },
        {
          coluna: "fiz",
          rotulo: "eventos com link de compra publicado",
          valor: String(catalogo.eventosComLink),
          de: `${catalogo.eventosDoAcervo} do acervo`,
          estado: "conta",
        },
        {
          coluna: "resultou",
          rotulo: "sessões que declaram espaço",
          valor: String(ocorrenciasComEspaco),
          de: `${ocorrencias} ocorrências`,
          estado: "conta",
        },
        {
          coluna: "resultou",
          rotulo: "saída para a plataforma de ingresso",
          valor: null,
          de: `${catalogo.eventosComLink} eventos com link`,
          estado: "instrumentado",
        },
      ],
      nota:
        `Os quatro primeiros são arestas do grafo, contadas: «realiza» liga a instituição ao ` +
        `evento e as sessões vêm de «ocorre_em». Nenhum deles mede público. «Realiza» é de ` +
        `MUITOS PARA MUITOS no acervo — o mesmo evento costuma ser realizado por várias ` +
        `instituições, e estes números são a fatia desta, não uma fatia exclusiva.`,
    },
    chegou: {
      medidas: [
        {
          coluna: "resultou",
          rotulo: "presenças confirmadas por código",
          valor: null,
          de: "sessões com teto declarado",
          estado: "instrumentado",
        },
        {
          coluna: "resultou",
          rotulo: "taxa de lotação",
          valor: null,
          de: "capacidade declarada na ficha do espaço",
          estado: "instrumentado",
        },
        {
          coluna: "resultou",
          rotulo: "conclusões de conteúdo",
          valor: null,
          de: "itens publicados por ela",
          estado: "instrumentado",
        },
        {
          coluna: "resultou",
          rotulo: "nota da sessão",
          valor: null,
          de: "presenças confirmadas — nunca do público geral",
          estado: "instrumentado",
        },
        {
          coluna: "resultou",
          rotulo: "alcance por faixa etária ou perfil",
          valor: null,
          de: "3 pessoas-usuárias no acervo",
          estado: "recusado",
        },
        {
          coluna: "fiz",
          rotulo: "taxa de resposta a comentário",
          valor: null,
          de: "comentários recebidos",
          estado: "instrumentado",
        },
        {
          coluna: "fiz",
          rotulo: "comunidades sem publicar há 30 dias",
          valor: null,
          de: `${catalogo.comunidades} comunidades do marketplace`,
          estado: "instrumentado",
        },
      ],
      nota:
        `As duas medidas da coluna «o que eu fiz» descrevem o comportamento de uma pessoa ` +
        `identificada, e é por isso que elas ficam desse lado e não saem dele: são espelho do ` +
        `produtor para ele mesmo, nunca comparação entre produtores. A lotação é PISO de ` +
        `público — quem foi e não resgatou o código de presença não aparece na conta.`,
    },
    devolvi: {
      medidas: [
        {
          coluna: "fiz",
          rotulo: "benefícios no catálogo do programa",
          valor: String(catalogo.recompensas),
          de: `${catalogo.familiasDeRecompensa} famílias`,
          estado: "conta",
        },
        {
          coluna: "fiz",
          rotulo: "missões publicadas no programa",
          valor: String(catalogo.missoes),
          de: `${catalogo.emblemas} emblemas concedíveis`,
          estado: "conta",
        },
        {
          coluna: "resultou",
          rotulo: "funil de resgate até entregue",
          valor: null,
          de: "resgates abertos",
          estado: "instrumentado",
        },
        {
          coluna: "resultou",
          rotulo: "taxa de contestação de entrega",
          valor: null,
          de: "resgates marcados como entregues",
          estado: "instrumentado",
        },
        {
          coluna: "resultou",
          rotulo: "taxa de reprovação de prova",
          valor: null,
          de: "provas com veredito",
          estado: "instrumentado",
        },
      ],
      nota:
        `«Contestado» é o único número que mede a organização cumprindo a própria promessa: ` +
        `«entregue» é ela dizendo que despachou, e só quem recebeu sabe se chegou. E ` +
        `reprovação de prova alta é MISSÃO MAL ESCRITA, não gente desonesta — o painel mostra ` +
        `o motivo dominante ao lado do número, porque ler reprovação como fraude é o caminho ` +
        `mais curto para o produtor punir o próprio público. Os dois números da esquerda são ` +
        `do catálogo do PROGRAMA: nenhum deles foi publicado por esta organização ainda.`,
    },
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

      <section className="studio-painel">
        <h2 className="studio-painel-nome">As duas regras desta tela</h2>
        <div className="web-declaracao">
          <strong>Se o dado não sustenta, a tela diz</strong>
          <span>{REGRA_DO_ALCANCE}</span>
        </div>
        <div className="web-declaracao">
          <strong>E ela diz em qual dos três estados cada medida está</strong>
          <span>{REGRA_DOS_TRES_ESTADOS}</span>
        </div>
      </section>

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
          {/* -------- Os três livros, à esquerda -------- */}
          <div className="studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">{atual.titulo}</h2>
                <span className="studio-pastilha">
                  a instituição que a ficha institucional declara
                </span>
              </div>
              <p className="studio-campo-nota">
                O painel se divide em três livros porque os três têm DENOMINADORES diferentes —
                o catálogo dela, quem apareceu, e o que ela injetou no programa. Uma lista única
                de indicadores compararia coisas cujo «de quantos» não é o mesmo.
              </p>
            </section>

            {LIVROS_DO_PRODUTOR.map((l) => (
              <Livro
                key={l.id}
                ordem={l.ordem}
                rotulo={l.rotulo}
                pergunta={l.pergunta}
                denominador={l.denominador}
                quando={l.quando}
                medidas={livros[l.id]?.medidas ?? []}
                nota={livros[l.id]?.nota ?? ""}
              />
            ))}

            <section className="studio-painel">
              <h2 className="studio-painel-nome">O ingresso não é venda</h2>
              <div className="web-declaracao">
                <strong>Mede-se intenção, nunca conversão</strong>
                <span>{INGRESSO_NAO_E_VENDA}</span>
              </div>
              <p className="studio-campo-nota">
                Medido: <strong>{catalogo.eventosComLink}</strong> dos{" "}
                {catalogo.eventosDoAcervo} eventos publicam link de compra — a classe do acervo
                não tem o campo. Os {catalogo.ingressosAutorados} links que a ficha do evento
                exibe foram escritos pela curadoria e aparecem rotulados como tal. Por isso a
                cobertura vem antes do desempenho: um gráfico de cliques aqui mostraria zero e
                pareceria fracasso de audiência quando é ausência de cadastro.
              </p>
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">L1 · Por linguagem</h2>
              {porLinguagem.length === 0 ? (
                <p className="studio-campo-nota">
                  Esta instituição não realiza evento nenhum no acervo — e são {semEventos} de{" "}
                  {instituicoes.length} nessa situação.
                </p>
              ) : (
                <ul className="org-falta">
                  {porLinguagem.map(([rotulo, quantos]) => (
                    <li key={rotulo} className="org-falta-item" data-bloqueia="nao">
                      <span>{rotulo}</span>
                      <span className="org-falta-dono">
                        {quantos} de {meus.length} eventos
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">L1 · Por território</h2>
              {porTerritorio.length === 0 ? (
                <p className="studio-campo-nota">Sem eventos, não há território a recortar.</p>
              ) : (
                <ul className="org-falta">
                  {porTerritorio.map(([rotulo, quantos]) => (
                    <li
                      key={rotulo}
                      className="org-falta-item"
                      data-bloqueia={rotulo === "sem território declarado" ? "sim" : "nao"}
                    >
                      <span>{rotulo}</span>
                      <span className="org-falta-dono">
                        {quantos} de {meus.length} eventos
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* -------- O que não conta ainda, e o que nunca vai contar -------- */}
          <aside className="org-colada studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">Instrumentado, sem coleta</h2>
                <span className="studio-pastilha">
                  <span className="studio-pastilha-numero">
                    {O_QUE_ESTA_INSTRUMENTADO.length}
                  </span>{" "}
                  com evento escrito
                </span>
              </div>
              <p className="studio-nota">
                Cada linha tem o instrumento pronto no contrato e não tem coleta agregada. O nome
                do evento está aí para quem confere abrir o arquivo e ver que existe — «em breve»
                sem o nome do evento seria pior do que a recusa, porque a recusa é verificável.
              </p>
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
              <p className="studio-campo-nota">
                O livro-razão do programa mora no navegador de cada pessoa, por persona, e não há
                autenticação. Agregar entre pessoas exige servidor — é isso, e não o modelo, que
                falta.
              </p>
            </section>

            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">O que este painel não exibe</h2>
                <span className="studio-pastilha studio-pastilha-marca">
                  <span className="studio-pastilha-numero">
                    {O_QUE_O_ALCANCE_NAO_SUSTENTA.length}
                  </span>{" "}
                  medidas recusadas
                </span>
              </div>
              <p className="studio-nota">
                Estas não têm instrumento nenhum, e a tela diz o motivo. Elas ocupam a mesma
                coluna e o mesmo tamanho do que a tela conta, porque a recusa é o conteúdo.
              </p>
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
