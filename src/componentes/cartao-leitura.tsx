import { ICONE_SETA } from "@/componentes/base/icones";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import type { Leitura } from "@/dados/leituras";

/**
 * cartao-leitura.tsx — o cartão do hub editorial.
 *
 * Dois vocabulários no mesmo arquivo porque o cartão antigo (vitrine de
 * Descobrir/Museu) não pode mudar de forma quando a capa de /noticias vira
 * jornal: aquele grid de dois ainda precisa do cartão baixo com pastilha.
 *
 * Os portes de jornal (`capa`, `lateral`, `chamada`, `grade`, `lista`,
 * `coluna`, `opiniao`) são a ficha da capa — foto dominante, kicker, data em
 * Display bold PRETO (laranja é ação, nunca data). COMPONENTE DE SERVIDOR: o
 * conteúdo liga para a fonte no site do Itaú Cultural.
 */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** `AAAAMMDD` → «22 ago 2026», à mão — sem Intl, sem fuso, sem relógio. */
export function dataCurta(dia: number): string {
  if (!dia) return "";
  const s = String(dia);
  const mes = MESES[Number(s.slice(4, 6)) - 1] ?? "";
  return `${Number(s.slice(6, 8))} ${mes} ${s.slice(0, 4)}`;
}

export type PorteLeitura =
  | "vitrine"
  | "capa"
  | "lateral"
  | "chamada"
  | "grade"
  | "lista"
  | "coluna"
  | "opiniao";

export function CartaoLeitura({
  leitura,
  porte = "vitrine",
}: {
  leitura: Leitura;
  porte?: PorteLeitura;
}) {
  if (porte === "vitrine") return <LeituraVitrine leitura={leitura} />;
  return <LeituraJornal leitura={leitura} porte={porte} />;
}

function LeituraVitrine({ leitura }: { leitura: Leitura }) {
  const miolo = (
    <>
      <CapaDeCartao
        titulo={leitura.titulo}
        classe="conteudo"
        rotulo={leitura.rotuloCategoria}
        linguagens={leitura.linguagens}
        imagem={leitura.imagem}
        creditoImagem={leitura.creditoImagem}
        className="aspect-[3/2] w-full rounded-p"
      />
      <span className="tipo-micro text-tinta-3">
        {leitura.rotuloCategoria}
        {leitura.dia ? (
          <>
            {" "}
            · <strong className="font-display text-tinta">{dataCurta(leitura.dia)}</strong>
          </>
        ) : null}
      </span>
      <span className="line-clamp-2 text-sm leading-snug font-semibold">{leitura.titulo}</span>
      {leitura.resumo ? (
        <span className="line-clamp-2 tipo-legenda text-tinta-2">{leitura.resumo}</span>
      ) : null}
    </>
  );

  if (!leitura.fonte) {
    return <article className="flex flex-col gap-1.5">{miolo}</article>;
  }

  return (
    <a
      href={leitura.fonte}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-1.5 no-underline"
    >
      {miolo}
    </a>
  );
}

function LeituraJornal({
  leitura,
  porte,
}: {
  leitura: Leitura;
  porte: Exclude<PorteLeitura, "vitrine">;
}) {
  const Tag = porte === "capa" ? "h2" : "h3";
  const comFoto = porte !== "chamada" && porte !== "opiniao";
  const comResumo = Boolean(leitura.resumo) && (porte === "capa" || porte === "opiniao");
  const comCredito = Boolean(leitura.creditoImagem) && (porte === "capa" || porte === "coluna");
  const classe = `leitura leitura--${porte}`;
  const miolo = (
    <>
      {comFoto ? (
        <figure className="leitura-figura">
          <CapaDeCartao
            titulo={leitura.titulo}
            classe="conteudo"
            rotulo={leitura.rotuloCategoria}
            linguagens={leitura.linguagens}
            imagem={leitura.imagem}
            creditoImagem={leitura.creditoImagem}
            alt={leitura.imagemAlt}
            compacta
            prioridade={porte === "capa"}
            className="leitura-foto"
          />
          {comCredito && leitura.creditoImagem ? (
            <figcaption className="leitura-credito">{leitura.creditoImagem}</figcaption>
          ) : null}
        </figure>
      ) : null}
      <div className="leitura-corpo">
        {porte === "opiniao" ? (
          <span aria-hidden className="leitura-aspas">
            “
          </span>
        ) : null}
        <p className="leitura-kicker">
          <span className="leitura-secao">{leitura.rotuloCategoria}</span>
          {leitura.dia ? <strong className="leitura-data">{dataCurta(leitura.dia)}</strong> : null}
        </p>
        <Tag className="leitura-titulo">{leitura.titulo}</Tag>
        {comResumo ? <p className="leitura-deck">{leitura.resumo}</p> : null}
        {porte === "capa" && leitura.fonte ? (
          <span className="leitura-cta">
            Abrir no site do Itaú Cultural
            {ICONE_SETA}
          </span>
        ) : null}
      </div>
      <span className="sr-only"> (abre no site do Itaú Cultural)</span>
    </>
  );

  if (!leitura.fonte) {
    return <article className={classe}>{miolo}</article>;
  }

  return (
    <a href={leitura.fonte} target="_blank" rel="noreferrer" className={classe}>
      {miolo}
    </a>
  );
}
