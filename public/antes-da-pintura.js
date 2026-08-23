/*
 * antes-da-pintura.js — o tema escolhido, aplicado antes do primeiro pixel.
 *
 * POR QUE ISTO É UM ARQUIVO E NÃO UM SCRIPT INLINE. O truque padrão contra o
 * flash de tema errado é um `<script>` inline no topo do documento, escrito com
 * `dangerouslySetInnerHTML`. Aqui isso está fechado: quatro portões proíbem
 * `dangerouslySetInnerHTML` em todo `.ts`/`.tsx` do projeto, e é uma proibição
 * que vale a pena — ela vem de segurança, não de estilo. Os portões varrem
 * `src/`; um arquivo estático em `public/` é o endereço que sobra, e é honesto:
 * o conteúdo fica auditável em disco em vez de nascer de uma string interpolada.
 *
 * POR QUE ELE PRECISA RODAR ANTES DO REACT. O site é exportado estático — não
 * há servidor para ler um cookie e decidir o atributo do `<html>`. Se a escolha
 * de tema só chegasse na hidratação, quem escolheu escuro veria a página clara
 * pintar primeiro e virar depois, a cada navegação. A tag que carrega este
 * arquivo é o primeiro filho do `<body>` e NÃO leva `async`: assim ela bloqueia
 * o parser, roda antes de qualquer pintura, e o quadro errado nunca existe.
 *
 * O QUE ELE NÃO FAZ: decidir o tema. Sem nada no localStorage, ele não escreve
 * atributo nenhum e quem decide é a media query `prefers-color-scheme` em
 * tokens.css. Este arquivo só carrega uma ESCOLHA JÁ FEITA para dentro do
 * documento. É por isso que ele não precisa conhecer cor nenhuma.
 */
(function () {
  try {
    var tema = window.localStorage.getItem("agenda-cultural:tema");
    // Lista fechada, e não «o que estiver lá»: o localStorage é editável pelo
    // usuário, e um valor inventado viraria um seletor que não casa com nada —
    // o sintoma seria um tema que não muda, sem erro nenhum para investigar.
    if (tema === "claro" || tema === "escuro") {
      document.documentElement.setAttribute("data-tema", tema);
    }
  } catch (erro) {
    // localStorage bloqueado (modo privado, iframe de terceiro). O tema do
    // sistema atende, então isto degrada em vez de quebrar — mas degrada ALTO:
    // deixar passar calado esconderia «a escolha do usuário não está sendo
    // respeitada» atrás de uma tela que parece só estar com o tema errado.
    console.warn(
      "[tema] localStorage indisponível; seguindo o tema do sistema em vez da escolha salva.",
      erro,
    );
  }
})();
