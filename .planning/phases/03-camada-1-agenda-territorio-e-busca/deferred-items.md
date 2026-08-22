
## [03-02] `recarregar()` de `scripts/navegador.mjs` pode medir o documento antigo

**Achado durante:** Task 3, roteiro por clique sobre `/salvos/`.

Em 5 execuções do roteiro, 1 falhou no passo 1 — o estado vazio não tinha a semeadura —
e as 4 seguintes passaram sem alteração nenhuma de código. Duas causas possíveis, as duas
fora deste plano:

1. `out/` é compartilhado entre os quatro executores desta onda; um `npm run build`
   concorrente esvazia e regrava o diretório, e o servidor estático serve 404 na janela.
   Confirmado que os outros planos estavam escrevendo no mesmo working tree.
2. `recarregar()` espera `Page.loadEventFired` e depois `assentar()`, que sonda
   `document.readyState`. Entre o `Page.reload` e a troca de documento, o documento ANTIGO
   ainda responde `complete`, então `assentar` pode voltar cedo e a medição seguinte cair
   no meio da carga.

**Não corrigido aqui:** `scripts/navegador.mjs` é compartilhado e o script permanente da
fase é do plano 03-07. Fica registrado para lá — a correção seria conferir a troca de
`document` (por exemplo um carimbo em `window` antes do reload) em vez de sondar
`readyState`.


## De 03-03 (mapa) — 2026-08-22

- **Índice do git possivelmente sujo para `src/app/(app)/evento/[slug]/page.tsx`.** No commit
  `1e700e2` o git imprimiu `error: short read while indexing src/app/(app)/evento/[slug]/page.tsx`
  — o arquivo estava *dataless* por eviction de iCloud. Conferido que o commit NÃO o alterou
  (mesmos 11.539 B em `HEAD` e `HEAD~1`) e que só os seis arquivos de 03-03 entraram. Quem
  commitar em seguida deve conferir `git diff-tree --name-status -r HEAD` antes de seguir.
  Fora do escopo de 03-03: o arquivo é de outro plano.
- **Eviction de iCloud ativa com o volume a 96%.** Dezenas de arquivos leem zero bytes apesar
  de `stat` reportar tamanho; `brctl download` não os materializa. `package.json` seguia vazio
  ao fim de 03-03, o que quebra `npm run build`, `npx` e `npx tsx`. Não é defeito de código.
- **6 possíveis quebras de DP-F em arquivos de outros planos** (`acontece.tsx`,
  `explicacao.tsx`, `repertorio.tsx`, `salvos.tsx`, `selecao-ocorrencia.tsx`, `trilha.tsx`
  alcançando `@/dados/grafo` por `agenda.ts`/`explicacao.ts`/`repertorio.ts`/`alerta.ts`/
  `trilha.ts`). A varredura NÃO distinguiu `import type`, que é apagado no build — pode ser
  falso positivo inteiro. Não investigado: fora do escopo. Vale uma varredura própria que
  exclua importação só de tipo.


## De 03-07 (verificação da fase) — 2026-08-22

- **REGRESSÃO MEDIDA — `npm run verificar-comentado` está VERMELHO por causa da fase 3.**
  Determinístico: 3 execuções, 3 falhas, sempre `0 erro, 2 aviso em 7 navegações`. O aviso é
  `The resource … was preloaded using link preload but not used within a few seconds`.
  **Causa medida, não suposta:** os chunks avisados são `1oqzhxrvom0hu.css` →
  `src/estilos/agenda.css` (plano 03-01), `3qdhyug8rb46p.css` → `src/estilos/busca.css`
  (03-04) e `44hhr15924epc.css` → `src/estilos/salvos.css` (03-02) — atribuição feita pelo
  primeiro seletor de classe do chunk exportado. A barra de abas aponta para `/acontece` e
  `/buscar` em **toda** tela e o router do Next faz prefetch do CSS dessas rotas; como a
  pessoa não navega em ~3s, o Chrome avisa. Antes da fase 3 nenhuma rota tinha CSS próprio,
  então não havia preload sem uso e o número era 0.
  **A prova de que a causa é a fase 3 e não a rota:** `/play/`, tela-esqueleto da FASE 1 que
  esta fase não tocou, emite 2 diagnósticos — os dois de folhas da fase 3. Medir *em que rota
  o aviso aparece* responde a pergunta errada; a pergunta é *qual CSS ficou sem uso*.
  **Não corrigido aqui:** o plano 03-07 declara `src/` somente leitura. A correção mora nos
  arquivos de 03-01/03-02/03-04 ou na estratégia de prefetch da barra de abas, e é decisão de
  quem ler o relatório. Caminhos possíveis: consolidar as folhas de rota numa só, ou
  `prefetch={false}` nos `<Link>` da barra de abas.
- **`npm run verificar-fase3` sai com código 1 por causa disso**, com 92 gates verdes e essa
  única falha. O limiar **não** foi relaxado, que é a régua registrada pela 02-05: seis
  ampliações de gate e nenhuma relaxação.
- **`scripts/verificar-fase2.mjs` passa (67 gates, 26 navegações) por PACING, não por
  ausência do defeito.** O aviso só sai depois de ~3s parado numa página; a sessão da fase 2 é
  curta demais para disparar. O 0/0 dela e o 0/0 da fase 3 nunca foram comparáveis.
- **Duplicação de ajudantes de leitura de fonte.** `semComentarios`, `importsDe`,
  `resolverModulo` e `arquivosDe` estão copiados de `verificar-fase2.mjs` para
  `verificar-fase3.mjs` porque aquele arquivo não os exporta e o plano 03-07 o declara
  somente leitura. Duas cópias divergem na primeira correção — extrair para um módulo
  compartilhado é trabalho de quem puder tocar os dois.
