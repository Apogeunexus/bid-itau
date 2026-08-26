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

## 6. O app público é intocável

As dez telas do item 8 — Descobrir, Acontece, Play, Cast, Museu, Notícias, Cursos, Mapa,
Buscar e Roteiros com IA — **estão polidas e commitadas** em `59f2e26`. Elas não são
território de nenhuma das seis sessões.

**Não toque, em nenhuma hipótese:**

- `src/app/(app)/` — as rotas do app
- `src/componentes/` que não comecem com o prefixo da sua sessão (`studio-`, `moderacao-`,
  `redacao-`, `admin-`, `observatorio-`)
- `src/dados/` que não seja o módulo da sua sessão
- `src/estilos/` que não seja a sua folha
- **`scripts/verificar-fase*.mjs`** — as suítes existentes. Você cria a sua
  (`verificar-<papel>.mjs`); não edita as que já existem

Precisou de mudança em qualquer um deles — um campo novo, um comportamento diferente —
**registre `PEDIDO` no seu arquivo de estado, avise a sessão de controle, e pare.** Não
decida sozinha.

A sessão de controle verifica isso a cada varredura, por hora de modificação. Arquivo fora
do seu território tocado depois do último commit aparece como invasão.

---

## 7. Só a sua pasta

Você escreve em: a sua pasta de rotas, os seus componentes, o seu módulo de dados, a sua
folha de CSS, e o seu `estado/S<n>.md`. **Nada mais.**

`src/app/globals.css` é o arquivo de colisão. Se a sua folha ainda não estiver importada
lá, faça essa linha na **primeira tarefa e commite sozinha**.

Precisou de algo que não é seu — campo no contrato, mudança em arquivo de outra sessão —
escreva em **Pedidos de contrato** no seu arquivo de estado, avise a sessão de controle, e
**siga com mock local**. Não edite arquivo de outra sessão.

---

## 8. A sessão de controle

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

## 9. Três classes de defeito que os portões não pegam

Achadas na noite de 25 para 26 de agosto, cada uma por uma sessão diferente, todas com
`tsc` e `verificar-ds` verdes. Não são casos: são classes, e as três se repetiram.

### 9.1 · Teste de AUSÊNCIA com `\b` no fim do padrão dá verde sobre o defeito

`/\bautor\b\s*[:.]/` não pega `autorDaDecisao:` — depois de «autor» vem «D», que é
caractere de palavra, e a fronteira final não casa. **Tire o `\b` do fim, mantenha no
começo**: é o do começo que impede «suspender» de casar com «remover».

Aconteceu duas vezes na mesma noite. No gate do Admin, deixava passar um botão destrutivo
com rótulo inocente — `onClick={() => apagarRegistros()}` sob «Confirmar». No gate do
Observatório, deixava passar **nome de moderador na tela que existe para não expor nome de
moderador**. Um gate de privacidade verde sobre o vazamento é pior do que não ter gate: a
tela ganha uma garantia escrita que ninguém confere.

**A regra 1: teste de ausência só vale depois de ser visto VERMELHO com o defeito injetado.**
Escreva o defeito, confirme que o gate acusa, restaure o arquivo, confira o `git diff` vazio.
Sem isso, «não contém», «não expõe» e «não importa» são promessas sem prova.

**A regra 2, e ela pega o que a primeira não pega: toda asserção de ausência precisa de um
PISO POR FONTE.** Prove que **cada** conjunto que você varre não está vazio antes de afirmar
que ele não contém o defeito — **nunca sobre a união deles**.

A metade «por fonte» não é preciosismo, e quem a descobriu foi a mesma sessão que propôs a
regra, aplicando-a em si mesma. Ela pôs o piso sobre a **união** de componentes `admin-*` e
páginas de `(bastidor)/admin`, injetou a reforma que renomeia o prefixo para `painel-*`, e:

```
FALHA  a trilha de auditoria não tem ação de escrita
FALHA  coordenada.procedencia … nenhuma tela do Admin a escreve
FALHA  nenhum componente de cliente chama travessia (DP-F)
ok     nenhuma tela do Admin oferece apagar        ← VERDE, com ZERO componentes varridos
```

**As dez páginas sustentavam o piso da união sozinhas**, e aquele gate seguia afirmando sobre
um conjunto que tinha deixado de ser varrido. **Um conjunto vazio escondido dentro de uma
soma não vazia é exatamente o buraco que o piso existia para fechar.**

Seletor descendente é a mesma soma escrita em CSS: `[data-a] [data-b]` esconde o
desaparecimento de `[data-a]` dentro do resultado de `[data-b]`. `nenhum X entre N` é verificação; **`nenhum X` sozinho é uma frase que fica
verde no dia em que o N virar zero** — e o N vira zero sem ninguém perceber, porque um
seletor renomeado não quebra o gate: ele o faz parar de medir.

Não é hipótese. `.web-alternador` **foi renomeada** numa reforma do design system, e quatro
telas ficaram com a classe morta sem nenhum portão acusar. Um gate de privacidade escrito
sobre um seletor assim teria ficado verde sobre a tela cheia do que ele proíbe.

Duas formas de defeito, as duas achadas em suítes desta noite:

```js
// SEM PISO — conjunto vazio passa
const rotulos = [...document.querySelectorAll('.web-denominador-rotulo')].map(…).join(' | ');
exigir(!prometePublico, …)                    // rotulos === "" → verde sobre qualquer coisa

// COM PISO
exigir(rotulos.length > 0 && !prometePublico, …)
```

```js
// SEM PISO — seletor descendente com DOIS atributos; renomeie um e o conjunto some
semScore: document.querySelectorAll('[data-item-escolhido] [data-score-ia]').length === 0
```

**E ponha o denominador na linha de evidência**, como a `verificar-gestor.mjs:157` faz:
`${todos.length} arquivos varridos · permitidos por nome: …`. Uma varredura vazia aparece
como «0 arquivos varridos» em vez de passar em silêncio.

**Padrão mais estreito que a promessa** é a irmã menor da mesma classe: um gate que diz «sem
relógio» e só pega `new Date(`, deixando `Date.now()` passar; um que diz «nenhum campo de
latitude» e só casa atributo com aspas duplas literais, deixando `id={campoLat}` passar. Não
ficam verdes sobre o vazio — ficam verdes sobre a forma que ninguém previu. **Escreva o
padrão contra as formas que o código realmente usa, e prove com uma delas injetada.**

### 9.2 · Um substantivo fundindo duas contagens que o código separa

Três vezes na mesma noite, sempre com o código certo e o texto errado:

| O que se dizia | O que era |
|---|---|
| «59% de 773 **entidades**» | 773 são **registros** de `situado_em`; as entidades distintas são **718** |
| «cobertura de coordenada: 472» | 472 têm coordenada **própria**; **1.380** são **posicionadas**, por herança |
| «eventos realizados por instituição» | `realiza` é de **muitos para muitos** — 527 vínculos, 41 eventos, 36 deles com mais de uma origem, um com 46 |

**Quando a tela mostrar N, o denominador embaixo diz de que é o N** — registros ou entidades,
próprias ou herdadas, eventos ou vínculos. Somar por uma e comparar com a outra faz o painel
mentir sem que ninguém consiga apontar onde.

### 9.3 · Forma e estado, que nenhum portão vê

`tsc` prova que compila, `verificar-ds` prova que a folha usa token, **e a sonda de
comportamento também não vê forma** — uma tela com 16 verdes de gesto tinha três defeitos.

O que apareceu: campo de formulário sem moldura, idêntico a texto fixo, sem onde clicar;
coluna esticando a 1.100 px com o texto quebrando aos 610; id partido no meio de uma data,
fazendo duas chaves iguais parecerem diferentes; botão `disabled` com desenho de botão ativo;
e **lista truncada que não diz que truncou** — «68 pendentes» mostrando oito, «24 temas» de 94.

A generalização, e é a mais útil das três: **procure o que a tela sabe e não está dizendo.**
É a regra de ausência declarada, que este projeto aplica ao dado, aplicada à interface. E a
consequência não fica na tela: a lista de temas que escondia 70 de 94 fazia quem não achasse
o termo propor um duplicado — **a falha de interface de uma tela virava fila de trabalho na
moderação**.

**Abra a tela antes de chamá-la de pronta.** Toda vez que alguém abriu, achou.

### 9.3b · Coluna colada mais alta que a janela esconde o próprio pé

`position: sticky` numa coluna de 3.240 px dentro de uma janela de 960 **gruda no topo e
nunca rola para revelar o fim**. O que fica abaixo da dobra da coluna é inalcançável — não
com rolagem difícil: **inalcançável**. Achado em duas telas da Organização, e o pedaço
perdido era justamente o painel «o que falta», que é o motivo de o padrão de duas colunas
existir.

**Nenhum portão vê:** `tsc` compila, `verificar-ds` confere token, e a sonda de comportamento
clica no que está visível. Só medir a altura da coluna contra a altura da janela pega.

**A saída:** teto de altura na coluna e rolagem por dentro. **Não invente regra** —
`.web-coluna-fixa` em `web.css` já existe, e o comentário dela já nomeava o problema:
*«sem `max-height` + `overflow-y`… o pé dela seria inalcançável — a coluna colada nunca rola
para revelar o próprio fim»*. Duas sessões chegaram nessa saída sozinhas porque a casa já
tinha chegado nela antes.

**A asserção certa não é «a coluna cabe na janela».** A S7 escreveu esse teste primeiro e ele
**passou**; depois escreveu «a coluna gruda inteira dentro da janela» e ele **falhou**, com o
topo em `y=-24` no fim da página — que é o `sticky` sendo empurrado pelo fim da própria
grade, não o teto. A asserção é que estava errada.

**Meça «cada painel da coluna chega inteiro à vista»**, painel a painel, e nas duas larguras
— 1440 e 1280. «Cabe hoje» também não basta: coluna que cresce com o conteúdo — número de
vínculos, colisões de chave — cabe até parar de caber, sem sintoma antes.

**Quem tem coluna colada:** `studio-publicar.tsx`, `studio-elenco.tsx`, `studio-grade.tsx`,
`organizacao.css`, `studio-duplicatas.css`. Meça a sua.

### 9.4 · Duas armadilhas de ferramenta, do mesmo tipo

- **`innerText.includes('rótulo (N)')` sobre string montada em JSX** dá falso negativo *e*
  falso positivo. React parte `Capítulos (` · `{n}` · `)` em nós vizinhos e `innerText` é
  baseado em layout, não em conteúdo. Meça por `textContent`, por atributo, ou por `Range`
- **Regex sobre texto DENTRO de template literal perde a barra invertida.** `\d` colapsa
  para `d`, o padrão não casa nada, e o gate fica vermelho sem causa — ou verde sem prova,
  conforme o sentido do teste. Pegou a mesma sessão **duas vezes**, porque na primeira ela
  corrigiu a ocorrência e não a classe. **A correção que resolve de vez é tirar o texto do
  caminho:** o dado viaja como atributo — `data-inicio`, `data-fim`, `data-carimbo` — e a
  suíte lê atributo, não texto
- **`new Date("2026-08-22")`** é meia-noite UTC e volta como **dia 21** em fuso brasileiro.
  Para **aritmética**, `Date.parse` com `T00:00:00Z` nos dois lados; para **formatação**,
  quebre a string em partes. As duas defesas juntas

---

## 10. Antes de cada tela

Escreva o que vai fazer e **espere confirmação**. Depois: `npm run checar` verde, commit,
e o arquivo de estado atualizado.

Se algo no PRD divergir do código real, **pare e diga** — não decida sozinho.
