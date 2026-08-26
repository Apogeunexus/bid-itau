/**
 * pontos.ts — a economia do programa: configuração, regras, missões e emblemas.
 *
 * ESTE ARQUIVO É A ECONOMIA INTEIRA, de propósito. Quanto vale um documentário,
 * quanto vale estar presente, quanto vale sair da própria linguagem — tudo num
 * lugar só, legível por quem não programa. Espalhar isso pelas telas faria cada
 * ajuste de balanceamento virar uma caçada, e balanceamento é o que mais muda.
 *
 * ELE NÃO IMPORTA O GRAFO (DP-F). São literais tipados; o motor é cliente e o
 * grafo tem 23 MB. O que o motor precisa saber sobre o acervo chega pelo contexto
 * do evento, calculado por quem já tem o dado.
 *
 * A ESCALA, e por que ela é esta. Uma pessoa engajada faz num mês algo como 4
 * audiovisuais, 4 episódios, 10 matérias, 1 curso, 1 presença e 20 dias de
 * acesso — o que soma perto de 140 fichas antes de qualquer bônus. A cortesia
 * mais barata da loja custa 90 e a de sessão custa 180: meio mês para o primeiro
 * resgate, um mês para o resgate que a pessoa quer. Escala única para a loja
 * inteira, porque duas escalas destravam uma prateleira e travam a outra.
 */

import type {
  ConfiguracaoDoPrograma,
  EmblemaDefinido,
  MissaoDefinida,
  Regra,
} from "@/lib/pontos/tipos";

/* ── Configuração ────────────────────────────────────────────────────────── */

export const CONFIG: ConfiguracaoDoPrograma = {
  nome: "Repertório",
  termos: {
    ficha: "ficha",
    fichaPlural: "fichas",
    percurso: "percurso",
    nivel: "nível",
  },

  /**
   * Os nomes vêm da metáfora que o produto inteiro já usa — caminhada, trilha,
   * travessia (`dados/caminhada.ts`, `dados/repertorio.ts`). Nível de app que se
   * chama «Bronze/Prata/Ouro» pertence a programa de milhagem; aqui ele descreve
   * alguém que anda por um acervo.
   */
  nomesDeNivel: ["Curioso", "Frequentador", "Andarilho", "Trilheiro", "Repertório vivo"],
  limiaresDeNivel: [0, 250, 700, 1500, 2800],

  temporada: {
    titulo: "Temporada Travessias",
    descricao:
      "A cada temporada, as linguagens que você ainda não atravessou valem mais. O nível e os emblemas são permanentes; o que reinicia é a contagem da temporada.",
    diasRestantes: 18,
  },

  /**
   * O bônus vale mais que o próprio item na maioria dos casos, e é intencional:
   * o programa não quer que você veja mais do mesmo, quer que você saia do que já
   * conhece. Um documentário da sua linguagem rende 5 fichas; o primeiro de uma
   * linguagem nova rende 35.
   */
  bonus: { linguagemNova: 30, territorioNovo: 25 },
};

/* ── Regras ──────────────────────────────────────────────────────────────── */

/**
 * O MESMO ITEM NUNCA CONTA DUAS VEZES, e isso não está escrito aqui: mora em
 * `UMA_VEZ_POR_ITEM`, no motor, porque precisa barrar o evento inteiro — regra,
 * missão e sequência juntas. Enquanto o freio era por regra, reassistir o mesmo
 * documentário três vezes fechava sozinho a missão de temporada.
 *
 * OS TETOS DIÁRIOS são o degrau acima: limitam o VOLUME mesmo quando cada item é
 * legítimo e diferente. Ler 40 matérias num dia não é leitura.
 */
export const REGRAS: Regra[] = [
  {
    id: "r-play",
    versao: 1,
    descreve: "Terminar um filme, série ou documentário no Play",
    quando: "play.midia.concluida",
    entao: [
      { conceder: { ativo: "percurso", valor: 50, motivo: "Audiovisual concluído" } },
      { conceder: { ativo: "ficha", valor: 5, motivo: "Audiovisual concluído" } },
    ],
  },
  {
    id: "r-cast",
    versao: 1,
    descreve: "Ouvir um episódio do Cast até o fim",
    quando: "cast.episodio.concluido",
    entao: [
      { conceder: { ativo: "percurso", valor: 40, motivo: "Episódio concluído" } },
      { conceder: { ativo: "ficha", valor: 4, motivo: "Episódio concluído" } },
    ],
  },
  {
    id: "r-leitura",
    versao: 1,
    descreve: "Ler uma matéria inteira",
    quando: "leitura.materia.concluida",
    maxPorDia: 5,
    entao: [
      { conceder: { ativo: "percurso", valor: 25, motivo: "Matéria lida" } },
      { conceder: { ativo: "ficha", valor: 2, motivo: "Matéria lida" } },
    ],
  },
  {
    id: "r-aula",
    versao: 1,
    descreve: "Concluir uma aula de um curso",
    quando: "curso.aula.concluida",
    entao: [
      { conceder: { ativo: "percurso", valor: 60, motivo: "Aula concluída" } },
      { conceder: { ativo: "ficha", valor: 6, motivo: "Aula concluída" } },
    ],
  },
  {
    id: "r-curso",
    versao: 1,
    descreve: "Concluir um curso inteiro",
    quando: "curso.concluido",
    entao: [
      { conceder: { ativo: "percurso", valor: 200, motivo: "Curso concluído" } },
      { conceder: { ativo: "ficha", valor: 25, motivo: "Curso concluído" } },
    ],
  },
  {
    /**
     * O MAIOR VALOR DO PROGRAMA, e não por acaso: estar presente é a única coisa
     * que a plataforma não consegue substituir. Um app cultural que pague mais por
     * assistir em casa do que por ir ao teatro está otimizando contra si mesmo.
     */
    id: "r-presenca",
    versao: 1,
    descreve: "Confirmar presença num evento com o código do produtor",
    quando: "ocorrencia.presenca.confirmada",
    entao: [
      { conceder: { ativo: "percurso", valor: 150, motivo: "Presença confirmada" } },
      { conceder: { ativo: "ficha", valor: 20, motivo: "Presença confirmada" } },
    ],
  },
  {
    id: "r-salvar",
    versao: 1,
    descreve: "Salvar uma sessão na agenda",
    quando: "ocorrencia.salva",
    maxPorDia: 5,
    entao: [{ conceder: { ativo: "percurso", valor: 10, motivo: "Sessão salva na agenda" } }],
  },
  {
    /**
     * Um dia distinto, não uma sessão. Abrir o app vinte vezes num sábado é um
     * sábado; abrir em três dias diferentes é hábito. O motor já garante o «uma vez
     * por dia» ao registrar a chave do dia; o teto aqui é cinto e suspensório.
     */
    id: "r-retorno",
    versao: 1,
    descreve: "Voltar ao app num dia em que ainda não tinha entrado",
    quando: "acesso.dia.distinto",
    maxPorDia: 1,
    entao: [
      { conceder: { ativo: "percurso", valor: 15, motivo: "Mais um dia de repertório" } },
      { conceder: { ativo: "ficha", valor: 2, motivo: "Mais um dia de repertório" } },
    ],
  },
  {
    id: "r-guardar-publicacao",
    versao: 1,
    descreve: "Guardar uma publicação para ler depois",
    quando: "comunidade.publicacao.salva",
    maxPorDia: 5,
    entao: [{ conceder: { ativo: "percurso", valor: 5, motivo: "Publicação guardada" } }],
  },
  {
    id: "r-comentar",
    versao: 1,
    descreve: "Responder alguém na comunidade",
    quando: "comunidade.comentario.criado",
    maxPorDia: 3,
    entao: [
      { conceder: { ativo: "percurso", valor: 20, motivo: "Resposta na comunidade" } },
      { conceder: { ativo: "reputacao", valor: 6, motivo: "Ajuda a outra pessoa" } },
    ],
  },
  {
    id: "r-reagir",
    versao: 1,
    descreve: "Reagir a uma publicação",
    quando: "comunidade.reacao.dada",
    maxPorDia: 10,
    entao: [{ conceder: { ativo: "percurso", valor: 3, motivo: "Reconhecimento a alguém" } }],
  },
  {
    id: "r-assinar",
    versao: 1,
    descreve: "Assinar uma comunidade do marketplace",
    quando: "comunidade.assinada",
    maxPorDia: 3,
    entao: [{ conceder: { ativo: "percurso", valor: 10, motivo: "Entrou numa comunidade" } }],
  },
  {
    id: "r-disposicoes",
    versao: 1,
    descreve: "Dizer do que você gosta no início",
    quando: "perfil.disposicoes.escolhidas",
    maxPorPersona: 1,
    entao: [
      { conceder: { ativo: "percurso", valor: 60, motivo: "Repertório declarado" } },
      { conceder: { ativo: "ficha", valor: 10, motivo: "Boas-vindas" } },
    ],
  },
];

/* ── Missões ─────────────────────────────────────────────────────────────── */

/**
 * TODA MISSÃO TEM `rota`. Uma missão que pede «ouça um episódio» e não leva ao
 * Cast transfere para a pessoa o trabalho de achar o Cast, e esse trabalho custa
 * mais que a recompensa. Missão sem porta é beco.
 */
export const MISSOES: MissaoDefinida[] = [
  {
    id: "m-dia-leitura",
    tipo: "diaria",
    titulo: "Leia uma matéria hoje",
    descricao: "Uma matéria inteira do acervo editorial. Dois minutos.",
    alvo: 1,
    avancaCom: ["leitura.materia.concluida"],
    percurso: 20,
    fichas: 2,
    minutos: 2,
    expiraEm: "dia",
    rota: "/noticias",
  },
  {
    id: "m-sem-travessia",
    tipo: "semanal",
    titulo: "Atravesse uma linguagem nova",
    descricao: "Termine algo de uma linguagem que ainda não está no seu repertório.",
    alvo: 1,
    avancaCom: ["play.midia.concluida", "cast.episodio.concluido", "leitura.materia.concluida"],
    percurso: 120,
    fichas: 15,
    minutos: 20,
    expiraEm: "semana",
    rota: "/descobrir",
  },
  {
    id: "m-sem-social",
    tipo: "social",
    titulo: "Responda alguém na comunidade",
    descricao: "Uma resposta que ajude quem perguntou.",
    alvo: 1,
    avancaCom: ["comunidade.comentario.criado"],
    percurso: 50,
    fichas: 5,
    minutos: 3,
    expiraEm: "semana",
    rota: "/comunidade",
  },
  {
    id: "m-sem-agenda",
    tipo: "semanal",
    titulo: "Guarde uma sessão para ir",
    descricao: "Salve na agenda alguma coisa que acontece perto de você.",
    alvo: 1,
    avancaCom: ["ocorrencia.salva"],
    percurso: 40,
    fichas: 4,
    minutos: 2,
    expiraEm: "semana",
    rota: "/acontece",
  },
  {
    id: "m-territorio",
    tipo: "territorio",
    titulo: "Conheça outro estado",
    descricao:
      "Descubra algo de uma unidade da federação que ainda não está no seu mapa. São 25 no acervo — e duas que ainda não existem nele.",
    alvo: 1,
    avancaCom: ["play.midia.concluida", "leitura.materia.concluida", "ocorrencia.salva"],
    percurso: 90,
    fichas: 12,
    minutos: 10,
    expiraEm: "semana",
    rota: "/mapa",
  },
  {
    id: "m-temporada-trilha",
    tipo: "temporada",
    titulo: "Complete uma trilha inteira",
    descricao: "Do rap ao teatro documentário: três passos, três linguagens.",
    alvo: 3,
    avancaCom: ["play.midia.concluida", "leitura.materia.concluida", "cast.episodio.concluido"],
    percurso: 300,
    fichas: 40,
    minutos: 0,
    expiraEm: "temporada",
    rota: "/trilha/do-rap-ao-teatro-documentario",
  },
];

/* ── Emblemas ────────────────────────────────────────────────────────────── */

/**
 * `comoGanhar` é obrigatório e aparece na tela ANTES do emblema ser ganho.
 * Emblema misterioso é enfeite: a pessoa vê um cadeado, não entende o que fazer e
 * ele deixa de ser meta. Dito na tela, ele vira o mapa do que o produto quer.
 */
export const EMBLEMAS: EmblemaDefinido[] = [
  {
    id: "e-sequencia-4",
    titulo: "Mês de repertório",
    descricao: "Quatro semanas seguidas com pelo menos um gesto cultural.",
    criterio: "sequencia_4",
    comoGanhar: "Termine alguma coisa — ou vá a algum lugar — em quatro semanas seguidas.",
  },
  {
    id: "e-nivel-3",
    titulo: "Andarilho",
    descricao: "Chegou ao terceiro nível de percurso.",
    criterio: "nivel_3",
    comoGanhar: "Acumule 700 de percurso.",
  },
  {
    id: "e-linguagens-8",
    titulo: "Oito linguagens",
    descricao: "Atravessou oito das 33 linguagens do acervo.",
    criterio: "linguagens_8",
    comoGanhar: "Termine algo de oito linguagens diferentes. O bônus de travessia conta.",
  },
  {
    id: "e-territorios-5",
    titulo: "Cinco estados",
    descricao: "Alcançou cinco unidades da federação.",
    criterio: "territorios_5",
    comoGanhar: "Descubra algo de cinco estados diferentes — o mapa mostra quais faltam.",
  },
  {
    id: "e-presenca-1",
    titulo: "Estive lá",
    descricao: "Confirmou presença num evento pela primeira vez.",
    criterio: "presencas_1",
    comoGanhar: "Vá a uma sessão e leia o código que o produtor mostra no local.",
  },
  {
    id: "e-reputacao-50",
    titulo: "Voz da comunidade",
    descricao: "Cinquenta de reputação ajudando outras pessoas.",
    criterio: "reputacao_50",
    comoGanhar: "Responda, publique e reconheça o trabalho dos outros na comunidade.",
  },
  {
    id: "e-comunidades-3",
    titulo: "Em rede",
    descricao: "Assina três comunidades do marketplace.",
    criterio: "comunidades_3",
    comoGanhar: "Entre em três comunidades de produtores ou organizações.",
  },
];
