/*
 * antes-da-pintura.js — o hero sorteado antes do primeiro pixel.
 *
 * POR QUE ISTO É UM ARQUIVO E NÃO UM SCRIPT INLINE. O truque padrão para rodar
 * antes da hidratação é um `<script>` inline no topo do documento, escrito com
 * `dangerouslySetInnerHTML`. Aqui isso está fechado: quatro portões proíbem
 * `dangerouslySetInnerHTML` em todo `.ts`/`.tsx` do projeto, e é uma proibição
 * que vale a pena — ela vem de segurança, não de estilo. Os portões varrem
 * `src/`; um arquivo estático em `public/` é o endereço que sobra, e é honesto:
 * o conteúdo fica auditável em disco em vez de nascer de uma string interpolada.
 *
 * POR QUE ELE PRECISA RODAR ANTES DO REACT. Sortear depois da hidratação faria a
 * primeira foto pintar e trocar, a cada carregamento. A tag que carrega este
 * arquivo é o primeiro filho do `<body>` e NÃO leva `async`: assim ela bloqueia
 * o parser, roda antes de qualquer pintura, e o quadro errado nunca existe.
 *
 * O TEMA VOLTOU A PASSAR POR AQUI (23/08, pedido do cliente): o menu da conta
 * oferece sistema, claro e escuro. O padrão continua sendo o sistema operacional
 * — sem nada guardado, nenhum atributo é escrito e quem decide é a media query
 * `prefers-color-scheme` de `tokens.css`. A escolha só existe quando alguém a
 * fez, e ela é aplicada AQUI para não haver lampejo entre a pintura e o React.
 */
(function () {
  var raiz = document.documentElement;

  try {
    var tema = window.localStorage.getItem("agenda-cultural:tema");
    // Só os dois valores conhecidos entram. Storage é editável por quem avalia,
    // e um valor estranho vira atributo que nenhuma regra casa — o efeito seria
    // «o tema parou de funcionar», sem erro nenhum na tela.
    if (tema === "claro" || tema === "escuro") raiz.setAttribute("data-tema", tema);
  } catch (erro) {
    // smaug-ignore empty-catch: storage bloqueado (modo privado, iframe) é o
    // caminho esperado aqui — o tema cai no do sistema, que é o padrão. Escrever
    // no console antes da primeira pintura seria ruído em toda carga.
    void erro;
  }

  // O total vem do próprio HTML (`data-heroi-total`, escrito pelo layout a
  // partir da lista curada), então este arquivo não precisa saber quantas
  // imagens existem — e não há como as duas contagens divergirem.
  var total = Number(raiz.getAttribute("data-heroi-total") || 0);
  if (total > 1) raiz.setAttribute("data-heroi", String(Math.floor(Math.random() * total)));
})();
