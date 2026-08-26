import Link from "next/link";

/**
 * redacao-navegacao.tsx — a barra de rotas da superfície Redação.
 *
 * POR QUE ELA EXISTE. `menu-lateral.tsx` não lista `/redacao/*`: quem chega a estas telas
 * digita a URL. O menu não é território desta sessão e o pedido para incluir a Redação está
 * aberto — mas deixar as telas sem caminho entre si enquanto ele não é atendido criaria um
 * beco por omissão, e esta fase decidiu não ter becos. A barra resolve o problema real (as
 * telas se alcançam) sem tocar no arquivo alheio; quando a entrada no menu lateral existir,
 * ela continua útil como navegação de segundo nível, que é o que ela é.
 *
 * COMPONENTE DE SERVIDOR, sem estado: a rota atual chega por prop de quem renderiza, em vez
 * de ser lida do `usePathname`. Um `"use client"` aqui empurraria cada tela de bastidor para
 * a fronteira de hidratação só para pintar um link em negrito.
 */
export interface RotaDaRedacao {
  href: string;
  rotulo: string;
}

/** As rotas que EXISTEM. Uma entrada aqui sem tela do outro lado seria um link morto. */
export const ROTAS_DA_REDACAO: readonly RotaDaRedacao[] = [
  { href: "/redacao/trilha/", rotulo: "Trilha curada" },
  { href: "/redacao/pontes/", rotulo: "Arestas de sentido" },
  { href: "/redacao/destaque/", rotulo: "Destaque do feed" },
  { href: "/redacao/tesauro/", rotulo: "Tesauro" },
  { href: "/redacao/materia/", rotulo: "Redação editorial" },
  { href: "/redacao/assinaturas/", rotulo: "O que eu assinei" },
];

export function RedacaoNavegacao({ atual }: { atual: string }) {
  return (
    <nav className="redacao-navegacao" aria-label="telas da Redação">
      {ROTAS_DA_REDACAO.map((r) => {
        const aqui = r.href === atual;
        return (
          <Link
            key={r.href}
            href={r.href}
            className="studio-pastilha redacao-navegacao-item"
            data-rota-redacao={r.href}
            data-atual={aqui ? "sim" : "nao"}
            // A tela em que já se está não é um destino: `aria-current` diz isso a quem
            // navega por leitor de tela, e o atributo de dado diz ao gate.
            aria-current={aqui ? "page" : undefined}
          >
            {r.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
