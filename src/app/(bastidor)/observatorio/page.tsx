import { Observatorio } from "@/componentes/observatorio";
import { LIMITES } from "@/dados/geo";
import {
  CONTORNO_DO_BRASIL,
  TELAS,
  aferirDto,
  montarDesertos,
  montarObservatorio,
} from "@/dados/observatorio";

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
 * A CAMADA DE DESERTOS SUBIU PARA `@/dados/observatorio`. Ela nasceu aqui como cópia
 * declarada do molde de `(app)/mapa/page.tsx`; a G4 passou a precisar da mesma camada, e
 * uma segunda cópia seria a terceira. As duas pontas que importam — `densidadePorUf()` e
 * `UNIDADES_FEDERATIVAS` — continuam sendo as mesmas funções, e é delas que sai todo
 * número. `desertos.tsx` não foi tocado.
 *
 * ESTA ROTA É DE BASTIDOR. O layout de `(bastidor)` já monta `<AvisoDesktop>` e esconde o
 * conteúdo na visão app; esta página não precisa saber disso, e não sabe.
 */

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
      contorno={CONTORNO_DO_BRASIL.d}
      rotuloContorno={CONTORNO_DO_BRASIL.rotulo}
      telas={TELAS}
      atalhos={ATALHOS}
    />
  );
}
