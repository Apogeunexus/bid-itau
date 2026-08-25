# Prompt — S6 · Organização

Cole numa sessão nova, com o diretório em `agenda-cultural-br2`.

---

Você vai construir a **S6 · Organização** — o nível institucional dentro da superfície
**Studio** do `agenda-cultural-br2`, proposta ao RFP da Fundação Itaú / Itaú Cultural.

## ANTES DE TUDO: confirme que a S7 encerrou

Esta sessão ocupa `(bastidor)/studio/`, **a mesma pasta da S7 · Produtor**. É a única
colisão do plano que o merge não resolve sozinho. Confirme em `.planning/PAINEL.md` que a S7
está com `estado: encerrada`. Se ainda estiver rodando, **pare e avise** — não comece.

## Leia primeiro, nesta ordem

1. **`.planning/sessoes/PROTOCOLO.md`** — as regras das seis sessões
2. **`.planning/sessoes/ONTOLOGIA-E-ACESSOS.md`** — a análise ontológica compartilhada
3. **`.planning/sessoes/S6-ORGANIZACAO.md`** — o seu PRD. **As seções 1 e 2 são a análise
   ontológica específica da Organização** — três números medidos ali determinam por onde começar
4. **`.planning/sessoes/S7-STUDIO-PRODUTOR.md`** — o PRD da sessão irmã, para saber o que já
   existe na sua pasta
5. O que a S7 deixou: `src/dados/tipos-acesso.ts`, o estado em `localStorage` com chave
   `studio.v1`, e os componentes em `src/componentes/studio-*`

O seu arquivo de estado é **`.planning/estado/S6.md`**.

## Comece pela O2 · Espaços

É a maior conversão de procedência da sessão — **113 espaços saindo de `derivado`, porque
nenhum espaço do acervo vem da fonte** — e fixa o padrão de ficha de acessibilidade com ato
explícito que a O1 depois copia. Começar pela ficha da instituição parece natural e é um
erro: a instituição herda o padrão do espaço, não o contrário.

## Reuse, não duplique

Você entra numa pasta que já tem dono anterior. Ficha de acessibilidade, carimbo de autoria,
selo de procedência e aviso de duplicata **já existem** em `componentes/studio-*`. Duas
fichas de acessibilidade diferentes dentro do mesmo Studio seria o defeito mais visível
possível numa banca. A suíte verifica isso.

## Três regras duras

- **Nenhuma mídia publica sem crédito.** 520 de 529 têm; as 9 sem viram fila nomeada
- **`coordenada.procedencia` é sempre `derivado`.** A O2 cadastra endereço; a coordenada
  continua derivada com `MetodoCoordenada` registrado. Não existe latitude digitada
- **O painel de alcance não exibe número que o acervo não sustenta.** Sinal de público real
  não existe. Inventar alcance seria a mentira mais fácil desta sessão — e num painel
  institucional ninguém confere

## Duas lacunas que você não pode forçar

- **`AcessibilidadeDeEspaco`** — rampa, elevador, banheiro adaptado e piso tátil **não cabem**
  nas 8 dimensões de `Acessibilidade`, que são de mídia. Proponha estrutura própria e
  registre pedido de contrato
- **`edital` não existe em `ClasseEntidade`.** Registre o pedido antes da O6, e não o force
  dentro de `formacao` nem de `programa`

## Segregação

A Organização **não se verifica** — quem verifica é o Admin. **Não emite chave de
integração** — quem emite e limita é o Admin; ela vê, usa e revoga a própria. E **não declara
fato de evento** — ocorrência, elenco e preço são do produtor.

## Sua pasta

`(bastidor)/studio/`, `componentes/studio-*`, `src/estilos/studio.css` — que já existe e já
está importado. **Você não toca em `globals.css`.**

## Ordem

Seção 9 do PRD — 11 tarefas. Tarefas 4, 5, 6 e 7 são independentes entre si.

## Ao fim de CADA tarefa — não só no fim da sessão

Este é o ritual que mantém a sessão de controle informada. Ele não é opcional e não é só
para marcos: é **a cada tarefa concluída**, nas quatro etapas, nesta ordem.

1. **`npm run checar`** verde — nunca `npm run build`, que é pela fila
2. **Commit atômico**, só os seus arquivos, mensagem curta em português
3. **Atualize `.planning/estado/S6.md`**:

```markdown
estado: rodando
tarefa: 3 de 11

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
