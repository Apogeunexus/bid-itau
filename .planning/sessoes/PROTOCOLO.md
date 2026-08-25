# PROTOCOLO — regras válidas para as seis sessões

Vale para S7, S3, S1, S5, S6 e S2. Cada prompt de sessão aponta para cá em vez de repetir.

---

## 1. Identifique-se, antes da primeira tarefa

Rode `ListAgents`, pegue o nome desta sessão — é a **primeira linha** do resultado — e
escreva no topo do seu `.planning/estado/S<n>.md`:

```
sessão: <o nome que apareceu>
```

Sem isso, a sessão de controle não sabe para quem mandar mensagem.

---

## 2. Ao concluir cada tarefa, atualize o seu arquivo

`.planning/estado/S<n>.md` é **seu**. Nenhuma outra sessão escreve nele, e você não escreve
em nenhum outro. É assim que a colisão de escrita deixa de existir em vez de ser
administrada.

Depois de **cada** tarefa concluída:

```markdown
estado: rodando
tarefa: 3 de 11

## Entregas
| # | tarefa | commit | quando | nota |
|---|---|---|---|---|
| 1 | contrato e seed | a1b2c3d | 25.08 18:56 | 5 rascunhos semeados; `Situacao` com 5 estados |
| 2 | P2 identidade | e4f5g6h | 25.08 19:40 | aviso de duplicata reusa `CRITERIO_DE_IDENTIDADE` |
```

**A nota é obrigatória** — uma linha sobre o que foi feito, o que ficou de fora, ou o que
surpreendeu. O hash diz *que* aconteceu; a nota diz *o quê*, e é o que a sessão de controle
usa para reportar sem ter que abrir o seu código.

**Uma entrega só entra na tabela com hash de commit.** Sem hash, não aconteceu — é a regra
que impede o estado de hoje, em que 80 KB existem no disco e ninguém sabe se estão prontos.

Registre também, quando houver:

- **Bloqueios** — o que trava você, e quem destrava
- **Pedidos de contrato** — campo ou tipo que você precisa e não é seu

---

## 3. Commite a sua tarefa

Commit atômico por tarefa, só os seus arquivos. Mensagem curta, em português, no estilo do
repositório. Anote o hash no seu arquivo de estado.

Sessão que acumula trabalho sem commitar deixa as outras sem saber o que está pronto — e
qualquer `git checkout` de outra sessão apaga tudo sem recuperação.

---

## 4. Concorrência — seis sessões, um repositório

**Portão por tela:**

```bash
npm run checar        # tsc --noEmit + verificar-ds
```

Não toca em diretório compartilhado. Pode rodar a qualquer momento.

**`npm run build` você NÃO roda por conta própria.** O build escreve em `out/`, que é
diretório único e fixo no código do Next — duas builds simultâneas se corrompem. Peça a vez
à sessão de controle:

> "peço vez de build — S<n>, tarefa <k>"

Ela concede uma por vez.

**Servidor de desenvolvimento**, se precisar, com diretório e porta próprios:

| Sessão | Comando |
|---|---|
| S7 | `NEXT_SESSAO=s7 npx next dev -p 3007` |
| S3 | `NEXT_SESSAO=s3 npx next dev -p 3003` |
| S1 | `NEXT_SESSAO=s1 npx next dev -p 3001` |
| S5 | `NEXT_SESSAO=s5 npx next dev -p 3005` |
| S6 | `NEXT_SESSAO=s6 npx next dev -p 3006` |
| S2 | `NEXT_SESSAO=s2 npx next dev -p 3002` |

Encerre o servidor quando terminar de olhar.

---

## 5. Falha conhecida, que não é sua

`npm run checar` está **vermelho** na árvore atual:

```
40 verdes · 1 FALHA: cursos.css: só tokens (0 medidas literais, 0 text-align)
```

`cursos.css` é sujeira **anterior** às sessões. Não é você. Não conserte — não é sua pasta.
Se aparecer outra falha além dessa, aí sim é sua.

---

## 6. Só a sua pasta

Você escreve em: a sua pasta de rotas, os seus componentes, o seu módulo de dados, a sua
folha de CSS, e o seu `estado/S<n>.md`. **Nada mais.**

`src/app/globals.css` é o arquivo de colisão. Se a sua folha ainda não estiver importada
lá, faça essa linha na **primeira tarefa e commite sozinha**.

Precisou de algo que não é seu — campo no contrato, mudança em arquivo de outra sessão —
escreva em **Pedidos de contrato** no seu arquivo de estado, avise a sessão de controle, e
**siga com mock local**. Não edite arquivo de outra sessão.

---

## 7. A sessão de controle

Existe uma sessão que coordena as seis. Ela lê o seu `estado/S<n>.md`, cruza com o `git log`
e libera as sessões bloqueadas.

- Ela **não escreve código**. Não peça implementação a ela
- Ela concede a vez de build
- Ela roteia pedidos de contrato
- O que ela souber de você é o que você escreveu no seu arquivo de estado

O seu avanço aparece no painel visual das seis sessões, gerado a partir do seu arquivo de
estado e do `git log`. Tarefa sem commit não aparece lá.

Se ela mandar mensagem, responda. Se você travar, avise.

---

## 8. Antes de cada tela

Escreva o que vai fazer e **espere confirmação**. Depois: `npm run checar` verde, commit,
e o arquivo de estado atualizado.

Se algo no PRD divergir do código real, **pare e diga** — não decida sozinho.
