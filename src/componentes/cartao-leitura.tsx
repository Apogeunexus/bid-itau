import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import type { Leitura } from "@/dados/leituras";

/**
 * cartao-leitura.tsx — o cartão do hub editorial (reformulação 2026-08, ficha
 * «card de evento» de DESIGN-SYSTEM.md §4 aplicada ao editorial): capa dominante,
 * título forte, data em Display bold PRETO (laranja é ação, nunca data), crédito
 * e categoria etiquetados. COMPONENTE DE SERVIDOR — o conteúdo liga para a fonte
 * no site do Itaú Cultural, transcrita do acervo (mesmo estatuto do verbete).
 */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** `AAAAMMDD` → «22 ago 2026», à mão — sem Intl, sem fuso, sem relógio. */
export function dataCurta(dia: number): string {
  if (!dia) return "";
  const s = String(dia);
  const mes = MESES[Number(s.slice(4, 6)) - 1] ?? "";
  return `${Number(s.slice(6, 8))} ${mes} ${s.slice(0, 4)}`;
}

export function CartaoLeitura({ leitura }: { leitura: Leitura }) {
  return (
    <a
      href={leitura.fonte}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-1.5 no-underline"
    >
      <CapaDeCartao
        titulo={leitura.titulo}
        classe="conteudo"
        linguagens={leitura.linguagens}
        imagem={leitura.imagem}
        creditoImagem={leitura.creditoImagem}
        className="aspect-[3/2] w-full rounded-p"
      />
      <span className="tipo-micro text-tinta-3">
        {leitura.rotuloCategoria}
        {leitura.dia ? <> · <strong className="font-display text-tinta">{dataCurta(leitura.dia)}</strong></> : null}
      </span>
      <span className="line-clamp-2 text-sm leading-snug font-semibold">{leitura.titulo}</span>
      {leitura.resumo ? (
        <span className="line-clamp-2 tipo-legenda text-tinta-2">{leitura.resumo}</span>
      ) : null}
    </a>
  );
}
