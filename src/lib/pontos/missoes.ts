/**
 * missoes.ts — missões com reset por período no relógio virtual.
 *
 * O QUE UMA MISSÃO É AQUI: um convite com porta. Toda missão carrega `rota`, e
 * isso não é conveniência — é a regra de não deixar beco. Uma missão que diz
 * «ouça um episódio» sem levar a lugar nenhum transfere para a pessoa o trabalho
 * de descobrir onde fica o Cast, e o custo desse trabalho é maior que a
 * recompensa que a missão oferece.
 *
 * O RESET É POR CHAVE DE PERÍODO, não por temporizador. `MissaoEmCurso` guarda a
 * chave em que o progresso vale; quando o relógio passa para outra chave, o
 * progresso simplesmente deixa de valer e um estado novo nasce zerado. Não há
 * varredura noturna para escrever, não há missão que «esquece» de resetar porque
 * ninguém abriu o app naquele dia.
 */

import { chaveDaSemana, chaveDoDia } from "./relogio";
import type { EstadoDoMotor, MissaoDefinida, MissaoEmCurso, NomeDeEvento } from "./tipos";

export function chaveDePeriodo(missao: MissaoDefinida, agora: number): string {
  if (missao.expiraEm === "dia") return chaveDoDia(agora);
  if (missao.expiraEm === "semana") return chaveDaSemana(agora);
  return "temporada";
}

/** Garante um estado válido para o período corrente, criando um zerado na virada. */
export function garantirEstado(estado: EstadoDoMotor, missao: MissaoDefinida): MissaoEmCurso {
  const chave = chaveDePeriodo(missao, estado.agora);
  const atual = estado.missoes[missao.id];
  if (atual && atual.chaveDoPeriodo === chave) return atual;

  const novo: MissaoEmCurso = { missaoId: missao.id, progresso: 0, chaveDoPeriodo: chave };
  estado.missoes[missao.id] = novo;
  return novo;
}

export interface AvancoDeMissao {
  missao: MissaoDefinida;
  concluiu: boolean;
}

/** Avança toda missão cujo `avancaCom` casa com o evento. */
export function avancarMissoes(
  estado: EstadoDoMotor,
  definidas: MissaoDefinida[],
  nomeDoEvento: NomeDeEvento,
  passos = 1,
): AvancoDeMissao[] {
  const avancos: AvancoDeMissao[] = [];

  for (const missao of definidas) {
    if (!missao.avancaCom.includes(nomeDoEvento)) continue;

    const emCurso = garantirEstado(estado, missao);
    if (emCurso.concluidaEm) continue;

    emCurso.progresso = Math.min(missao.alvo, emCurso.progresso + passos);

    if (emCurso.progresso >= missao.alvo) {
      emCurso.concluidaEm = estado.agora;
      avancos.push({ missao, concluiu: true });
    } else {
      avancos.push({ missao, concluiu: false });
    }
  }

  return avancos;
}

/**
 * A meta da semana — o «faltam 2 para fechar a semana» da tela inicial.
 *
 * Conta as missões SEMANAIS e SOCIAIS concluídas no período corrente, com teto de
 * 3. O teto existe porque uma meta que cresce com o catálogo pune quem chega
 * quando o catálogo está grande: com 12 missões na semana, «feche todas» é uma
 * meta que ninguém fecha, e meta que ninguém fecha some da tela em duas semanas.
 */
export function metaDaSemana(estado: EstadoDoMotor, definidas: MissaoDefinida[]) {
  const doPeriodo = definidas.filter((m) => m.tipo === "semanal" || m.tipo === "social");
  const chave = chaveDaSemana(estado.agora);

  const feitas = doPeriodo.filter((m) => {
    const emCurso = estado.missoes[m.id];
    return emCurso && emCurso.chaveDoPeriodo === chave && emCurso.concluidaEm;
  }).length;

  return { feitas, alvo: Math.min(3, doPeriodo.length) };
}
