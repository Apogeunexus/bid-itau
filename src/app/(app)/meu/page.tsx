import Link from "next/link";
import {
  CHAVE_PERFIL_COMPLETO,
  ConcluirMissao,
} from "@/componentes/base/concluir-missao";
import { Grafismo } from "@/componentes/grafismo";
import { PerfilCabecalho } from "@/componentes/perfil-cabecalho";
import { SeletorDeTema } from "@/componentes/seletor-tema";
import { SeletorDisposicao } from "@/componentes/seletor-disposicao";

/**
 * `/meu` — o perfil, e agora também a tela que o avatar do cabeçalho abre.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * ERA SETE PORTAS IGUAIS; VIROU UM LUGAR ONDE SE ESTÁ.
 *
 * A tela abria com sete cartões de texto do mesmo tamanho — sete lugares para onde ir,
 * nenhum dizendo nada sobre quem abriu. E o avatar do topo abria uma gaveta com mais seis
 * rótulos empilhados, que era a mesma lista outra vez, em outro lugar, com outra ordem.
 *
 * Agora há UMA porta e uma hierarquia. O avatar abre esta tela; ela começa pelo nível, o
 * percurso e as fichas; DESAFIOS e CARTEIRA vêm em seguida, grandes, porque são o que a
 * pessoa vem fazer aqui — ganhar e gastar —; e o resto é uma lista discreta embaixo, que
 * é o peso que aqueles sete cartões deviam ter tido desde o começo.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * UM PERFIL, NÃO TRÊS.
 *
 * A troca de persona (Maria, Carlos, Joana) morava no alto desta tela e na gaveta do
 * avatar. Ela saiu das duas: o produto passa a mostrar UMA pessoa. Quem estiver
 * demonstrando e precisar de outra persona usa `/meu/repertorio`, onde a comparação entre
 * as três é o assunto da tela e não um seletor no caminho de quem só quer ver o próprio
 * saldo.
 *
 * O TEMA DESCEU PARA CÁ junto com a gaveta que o carregava. Ele é preferência da pessoa,
 * como as disposições logo acima — e preferência tem lugar no perfil, não num menu que
 * abre por cima do conteúdo.
 */

/** O resto, em lista discreta: são destinos legítimos, não decisões de primeira ordem. */
const DEMAIS = [
  { href: "/meu/conquistas/", rotulo: "Conquistas", descricao: "Metas, emblemas e o que dá ficha" },
  { href: "/meu/repertorio/", rotulo: "Meu repertório", descricao: "As linguagens que você atravessou" },
  { href: "/salvos/", rotulo: "Salvos e alertas", descricao: "O que guardou, com aviso de mudança" },
  { href: "/comunidade/guardadas/", rotulo: "Guardadas", descricao: "As publicações que você guardou" },
  { href: "/comunidade/marketplace/", rotulo: "Comunidades", descricao: "Produtores e organizações, por estado" },
  { href: "/ia/", rotulo: "Roteiros", descricao: "Os roteiros que você montou do acervo" },
  { href: "/filtros/", rotulo: "Acessibilidade", descricao: "As 8 dimensões, marcadas uma vez só" },
] as const;

export default function Meu() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-3xl desk:p-8">
      <header className="flex items-baseline gap-2">
        <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
        <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Meu perfil</h1>
      </header>

      {/* Nível, saldos e as duas portas — tudo que depende do motor de pontos, num
          componente de cliente só. Ver o cabeçalho dele. */}
      <PerfilCabecalho />

      {/* A primeira missão do percurso de abertura mora aqui: sem perfil declarado, a
          comunidade não tem como te achar, e é a única das oito que não depende de
          nenhuma outra tela. `alvo` é a persona, não um slug de acervo — o que se
          completa é a conta de quem está usando. */}
      <ConcluirMissao
        evento="perfil.completo"
        alvo={{ tipo: "perfil", id: "eu" }}
        chave={CHAVE_PERFIL_COMPLETO}
        titulo="Foto, uma linha sobre você e a sua cidade"
        rotulo="Marcar perfil como completo"
        rotuloFeito="Perfil completo"
      />

      <nav aria-label="Outros atalhos do perfil" className="perfil-lista">
        {DEMAIS.map((atalho) => (
          <Link key={atalho.href} href={atalho.href} className="perfil-item no-underline">
            <span className="perfil-item-rotulo tipo-detalhe">{atalho.rotulo}</span>
            <span className="perfil-item-descricao tipo-legenda">{atalho.descricao}</span>
          </Link>
        ))}
      </nav>

      {/* A FAIXA DE DISPOSIÇÃO DESCEU E FECHOU.
          
          Ela é o banner do topo de Descobrir (D-32) — fundo cheio, kicker e frase de
          destaque —, e no meio desta tela era o elemento mais chamativo de todos:
          gritava mais alto que Desafios e Carteira, que são o que a pessoa vem fazer
          aqui.
          
          Sem `permanente` ela usa o próprio comportamento que já tinha: mostra a escolha
          atual em uma linha e abre as pastilhas no botão «Escolher»/«Mudar». Aberta à
          força, o trilho de pastilhas sangrava pela borda arredondada do cartão e a
          última opção nascia cortada — um trilho que rola é legítimo no topo de
          Descobrir, onde ele encosta na borda da tela, e não dentro de uma caixa. */}
      <SeletorDisposicao modo="dropdown" />

      <section aria-label="Tema" className="perfil-tema">
        <p className="perfil-tema-rotulo tipo-micro">Tema</p>
        <SeletorDeTema />
      </section>
    </div>
  );
}
