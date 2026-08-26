import { StudioOrgEspacos } from "@/componentes/studio-org-espacos";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  declaracoesDosEspacos,
  espacosDoAcervo,
  numerosDosEspacos,
} from "@/dados/organizacao";

/**
 * Studio · Organização — O2 · Espaços (funcionalidade 142). **A maior conversão de
 * procedência da sessão 6.**
 *
 * PÁGINA DE SERVIDOR. É ela, e só ela, que chama `@/dados/organizacao` por valor — no
 * build. O componente de cliente recebe DTOs de primitivo e importa aquele módulo apenas
 * por tipo. É essa fronteira, e nenhuma outra, que impede os 9,4 MB de `entidades.json` de
 * atravessarem para o navegador (DP-F). Um `import` por valor daqui para lá seria invisível
 * no código e mediria megabytes no artefato.
 *
 * OS 113 VÃO JUNTOS, e é decisão e não descuido: são treze campos de primitivo por
 * registro, e a tela precisa deixar trocar de espaço sem navegar. Uma rota por espaço
 * geraria 113 páginas e faria quem cadastra perder o lugar na lista a cada clique — o
 * mesmo raciocínio que a fila de duplicatas já fez para 84 grupos.
 *
 * OS NÚMEROS SÃO CONTADOS NO BUILD, não escritos aqui. `numerosDosEspacos()` percorre o
 * grafo e conta os espaços derivados, os que declaram acessibilidade e as 2.425 sessões
 * sem espaço — e as declarações são montadas a partir dessa contagem. Um literal digitado
 * passaria a afirmar, na primeira regeração do grafo, número que o acervo não sustenta.
 *
 * O CARIMBO VEM DAQUI. `DATA_DA_MEDIDA` é `DATA_DE_REFERENCIA`, fixada em `alerta.ts`. Ler
 * o relógio do runtime no cliente faria o HTML exportado e a página hidratada divergirem, e
 * ainda exporia o fuso horário de quem avalia a proposta.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaStudioOrgEspacos() {
  const numeros = numerosDosEspacos();

  return (
    <StudioOrgEspacos
      espacos={espacosDoAcervo()}
      numeros={numeros}
      declaracoes={declaracoesDosEspacos(numeros)}
      organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
      autor={GESTOR_DA_ORGANIZACAO}
      gestorEAutorado={GESTOR_E_AUTORADO}
      dataDeReferencia={DATA_DA_MEDIDA}
    />
  );
}
