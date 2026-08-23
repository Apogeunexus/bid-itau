"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useVisao, type Visao } from "@/contexto/visao";

const OPCOES: Array<{ valor: Visao; rotulo: string }> = [
  { valor: "mobile", rotulo: "App" },
  { valor: "web", rotulo: "Web" },
];

/**
 * O alternador de visão, no canto, fora do fluxo do conteúdo (D-04).
 *
 * É o ÚNICO controle do canto. O modo comentado foi retirado do produto — a explicação
 * sobre o protótipo deixou de existir na tela —, o tema deixou de ter botão (ele segue o
 * sistema operacional e mais nada) e o interruptor de navegação do beta de 23/08 durou um
 * dia: a barra inferior deixou de ser uma das duas opções e passou a ser a navegação do
 * app, então não havia mais escolha a oferecer.
 *
 * A ancoragem à janela mora no `.canto` que envolve este bloco — ver `Canto` abaixo. É o
 * ÚNICO `fixed` legítimo do projeto: o controle de apresentação é deliberadamente externo
 * ao conteúdo e deve mesmo se ancorar na janela.
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
  const { visao, hidratado, janelaDeTelefone } = useVisao();

  // No telefone, com o app na tela, não há escolha a oferecer: a pessoa já ESTÁ
  // no aparelho que a visão app imita, e a visão web é desenhada para 1440px.
  // A condição olha a visão junto com a janela de propósito — se algo puser a
  // visão web num telefone (o aviso das superfícies de bastidor faz isso), o
  // controle reaparece, porque senão não haveria caminho de volta.
  //
  // Não renderizar, em vez de esconder por CSS: um botão invisível continua
  // alcançável pelo teclado, e uma armadilha de foco é pior que um botão a mais.
  // Esperar `hidratado` é o que evita o alternador piscar antes de sumir.
  const ofereceEscolhaDeVisao = hidratado && !(janelaDeTelefone && visao === "mobile");

  return (
    <div
      data-view={visao}
      // Os gates da fase 2 esperam por este sinalizador antes de medir: ele sobe quando o
      // espelho de localStorage da visão foi lido. Medir antes pegaria o quadro anterior à
      // leitura da chave — e o defeito seria intermitente, que é o pior tipo.
      data-hidratado={hidratado ? "sim" : "nao"}
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

      {/* O canto: o único ponto do projeto ancorado na janela (D-04). */}
      {ofereceEscolhaDeVisao ? (
        <div className="canto fixed right-4 bottom-4 z-50 flex flex-col items-end gap-1.5">
          <Alternador />
        </div>
      ) : null}
    </div>
  );
}
