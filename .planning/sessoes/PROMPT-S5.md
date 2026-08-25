# Prompt — S5 · Editor / Curador

Cole numa sessão nova, com o diretório em `agenda-cultural-br2`.

---

Você vai construir a **S5 · Editor / Curador** — a superfície **Redação** do
`agenda-cultural-br2`, proposta ao RFP da Fundação Itaú / Itaú Cultural.

## Leia primeiro, nesta ordem

1. **`.planning/sessoes/PROTOCOLO.md`** — as regras das seis sessões
2. **`.planning/sessoes/ONTOLOGIA-E-ACESSOS.md`** — a análise ontológica compartilhada
3. **`.planning/sessoes/S5-EDITOR.md`** — o seu PRD. **As seções 1 e 2 são a análise
   ontológica específica do Editor**
4. `src/dados/redacao.ts`, da linha 795 em diante — `PassoDoEditor`, `TrilhaDoEditor`,
   `passosParaEditor`, `SugestaoDeProximoPasso`, `catalogoParaArrastar`. **Leia os
   comentários, não só o código** — eles explicam decisões que você não deve desfazer
5. `src/dados/trilha.ts` — `trilhaEhPublicavel` e as quatro regras

O seu arquivo de estado é **`.planning/estado/S5.md`**.

## Espere a liberação

A S3 extrai `src/dados/moderacao.ts` de `redacao.ts` na primeira tarefa dela. **Não comece
antes desse commit.** A sessão de controle avisa; confira em `.planning/PAINEL.md`.

## O portão central da sessão

`PassoDoEditor.motivo` **é o mesmo objeto** que `/trilha/[slug]/` imprime no selo público.
Não é cópia, não é reformatação, não tem prefixo. A suíte compara os dois **caractere a
caractere**. Não reimplemente a travessia: construa sobre `passosDaTrilha` e
`trilhaCompletaPorSlug`.

## Comece pela E1

Ela fixa o mecanismo que a E3 e a E5 copiam — motivo obrigatório, prévia do selo público,
assinatura — e é onde o portão central se estabelece.

## Três coisas que você não pode substituir

- **A sugestão de próximo passo é travessia do grafo, não modelo.** Determinística, com a
  frase da própria aresta como justificativa, e nada entra sem clique humano
- **O catálogo diz «N de 7.810», nunca «o grafo completo».** 150 candidatos, regra do
  recorte declarada por extenso
- **As quatro regras de publicabilidade vêm de `trilhaEhPublicavel`**, da fase 2. Não as
  reescreva

## A fronteira ética

Autorar uma ponte de sentido — o rap dialoga com o slam — é afirmação editorial, rotulada e
defensável. Autorar fato sobre pessoa real seria outra coisa, e a equipe já recusou isso
explicitamente. Toda aresta que você escrever carrega **motivo em português legível e
assinatura**. O tipo base obriga `motivo` só em `semelhante_a`; **esta sessão obriga em
todas**.

## Segregação

Você **não** modera — a fila é da S3; você recebe o termo encaminhado. **Não** aprova a
própria promoção — é o Admin. **Não** dispara newsletter — a autorização é do Admin; a pauta
é sua.

## Restrições

- **DP-F** — `redacao.ts` alcança 23 MB. `TETO_DO_CATALOGO = 150`
- **Duas visões, um componente.** A E1 é a única tela do projeto com **três colunas** na web:
  catálogo, trilha e prévia mobile do selo

## Sua pasta

`(bastidor)/redacao/`, `componentes/redacao-*`, o que sobrou de `src/dados/redacao.ts`,
`src/estilos/redacao.css` — que **já existe e já está importado**. Você não toca em
`globals.css`.

## Ordem

Seção 10 do PRD — 10 tarefas. Tarefas 5, 6 e 7 são independentes entre si.

## Ao fim de CADA tarefa — não só no fim da sessão

Este é o ritual que mantém a sessão de controle informada. Ele não é opcional e não é só
para marcos: é **a cada tarefa concluída**, nas quatro etapas, nesta ordem.

1. **`npm run checar`** verde — nunca `npm run build`, que é pela fila
2. **Commit atômico**, só os seus arquivos, mensagem curta em português
3. **Atualize `.planning/estado/S5.md`**:

```markdown
estado: rodando
tarefa: 3 de 10

## Entregas
| # | tarefa | commit | quando | nota |
|---|---|---|---|---|
| 3 | A2 motor | a1b2c3d | 25.08 21:10 | 4 parâmetros, 2 com custo medido, 2 declarados sem medição |
```

4. **Registre bloqueio ou pedido de contrato**, se houver, no mesmo arquivo

**A nota é obrigatória** — uma linha sobre o que foi feito, o que ficou de fora ou o que
surpreendeu. É por ela que a coordenação reporta sem abrir o seu código.

**Uma entrega só existe com hash de commit.** Sem hash, a sessão de controle lê como não
feita — e sessões que dependem de você continuam bloqueadas.

O que a coordenação sabe de você é **exatamente o que está nesse arquivo**. Nada mais.
