/**
 * alerta.ts — a alteração de sessão, autorada sobre ocorrência real (D-57).
 *
 * POR QUE ELA É AUTORADA, E POR QUE ISSO É ARGUMENTO E NÃO CONSTRANGIMENTO.
 * Nenhuma das 2.425 ocorrências do grafo foi alterada. Todas são `procedencia:
 * "derivado"`, geradas do período real do evento pela regra de D-21. Não existe no acervo
 * um único registro de mudança de horário, de cancelamento, ou de quem informou a
 * mudança — e isso não é lacuna do mock: **nenhum sistema do Itaú Cultural publica
 * histórico de alteração de sessão hoje.** É exatamente o que a proposta argumenta que
 * falta, e o que o Studio da fase 4 existe para preencher.
 *
 * Portanto a alteração é escrita por nós e a tela diz isso, do mesmo jeito que as três
 * arestas da trilha da fase 2 dizem (D-37). O QUE NÃO É AUTORADO é a existência da
 * sessão: `ocorrenciaId` é sempre uma das 2.425 reais, com data real, dentro de um evento
 * real do acervo. Autorar a mudança é honesto; autorar a sessão seria fabricar
 * programação, que é o que D-48 proíbe.
 *
 * A REGRA DO INFORMANTE (T-03-08). `quemInformou` só nomeia instituição que o grafo liga
 * ao evento por `realiza`. Sem essa aresta, o informante é DECLARADO autorado — nunca um
 * nome de pessoa ou de produtora inventado. Atribuir a uma organização real a conduta de
 * ter informado uma mudança que nunca existiu é o mesmo erro que impediu a fase 2 de
 * autorar arestas `atua_em` cruzando agentes reais com sessões datadas.
 *
 * MEDIDO EM 2026-08-22, e é o que os dois eventos abaixo caem: as 527 arestas `realiza`
 * do grafo chegam todas a `evento:enc:*`, que são os eventos da Enciclopédia, de datas
 * históricas. Nenhum dos 9 eventos com sessão futura tem instituição ligada por
 * `realiza`. As duas alterações desta fase, portanto, declaram o informante como
 * autorado — e a tela mostra a razão em texto.
 *
 * DP-F: roda NO BUILD. Importa `grafo.ts` (23 MB de JSON) e nenhum arquivo `"use client"`
 * pode importar este módulo. O que atravessa a fronteira é o DTO, que é só primitivo.
 * D-47: toda leitura do acervo passa por `grafo.ts`.
 */

import { ocorrenciasDe, porId, vizinhos } from "./grafo";
import type { Entidade, Ocorrencia } from "./tipos";

// ---------------------------------------------------------------------------
// A data de referência do build
// ---------------------------------------------------------------------------

/**
 * A data contra a qual «futuro» é decidido. É a data de geração do grafo
 * (`meta.geradoEm === "2026-08-22"`), fixada aqui como constante e NUNCA lida do relógio
 * do runtime (T-03-10).
 *
 * Ler `new Date()` no cliente faria a mesma tela render conteúdo diferente no servidor e
 * no navegador — divergência de hidratação garantida sob `output: "export"` — e ainda
 * exporia o fuso de quem avalia. Contra a data fixa, o HTML exportado e a página hidratada
 * dizem a mesma coisa em qualquer máquina e em qualquer hora.
 */
export const DATA_DE_REFERENCIA = "2026-08-22";

// ---------------------------------------------------------------------------
// O par de demonstração — fixado no dado, não no acaso da execução
// ---------------------------------------------------------------------------

/**
 * O evento do Cenário 4, FIXADO EM CONSTANTE de propósito.
 *
 * A regra que o produziu, aplicada contra `DATA_DE_REFERENCIA`: **entre os eventos que
 * têm duas ou mais sessões futuras e não são duplicata encenada, o de menor id em ordem
 * lexicográfica.** Medido: 166 sessões futuras distribuídas em 9 eventos, dos quais 1 é
 * clone do Cenário 3 (`evento:autorado:dup-038-13845`) e sai da disputa; entre os 8
 * restantes, `evento:cms:13845` é o menor id.
 *
 * POR QUE CONSTANTE E NÃO CÁLCULO A CADA CHAMADA. Um par escolhido por regra viva muda
 * silenciosamente quando o grafo é regerado, e o roteiro que a banca vai percorrer deixa
 * de ser reproduzível entre um build e o seguinte. Com a constante, uma regeração que
 * mude o conjunto faz `parDeDemonstracao` LANÇAR com mensagem nomeada — quebrar alto em
 * vez de trocar o roteiro em silêncio.
 */
export const EVENTO_DO_PAR = "evento:cms:13845";

/**
 * O evento da segunda alteração — o cancelamento. Mesma regra de escolha, aplicada ao
 * conjunto restante depois de `EVENTO_DO_PAR`: **entre os eventos com sessão futura que
 * não são duplicata nem o próprio evento do par, um cujo título nomeia um espetáculo com
 * sessão única no dia**, para o cancelamento ler como cancelamento e não como remarcação.
 *
 * Ele é DELIBERADAMENTE outro evento. Se as duas alterações caíssem no mesmo evento, a
 * sessão «intacta» do par teria chance de ser a cancelada, e a prova de D-57 — o aviso
 * chega a uma sessão e não à irmã — desmontaria por acidente de dado.
 */
export const EVENTO_DO_CANCELAMENTO = "evento:cms:13913";

/** O horário para o qual a sessão do Cenário 4 foi remarcada. Autorado, como o resto. */
const HORARIO_REMARCADO = "19:30";

/**
 * Quantos dias antes da data de referência a mudança foi informada. Autorado e fixo: a
 * data de aviso é derivada daqui, nunca do relógio (T-03-10).
 */
const DIAS_ATE_O_AVISO = 1;

/** A hora do aviso, autorada. Fixa pelo mesmo motivo que a data. */
const HORA_DO_AVISO = "16:20";

// ---------------------------------------------------------------------------
// DTO
// ---------------------------------------------------------------------------

/** O que mudou. `horario` é a alteração do Cenário 4; `cancelamento` é a segunda. */
export type CampoAlterado = "horario" | "cancelamento";

export interface AlteracaoAutorada {
  /** Uma das 2.425 ocorrências REAIS do grafo. Nunca uma sessão inventada. */
  ocorrenciaId: string;
  eventoId: string;
  eventoSlug: string;
  eventoTitulo: string;
  /** Rota da página do evento, para a tela levar de volta ao que foi alterado. */
  rota: string;
  campo: CampoAlterado;
  /** Rótulo curto do campo, em português de produto. */
  campoRotulo: string;
  /** O valor REAL que está no grafo — o horário como a sessão foi derivada. */
  de: string;
  /** O valor autorado da mudança. */
  para: string;
  /** ISO completo do início real da sessão, para a tela datar o item. */
  inicioReal: string;
  /** "22.08.2026" — a data da sessão atingida, já formatada. */
  dataCurta: string;
  /** Quando a mudança foi informada. Derivada de `hoje`, nunca do relógio. */
  informadoEm: string;
  /** "21.08.2026, 16h20" — a mesma data já formatada para a tela. */
  informadoEmCurto: string;
  /** Instituição ligada por `realiza`, ou a declaração de que o informante é autorado. */
  quemInformou: string;
  /** `true` só quando o nome saiu de uma aresta `realiza` do grafo (T-03-08). */
  informanteDoAcervo: boolean;
  /** Sempre `"autorado"`. O campo existe para a tela não presumir (D-37). */
  procedencia: "autorado";
  /** A frase que declara, na tela, o que «autorado» significa aqui. */
  frase: string;
  /** A frase que fecha o Cenário 4: o aviso é da sessão, não do evento (D-57). */
  fraseDoCenario: string;
  /** Quantas outras sessões o MESMO evento tem, e que não foram tocadas. */
  outrasSessoesDoEvento: number;
}

/** Uma das duas sessões do par, já resolvida para a tela e para a semeadura. */
export interface SessaoDoPar {
  id: string;
  eventoId: string;
  eventoSlug: string;
  eventoTitulo: string;
  /** ISO completo, como está no grafo. */
  inicio: string;
  dataCurta: string;
  hora: string;
  gratuito: boolean;
}

export interface ParDeDemonstracao {
  eventoId: string;
  eventoSlug: string;
  eventoTitulo: string;
  /** A sessão que a alteração atingiu. */
  atingida: SessaoDoPar;
  /** Uma irmã do MESMO evento que nenhuma alteração tocou. */
  intacta: SessaoDoPar;
  /** Quantas sessões futuras o evento tem ao todo. Contexto para a frase da tela. */
  sessoesFuturasDoEvento: number;
}

// ---------------------------------------------------------------------------
// Helpers de data — fatiar a ISO, nunca `new Date` sobre a string local
// ---------------------------------------------------------------------------

/** "2026-08-22" → "22.08.2026". A mesma regra de `repertorio.ts`, pelo mesmo motivo. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : iso;
}

/**
 * `hoje` menos N dias, em ISO curto. `Date.UTC` de propósito: a aritmética roda em UTC a
 * partir de uma data já em ISO, então não há fuso do runtime entrando na conta. É a mesma
 * disciplina de T-03-10 — a data do aviso é derivada da referência do build, e o build
 * de um avaliador em Lisboa produz exatamente a mesma string do build daqui.
 */
function diasAntes(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  const t = Date.UTC(ano, mes - 1, dia) - dias * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** As sessões de um evento com data maior ou igual a `hoje`, já em ordem. */
function sessoesFuturas(eventoId: string, hoje: string): Ocorrencia[] {
  return ocorrenciasDe(eventoId).filter((o) => o.inicio.slice(0, 10) >= hoje);
}

// ---------------------------------------------------------------------------
// O informante — T-03-08
// ---------------------------------------------------------------------------

/**
 * Quem informou a mudança.
 *
 * A única fonte admitida é uma aresta `realiza` que CHEGA ao evento a partir de uma
 * instituição. Sem ela, o informante é declarado autorado, com a razão dita em texto.
 * Nunca um nome de pessoa e nunca um nome de produtora inventado: quem aparece como tendo
 * informado uma mudança está tendo uma conduta atribuída, e atribuir conduta a
 * organização real por conveniência de demonstração é o dano que este projeto não paga.
 */
function informanteDe(evento: Entidade): { nome: string; doAcervo: boolean } {
  const realizadores = vizinhos(evento.id, "realiza")
    .filter((v) => v.aresta.para === evento.id)
    .filter((v) => v.entidade.classe === "instituicao" || v.entidade.classe === "coletivo")
    .map((v) => v.entidade)
    .sort((a, b) => a.id.localeCompare(b.id));

  const primeiro = realizadores[0];
  if (primeiro) {
    return { nome: `${primeiro.titulo} — quem realiza este evento no acervo`, doAcervo: true };
  }

  return {
    nome:
      "Informante autorado para o protótipo — o acervo não liga nenhuma instituição a " +
      "este evento pela relação «realiza», e nós não inventamos nome de produtora",
    doAcervo: false,
  };
}

// ---------------------------------------------------------------------------
// A frase do rótulo, e a frase que fecha o Cenário 4
// ---------------------------------------------------------------------------

const FRASE_DO_ROTULO =
  "Alteração autorada para este protótipo. Nenhum sistema do Itaú Cultural publica " +
  "histórico de mudança de sessão: as 2.425 ocorrências deste grafo são derivadas do " +
  "período real do evento e nenhuma delas registra alteração. A sessão é real e a data é " +
  "real; a mudança é nossa, e aparece rotulada em vez de passar por dado do acervo — é " +
  "justamente a lacuna que a plataforma existe para fechar.";

function fraseDoCenario(titulo: string, outras: number, campo: CampoAlterado): string {
  const oQue = campo === "cancelamento" ? "cancelamento" : "mudança de horário";
  if (outras <= 0) {
    return (
      `Só quem salvou esta sessão foi avisado. A ${oQue} atinge uma ocorrência, ` +
      `e não o evento «${titulo}» inteiro.`
    );
  }
  return (
    `Só quem salvou esta sessão foi avisado. As outras ${outras} ` +
    `${outras === 1 ? "sessão" : "sessões"} de «${titulo}» seguem como ` +
    `${outras === 1 ? "estava" : "estavam"} — a ${oQue} atinge uma ocorrência, ` +
    `não o evento.`
  );
}

// ---------------------------------------------------------------------------
// As alterações
// ---------------------------------------------------------------------------

/** Falha nomeada: o dado saiu debaixo da constante e o roteiro da banca quebra alto. */
function romper(mensagem: string): never {
  throw new Error(
    `alerta.ts: ${mensagem}. As constantes EVENTO_DO_PAR e EVENTO_DO_CANCELAMENTO foram ` +
      `fixadas contra o grafo de ${DATA_DE_REFERENCIA}; se o grafo foi regerado, refaça a ` +
      `escolha pela regra declarada no topo do arquivo em vez de relaxar esta conferência.`,
  );
}

function montar(
  eventoId: string,
  campo: CampoAlterado,
  hoje: string,
  paraValor: (o: Ocorrencia) => string,
): AlteracaoAutorada {
  const evento = porId(eventoId);
  if (!evento) romper(`o evento «${eventoId}» não existe mais no grafo`);

  const futuras = sessoesFuturas(eventoId, hoje);
  const alvo = futuras[0];
  if (!alvo) {
    romper(`o evento «${eventoId}» não tem nenhuma sessão futura contra ${hoje}`);
  }

  const todas = ocorrenciasDe(eventoId);
  const outras = todas.length - 1;
  const { nome, doAcervo } = informanteDe(evento);
  const informadoEm = diasAntes(hoje, DIAS_ATE_O_AVISO);

  return {
    ocorrenciaId: alvo.id,
    eventoId: evento.id,
    eventoSlug: evento.slug,
    eventoTitulo: evento.titulo,
    rota: `/evento/${evento.slug}/`,
    campo,
    campoRotulo: campo === "cancelamento" ? "sessão cancelada" : "horário alterado",
    de: alvo.inicio.slice(11, 16),
    para: paraValor(alvo),
    inicioReal: alvo.inicio,
    dataCurta: dataCurta(alvo.inicio),
    informadoEm,
    informadoEmCurto: `${dataCurta(informadoEm)}, ${HORA_DO_AVISO.replace(":", "h")}`,
    quemInformou: nome,
    informanteDoAcervo: doAcervo,
    procedencia: "autorado",
    frase: FRASE_DO_ROTULO,
    fraseDoCenario: fraseDoCenario(evento.titulo, outras, campo),
    outrasSessoesDoEvento: outras,
  };
}

let CACHE_ALTERACOES: { hoje: string; lista: AlteracaoAutorada[] } | null = null;

/**
 * As alterações autoradas desta demonstração.
 *
 * DUAS, e de naturezas diferentes: uma de horário — a do Cenário 4 — e uma de
 * cancelamento. Uma só faria a tela parecer caso único e o mecanismo, acidente; duas
 * mostram que o alerta é um TIPO de conteúdo do produto, com forma própria. As duas caem
 * sobre ocorrências reais, distintas e de eventos distintos, e as duas são rotuladas.
 */
export function alteracoes({ hoje = DATA_DE_REFERENCIA }: { hoje?: string } = {}): AlteracaoAutorada[] {
  if (CACHE_ALTERACOES && CACHE_ALTERACOES.hoje === hoje) return CACHE_ALTERACOES.lista;

  const lista: AlteracaoAutorada[] = [
    montar(EVENTO_DO_PAR, "horario", hoje, () => HORARIO_REMARCADO),
    // `de` continua sendo o horário REAL da sessão, para os dois valores aparecerem lado a
    // lado na tela com a mesma forma em ambas as alterações. Só o `para` muda de natureza.
    montar(EVENTO_DO_CANCELAMENTO, "cancelamento", hoje, () => "cancelada"),
  ];

  // Duas alterações sobre a MESMA ocorrência fariam a tela mostrar dois cartões para uma
  // linha salva, e a contagem de «exatamente 1 alertado» do roteiro por clique deixaria de
  // significar o que ela mede. Conferido aqui, no dado, e não presumido pelas constantes.
  const ids = new Set(lista.map((a) => a.ocorrenciaId));
  if (ids.size !== lista.length) romper("duas alterações caíram sobre a mesma ocorrência");

  CACHE_ALTERACOES = { hoje, lista };
  return lista;
}

/**
 * A alteração que atinge esta ocorrência, se houver.
 *
 * É a consulta que a tela usa para decidir se um item salvo tem alerta — e é ela que faz
 * D-57 ser código em vez de promessa: a chave é o id da OCORRÊNCIA, então não existe
 * caminho pelo qual um alerta alcance a sessão irmã do mesmo evento.
 */
export function alteracaoDe(
  ocorrenciaId: string,
  hoje: string = DATA_DE_REFERENCIA,
): AlteracaoAutorada | undefined {
  return alteracoes({ hoje }).find((a) => a.ocorrenciaId === ocorrenciaId);
}

// ---------------------------------------------------------------------------
// O par de demonstração
// ---------------------------------------------------------------------------

function paraSessao(o: Ocorrencia, evento: Entidade): SessaoDoPar {
  return {
    id: o.id,
    eventoId: evento.id,
    eventoSlug: evento.slug,
    eventoTitulo: evento.titulo,
    inicio: o.inicio,
    dataCurta: dataCurta(o.inicio),
    hora: o.inicio.slice(11, 16),
    gratuito: o.gratuito,
  };
}

/**
 * As duas sessões do mesmo evento que tornam D-57 demonstrável: salvando as duas, o
 * alerta aparece em uma e não na outra.
 *
 * `atingida` é a sessão que a alteração de horário toca; `intacta` é a primeira irmã
 * futura que NENHUMA alteração toca. A escolha de `intacta` é conferida contra a lista de
 * alterações em vez de presumida — presumir que «a segunda futura não foi alterada» é
 * verdade hoje e vira falso na primeira alteração nova que alguém autorar.
 */
export function parDeDemonstracao({
  hoje = DATA_DE_REFERENCIA,
}: { hoje?: string } = {}): ParDeDemonstracao {
  const evento = porId(EVENTO_DO_PAR);
  if (!evento) romper(`o evento do par «${EVENTO_DO_PAR}» não existe mais no grafo`);
  if (evento.procedencia === "autorado" || evento.clonadoDe) {
    romper(`o evento do par «${EVENTO_DO_PAR}» virou duplicata encenada`);
  }

  const futuras = sessoesFuturas(EVENTO_DO_PAR, hoje);
  if (futuras.length < 2) {
    romper(
      `o evento do par «${EVENTO_DO_PAR}» tem ${futuras.length} sessão futura contra ` +
        `${hoje}, e o par exige ao menos 2`,
    );
  }

  const alteradas = new Set(alteracoes({ hoje }).map((a) => a.ocorrenciaId));

  const atingida = futuras.find((o) => alteradas.has(o.id));
  if (!atingida) romper(`nenhuma sessão futura de «${EVENTO_DO_PAR}» está na lista de alterações`);

  const intacta = futuras.find((o) => o.id !== atingida.id && !alteradas.has(o.id));
  if (!intacta) romper(`«${EVENTO_DO_PAR}» não tem irmã futura sem alteração para servir de contraprova`);

  return {
    eventoId: evento.id,
    eventoSlug: evento.slug,
    eventoTitulo: evento.titulo,
    atingida: paraSessao(atingida, evento),
    intacta: paraSessao(intacta, evento),
    sessoesFuturasDoEvento: futuras.length,
  };
}
