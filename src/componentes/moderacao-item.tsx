"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ROTULO_DA_ACAO, decisaoCompleta, situacaoApos } from "@/dados/tipos-acesso";
import { CHAVE_DO_ARMAZEM, gravarArmazem, lerArmazem } from "./moderacao-armazem";
import type {
  AcaoDaModeracao,
  AcaoDeclarada,
  ComponenteDaChave,
  ConferenciaDaFicha,
  DecisaoRegistrada,
  Escopo,
  ItemDaFila,
  MotivoDeDenuncia,
  OrigemDeclarada,
  OrigemDoItem,
} from "@/dados/moderacao";

/**
 * moderacao-item.tsx — a ficha do item (M2; funcionalidades 109, 110, 114, 115, 118, 119).
 *
 * ESTA É A TELA ONDE O MODERADOR CONFERE EM VEZ DE CONFIAR. A fila resolve o que é
 * evidente; a ficha existe para o que não é — e aí ela precisa mostrar o registro CAMPO A
 * CAMPO, na ordem da ontologia, com a chave de identidade marcada componente a componente e
 * com o que impede a publicação dito por extenso, em vez de apenas desabilitado.
 *
 * A ASSIMETRIA DAS AÇÕES É O CONTEÚDO, E ELA TEM TRÊS TRAVAS. Só o veto exige motivo: o
 * botão de confirmar está `disabled`, `registrarVeto` recusa por conta própria mesmo quando
 * chamado por outro caminho, e `decisaoCompleta`, do contrato compartilhado, recusa uma
 * terceira vez. Só a aparência não basta — um botão que apenas parece apagado ainda dispara
 * por `Enter`, por `form.submit()` e por `el.click()`, e cada um desses caminhos produziria
 * um veto sem motivo, que é a moderação silenciosa que esta tela existe para impedir.
 *
 * O QUE ELA NÃO DECIDE, E É DELIBERADO. Classificação indicativa ela CONFERE, não arbitra —
 * quem realiza o evento responde por ela. Termo fora do vocabulário ela ENCAMINHA ao
 * Editor, nunca cria — vocabulário com duas portas deixa de ser controlado na primeira vez
 * que as duas discordarem. As duas recusas estão escritas na tela, e não só no código.
 *
 * DP-F: `"use client"`, e `@/dados/moderacao` entra **apenas por tipo**. O que atravessa a
 * fronteira é o DTO de primitivo montado pela página de servidor. `@/dados/tipos-acesso`
 * entra por VALOR, e pode: ele não alcança o grafo — é a garantia que a S7 declarou.
 *
 * SEM RELÓGIO. O carimbo chega por propriedade, derivado da data de referência do build.
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

/**
 * Uma linha da ficha.
 *
 * Um campo que o acervo não sustenta CONTINUA NA POSIÇÃO DELE, declarado vazio, em vez de
 * sumir. Campo que some muda a ordem dos outros, e quem confere dez fichas perde a
 * referência de onde cada coisa mora — além de não conseguir distinguir «este item não tem»
 * de «esta tela não mostra».
 */
function LinhaDaFicha({
  rotulo,
  children,
  ausente,
}: {
  rotulo: string;
  children?: React.ReactNode;
  ausente?: string;
}) {
  return (
    <div className="studio-linha">
      <div className="studio-celula studio-celula-rotulo">{rotulo}</div>
      <div className="studio-celula">
        {ausente ? <span data-nao-sustenta>{ausente}</span> : children}
      </div>
    </div>
  );
}

export function ModeracaoItem({
  fila,
  origens,
  acoes,
  escopos,
  componentesDaChave,
  regraDaChave,
  conferencias,
  fraseDoBloqueio,
  fraseDaAssimetria,
  motivosDeDenuncia,
  moderador,
  carimbo,
  itemInicial,
}: {
  /** A fila inteira, já achatada em primitivo. A ficha troca de item sem sair da rota. */
  fila: ItemDaFila[];
  origens: readonly OrigemDeclarada[];
  acoes: readonly AcaoDeclarada[];
  escopos: readonly Escopo[];
  componentesDaChave: readonly ComponenteDaChave[];
  regraDaChave: string;
  conferencias: readonly ConferenciaDaFicha[];
  fraseDoBloqueio: string;
  fraseDaAssimetria: string;
  motivosDeDenuncia: readonly MotivoDeDenuncia[];
  moderador: string;
  /** Derivado da data de referência do build. Nunca o relógio de quem abre a página. */
  carimbo: string;
  itemInicial: string;
}) {
  const [decisoes, setDecisoes] = useState<DecisaoRegistrada[]>([]);
  const [armazemLido, setArmazemLido] = useState(false);
  const [falhaDoArmazem, setFalhaDoArmazem] = useState<string | null>(null);
  const [escolhidoId, setEscolhidoId] = useState<string>(itemInicial);

  /**
   * QUAL ITEM ABRIR. Lido de `?item=` em `useEffect`, nunca no render.
   *
   * Sob export estático a rota é uma só e o HTML é o mesmo para todos os itens; quem
   * escolhe é o cliente. Ler a busca durante a renderização faria o HTML do build e a
   * página hidratada divergirem — o servidor não tem `location` nenhum. É também o que faz
   * o link vindo da fila abrir no item certo em vez de sempre no primeiro.
   */
  useEffect(() => {
    const lido = lerArmazem();
    setDecisoes(lido.decisoes);
    setFalhaDoArmazem(lido.falha);
    setArmazemLido(true);

    const pedido = new URLSearchParams(window.location.search).get("item");
    if (pedido) setEscolhidoId(pedido);
  }, []);

  useEffect(() => {
    if (armazemLido) setFalhaDoArmazem(gravarArmazem(decisoes));
  }, [decisoes, armazemLido]);

  const [vetando, setVetando] = useState(false);
  const [motivoVeto, setMotivoVeto] = useState("");
  const [comentarioDevolucao, setComentarioDevolucao] = useState("");
  const [encaminhados, setEncaminhados] = useState<string[]>([]);

  /**
   * O item aberto. Se `?item=` apontar para um id que não existe na fila, a ficha cai no
   * primeiro em vez de ficar vazia — um endereço velho, copiado de outra sessão, não pode
   * produzir uma tela em branco sem explicação.
   */
  const item = useMemo(
    () => fila.find((i) => i.id === escolhidoId) ?? fila[0],
    [fila, escolhidoId],
  );

  const decisaoDoItem = useMemo(
    () => decisoes.find((d) => d.itemId === item?.id) ?? null,
    [decisoes, item],
  );

  /**
   * O QUE IMPEDE A PUBLICAÇÃO, conferido sobre este item.
   *
   * Um item **sem imagem nenhuma** não está bloqueado: não há direito de imagem a violar
   * onde não há imagem, e tratar os dois casos como o mesmo barraria registros por um
   * problema que eles não têm.
   */
  const bloqueios = useMemo(() => {
    if (!item) return [];
    const lista: { id: string; texto: string }[] = [];
    if (item.imagem && !item.creditoImagem) {
      lista.push({
        id: "credito",
        texto:
          "Este item declara imagem e NÃO declara crédito. Imagem sem crédito não entra no " +
          "acervo público: publicar uma foto sem dizer de quem ela é transfere ao Itaú " +
          "Cultural um risco que não é dele e apaga a autoria de quem fotografou. Quem " +
          "preenche é a Organização, que responde por mídia e crédito.",
      });
    }
    return lista;
  }, [item]);

  const motivoAparado = motivoVeto.trim();

  const registrar = (acao: AcaoDaModeracao, motivo: string) => {
    if (!item) return;
    const decisao: DecisaoRegistrada = {
      itemId: item.id,
      itemTitulo: item.titulo,
      origem: item.origem,
      acao,
      // `null` e não `""`: o contrato distingue «não houve motivo» de «houve e é vazio».
      motivo: motivo.trim() ? motivo.trim() : null,
      autor: moderador,
      quando: carimbo,
      escopo: escopos[0]?.id ?? null,
      // Derivada, nunca digitada. É o que o Studio lê para dizer ao produtor em que estado
      // o registro dele ficou.
      situacao: situacaoApos(acao),
    };
    // A TRAVA DO CONTRATO — a mesma função que o Studio usa para conferir o que recebeu.
    if (!decisaoCompleta(decisao)) return;
    setDecisoes((antes) => [decisao, ...antes.filter((d) => d.itemId !== item.id)]);
    setVetando(false);
    setMotivoVeto("");
    setComentarioDevolucao("");
  };

  /** A segunda trava: recusa por conta própria, mesmo chamada por fora do botão. */
  const registrarVeto = () => {
    if (!motivoAparado) return;
    registrar("vetar", motivoAparado);
  };

  const executar = (acao: AcaoDaModeracao) => {
    if (acao === "vetar") {
      setVetando(true);
      return;
    }
    if (acao === "devolver") {
      registrar("devolver", comentarioDevolucao);
      return;
    }
    registrar(acao, "");
  };

  const acaoDoVeto = acoes.find((a) => a.id === "vetar");
  const acaoDeDevolver = acoes.find((a) => a.id === "devolver");

  if (!item) {
    return (
      <div className="studio moderacao" data-ficha-moderacao>
        <section className="web-painel">
          <p className="studio-nota">
            A fila do build não devolveu item nenhum. Isso não é uma fila vazia — é a fonte
            tendo mudado por baixo. <Link href="/moderacao/fila/">Voltar à fila</Link>.
          </p>
        </section>
      </div>
    );
  }

  const origemDoItem = origens.find((o) => o.id === item.origem);
  /** Quantos pendentes a lista de atalho NÃO mostra. Medido, e dito na tela. */
  const pendentesFora = Math.max(
    0,
    fila.filter((i) => i.id !== item.id && !decisoes.some((d) => d.itemId === i.id)).length - 8,
  );
  const sustentados = item.chave.split("").filter((b) => b === "1").length;

  return (
    <div className="studio moderacao" data-ficha-moderacao data-item-aberto={item.id}>
      <header className="studio-cabecalho">
        <span className="studio-superficie">Moderação · ficha do item</span>
        <h1 className="studio-titulo">{item.titulo}</h1>
        <p className="studio-objetivo">
          Aqui a decisão é conferida campo a campo, na ordem da ontologia. O que impede a
          publicação aparece com o campo nomeado e o motivo escrito — barrar sem explicar é
          um não sem endereço.
        </p>
        <div className="moderacao-ficha-atalhos">
          <Link className="studio-botao" href="/moderacao/fila/">
            ← voltar à fila
          </Link>
          <span className="moderacao-selo-origem" data-origem={item.origem}>
            {ROTULO_ORIGEM[item.origem]}
          </span>
          <span className="studio-pastilha">{item.classe}</span>
          <span className="studio-pastilha">procedência {item.procedencia}</span>
          {item.rota ? (
            <Link className="studio-botao" href={item.rota}>
              ver como o público vê
            </Link>
          ) : (
            <span className="studio-rotulo" data-nao-sustenta>
              esta classe ainda não tem rota pública nesta fase
            </span>
          )}
        </div>
      </header>

      <div className="moderacao-colunas">
        {/* ================================================================ */}
        {/* A FICHA — campo a campo, na ordem da ontologia                    */}
        {/* ================================================================ */}
        <section className="web-painel moderacao-coluna-ficha">
          <h2 className="web-painel-titulo">a ficha, na ordem da ontologia</h2>

          <div className="studio-tabela" data-ficha-campos>
            <LinhaDaFicha rotulo="id no acervo">
              <code className="studio-literal">{item.entidadeId}</code>
            </LinhaDaFicha>
            <LinhaDaFicha rotulo="classe">{item.classe}</LinhaDaFicha>
            <LinhaDaFicha rotulo="origem declarada">{origemDoItem?.regra}</LinhaDaFicha>
            <LinhaDaFicha
              rotulo="resumo"
              ausente={
                item.resumo
                  ? undefined
                  : "o acervo não publica resumo para este item — o campo fica declarado vazio, e não some da ficha"
              }
            >
              {item.resumo}
            </LinhaDaFicha>
            <LinhaDaFicha
              rotulo="linguagens"
              ausente={
                item.linguagens.length
                  ? undefined
                  : "não classificado no vocabulário controlado"
              }
            >
              {item.linguagens.join(" · ")}
            </LinhaDaFicha>
            <LinhaDaFicha
              rotulo="termos"
              ausente={item.termos.length ? undefined : "nenhum termo vinculado no acervo"}
            >
              {item.termos.join(" · ")}
            </LinhaDaFicha>
            <LinhaDaFicha
              rotulo="território"
              ausente={item.territorio ? undefined : "o acervo não situa este item"}
            >
              {item.territorio}
              {item.uf ? (
                <span className="moderacao-registros-uf">
                  {" "}
                  · {item.uf}, {comSeparador(item.registrosNaUf ?? 0)} registros no acervo
                </span>
              ) : null}
            </LinhaDaFicha>
            <LinhaDaFicha
              rotulo="fonte"
              ausente={item.fonte ? undefined : "o acervo não declara URL de origem"}
            >
              <code className="studio-literal">{item.fonte}</code>
            </LinhaDaFicha>
            <LinhaDaFicha
              rotulo="imagem"
              ausente={item.imagem ? undefined : "sem imagem declarada"}
            >
              <code className="studio-literal">{item.imagem}</code>
            </LinhaDaFicha>
            <LinhaDaFicha
              rotulo="crédito da imagem"
              ausente={
                item.creditoImagem
                  ? undefined
                  : item.imagem
                    ? "DECLARA IMAGEM E NÃO DECLARA CRÉDITO — ver a barreira ao lado"
                    : "sem imagem, e portanto sem crédito a declarar"
              }
            >
              {item.creditoImagem}
            </LinhaDaFicha>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* A CADEIA DE IDENTIDADE — §6, componente a componente            */}
          {/* -------------------------------------------------------------- */}
          <div className="moderacao-chave" data-chave-identidade={item.chave}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A chave de identidade</span>
              <span className="studio-pastilha studio-pastilha-marca">
                <span className="studio-pastilha-numero">{sustentados}</span>
                de {componentesDaChave.length} componentes
              </span>
            </div>
            <ul className="moderacao-componentes">
              {componentesDaChave.map((c, i) => {
                const sustentado = item.chave[i] === "1";
                return (
                  <li
                    key={c.id}
                    className="moderacao-componente"
                    data-chave-componente={c.id}
                    data-atende={sustentado ? "sim" : "nao"}
                  >
                    <span className="moderacao-componente-marca" aria-hidden>
                      {sustentado ? "●" : "○"}
                    </span>
                    <span className="moderacao-componente-texto">
                      <strong>{c.rotulo}</strong>
                      <span className="studio-nota">{c.observa}</span>
                      {/* Quando falta, a ficha diz DE QUEM é a responsabilidade. Uma
                          ausência sem dono é uma ausência que ninguém preenche. */}
                      {sustentado ? null : (
                        <span className="studio-nota" data-nao-sustenta>
                          falta — {c.dequem}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="studio-nota">{regraDaChave}</p>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* 120 — quando o item é denúncia                                   */}
          {/* -------------------------------------------------------------- */}
          {item.denuncia ? (
            <div className="moderacao-denuncia" data-denuncia={item.denuncia.motivo}>
              <span className="studio-nao-sustenta-rotulo">
                denúncia do público · {item.denuncia.rotulo}
              </span>
              <p className="studio-nota">
                <strong>
                  {comSeparador(item.denuncia.quantas)}{" "}
                  {item.denuncia.quantas === 1 ? "pessoa denunciou" : "pessoas denunciaram"}
                </strong>{" "}
                este item pelo mesmo motivo. Ele já está publicado — o que se decide aqui não
                é se entra, é se a afirmação de quem denunciou procede.
              </p>
              {(() => {
                const m = motivosDeDenuncia.find((x) => x.id === item.denuncia?.motivo);
                return m ? (
                  <p className="studio-nota">
                    Confere-se {m.confere}. Se procede, vai para {m.encaminha}.
                  </p>
                ) : null;
              })()}
            </div>
          ) : null}

          {/* -------------------------------------------------------------- */}
          {/* 114, 115, 118, 119 — o que se confere, e o que NÃO se decide     */}
          {/* -------------------------------------------------------------- */}
          <div className="moderacao-conferencias">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">O que esta ficha confere</span>
            </div>
            {conferencias.map((c) => (
              <div key={c.id} className="moderacao-conferencia" data-conferencia={c.id}>
                <span className="studio-rotulo">
                  {c.rotulo}
                  {c.bloqueiaPublicacao ? " · impede a publicação" : null}
                </span>
                <p className="studio-nota">{c.oQue}</p>
                {/* O LIMITE é tão conteúdo quanto a conferência: uma tela que só diz o que
                    faz deixa quem opera supondo que ela faz o resto também. */}
                <p className="studio-nota" data-nao-sustenta>
                  {c.limite}
                </p>
                {c.id === "termo" ? (
                  <div className="studio-acoes">
                    <button
                      type="button"
                      className="studio-botao"
                      data-encaminhar-termo
                      disabled={item.termos.length === 0 || encaminhados.includes(item.id)}
                      onClick={() =>
                        setEncaminhados((antes) =>
                          antes.includes(item.id) ? antes : [...antes, item.id],
                        )
                      }
                    >
                      {encaminhados.includes(item.id)
                        ? "encaminhado ao Editor"
                        : "encaminhar ao Editor"}
                    </button>
                    {item.termos.length === 0 ? (
                      <span className="studio-rotulo" data-nao-sustenta>
                        este item não tem termo vinculado — não há o que encaminhar
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/* A DECISÃO — a barreira, as quatro ações, e o registro             */}
        {/* ================================================================ */}
        <div className="moderacao-coluna-decisao">
          {bloqueios.length ? (
            <section className="web-painel moderacao-bloqueio" data-bloqueio-publicacao>
              <div className="studio-painel-cabeca">
                <span className="studio-painel-nome">Este item não pode ser publicado</span>
              </div>
              {bloqueios.map((b) => (
                <p key={b.id} className="studio-nota" data-bloqueio={b.id}>
                  {b.texto}
                </p>
              ))}
              <p className="studio-nota">{fraseDoBloqueio}</p>
              <p className="studio-nota">
                As outras três ações continuam disponíveis: vetar, devolver a quem submeteu
                para que o crédito seja preenchido, ou editar. <strong>Só aprovar</strong> é
                que está barrado — uma tela que trava tudo obriga quem modera a abandonar o
                item, e item abandonado fica na fila para sempre.
              </p>
            </section>
          ) : null}

          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A decisão</span>
              {decisaoDoItem ? (
                <span className="studio-pastilha studio-pastilha-marca">
                  já decidido · {ROTULO_DA_ACAO[decisaoDoItem.acao]}
                </span>
              ) : null}
            </div>

            {decisaoDoItem ? (
              <div
                className="moderacao-decisao"
                data-decisao-moderacao={decisaoDoItem.itemId}
                data-acao-registrada={decisaoDoItem.acao}
              >
                <span className="moderacao-decisao-cabeca">
                  <strong>{ROTULO_DA_ACAO[decisaoDoItem.acao]}</strong>
                  <span className="studio-pastilha">situação: {decisaoDoItem.situacao}</span>
                </span>
                {decisaoDoItem.motivo ? (
                  <span className="moderacao-decisao-motivo">
                    <span className="studio-rotulo">
                      {decisaoDoItem.acao === "vetar" ? "motivo do veto" : "comentário"}
                    </span>
                    {decisaoDoItem.motivo}
                  </span>
                ) : null}
                <span className="moderacao-decisao-assinatura">
                  {decisaoDoItem.autor} · {decisaoDoItem.quando}
                </span>
                <button
                  type="button"
                  className="studio-botao moderacao-desfazer"
                  onClick={() =>
                    setDecisoes((antes) => antes.filter((d) => d.itemId !== item.id))
                  }
                >
                  desfazer
                </button>
              </div>
            ) : (
              <>
                <div className="studio-acoes moderacao-acoes">
                  {acoes.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      data-acao-moderacao={a.id}
                      className={
                        a.id === "aprovar"
                          ? "studio-botao studio-botao-primario"
                          : "studio-botao"
                      }
                      // Só APROVAR trava com a barreira. Vetar, devolver e editar seguem
                      // disponíveis — ver a nota no painel de bloqueio.
                      disabled={a.id === "aprovar" && bloqueios.length > 0}
                      data-acao-barrada={
                        a.id === "aprovar" && bloqueios.length > 0 ? "sim" : "nao"
                      }
                      onClick={() => executar(a.id)}
                    >
                      {a.rotulo}
                      {a.motivo === "obrigatorio" ? " · exige motivo" : null}
                    </button>
                  ))}
                </div>

                {/* ==== O VETO — não conclui com o campo vazio (109) ==== */}
                {vetando ? (
                  <form
                    className="moderacao-veto"
                    onSubmit={(e) => {
                      e.preventDefault();
                      registrarVeto();
                    }}
                  >
                    <span className="studio-nao-sustenta-rotulo">
                      vetar «{item.titulo}» — motivo obrigatório
                    </span>
                    <label htmlFor="motivo-veto-ficha" className="studio-rotulo">
                      por que este item não entra
                    </label>
                    <textarea
                      id="motivo-veto-ficha"
                      data-motivo-veto
                      className="moderacao-textarea"
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
                      {motivoAparado ? null : (
                        <span className="moderacao-aviso-veto">
                          O botão está desabilitado porque o motivo está vazio. Espaço em
                          branco não conta.
                        </span>
                      )}
                    </div>
                  </form>
                ) : null}

                <p className="studio-nota">{fraseDaAssimetria}</p>

                {/* ---- 110: devolver ao produtor, com pedido nomeado ---- */}
                <div className="moderacao-campo">
                  <label htmlFor="comentario-devolucao-ficha" className="studio-rotulo">
                    o que precisa ser corrigido — opcional
                  </label>
                  <textarea
                    id="comentario-devolucao-ficha"
                    data-comentario-devolucao
                    className="moderacao-textarea"
                    rows={2}
                    value={comentarioDevolucao}
                    placeholder="Opcional. «Devolver» conclui com ou sem este texto."
                    onChange={(e) => setComentarioDevolucao(e.target.value)}
                  />
                  <p className="studio-nota">{acaoDeDevolver?.nota}</p>
                  {/* O comentário é opcional e ÚTIL: sem ele o produtor recebe o registro
                      de volta sabendo que algo está errado e não o quê. Quando a ficha já
                      sabe o que falta, ela sugere — em vez de deixar o campo em branco. */}
                  {bloqueios.length ? (
                    <p className="studio-nota">
                      Sugestão do que escrever: este item está barrado por crédito de imagem
                      ausente, e é isso que quem receber a devolução precisa corrigir.
                    </p>
                  ) : null}
                </div>
              </>
            )}

            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">autor e carimbo</span>
              <p>
                Toda decisão é gravada com <strong>{moderador}</strong> e o carimbo{" "}
                <strong>{carimbo}</strong>, derivado da data de referência do build e nunca
                do relógio de quem abre a página. O registro vai para o mesmo armazém que a
                fila lê, sob a chave{" "}
                <code className="studio-literal">{CHAVE_DO_ARMAZEM}</code>.
              </p>
              {falhaDoArmazem ? <p data-falha-armazem>{falhaDoArmazem}</p> : null}
            </div>
          </section>

          {/* ---- Trocar de item SEM sair da rota ---- */}
          <section className="web-painel moderacao-outros-itens">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Outros itens da fila</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">
                  {comSeparador(fila.length - decisoes.length)}
                </span>
                pendentes
              </span>
            </div>
            <ul className="web-lista-densa moderacao-lista">
              {fila
                .filter((i) => i.id !== item.id && !decisoes.some((d) => d.itemId === i.id))
                .slice(0, 8)
                .map((i) => (
                  <li key={i.id} className="web-linha moderacao-linha" data-outro-item={i.id}>
                    <button
                      type="button"
                      className="moderacao-atalho-item"
                      onClick={() => {
                        setEscolhidoId(i.id);
                        setVetando(false);
                        setMotivoVeto("");
                        setComentarioDevolucao("");
                      }}
                    >
                      <span className="moderacao-selo-origem" data-origem={i.origem}>
                        {ROTULO_ORIGEM[i.origem]}
                      </span>
                      <span className="web-linha-titulo">{i.titulo}</span>
                    </button>
                  </li>
                ))}
            </ul>
            {/* A LISTA É UM ATALHO, E DIZ QUE É. Ela mostra oito e o cabeçalho conta
                sessenta e oito: sem esta frase, «68 pendentes» sobre uma lista de oito
                lê-se como uma fila que encolheu sozinha. Lista truncada em silêncio é a
                mesma falta que a tela inteira existe para não cometer. */}
            <p className="studio-nota" data-lista-truncada={pendentesFora}>
              Estes são os {comSeparador(Math.min(8, fila.length - decisoes.length - 1))}{" "}
              primeiros da ordem; há <strong>{comSeparador(pendentesFora)}</strong> outros
              pendentes que esta lista não mostra. Ela é um atalho para conferir dois ou três
              seguidos — quem precisa da fila inteira, com escopo e ordem,{" "}
              <Link href="/moderacao/fila/">volta à fila</Link>.
            </p>
            <p className="studio-nota">
              Trocar de item aqui <strong>não troca a URL</strong> — é a mesma superfície
              servindo outra ficha. O endereço com{" "}
              <code className="studio-literal">?item=</code> continua abrindo direto num
              item, para quem chega de fora.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
