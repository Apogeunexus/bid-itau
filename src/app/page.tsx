import { redirect } from "next/navigation";

/**
 * A raiz não é tela: ela leva para Descobrir, que é a porta do produto (D-12).
 *
 * Sob `output: "export"` (D-24) o redirecionamento é resolvido no build e sai no
 * artefato estático — não há servidor para emitir um 307. Confira em `out/index.html`.
 */
export default function Home() {
  redirect("/descobrir");
}
