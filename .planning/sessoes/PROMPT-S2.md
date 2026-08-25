# Prompt — S2 · Gestor / Observatório

Cole numa sessão nova, com o diretório em `agenda-cultural-br2`.

---

Você vai construir a **S2 · Gestor / Observatório** do `agenda-cultural-br2`, proposta ao
RFP da Fundação Itaú / Itaú Cultural. É a **única sessão sem bloqueio** — pasta e folha
próprias, sem dependência de contrato.

## Leia primeiro, nesta ordem

1. **`.planning/sessoes/PROTOCOLO.md`** — as regras das seis sessões
2. **`.planning/sessoes/ONTOLOGIA-E-ACESSOS.md`** — a análise ontológica compartilhada
3. **`.planning/sessoes/S2-GESTOR.md`** — o seu PRD. **As seções 1 e 2 são a análise
   ontológica específica do Gestor**
4. `src/dados/observatorio.ts` — **1.070 linhas, o módulo mais sofisticado do projeto.**
   Leia inteiro, e leia os comentários: eles explicam a decisão de tipagem mais importante
   da obra
5. `src/app/(bastidor)/observatorio/page.tsx` — a tela única que vira superfície navegável
6. `src/dados/repertorio.ts` — de onde sai o indicador de impacto

O seu arquivo de estado é **`.planning/estado/S2.md`**.

## A regra que define a sessão

**Zero escrita.** Nenhuma tela desta superfície tem ação de escrita — nem rascunho, nem
preferência gravada no grafo. Quem prova impacto não produz o dado que prova. A suíte
verifica, e é o portão central.

## A distinção que você não pode achatar

```
valor: null  + sustentado: false  →  o dado NÃO SUSTENTA o indicador
valor: 0     + sustentado: true   →  uma medida real que DEU ZERO
```

As duas existem neste acervo ao mesmo tempo: gratuidade não sustenta (0 de 300 eventos
declaram preço), e a descoberta de artista novo da Joana é zero **medido** sobre 68
adjacentes reais. **As duas precisam ser visualmente distintas na tela.** Achatá-las faria o
painel mentir sobre uma delas, sem que ninguém pudesse saber qual.

## Comece pela G1 e siga direto para a G3

A G3 · Impacto cultural é onde essa distinção deixa de ser tipagem e vira interface, e as
outras seis telas copiam o tratamento visual dela. Fazer a G5 · Procedência primeiro parece
natural — é a mais bonita — e é um erro: sem o padrão estabelecido, os indicadores saem
achatados e você reescreve tudo.

## Quatro coisas que já existem e você não recalcula

- **A conferência de três pontas** — a contagem da tela, `contagens()` do grafo e `meta.json`
  precisam concordar para a tela abrir. É portão e derruba o build
- **`Publico`** — recorte é ênfase, não filtro. Trocar de público reordena e **não remove**
- **`procedenciaDoNumero`** — todo número diz de qual módulo e função saiu
- **Nenhum literal.** Os literais no módulo são conferências, não valores

## Segregação

O Gestor observa **o público e o acervo**; o Admin observa **a máquina** — cobertura, frescor
e reprocessamento são dele. A G8 lê a moderação **agregada e anonimizada**: nome de moderador
não aparece. Confundir isso transforma indicador em vigilância.

## Restrições

- **DP-F** e `TETO_DO_DTO = 61.440` bytes. São oito telas — recorte por tela, no servidor
- **Sem relógio.** O frescor é `geradoEm`
- **O denominador vai sob o número**, nunca em nota de rodapé
- **Não ofereça download por link** — o visualizador bloqueia. Mostre o conteúdo exportável
  em tela, com o dicionário de dados

## Sua pasta

`(bastidor)/observatorio/`, `componentes/observatorio-*`, `src/dados/observatorio.ts`,
`src/estilos/observatorio.css` — que já existe e já está importado. **Você não toca em
`globals.css`.**

## Ordem

Seção 10 do PRD — 10 tarefas. Tarefas 6, 7 e 8 são independentes entre si.

## Ao fim de CADA tarefa — não só no fim da sessão

Este é o ritual que mantém a sessão de controle informada. Ele não é opcional e não é só
para marcos: é **a cada tarefa concluída**, nas quatro etapas, nesta ordem.

1. **`npm run checar`** verde — nunca `npm run build`, que é pela fila
2. **Commit atômico**, só os seus arquivos, mensagem curta em português
3. **Atualize `.planning/estado/S2.md`**:

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
