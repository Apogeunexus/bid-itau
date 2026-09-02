# S9 · Os KPIs do painel do produtor — troca slot a slot

> **A identidade e a forma de apresentação não mudam.** Hero, card grande com sparkline, os
> quatro ladrilhos, os dois donuts, as barras de dia da semana, os cinco anéis, a lista
> ranqueada e a coluna de comentários continuam onde estão, com o mesmo desenho. O que muda é
> QUAL número ocupa cada slot.
>
> Alvo: `/studio/` (raiz do Studio, a tela do print). **O arquivo não está em nenhum branch
> deste repositório** — verificado em 02.09.2026 com `git fetch --all` e busca em todos os
> refs locais e remotos. Este documento é para aplicar sobre ele quando chegar.

---

## Por que trocar

Três KPIs do painel de hoje afirmam coisas que o produto não mede:

1. **«11.304 visualizações, plays e leituras»** — não existe contador de reprodução. O que a
   plataforma observa é CONCLUSÃO (`play.midia.concluida`, `cast.episodio.concluido`,
   `leitura.materia.concluida`), não visualização.
2. **«325 ingressos» e «gratuito · receita»** — a plataforma não vende. A compra acontece na
   plataforma do produtor, sem retorno.
3. **«tempo médio» e «até o fim»** em Top conteúdos — exigem telemetria de player que não há.

E os três temas que o painel precisa cobrir — **comunidade, loja e visita ao evento** — não
aparecem em nenhum slot.

---

## O mapa

| # | slot (a forma fica) | hoje | vira | fonte |
|---|---|---|---|---|
| 1 | Hero · 3 ladrilhos | no ar · em edição · pendências | **mantém** | grafo + rascunho |
| 2 | Card grande + sparkline 14d | ALCANCE · 11.304 visualizações | **PRESENÇAS CONFIRMADAS** — série de 14 dias | `ocorrencia.presenca.confirmada` |
| 3 | Ladrilho 1 | 325 · ingressos | **TAXA DE LOTAÇÃO** — presenças ÷ capacidade | livro ÷ ficha do espaço |
| 4 | Ladrilho 2 | gratuito · receita | **RESGATES ENTREGUES** — da loja | `recompensa.resgatada` |
| 5 | Ladrilho 3 | 1.018 · salvos | **mantém** | `ocorrencia.salva` |
| 6 | Ladrilho 4 | 78 · comentários | **mantém** | `comunidade.comentario.criado` |
| 7 | Donut esquerdo | ALCANCE POR PAUTA | **ENGAJAMENTO POR COMUNIDADE** — fatia de reações + comentários por comunidade dela | feed + livro |
| 8 | Donut direito | SITUAÇÃO DO ACERVO | **mantém** | grafo |
| 9 | Barras dom→sáb | alcance somado por dia | **PRESENÇAS por dia da semana** | livro (`criadoEm`) |
| 10 | 5 anéis · QUALIDADE DA FICHA | crédito · descrição · acessibilidade · resumo · no ar | **troca «no ar» por «TETO DECLARADO»** — % de sessões com capacidade | ficha do espaço |
| 11 | Lista ranqueada | TOP CONTEÚDOS · leituras · tempo médio · até o fim | **TOP SESSÕES** · presenças · lotação · nota · salvos | livro |
| 12 | Coluna lateral | COMENTÁRIOS RECENTES | **mantém**, com a taxa de resposta dela no cabeçalho | feed + livro |
| 13 | *(novo card, mesma moldura)* | — | **FUNIL DA LOJA** — resgatado → entregue → confirmado / contestado | esteira de 7 fases |

---

## As regras que os números novos carregam

**Lotação é PISO, não público.** O numerador entra por código gerado pelo produtor
(`src/lib/pontos/tipos.ts`), nunca por autodeclaração — quem foi e não resgatou o código não
aparece. Quando a ficha do espaço não declara capacidade (`capacidade === null`), o anel de
lotação mostra **«sem teto»**, nunca `0%`: são afirmações diferentes. É por isso que o slot 10
troca «no ar» por «teto declarado» — sem esse denominador, o slot 3 não existe.

**Ingresso mede intenção, nunca conversão.** Se o slot de ingresso voltar em algum momento, o
rótulo é *saída para a plataforma*, e o denominador é **eventos com link publicado** — hoje 0
de 300, porque a classe do acervo não tem campo de link. Cobertura antes de desempenho: um
gráfico de cliques com zero link parece fracasso de audiência quando é ausência de cadastro.

**«Conclusão», nunca «visualização».** O player chegar ao fim é observável; o play não.

**Contestação é o KPI da promessa.** No slot 13, a esteira não termina em «entregue» —
«entregue» é a organização dizendo que despachou, e só quem recebeu sabe se chegou.

**Taxa de resposta não vira ranking.** O slot 12 mede a organização para ela mesma. Comparar
produtores por tempo de resposta é vigilância com outro nome.

---

## O que preciso para aplicar

O branch (ou os arquivos) que produzem `itau-cultural.vercel.app/studio/`: a página da raiz do
Studio, o componente do painel e a folha de estilo dele. Com eles, a troca é na lista de KPIs —
estrutura, classes e CSS ficam intocados.
