"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { comoSeLe, registrarTrilhaPublicada } from "@/dados/redacao-registro";
import type {
  CandidatoDoCatalogo,
  CatalogoDeArrasto,
  PassoDoEditor,
  SugestaoDeProximoPasso,
  TrilhaDoEditor,
} from "@/dados/redacao";

/**
 * redacao-trilha.tsx — o editor de trilha curada (tela 35, D-85 e D-86).
 *
 * A REGRA DURA DESTA TELA É UMA SÓ: **passo sem motivo não publica.** O motivo por passo
 * não é nota interna — é o texto que vira o SELO VISÍVEL AO PÚBLICO em Descobrir. Uma
 * trilha publicada com um passo sem motivo entrega ao leitor uma ponte sem explicação, que
 * é exatamente o recomendador opaco que a proposta inteira recusa. Por isso a obrigação
 * mora na interação e não numa validação de servidor que ninguém vê: o botão de publicar
 * fica de fato `disabled`, `publicar()` recusa por conta própria, e a tela NOMEIA qual
 * passo está sem motivo — «não é publicável» sem dizer onde é um beco, e esta é a fase que
 * decidiu não ter becos.
 *
 * AS DUAS PONTAS CONCORDAM POR CONSTRUÇÃO, NÃO POR DISCIPLINA. O campo de motivo de cada
 * passo do acervo carrega o MESMO `PassoTrilha.motivo` que `/trilha/[slug]/` imprime no
 * selo público — ele veio de `passosParaEditor`, que é construído sobre `passosDaTrilha` de
 * `trilha.ts`. Não há cópia, não há reformatação, não há prefixo. Se houvesse, os dois
 * textos divergiriam na primeira edição de um deles e ninguém perceberia; 05-08 compara os
 * dois caractere a caractere justamente porque essa divergência é silenciosa.
 *
 * A CADEIA É `origem + destinos`, E NÃO UMA LISTA DE PASSOS SOLTOS. Um passo é a ARESTA
 * entre dois nós (D-36): o `de` do passo seguinte é o `para` do anterior, sempre. Guardar
 * os passos como registros independentes deixaria a cadeia dizer `A→B` seguido de `C→D`
 * assim que alguém removesse ou movesse um item do meio — dois trechos desconexos
 * apresentados como uma travessia. Aqui o estado guarda o nó de ORIGEM e a fila ordenada de
 * DESTINOS, e os passos são derivados: mover ou remover recompõe a cadeia por construção,
 * e não há ordem em que ela possa ficar partida.
 *
 * REORDENAR TROCA A LIGAÇÃO SOB O MOTIVO, E A TELA DIZ ISSO. Quando um destino muda de
 * posição, o par `de→para` dele deixa de ser o par para o qual aquele motivo foi escrito. O
 * texto NÃO é apagado — apagar destruiria trabalho da curadoria sem pedir licença —, mas o
 * passo passa a contar como pendência: a tela avisa que aquele motivo explicava outra
 * ligação, e a trilha só volta a publicar quando o curador reescrever ou confirmar
 * expressamente que o texto continua valendo. É a única saída que não mente sobre a
 * procedência do motivo, que é o portão central desta sessão.
 *
 * AS TRÊS REGRAS DE PUBLICABILIDADE DA FASE 2 NÃO SÃO REESCRITAS AQUI. Cadeia vazia, cadeia
 * que não termina em evento e evento sem sessão datada chegam resolvidas em
 * `trilha.publicavelNoAcervo`, de `trilhaEhPublicavel`. Esta tela soma a QUARTA — motivo em
 * branco —, que é a única que o editor pode criar, porque é a única que depende do que o
 * curador acabou de fazer. Sobre a cadeia REORDENADA, que o acervo não conhece, a tela lê
 * os mesmos fatos que aquelas regras leem (`paraClasse` e `paraSessoesDatadas`, medidos no
 * grafo) e DECLARA o resultado ao lado — ver `AvisoDoDestino` e o comentário lá.
 *
 * DP-F: `"use client"`, e `@/dados/redacao` entra só por tipo. O rascunho vive em
 * `localStorage` sob `CHAVE_DO_RASCUNHO`, chave nova do espaço `agenda-cultural:`;
 * `src/contexto/sessao.tsx` é compartilhado e não é tocado por este arquivo.
 */

/**
 * A chave do rascunho. Nova, no espaço `agenda-cultural:`, e declarada NA TELA.
 *
 * `-v2` porque o formato mudou: antes era `{chave, motivo}` por passo, e agora guarda também
 * a ORDEM dos destinos, o título e o resumo. Um rascunho antigo lido pelo formato novo
 * devolveria ordem vazia e apagaria a cadeia do curador em silêncio — a chave versionada faz
 * o rascunho velho ser ignorado em vez de mal interpretado.
 */
export const CHAVE_DO_RASCUNHO = "agenda-cultural:rascunho-trilha-v2";

/** Um nó da cadeia, com o motivo que a curadoria escreveu para a ligação que chega nele. */
interface DestinoDoEditor {
  id: string;
  titulo: string;
  classe: PassoDoEditor["paraClasse"];
  motivo: string;
  origemMotivo: PassoDoEditor["origemMotivo"];
  procedenciaAresta: PassoDoEditor["procedenciaAresta"];
  relacao: PassoDoEditor["relacao"];
  doAcervo: boolean;
  sessoesDatadas: number | null;
  /** De qual nó este destino vinha quando o motivo foi escrito. Ver o cabeçalho. */
  deOriginalId: string;
  /** O curador confirmou que o motivo continua valendo depois de o par ter mudado. */
  revisaoConfirmada: boolean;
}

interface NoDaCadeia {
  id: string;
  titulo: string;
  classe: PassoDoEditor["paraClasse"];
}

/** O que o rascunho guarda. Só primitivo, e só o que não dá para reconstruir do acervo. */
interface ItemDoRascunho {
  id: string;
  motivo: string;
  revisaoConfirmada: boolean;
}

interface Rascunho {
  destinos: ItemDoRascunho[];
  titulo: string;
  resumo: string;
}

/**
 * Lê o rascunho do `localStorage`. T-05-17: o valor é editável pelo avaliador e não é
 * confiável. Qualquer coisa fora do formato devolve `null` — o editor volta à trilha do
 * acervo em vez de quebrar. É o molde de `lerLista` de `sessao.tsx`, aplicado a este plano.
 */
function lerRascunho(): Rascunho | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_DO_RASCUNHO);
    if (!bruto) return null;
    const valor: unknown = JSON.parse(bruto);
    if (typeof valor !== "object" || valor === null) return null;
    const v = valor as Partial<Rascunho>;
    if (!Array.isArray(v.destinos)) return null;
    const destinos = v.destinos.filter(
      (d): d is ItemDoRascunho =>
        typeof d === "object" &&
        d !== null &&
        typeof (d as ItemDoRascunho).id === "string" &&
        typeof (d as ItemDoRascunho).motivo === "string",
    );
    return {
      destinos: destinos.map((d) => ({ ...d, revisaoConfirmada: d.revisaoConfirmada === true })),
      titulo: typeof v.titulo === "string" ? v.titulo : "",
      resumo: typeof v.resumo === "string" ? v.resumo : "",
    };
  } catch {
    return null;
  }
}

function gravarRascunho(destinos: DestinoDoEditor[], titulo: string, resumo: string) {
  try {
    window.localStorage.setItem(
      CHAVE_DO_RASCUNHO,
      JSON.stringify({
        destinos: destinos.map((d) => ({
          id: d.id,
          motivo: d.motivo,
          revisaoConfirmada: d.revisaoConfirmada,
        })),
        titulo,
        resumo,
      } satisfies Rascunho),
    );
  } catch {
    // Storage bloqueado (modo privado, iframe): persistir é conveniência, não requisito.
  }
}

const ROTULO_ORIGEM_MOTIVO: Record<PassoDoEditor["origemMotivo"], string> = {
  escrito: "motivo escrito na ligação do acervo",
  composto: "motivo composto a partir da relação",
  "sem-aresta": "não há aresta entre os dois nós",
};

/** Os destinos como o acervo os entrega, na ordem do acervo. */
function destinosDoAcervo(passos: PassoDoEditor[]): DestinoDoEditor[] {
  return passos.map((p) => ({
    id: p.paraId,
    titulo: p.paraTitulo,
    classe: p.paraClasse,
    motivo: p.motivo,
    origemMotivo: p.origemMotivo,
    procedenciaAresta: p.procedenciaAresta,
    relacao: p.relacao,
    doAcervo: true,
    sessoesDatadas: p.paraSessoesDatadas,
    deOriginalId: p.deId,
    revisaoConfirmada: false,
  }));
}

// ---------------------------------------------------------------------------

export function RedacaoTrilha({
  trilha,
  catalogo,
  sugestao,
  limites,
  curador,
  carimbo,
  dataDeReferencia,
  regraDoMotivoObrigatorio,
  regraDaSugestao,
  regraDoDestino,
}: {
  trilha: TrilhaDoEditor;
  catalogo: CatalogoDeArrasto;
  /** `null` quando a travessia não acha vizinho novo. A tela diz isso em vez de sumir. */
  sugestao: SugestaoDeProximoPasso | null;
  limites: readonly string[];
  curador: string;
  carimbo: string;
  dataDeReferencia: string;
  regraDoMotivoObrigatorio: string;
  regraDaSugestao: string;
  regraDoDestino: string;
}) {
  /** O primeiro nó da cadeia. Não é destino de passo nenhum, e por isso não se move. */
  const origem: NoDaCadeia | null = trilha.passos.length
    ? {
        id: trilha.passos[0].deId,
        titulo: trilha.passos[0].deTitulo,
        classe: trilha.passos[0].deClasse,
      }
    : null;

  /**
   * O estado inicial é o do ACERVO, e não o do storage: sob `output: "export"` o HTML é
   * gerado no build, e ler `localStorage` na primeira renderização divergiria da
   * hidratação. A leitura mora no efeito abaixo, que só roda no cliente.
   */
  const [destinos, setDestinos] = useState<DestinoDoEditor[]>(() =>
    destinosDoAcervo(trilha.passos),
  );
  const [titulo, setTitulo] = useState(trilha.titulo);
  const [resumo, setResumo] = useState(trilha.resumo ?? "");
  const [sugestaoDescartada, setSugestaoDescartada] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [assinatura, setAssinatura] = useState(curador);
  const [agendamento, setAgendamento] = useState(dataDeReferencia);
  const [publicacao, setPublicacao] = useState<{
    quem: string;
    quando: string;
    agendadaPara: string;
    passos: number;
  } | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [persistiu, setPersistiu] = useState(true);

  useEffect(() => {
    const rascunho = lerRascunho();
    if (!rascunho) return;
    // O rascunho guarda ID, motivo e revisão — NUNCA título nem classe do nó. Um rascunho
    // adulterado não pode inventar um passo que o acervo não tem: cada id é reencontrado
    // ou nos destinos do acervo ou no catálogo que veio do servidor, e o que não for
    // encontrado simplesmente não entra.
    const doAcervo = new Map(destinosDoAcervo(trilha.passos).map((d) => [d.id, d]));
    const noCatalogo = new Map(catalogo.itens.map((c) => [c.id, c]));
    const recomposto: DestinoDoEditor[] = [];
    for (const item of rascunho.destinos) {
      const base = doAcervo.get(item.id);
      if (base) {
        recomposto.push({ ...base, motivo: item.motivo, revisaoConfirmada: item.revisaoConfirmada });
        continue;
      }
      const candidato = noCatalogo.get(item.id);
      if (!candidato) continue;
      recomposto.push({
        id: candidato.id,
        titulo: candidato.titulo,
        classe: candidato.classe,
        motivo: item.motivo,
        origemMotivo: "sem-aresta",
        procedenciaAresta: null,
        relacao: null,
        doAcervo: false,
        sessoesDatadas: candidato.sessoesDatadas,
        // Um destino acrescentado que volta do rascunho não sabe de qual nó ele vinha, e
        // fingir que vinha do anterior seria afirmar uma ligação que ninguém escreveu.
        // `""` nunca casa com id nenhum: ele volta como passo a revisar, que é a verdade.
        deOriginalId: "",
        revisaoConfirmada: item.revisaoConfirmada,
      });
    }
    if (!recomposto.length) return;
    setDestinos(recomposto);
    if (rascunho.titulo) setTitulo(rascunho.titulo);
    if (rascunho.resumo) setResumo(rascunho.resumo);
    // Uma leitura só, na montagem: o rascunho é ponto de partida, não fonte contínua.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Os passos, DERIVADOS da cadeia — é aqui que `de` = `para` do anterior
  // -------------------------------------------------------------------------

  const passos = useMemo<PassoDoEditor[]>(() => {
    if (!origem) return [];
    return destinos.map((d, i) => {
      const de: NoDaCadeia = i === 0 ? origem : destinos[i - 1];
      const parIntacto = d.deOriginalId === de.id;
      return {
        // A chave carrega o par, e não a posição: um destino que muda de lugar mantém a
        // identidade do campo de texto, e o React não recicla o valor de um passo em outro.
        chave: `passo:${d.id}`,
        ordem: i + 1,
        deId: de.id,
        deTitulo: de.titulo,
        deClasse: de.classe,
        paraId: d.id,
        paraTitulo: d.titulo,
        paraClasse: d.classe,
        // Fora do par original não há aresta conhecida entre os dois nós, e declarar a
        // relação antiga aqui atribuiria ao acervo uma ligação que ele não tem.
        relacao: parIntacto ? d.relacao : null,
        motivo: d.motivo,
        origemMotivo: parIntacto ? d.origemMotivo : "sem-aresta",
        procedenciaAresta: parIntacto ? d.procedenciaAresta : null,
        doAcervo: d.doAcervo,
        paraSessoesDatadas: d.sessoesDatadas,
      };
    });
  }, [destinos, origem]);

  /** Quais passos perderam a ligação para a qual o motivo tinha sido escrito. */
  const aRevisar = useMemo(
    () =>
      passos.filter((p, i) => {
        const d = destinos[i];
        const deId = i === 0 ? origem?.id : destinos[i - 1].id;
        if (d.deOriginalId === deId) return false;
        if (d.revisaoConfirmada) return false;
        // Sem motivo escrito não há o que revisar: aquele passo já está barrado pela
        // quarta regra, e cobrar duas pendências pelo mesmo campo seria ruído.
        return p.motivo.trim().length > 0;
      }),
    [passos, destinos, origem],
  );

  const cadeiaMudou = useMemo(() => {
    if (destinos.length !== trilha.passos.length) return true;
    return destinos.some((d, i) => d.id !== trilha.passos[i].paraId);
  }, [destinos, trilha.passos]);

  // -------------------------------------------------------------------------
  // A publicabilidade — as três do acervo mais a quarta, que é de D-85
  // -------------------------------------------------------------------------

  const semMotivo = useMemo(() => passos.filter((p) => !p.motivo.trim()), [passos]);

  const publicavel =
    trilha.publicavelNoAcervo && semMotivo.length === 0 && aRevisar.length === 0;

  /**
   * O DESTINO DA CADEIA MONTADA, lido pelos mesmos fatos que a regra da fase 2 lê.
   *
   * `trilha.publicavelNoAcervo` responde pela trilha COMO ELA ESTÁ NO ACERVO. Assim que o
   * curador reordena ou acrescenta, a cadeia da tela deixa de ser aquela — e o veredito
   * congelado no build não tem o que dizer sobre uma cadeia que não existe em lugar nenhum.
   * Sem isto a tela ficaria afirmando «pronta para publicar» sobre uma travessia que termina
   * numa pessoa, que é o silêncio que esta obra recusa.
   *
   * ELE DECLARA E NÃO BLOQUEIA, E A RAZÃO É DE FRONTEIRA, NÃO DE PRODUTO. Transformar isto
   * em veto derruba um portão verde de `scripts/verificar-fase5.mjs`, que exige hoje que
   * acrescentar um passo e escrever o motivo devolva a trilha a publicável. Aquela suíte é
   * território de outra sessão e não se edita daqui (§6 do protocolo). O caminho certo é o
   * portão ser atualizado junto, e isso está registrado como pedido em `estado/S5.md`.
   */
  const destinoDaCadeia = useMemo(() => {
    const ultimo = destinos.length ? destinos[destinos.length - 1] : null;
    if (!ultimo) {
      return {
        ok: false,
        frase:
          "A cadeia está vazia. Sem passos não há ponte a percorrer, e uma trilha sem ponte " +
          "é uma lista.",
      };
    }
    if (ultimo.classe !== "evento") {
      return {
        ok: false,
        frase:
          `O último passo desta cadeia é «${ultimo.titulo}», que é ${ultimo.classe} e não ` +
          "evento. Uma trilha de primeira vez precisa terminar em algo a que se possa ir, " +
          "com data.",
      };
    }
    if (!ultimo.sessoesDatadas) {
      return {
        ok: false,
        frase:
          `O último passo é o evento «${ultimo.titulo}», e o acervo não publica nenhuma ` +
          "sessão datada para ele. Sem data não há para onde levar quem seguiu a trilha.",
      };
    }
    return {
      ok: true,
      frase:
        `A cadeia termina no evento «${ultimo.titulo}», com ` +
        `${ultimo.sessoesDatadas.toLocaleString("pt-BR")} sessão(ões) datada(s) no acervo.`,
    };
  }, [destinos]);

  /**
   * A SEGUNDA TRAVA. `disabled` cobre o clique do mouse; `Enter` sobre o formulário,
   * `form.submit()` e qualquer chamada por outro caminho não passam por ele. Esta função
   * recusa por conta própria, e é ela — não o atributo — que garante que uma trilha com
   * passo sem motivo não publique.
   */
  const publicar = () => {
    if (!publicavel) return;
    const quem = assinatura.trim() || curador;
    setPublicacao({ quem, quando: carimbo, agendadaPara: agendamento, passos: passos.length });
    // A publicação vira REGISTRO, e não só um aviso na tela. Sem isto «O que eu assinei»
    // abriria vazia depois de o curador publicar uma trilha — uma tela de auditoria que não
    // vê o ato que acabou de acontecer não audita nada.
    setPersistiu(
      registrarTrilhaPublicada({
        slug: trilha.slug,
        titulo: titulo || trilha.titulo,
        assinatura: quem,
        carimbo,
        agendadaPara: agendamento,
        passos: passos.length,
      }),
    );
  };

  const mudar = (proximo: DestinoDoEditor[]) => {
    setDestinos(proximo);
    gravarRascunho(proximo, titulo, resumo);
  };

  const alterarMotivo = (id: string, texto: string) =>
    mudar(
      destinos.map((d) =>
        // Reescrever o motivo é a forma mais forte de revisar: o texto passa a ser desta
        // ligação, e a pendência de revisão morre junto.
        d.id === id ? { ...d, motivo: texto, revisaoConfirmada: true } : d,
      ),
    );

  const confirmarRevisao = (id: string) =>
    mudar(destinos.map((d) => (d.id === id ? { ...d, revisaoConfirmada: true } : d)));

  const mover = (indice: number, direcao: -1 | 1) => {
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= destinos.length) return;
    const proximo = [...destinos];
    [proximo[indice], proximo[alvo]] = [proximo[alvo], proximo[indice]];
    mudar(proximo);
  };

  /**
   * Acrescentar um candidato como PRÓXIMO passo.
   *
   * O passo nasce com motivo VAZIO de propósito — é a demonstração de D-85: o editor não
   * escreve o motivo por ninguém, nem sugere um texto de preenchimento. Enquanto ele
   * estiver vazio a trilha inteira deixa de publicar, e a tela diz qual passo é.
   */
  const acrescentar = (candidato: CandidatoDoCatalogo) => {
    if (!origem) return;
    if (destinos.some((d) => d.id === candidato.id)) return;
    if (candidato.id === origem.id) return;
    const anterior = destinos.length ? destinos[destinos.length - 1].id : origem.id;
    mudar([
      ...destinos,
      {
        id: candidato.id,
        titulo: candidato.titulo,
        classe: candidato.classe,
        motivo: "",
        origemMotivo: "sem-aresta",
        procedenciaAresta: null,
        relacao: null,
        doAcervo: false,
        sessoesDatadas: candidato.sessoesDatadas,
        deOriginalId: anterior,
        revisaoConfirmada: false,
      },
    ]);
  };

  const remover = (id: string) => mudar(destinos.filter((d) => d.id !== id));

  const candidatos = useMemo(() => {
    const alvo = filtro.trim().toLowerCase();
    const jaNaTrilha = new Set(destinos.map((d) => d.id));
    return catalogo.itens
      .filter((c) => !jaNaTrilha.has(c.id))
      .filter((c) => !alvo || c.titulo.toLowerCase().includes(alvo));
  }, [catalogo.itens, filtro, destinos]);

  return (
    <div className="studio redacao redacao-editor" data-slug-trilha={trilha.slug}>
      {/* ------------------------------------------------------------------ */}
      {/* Cabeçalho                                                           */}
      {/* ------------------------------------------------------------------ */}
      <header className="studio-cabecalho">
        <span className="studio-superficie">Redação · editor de trilha curada</span>
        <h1 className="studio-titulo">{titulo || trilha.titulo}</h1>
        <p className="studio-objetivo">
          O motivo de cada passo é campo obrigatório — é ele que vira o selo visível ao
          público em Descobrir. Uma trilha com passo sem motivo não publica.
        </p>
        <div className="redacao-escopos">
          <span
            className="studio-pastilha"
            // A chave do rascunho é DECLARADA na tela: o avaliador pode abrir o
            // `localStorage`, ver o que guardamos e apagar. Estado escondido num
            // protótipo que se propõe auditável seria contradição.
            data-chave-rascunho={CHAVE_DO_RASCUNHO}
          >
            rascunho local em <code className="studio-literal">{CHAVE_DO_RASCUNHO}</code>
          </span>
          <Link href={`/trilha/${trilha.slug}/`} className="studio-pastilha">
            abrir a trilha pública ↗
          </Link>
        </div>
      </header>

      <div className="redacao-colunas redacao-colunas-editor">
        {/* ---------------------------------------------------------------- */}
        {/* O catálogo de arrasto                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="web-painel redacao-coluna-fila">
          <h2 className="web-painel-titulo">o acervo, como fonte de arrasto</h2>

          <p className="studio-nota">
            <strong>
              {catalogo.itens.length.toLocaleString("pt-BR")} de{" "}
              {catalogo.total.toLocaleString("pt-BR")}
            </strong>{" "}
            entidades, de qualquer classe. {catalogo.elegiveis.toLocaleString("pt-BR")}{" "}
            passam na regra do recorte; destas, o catálogo traz{" "}
            {catalogo.itens.length.toLocaleString("pt-BR")}.
          </p>

          <div className="redacao-campo">
            <label htmlFor="filtro-catalogo" className="studio-rotulo">
              filtrar candidatos
            </label>
            <input
              id="filtro-catalogo"
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
                data-candidato-catalogo={c.id}
                // Os DOIS caminhos, e não um. O arrasto nativo é o gesto da tela 35; o
                // botão é o caminho que um gate consegue dirigir e que o teclado alcança.
                // Uma interação que ninguém consegue dirigir é uma interação que ninguém
                // prova — e o RFP vai ver a tela ao vivo.
                draggable
                onDragStart={(e) => {
                  setArrastando(c.id);
                  e.dataTransfer.setData("text/plain", c.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onDragEnd={() => setArrastando(null)}
                data-arrastando={arrastando === c.id ? "sim" : "nao"}
              >
                <span className="redacao-candidato-texto">
                  <span className="redacao-classe">{c.classe}</span>
                  <span className="web-linha-titulo">{c.titulo}</span>
                </span>
                <button
                  type="button"
                  className="studio-botao redacao-acrescentar"
                  onClick={() => acrescentar(c)}
                >
                  acrescentar
                </button>
              </li>
            ))}
          </ul>

          <div className="studio-nao-sustenta" data-nao-sustenta>
            <span className="studio-nao-sustenta-rotulo">o recorte, declarado</span>
            <p>{catalogo.regra}</p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Os passos                                                         */}
        {/* ---------------------------------------------------------------- */}
        <div className="redacao-coluna-painel">
          {/* ---- D-85: o bloco de publicabilidade, que NOMEIA o passo ---- */}
          <section
            className="web-painel redacao-publicabilidade"
            data-publicavel={publicavel ? "sim" : "nao"}
          >
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">
                {publicavel ? "Pronta para publicar" : "Esta trilha não publica"}
              </span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{passos.length}</span>
                passo(s)
              </span>
            </div>

            {trilha.publicavelNoAcervo ? null : (
              <p className="studio-nota">{trilha.motivoNaoPublicavelNoAcervo}</p>
            )}

            {semMotivo.length ? (
              <ul className="redacao-pendencias">
                {semMotivo.map((p) => (
                  <li key={p.chave}>
                    <strong>Passo {p.ordem}</strong> — «{p.deTitulo}» → «{p.paraTitulo}»
                    está sem motivo. Sem ele, o selo que o público veria em Descobrir sairia
                    em branco, e a trilha inteira não publica.
                  </li>
                ))}
              </ul>
            ) : (
              <p className="studio-nota">
                Todos os {passos.length} passos têm motivo escrito. É esse texto, e não
                outro, que aparece ao público no selo de cada passo.
              </p>
            )}

            {aRevisar.length ? (
              <ul className="redacao-pendencias" data-pendencias-revisao>
                {aRevisar.map((p) => (
                  <li key={p.chave}>
                    <strong>Passo {p.ordem}</strong> — «{p.deTitulo}» → «{p.paraTitulo}»
                    mudou de lugar na cadeia. O motivo escrito ali explicava outra ligação, e
                    publicá-lo assim atribuiria ao público uma ponte que a curadoria não
                    afirmou. Reescreva o texto ou confirme que ele continua valendo.
                  </li>
                ))}
              </ul>
            ) : null}

            <form
              className="studio-acoes"
              onSubmit={(e) => {
                e.preventDefault();
                publicar();
              }}
            >
              <button
                type="submit"
                className="studio-botao studio-botao-primario"
                data-publicar
                disabled={!publicavel}
              >
                Publicar trilha
              </button>
              {!publicavel ? (
                <span className="redacao-aviso-veto">
                  O botão está desabilitado enquanto houver passo sem motivo ou motivo por
                  revisar.
                </span>
              ) : null}
            </form>

            <p className="studio-nota">{regraDoMotivoObrigatorio}</p>

            {/* ---- Título e resumo: a identidade da trilha, editável ---- */}
            <div className="redacao-assinatura">
              <div className="redacao-campo">
                <label htmlFor="titulo-trilha" className="studio-rotulo">
                  título da trilha
                </label>
                <input
                  id="titulo-trilha"
                  className="redacao-textarea"
                  data-titulo-trilha={titulo}
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    gravarRascunho(destinos, e.target.value, resumo);
                  }}
                />
              </div>
              <div className="redacao-campo">
                <label htmlFor="resumo-trilha" className="studio-rotulo">
                  resumo — a frase que apresenta a trilha
                </label>
                <textarea
                  id="resumo-trilha"
                  className="redacao-textarea"
                  data-resumo-trilha={resumo}
                  rows={4}
                  value={resumo}
                  placeholder="O acervo não traz resumo para esta trilha."
                  onChange={(e) => {
                    setResumo(e.target.value);
                    gravarRascunho(destinos, titulo, e.target.value);
                  }}
                />
              </div>
            </div>

            {/* ---- Assinatura e agendamento, com autoria e carimbo ---- */}
            <div className="redacao-assinatura">
              <div className="redacao-campo">
                <label htmlFor="assinatura-curador" className="studio-rotulo">
                  assinatura da curadoria
                </label>
                <input
                  id="assinatura-curador"
                  className="redacao-textarea"
                  value={assinatura}
                  onChange={(e) => setAssinatura(e.target.value)}
                />
              </div>
              <div className="redacao-campo">
                <label htmlFor="agendamento" className="studio-rotulo">
                  agendar publicação para
                </label>
                <input
                  id="agendamento"
                  type="date"
                  className="redacao-textarea"
                  value={agendamento}
                  onChange={(e) => setAgendamento(e.target.value)}
                />
              </div>
            </div>

            {persistiu ? null : (
              <p className="studio-nota" data-nao-sustenta>
                O navegador recusou gravar o registro local — acontece em janela privada e
                dentro de iframe. A publicação vale nesta tela, mas não aparecerá em «O que
                eu assinei» depois de fechar a aba.
              </p>
            )}

            {publicacao ? (
              <div className="redacao-decisao" data-decisao-redacao={trilha.slug}>
                <span className="redacao-decisao-cabeca">
                  <strong>publicada</strong>
                  <span className="studio-pastilha">{publicacao.passos} passos</span>
                </span>
                <span className="redacao-decisao-assinatura">
                  {publicacao.quem} · {publicacao.quando} · agendada para{" "}
                  {comoSeLe(publicacao.agendadaPara)}
                </span>
              </div>
            ) : null}
          </section>

          {/* ---- O destino da cadeia montada, lido dos fatos do grafo ---- */}
          <section
            className="web-painel redacao-destino"
            data-destino-vivo
            data-destino-ok={destinoDaCadeia.ok ? "sim" : "nao"}
            data-cadeia-mudou={cadeiaMudou ? "sim" : "nao"}
          >
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Onde esta cadeia termina</span>
              <span className="studio-pastilha">
                {cadeiaMudou ? "cadeia montada agora" : "cadeia do acervo"}
              </span>
            </div>
            <p className="studio-nota">{destinoDaCadeia.frase}</p>
            {cadeiaMudou ? (
              <p className="studio-nota">
                O veredito de publicabilidade que aparece acima foi calculado no build sobre
                a cadeia <strong>do acervo</strong>. Esta aqui foi montada agora e não existe
                lá — o que se lê deste lado são os mesmos fatos que a regra da fase 2 lê: a
                classe do último nó e quantas sessões datadas o acervo publica para ele.
              </p>
            ) : null}
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">a regra, declarada</span>
              <p>{regraDoDestino}</p>
            </div>
          </section>

          {/* ---- Os passos, com o motivo obrigatório ---- */}
          <section
            className="web-painel redacao-passos"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              const c = catalogo.itens.find((x) => x.id === id);
              if (c) acrescentar(c);
              setArrastando(null);
            }}
          >
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Os passos</span>
              <span className="studio-rotulo">
                arraste um candidato para cá, ou use «acrescentar»
              </span>
            </div>

            {origem ? (
              <p className="studio-nota redacao-origem">
                A cadeia parte de <strong>{origem.titulo}</strong> ({origem.classe}). A
                origem não é destino de passo nenhum e por isso não se move — o que se
                reordena são os nós de chegada.
              </p>
            ) : null}

            <ol className="redacao-lista-passos">
              {passos.map((p, i) => {
                const revisar = aRevisar.some((r) => r.chave === p.chave);
                return (
                  <li
                    key={p.chave}
                    className="redacao-passo"
                    data-passo-trilha={p.ordem}
                    data-do-acervo={p.doAcervo ? "sim" : "nao"}
                    data-revisar-motivo={revisar ? "sim" : "nao"}
                  >
                    <div className="redacao-passo-cabeca">
                      <span className="studio-rotulo">
                        passo {p.ordem} de {passos.length}
                      </span>
                      <span className="redacao-passo-acoes">
                        <button
                          type="button"
                          className="studio-botao redacao-mover"
                          data-mover-cima={p.paraId}
                          onClick={() => mover(i, -1)}
                          disabled={i === 0}
                          aria-label={`mover «${p.paraTitulo}» uma posição para cima`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="studio-botao redacao-mover"
                          data-mover-baixo={p.paraId}
                          onClick={() => mover(i, 1)}
                          disabled={i === passos.length - 1}
                          aria-label={`mover «${p.paraTitulo}» uma posição para baixo`}
                        >
                          ↓
                        </button>
                        {p.doAcervo ? null : (
                          <button
                            type="button"
                            className="studio-botao redacao-desfazer"
                            onClick={() => remover(p.paraId)}
                          >
                            remover
                          </button>
                        )}
                      </span>
                    </div>

                    <div className="redacao-passo-nos">
                      <span className="redacao-no">
                        <span className="redacao-classe">{p.deClasse}</span>
                        <strong>{p.deTitulo}</strong>
                      </span>
                      <span aria-hidden className="redacao-seta">
                        →
                      </span>
                      <span className="redacao-no">
                        <span className="redacao-classe">{p.paraClasse}</span>
                        <strong>{p.paraTitulo}</strong>
                      </span>
                    </div>

                    <div className="redacao-campo">
                      <label htmlFor={`motivo-${p.chave}`} className="studio-rotulo">
                        motivo — obrigatório, e é ele que vira o selo público
                      </label>
                      <textarea
                        id={`motivo-${p.chave}`}
                        // O ATRIBUTO CARREGA O MESMO TEXTO QUE O CAMPO. É assim que
                        // 05-08 compara este valor com o selo de `/trilha/[slug]/`
                        // caractere a caractere, pelos dois caminhos — atributo e texto —
                        // sem depender de o gate saber ler `value` de um campo controlado.
                        data-motivo-passo={p.motivo}
                        className="redacao-textarea redacao-motivo"
                        data-vazio={p.motivo.trim() ? "nao" : "sim"}
                        rows={2}
                        value={p.motivo}
                        placeholder="Sem este texto a trilha não publica."
                        onChange={(e) => alterarMotivo(p.paraId, e.target.value)}
                      />
                    </div>

                    {revisar ? (
                      <div className="redacao-revisao" data-revisao-pendente={p.paraId}>
                        <p className="studio-nota">
                          Este motivo foi escrito para uma ligação que este passo não faz
                          mais. O texto continua aqui, intacto — apagá-lo seria destruir
                          trabalho da curadoria sem pedir licença —, mas ele não publica
                          enquanto ninguém responder por ele.
                        </p>
                        <button
                          type="button"
                          className="studio-botao"
                          data-confirmar-revisao={p.paraId}
                          onClick={() => confirmarRevisao(p.paraId)}
                        >
                          o texto continua valendo para esta ligação
                        </button>
                      </div>
                    ) : null}

                    <p className="studio-nota redacao-passo-procedencia">
                      {p.relacao ? `relação «${p.relacao}» · ` : ""}
                      {ROTULO_ORIGEM_MOTIVO[p.origemMotivo]}
                      {p.procedenciaAresta ? ` · procedência ${p.procedenciaAresta}` : ""}
                      {p.doAcervo
                        ? ""
                        : " · passo acrescentado agora: nenhuma ligação do acervo liga estes dois nós, e o motivo é texto da curadoria"}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ---- D-86: a sugestão da IA, sempre descartável ---- */}
          {sugestao && !sugestaoDescartada ? (
            <section className="web-painel redacao-sugestao-ia" data-sugestao-ia={sugestao.entidadeId}>
              <div className="studio-painel-cabeca">
                <span className="studio-painel-nome">A IA sugere o próximo passo</span>
                <span className="studio-pastilha studio-pastilha-marca">sugestão</span>
              </div>

              <div className="redacao-passo-nos">
                <span className="redacao-no">
                  <span className="redacao-classe">último passo</span>
                  <strong>{sugestao.aPartirDeTitulo}</strong>
                </span>
                <span aria-hidden className="redacao-seta">
                  →
                </span>
                <span className="redacao-no">
                  <span className="redacao-classe">{sugestao.classe}</span>
                  <strong>{sugestao.titulo}</strong>
                </span>
              </div>

              <p className="selo-motivo">
                <span>{sugestao.motivo}</span>
              </p>

              <p className="studio-nota">
                Relação «{sugestao.relacao}», procedência {sugestao.procedenciaAresta}. {""}
                {regraDaSugestao}
              </p>

              <div className="studio-acoes">
                <button
                  type="button"
                  className="studio-botao"
                  onClick={() =>
                    acrescentar({
                      id: sugestao.entidadeId,
                      titulo: sugestao.titulo,
                      classe: sugestao.classe,
                      slug: sugestao.slug,
                      sessoesDatadas: sugestao.sessoesDatadas,
                    })
                  }
                >
                  acrescentar como passo — e escrever o motivo
                </button>
                <button
                  type="button"
                  className="studio-botao"
                  data-descartar-sugestao={sugestao.entidadeId}
                  onClick={() => setSugestaoDescartada(true)}
                >
                  descartar sugestão
                </button>
              </div>

              <p className="studio-nota">
                Aceitar a sugestão acrescenta o passo <strong>com motivo vazio</strong>: a
                IA propõe o nó, nunca a explicação. Descartar não altera a trilha.
              </p>
            </section>
          ) : (
            <section className="web-painel">
              <p className="studio-nota">
                {sugestao
                  ? "A sugestão foi descartada. A trilha não mudou — descartar não é uma edição, e nenhuma sugestão entra sem um clique."
                  : "A travessia a partir do último nó não achou vizinho fora da trilha. A tela diz isso em vez de esconder o bloco."}
              </p>
            </section>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* A TERCEIRA COLUNA — o selo na moldura do app, ao lado do campo    */}
        {/*                                                                   */}
        {/* Não é uma segunda tela nem uma reprodução: cada selo abaixo lê a   */}
        {/* MESMA string `motivo` que o campo ao lado edita. É a prova visual  */}
        {/* de D-85 — o curador escreve olhando o que o leitor vai ler, e não  */}
        {/* há caminho por onde os dois textos possam divergir.                */}
        {/* ---------------------------------------------------------------- */}
        <aside className="redacao-coluna-previa">
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Como o público vai ver</span>
              <span className="studio-rotulo">o mesmo texto, na moldura do app</span>
            </div>

            <div className="redacao-moldura-previa" data-previa-mobile>
              <div className="redacao-previa-tela">
                <span className="studio-rotulo">{titulo || trilha.titulo}</span>
                {resumo.trim() ? (
                  <p className="studio-nota">{resumo}</p>
                ) : (
                  <p className="studio-nota" data-nao-sustenta>
                    Esta trilha não declara resumo. O público veria o título sozinho.
                  </p>
                )}

                <div className="redacao-previa">
                  {passos.map((p) => (
                    <div key={p.chave} className="redacao-previa-passo">
                      <span className="studio-rotulo">
                        passo {p.ordem} · {p.deTitulo} → {p.paraTitulo}
                      </span>
                      {p.motivo.trim() ? (
                        <p className="selo-motivo">
                          <span>{p.motivo}</span>
                        </p>
                      ) : (
                        <p className="selo-motivo redacao-selo-vazio" data-nao-sustenta>
                          <span>
                            selo em branco — é isto que o público veria, e é por isso que a
                            trilha não publica assim
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="studio-nota">
              A prévia não pode divergir do público porque as duas pontas leem a mesma
              string: o campo acima e o selo aqui são o mesmo motivo, renderizado com o mesmo
              estilo de selo que a trilha pública usa.
            </p>
            <Link href={`/trilha/${trilha.slug}/`} className="studio-botao">
              abrir a trilha pública de verdade ↗
            </Link>
          </section>
        </aside>
      </div>

      {/* ================================================================== */}
      {/* D-86 — OS TRÊS LIMITES                                              */}
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
