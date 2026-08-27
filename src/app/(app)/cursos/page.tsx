import type { Metadata } from "next";
import { Cursos } from "@/componentes/cursos";
import { PreferenciaFaixa } from "@/componentes/preferencia-faixa";
import { catalogoDeCursos } from "@/dados/cursos";

export const metadata: Metadata = {
  title: "Cursos — Itaú Cultural",
  description: "As formações da Escola Itaú Cultural — cursos, oficinas e pós-graduação.",
};

/**
 * Cursos — as formações do acervo (classe `formacao`) em vitrine de catálogo.
 *
 * COMPONENTE DE SERVIDOR (DP-F): `cursos.ts` varre o grafo no build. O cliente
 * recebe o DTO e recorta por busca, formato, linguagem e acessibilidade. Cada
 * cartão abre a ficha em `/cursos/[slug]`.
 */
const CATALOGO = catalogoDeCursos();

/* Quantas formações declaram alguma linguagem. É o número que impede a pergunta de
 * linguagem de existir nesta faixa: filtrar por ela esconderia as que não declaram. */
const COM_LINGUAGEM = CATALOGO.linguagens.reduce((total, l) => total + l.n, 0);

export default function PaginaCursos() {
  return (
    <>
      <PreferenciaFaixa
        app="cursos"
        pergunta="Em que formato você aprende?"
        opcoes={CATALOGO.formatos}
        declaracao={
          <>
            Não há pergunta de linguagem aqui de propósito:{" "}
            <strong>
              só {COM_LINGUAGEM} das {CATALOGO.total} formações declaram alguma
            </strong>
            , e recortar por ela esconderia as outras {CATALOGO.total - COM_LINGUAGEM}. O
            acervo também não traz nota, preço nem nome de instrutor — nada disso é
            oferecido porque nada disso existe no dado.
          </>
        }
      />
      <Cursos catalogo={CATALOGO} />
    </>
  );
}
