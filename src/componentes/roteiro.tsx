"use client";

import { useRouter } from "next/navigation";
import { Comentario } from "@/componentes/comentario";
import { useSessao } from "@/contexto/sessao";
import { useVisao } from "@/contexto/visao";
import type { Cenario, PassoDoRoteiro, RoteiroDTO } from "@/dados/roteiro";

/**
 * roteiro.tsx — `/roteiro`, os cinco cenários do RFP como percurso clicável (D-76, D-77,
 * D-78, STUD-03, STUD-04).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * É O APP COM UM GUIA, NÃO UM SLIDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Esta tela não reproduz o conteúdo de nenhuma outra: ela CONDUZ até elas. De cada cenário
 * ela mostra a pergunta que ele responde, a visão exigida, os passos na ordem da
 * demonstração com a ROTA LITERAL de cada um, e o que provar em cada tela. É a diferença
 * entre um guia e uma apresentação: tudo que está escrito aqui está a um clique de ser
 * conferido no próprio produto.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O BOTÃO É CONVENIÊNCIA; A ROTA É O CONTRATO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Cada cenário tem entrada direta (STUD-04): um clique põe a visão, semeia o estado e
 * navega. Mas a rota fica ESCRITA ao lado, sempre, porque quem apresenta não pode depender
 * do clique funcionar — se algo travar, a pessoa digita o endereço e a demonstração segue.
 *
 * A ORDEM DAS TRÊS COISAS IMPORTA, e é por isso que ela está escrita no código: visão,
 * depois estado, depois navegação. Quatro dos cinco cenários começam na visão app e o
 * roteiro vive na web (D-78); sem o primeiro passo, a primeira tela abre na visão errada.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ESCREVE PELOS CONTEXTOS, NUNCA DIRETO NO `localStorage`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `visao.tsx` e `sessao.tsx` mantêm estado de React espelhado no storage. Escrever o
 * storage por baixo deixaria a tela mostrando o valor anterior até a próxima recarga — e o
 * defeito só apareceria na frente de quem avalia, que é onde ele custa mais caro.
 *
 * `alternarSalvo` ALTERNA. Chamá-la sobre o que já está salvo REMOVERIA, e clicar duas
 * vezes no mesmo cenário desfaria a semeadura da primeira vez. Por isso toda chamada é
 * precedida de conferência do estado atual (T-04-21), e a semeadura é idempotente: a banca
 * vai pedir os cenários fora de ordem, e pedir o mesmo duas vezes tem de dar no mesmo.
 *
 * DP-F: `@/dados/roteiro` entra APENAS POR TIPO. O módulo alcança `grafo.ts`, e uma
 * importação de valor arrastaria 23 MB de JSON para o navegador. O que atravessa a
 * fronteira é o DTO montado no build pela página de servidor, e ele é só primitivo.
 */

// ---------------------------------------------------------------------------
// Um passo do percurso — a rota escrita, que é o contrato
// ---------------------------------------------------------------------------

function Passo({ passo }: { passo: PassoDoRoteiro }) {
  return (
    <li className="rot-passo">
      <span className="rot-passo-ordem" aria-hidden>
        {passo.ordem}
      </span>
      <div className="rot-passo-corpo">
        <span className="rot-passo-tela">{passo.tela}</span>
        {/* A rota é LEGÍVEL e literal de propósito: quem apresenta precisa poder digitá-la
            se o clique falhar. É por isso que ela é `code` e não link disfarçado. */}
        <code className="rot-rota" data-cenario-rota={passo.rota}>
          {passo.rota}
        </code>
        <span className="rot-como-chegar">
          {passo.comoChegar === "digitando"
            ? "digitável — endereço direto"
            : "pelo botão da tela anterior — o recorte viaja no fragmento"}
        </span>
        <p className="rot-provar">{passo.provar}</p>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// D-77 — os dois blocos, lado a lado e com o MESMO peso visual
// ---------------------------------------------------------------------------

/**
 * O bloco do que o acervo NÃO sustenta não é letra miúda, e não entra em `<Comentario>`.
 *
 * A banca vai perguntar. A resposta chegar DEPOIS da pergunta custa exatamente a
 * credibilidade que a resposta antes dela compra — e essa declaração É o argumento da
 * proposta, não um comentário sobre ele. Escondê-la atrás do interruptor do modo comentado
 * esvaziaria a tela que se quer mostrar.
 */
function Honestidade({ cenario }: { cenario: Cenario }) {
  return (
    <div className="rot-honestidade">
      <section className="rot-bloco rot-bloco-sustenta" data-cenario-sustenta={cenario.numero}>
        <h4 className="rot-bloco-rotulo">O que o acervo sustenta</h4>
        <ul className="rot-bloco-lista">
          {cenario.sustenta.map((linha) => (
            <li key={linha}>{linha}</li>
          ))}
        </ul>
      </section>

      <section
        className="rot-bloco rot-bloco-nao-sustenta"
        data-cenario-nao-sustenta={cenario.numero}
      >
        <h4 className="rot-bloco-rotulo">O que o acervo NÃO sustenta</h4>
        <p className="rot-bloco-texto">{cenario.naoSustenta.texto}</p>
        <p className="rot-origem">
          <span className="rot-origem-rotulo">origem do número</span>
          {cenario.naoSustenta.origem}
        </p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Um cenário
// ---------------------------------------------------------------------------

function BlocoCenario({
  cenario,
  abrir,
  pronto,
}: {
  cenario: Cenario;
  abrir: (cenario: Cenario) => void;
  pronto: boolean;
}) {
  const { semeadura } = cenario;

  return (
    <article
      id={`cenario-${cenario.numero}`}
      className="rot-cenario"
      data-cenario={cenario.numero}
      data-cenario-visao={cenario.visao}
    >
      <header className="rot-cenario-cabeca">
        <span className="rot-numero">Cenário {cenario.numero}</span>
        <h2 className="rot-titulo">{cenario.titulo}</h2>
        <span className="rot-visao" data-visao={cenario.visao}>
          {cenario.visaoRotulo}
        </span>
      </header>

      <p className="rot-pergunta">{cenario.pergunta}</p>

      <div className="rot-entrada">
        <button
          type="button"
          data-cenario-abrir={cenario.numero}
          onClick={() => abrir(cenario)}
          className="rot-botao"
        >
          {pronto ? `Abrir o Cenário ${cenario.numero}` : "preparando o estado…"}
        </button>
        {/* Dizer o que o botão vai mudar ANTES de ele ser apertado. Uma demonstração em que
            o estado muda sem quem apresenta saber o que mudou trava na primeira pergunta. */}
        <p className="rot-semeadura">{semeadura.descricao}</p>
      </div>

      <ol className="rot-passos">
        {cenario.passos.map((passo) => (
          <Passo key={passo.ordem} passo={passo} />
        ))}
      </ol>

      <Honestidade cenario={cenario} />
    </article>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function Roteiro({ roteiro }: { roteiro: RoteiroDTO }) {
  const router = useRouter();
  const { definirVisao, hidratado: visaoHidratada } = useVisao();
  const {
    definirPersona,
    definirDisposicoes,
    salvos,
    alternarSalvo,
    hidratado: sessaoHidratada,
  } = useSessao();

  const pronto = visaoHidratada && sessaoHidratada;

  /**
   * As três coisas, NESTA ORDEM: visão, estado, navegação.
   *
   * A guarda de hidratação não é zelo: antes dela, `salvos` ainda é a lista vazia do
   * primeiro render, e semear o par do Cenário 4 contra ela marcaria como «faltando» algo
   * que já está salvo — o efeito de hidratação sobrescreveria logo depois e a semeadura
   * teria sido descartada em silêncio.
   */
  function abrir(cenario: Cenario) {
    if (!pronto) return;
    const { semeadura } = cenario;

    // 1 — a visão exigida pelo cenário.
    definirVisao(semeadura.visao);

    // 2 — o estado, pelos contextos.
    if (semeadura.personaId) definirPersona(semeadura.personaId);
    if (semeadura.disposicoes) definirDisposicoes(semeadura.disposicoes);
    for (const id of semeadura.ocorrenciasSalvas) {
      // Confere ANTES de chamar: `alternarSalvo` alterna, e chamá-la sobre o que já está
      // salvo removeria o que a primeira passagem salvou (T-04-21).
      if (!salvos.includes(id)) alternarSalvo(id);
    }

    // 3 — a primeira rota do percurso.
    const destino = cenario.passos[0]?.rota;
    if (destino) router.push(destino);
  }

  return (
    <div className="rot" data-roteiro={roteiro.total}>
      <header className="rot-cabecalho">
        <span className="rot-superficie">Roteiro da demonstração</span>
        <h1 className="rot-cabecalho-titulo">
          Os {roteiro.total} cenários do RFP, como percurso
        </h1>
        <p className="rot-objetivo">
          Cada cenário abre sozinho: um clique põe a visão, semeia o estado e leva à primeira
          tela. Peça-os em qualquer ordem — não há preparação entre um e outro. Ao lado de
          cada botão fica a rota escrita, porque o botão é conveniência e a rota é o contrato.
        </p>
        <Comentario>
          D-76 — o roteiro é o app com um guia por cima, e não um slide. D-78 — ele vive na
          visão web porque é ferramenta de apresentação, como as duas telas do Studio.
          STUD-03 e STUD-04.
        </Comentario>
      </header>

      {/*
        O ÍNDICE GRUDADO NO TOPO EXISTE POR UM MOTIVO MEDIDO, e não por gosto: a página
        inteira tem ~4.375px numa janela de 960px, e sem ele o botão do Cenário 5 fica a
        três telas e meia de rolagem do topo. A banca vai pedir um cenário DE SURPRESA, e
        procurá-lo rolando é exatamente a caçada que STUD-04 existe para eliminar.

        Os atalhos NÃO carregam `data-cenario-abrir`. O botão de entrada direta continua
        sendo um por cenário — duplicá-lo aqui inflaria a contagem do atributo que 04-05
        mede, e o contrato da fase vale mais do que um gesto a menos.
      */}
      <nav className="rot-indice" aria-label="Ir para um cenário">
        {roteiro.cenarios.map((cenario) => (
          <a
            key={cenario.numero}
            href={`#cenario-${cenario.numero}`}
            data-cenario-atalho={cenario.numero}
            className="rot-atalho"
          >
            <span className="rot-atalho-numero">{cenario.numero}</span>
            <span className="rot-atalho-titulo">{cenario.titulo}</span>
            <span className="rot-atalho-visao" data-visao={cenario.visao}>
              {cenario.visao === "mobile" ? "app" : "web"}
            </span>
          </a>
        ))}
      </nav>

      <div className="rot-lista">
        {roteiro.cenarios.map((cenario) => (
          <BlocoCenario
            key={cenario.numero}
            cenario={cenario}
            abrir={abrir}
            pronto={pronto}
          />
        ))}
      </div>

      <footer className="rot-fecho">
        <p className="rot-fecho-linha">{roteiro.fecho}</p>
        <p className="rot-fecho-limite">{roteiro.limiteDoRoteiro}</p>

        <Comentario como="div" className="rot-constantes">
          <p className="rot-constantes-nota">
            Os números dos Cenários 3 e 4 que este módulo não deriva do acervo estão declarados
            como constante medida, com o arquivo que os calcula nomeado ao lado. O plano 04-04
            não importa <code>duplicatas.ts</code> nem <code>ocorrencias-studio.ts</code> de
            propósito — eles são escritos na mesma onda, e um import os tornaria dependência de
            build. Acoplar no build, desacoplar na verificação.
          </p>
          <ul className="rot-constantes-lista">
            {roteiro.constantesDaOnda.map((constante) => (
              <li key={constante.chave}>
                <code>{constante.chave}</code> = <strong>{constante.texto}</strong> ·{" "}
                {constante.origem}
              </li>
            ))}
          </ul>
        </Comentario>
      </footer>
    </div>
  );
}
