import type { Metadata } from "next";
import { NoticiasHub } from "@/componentes/noticias";
import { PreferenciaFaixa } from "@/componentes/preferencia-faixa";
import { medidasDasFaixas, temasDeLeitura } from "@/dados/sementes";

export const metadata: Metadata = { title: "Notícias — Itaú Cultural" };

/**
 * Notícias — a capa editorial. A página só despacha: o recorte e o desenho
 * moram em `noticias.tsx`, que é servidor e alcança `leituras.ts` (DP-F).
 */
const TEMAS = temasDeLeitura();
const TOTAL_DE_TEMAS = medidasDasFaixas().temasComMateria;

export default function Noticias() {
  return (
    <>
      <PreferenciaFaixa
        app="noticias"
        pergunta="Sobre o que você quer ler?"
        opcoes={TEMAS}
        autorado
        declaracao={
          <>
            Estes {TEMAS.length} temas são escolha nossa, não do acervo: dos{" "}
            {TOTAL_DE_TEMAS} que têm matéria atrás, os maiores são classificação
            operacional do CMS — «institucional» e «edital» —, e ninguém escolhe edital
            como leitura. A contagem ao lado de cada um, essa é do acervo. E{" "}
            <strong>não dá para seguir um colunista</strong>: nenhum dos conteúdos traz o
            nome de quem assina.
          </>
        }
      />
      <NoticiasHub />
    </>
  );
}
