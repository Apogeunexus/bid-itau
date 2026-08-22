/**
 * MEDIDAS COMPARTILHADAS DAS SUÍTES DE VERIFICAÇÃO.
 *
 * Este arquivo nasceu na reformulação do design system (2026-08) com um
 * propósito: quando uma medida do produto muda de verdade — altura de barra,
 * âncora de git, limite de dobra — a reconciliação acontece AQUI, num arquivo
 * só, em vez de caçar constantes espalhadas por cinco suítes.
 *
 * REGRA DAS ÂNCORAS DE GIT: o histórico deste repositório foi recriado em
 * 2026-08-22 (commit inicial 158b646, o estado consolidado das 5 fases).
 * As âncoras antigas (`a40f380`, `c90fc9b`) apontavam para o histórico
 * anterior e deixaram de existir — os portões que as usavam quebrariam em
 * qualquer verificação. As duas âncoras abaixo assumem o papel:
 *
 * - `COMMIT_DA_CONSOLIDACAO`: desde ele, `globals.css` só pode receber linha
 *   de `@import` e comentário, e o bloco `:root` com os hex do manual tem de
 *   continuar byte a byte idêntico.
 * - `COMMIT_ULTIMO_QUE_TOCOU_GLOBALS`: desde ele, `globals.css` tem diferença
 *   ZERO. Toda fase que legitimamente acrescentar um `@import` atualiza esta
 *   âncora NO COMMIT SEGUINTE ao que tocou o arquivo (o sha só existe depois
 *   do commit) — é o que mantém o invariante «o último a tocar é o declarado».
 */

export const COMMIT_DA_CONSOLIDACAO = "158b646";
export const COMMIT_ULTIMO_QUE_TOCOU_GLOBALS = "158b646";
