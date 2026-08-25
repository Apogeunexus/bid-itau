# Adendo para a onda 1 — S7 e S3

Cole **o texto abaixo** nas duas sessões que já estão rodando. É o mesmo para as duas.

---

**ADENDO — mudou a coordenação entre as sessões.**

Enquanto você trabalhava, montamos o controle das seis sessões paralelas. Três coisas novas
valem para você a partir de agora.

## 1. Leia o protocolo

`.planning/sessoes/PROTOCOLO.md` — oito seções, curtas. Ele substitui as instruções de
coordenação do seu prompt original. O PRD da sua sessão continua valendo integralmente.

## 2. Você tem um arquivo de estado

`.planning/estado/S7.md` se você é a S7, `.planning/estado/S3.md` se é a S3. **Só você
escreve nele.**

Faça agora, antes de continuar a tarefa em curso:

1. Rode `ListAgents` e escreva o nome desta sessão — a primeira linha do resultado — no campo
   `sessão:` do seu arquivo
2. Preencha `estado:` e `tarefa: N de 11`
3. **Commite o que você já entregou** e registre cada entrega na tabela, **com o hash**

O ponto 3 é urgente. Hoje há cerca de **80 KB seus no disco sem nenhum commit** —
`tipos-acesso.ts`, `seed.ts`, `moderacao.ts`, a fila movida. Nada disso existe no histórico
do git. Qualquer `git checkout` de outra sessão apaga tudo sem recuperação, e duas outras
sessões estão bloqueadas esperando exatamente esses commits.

**A partir daqui: commit atômico por tarefa, e o arquivo de estado atualizado logo depois.**

## 3. Concorrência — seis sessões, um repositório

**Seu portão por tela passa a ser `npm run checar`** (`tsc --noEmit` + `verificar-ds`). Não
toca em diretório compartilhado.

**Não rode `npm run build`.** Ele escreve em `out/`, que é diretório único e fixo no código
do Next — duas builds simultâneas se corrompem. Peça a vez à sessão de controle:

> "peço vez de build — S<n>, tarefa <k>"

**Servidor de desenvolvimento**, se precisar, com diretório e porta próprios:

```bash
NEXT_SESSAO=s7 npx next dev -p 3007     # S7
NEXT_SESSAO=s3 npx next dev -p 3003     # S3
```

`.next` já é separado por sessão — mudei o `next.config.ts` para isso. Encerre o servidor
quando terminar de olhar.

**Falha conhecida que não é sua:** `npm run checar` acusa `cursos.css`. É sujeira anterior
às sessões. Ignore, e não conserte — não é sua pasta. Qualquer outra falha, aí sim é você.

## 4. Existe uma sessão de controle

Ela lê o seu arquivo de estado, cruza com o `git log`, concede a vez de build e libera as
sessões bloqueadas. Ela **não escreve código**. Se mandar mensagem, responda. Se você travar,
avise.

O que ela sabe de você é **só o que você escreveu no seu arquivo de estado**.

---

Confirme que leu, faça os commits pendentes, atualize o seu arquivo, e siga de onde parou.
