/**
 * icones.tsx — o traço único da navegação principal.
 *
 * Nasceu quando a barra inferior (2026-08-23) passou a precisar dos
 * mesmos cinco ícones que o menu lateral já desenhava. Dois arquivos com o
 * mesmo `<path>` divergem na primeira edição — e o sintoma seria a bússola de
 * Descobrir com um traço na barra e outro no menu, na mesma tela.
 *
 * São ELEMENTOS, não componentes, porque é assim que os itens de navegação
 * guardam o ícone: um campo `icone?: React.ReactNode` na estrutura do item.
 */

const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function Icone({
  children,
  className = "size-6 shrink-0",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className={className}>
      {children}
    </svg>
  );
}

export const ICONE_DESCOBRIR = (
  <Icone>
    <circle cx="12" cy="12" r="9" {...traco} />
    <path d="M15.5 8.5 10.9 10.9 8.5 15.5l4.6-2.4 2.4-4.6Z" {...traco} />
  </Icone>
);

export const ICONE_BUSCAR = (
  <Icone>
    <circle cx="11" cy="11" r="6.5" {...traco} />
    <path d="m15.8 15.8 4 4" {...traco} />
  </Icone>
);

export const ICONE_ACONTECE = (
  <Icone>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...traco} />
    <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" {...traco} />
  </Icone>
);

export const ICONE_PLAY = (
  <Icone>
    <circle cx="12" cy="12" r="9" {...traco} />
    <path d="M10.2 8.6v6.8L15.8 12l-5.6-3.4Z" {...traco} />
  </Icone>
);

export const ICONE_CAST = (
  <Icone>
    <rect x="9" y="3.5" width="6" height="11" rx="3" {...traco} />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" {...traco} />
  </Icone>
);

export const ICONE_NOTICIAS = (
  <Icone>
    <path d="M4 5.5h13v13a2 2 0 0 0 2-2v-9" {...traco} />
    <path d="M4 5.5v11a2 2 0 0 0 2 2h13M7.5 9h6M7.5 12h6M7.5 15h4" {...traco} />
  </Icone>
);

export const ICONE_MUSEU = (
  <Icone>
    <path d="m12 3.5 8.5 4.5H3.5L12 3.5ZM5 8v8M9.5 8v8M14.5 8v8M19 8v8M3.5 19.5h17" {...traco} />
  </Icone>
);

export const ICONE_IA = (
  <Icone>
    <path
      d="M12 4.5c.7 3.6 2.9 5.8 6.5 6.5-3.6.7-5.8 2.9-6.5 6.5-.7-3.6-2.9-5.8-6.5-6.5 3.6-.7 5.8-2.9 6.5-6.5Z"
      {...traco}
    />
    <path
      d="M18.5 15.5c.3 1.5 1.2 2.4 2.7 2.7-1.5.3-2.4 1.2-2.7 2.7-.3-1.5-1.2-2.4-2.7-2.7 1.5-.3 2.4-1.2 2.7-2.7Z"
      {...traco}
    />
  </Icone>
);

export const ICONE_CURSOS = (
  <Icone>
    <path d="m12 5 9 4-9 4-9-4 9-4Z" {...traco} />
    <path d="M6.5 10.8v4.7c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.7M21 9v5" {...traco} />
  </Icone>
);

export const ICONE_MAPA = (
  <Icone>
    <path d="M12 20.5s6.5-5.4 6.5-10a6.5 6.5 0 0 0-13 0c0 4.6 6.5 10 6.5 10Z" {...traco} />
    <circle cx="12" cy="10.3" r="2.3" {...traco} />
  </Icone>
);

export const ICONE_SALVOS = (
  <Icone>
    <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-6-3.8-6 3.8v-14a1 1 0 0 1 1-1Z" {...traco} />
  </Icone>
);

export const ICONE_PERFIL = (
  <Icone>
    <circle cx="12" cy="8.5" r="3.8" {...traco} />
    <path d="M4.8 20c.6-3.7 3.6-5.8 7.2-5.8s6.6 2.1 7.2 5.8" {...traco} />
  </Icone>
);

/** Os cursores deslizantes dos filtros — a porta de /filtros na busca de Descobrir. */
export const ICONE_FILTROS = (
  <Icone>
    <path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" {...traco} />
    <circle cx="15" cy="7.5" r="2" {...traco} />
    <circle cx="9" cy="16.5" r="2" {...traco} />
  </Icone>
);

/* ---------------------------------------------------------------------------
 * Os três glifos do SELO dos cartazes do hub (referência de 23/08).
 *
 * O selo é o disco no canto de cada cartaz, e ele diz — antes do toque — o que
 * acontece do outro lado. Quem escolhe qual vai em qual cartaz é `apps.ts`, no
 * campo `selo`; aqui mora só o traço.
 * ------------------------------------------------------------------------- */

/** «Entrar»: a seta que não promete nada além de atravessar. */
export const ICONE_SETA = (
  <Icone>
    <path d="M4.5 12h14M12.8 6.2 18.5 12l-5.7 5.8" {...traco} />
  </Icone>
);

/** «Tocar»: o triângulo CHEIO. `ICONE_PLAY` desenha o círculo junto, e dentro do
 *  selo — que já é um disco — ele viraria um segundo anel concêntrico. */
export const ICONE_TOCAR = (
  <Icone>
    <path
      d="M8.8 5.9 18.6 12l-9.8 6.1V5.9Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinejoin="round"
    />
  </Icone>
);

/** «Ouvir»: a onda do áudio. É o selo do Cast, e não o microfone de
 *  `ICONE_CAST` — o cartaz não convida a gravar, convida a dar play. */
export const ICONE_ONDA = (
  <Icone>
    <path d="M4 10.5v3M8 7.2v9.6M12 4.5v15M16 7.2v9.6M20 10.5v3" {...traco} />
  </Icone>
);

/** O botão que abre o hub — quatro campos, que é o que o hub mostra. */
export const ICONE_APPS = (
  <Icone>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" {...traco} />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" {...traco} />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" {...traco} />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" {...traco} />
  </Icone>
);

/** Chevron da faixa de datas em Acontece — o mesmo traço nas duas direções. */
export const ICONE_CHEVRON_ESQUERDA = (
  <Icone>
    <path d="M15 5.5 8.5 12 15 18.5" {...traco} />
  </Icone>
);

export const ICONE_CHEVRON_DIREITA = (
  <Icone>
    <path d="M9 5.5 15.5 12 9 18.5" {...traco} />
  </Icone>
);

/** Relógio da meta do cartão de agenda. */
export const ICONE_RELOGIO = (
  <Icone>
    <circle cx="12" cy="12" r="8" {...traco} />
    <path d="M12 8v4.5l3 1.5" {...traco} />
  </Icone>
);

/** O triângulo do alerta de sessão alterada. */
export const ICONE_ALERTA = (
  <Icone>
    <path d="M12 4.5 20.5 19H3.5L12 4.5Z" {...traco} />
    <path d="M12 10v4M12 16.5h.01" {...traco} />
  </Icone>
);

