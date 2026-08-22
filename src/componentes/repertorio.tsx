"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Cartao } from "@/componentes/cartao";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { SeloLinguagem, linguagemPorId } from "@/componentes/selo-linguagem";
import { TrocaPersona } from "@/componentes/troca-persona";
import { useSessao } from "@/contexto/sessao";
import { personaIdValido } from "@/dados/personas";
import type {
  GrupoAtravessado,
  IndiceSalvaveis,
  RepertorioDaPersona,
  SalvoResolvido,
} from "@/dados/repertorio";

/**
 * repertorio.tsx — Meu Repertório (DESC-07, `docs/telas.md` tela 21).
 *
 * D-44: esta é a tela que torna visível a métrica de ampliação de repertório, que é o
 * indicador de impacto cultural que o RFP pede. Por isso o número em destaque é
 * «quantas linguagens estão a UM passo e você ainda não atravessou» — e ele é calculado
 * no grafo, no build, nunca escrito à mão.
 *
 * D-45: a troca de persona fica no topo porque é AQUI que a diferença entre as personas
 * é mais legível — Maria com um repertório de música e literatura contra Joana com cinco
 * linguagens declaradas e quatro sessões salvas. As três já vêm prerenderizadas: trocar
 * é escolher qual objeto exibir, sem rota, sem recálculo, sem espera.
 *
 * T-02-13: `personaId` vem de `localStorage`, que o avaliador pode editar. Ele é
 * validado contra `personas.json` ANTES de indexar o precômputo — persona desconhecida
 * cai na primeira em vez de renderizar `undefined`.
 *
 * DP-F: `import type` em tudo que vem de `@/dados/repertorio`. Este arquivo não importa
 * `grafo.ts` em runtime, nem direta nem indiretamente.
 */

/**
 * Quantos vizinhos a tela LISTA. O dado carrega todos (a Maria tem 81), porque é sobre
 * todos que `linguagensNovas` é calculado — recortar o dado recortaria a métrica junto,
 * e a métrica de ampliação de repertório é o indicador de impacto cultural do RFP.
 * O que se recorta é a lista, e a tela diz que recortou.
 */
const TETO_EXIBIDO = 12;

// ---------------------------------------------------------------------------
// Blocos auxiliares
// ---------------------------------------------------------------------------

/**
 * `apoio` é a linha que quem USA a tela precisa para ler a seção; `comentario` é a nota que
 * explica o mecanismo ou cita uma decisão, e só aparece no modo comentado. As duas são props
 * separadas de propósito: emendar as duas numa string só obrigaria a esconder a primeira
 * junto com a segunda, e a primeira é produto.
 */
function Secao({
  titulo,
  apoio,
  comentario,
  /** A seção INTEIRA é comentário — cabeçalho, apoio e miolo somem juntos. */
  apenasComentado,
  children,
}: {
  titulo: string;
  apoio?: string;
  comentario?: React.ReactNode;
  apenasComentado?: boolean;
  children: React.ReactNode;
}) {
  const Envolucro = apenasComentado ? SecaoComentada : "section";
  return (
    <Envolucro className="flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 text-sm font-bold tracking-wide text-black/70 uppercase">
        <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0 text-[var(--ic-laranja)]" />
        {titulo}
      </h2>
      {apoio ? <p className="text-xs leading-snug text-black/50">{apoio}</p> : null}
      {comentario ? (
        <Comentario className="text-xs leading-snug text-black/50">{comentario}</Comentario>
      ) : null}
      {children}
    </Envolucro>
  );
}

/** `<Comentario como="section">` com a assinatura de um elemento, para trocar a raiz acima. */
function SecaoComentada({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Comentario como="section" className={className}>
      {children}
    </Comentario>
  );
}

/**
 * Bloco que a tela 21 lista e o grafo não tem dado para preencher.
 *
 * Declarado, e não omitido: um bloco que some faz a tela parecer menor do que a
 * proposta, e quem avalia não tem como saber se o recurso foi esquecido ou se o dado
 * é que não existe. Dizer as duas coisas é o mesmo tratamento que D-43 dá à
 * acessibilidade e que D-20 dá à coordenada.
 */
function BlocoDeclarado({
  titulo,
  mostraria,
  porque,
}: {
  titulo: string;
  mostraria: string;
  porque: string;
}) {
  return (
    <div
      data-bloco-declarado={titulo}
      className="flex flex-col gap-1 rounded-xl border border-dashed border-black/25 p-3"
    >
      <p className="text-xs font-bold tracking-wide text-black/60 uppercase">{titulo}</p>
      <p className="text-sm leading-snug">{mostraria}</p>
      <p className="text-[0.7rem] leading-snug text-black/45">{porque}</p>
    </div>
  );
}

/** Uma linguagem atravessada, com o peso visual da tela 21 e a cor VINDA DO DADO. */
function LinguagemAtravessada({ grupo }: { grupo: GrupoAtravessado }) {
  // A cor sai do vocabulário gerado, pelo mesmo caminho do selo (D-08). Este arquivo
  // não sabe que teatro é lilás e não pode saber — a associação mora no dado.
  const vocab = linguagemPorId(grupo.linguagemId);
  const token = vocab?.cor?.trim() || "--ic-preto";
  const rotulo = vocab?.rotulo ?? grupo.linguagemId;

  return (
    <li
      data-atravessado={grupo.linguagemId}
      data-peso={grupo.peso}
      className="flex flex-col gap-1.5 rounded-xl border border-black/10 bg-[var(--ic-branco)] p-2.5"
      style={{ "--cor-linguagem": `var(${token})` } as React.CSSProperties}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        {vocab ? (
          <SeloLinguagem linguagem={vocab} />
        ) : (
          <span className="text-sm font-semibold">{rotulo}</span>
        )}
        <span className="text-xs font-bold text-black/60">
          {grupo.peso}{" "}
          {grupo.peso === 1 ? "entidade atravessada" : "entidades atravessadas"}
        </span>
      </div>

      {/* O peso visual da tela 21: a barra é a contagem, não uma nota. */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.07]">
        <div
          className="h-full rounded-full bg-[var(--cor-linguagem)]"
          style={{ width: `${Math.max(4, Math.round(grupo.pesoRelativo * 100))}%` }}
        />
      </div>

      <p className="text-[0.65rem] leading-snug text-black/45">
        {grupo.declaradaNoRepertorio
          ? "declarada no seu repertório"
          : "não declarada no repertório — chegou pelas entidades que você atravessou"}
        {grupo.entidades.length
          ? ` · ${grupo.entidades
              .slice(0, 3)
              .map((e) => e.titulo)
              .join(", ")}${grupo.entidades.length > 3 ? `, +${grupo.entidades.length - 3}` : ""}`
          : " · nenhuma entidade do repertório declara esta linguagem"}
      </p>
    </li>
  );
}

function LinhaSalva({ salvo }: { salvo: SalvoResolvido }) {
  return (
    <li
      data-salvo={salvo.ocorrenciaId}
      className="flex flex-col gap-0.5 rounded-xl border border-black/10 bg-[var(--ic-branco)] p-2.5"
    >
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-bold">{salvo.dataCurta}</span>
        <span className="text-black/60">{salvo.hora}</span>
        {salvo.gratuito ? (
          <span className="rounded-full border border-black/15 px-1.5 text-[0.65rem] font-semibold">
            gratuita
          </span>
        ) : null}
      </p>
      {salvo.rota ? (
        <Link href={salvo.rota} className="text-sm leading-snug font-semibold underline underline-offset-2">
          {salvo.eventoTitulo}
        </Link>
      ) : (
        <span className="text-sm leading-snug font-semibold">{salvo.eventoTitulo}</span>
      )}
      <span className="text-[0.65rem] leading-snug text-black/45">
        O acervo não publica o espaço desta sessão — a ausência é declarada aqui como é na
        página do evento.
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function TelaRepertorio({
  repertorios,
  indice,
}: {
  /** Precomputado no build, uma entrada por persona (D-45). */
  repertorios: Record<string, RepertorioDaPersona>;
  /** Ocorrência → evento, para nomear o que foi salvo nesta sessão do navegador. */
  indice: IndiceSalvaveis;
}) {
  const { personaId, salvos, hidratado } = useSessao();

  // T-02-13: valida antes de indexar. Sem isto, editar a chave no localStorage
  // renderizaria `undefined` na tela em vez de cair na primeira persona.
  const valido = personaIdValido(personaId);
  const repertorio = repertorios[valido] ?? Object.values(repertorios)[0];

  /**
   * Salvos = os que o repertório declara MAIS os que a sessão guardou. A sessão só tem
   * ids; quem os transforma em título e data é o índice compacto que veio do build,
   * porque o navegador não tem o grafo (DP-F).
   */
  const salvosDaSessao = useMemo<SalvoResolvido[]>(() => {
    if (!hidratado) return [];
    const jaDeclarados = new Set(repertorio.salvos.map((s) => s.ocorrenciaId));
    const saida: SalvoResolvido[] = [];
    for (const id of salvos) {
      if (jaDeclarados.has(id)) continue;
      // A MESMA regra de chave do servidor, dirigida pelo `prefixo` que veio JUNTO com o
      // índice. Não dá para importar `chaveDeOcorrencia` de `@/dados/repertorio` aqui:
      // aquele módulo importa `grafo.ts`, e um import de valor arrastaria 23 MB de JSON
      // para o navegador (DP-F). O prefixo viajar no dado é o que mantém as duas pontas
      // sincronizadas sem abrir a fronteira.
      const chave =
        indice.prefixo && id.startsWith(indice.prefixo)
          ? id.slice(indice.prefixo.length)
          : id;
      const entrada = indice.ocorrencias[chave];
      if (!entrada) continue;
      const [posicao, inicio, gratuito] = entrada;
      const evento = indice.eventos[posicao];
      if (!evento) continue;
      const [slug, titulo] = evento;
      const [ano, mes, dia] = inicio.slice(0, 10).split("-");
      saida.push({
        ocorrenciaId: id,
        eventoId: `evento:${slug}`,
        eventoTitulo: titulo,
        rota: `/evento/${slug}/`,
        dataCurta: `${dia}.${mes}.${ano}`,
        hora: inicio.slice(11, 16),
        gratuito: gratuito === 1,
        espacoDeclarado: null,
      });
    }
    return saida.sort((a, b) => a.ocorrenciaId.localeCompare(b.ocorrenciaId));
  }, [hidratado, salvos, indice, repertorio.salvos]);

  /** Trilhas salvas nesta sessão: o botão de `/trilha/[slug]` grava o id da trilha. */
  const trilhasSalvas = useMemo(
    () => (hidratado ? salvos.filter((id) => id.startsWith("trilha:")) : []),
    [hidratado, salvos],
  );

  const todosSalvos = [...repertorio.salvos, ...salvosDaSessao];

  return (
    <div data-repertorio={repertorio.personaId} className="flex flex-col gap-6">
      {/* ---- 5. A troca de persona, no topo (D-45) ---- */}
      <TrocaPersona />

      {/* ---- O número que a tela existe para mostrar (D-44) ---- */}
      <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--ic-laranja)] bg-[color-mix(in_srgb,var(--ic-laranja)_7%,transparent)] p-3">
        <p
          data-linguagens-novas={repertorio.linguagensNovas.length}
          className="text-base leading-snug font-bold"
        >
          {`Você atravessou ${repertorio.linguagensAtravessadas.length} ${
            repertorio.linguagensAtravessadas.length === 1 ? "linguagem" : "linguagens"
          }; ${repertorio.linguagensNovas.length} ${
            repertorio.linguagensNovas.length === 1 ? "outra está" : "outras estão"
          } a um passo.`}
        </p>
        {repertorio.linguagensNovas.length ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {repertorio.linguagensNovas.map((id) => {
              const vocab = linguagemPorId(id);
              return vocab ? (
                <SeloLinguagem key={id} linguagem={vocab} />
              ) : (
                <span key={id} className="text-xs font-semibold">
                  {id}
                </span>
              );
            })}
          </div>
        ) : null}
        {/* Comentário: define «um passo» em vocabulário de grafo («aresta», «vizinhos
            diretos») e contrasta com o motor da outra tela. A frase em destaque acima já diz
            a mesma coisa em português para quem usa; esta diz COMO ela foi calculada. */}
        <Comentario className="text-[0.7rem] leading-snug text-black/55">
          {`Um passo quer dizer UMA aresta a partir do que você já atravessou: ${repertorio.diagnostico.adjacentesBrutos} vizinhos diretos no grafo, dos quais ${repertorio.diagnostico.adjacentesExibidos} entram neste repertório adjacente, no máximo 10 por linguagem. `}
          Não é a caminhada de dois saltos de Descobrir: aquela responde «o que te
          interessaria agora», esta responde «o que está encostado em você».
        </Comentario>
      </div>

      {/* ---- 1. As linguagens já experimentadas, com peso visual ---- */}
      <Secao
        titulo="Linguagens que você atravessou"
        apoio={`${repertorio.diagnostico.entidadesNoRepertorio} entidades no repertório, agrupadas pela linguagem que cada uma declara.`}
        comentario="A cor de cada linguagem vem do vocabulário do acervo, não do componente (D-08)."
      >
        <ul className="flex flex-col gap-2">
          {repertorio.atravessado.map((grupo) => (
            <LinguagemAtravessada key={grupo.linguagemId} grupo={grupo} />
          ))}
        </ul>
        {/* A primeira frase é dado sobre o repertório de quem está olhando, e fica sempre. A
            segunda fala sobre O QUE A TELA FAZ («a tela diz de qual delas cada grupo veio»),
            que é justificativa de projeto. */}
        <p className="text-[0.65rem] leading-snug text-black/45">
          Declaradas no repertório: {repertorio.linguagensDeclaradas.join(", ") || "nenhuma"}.
          As demais chegaram pelas entidades atravessadas.
          <Comentario como="span">
            {" "}
            As duas metades são evidência de travessia, e a tela diz de qual delas cada grupo
            veio em vez de somar tudo em silêncio.
          </Comentario>
        </p>
      </Secao>

      {/* ---- 2. O adjacente a um passo ---- */}
      {/* «Cada item chegou por uma aresta que sai de algo do seu repertório» FICA: é a
          promessa do produto, a mesma que o selo de motivo de cada cartão cumpre item a item.
          O que vira comentário é a nota de consistência entre telas — quem usa o app não
          precisa saber que Descobrir e esta tela compartilham a regra. */}
      <Secao
        titulo="A um passo, e você ainda não foi"
        apoio="Cada item chegou por uma aresta que sai de algo do seu repertório."
        comentario="O selo laranja é o texto dessa aresta — a mesma regra do cartão de Descobrir, para não haver dois vocabulários para a mesma ideia."
      >
        {repertorio.adjacente.length ? (
          <>
            <ul className="flex flex-col gap-3">
              {repertorio.adjacente.slice(0, TETO_EXIBIDO).map((cartao) => (
                <li key={cartao.id} data-adjacente={cartao.id}>
                  <Cartao cartao={cartao} />
                </li>
              ))}
            </ul>
            {repertorio.adjacente.length > TETO_EXIBIDO ? (
              <p className="text-[0.7rem] leading-snug text-black/50">
                Mostrando {TETO_EXIBIDO} de {repertorio.adjacente.length} vizinhos a um passo.
                <Comentario como="span">
                  {" "}
                  A contagem de linguagens novas acima usa TODOS os{" "}
                  {repertorio.adjacente.length} — a lista é recortada para a tela não virar
                  catálogo, e a métrica não é recortada junto.
                </Comentario>
              </p>
            ) : null}
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-black/25 p-3 text-sm leading-snug">
            Nenhuma entidade do seu repertório tem vizinho a um salto que já não esteja no
            próprio repertório. É estado, não falha.
          </p>
        )}
      </Secao>

      {/* ---- 3. Salvos ---- */}
      <Secao
        titulo="Salvos"
        comentario="Sessões salvas isoladamente (D-42). O que está no repertório da persona veio do dado autorado; o que você salvar nesta demonstração aparece junto."
      >
        {todosSalvos.length ? (
          <ul className="flex flex-col gap-2">
            {todosSalvos.map((salvo) => (
              <LinhaSalva key={salvo.ocorrenciaId} salvo={salvo} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-black/25 p-3 text-sm leading-snug">
            <strong className="font-bold">Nada salvo ainda.</strong> Esta persona não tem
            sessão salva no dado do protótipo, e nada foi salvo neste navegador. É estado
            vazio, não erro — abra um evento e salve uma sessão para ela aparecer aqui.
          </p>
        )}
      </Secao>

      {/* ---- 4. O que a tela 21 lista e o grafo não tem ----
           A SEÇÃO INTEIRA É COMENTÁRIO, e é a maior peça de especificação desta tela: ela
           fala do que ESTE PROTÓTIPO não tem, cita a numeração das telas do documento e
           justifica cada lacuna por uma decisão (D-24, D-25, D-43, D-46). Para quem usa o
           produto ela não descreve nada que exista; para quem avalia, é a prova de que as
           lacunas foram medidas em vez de escondidas. É o caso exato do interruptor. */}
      <Secao
        apenasComentado
        titulo="O que esta tela mostraria, e o protótipo não tem"
        apoio="Cada bloco abaixo está na especificação da tela 21. Nenhum deles tem dado no grafo, e por isso aparecem declarados em vez de omitidos."
      >
        <div className="flex flex-col gap-2">
          <BlocoDeclarado
            titulo="Histórico de «eu fui»"
            mostraria="A lista do que a pessoa marcou como ido, em ordem cronológica, e a comparação com o que ela salvou e não foi."
            porque="O grafo não tem registro de presença: «eu fui» é um evento de uso, e o protótipo não tem conta, não tem autenticação e não coleta comportamento (D-25)."
          />
          <BlocoDeclarado
            titulo="Trilhas próprias"
            mostraria="As trilhas que a própria pessoa montou, editáveis e compartilháveis."
            porque={
              trilhasSalvas.length
                ? `Há ${trilhasSalvas.length} trilha salva neste navegador, mas montar trilha própria é escrita no grafo — e o protótipo é export estático, sem servidor e sem gravação (D-24).`
                : "Montar trilha própria é escrita no grafo, e o protótipo é export estático: sem servidor, sem gravação (D-24). O grafo tem uma trilha, e ela é autorada e assinada."
            }
          />
          <BlocoDeclarado
            titulo="Preferências de acessibilidade"
            mostraria="As 8 dimensões do CMS como preferência persistente, filtrando a agenda para quem depende de libras, audiodescrição ou legenda."
            porque="A preferência existiria; o dado para atendê-la, não. As 8 dimensões chegam quase todas em zero no acervo, e filtrar por elas devolveria lista vazia — a ficha da página do evento mostra declarado contra não declarado em vez de fingir cobertura (D-43)."
          />
          <BlocoDeclarado
            titulo="Privacidade — exportar e excluir"
            mostraria="Baixar tudo o que o produto guarda sobre a pessoa e apagar a conta em um toque."
            porque="Não há o que exportar nem o que excluir além do que está neste navegador: persona, disposições e salvos vivem em localStorage e somem ao limpar o site. Nenhum dado pessoal sai daqui (D-25, D-46)."
          />
        </div>
      </Secao>
    </div>
  );
}
