"use client";

/**
 * studio-org-estado.ts — o estado do nível 6 · Organização, no navegador.
 *
 * POR QUE ELE NÃO É `useStudio()`. A loja da S7 existe e o padrão dela é reusado aqui
 * linha a linha — loja de módulo, `useSyncExternalStore`, hidratação dentro de
 * `useEffect`, validação estreita do que veio do armazenamento. O que NÃO dá para reusar é
 * a instância: `useStudio()` guarda `RascunhoDoProdutor` sob a chave `studio.v1`, e a
 * Organização escreve outras entidades — espaço, instituição, mídia, colaborador, edital,
 * lote. Duas sessões gravando sob a mesma chave apagariam o trabalho uma da outra no
 * primeiro salvamento, e o defeito só apareceria com as duas telas abertas.
 *
 * MÓDULO DE CLIENTE, E POR ISSO SEM IMPORT DE DADO POR VALOR (DP-F). O catálogo e a data
 * chegam por PARÂMETRO, vindos do componente de servidor que os leu no build.
 *
 * `localStorage` SÓ DEPOIS DE MONTAR. O estado nasce `null` e só vira objeto quando
 * `hidratar` roda dentro de um `useEffect`. Ler o armazenamento durante o render faria o
 * HTML exportado e a página hidratada divergirem — e o conteúdo divergente seria o
 * trabalho de quem está cadastrando.
 *
 * SEM RELÓGIO. O carimbo é a data de referência do build, que chega junto com o contexto.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { acessibilidadeDeEspacoVazia } from "@/dados/tipos-organizacao";
import type { AcessibilidadeDeEspaco, CadastroDeEspaco } from "@/dados/tipos-organizacao";

/**
 * A chave versionada da Organização, irmã de `studio.v1` e separada dela de propósito.
 *
 * Versionada porque a forma do cadastro vai crescer a cada tela desta sessão, e um estado
 * antigo lido com forma nova quebraria a demonstração em silêncio no navegador de quem já
 * tinha aberto a página — que é pior do que quebrar alto, porque ninguém veria.
 */
export const CHAVE_DA_ORGANIZACAO = "studio.org.v1";

const VERSAO = 1;

interface EstadoPersistido {
  versao: number;
  /** Os cadastros por id de espaço. Mapa e não lista: a tela pergunta «este espaço já foi
   *  cadastrado?» a cada linha das 113, e uma busca linear por linha seria O(n²) à toa. */
  cadastros: Record<string, CadastroDeEspaco>;
  /** Qual espaço a ficha da direita está mostrando. Mora aqui e não na URL porque trocar
   *  de espaço não é navegar: a lista inteira fica montada, e uma rota por espaço geraria
   *  113 páginas. */
  atualId: string | null;
}

export interface ContextoDaOrganizacao {
  dataDeReferencia: string;
  autor: string;
  organizacao: string;
}

// ---------------------------------------------------------------------------
// A loja — módulo, e não `useState` por tela
// ---------------------------------------------------------------------------

let estado: EstadoPersistido | null = null;
let contexto: ContextoDaOrganizacao = { dataDeReferencia: "", autor: "", organizacao: "" };
let primeiroId: string | null = null;

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

/** O que o servidor «vê». Sempre `null`: no build não existe armazenamento, e devolver
 *  qualquer outra coisa faria o HTML exportado afirmar um estado que o navegador pode
 *  contradizer um quadro depois. */
function lerNoServidor(): EstadoPersistido | null {
  return null;
}

// ---------------------------------------------------------------------------
// Leitura e escrita do armazenamento
// ---------------------------------------------------------------------------

function pareceAcessibilidade(v: unknown): v is AcessibilidadeDeEspaco {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.declarada === "boolean" &&
    typeof o.dimensoes === "object" &&
    o.dimensoes !== null &&
    typeof o.fisicos === "object" &&
    o.fisicos !== null
  );
}

/**
 * O que veio do `localStorage` tem a forma que este código espera?
 *
 * É ENTRADA EXTERNA: foi escrito por uma versão anterior desta página, ou por qualquer
 * coisa com acesso ao mesmo domínio. Objeto com forma errada aceito aqui viraria
 * `undefined.dimensoes` duas telas adiante, longe da causa. O projeto não tem zod entre as
 * dependências e acrescentá-la é mudança fora desta sessão, então a checagem é manual e
 * ESTREITA de propósito: confere o que a tela realmente lê, e descarta o resto.
 */
function pareceEstado(v: unknown): v is EstadoPersistido {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (o.versao !== VERSAO) return false;
  if (o.atualId !== null && typeof o.atualId !== "string") return false;
  if (typeof o.cadastros !== "object" || o.cadastros === null) return false;
  return Object.values(o.cadastros as Record<string, unknown>).every((c) => {
    if (typeof c !== "object" || c === null) return false;
    const x = c as Record<string, unknown>;
    return (
      typeof x.espacoId === "string" &&
      typeof x.endereco === "string" &&
      typeof x.bairro === "string" &&
      (x.capacidade === null || typeof x.capacidade === "number") &&
      typeof x.autor === "string" &&
      typeof x.quando === "string" &&
      pareceAcessibilidade(x.acessibilidade)
    );
  });
}

function doZero(): EstadoPersistido {
  return { versao: VERSAO, cadastros: {}, atualId: primeiroId };
}

function gravar(proximo: EstadoPersistido) {
  estado = proximo;
  try {
    window.localStorage.setItem(CHAVE_DA_ORGANIZACAO, JSON.stringify(proximo));
  } catch (erro) {
    // Não engolir: em janela anônima ou com cota estourada a gravação falha, e a tela
    // continua funcionando NA SESSÃO — o que se perde é o «recarregar preserva». Quem
    // depura precisa ver isso; quem apresenta não pode ser interrompido por um alerta.
    console.error("Organização: não foi possível gravar o cadastro.", erro);
  }
  avisar();
}

/**
 * Lê o armazenamento e liga a loja. Idempotente: chamar de novo não relê nem sobrescreve
 * — as dez telas montam o mesmo gancho, e a segunda não pode desfazer o que a primeira leu.
 */
function hidratar(contextoNovo: ContextoDaOrganizacao, idInicial: string | null) {
  contexto = contextoNovo;
  primeiroId = idInicial;
  if (estado !== null) return;

  let cru: string | null = null;
  try {
    cru = window.localStorage.getItem(CHAVE_DA_ORGANIZACAO);
  } catch (erro) {
    console.error("Organização: não foi possível ler o cadastro.", erro);
  }

  if (cru === null) {
    gravar(doZero());
    return;
  }

  let lido: unknown = null;
  try {
    lido = JSON.parse(cru);
  } catch (erro) {
    console.warn("Organização: estado ilegível no armazenamento; recomeçando do zero.", erro);
  }

  if (!pareceEstado(lido)) {
    // Versão antiga ou conteúdo estranho: recomeça, e DIZ que recomeçou. Migrar em
    // silêncio faria a demonstração perder trabalho sem ninguém entender por quê.
    console.warn("Organização: estado com forma inesperada; a demonstração recomeçou do zero.");
    gravar(doZero());
    return;
  }

  estado = lido;
  avisar();
}

// ---------------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------------

/** O cadastro que ainda não existe, já com autor e carimbo. Nunca anônimo, nunca sem
 *  data: §3 da ontologia proíbe escrita sem autor, e o carimbo vem do servidor. */
function cadastroVazio(espacoId: string): CadastroDeEspaco {
  return {
    espacoId,
    endereco: "",
    bairro: "",
    capacidade: null,
    acessibilidade: acessibilidadeDeEspacoVazia(),
    autor: contexto.autor,
    quando: contexto.dataDeReferencia,
  };
}

function comCadastro(
  espacoId: string,
  transformar: (c: CadastroDeEspaco) => CadastroDeEspaco,
) {
  if (estado === null) return;
  const atual = estado.cadastros[espacoId] ?? cadastroVazio(espacoId);
  // O carimbo é reescrito a cada alteração, e é isso que se quer: ele registra a ÚLTIMA
  // escrita, não a primeira. Com data única no build os dois valores coincidem hoje; a
  // regra é que vale quando houver relógio de verdade.
  const proximo = { ...transformar(atual), autor: contexto.autor, quando: contexto.dataDeReferencia };
  gravar({ ...estado, cadastros: { ...estado.cadastros, [espacoId]: proximo } });
}

// ---------------------------------------------------------------------------
// O gancho
// ---------------------------------------------------------------------------

export interface Organizacao {
  /** `false` até o armazenamento ter sido lido. A tela mostra carregamento, e não um
   *  estado vazio que troca um quadro depois. */
  pronto: boolean;
  cadastros: Record<string, CadastroDeEspaco>;
  atualId: string | null;
  contexto: ContextoDaOrganizacao;
  escolher: (espacoId: string) => void;
  /** Altera o cadastro de um espaço. Cria em branco se ainda não existir. */
  alterar: (espacoId: string, mudanca: Partial<Omit<CadastroDeEspaco, "espacoId">>) => void;
  /** O ATO: declara que o espaço não oferece nenhum dos recursos. Zera as treze caixas e
   *  marca `declarada` — as duas coisas juntas, porque «declarei que não tem» com uma
   *  caixa marcada seria uma contradição gravada. */
  declararSemRecursos: (espacoId: string) => void;
  /** O outro lado do ato: marcar qualquer recurso também declara a ficha, porque quem
   *  marca preencheu. */
  alterarAcessibilidade: (espacoId: string, ficha: AcessibilidadeDeEspaco) => void;
  /** Devolve a demonstração ao estado inicial. Uma apresentação roda duas vezes. */
  reiniciar: () => void;
}

export function useOrganizacao(
  contextoDoServidor: ContextoDaOrganizacao,
  idInicial: string | null,
): Organizacao {
  useEffect(() => {
    hidratar(contextoDoServidor, idInicial);
  }, [contextoDoServidor, idInicial]);

  const atualEstado = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const escolher = useCallback((espacoId: string) => {
    if (estado === null) return;
    gravar({ ...estado, atualId: espacoId });
  }, []);

  const alterar = useCallback(
    (espacoId: string, mudanca: Partial<Omit<CadastroDeEspaco, "espacoId">>) => {
      comCadastro(espacoId, (c) => ({ ...c, ...mudanca }));
    },
    [],
  );

  const declararSemRecursos = useCallback((espacoId: string) => {
    comCadastro(espacoId, (c) => ({
      ...c,
      acessibilidade: { ...acessibilidadeDeEspacoVazia(), declarada: true },
    }));
  }, []);

  const alterarAcessibilidade = useCallback(
    (espacoId: string, ficha: AcessibilidadeDeEspaco) => {
      comCadastro(espacoId, (c) => ({ ...c, acessibilidade: ficha }));
    },
    [],
  );

  const reiniciar = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAVE_DA_ORGANIZACAO);
    } catch (erro) {
      console.error("Organização: não foi possível limpar o cadastro.", erro);
    }
    gravar(doZero());
  }, []);

  return {
    pronto: atualEstado !== null,
    cadastros: atualEstado?.cadastros ?? {},
    atualId: atualEstado?.atualId ?? null,
    contexto: contextoDoServidor,
    escolher,
    alterar,
    declararSemRecursos,
    alterarAcessibilidade,
    reiniciar,
  };
}
