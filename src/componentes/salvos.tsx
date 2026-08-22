"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { useSessao } from "@/contexto/sessao";
import type { AlteracaoAutorada, ParDeDemonstracao } from "@/dados/alerta";
import type { IndiceSalvaveis } from "@/dados/repertorio";

/**
 * salvos.tsx — Salvos e alertas (AGEN-03, `docs/telas.md` tela 23). **Cenário 4 do RFP.**
 *
 * A AFIRMAÇÃO QUE ESTA TELA EXISTE PARA TORNAR VISÍVEL. Uma mudança de horário atinge UMA
 * OCORRÊNCIA e não invalida o evento — então só quem salvou aquela sessão é avisado, e as
 * irmãs do mesmo evento seguem como estavam. Isso é consequência direta de DADO-02, que
 * separa evento, temporada e ocorrência em registros próprios em vez de aninhar datas
 * dentro do evento. Num modelo de catálogo, onde o evento carrega um array de datas, o
 * aviso só poderia ser do evento inteiro — e todo mundo receberia o alerta de uma sessão
 * que não é a sua.
 *
 * POR ISSO A FILA É DE SESSÕES E DIZ QUE É (D-56). Se a pessoa salvou duas sessões do
 * mesmo evento, aparecem DUAS LINHAS. Isso não é duplicação a corrigir: é a modelagem
 * ficando legível. Colapsar as duas numa linha de evento apagaria da tela exatamente a
 * distinção que o Cenário 4 vem provar.
 *
 * O QUE É AUTORADO E O QUE NÃO É (D-57, D-37). A alteração é escrita por nós e carrega o
 * rótulo na tela. A sessão, a data, o horário e o evento são reais, do acervo. A regra de
 * corte quando o conteúdo não cabe na moldura é essa mesma: o parágrafo longo que
 * compusemos pode ir para dentro de `<Comentario>`; o dado do acervo e o rótulo de
 * procedência ficam sempre visíveis.
 *
 * T-03-09: todo id vindo de `localStorage` é resolvido contra o índice do build antes de
 * virar linha. Id desconhecido é descartado e CONTADO — a contagem aparece declarada em
 * vez de o item sumir em silêncio.
 *
 * DP-F: `import type` em tudo que vem de `@/dados/alerta` e `@/dados/repertorio`. Os dois
 * módulos importam `grafo.ts`, que carrega 23 MB de JSON; um import de valor arrastaria o
 * grafo inteiro para o navegador. O que atravessa a fronteira são os DTOs, montados no
 * build pela página de servidor.
 */

// ---------------------------------------------------------------------------
// Vocabulário de tela
// ---------------------------------------------------------------------------

/**
 * A explicação curta do rótulo, em PRODUTO e não em comentário.
 *
 * Mora no componente pelo mesmo caminho que `ROTULO_PROCEDENCIA` mora em `trilha.tsx`: o
 * dado diz que a alteração é autorada, a tela diz o que isso significa para quem lê. E ela
 * NÃO entra em `<Comentario>` — a honestidade do dado é o argumento da proposta, não a nota
 * de rodapé sobre ele, e esconder este texto com o interruptor esvaziaria a tela que se
 * quer mostrar.
 */
const ROTULO_CURTO =
  "«autorado»: escrito por nós, sobre sessão real. O acervo não publica histórico de " +
  "alteração — é a lacuna que a tela demonstra.";

// ---------------------------------------------------------------------------
// DTO interno
// ---------------------------------------------------------------------------

interface LinhaSalva {
  ocorrenciaId: string;
  eventoSlug: string;
  eventoTitulo: string;
  rota: string;
  /** "YYYY-MM-DDTHH:mm", como o índice compacto o guarda. Ordena por comparação de string. */
  inicio: string;
  dataCurta: string;
  hora: string;
  gratuito: boolean;
  passada: boolean;
  alteracao: AlteracaoAutorada | undefined;
}

// ---------------------------------------------------------------------------
// Blocos
// ---------------------------------------------------------------------------

/**
 * O bloco de alerta (D-57) — o que mudou, quando, quem informou, e a frase que fecha o
 * cenário. Todos VISÍVEIS na tela ao mesmo tempo: um alerta que esconde o informante atrás
 * de um toque não prova nada numa demonstração de dois minutos.
 */
function BlocoAlerta({ alteracao }: { alteracao: AlteracaoAutorada }) {
  return (
    <article data-alerta={alteracao.ocorrenciaId} className="alerta-alteracao">
      <div className="alerta-cabeca">
        <Grafismo
          variacao="barra"
          className="h-3.5 w-auto shrink-0 text-[var(--ic-laranja)]"
        />
        <span data-procedencia-alerta={alteracao.procedencia} className="alerta-selo">
          {alteracao.procedencia}
        </span>
        <span className="alerta-campo">{alteracao.campoRotulo}</span>
      </div>

      <p className="alerta-titulo">{alteracao.eventoTitulo}</p>

      {/* O que mudou, lado a lado. `de` é o horário REAL da sessão no grafo. */}
      <p className="alerta-mudanca">
        <span className="alerta-de">{alteracao.de}</span>
        <span aria-hidden className="alerta-seta">
          →
        </span>
        <span className="alerta-para">{alteracao.para}</span>
        <span className="alerta-quando">· sessão de {alteracao.dataCurta}</span>
      </p>

      <dl className="alerta-ficha">
        <dt>informado</dt>
        <dd>{alteracao.informadoEmCurto}</dd>
        <dt>por</dt>
        <dd>{alteracao.quemInformou}</dd>
      </dl>

      {/* A frase que fecha o Cenário 4. É a conclusão da tela, e por isso ela é a única
          coisa aqui com fundo próprio. */}
      <p className="alerta-cenario">{alteracao.fraseDoCenario}</p>

      <p className="alerta-rotulo-curto">{ROTULO_CURTO}</p>

      {/* O parágrafo longo — a razão inteira, com os números medidos — é o que paga o
          orçamento de altura da moldura quando o modo comentado está desligado. O rótulo
          acima já entrega o argumento; este entrega a medição. */}
      <Comentario className="alerta-rotulo-curto">{alteracao.frase}</Comentario>
    </article>
  );
}

function LinhaDaFila({
  linha,
  aoRemover,
}: {
  linha: LinhaSalva;
  aoRemover: (id: string) => void;
}) {
  const alertada = Boolean(linha.alteracao);
  return (
    <li
      data-salvo={linha.ocorrenciaId}
      data-salvo-alertado={alertada ? "sim" : "nao"}
      data-salvo-passada={linha.passada ? "sim" : "nao"}
      className="salvos-item"
    >
      <p className="salvos-linha-topo">
        <span className="salvos-data">{linha.dataCurta}</span>
        <span className="salvos-hora">{linha.hora}</span>
        <span
          className={`salvos-marca ${alertada ? "salvos-marca-alertada" : "salvos-marca-intacta"}`}
        >
          {alertada ? "alterada" : "sem alteração"}
        </span>
      </p>

      <Link href={linha.rota} className="salvos-evento">
        {linha.eventoTitulo}
      </Link>

      <p className="salvos-rodape">
        <span>
          {linha.passada ? "sessão passada · " : ""}
          {/* Medido: 0 dos 300 eventos declara ingresso, então `gratuito` não distingue
              nada e o rótulo carrega o qualificador em vez de afirmar gratuidade. */}
          {linha.gratuito ? "sem ingresso declarado na fonte" : "com ingresso"}
        </span>
        <button
          type="button"
          className="salvos-remover"
          onClick={() => aoRemover(linha.ocorrenciaId)}
        >
          remover
        </button>
      </p>
    </li>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function Salvos({
  indice,
  alteracoes,
  par,
  hoje,
}: {
  /** Ocorrência → evento, montado no build. O navegador não tem o grafo (DP-F). */
  indice: IndiceSalvaveis;
  /** As alterações autoradas, resolvidas no build contra a data de referência. */
  alteracoes: AlteracaoAutorada[];
  /** As duas sessões do mesmo evento que tornam D-57 demonstrável. */
  par: ParDeDemonstracao;
  /** A data de referência do build. Nunca o relógio do runtime (T-03-10). */
  hoje: string;
}) {
  const { salvos, alternarSalvo, hidratado } = useSessao();

  const porOcorrencia = useMemo(() => {
    const mapa = new Map<string, AlteracaoAutorada>();
    for (const a of alteracoes) mapa.set(a.ocorrenciaId, a);
    return mapa;
  }, [alteracoes]);

  /**
   * Os ids salvos resolvidos em linhas, em ordem cronológica.
   *
   * Antes de hidratar a lista é vazia de propósito: sob `output: "export"` o HTML sai do
   * build, e ler `localStorage` no primeiro render divergiria da hidratação. É o mesmo
   * cuidado de `sessao.tsx` e `visao.tsx`, e é por isso que o estado vazio é o que aparece
   * no HTML exportado.
   */
  const { linhas, trilhas, descartados } = useMemo(() => {
    if (!hidratado) {
      return { linhas: [] as LinhaSalva[], trilhas: [] as string[], descartados: 0 };
    }

    const saida: LinhaSalva[] = [];
    const trilhasSalvas: string[] = [];
    let naoResolvidos = 0;
    const vistos = new Set<string>();

    for (const id of salvos) {
      // A marcação de trilha da fase 2 grava o id da TRILHA nesta mesma lista
      // (`trilha.tsx`). Trilha não é sessão e não entra numa fila cronológica — ela é
      // contada e declarada abaixo, em vez de virar linha sem data ou sumir sem explicação.
      if (id.startsWith("trilha:")) {
        trilhasSalvas.push(id);
        continue;
      }
      if (vistos.has(id)) continue;
      vistos.add(id);

      // T-03-09. A MESMA regra de chave do servidor, dirigida pelo `prefixo` que veio
      // JUNTO com o índice — `chaveDeOcorrencia` não pode ser importada aqui porque o
      // módulo dela arrasta `grafo.ts` para o cliente (DP-F).
      const chave =
        indice.prefixo && id.startsWith(indice.prefixo) ? id.slice(indice.prefixo.length) : id;
      const entrada = indice.ocorrencias[chave];
      if (!entrada) {
        naoResolvidos += 1;
        continue;
      }
      const [posicao, inicio, gratuito] = entrada;
      const evento = indice.eventos[posicao];
      if (!evento) {
        naoResolvidos += 1;
        continue;
      }
      const [slug, titulo] = evento;
      const [ano, mes, dia] = inicio.slice(0, 10).split("-");

      saida.push({
        ocorrenciaId: id,
        eventoSlug: slug,
        eventoTitulo: titulo,
        // A página do evento lista as sessões e deixa salvar cada uma; é o destino que
        // existe hoje e que continua existindo qualquer que seja o desfecho da tela de
        // seleção de ocorrência, que é de outro plano desta mesma onda.
        rota: `/evento/${slug}/`,
        inicio,
        dataCurta: `${dia}.${mes}.${ano}`,
        hora: inicio.slice(11, 16),
        gratuito: gratuito === 1,
        // D-54: sessão passada continua na fila, marcada como passada.
        passada: inicio.slice(0, 10) < hoje,
        alteracao: porOcorrencia.get(id),
      });
    }

    // Cronológica, e o id como desempate para a ordem não depender da ordem de inserção
    // no `localStorage` — duas sessões no mesmo minuto sairiam trocadas entre recargas.
    saida.sort((a, b) => a.inicio.localeCompare(b.inicio) || a.ocorrenciaId.localeCompare(b.ocorrenciaId));

    return { linhas: saida, trilhas: trilhasSalvas, descartados: naoResolvidos };
  }, [hidratado, salvos, indice, porOcorrencia, hoje]);

  const alertadas = useMemo(() => linhas.filter((l) => l.alteracao), [linhas]);

  /** O par inteiro está salvo? É a condição da prova visível do item 4. */
  const parCompleto = useMemo(() => {
    const ids = new Set(linhas.map((l) => l.ocorrenciaId));
    return ids.has(par.atingida.id) && ids.has(par.intacta.id);
  }, [linhas, par]);

  /**
   * A semeadura do Cenário 4 — salva as DUAS sessões do par de uma vez.
   *
   * Não é enfeite de estado vazio: é o ponto de entrada com estado pré-semeado de que o
   * roteiro dos cenários precisa. Sem ele, quem avalia teria de sair daqui, achar o evento
   * certo entre 300, achar as duas sessões certas entre 53, e voltar — e o Cenário 4
   * morreria na logística antes de chegar ao argumento.
   *
   * `alternarSalvo` ALTERNA, então salvar o que já está salvo removeria. Daí a conferência
   * antes de cada chamada, em vez de confiar em o controle só aparecer no estado vazio.
   */
  const semear = useCallback(() => {
    for (const id of [par.atingida.id, par.intacta.id]) {
      if (!salvos.includes(id)) alternarSalvo(id);
    }
  }, [par, salvos, alternarSalvo]);

  return (
    <div data-salvos={linhas.length} className="flex flex-col gap-3">
      {/* ---- 1. Cabeçalho: a fila é de sessões, não de eventos (D-56) ---- */}
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-[var(--ic-laranja)]" />
          <h1 className="text-2xl leading-tight font-bold">Salvos</h1>
          <span className="ml-auto shrink-0 rounded-full border border-black/15 px-2 py-0.5 text-xs font-semibold text-black/50">
            C1
          </span>
        </div>
        {/* MEDIDO, e por isso curta: com esta frase em três linhas, o fim da segunda linha
            da fila caía a 770px do topo da moldura, 6px atrás da barra de abas — e a imagem
            que fecha o Cenário 4 é justamente o alerta e as DUAS linhas na mesma vista. O
            corte é da prosa que nós compusemos; nenhum dado do acervo saiu. */}
        <p className="text-xs leading-snug text-black/60">
          Fila de <strong className="font-bold">sessões</strong>, não de eventos: duas
          sessões do mesmo evento ocupam duas linhas.
        </p>
      </header>

      {/* ---- 2. O alerta, no topo e destacado (D-57) ---- */}
      {alertadas.map((linha) =>
        linha.alteracao ? (
          <BlocoAlerta key={linha.ocorrenciaId} alteracao={linha.alteracao} />
        ) : null,
      )}

      {/* ---- 4. A prova visível: as duas linhas do mesmo evento, marcadas diferente ---- */}
      {parCompleto ? (
        <p className="salvos-prova">
          As duas linhas abaixo são do <strong className="font-bold">mesmo evento</strong>:{" "}
          {par.atingida.dataCurta} {par.atingida.hora} está marcada como alterada,{" "}
          {par.intacta.dataCurta} {par.intacta.hora} não. O aviso foi para a sessão, não
          para o evento.
        </p>
      ) : null}

      {/* ---- 3. A fila, em ordem cronológica ---- */}
      {linhas.length ? (
        <ul className="salvos-lista">
          {linhas.map((linha) => (
            <LinhaDaFila key={linha.ocorrenciaId} linha={linha} aoRemover={alternarSalvo} />
          ))}
        </ul>
      ) : (
        /* ---- 5. O estado vazio — o estado inicial de quem abre a tela ---- */
        <div className="salvos-vazio">
          <p className="text-sm leading-snug">
            <strong className="font-bold">Nada salvo neste navegador.</strong> Salvos guarda
            as sessões que você escolheu — data e hora específicas, dentro de um evento —
            para que uma mudança de horário chegue só a quem salvou aquela sessão.
          </p>

          <button type="button" data-semear-cenario-4 className="salvos-semear" onClick={semear}>
            Ver o Cenário 4 com o par de exemplo
          </button>

          <p className="text-xs leading-snug text-black/60">
            O botão salva duas sessões reais do mesmo evento —{" "}
            <strong className="font-bold">{par.eventoTitulo}</strong>, em{" "}
            {par.atingida.dataCurta} às {par.atingida.hora} e em {par.intacta.dataCurta} às{" "}
            {par.intacta.hora}. Uma delas foi alterada; a outra não. É o par que torna a
            afirmação verificável em vez de dita.
          </p>

          <Comentario className="text-[0.68rem] leading-snug text-black/50">
            O par é fixo no dado, escolhido por regra declarada e travado em constante: uma
            regeração do grafo que mude o conjunto faz o build quebrar com mensagem nomeada,
            em vez de trocar o roteiro da banca em silêncio.
          </Comentario>
        </div>
      )}

      {/* ---- 6. As gavetas que a tela 23 prevê, declaradas em vez de criadas vazias ---- */}
      <p className="salvos-declarado">
        <strong className="font-bold">Eventos salvos sem sessão escolhida</strong> não
        existem aqui: neste protótipo salvar é sempre de uma ocorrência (D-56), porque é a
        ocorrência que uma mudança de horário atinge. Um evento salvo «em geral» não teria a
        quem endereçar o aviso.{" "}
        <strong className="font-bold">
          Trilhas salvas: {trilhas.length === 0 ? "nenhuma neste navegador" : trilhas.length}
        </strong>
        {trilhas.length
          ? " — trilha não é sessão e não tem data, então ela é contada aqui e aparece em Meu Repertório, fora desta fila cronológica."
          : " — quando você marcar uma trilha, ela é contada aqui e aparece em Meu Repertório, fora desta fila cronológica."}
        {descartados
          ? ` ${descartados} id salvo neste navegador não corresponde a nenhuma ocorrência do acervo e foi descartado — declarado aqui em vez de sumir em silêncio.`
          : ""}
      </p>
    </div>
  );
}
