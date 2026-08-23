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
 * O TEMA NÃO PASSA MAIS POR AQUI (23/08). Ele segue o sistema operacional e nada
 * mais: quem decide é a media query `prefers-color-scheme` em `tokens.css`, que
 * chega junto com a folha e não precisa de JavaScript nenhum.
 */
(function () {
  var raiz = document.documentElement;

  // O total vem do próprio HTML (`data-heroi-total`, escrito pelo layout a
  // partir da lista curada), então este arquivo não precisa saber quantas
  // imagens existem — e não há como as duas contagens divergirem.
  var total = Number(raiz.getAttribute("data-heroi-total") || 0);
  if (total > 1) raiz.setAttribute("data-heroi", String(Math.floor(Math.random() * total)));
})();
