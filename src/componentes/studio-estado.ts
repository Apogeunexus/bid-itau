"use client";

/**
 * studio-estado.ts — o estado da jornada do produtor, no navegador.
 *
 * FASE 0. É a metade cliente do contrato: `tipos-acesso.ts` diz que forma o registro tem,
 * `mock/seed.ts` produz a semente no build, e este arquivo guarda, altera e devolve.
 *
 * MÓDULO DE CLIENTE, E POR ISSO NÃO IMPORTA NADA DE DADO POR VALOR (DP-F). `RascunhoDoProdutor`
 * entra por tipo; a semente e a data de referência chegam por PARÂMETRO, vindas do componente
 * de servidor que as leu no build. Um `import` de `@/dados/grafo` aqui arrastaria 23 MB para
 * o navegador — a fronteira é esta linha, e é ela que a mantém.
 *
 * `localStorage` SÓ DEPOIS DE MONTAR. O estado nasce `null` e só vira lista quando
 * `hidratar` roda dentro de um `useEffect`. Ler o armazenamento durante o render faria o
 * HTML exportado e a página hidratada divergirem — o defeito exato que a casa já corrigiu
 * duas vezes, e que aqui seria pior, porque o conteúdo divergente é o trabalho da pessoa.
 *
 * SEM RELÓGIO. O carimbo de envio é `DATA_DE_REFERENCIA`, que chega junto com a semente.
 * `new Date()` exporia o fuso de quem avalia e mudaria a tela entre dois carregamentos.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  CHAVE_DE_ARMAZENAMENTO,
  comChavesRecalculadas,
  editavel,
} from "@/dados/tipos-acesso";
import type { RascunhoDoProdutor, Situacao } from "@/dados/tipos-acesso";

/** A versão da forma persistida. Sobe junto com o sufixo de `CHAVE_DE_ARMAZENAMENTO`. */
const VERSAO = 1;

interface EstadoPersistido {
  versao: number;
  rascunhos: RascunhoDoProdutor[];
  /** Qual registro as telas P2 a P8 estão editando. Mora aqui e não na URL porque a
   *  jornada atravessa oito rotas e um parâmetro perdido no meio faria a P8 revisar
   *  outro evento — e o avaliador não teria como saber que trocou. */
  atualId: string | null;
}

interface Contexto {
  dataDeReferencia: string;
  autor: string;
  organizacao: string;
}

// ---------------------------------------------------------------------------
// A loja — módulo, e não `useState` por tela
// ---------------------------------------------------------------------------

/**
 * `null` enquanto o armazenamento não foi lido. As telas exibem o estado de carregamento
 * nesse intervalo, em vez de mostrar a semente e trocá-la um quadro depois — piscar o dado
 * errado é pior do que esperar um quadro.
 */
let estado: EstadoPersistido | null = null;
let semente: RascunhoDoProdutor[] = [];
let contexto: Contexto = { dataDeReferencia: "", autor: "", organizacao: "" };

const ouvintes = new Set<() => void>();

function avisar() {
  for (const o of ouvintes) o();
}

function assinar(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function lerLoja(): EstadoPersistido | null {
  return estado;
}

/** O que o servidor «vê». Sempre `null`: no build não existe armazenamento, e devolver a
 *  semente aqui faria o HTML exportado afirmar um estado que o navegador pode contradizer. */
function lerNoServidor(): EstadoPersistido | null {
  return null;
}

// ---------------------------------------------------------------------------
// Leitura e escrita do armazenamento
// ---------------------------------------------------------------------------

/**
 * O que veio do `localStorage` tem a forma que este código espera?
 *
 * É ENTRADA EXTERNA: o conteúdo foi escrito por uma versão anterior desta página, ou por
 * qualquer coisa que tenha acesso ao mesmo domínio. Um objeto com forma errada aceito aqui
 * viraria `undefined.map` três telas adiante, longe da causa. O projeto não tem zod entre
 * as dependências e acrescentá-lo é mudança fora desta sessão, então a checagem é manual e
 * ESTREITA de propósito: confere o que a jornada realmente lê, e descarta o resto.
 */
function pareceEstado(v: unknown): v is EstadoPersistido {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (o.versao !== VERSAO) return false;
  if (!Array.isArray(o.rascunhos)) return false;
  if (o.atualId !== null && typeof o.atualId !== "string") return false;
  return o.rascunhos.every((r) => {
    if (typeof r !== "object" || r === null) return false;
    const x = r as Record<string, unknown>;
    return (
      typeof x.id === "string" &&
      typeof x.situacao === "string" &&
      typeof x.titulo === "string" &&
      Array.isArray(x.temporadas) &&
      Array.isArray(x.ocorrencias) &&
      Array.isArray(x.elenco) &&
      typeof x.declaraAcessibilidade === "boolean"
    );
  });
}

function doZero(): EstadoPersistido {
  return {
    versao: VERSAO,
    rascunhos: semente.map((r) => ({ ...r })),
    atualId: semente[0]?.id ?? null,
  };
}

function gravar(proximo: EstadoPersistido) {
  estado = proximo;
  try {
    window.localStorage.setItem(CHAVE_DE_ARMAZENAMENTO, JSON.stringify(proximo));
  } catch (erro) {
    // Não engolir: em janela anônima ou com cota estourada a gravação falha, e a jornada
    // continua funcionando NA SESSÃO — o que se perde é só o «recarregar preserva». Quem
    // está depurando precisa ver isso; quem está apresentando não pode ser interrompido.
    console.error("Studio: não foi possível gravar o estado da jornada.", erro);
  }
  avisar();
}

/**
 * Lê o armazenamento e liga a loja. Idempotente: chamar de novo não relê nem sobrescreve
 * — oito telas montam o mesmo gancho, e a segunda não pode desfazer o que a primeira leu.
 */
function hidratar(sementeNova: RascunhoDoProdutor[], contextoNovo: Contexto) {
  semente = sementeNova;
  contexto = contextoNovo;
  if (estado !== null) return;

  let cru: string | null = null;
  try {
    cru = window.localStorage.getItem(CHAVE_DE_ARMAZENAMENTO);
  } catch (erro) {
    console.error("Studio: não foi possível ler o estado da jornada.", erro);
  }

  if (cru === null) {
    gravar(doZero());
    return;
  }

  let lido: unknown = null;
  try {
    lido = JSON.parse(cru);
  } catch (erro) {
    console.warn("Studio: estado ilegível no armazenamento; recomeçando do zero.", erro);
  }

  if (!pareceEstado(lido)) {
    // Versão antiga ou conteúdo estranho: recomeça, e DIZ que recomeçou. Migrar em
    // silêncio faria a demonstração perder trabalho sem ninguém entender por quê.
    console.warn("Studio: estado com forma inesperada; a demonstração recomeçou do zero.");
    gravar(doZero());
    return;
  }

  estado = lido;
  avisar();
}

// ---------------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------------

function comRascunho(
  id: string,
  transformar: (r: RascunhoDoProdutor) => RascunhoDoProdutor,
) {
  if (estado === null) return;
  gravar({
    ...estado,
    rascunhos: estado.rascunhos.map((r) =>
      r.id === id ? comChavesRecalculadas(transformar(r)) : r,
    ),
  });
}

/**
 * O próximo id da sequência. Determinístico: o maior sufixo numérico já usado, mais um.
 *
 * Nada de sorteio nem de carimbo de tempo. Dois navegadores rodando a mesma demonstração
 * chegam ao mesmo id para o mesmo passo, e a captura de tela de ontem continua batendo com
 * a de hoje.
 */
function proximoId(rascunhos: RascunhoDoProdutor[]): string {
  let maior = 0;
  for (const r of rascunhos) {
    const n = Number.parseInt(r.id.slice(r.id.lastIndexOf(":") + 1), 10);
    if (Number.isFinite(n) && n > maior) maior = n;
  }
  return `evento:produtor:${String(maior + 1).padStart(3, "0")}`;
}

function rascunhoVazio(id: string): RascunhoDoProdutor {
  return comChavesRecalculadas({
    id,
    situacao: "rascunho",
    titulo: "",
    resumo: "",
    linguagens: [],
    temas: [],
    termosPropostos: [],
    imagem: null,
    creditoImagem: null,
    obraId: null,
    obraTitulo: null,
    obraProposta: false,
    elenco: [],
    temporadas: [],
    ocorrencias: [],
    acessibilidade: {
      audio_description: false,
      libras: false,
      descriptive_subtitle: false,
      closed_caption: false,
      open_caption: false,
      simultaneous_translation: false,
      stenotypy: false,
      subtitle: false,
    },
    declaraAcessibilidade: false,
    faixaEtaria: null,
    canalIngresso: null,
    linkDeIngresso: null,
    inscricao: null,
    procedencia: "produtor",
    fonte: contexto.organizacao,
    chaveIdentidade: "",
    autor: contexto.autor,
    enviadoEm: null,
    historico: [],
    pendencias: [],
    motivoDaDevolucao: null,
  });
}

// ---------------------------------------------------------------------------
// O gancho
// ---------------------------------------------------------------------------

export interface Studio {
  /** `false` até o armazenamento ter sido lido. A tela mostra carregamento, não a semente. */
  pronto: boolean;
  rascunhos: RascunhoDoProdutor[];
  /** O registro que as telas da jornada editam. `null` só antes de hidratar. */
  atual: RascunhoDoProdutor | null;
  contexto: Contexto;
  escolher: (id: string) => void;
  /** Altera o registro atual. O recálculo de chave e pendências é automático. */
  alterar: (mudanca: Partial<RascunhoDoProdutor>) => void;
  /** Altera um registro nomeado — usado pelo painel e pelas telas de pós-publicação. */
  alterarId: (id: string, mudanca: Partial<RascunhoDoProdutor>) => void;
  /** Cria um registro em branco, já selecionado, e devolve o id. */
  criar: () => string;
  /** Muda a situação com carimbo de autor e data. Nunca anônimo. */
  mudarSituacao: (id: string, situacao: Situacao, motivo?: string | null) => void;
  /** Devolve a demonstração ao estado inicial. Uma apresentação roda duas vezes. */
  reiniciar: () => void;
  /** `true` quando o registro atual está nas mãos do produtor. */
  editavelAgora: boolean;
}

/**
 * O estado da jornada, igual para todas as telas.
 *
 * `useSyncExternalStore` e não `useState` por tela: o painel, o formulário e a grade podem
 * estar montados ao mesmo tempo, e três cópias do mesmo registro divergiriam no primeiro
 * salvamento. Uma loja de módulo com assinantes é o mecanismo mais simples que a casa já
 * usa para isso, e não acrescenta dependência.
 */
export function useStudio(
  sementeDoServidor: RascunhoDoProdutor[],
  contextoDoServidor: Contexto,
): Studio {
  useEffect(() => {
    hidratar(sementeDoServidor, contextoDoServidor);
  }, [sementeDoServidor, contextoDoServidor]);

  const atualEstado = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const escolher = useCallback((id: string) => {
    if (estado === null) return;
    gravar({ ...estado, atualId: id });
  }, []);

  const alterarId = useCallback((id: string, mudanca: Partial<RascunhoDoProdutor>) => {
    comRascunho(id, (r) => ({ ...r, ...mudanca }));
  }, []);

  const alterar = useCallback((mudanca: Partial<RascunhoDoProdutor>) => {
    if (estado?.atualId) comRascunho(estado.atualId, (r) => ({ ...r, ...mudanca }));
  }, []);

  const criar = useCallback(() => {
    const base = estado ?? doZero();
    const id = proximoId(base.rascunhos);
    gravar({ ...base, rascunhos: [rascunhoVazio(id), ...base.rascunhos], atualId: id });
    return id;
  }, []);

  const mudarSituacao = useCallback(
    (id: string, situacao: Situacao, motivo: string | null = null) => {
      comRascunho(id, (r) => ({
        ...r,
        situacao,
        enviadoEm: situacao === "rascunho" ? null : contexto.dataDeReferencia,
        motivoDaDevolucao: situacao === "devolvido" ? motivo : null,
      }));
    },
    [],
  );

  const reiniciar = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAVE_DE_ARMAZENAMENTO);
    } catch (erro) {
      console.error("Studio: não foi possível limpar o estado da jornada.", erro);
    }
    gravar(doZero());
  }, []);

  const rascunhos = atualEstado?.rascunhos ?? [];
  const atual = rascunhos.find((r) => r.id === atualEstado?.atualId) ?? rascunhos[0] ?? null;

  return {
    pronto: atualEstado !== null,
    rascunhos,
    atual,
    contexto: contextoDoServidor,
    escolher,
    alterar,
    alterarId,
    criar,
    mudarSituacao,
    reiniciar,
    editavelAgora: atual !== null && editavel(atual.situacao),
  };
}
