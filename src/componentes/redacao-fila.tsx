"use client";

import { useMemo, useState } from "react";
import { Comentario } from "@/componentes/comentario";
import type {
  AcaoDeclarada,
  AcaoDaRedacao,
  ComponenteDoScore,
  DeclaracaoDaRedacao,
  Escopo,
  FaixaDeScore,
  IdDoEscopo,
  ItemDaFila,
  NumerosDaRedacao,
  OrigemDeclarada,
  OrigemDoItem,
} from "@/dados/redacao";

/**
 * redacao-fila.tsx — a fila de moderação da Redação (tela 34, D-82 a D-84 e D-86).
 *
 * ESTA TELA É A RESPOSTA À PERGUNTA MAIS DIFÍCIL DO RFP: onde a IA não deve ser utilizada.
 * A resposta não é o rodapé — é a mecânica. A sugestão da IA chega marcada, com score e com
 * a regra do score do lado; ela não vira dado público sem um humano apertar «aprovar»; e o
 * botão de vetar **não conclui** com o campo de motivo vazio. A diferença entre curadoria e
 * moderação silenciosa é essa obrigatoriedade, e ela precisa ser demonstrável ao vivo em
 * vez de descrita.
 *
 * DUAS TRAVAS NO VETO, E NÃO UMA (T-05-14). O botão de confirmar está de fato `disabled` —
 * não apenas apagado — e `registrarVeto` recusa motivo em branco POR CONTA PRÓPRIA, mesmo
 * chamada por outro caminho. Só a aparência não basta: um botão que apenas parece apagado
 * ainda dispara por `Enter`, por `form.submit()` e por `el.click()`, e cada um desses
 * caminhos produziria uma decisão de veto sem motivo — que é exatamente a moderação
 * silenciosa que D-83 existe para impedir. `data-veto-bloqueado` lê a MESMA expressão que
 * `disabled`, e não um espelho de estado separado que pode divergir do botão.
 *
 * DP-F: este arquivo é `"use client"` e importa `@/dados/redacao` **apenas por tipo**. O
 * módulo alcança 23 MB de grafo; o que atravessa a fronteira é o DTO, que é só primitivo, e
 * quem o monta é a página de servidor.
 *
 * O CARIMBO NÃO VEM DO RELÓGIO. `carimbo` chega por propriedade, derivado da data de
 * referência do build. Ler `new Date()` aqui faria o HTML exportado e a página hidratada
 * divergirem na primeira renderização e ainda exporia o fuso horário de quem avalia.
 */

// ---------------------------------------------------------------------------
// A decisão — D-84: nunca sem autor, nunca sem carimbo
// ---------------------------------------------------------------------------

interface Decisao {
  itemId: string;
  itemTitulo: string;
  origem: OrigemDoItem;
  acao: AcaoDaRedacao;
  /** Vazio nas ações que não pedem texto. NUNCA vazio no veto — ver `registrarVeto`. */
  motivo: string;
  /** Quem decidiu. Autorado e rotulado como tal: não há autenticação aqui (D-25). */
  quem: string;
  /** Carimbo derivado da data de referência do build, nunca do relógio do runtime. */
  quando: string;
}

const ROTULO_ACAO: Record<AcaoDaRedacao, string> = {
  aprovar: "aprovado",
  editar: "enviado para edição",
  vetar: "vetado",
  devolver: "devolvido a quem submeteu",
};

const ROTULO_ORIGEM: Record<OrigemDoItem, string> = {
  produtor: "produtor",
  ingestao: "ingestão automática",
  ia: "sugestão de IA",
};

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

/** "0.6" → "0,60". Vírgula porque a tela é em português e o número é lido em voz alta. */
function comoScore(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

// ---------------------------------------------------------------------------
// Pedaços
// ---------------------------------------------------------------------------

/**
 * O selo de origem. Ele é o primeiro elemento da linha de propósito: quem varre a fila
 * precisa saber DE ONDE veio o item antes de ler o título, porque é a origem que decide
 * quanto do resto merece confiança.
 */
function SeloOrigem({ origem }: { origem: OrigemDoItem }) {
  return (
    <span className="redacao-selo-origem" data-origem={origem}>
      {ROTULO_ORIGEM[origem]}
    </span>
  );
}

function LinhaDaFila({
  item,
  escolhido,
  aoEscolher,
}: {
  item: ItemDaFila;
  escolhido: boolean;
  aoEscolher: () => void;
}) {
  return (
    <li
      className="web-linha web-realce redacao-linha"
      data-item-fila={item.id}
      // D-82 — a origem vai na LINHA, não só no painel: a tela existe para que a
      // procedência de cada item seja legível varrendo a fila, sem abrir item nenhum.
      data-procedencia-item={item.origem}
      data-realcado={escolhido ? "sim" : "nao"}
    >
      <button type="button" className="redacao-linha-botao" onClick={aoEscolher}>
        <span className="redacao-linha-topo">
          <SeloOrigem origem={item.origem} />
          {item.score !== null ? (
            <span className="redacao-score" data-score-ia={item.score}>
              <span className="redacao-score-rotulo">confiança</span>
              <span className="redacao-score-numero">{comoScore(item.score)}</span>
            </span>
          ) : (
            // Produtor e ingestão AFIRMAM; a IA estima. A ausência de score é dita em
            // texto em vez de virar espaço em branco, que é o que D-90 pede.
            <span className="redacao-sem-score">sem score — origem que afirma</span>
          )}
        </span>
        <span className="web-linha-titulo">{item.titulo}</span>
        <span className="web-linha-meta">
          <span className="redacao-classe">{item.classe}</span>
          <span className="studio-rotulo">procedência {item.procedencia}</span>
          {item.territorio ? <span>{item.territorio}</span> : null}
        </span>
      </button>
    </li>
  );
}

/** Os cinco componentes do score, marcados um a um. É isto que torna o número conferível. */
function ComponentesDoScore({
  componentes,
  atendidos,
}: {
  componentes: readonly ComponenteDoScore[];
  atendidos: string[];
}) {
  return (
    <ul className="redacao-componentes">
      {componentes.map((c) => {
        const atende = atendidos.includes(c.id);
        return (
          <li key={c.id} className="redacao-componente" data-atende={atende ? "sim" : "nao"}>
            <span className="redacao-componente-marca" aria-hidden>
              {atende ? "●" : "○"}
            </span>
            <span className="redacao-componente-texto">
              <strong>{c.rotulo}</strong>
              <span className="studio-nota">{c.observa}</span>
            </span>
            <span className="redacao-componente-peso">
              {atende ? `+${comoScore(c.peso)}` : "0,00"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function RedacaoFila({
  fila,
  numeros,
  escopos,
  origens,
  acoes,
  componentesDoScore,
  regraDoScore,
  regraDaAmostragem,
  porQueRodizio,
  distribuicao,
  fraseDaAssimetria,
  fraseDaAtribuicao,
  declaracoes,
  limites,
  curador,
  curadorEhAutorado,
  carimbo,
  itensPorOrigem,
  itemInicial,
}: {
  /** Os 60 itens já achatados em primitivo. Nenhuma `Entidade` atravessa a fronteira. */
  fila: ItemDaFila[];
  numeros: NumerosDaRedacao;
  escopos: readonly Escopo[];
  origens: readonly OrigemDeclarada[];
  acoes: readonly AcaoDeclarada[];
  componentesDoScore: readonly ComponenteDoScore[];
  regraDoScore: string;
  regraDaAmostragem: string;
  porQueRodizio: string;
  distribuicao: FaixaDeScore[];
  fraseDaAssimetria: string;
  fraseDaAtribuicao: string;
  declaracoes: DeclaracaoDaRedacao[];
  limites: readonly string[];
  curador: string;
  curadorEhAutorado: string;
  /** Derivado da data de referência do build. Ver o cabeçalho deste arquivo. */
  carimbo: string;
  itensPorOrigem: number;
  /** Em que item a tela abre. Constante do módulo, e não sorteio a cada build. */
  itemInicial: string;
}) {
  const [escopo, setEscopo] = useState<IdDoEscopo>("nacional");
  const [escolhidoId, setEscolhidoId] = useState<string>(itemInicial);

  /**
   * As decisões desta sessão. Estado de componente, e não `localStorage`: recarregar
   * limpa, e a tela declara isso. Este protótipo NÃO TEM ESCRITA — o que ele demonstra é
   * a FORMA da decisão (quem, quando, por quê), não a persistência dela.
   */
  const [decisoes, setDecisoes] = useState<Decisao[]>([]);

  /** O veto é a única ação com passo de confirmação. A assimetria é o conteúdo (D-83). */
  const [vetando, setVetando] = useState(false);
  const [motivoVeto, setMotivoVeto] = useState("");
  const [comentarioDevolucao, setComentarioDevolucao] = useState("");

  const decididos = useMemo(
    () => new Set(decisoes.map((d) => d.itemId)),
    [decisoes],
  );

  const escopoAtivo = useMemo(
    () => escopos.find((e) => e.id === escopo) ?? escopos[0],
    [escopos, escopo],
  );

  /**
   * O RECORTE. Despachado sobre `Escopo.campo`, que veio no DTO — a mesma decisão que
   * `itemNoEscopo` toma do lado do build. O nome do campo viaja em vez de a regra ser
   * copiada, porque duas cópias de uma regra de recorte divergem em silêncio e o sintoma
   * é um item com território à vista sumindo do escopo territorial.
   */
  const noEscopo = (item: ItemDaFila) => {
    if (escopoAtivo.campo === "territorio") return item.territorio !== null;
    if (escopoAtivo.campo === "linguagens") return item.linguagens.length > 0;
    return true;
  };

  const pendentes = useMemo(
    () => fila.filter((i) => !decididos.has(i.id) && noEscopo(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fila, decididos, escopoAtivo],
  );

  /**
   * O item aberto. Se o escolhido saiu da fila — decidido, ou fora do recorte —, o painel
   * cai no primeiro pendente em vez de ficar vazio: a fila é o dado e a escolha é estado
   * de tela, e nenhuma das duas pode derrubar a outra.
   */
  const item = useMemo(
    () => pendentes.find((i) => i.id === escolhidoId) ?? pendentes[0],
    [pendentes, escolhidoId],
  );

  const contadas = useMemo(() => {
    const c: Record<string, number> = { produtor: 0, ingestao: 0, ia: 0 };
    for (const i of pendentes) c[i.origem] = (c[i.origem] ?? 0) + 1;
    return c;
  }, [pendentes]);

  // -------------------------------------------------------------------------
  // As decisões. Só existe UM caminho para uma decisão nascer, e ele passa por aqui.
  // -------------------------------------------------------------------------

  const registrar = (acao: AcaoDaRedacao, motivo: string) => {
    if (!item) return;
    setDecisoes((antes) => [
      {
        itemId: item.id,
        itemTitulo: item.titulo,
        origem: item.origem,
        acao,
        motivo,
        quem: curador,
        quando: carimbo,
      },
      ...antes.filter((d) => d.itemId !== item.id),
    ]);
    setVetando(false);
    setMotivoVeto("");
    setComentarioDevolucao("");
  };

  /** Espaço em branco não é motivo. Aparado ANTES de avaliar, e não depois. */
  const motivoAparado = motivoVeto.trim();

  /**
   * A SEGUNDA TRAVA (T-05-14). O botão de confirmar está `disabled`, mas `disabled` é
   * aparência de um caminho só: `el.click()`, `Enter` sobre o formulário e `form.submit()`
   * ainda alcançam o manipulador em vários navegadores e em qualquer código que chame por
   * fora. Esta função recusa por conta própria, e é ela — não o atributo — que garante que
   * nenhuma decisão de veto nasça sem motivo escrito.
   */
  const registrarVeto = () => {
    if (!motivoAparado) return;
    registrar("vetar", motivoAparado);
  };

  const executar = (acao: AcaoDaRedacao) => {
    if (acao === "vetar") {
      setVetando(true);
      return;
    }
    if (acao === "devolver") {
      registrar("devolver", comentarioDevolucao.trim());
      return;
    }
    registrar(acao, "");
  };

  const desfazer = (itemId: string) =>
    setDecisoes((antes) => antes.filter((d) => d.itemId !== itemId));

  const acaoDoVeto = acoes.find((a) => a.id === "vetar");
  const acaoDeDevolver = acoes.find((a) => a.id === "devolver");

  return (
    <div className="studio redacao" data-fila-redacao>
      {/* ------------------------------------------------------------------ */}
      {/* Cabeçalho — quem opera, sobre o quê, e com qual ESCOPO (D-84).      */}
      {/* ------------------------------------------------------------------ */}
      <header className="studio-cabecalho">
        <span className="studio-superficie">Redação · fila de moderação</span>
        <h1 className="studio-titulo">
          {comSeparador(pendentes.length)} itens esperando decisão
        </h1>
        <p className="studio-objetivo">
          Cada item traz a ORIGEM de onde veio. Os de sugestão de IA trazem score de
          confiança e a regra que o produziu. Nada aqui vira dado público sem alguém
          decidir, e toda decisão fica com nome e carimbo.
        </p>

        <div className="redacao-escopos">
          <span className="studio-rotulo">escopo do curador</span>
          <div className="web-alternador" role="group" aria-label="escopo de curadoria">
            {escopos.map((e) => (
              <button
                key={e.id}
                type="button"
                data-escopo-curador={e.id}
                aria-pressed={escopo === e.id}
                onClick={() => setEscopo(e.id)}
              >
                {e.rotulo} · {comSeparador(e.alcance)}
              </button>
            ))}
          </div>
          <span className="studio-pastilha">
            operando como <strong>{curador}</strong>
          </span>
        </div>

        <p className="redacao-escopo-descricao">{escopoAtivo.descricao}</p>

        <Comentario className="studio-nota">
          O escopo troca o RECORTE, não a tela e não a URL — é a mesma superfície servindo
          cortes diferentes, e é essa propriedade que responde ao «como crescer sem
          reescrever a plataforma» do RFP (D-84, D-89). Uma redação regional e uma redação
          nacional operam este mesmo arquivo.
        </Comentario>
      </header>

      <div className="redacao-colunas">
        {/* ---------------------------------------------------------------- */}
        {/* A fila                                                            */}
        {/* ---------------------------------------------------------------- */}
        <section className="web-painel redacao-coluna-fila">
          <h2 className="web-painel-titulo">a fila</h2>

          <div className="redacao-contagens">
            {origens.map((o) => (
              <span
                key={o.id}
                className={
                  o.id === "ia" ? "studio-pastilha studio-pastilha-marca" : "studio-pastilha"
                }
              >
                <span className="studio-pastilha-numero">
                  {comSeparador(contadas[o.id] ?? 0)}
                </span>
                {o.rotulo}
              </span>
            ))}
          </div>

          {pendentes.length ? (
            <ul className="web-lista-densa redacao-lista">
              {pendentes.map((i) => (
                <LinhaDaFila
                  key={i.id}
                  item={i}
                  escolhido={item?.id === i.id}
                  aoEscolher={() => {
                    setEscolhidoId(i.id);
                    setVetando(false);
                    setMotivoVeto("");
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="studio-nota">
              Nenhum item pendente neste escopo. Trocar o escopo acima devolve os itens que
              o recorte deixou de fora — eles não sumiram, estão fora do corte.
            </p>
          )}

          <div className="studio-nao-sustenta" data-nao-sustenta>
            <span className="studio-nao-sustenta-rotulo">como esta fila foi montada</span>
            <p>{fraseDaAtribuicao}</p>
            <p>{regraDaAmostragem}</p>
            <p>
              São {comSeparador(itensPorOrigem)} itens por origem, {""}
              {comSeparador(numeros.itensNaFila)} no total.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* O item escolhido — a ficha, o score conferível, as quatro ações   */}
        {/* ---------------------------------------------------------------- */}
        <div className="redacao-coluna-painel">
          {item ? (
            <section
              className="web-painel redacao-item"
              // `data-procedencia-item` NÃO se repete aqui: ele é atributo de LINHA da
              // fila, e um gate que conte 60 origens não pode encontrar 61 porque o
              // painel repetiu a do item aberto. O selo de origem abaixo diz a mesma
              // coisa em texto, que é o que o produto precisa.
              data-item-escolhido={item.id}
            >
              <div className="studio-painel-cabeca">
                <SeloOrigem origem={item.origem} />
                <span className="studio-pastilha">{item.classe}</span>
                <span className="studio-pastilha">procedência {item.procedencia}</span>
              </div>

              <h2 className="studio-painel-nome">{item.titulo}</h2>

              {item.resumo ? (
                <p className="studio-nota">{item.resumo}</p>
              ) : (
                <p className="studio-nota" data-nao-sustenta>
                  O acervo não publica resumo para este item. O campo aparece declarado
                  vazio em vez de sumir da ficha — quem decide precisa saber que a ausência
                  é do dado, e não da tela.
                </p>
              )}

              <div className="studio-tabela">
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">id no acervo</div>
                  <div className="studio-celula">
                    <code className="studio-literal">{item.entidadeId}</code>
                  </div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">origem declarada</div>
                  <div className="studio-celula">
                    {origens.find((o) => o.id === item.origem)?.regra}
                  </div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">fonte</div>
                  <div className="studio-celula">
                    {item.fonte ? (
                      <code className="studio-literal">{item.fonte}</code>
                    ) : (
                      <span data-nao-sustenta>
                        o acervo não declara URL de origem para este item
                      </span>
                    )}
                  </div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">linguagens</div>
                  <div className="studio-celula">
                    {item.linguagens.length ? (
                      item.linguagens.join(" · ")
                    ) : (
                      <span data-nao-sustenta>não classificado no vocabulário controlado</span>
                    )}
                  </div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">território</div>
                  <div className="studio-celula">
                    {item.territorio ?? (
                      <span data-nao-sustenta>o acervo não situa este item</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ---- D-82: o score, e a regra que o produziu, lado a lado ---- */}
              {item.score !== null && item.componentes ? (
                <div className="redacao-bloco-score">
                  <div className="studio-painel-cabeca">
                    <span className="studio-painel-nome">Score de confiança</span>
                    {/* SEM `data-score-ia` aqui. O atributo é de LINHA da fila, e
                        repeti-lo no painel faria a contagem no HTML exportado sair 21
                        quando os itens de IA são 20 — um gate de contagem quebraria por
                        causa do painel, não do dado. O número aparece em texto, que é o
                        que o produto precisa. */}
                    <span className="studio-pastilha studio-pastilha-marca">
                      <span className="studio-pastilha-numero">
                        {comoScore(item.score)}
                      </span>
                      de 1,00
                    </span>
                  </div>
                  <ComponentesDoScore
                    componentes={componentesDoScore}
                    atendidos={item.componentes}
                  />
                  {/* PRODUTO, e não comentário: a regra fica na tela com o modo
                      comentado desligado. Score sem regra é o recomendador opaco. */}
                  <p className="studio-nota redacao-regra-score">{regraDoScore}</p>
                </div>
              ) : (
                <p className="studio-nota redacao-sem-score-explicado">
                  Este item não tem score porque a origem dele não estima: {""}
                  {origens.find((o) => o.id === item.origem)?.rotulo} afirma. Pontuar as três
                  origens achataria a distinção que esta tela existe para fazer.
                </p>
              )}

              {/* ---- D-86: a sugestão da IA, com a aresta que a produziu ---- */}
              {item.sugestao ? (
                <div className="redacao-sugestao">
                  <span className="studio-rotulo">por que a IA sugeriu isto</span>
                  <p className="selo-motivo">
                    <span>{item.sugestao.motivo}</span>
                  </p>
                  <p className="studio-nota">
                    Travessia do grafo a partir de «{item.sugestao.deTitulo}», pela relação
                    «{item.sugestao.relacao}». A frase acima é a da própria aresta, com
                    procedência {item.sugestao.procedenciaAresta} — a IA não a escreveu.
                  </p>
                </div>
              ) : null}

              {/* ---- D-83: as quatro ações ---- */}
              <div className="studio-acoes redacao-acoes">
                {acoes.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    data-acao-redacao={a.id}
                    className={
                      a.id === "aprovar" ? "studio-botao studio-botao-primario" : "studio-botao"
                    }
                    onClick={() => executar(a.id)}
                  >
                    {a.rotulo}
                    {a.motivo === "obrigatorio" ? " · exige motivo" : null}
                  </button>
                ))}
              </div>

              {/* ================================================================ */}
              {/* O VETO — a única ação que não conclui sem motivo escrito (D-83)   */}
              {/* ================================================================ */}
              {vetando ? (
                <form
                  className="redacao-veto"
                  onSubmit={(e) => {
                    e.preventDefault();
                    registrarVeto();
                  }}
                >
                  <span className="studio-nao-sustenta-rotulo">
                    vetar «{item.titulo}» — motivo obrigatório
                  </span>
                  <label htmlFor="motivo-veto" className="studio-rotulo">
                    por que este item não entra
                  </label>
                  <textarea
                    id="motivo-veto"
                    data-motivo-veto
                    className="redacao-textarea"
                    rows={3}
                    autoFocus
                    value={motivoVeto}
                    placeholder="Escreva o motivo. Sem ele o veto não conclui."
                    onChange={(e) => setMotivoVeto(e.target.value)}
                  />
                  <p className="studio-nota">{acaoDoVeto?.nota}</p>
                  <div className="studio-acoes">
                    <button
                      type="submit"
                      className="studio-botao studio-botao-primario"
                      // As DUAS travas lêem a MESMA expressão. Um espelho de estado
                      // separado poderia dizer «liberado» com o botão travado, e o gate
                      // passaria sobre uma tela que não faz o que o atributo afirma.
                      disabled={!motivoAparado}
                      data-veto-bloqueado={motivoAparado ? "nao" : "sim"}
                    >
                      Confirmar veto
                    </button>
                    <button
                      type="button"
                      className="studio-botao"
                      onClick={() => {
                        setVetando(false);
                        setMotivoVeto("");
                      }}
                    >
                      Cancelar
                    </button>
                    {!motivoAparado ? (
                      <span className="redacao-aviso-veto">
                        O botão está desabilitado porque o motivo está vazio. Espaço em
                        branco não conta.
                      </span>
                    ) : null}
                  </div>
                </form>
              ) : null}
              <p className="studio-nota">{fraseDaAssimetria}</p>

              {/* ---- O comentário OPCIONAL de devolver, rotulado como opcional ---- */}
              <div className="redacao-campo">
                <label htmlFor="comentario-devolucao" className="studio-rotulo">
                  comentário para quem submeteu — opcional
                </label>
                <textarea
                  id="comentario-devolucao"
                  className="redacao-textarea"
                  rows={2}
                  value={comentarioDevolucao}
                  placeholder="Opcional. «Devolver» conclui com ou sem este texto."
                  onChange={(e) => setComentarioDevolucao(e.target.value)}
                />
                <p className="studio-nota">{acaoDeDevolver?.nota}</p>
              </div>

            </section>
          ) : (
            <section className="web-painel">
              <p className="studio-nota">
                Nada pendente neste escopo. As decisões tomadas continuam listadas abaixo,
                com autor e carimbo.
              </p>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* D-84 — o registro: quem decidiu, quando, e o motivo quando houve  */}
          {/* ---------------------------------------------------------------- */}
          <section className="web-painel redacao-registro">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Decisões desta sessão</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{decisoes.length}</span>
                registrada(s)
              </span>
            </div>

            {decisoes.length ? (
              <ul className="redacao-decisoes">
                {decisoes.map((d) => (
                  <li
                    key={d.itemId}
                    className="redacao-decisao"
                    data-decisao-redacao={d.itemId}
                    data-acao-registrada={d.acao}
                  >
                    <span className="redacao-decisao-cabeca">
                      <strong>{ROTULO_ACAO[d.acao]}</strong>
                      <SeloOrigem origem={d.origem} />
                    </span>
                    <span className="redacao-decisao-titulo">{d.itemTitulo}</span>
                    {d.motivo ? (
                      <span className="redacao-decisao-motivo">
                        <span className="studio-rotulo">
                          {d.acao === "vetar" ? "motivo do veto" : "comentário"}
                        </span>
                        {d.motivo}
                      </span>
                    ) : null}
                    <span className="redacao-decisao-assinatura">
                      {d.quem} · {d.quando}
                    </span>
                    <button
                      type="button"
                      className="studio-botao redacao-desfazer"
                      onClick={() => desfazer(d.itemId)}
                    >
                      desfazer
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="studio-nota">
                Nenhuma decisão ainda. Nada nesta fila avança sozinho: sem alguém apertar um
                botão, o registro fica vazio — e é isso que a tela mostra ao abrir.
              </p>
            )}

            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">sobre a autoria da decisão</span>
              <p>{curadorEhAutorado}</p>
            </div>
          </section>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* A distribuição de score — o recorte E a população, nunca só o corte */}
      {/* ------------------------------------------------------------------ */}
      <section className="web-painel redacao-distribuicao">
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">A faixa de confiança, contada</span>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{numeros.itensComScore}</span>
            itens de IA na fila
          </span>
        </div>
        <div className="web-denominadores">
          {distribuicao.map((f) => (
            <span key={f.score} className="web-denominador" data-denominador={`score-${f.score}`}>
              <span className="web-denominador-numero">{f.naFila}</span>
              <span className="web-denominador-rotulo">
                score {comoScore(f.score)} · {comSeparador(f.naPopulacao)} na população
              </span>
            </span>
          ))}
        </div>
        <p className="studio-nota">{porQueRodizio}</p>
        {/* A REGRA DO SCORE APARECE DUAS VEZES, e é deliberado. Junto do número, no
            painel do item, porque é ali que alguém decide se acredita nele; e aqui,
            porque o painel do item só mostra score quando o item é de IA — e a regra
            precisa estar na tela mesmo quando o item aberto é de produtor. Score sem
            regra à vista é o recomendador opaco que esta tela existe para recusar. */}
        <p className="studio-nota redacao-regra-score">{regraDoScore}</p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* D-90 — o que o acervo não sustenta nesta tela                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="web-painel">
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">O que o acervo não sustenta aqui</span>
        </div>
        {declaracoes.map((d) => (
          <div key={d.campo} className="studio-nao-sustenta" data-nao-sustenta>
            <span className="studio-nao-sustenta-rotulo">{d.campo}</span>
            <p>{d.texto}</p>
          </div>
        ))}
      </section>

      {/* ================================================================== */}
      {/* D-86 — OS TRÊS LIMITES. Fora de <Comentario>: é produto, e continua */}
      {/* na tela com o modo comentado desligado.                             */}
      {/* ================================================================== */}
      <footer className="redacao-limites" data-limites-ia>
        <span className="studio-nao-sustenta-rotulo">onde a IA não é utilizada</span>
        <ul>
          {limites.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
