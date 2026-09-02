"use client";

import Link from "next/link";
import { EstrelaXp } from "@/componentes/estrela-xp";
import { Moeda } from "@/componentes/pontos-base";
import { SeloDeNivel } from "@/componentes/selo-nivel";
import { usePontos } from "@/contexto/pontos";
import { useSessao } from "@/contexto/sessao";
import { personaPorId } from "@/dados/personas";

/**
 * perfil-cabecalho.tsx — quem você é e onde você está, no alto da tela de perfil.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * O SELO É A IDENTIDADE DA TELA.
 *
 * São dezoito artes, uma por degrau da escada, e até aqui a única vez que alguém as via
 * em tamanho de verdade era na tela da escada — no resto do produto o selo aparece com
 * 16px, grudado no canto do ícone de perfil. Numa tela chamada «meu perfil» que não
 * mostrava rosto nenhum, ele é o retrato que existe: diz de quem é a tela antes de
 * qualquer número, e muda de arte conforme a pessoa sobe.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * AS DUAS PORTAS LIDERAM COM NÚMERO, NÃO COM PARÁGRAFO.
 *
 * «Desafios» e «Carteira» eram dois cartões com três linhas de descrição cada, e como as
 * descrições tinham comprimentos diferentes os cartões nasciam de alturas diferentes —
 * dois blocos irmãos desalinhados, que é o defeito que se vê antes de se ler. Agora cada
 * um mostra o SEU número (as missões da semana, as fichas) e uma linha só embaixo. O
 * número é o que a pessoa vem conferir; a explicação de para que serve a carteira ela já
 * teve na primeira visita.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * NADA AQUI É INVENTADO. Percurso, ficha, nível e meta saem de `motor.saldoDe`,
 * `motor.nivel()` e `motor.meta()` — o mesmo motor que pinta as pílulas do cabeçalho. Se
 * um dia divergirem é porque alguém criou uma segunda contagem, não porque esta tela
 * arredondou.
 */
export function PerfilCabecalho() {
  const { motor, hidratado } = usePontos();
  const { personaId, hidratado: sessaoPronta } = useSessao();

  /* Antes de ler o `localStorage` não há saldo que seja verdade: mostrar zero afirmaria
     que a pessoa não caminhou. O esqueleto ocupa a mesma altura do bloco pronto, para a
     tela não pular quando o número chega. */
  if (!hidratado || !sessaoPronta) {
    return (
      <div className="perfil-resumo" aria-busy="true">
        <div className="perfil-identidade perfil-identidade-vazia" />
        <div className="perfil-portas">
          <span className="perfil-porta perfil-porta-vazia" />
          <span className="perfil-porta perfil-porta-vazia" />
        </div>
      </div>
    );
  }

  const percurso = motor.saldoDe("percurso");
  const fichas = motor.saldoDe("ficha");
  const nivel = motor.nivel();
  const meta = motor.meta();
  const nome = personaPorId(personaId)?.nome;

  return (
    <div className="perfil-resumo">
      <section className="perfil-identidade" aria-label="Seu nível">
        <span className="perfil-selo">
          <SeloDeNivel nivel={nivel.numero} />
        </span>

        <div className="perfil-identidade-texto">
          {nome ? <p className="perfil-nome tipo-titulo-3">{nome}</p> : null}
          <p className="perfil-nivel tipo-detalhe">
            Nível {nivel.numero} · {nivel.nome}
          </p>

          <span className="nivel-barra">
            <span className="nivel-preenchimento" style={{ width: `${nivel.fracao * 100}%` }} />
          </span>

          {/* O QUE FALTA, E NÃO A FRAÇÃO. «73%» não diz o que fazer; «faltam 70 de
              percurso» diz — é a mesma informação convertida na unidade em que a pessoa
              age. No topo da escada não há o que faltar, e a frase muda. */}
          <p className="perfil-falta tipo-legenda">
            {nivel.noTopo
              ? "Você chegou ao último degrau da escada."
              : `Faltam ${nivel.falta.toLocaleString("pt-BR")} de percurso para o nível ${nivel.numero + 1}`}
          </p>
        </div>
      </section>

      <div className="perfil-saldos">
        <span className="perfil-saldo">
          <EstrelaXp />
          <span className="perfil-saldo-numero">{percurso.toLocaleString("pt-BR")}</span>
          <span className="perfil-saldo-rotulo tipo-legenda">de percurso</span>
        </span>
        <span className="perfil-saldo">
          <Moeda />
          <span className="perfil-saldo-numero">{fichas.toLocaleString("pt-BR")}</span>
          <span className="perfil-saldo-rotulo tipo-legenda">
            {fichas === 1 ? "ficha" : "fichas"}
          </span>
        </span>
      </div>

      <nav className="perfil-portas" aria-label="Desafios e carteira">
        <Link href="/desafios/" className="perfil-porta no-underline">
          <span className="perfil-porta-numero">
            {meta.feitas}
            <span className="perfil-porta-de"> de {meta.alvo}</span>
          </span>
          <span className="perfil-porta-rotulo tipo-detalhe">Desafios</span>
          <span className="perfil-porta-linha tipo-legenda">missões desta semana</span>
        </Link>

        <Link href="/meu/carteira/" className="perfil-porta no-underline">
          <span className="perfil-porta-numero">{fichas.toLocaleString("pt-BR")}</span>
          <span className="perfil-porta-rotulo tipo-detalhe">Carteira</span>
          <span className="perfil-porta-linha tipo-legenda">fichas para trocar</span>
        </Link>
      </nav>
    </div>
  );
}
