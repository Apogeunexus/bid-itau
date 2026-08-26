# Acontece — funcionalidades

**Rota** `/acontece` · **Componente** `src/componentes/acontece.tsx` (839 linhas) ·
**Dados** `src/dados/agenda.ts` · **Inventário** [telas.md](../telas.md) tela 8 ·
**Camada de corte** C1

**Acervo hoje:** 129 eventos distribuídos em 1.071 dias. O DTO da agenda inteira pesa 192 KB.

## O que este app é

A agenda como **lista de eventos**, não como calendário de sessões.

**É aqui que a decisão de modelagem central da proposta fica visível.** Evento e ocorrência
são registros próprios: um espetáculo com 53 sessões aparece **uma** vez, com «53 sessões»
no cartão, e não 53 vezes na rolagem. Se esta lista pudesse repetir um título, o produto
teria virado catálogo de calendário — que é exatamente o que a ontologia foi desenhada para
não ser.

O passado é mostrado como passado, e a faixa de dias só navega para dias que existem.

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 9 | Página de Evento como entidade única, com N ocorrências | ★ | **no ar** — é a tese da tela |
| 10 | Lista de ocorrências: data, hora, espaço, preço | ★ | **parcial** — data e hora sim; espaço e preço, ver abaixo |
| 11 | Filtros ontológicos: linguagem, gratuidade, acessibilidade, faixa etária, território | ★ | **parcial** — ver abaixo |
| 12 | Salvar ocorrência e criar lembrete | ★ | **parcial** — salvar existe (`salvos.tsx`); lembrete, não |
| 13 | Alerta de alteração de horário ou cancelamento | ★ | **no ar** — `alerta.ts`, disparado pelo Studio |
| 14 | «Eu fui» — registro de repertório | ★ | **falta** — sem implementação encontrada |
| 15 | Ficha de acessibilidade do evento e do espaço | ★ | **no ar** — `ficha-acessibilidade.tsx` |
| 16 | Ingresso ou inscrição via produtor ou agendamento IC | | **falta** |
| 17 | Evento de longa duração com regra própria de vigência | | **no ar** — exposição e ocupação têm vigência |
| 18 | Compartilhar evento ou trilha | | **falta** |

## Os buracos do acervo, com denominador

Estes números estão **na tela**, não em nota de rodapé — é a disciplina da casa:

- **0 de 300 eventos declaram ingresso.** Por isso gratuidade não recorta nada: 100% das
  sessões saem gratuitas, e um filtro «Gratuitos» seria um botão que não filtra.
- **2.425 de 2.425 ocorrências sem espaço declarado.** É o que impede a funcionalidade 10 de
  estar completa: não há espaço para mostrar.
- **9 eventos têm sessão futura, 158 têm território, e a interseção é 0.**
- **48 dos 158 eventos situados têm coordenada fora do Brasil.**

## O que falta construir

1. **«Eu fui»** (14) — é a porta de entrada do Meu Repertório, e não existe.
2. **Lembrete** (12) — salvar existe; avisar antes, não.
3. **Ingresso e inscrição** (16) — depende de integração com produtor.
4. **Compartilhar** (18).

## Ligações com outros apps

- **[Mapa](mapa.md)** — a mesma agenda vista por território.
- **[Descobrir](descobrir.md)** — a vitrine «Programação de hoje» sai daqui.
- **Studio** — é de lá que sai a alteração que dispara o alerta 13.
