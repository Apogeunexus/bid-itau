import { Observatorio } from "@/componentes/observatorio";
import type { DadosDesertos } from "@/componentes/desertos";
import {
  CONTORNO_BRASIL,
  ROTULO_CONTORNO,
  ROTULO_UNIDADES_FEDERATIVAS,
  UNIDADES_FEDERATIVAS,
} from "@/dados/contorno-brasil";
import { caminhoDe, densidadePorUf, LIMITES, projetar } from "@/dados/geo";
import { TELAS, aferirDto, montarObservatorio } from "@/dados/observatorio";

/**
 * `/observatorio` — os indicadores de impacto cultural e o painel de procedência
 * (D-87, D-88, D-89, D-90, WEB-07).
 *
 * PÁGINA DE SERVIDOR, e é ela que toca o acervo. Sob `output: "export"` (D-24) «servidor»
 * quer dizer BUILD: `montarObservatorio()` atravessa `grafo.ts`, `geo.ts`, `repertorio.ts` e
 * `personas.ts` para derivar cada número que a tela cita, e o que atravessa a fronteira RSC
 * é um DTO de 15 KB só de primitivo. `observatorio.tsx` é `"use client"` e importa
 * `@/dados/observatorio` APENAS POR TIPO — é essa fronteira, e só ela, que impede 23 MB de
 * grafo de chegar ao navegador (DP-F).
 *
 * A CAMADA DE DESERTOS É MONTADA AQUI, PELO MESMO MOLDE DE `(app)/mapa/page.tsx`, e o molde
 * é REPETIDO em vez de importado de propósito: `montarDesertos` é função interna daquela
 * página, e exportá-la de lá significaria editar um arquivo da fase 3 enquanto seis planos
 * correm em paralelo sobre a mesma fase. A duplicação é de vinte linhas e está declarada;
 * as duas pontas que importam — `densidadePorUf()` e `UNIDADES_FEDERATIVAS` — são as mesmas
 * funções, e é delas que sai todo número. `desertos.tsx` não foi tocado.
 *
 * ESTA ROTA É DE BASTIDOR. O layout de `(bastidor)` já monta `<AvisoDesktop>` e esconde o
 * conteúdo na visão app; esta página não precisa saber disso, e não sabe.
 */

/**
 * A camada de desertos, montada no build: a CONTAGEM vem da travessia do grafo e o POLÍGONO
 * vem da geografia autorada, e os dois se encontram aqui pelo título do estado.
 * `densidadePorUf` já falha alto se a tabela de centroides e os polígonos divergirem.
 */
function montarDesertos(): DadosDesertos {
  const d = densidadePorUf();
  const poligonos = new Map(UNIDADES_FEDERATIVAS.map((u) => [u.sigla, u.contorno]));
  return {
    ufs: d.ufs.map((uf) => {
      const centro = projetar(uf.coordenada);
      return {
        sigla: uf.sigla,
        titulo: uf.titulo,
        registros: uf.registros,
        entidades: uf.entidades,
        noGrafo: uf.noGrafo,
        d: caminhoDe(poligonos.get(uf.sigla) ?? []),
        cx: Number(centro.x.toFixed(1)),
        cy: Number(centro.y.toFixed(1)),
      };
    }),
    total: d.total,
    doisMaiores: d.doisMaiores,
    percentual: Math.round((d.doisMaiores / d.total) * 100),
    maximo: d.maximo,
    mediana: d.mediana,
    entidadesDistintas: d.entidadesDistintas,
    comUmRegistro: d.comUmRegistro.map((u) => u.titulo),
    semRegistro: d.semRegistro.map((u) => u.titulo),
    rotulo: ROTULO_UNIDADES_FEDERATIVAS,
  };
}

/**
 * Os atalhos entre superfícies de bastidor.
 *
 * As três superfícies têm de se alcançar entre si: quem vai demonstrar não pode digitar URL
 * ao vivo, e o layout de `(bastidor)` não monta navegação nenhuma — ele monta só o aviso de
 * desktop. Enquanto não houver cabeçalho comum às seis rotas, o atalho mora na tela.
 */
const ATALHOS = [
  { href: "/moderacao/fila/", rotulo: "Moderação · fila" },
  { href: "/studio/duplicatas/", rotulo: "Studio · duplicatas" },
  { href: "/roteiro/", rotulo: "Roteiro da demonstração" },
] as const;

export default function PaginaObservatorio() {
  /**
   * O que atravessa a fronteira RSC, aferido antes de atravessar.
   *
   * `numerosDoObservatorio()` já media o trio painel + indicadores + públicos. O que sai
   * daqui é maior que ele — leva a camada de desertos e a lista das oito telas —, e é o
   * tamanho do que SAI que importa. Medido em 24.585 bytes contra o teto de 61.440.
   */
  const dados = montarObservatorio();
  const desertos = montarDesertos();
  aferirDto("visao-geral", { dados, desertos, telas: TELAS });

  return (
    <Observatorio
      dados={dados}
      desertos={desertos}
      viewBox={LIMITES.viewBox}
      contorno={caminhoDe(CONTORNO_BRASIL)}
      rotuloContorno={ROTULO_CONTORNO}
      telas={TELAS}
      atalhos={ATALHOS}
    />
  );
}
