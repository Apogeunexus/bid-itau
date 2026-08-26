"use client";

import { useStudio } from "@/componentes/studio-estado";
import { Literal } from "@/componentes/studio-literal";
import { SeletorDeRegistro } from "@/componentes/studio-seletor";
import { comSeparador } from "@/componentes/studio-datas";
import {
  DIMENSOES_DE_ACESSIBILIDADE,
  EXPLICACAO_DA_SITUACAO,
  FRASE_DO_ATO_DE_DECLARAR,
  ROTULO_DA_SITUACAO,
  acessibilidadeVazia,
  algumaDimensaoMarcada,
} from "@/dados/tipos-acesso";
import type { RascunhoDoProdutor } from "@/dados/tipos-acesso";
import type { Acessibilidade } from "@/dados/tipos";
import type { CatalogoDeEspacos, EspacoDoCatalogo } from "@/dados/mock/seed";

/**
 * studio-acessibilidade.tsx — P6 · ficha de acessibilidade (funcionalidade 159).
 *
 * **A TELA MAIS SUTIL DO CONJUNTO, E A QUE MAIS DISTINGUE A PROPOSTA.**
 *
 * `declaraAcessibilidade` registra o ATO DE PREENCHER, não o conteúdo da ficha. Dentro de
 * `acessibilidade`, um `false` significa «não oferece» e «não declarou» ao mesmo tempo — e
 * ler ausência como declaração é o erro exato que D-43 existe para não cometer. O tipo
 * obriga o campo a existir e proíbe que seja opcional, porque campo ausente teria de ser
 * lido como «não declarou».
 *
 * A CONSEQUÊNCIA DE INTERFACE É A REGRA DESTA TELA: **não pode haver só caixas de marcar.**
 * Oito caixas desmarcadas e um botão de salvar produzem silêncio, e silêncio é o que a
 * plataforma se proibiu de interpretar. Por isso existe um ato explícito —
 *
 *     «Declaro que este evento não oferece nenhum destes recursos.»
 *
 * — com peso igual ao de salvar. Sem ele, quem preenche gera ausência que ninguém sabe ler.
 *
 * A HERANÇA PARA AS SESSÕES É EXIBIDA, não presumida. `Ocorrencia.declaraAcessibilidade` é
 * herdado do evento: a sessão não declara nada por conta própria, e a tela diz isso em vez
 * de deixar o produtor achar que precisa preencher 28 fichas.
 *
 * A FICHA DO ESPAÇO É DA ORGANIZAÇÃO e entra em LEITURA. Quem responde pelo elevador e pelo
 * piso tátil é quem administra o prédio, não quem programa a temporada.
 *
 * MÓDULO DE CLIENTE: `@/dados/mock/seed` e `@/dados/tipos` entram **apenas por tipo** (DP-F).
 */

interface Props {
  catalogo: CatalogoDeEspacos;
  semente: RascunhoDoProdutor[];
  situacaoEAutorada: string;
  /** Medido no grafo: quantos registros preencheram a ficha e quantos não. */
  ficha: { declaram: number; naoDeclaram: number };
}

export function StudioAcessibilidade({ catalogo, semente, situacaoEAutorada, ficha }: Props) {
  const studio = useStudio(semente, {
    dataDeReferencia: catalogo.dataDeReferencia,
    autor: catalogo.produtor,
    organizacao: catalogo.organizacao,
  });
  const { pronto, rascunhos, atual, editavelAgora } = studio;

  if (!pronto || atual === null) {
    return (
      <p className="studio-nota" data-carregando>
        Lendo o que você já tinha escrito…
      </p>
    );
  }

  const marcadas = DIMENSOES_DE_ACESSIBILIDADE.filter((d) => atual.acessibilidade[d.chave]);
  const alguma = algumaDimensaoMarcada(atual.acessibilidade);
  const declarou = atual.declaraAcessibilidade;
  const espacos = atual.temporadas
    .map((t) => catalogo.espacos.find((e) => e.id === t.espacoId) ?? null)
    .filter((e): e is EspacoDoCatalogo => e !== null);

  /** Marcar uma dimensão É declarar: quem aponta um recurso preencheu a ficha. */
  const alternar = (chave: keyof Acessibilidade) => {
    const nova: Acessibilidade = {
      ...atual.acessibilidade,
      [chave]: !atual.acessibilidade[chave],
    };
    studio.alterar({
      acessibilidade: nova,
      declaraAcessibilidade: algumaDimensaoMarcada(nova) ? true : declarou,
    });
  };

  /** O ATO. Zera as oito e liga o campo que registra que houve declaração. */
  const declararAusencia = () =>
    studio.alterar({ acessibilidade: acessibilidadeVazia(), declaraAcessibilidade: true });

  /** Desfazer a declaração devolve o registro ao silêncio — e a tela diz isso. */
  const desfazerDeclaracao = () => studio.alterar({ declaraAcessibilidade: false });

  return (
    <div className="studio-jornada">
      <SeletorDeRegistro
        rascunhos={rascunhos}
        atual={atual}
        aoEscolher={studio.escolher}
        aoCriar={() => studio.criar()}
        aoReiniciar={studio.reiniciar}
        situacaoEAutorada={situacaoEAutorada}
      />

      <div className="web-duas-colunas">
        <div className="studio-forma">
          {!editavelAgora ? (
            <p className="studio-travado" data-situacao={atual.situacao}>
              <strong>{ROTULO_DA_SITUACAO[atual.situacao]}.</strong>{" "}
              {EXPLICACAO_DA_SITUACAO[atual.situacao]}
            </p>
          ) : null}

          {/* ---- o estado da ficha, antes das caixas ---- */}
          <EstadoDaFicha declarou={declarou} alguma={alguma} marcadas={marcadas.length} />

          <fieldset className="studio-campo" disabled={!editavelAgora}>
            <legend className="studio-campo-rotulo">As oito dimensões do CMS</legend>
            <ul className="studio-dimensoes">
              {DIMENSOES_DE_ACESSIBILIDADE.map((d) => {
                const ligada = atual.acessibilidade[d.chave];
                return (
                  <li key={d.chave} className="studio-dimensao" data-ligada={ligada ? "sim" : "nao"}>
                    <label className="studio-dimensao-alvo">
                      <input
                        type="checkbox"
                        checked={ligada}
                        onChange={() => alternar(d.chave)}
                      />
                      <span className="studio-dimensao-rotulo">{d.rotulo}</span>
                    </label>
                    <Literal valor={d.chave} className="studio-dimensao-campo" />
                  </li>
                );
              })}
            </ul>
            <p className="studio-campo-nota">
              Marcar qualquer uma já é declarar: quem aponta um recurso preencheu a ficha. O
              que sobra desmarcado, aí sim, significa «não oferece» — porque a declaração
              existe para dizer isso.
            </p>
          </fieldset>

          {/* ---- O ATO, com peso igual ao de salvar ---- */}
          <section className="studio-ato" data-declarou={declarou ? "sim" : "nao"}>
            <h2 className="web-painel-titulo">A declaração</h2>
            {declarou ? (
              <>
                <p className="studio-nota">
                  <strong>Ficha declarada</strong> por {atual.autor}.{" "}
                  {alguma
                    ? `${marcadas.length} ${marcadas.length === 1 ? "recurso apontado" : "recursos apontados"}: ${marcadas.map((d) => d.rotulo).join(", ")}.`
                    : "Nenhum recurso oferecido — e isso é uma afirmação, não um vazio."}
                </p>
                <div className="studio-acoes">
                  <details className="studio-confirma">
                    <summary className="studio-botao studio-confirma-gatilho">
                      Desfazer a declaração
                    </summary>
                    <div className="studio-confirma-corpo">
                      <p className="studio-campo-nota">
                        O registro volta ao silêncio: nem «oferece» nem «não oferece», e sim
                        «não declarou». É o estado em que{" "}
                        {comSeparador(ficha.naoDeclaram)} registros do acervo estão hoje, e o
                        único que a plataforma se proibiu de interpretar.
                      </p>
                      <button
                        type="button"
                        className="studio-botao studio-botao-perigo"
                        onClick={desfazerDeclaracao}
                        disabled={!editavelAgora}
                      >
                        Voltar ao silêncio
                      </button>
                    </div>
                  </details>
                </div>
              </>
            ) : (
              <>
                <p className="studio-nota">
                  A ficha ainda não foi declarada. Enquanto estiver assim, as oito
                  desmarcadas significam <strong>«não declarou»</strong> — e não «não
                  oferece». São coisas diferentes, e é essa diferença que a plataforma se
                  recusa a apagar.
                </p>
                <div className="studio-acoes">
                  <button
                    type="button"
                    className="studio-botao studio-botao-primario studio-botao-ato"
                    disabled={!editavelAgora}
                    onClick={declararAusencia}
                  >
                    Declaro que este evento não oferece nenhum destes recursos
                  </button>
                </div>
                <p className="studio-campo-nota">
                  Ou marque acima o que ele oferece — marcar qualquer dimensão também declara
                  a ficha.
                </p>
              </>
            )}
          </section>
        </div>

        <aside className="web-colada studio-vivo">
          <HerancaDasSessoes sessoes={atual.ocorrencias.length} declarou={declarou} />

          <FichaDoEspaco espacos={espacos} temporadas={atual.temporadas.length} />

          <section className="studio-nao-sustenta">
            <span className="studio-nao-sustenta-rotulo">O que o acervo mede hoje</span>
            <ul className="web-denominadores">
              <li className="web-denominador">
                <span className="web-denominador-numero">{comSeparador(ficha.declaram)}</span>
                <span className="web-denominador-rotulo">registros declaram a ficha</span>
              </li>
              <li className="web-denominador">
                <span className="web-denominador-numero">
                  {comSeparador(ficha.naoDeclaram)}
                </span>
                <span className="web-denominador-rotulo">não declaram</span>
              </li>
            </ul>
            <p>
              Sem o campo que registra o ATO, os dois grupos seriam indistinguíveis: uma
              dimensão em zero não separa «ninguém oferece» de «ninguém preencheu». É por
              isso que <Literal valor="declaraAcessibilidade" /> é obrigatório no tipo e não
              pode ser opcional — campo ausente teria de ser lido como «não declarou», e ler
              ausência como declaração é o erro que a regra existe para não cometer.
            </p>
            <p>{FRASE_DO_ATO_DE_DECLARAR}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

/**
 * Os três estados possíveis da ficha, nomeados.
 *
 * Não são dois. «Declarou e oferece», «declarou e não oferece» e «não declarou» são
 * distintos, e é exatamente o terceiro que some quando uma interface só tem caixas.
 */
function EstadoDaFicha({
  declarou,
  alguma,
  marcadas,
}: {
  declarou: boolean;
  alguma: boolean;
  marcadas: number;
}) {
  const estado = !declarou ? "silencio" : alguma ? "oferece" : "ausencia";
  const texto =
    estado === "silencio"
      ? "não declarada — a ausência aqui não significa nada, e é por isso que ela não pode ser publicada assim"
      : estado === "oferece"
        ? `declarada — ${marcadas} ${marcadas === 1 ? "recurso" : "recursos"}`
        : "declarada — nenhum recurso, dito por extenso";

  return (
    <p className="studio-estado-ficha" data-estado={estado}>
      <span className="studio-rotulo">estado da ficha</span>
      <strong>{texto}</strong>
    </p>
  );
}

/**
 * A herança para as sessões, exibida.
 *
 * `Ocorrencia.declaraAcessibilidade` é herdado do evento — a sessão não declara nada por
 * conta própria. Sem esta caixa, o produtor com 28 sessões acharia que precisa preencher 28
 * fichas, e quem lesse a tela concluiria que a plataforma perde a declaração no caminho.
 */
function HerancaDasSessoes({ sessoes, declarou }: { sessoes: number; declarou: boolean }) {
  return (
    <section className="web-painel" data-heranca={sessoes}>
      <h2 className="web-painel-titulo">Herança para as sessões</h2>
      <p className="studio-chave-conta">
        {sessoes === 0 ? (
          "Nenhuma sessão declarada ainda."
        ) : (
          <>
            <strong className="studio-chave-numero">{sessoes}</strong>{" "}
            {sessoes === 1 ? "sessão herda" : "sessões herdam"} esta ficha
          </>
        )}
      </p>
      <p className="studio-campo-nota">
        A sessão não declara nada por conta própria:{" "}
        <Literal valor="Ocorrencia.declaraAcessibilidade" /> vem do evento.{" "}
        {declarou
          ? "Como a ficha está declarada, todas herdam a declaração."
          : "Enquanto o evento não declarar, todas herdam o silêncio."}
      </p>
    </section>
  );
}

/**
 * A ficha do espaço, herdada da Organização, em LEITURA.
 *
 * Quem responde pelo elevador e pelo piso tátil é quem administra o prédio. O produtor lê
 * para saber o que o lugar oferece; editar aqui seria o mesmo tipo de violação que editar o
 * verbete de um artista.
 */
function FichaDoEspaco({
  espacos,
  temporadas,
}: {
  espacos: EspacoDoCatalogo[];
  temporadas: number;
}) {
  if (temporadas === 0) {
    return (
      <section className="web-painel">
        <h2 className="web-painel-titulo">Ficha do espaço</h2>
        <p className="studio-campo-nota">
          Sem temporada declarada, não há espaço de que herdar ficha.
        </p>
      </section>
    );
  }

  if (espacos.length === 0) {
    return (
      <section className="web-painel">
        <h2 className="web-painel-titulo">Ficha do espaço</h2>
        <p className="studio-campo-nota">
          As temporadas deste registro estão sem espaço declarado, então não há ficha de
          espaço para herdar. Ela é da Organização.
        </p>
      </section>
    );
  }

  return (
    <section className="web-painel" data-espacos={espacos.length}>
      <h2 className="web-painel-titulo">Ficha do espaço · leitura</h2>
      <ul className="web-lista-densa">
        {espacos.map((e) => (
          <li key={e.id} className="studio-falta">
            <span className="studio-falta-rotulo">{e.titulo}</span>
            <strong>{e.declaraAcessibilidade ? "ficha declarada" : "não declarada"}</strong>
          </li>
        ))}
      </ul>
      <p className="studio-campo-nota">
        Quem responde pelo prédio é a Organização. O produtor lê para saber o que o lugar
        oferece — e «não declarada» aqui também não é «não oferece».
      </p>
    </section>
  );
}
