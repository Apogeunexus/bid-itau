# Itens adiados — fase 2

Achados fora da fronteira do plano que os encontrou. Nenhum foi corrigido no plano de
origem, de propósito: mexer em arquivo de outro plano durante execução paralela é como se
perde uma onda inteira.

---

## 1. Nenhuma rota tem favicon — 404 em toda página

- **Achado por:** executor do plano 02-02, medindo as 72 páginas de explicação em Chrome
  headless.
- **O que é:** não existe `public/favicon.ico` nem `src/app/icon.*`. O navegador pede
  `/favicon.ico` sozinho em toda navegação e recebe 404, que entra no console como
  `error: Failed to load resource: the server responded with a status of 404`.
- **Por que importa agora:** o gate (c) do plano 02-05 exige **zero erro e zero aviso de
  console em toda a sessão**. Com isto no lugar, ele falha em todas as rotas — inclusive nas
  da fase 1, que estavam verdes.
- **Fora da fronteira de quem achou:** `public/` e `src/app/icon.*` não estão em
  `files_modified` do 02-02.
- **Correção sugerida:** um `src/app/icon.svg` com o `\` do manual resolve a rota inteira
  pelo App Router, sem tocar em `public/`. Cabe ao 02-05, que é dono do gate, ou a um plano
  de acabamento.

---

## 2. `dados/normalizar.py` foi editado durante a onda 2

- **Achado por:** executor do plano 02-02, ao ler o log.
- **O que é:** o commit `ad5c1d7` altera `dados/normalizar.py`, e `dados/` foi declarado
  somente-leitura na execução desta fase. O conteúdo da correção é legítimo (preservar os
  `false` da acessibilidade), e `src/dados/gerado/*.json` **não** foi regerado — verificado
  com `git diff --stat HEAD -- src/dados/gerado`, vazio.
- **Por que importa:** se alguém rodar `npm run gerar-grafo` a partir daqui, o grafo muda e
  todas as medições das fases 1 e 2 passam a descrever outro acervo. A regeração precisa ser
  um ato deliberado, com nova rodada de medição, não um efeito colateral.
