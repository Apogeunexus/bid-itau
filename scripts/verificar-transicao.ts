/**
 * verificar-transicao.ts — a inferência de tipo de navegação, em casos.
 *
 * Sem isto a troca de tela vira palpite: aba deslizando, hub empilhando,
 * detalhe cruzando fade. Rode com `npx tsx scripts/verificar-transicao.ts`.
 */

import assert from "node:assert/strict"
import { normalizarCaminho, tipoDeNavegacao } from "../src/lib/movimento"

const casos: Array<[string, string, ReturnType<typeof tipoDeNavegacao>]> = [
  ["/descobrir", "/buscar", "nav-irma"],
  ["/descobrir/", "/buscar/", "nav-irma"],
  ["/acontece", "/salvos", "nav-irma"],
  ["/descobrir", "/apps", "nav-hub-abre"],
  ["/apps", "/descobrir", "nav-hub-fecha"],
  ["/apps", "/salvos", "nav-hub-fecha"],
  ["/apps", "/play", "nav-forward"],
  ["/play", "/apps", "nav-hub-abre"],
  ["/descobrir", "/evento/foo", "nav-forward"],
  ["/evento/foo", "/descobrir", "nav-back"],
  ["/evento/foo", "/evento/foo/sessoes", "nav-forward"],
  ["/evento/foo/sessoes", "/evento/foo", "nav-back"],
  ["/play", "/play/slug", "nav-forward"],
  ["/meu", "/meu/repertorio", "nav-forward"],
  ["/descobrir", "/descobrir/porque/x", "nav-forward"],
  ["/acontece", "/descobrir/porque/x", "nav-forward"],
  ["/play", "/cast", "nav-irma"],
  ["/play", "/descobrir", "nav-back"],
  ["/filtros", "/descobrir", "nav-back"],
  ["/descobrir", "/filtros", "nav-forward"],
  ["/descobrir", "/descobrir", "nav-irma"],
  ["/descobrir/porque/x", "/buscar", "nav-irma"],
  ["/buscar/frase", "/acontece", "nav-irma"],
  ["/descobrir/porque/x", "/descobrir", "nav-back"],
  ["/evento/foo", "/buscar", "nav-back"],
]

let falhas = 0
for (const [de, para, esperado] of casos) {
  const obtido = tipoDeNavegacao(de, para)
  if (obtido !== esperado) {
    falhas += 1
    console.error(`  FALHA ${de} → ${para}: ${obtido} (esperado ${esperado})`)
  } else {
    console.log(`  ok   ${de} → ${para}: ${esperado}`)
  }
}

assert.equal(normalizarCaminho("/descobrir/"), "/descobrir")
assert.equal(normalizarCaminho("/"), "/")
assert.equal(normalizarCaminho(""), "/")
console.log("  ok   normalizarCaminho")

if (falhas > 0) {
  console.error(`\nverificar-transicao: ${falhas} caso(s) falharam`)
  process.exit(1)
}
console.log(`\nverificar-transicao: ${casos.length} casos verdes`)
