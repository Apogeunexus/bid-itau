import { Acontece } from "@/componentes/acontece";
import { montarAgenda } from "@/dados/agenda";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";

/**
 * `/acontece` — AGEN-01, `docs/telas.md` tela 8.
 *
 * COMPONENTE DE SERVIDOR, e essa é a fronteira que a tela inteira depende (DP-F): é aqui,
 * no BUILD, que `montarAgenda` varre as 2.425 ocorrências do grafo de 23 MB. O que
 * atravessa para `<Acontece>` é o DTO de 192 KB, só primitivos, serializável pela
 * fronteira RSC. Nenhum componente de cliente desta rota conhece `@/dados/grafo`.
 *
 * A DATA DE REFERÊNCIA É AVALIADA UMA VEZ POR EXECUÇÃO DE BUILD, no escopo do módulo, e
 * desce por prop — nunca é lida dentro de um componente (T-03-04, e o mesmo padrão que
 * `evento/[slug]/page.tsx` fixou na fase 2). Sob `output: "export"` a página é
 * prerenderizada; um relógio de runtime faria o HTML exportado e a hidratação divergirem
 * e ainda vazaria o fuso de quem avalia.
 *
 * A DATA VEM DE `alerta.ts`, NUNCA DO RELÓGIO. Um `new Date()` aqui fazia o «hoje»
 * depender da hora do build: qualquer build depois da meia-noite UTC divergia da data
 * de referência que as suítes e o restante do produto pinam — medido em 22/08/2026,
 * quando a fase 3 quebrou às 21h locais (00h UTC do dia 23).
 */
const HOJE = DATA_DE_REFERENCIA;

export default function PaginaAcontece() {
  return <Acontece agenda={montarAgenda({ hoje: HOJE })} />;
}
