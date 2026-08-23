"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useComentado } from "@/contexto/comentado";
import { useTema, type Tema } from "@/contexto/tema";
import { useVisao, type Visao } from "@/contexto/visao";

const OPCOES: Array<{ valor: Visao; rotulo: string }> = [
  { valor: "mobile", rotulo: "App" },
  { valor: "web", rotulo: "Web" },
];

/**
 * Par de botões no canto, fora do fluxo do conteúdo e visível nas duas visões (D-04).
 *
 * A ancoragem à janela mora no `.canto` que envolve este bloco — ver `Canto` abaixo. É o
 * ÚNICO `fixed` legítimo do projeto: os controles de apresentação são deliberadamente
 * externos ao conteúdo e devem mesmo se ancorar na janela. A barra de abas, que pertence ao
 * telefone, não pode usar o mesmo mecanismo — ver `globals.css`.
 */
function Alternador() {
  const { visao, definirVisao } = useVisao();

  return (
    <div
      role="group"
      aria-label="Alternar visão"
      className="alternador flex gap-1 rounded-full border border-tinta bg-superficie p-1 shadow-lg"
    >
      {OPCOES.map((opcao) => {
        const ativa = visao === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativa}
            onClick={() => definirVisao(opcao.valor)}
            className={clsx(
              "cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              ativa
                ? "bg-acao text-sobre-acao"
                : "text-tinta hover:bg-superficie-2",
            )}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}

/**
 * O interruptor do modo comentado. MESMA FAMÍLIA VISUAL DO ALTERNADOR — pastilha branca,
 * borda, sombra — e CLARAMENTE SECUNDÁRIO A ELE: um botão só em vez de dois, tipografia
 * menor, e ligado ele apenas contorna de laranja em vez de preencher. Empatar os dois faria
 * o avaliador achar que a escolha app/web e a de modo têm o mesmo peso, e elas não têm.
 *
 * O rótulo é deliberadamente distante do vocabulário do alternador («App», «Web»): o gate
 * de tela da fase 2 encontra o botão de visão por expressão regular sobre o texto, e um
 * rótulo como «modo desktop» aqui faria o gate clicar no controle errado.
 */
function InterruptorComentado() {
  const { comentado, alternar } = useComentado();

  return (
    <button
      type="button"
      data-comentado-alternar
      aria-pressed={comentado}
      onClick={alternar}
      title="Mostra as notas que explicam o protótipo: o raciocínio de cada tela e as decisões citadas."
      className={clsx(
        "controle-comentado cursor-pointer rounded-full border bg-superficie px-3 py-1 text-xs font-semibold shadow-lg transition-colors",
        comentado
          ? "border-acao text-acao-tinta"
          : "border-borda-forte text-tinta-3 hover:text-tinta",
      )}
    >
      <span aria-hidden className="mr-1">
        {comentado ? "✓" : "＋"}
      </span>
      modo comentado
    </button>
  );
}

/**
 * O controle de tema. Um botão só, ciclando sistema → claro → escuro.
 *
 * TRÊS ESTADOS NUM BOTÃO SÓ, e não um interruptor de dois: com dois, «seguir o
 * sistema» viraria inalcançável depois do primeiro toque, e quem trocasse o tema
 * do sistema operacional depois não seria mais acompanhado. O rótulo diz o
 * estado ATUAL; o `aria-label` diz para onde o toque leva, porque um leitor de
 * tela anunciando só «tema: escuro, botão» não distingue estado de destino.
 *
 * O RÓTULO EVITA DE PROPÓSITO o vocabulário do alternador de visão. Os gates de
 * tela da fase 2 e 3 encontram o botão de visão por expressão regular sobre o
 * texto de `.alternador button` e `[class*="alternador"] button`, filtrando por
 * /web|desktop|desk/i e /app|mobile|celular|telefone/i. Um rótulo como «tema do
 * aparelho» aqui, ou uma classe que contivesse «alternador», faria a verificação
 * clicar no controle errado e relatar verde sobre outra coisa.
 */
/* A frase inteira, e não só o nome do próximo estado: montada por interpolação,
 * o ciclo terminava em «usar o tema sistema», que não é português. */
const PARA_ONDE_O_TOQUE_LEVA: Record<Tema, string> = {
  sistema: "Tocar para usar o tema claro.",
  claro: "Tocar para usar o tema escuro.",
  escuro: "Tocar para voltar a seguir o tema do sistema.",
};

const ICONE_DO_TEMA: Record<Tema, string> = {
  sistema: "◐",
  claro: "☀",
  escuro: "☾",
};

// smaug-ignore ui-strings: nome de token do design system, não a palavra «ação»
const CLASSE_TEMA_ESCOLHIDO = "border-acao text-acao-tinta";
const CLASSE_TEMA_DO_SISTEMA = "border-borda-forte text-tinta-3 hover:text-tinta";

function ControleTema() {
  const { tema, alternar } = useTema();

  return (
    <button
      type="button"
      data-tema-alternar
      onClick={alternar}
      aria-label={`Tema: ${tema}. ${PARA_ONDE_O_TOQUE_LEVA[tema]}`}
      title="Claro, escuro ou seguindo o tema do seu sistema."
      className={clsx(
        "controle-tema cursor-pointer rounded-full border bg-superficie px-3 py-1 text-xs font-semibold shadow-lg transition-colors",
        tema === "sistema" ? CLASSE_TEMA_DO_SISTEMA : CLASSE_TEMA_ESCOLHIDO,
      )}
    >
      <span aria-hidden className="mr-1">
        {ICONE_DO_TEMA[tema]}
      </span>
      tema: {tema}
    </button>
  );
}

/**
 * Casca do protótipo. Escreve `data-view` no seu elemento raiz — é esse atributo
 * que as variantes `app:` e `desk:` do Tailwind leem. Sem ele, nenhuma classe de
 * visão resolve.
 *
 * Na visão mobile o conteúdo vai dentro de uma moldura de celular de 390×844
 * centralizada (D-03). A moldura some em viewport estreito, e essa é a única
 * media query legítima do projeto: ela é sobre o tamanho real da janela, não
 * sobre a visão escolhida. Mora em `globals.css`, na classe `.moldura`.
 *
 * A moldura tem ALTURA; desde a reformulação do design system quem rola é o
 * filho `.moldura-rolagem`, e a moldura em si é `relative; overflow: hidden`.
 * É o que mantém cabeçalho e gaveta do menu contidos no telefone — `sticky`
 * contra a rolagem, `absolute` contra a moldura, nunca `fixed` na janela.
 */
export function Casca({ children }: { children: ReactNode }) {
  const { visao, hidratado } = useVisao();
  const { comentado, hidratado: comentadoHidratado } = useComentado();

  return (
    <div
      data-view={visao}
      // O MESMO ELEMENTO RAIZ que carrega `data-view`, de propósito: a regra de
      // `[data-comentado="nao"] .comentario` em `globals.css` precisa alcançar a árvore
      // inteira, e um segundo portador criaria dois escopos que divergem.
      data-comentado={comentado ? "sim" : "nao"}
      // `data-hidratado` agora significa «os DOIS espelhos de localStorage foram lidos». Os
      // gates da fase 2 esperam por este sinalizador antes de medir; se ele subisse com
      // apenas a visão lida, uma medição do modo comentado pegaria o quadro anterior à
      // leitura da chave — e o defeito seria intermitente, que é o pior tipo.
      data-hidratado={hidratado && comentadoHidratado ? "sim" : "nao"}
      className="min-h-screen bg-superficie text-tinta app:bg-superficie-2 desk:bg-superficie"
    >
      <div className="palco">
        {/* A moldura deixou de ser o contêiner de rolagem na reformulação do design
            system: ela é `relative; overflow: hidden` e quem rola é `.moldura-rolagem`,
            filho dela. É isso que permite à gaveta do menu lateral posicionar `absolute`
            contra o telefone — sobreposta, sem rolar junto e sem `fixed` (D-03/D-04). */}
        <div className="moldura desk:mx-auto desk:w-full desk:max-w-6xl">
          <div className="moldura-rolagem">{children}</div>
        </div>
      </div>

      {/* O canto: o único ponto do projeto ancorado na janela (D-04). Os controles
          empilham do menos para o mais usado, com o alternador de visão embaixo, mais
          perto do polegar — a hierarquia também é posicional, e não só de cor.

          O tema fica no MEIO, e a ordem foi discutida: o alternador de visão e o modo
          comentado falam SOBRE o protótipo, enquanto o tema é do produto. Ele entra aqui
          mesmo assim porque é onde quem avalia procura por controle de apresentação —
          esconder o tema numa tela de ajustes só teria valor se o app tivesse uma. */}
      <div className="canto fixed right-4 bottom-4 z-50 flex flex-col items-end gap-1.5">
        <InterruptorComentado />
        <ControleTema />
        <Alternador />
      </div>
    </div>
  );
}
