"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CHAVE_DO_DESTAQUE,
  comoSeLe,
  lerDestaques,
  registrarDestaque,
} from "@/dados/redacao-registro";
import type { DestaqueAssinado } from "@/dados/redacao-registro";
import type {
  CandidatoDoCatalogo,
  CartaoDoDestaque,
  CatalogoDeArrasto,
  DestaqueDoFeed,
} from "@/dados/redacao";

/**
 * redacao-destaque.tsx — o destaque do feed (E2). **A curadoria com poder de sobrepor o
 * algoritmo.**
 *
 * O QUE ESTA TELA PROVA. Que existe uma pessoa capaz de dizer «este cartão vai em primeiro,
 * e eu respondo por isso» — e que esse poder é limitado, assinado e visível. As três coisas
 * juntas: sem o poder, a curadoria é decorativa; sem o limite, vira editorial disfarçado de
 * algoritmo; sem a assinatura, o leitor não tem a quem perguntar.
 *
 * O TETO DE UM É O PRODUTO, E NÃO UMA LIMITAÇÃO. `TipoCartaoEspecial` tem dois valores e o
 * feed reserva uma posição fixa para cada. Um destaque por feed é apontável pelo leitor; dez
 * seriam indistinguíveis do rodízio, e a distinção entre «a máquina achou» e «uma pessoa
 * escolheu» é justamente o que esta plataforma existe para tornar visível. Por isso o
 * registro guarda um por persona e o novo SUBSTITUI o antigo, em vez de empilhar.
 *
 * A TELA MOSTRA O QUE SAIU, E NÃO SÓ O QUE ENTROU. Sobrepor o algoritmo tem custo: um cartão
 * que a caminhada teria entregue fica de fora. Esconder isso apresentaria o destaque como se
 * fosse de graça. O cartão substituído é descoberto por diferença entre duas execuções da
 * MESMA `montarFeed` — ver `COMO_SE_SABE_O_SUBSTITUIDO`.
 *
 * A SERENDIPIDADE ESTÁ AO LADO PARA CONTRASTE, E NÃO POR SIMETRIA. Ela também sobrepõe o
 * rodízio e também ocupa posição fixa, o que a faz parecer a mesma coisa — mas é escolhida
 * pelo motor, e a dose é parâmetro do Admin. Uma é escolha; a outra é dosagem. Mostrá-las
 * sem essa distinção ensinaria o operador a confundir as duas.
 *
 * DP-F: `"use client"`, e `@/dados/redacao` entra só por tipo.
 */

function Cartao({
  cartao,
  papel,
  marca,
}: {
  cartao: CartaoDoDestaque;
  papel: string;
  marca?: "curado" | "serendipidade" | "substituido";
}) {
  return (
    <article className="redacao-cartao" data-cartao-feed={marca ?? "rodizio"}>
      <div className="redacao-cartao-cabeca">
        <span className="studio-rotulo">
          posição {cartao.posicao} · {papel}
        </span>
        <span className="redacao-classe">{cartao.classe}</span>
      </div>
      <strong className="redacao-cartao-titulo">{cartao.titulo}</strong>
      <p className="selo-motivo" data-motivo-cartao={cartao.motivo}>
        <span>{cartao.motivo}</span>
      </p>
      <span className="studio-rotulo">procedência {cartao.procedencia}</span>
      {cartao.rotaPublica ? (
        <Link href={cartao.rotaPublica} className="studio-botao" data-rota-cartao={cartao.rotaPublica}>
          ver ao público ↗
        </Link>
      ) : (
        <span className="studio-nota" data-nao-sustenta>
          A classe «{cartao.classe}» não tem página própria no app — não há endereço para
          onde apontar.
        </span>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------

export function RedacaoDestaque({
  feed,
  catalogo,
  curador,
  carimbo,
  dataDeReferencia,
  regraDoDestaqueUnico,
  serendipidadeNaoECuradoria,
  comoSeSabeOSubstituido,
}: {
  feed: DestaqueDoFeed;
  catalogo: CatalogoDeArrasto;
  curador: string;
  carimbo: string;
  dataDeReferencia: string;
  regraDoDestaqueUnico: string;
  serendipidadeNaoECuradoria: string;
  comoSeSabeOSubstituido: string;
}) {
  const [escolhido, setEscolhido] = useState<CandidatoDoCatalogo | null>(null);
  const [motivo, setMotivo] = useState("");
  const [assinatura, setAssinatura] = useState(curador);
  const [agendamento, setAgendamento] = useState(dataDeReferencia);
  const [filtro, setFiltro] = useState("");
  const [assinado, setAssinado] = useState<DestaqueAssinado | null>(null);
  const [persistiu, setPersistiu] = useState(true);
  const [substituindo, setSubstituindo] = useState(false);

  useEffect(() => {
    const guardados = lerDestaques().filter((d) => d.feedDe === feed.personaId);
    if (guardados.length) setAssinado(guardados[0]);
  }, [feed.personaId]);

  const candidatos = useMemo(() => {
    const alvo = filtro.trim().toLowerCase();
    return catalogo.itens.filter((c) => !alvo || c.titulo.toLowerCase().includes(alvo));
  }, [catalogo.itens, filtro]);

  const faltando = useMemo(() => {
    const f: string[] = [];
    if (!escolhido) f.push("o cartão a destacar");
    if (!motivo.trim()) f.push("o motivo");
    if (!assinatura.trim()) f.push("a assinatura");
    return f;
  }, [escolhido, motivo, assinatura]);

  const podeAssinar = faltando.length === 0;

  /**
   * A SEGUNDA TRAVA, como nas outras telas: `disabled` cobre o clique, e esta função recusa
   * por conta própria — `Enter` no formulário e `form.submit()` não passam pelo atributo.
   */
  const assinar = () => {
    if (!podeAssinar || !escolhido) return;
    const novo: DestaqueAssinado = {
      feedDe: feed.personaId,
      entidadeId: escolhido.id,
      titulo: escolhido.titulo,
      classe: escolhido.classe,
      motivo: motivo.trim(),
      assinatura: assinatura.trim(),
      carimbo,
      agendadoPara: agendamento,
      substituiu: feed.substituido?.titulo ?? null,
    };
    setAssinado(novo);
    setPersistiu(registrarDestaque(novo));
    setEscolhido(null);
    setMotivo("");
    setSubstituindo(false);
  };

  return (
    <div className="studio redacao redacao-destaque" data-feed-de={feed.personaId}>
      <header className="studio-cabecalho">
        <span className="studio-superficie">Redação · destaque do feed</span>
        <h1 className="studio-titulo">A única coisa no feed que uma pessoa escolheu</h1>
        <p className="studio-objetivo">
          O feed de <strong>{feed.personaNome}</strong> tem {feed.totalDeCartoes} cartões. Um
          deles é escolha da Redação, e sai assinado. Os outros vieram da caminhada no grafo.
        </p>
        <div className="redacao-escopos">
          <span className="studio-pastilha" data-chave-destaque={CHAVE_DO_DESTAQUE}>
            registro local em <code className="studio-literal">{CHAVE_DO_DESTAQUE}</code>
          </span>
        </div>
      </header>

      <div className="redacao-colunas redacao-colunas-destaque">
        {/* ---------------------------------------------------------------- */}
        {/* O destaque, o que ele substituiu, e a serendipidade ao lado       */}
        {/* ---------------------------------------------------------------- */}
        <div className="redacao-coluna-painel">
          <section className="web-painel" data-destaque-assinado={assinado ? "sim" : "nao"}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">O destaque deste feed</span>
              <span className="studio-pastilha studio-pastilha-marca">
                1 de {feed.totalDeCartoes}
              </span>
            </div>

            {assinado ? (
              <div className="redacao-decisao" data-destaque-da-redacao={assinado.entidadeId}>
                <span className="redacao-decisao-cabeca">
                  <strong>{assinado.titulo}</strong>
                  <span className="studio-pastilha">{assinado.classe}</span>
                </span>
                <p className="selo-motivo" data-motivo-destaque={assinado.motivo}>
                  <span>{assinado.motivo}</span>
                </p>
                <span className="redacao-decisao-assinatura">
                  escolha da Redação · {assinado.assinatura} · {assinado.carimbo} · agendado
                  para {comoSeLe(assinado.agendadoPara)}
                </span>
                {assinado.substituiu ? (
                  <span className="studio-rotulo">
                    entrou no lugar de «{assinado.substituiu}»
                  </span>
                ) : null}
              </div>
            ) : feed.destaque ? (
              <>
                <p className="studio-nota">
                  Hoje a posição {feed.posicaoDoCurado} é ocupada pelo cartão abaixo, escolhido
                  pelo <strong>rodízio</strong> — nenhuma pessoa assinou esta escolha ainda.
                </p>
                <Cartao cartao={feed.destaque} papel="destaque atual, sem assinatura" marca="curado" />
              </>
            ) : (
              <p className="studio-nota" data-nao-sustenta>
                Este feed não tem cartão na posição de destaque.
              </p>
            )}

            <p className="studio-nota">{regraDoDestaqueUnico}</p>
          </section>

          {/* ---- O CUSTO: o cartão que saiu ---- */}
          <section className="web-painel redacao-substituido" data-substituido={feed.substituido?.id ?? "nenhum"}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">O que saiu para o destaque caber</span>
            </div>
            {feed.substituido ? (
              <>
                <p className="studio-nota">
                  Sobrepor o algoritmo tem custo: o destaque ocupa uma vaga, e este cartão é o
                  que a caminhada teria entregue e ficou de fora.
                </p>
                <Cartao
                  cartao={feed.substituido}
                  papel="ficou de fora do feed"
                  marca="substituido"
                />
              </>
            ) : (
              <p className="studio-nota" data-nao-sustenta>
                Não foi possível identificar um cartão deslocado — o feed cabe inteiro no
                limite. A tela diz isso em vez de nomear um cartão qualquer.
              </p>
            )}
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">como este cartão foi descoberto</span>
              <p>{comoSeSabeOSubstituido}</p>
            </div>
          </section>

          {/* ---- A serendipidade, para contraste ---- */}
          <section className="web-painel redacao-serendipidade" data-serendipidade={feed.serendipidade?.id ?? "nenhuma"}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A serendipidade, que NÃO é curadoria</span>
              <span className="studio-pastilha">posição {feed.posicaoDaSerendipidade}</span>
            </div>
            {feed.serendipidade ? (
              <Cartao
                cartao={feed.serendipidade}
                papel="dosada pelo motor, sem assinatura"
                marca="serendipidade"
              />
            ) : (
              <p className="studio-nota" data-nao-sustenta>
                Este feed não recebeu cartão de serendipidade.
              </p>
            )}
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">a diferença, declarada</span>
              <p>{serendipidadeNaoECuradoria}</p>
            </div>
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Escolher e assinar                                                */}
        {/* ---------------------------------------------------------------- */}
        <aside className="redacao-coluna-escolha">
          <section className="web-painel" data-pode-assinar={podeAssinar ? "sim" : "nao"}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">
                {assinado ? "Trocar o destaque" : "Assinar um destaque"}
              </span>
            </div>

            {assinado && !substituindo ? (
              <>
                <p className="studio-nota">
                  Este feed já tem um destaque assinado. O teto é de UM: trocar substitui o
                  que está no ar, e não acrescenta um segundo.
                </p>
                <button
                  type="button"
                  className="studio-botao"
                  data-trocar-destaque
                  onClick={() => setSubstituindo(true)}
                >
                  escolher outro cartão para esta posição
                </button>
              </>
            ) : (
              <>
                {assinado ? (
                  <p className="studio-nota" data-aviso-substituicao>
                    Ao assinar, «{assinado.titulo}» deixa de ser o destaque deste feed. Um
                    feed, um destaque.
                  </p>
                ) : null}

                <div className="redacao-campo">
                  <label htmlFor="filtro-destaque" className="studio-rotulo">
                    filtrar candidatos — {catalogo.itens.length.toLocaleString("pt-BR")} de{" "}
                    {catalogo.total.toLocaleString("pt-BR")} entidades
                  </label>
                  <input
                    id="filtro-destaque"
                    className="redacao-textarea"
                    value={filtro}
                    placeholder="parte do título"
                    onChange={(e) => setFiltro(e.target.value)}
                  />
                </div>

                <ul className="web-lista-densa redacao-catalogo">
                  {candidatos.map((c) => (
                    <li
                      key={c.id}
                      className="web-linha redacao-candidato"
                      data-candidato-destaque={c.id}
                      data-escolhido={escolhido?.id === c.id ? "sim" : "nao"}
                    >
                      <span className="redacao-candidato-texto">
                        <span className="redacao-classe">{c.classe}</span>
                        <span className="web-linha-titulo">{c.titulo}</span>
                      </span>
                      <button
                        type="button"
                        className="studio-botao redacao-acrescentar"
                        onClick={() => setEscolhido(c)}
                      >
                        destacar
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="redacao-campo">
                  <label htmlFor="motivo-destaque" className="studio-rotulo">
                    motivo — obrigatório, e é ele que o público lê como escolha da Redação
                  </label>
                  <textarea
                    id="motivo-destaque"
                    className="redacao-textarea redacao-motivo"
                    data-motivo-do-destaque={motivo}
                    data-vazio={motivo.trim() ? "nao" : "sim"}
                    rows={3}
                    value={motivo}
                    placeholder="Por que este cartão vai em primeiro?"
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>

                <div className="redacao-campo">
                  <label htmlFor="assinatura-destaque" className="studio-rotulo">
                    assinatura da curadoria
                  </label>
                  <input
                    id="assinatura-destaque"
                    className="redacao-textarea"
                    value={assinatura}
                    onChange={(e) => setAssinatura(e.target.value)}
                  />
                </div>

                <div className="redacao-campo">
                  <label htmlFor="agendamento-destaque" className="studio-rotulo">
                    agendar para
                  </label>
                  <input
                    id="agendamento-destaque"
                    type="date"
                    className="redacao-textarea"
                    value={agendamento}
                    onChange={(e) => setAgendamento(e.target.value)}
                  />
                </div>

                <form
                  className="studio-acoes"
                  onSubmit={(e) => {
                    e.preventDefault();
                    assinar();
                  }}
                >
                  <button
                    type="submit"
                    className="studio-botao studio-botao-primario"
                    data-assinar-destaque
                    disabled={!podeAssinar}
                  >
                    {assinado ? "Substituir o destaque" : "Assinar o destaque"}
                  </button>
                  {faltando.length ? (
                    <span className="redacao-aviso-veto" data-faltando={faltando.length}>
                      Falta {faltando.join(", ")}. O destaque aparece ao público como escolha
                      da Redação, e escolha sem autor não é escolha.
                    </span>
                  ) : null}
                  {assinado && substituindo ? (
                    <button
                      type="button"
                      className="studio-botao"
                      data-cancelar-troca
                      onClick={() => setSubstituindo(false)}
                    >
                      cancelar
                    </button>
                  ) : null}
                </form>
              </>
            )}

            {persistiu ? null : (
              <p className="studio-nota" data-nao-sustenta>
                O navegador recusou gravar o registro local — acontece em janela privada e
                dentro de iframe. O destaque vale nesta tela, mas fechar a aba o perde.
              </p>
            )}
          </section>

          {/* ---- O feed resultante ---- */}
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">O feed resultante</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{feed.totalDeCartoes}</span>
                cartões
              </span>
            </div>
            <ol className="redacao-feed">
              {feed.cartoes.map((c) => (
                <li
                  key={c.id}
                  className="redacao-feed-linha"
                  data-posicao-feed={c.posicao}
                  data-especial={
                    c.posicao === feed.posicaoDoCurado
                      ? "curado"
                      : c.posicao === feed.posicaoDaSerendipidade
                        ? "serendipidade"
                        : "rodizio"
                  }
                >
                  <span className="studio-rotulo">{c.posicao}</span>
                  <span className="redacao-classe">{c.classe}</span>
                  <span className="web-linha-titulo">{c.titulo}</span>
                </li>
              ))}
            </ol>
            <p className="studio-nota">
              Duas posições são fixas e sobrepõem o rodízio: a {feed.posicaoDoCurado} é o
              destaque da Redação e a {feed.posicaoDaSerendipidade} é a serendipidade. As
              outras {feed.totalDeCartoes - 2} saíram da caminhada no grafo.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
