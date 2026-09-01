"use client";

import { useId } from "react";
import { useSessao } from "@/contexto/sessao";

/**
 * onboarding-lugar.tsx — o passo 5, «onde você quer descobrir cultura?».
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * ERA UM ESQUELETO E VIROU UMA PERGUNTA.
 *
 * A tela mostrava quatro retângulos cinzas rotulados com o nome do campo que um dia
 * ocuparia o lugar — «raio de deslocamento em tempo», «as 8 dimensões de acessibilidade
 * que o CMS já modela». Isso é a lista de tarefas de quem constrói, exposta a quem usa:
 * a pessoa lia nome de tabela onde esperava uma pergunta. Agora são quatro blocos que
 * respondem, e cada resposta é gravada em `sessao`.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * DROPDOWN NAS TRÊS DE ESCOLHA ÚNICA, PASTILHA NA DE ESCOLHA MÚLTIPLA.
 *
 * Cidade, alcance e destino admitem UMA resposta cada, e duas delas oferecem quinze
 * opções. Como parede de pastilhas isso ocupava duas telas, e a mesma lista de cidades
 * aparecia duas vezes seguidas — o que lia como repetição, não como pergunta. `<select>`
 * nativo resolve os três: uma linha por bloco, o valor escolhido sempre visível, o
 * seletor do sistema no telefone e o teclado funcionando sem uma linha de JavaScript.
 *
 * A ACESSIBILIDADE CONTINUA EM PASTILHA, e não é inconsistência: ali a resposta é
 * MÚLTIPLA — a pessoa pode precisar de Libras e de legenda ao mesmo tempo —, e
 * `<select multiple>` é o controle que o navegador desenha pior e que menos gente sabe
 * operar, porque exige arrastar ou segurar Ctrl. Oito alvos marcáveis lado a lado se
 * respondem com um toque cada.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * NADA É OBRIGATÓRIO, E O QUE AINDA NÃO CORTA DIZ QUE NÃO CORTA.
 *
 * Três dos quatro blocos se apoiam em dado que existe: cidade e destino saem de
 * `cidadesComAcervo()`, e os recursos de acessibilidade são os mesmos oito campos que
 * `/filtros` usa. O ALCANCE não: o acervo não guarda tempo de deslocamento de lugar
 * nenhum, então a escolha fica registrada e a tela avisa, numa linha, que por enquanto
 * ela não recorta nada. É a mesma regra dos cartões de disposição do passo 1 — dizer na
 * entrada é mais honesto do que deixar a pessoa marcar e descobrir depois, num resultado
 * idêntico, que nada foi filtrado.
 */

/** Os quatro alcances. `sem-limite` fecha a lista e é a resposta de quem não quer limite. */
const ALCANCES: ReadonlyArray<{ valor: string; rotulo: string }> = [
  { valor: "15", rotulo: "Até 15 minutos" },
  { valor: "30", rotulo: "Até 30 minutos" },
  { valor: "60", rotulo: "Até 1 hora" },
  { valor: "sem-limite", rotulo: "Sem limite" },
];

export interface CidadeDeLugar {
  slug: string;
  titulo: string;
}

export interface RecursoDeAcesso {
  campo: string;
  rotulo: string;
}

function Bloco({
  titulo,
  apoio,
  children,
  para,
}: {
  titulo: string;
  apoio?: string;
  children: React.ReactNode;
  /** Id do controle que este título rotula, quando o bloco tem um controle só. */
  para?: string;
}) {
  return (
    <section className="onb-bloco">
      {/* O TÍTULO DO BLOCO É O RÓTULO DO CAMPO quando há um controle só. Sem `<label
          for>`, um `<select>` cercado de texto é um campo sem nome para quem navega por
          leitor de tela: o título estaria na tela, mas não no controle. */}
      {para ? (
        <label className="onb-bloco-titulo" htmlFor={para}>
          {titulo}
        </label>
      ) : (
        <h2 className="onb-bloco-titulo">{titulo}</h2>
      )}
      {apoio ? <p className="onb-bloco-apoio">{apoio}</p> : null}
      {children}
    </section>
  );
}

/**
 * Um dropdown de escolha única.
 *
 * `<select>` NATIVO, e não uma lista desenhada à mão: no telefone ele abre o seletor do
 * sistema, que é o controle que a pessoa já sabe usar; no teclado ele já navega por setas
 * e por primeira letra; e nenhum dos dois custa JavaScript. Uma lista customizada teria
 * de reimplementar os três, e é exatamente aí que esse tipo de campo costuma quebrar.
 *
 * A PRIMEIRA OPÇÃO É O VAZIO, e ela continua na lista depois de escolher: sem ela não
 * haveria como desfazer uma resposta, e neste passo nenhuma pergunta é obrigatória.
 */
function Escolha({
  id,
  vazio,
  valor,
  opcoes,
  aoEscolher,
}: {
  id: string;
  vazio: string;
  valor: string | null;
  opcoes: ReadonlyArray<{ valor: string; rotulo: string }>;
  aoEscolher: (valor: string | null) => void;
}) {
  return (
    <div className="onb-campo">
      <select
        id={id}
        className="onb-select"
        value={valor ?? ""}
        onChange={(e) => aoEscolher(e.target.value || null)}
      >
        <option value="">{vazio}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {/* A seta é decoração: o `<select>` já tem a dele em alguns navegadores, e em
          nenhum ela é estilizável. `appearance: none` na folha tira a nativa para que
          esta seja a única — sem isso apareceriam duas. */}
      <span className="onb-campo-seta" aria-hidden="true">
        ▾
      </span>
    </div>
  );
}

export function OnboardingLugar({
  cidades,
  recursos,
}: {
  cidades: CidadeDeLugar[];
  recursos: RecursoDeAcesso[];
}) {
  const { lugar, definirLugar, alternarAcesso, hidratado } = useSessao();
  const base = useId();

  /* Antes de hidratar nada aparece escolhido — é o HTML do build, e é o estado de quem
     chega aqui pela primeira vez, que é quase todo mundo neste passo. */
  const escolhido = hidratado ? lugar : { cidade: null, alcance: null, viagem: null, acesso: [] };

  const opcoesDeCidade = cidades.map((c) => ({ valor: c.slug, rotulo: c.titulo }));

  return (
    <div className="onb-blocos">
      <Bloco titulo="Sua cidade" apoio="É por ela que a programação começa." para={`${base}-cidade`}>
        {/* SEM FINGIR QUE SABEMOS ONDE VOCÊ ESTÁ. O aplicativo não pede localização e não
            tem como adivinhar — então a opção vazia diz «Escolher cidade» em vez de
            anunciar uma cidade detectada que na verdade seria um chute. */}
        <Escolha
          id={`${base}-cidade`}
          vazio="Escolher cidade"
          valor={escolhido.cidade}
          opcoes={opcoesDeCidade}
          aoEscolher={(v) => definirLugar({ cidade: v })}
        />
      </Bloco>

      <Bloco
        titulo="Até onde você iria?"
        apoio="Ainda não sabemos o tempo de trajeto até cada lugar, então isso fica guardado para quando soubermos."
        para={`${base}-alcance`}
      >
        <Escolha
          id={`${base}-alcance`}
          vazio="Tanto faz"
          valor={escolhido.alcance}
          opcoes={ALCANCES}
          aoEscolher={(v) => definirLugar({ alcance: v })}
        />
      </Bloco>

      <Bloco
        titulo="Vai viajar?"
        apoio="Escolha o destino e já mostramos o que acontece por lá."
        para={`${base}-viagem`}
      >
        <Escolha
          id={`${base}-viagem`}
          vazio="Não vou viajar"
          valor={escolhido.viagem}
          opcoes={opcoesDeCidade}
          aoEscolher={(v) => definirLugar({ viagem: v })}
        />
      </Bloco>

      <Bloco
        titulo="Como podemos tornar sua experiência mais acessível?"
        apoio="Marque o que você precisa. Dá para mudar depois, a qualquer momento."
      >
        <div className="onb-pastilhas">
          {recursos.map((r) => (
            <button
              key={r.campo}
              type="button"
              aria-pressed={escolhido.acesso.includes(r.campo)}
              className="pref-pastilha"
              onClick={() => alternarAcesso(r.campo)}
            >
              {r.rotulo}
            </button>
          ))}
        </div>
      </Bloco>
    </div>
  );
}
