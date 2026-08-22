# Design system — decisões

Reformulação de 2026-08. Referências estudadas ao vivo em 22/08/2026 (capturas via
Chrome): Dice.fm (card de evento, chips de filtro), Google Arts & Culture (menu
lateral, hub claro), Spotify web (shelf de conteúdo, player). Resident Advisor e
Time Out ficaram fora por permissão de domínio; os padrões que interessavam neles
(sidebar categorizada, hub editorial) foram cobertos pelos dois primeiros.

## 1. Princípios

1. **O manual manda.** Paleta oficial, Itaú Text ≤16px / Itaú Display ≥17px,
   texto alinhado à esquerda (nunca centro/justificado em bloco), subtítulo
   50-60% menor que o título, destaque +2pt, grafismo `\` como marcador.
2. **Laranja é AÇÃO.** Botão primário, link ativo, foco, progresso. Nunca
   decoração, nunca data, nunca fundo de seção. A referência Dice pinta a data
   de amarelo; aqui a data vai em Display bold preto — a cor de realce fica
   reservada para o que o usuário pode fazer.
3. **Cor de linguagem é DADO.** `vocabulario.json` guarda o nome do token
   (`"--ic-lilas"`); a cor entra por custom property vinda do dado. Nenhum mapa
   linguagem→cor em CSS ou TS, nunca.
4. **Visão é estado.** `data-view` + variantes `app:`/`desk:`; um componente
   serve as duas visões; `position: fixed` só no `.canto`.
5. **Fundo claro.** Branco como fundo, preto como tinta, superfícies rebaixadas
   por mistura de preto ≤4% — como o hub do Google Arts & Culture, e como o
   manual pede para a marca.

## 2. Tokens (implementados em `src/estilos/tokens.css`)

### Cor semântica (derivada de `--ic-*` por color-mix; zero hex novo)

| Token | Derivação | Papel |
|---|---|---|
| `--cor-acao` | `--ic-laranja` | ação, link ativo, foco |
| `--cor-acao-lavada` | laranja 8% sobre transparente | fundo de item ativo, hover |
| `--cor-tinta` | `--ic-preto` | texto primário |
| `--cor-tinta-2` | preto 62% | texto secundário |
| `--cor-tinta-3` | preto 45% | legenda, meta |
| `--cor-fundo` | `--ic-branco` | fundo da página |
| `--cor-superficie` | branco | painel, cartão |
| `--cor-superficie-2` | preto 4% sobre branco | rebaixo, listras |
| `--cor-borda` | preto 12% | divisores, contorno de cartão |
| `--cor-borda-forte` | preto 28% | contorno de controle |
| `--cor-foco` | laranja | anel de foco |

### Tipografia (`@utility tipo-*` — família+tamanho+entrelinha soldados)

| Utilitário | Fonte | App | Web | Uso |
|---|---|---|---|---|
| `tipo-micro` | Text | 11/1.35, caixa alta, tracking .06em | = | overline, rótulo de grupo |
| `tipo-legenda` | Text | 12/1.4 | = | meta, crédito |
| `tipo-detalhe` | Text | 14/1.45 | = | subtítulo, item de menu |
| `tipo-corpo` | Text | 16/1.5 | = | corpo (teto da Text) |
| `tipo-destaque` | Display | 18/1.45 | = | lead, destaque (+2 do corpo) |
| `tipo-titulo-3` | Display | 20/1.3 | = | cabeçalho de seção |
| `tipo-titulo-2` | Display | 24/1.25 | = | título de tela secundária |
| `tipo-titulo-1` | Display | 28/1.15 | 34/1.15 | título de tela |
| `tipo-cartaz` | Display | 36/1.1 | 44/1.1 | hero |

Pareamento do manual: `tipo-titulo-1` ↔ subtítulo `tipo-detalhe` (50%);
`tipo-destaque` = corpo+2. O corte 16/17px Text/Display é estrutural: o
utilitário fixa a família junto com o tamanho, então não há como errar.

### Espaço, raio, sombra, motion

- Grade: múltiplos de 0.25rem. Quatro tokens semânticos que variam por visão:
  `--espaco-tela` 1rem app / 1.5rem web · `--espaco-secao` 2rem / 3rem ·
  `--espaco-cartao` 0.75rem / 1.25rem · `--espaco-pilha` 0.5rem / 0.75rem.
- Raios: `--radius-s` 0.5rem (capa, chip quadrado) · `--radius-m` 0.75rem
  (cartão) · `--radius-l` 1rem (painel, folha) · `--radius-pilula` 999px.
- Sombras: `--shadow-1` cartão em hover · `--shadow-2` sticky/dropdown ·
  `--shadow-3` drawer/folha. Todas preto em alfa baixo, nunca cor.
- Motion: `--dur-1` 120ms (micro) · `--dur-2` 200ms (entrada de painel) ·
  `--dur-3` 320ms (drawer) · `--ease-padrao` cubic-bezier(.2,0,0,1).
  `prefers-reduced-motion` zera tudo — a segunda @media legítima do projeto
  (a primeira é o colapso da moldura; ambas são sobre o usuário/janela real,
  não sobre a visão).

## 3. Primitivas (`src/componentes/base/`)

`Botao` (primário laranja cheio · secundário contorno · fantasma) ·
`Chip` (filtro selecionável; selecionado = preto cheio com texto branco, contagem
em `tipo-legenda`) · `CartaoBase` (superfície com borda/raio/padding por visão) ·
`CabecalhoSecao` (título `tipo-titulo-3` + ação "ver tudo" à direita) ·
`LinhaLista` · `CampoBusca` · `Abas` · `Folha` (sheet inferior app / painel web) ·
`EstadoVazio` · `ConchaPlayer`. Todos consomem só tokens; nenhum conhece hex.

## 4. Fichas de padrão (referência → decisão)

**Menu lateral** — observado no Google Arts & Culture: drawer branco ~280px,
linha de 48px (ícone 24 + rótulo 14), item ativo em pílula lavada com texto na
cor da marca, separador fino entre grupos, rótulo de grupo em caixa alta.
→ Decisão: sidebar fixa de 240px na web, drawer de 300px no app (absoluto contra
a moldura, scrim, `--dur-3`); linha 48px `tipo-detalhe`; ativo =
`--cor-acao-lavada` + texto `--cor-acao`; grupos rotulados em `tipo-micro`;
contagens medidas em `tipo-legenda` `--cor-tinta-3`. Conformidade: marca
preto+laranja sobre branco, ativo em laranja = navegação é ação.

**Card de evento** — observado no Dice: imagem quadrada dominante, título forte
abaixo, data em cor de realce, local e preço apagados, grid sem borda.
→ Decisão: capa 1:1 com `--radius-s` (fallback `CapaSemImagem` na cor da
linguagem), título `tipo-destaque` 2 linhas máx., data em `tipo-legenda`
**Display bold preto** (desvio consciente do Dice — regra 2), local
`tipo-legenda` `--cor-tinta-3`, selo de linguagem colorido pelo dado. Cartão sem
borda no grid de descoberta; com borda (`CartaoBase`) em listas densas.

**Chips de filtro** — observado no Dice: pílulas de ~40px com ícone, sempre
visíveis acima do conteúdo, roláveis na horizontal.
→ Decisão: trilho horizontal rolável sob o cabeçalho da tela; `Chip` 36px
`tipo-detalhe`, contorno `--cor-borda-forte`; selecionado preto cheio;
"todos os filtros" como último chip fixo abrindo `Folha`.

**Shelf de conteúdo** — observado no Spotify: cabeçalho bold + "Mostrar tudo"
apagado à direita, fileira horizontal, capa com raio pequeno, título + subtítulo
apagado em 2 linhas.
→ Decisão: `CabecalhoSecao` + fileira `overflow-x` com `--espaco-pilha` de gap;
item = capa `--radius-s`, título `tipo-detalhe`, meta `tipo-legenda`
`--cor-tinta-3`. É o esqueleto de Descobrir, Play, Podcast e Museu.

**Player** — observado no Spotify: capa grande, controles pretos, barra de
progresso na cor de realce.
→ Decisão: `ConchaPlayer` com progresso em `--cor-acao` (progresso é ação em
andamento), controles `--cor-tinta`, metadados `tipo-legenda`.

## 5. Regras estruturais — o que mudou na reformulação

1. Variante `app:`/`desk:` só prefixa utilitário — inalterada.
2. Proibido componente irmão por visão — inalterada.
3. `fixed` só no `.canto` — inalterada, MAS a `.moldura` deixou de ser o
   contêiner de rolagem: ela é `relative; overflow:hidden` e um filho
   `.moldura-rolagem` rola. Drawer, folha e scrim posicionam `absolute` contra a
   moldura. Foi isso que permitiu o menu lateral no app sem `fixed`.
4. Novo portão `scripts/verificar-ds.mjs`: hex só em `globals.css`; `rem`/`ms`
   literais só em `tokens.css` (exceções nomeadas no próprio script); nenhum
   `text-[...rem]` em TSX; nenhum `text-align: center` em bloco de texto.

## 6. Como migrar uma tela (checklist de onda)

1. Trocar literais da folha pela camada de token (valor igual primeiro).
2. Substituir controles ad hoc pelas primitivas de `base/`.
3. Aplicar as fichas de padrão da seção 4.
4. Atualizar as medidas de pixel da suíte correspondente em `scripts/medidas.mjs`.
5. Build + suíte da fase + `verificar-ds` + captura de tela revisada a olho.
