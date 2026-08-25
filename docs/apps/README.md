# Funcionalidades por app

Um documento por app do hub (`/apps`). Cada um responde três perguntas na mesma ordem:
**o que este app precisa entregar**, **o que já está no ar** e **o que falta**.

Estes documentos não substituem os que já existem — eles cruzam os dois:

- [`funcionalidades.md`](../funcionalidades.md) — as 86 funcionalidades, numeradas e
  organizadas por operação sobre o grafo. É de lá que sai a coluna `#`.
- [`telas.md`](../telas.md) — o inventário de 37 telas, com camada de corte.

**A numeração é a do catálogo, e não se renumera aqui.** Uma funcionalidade citada em
dois apps é a mesma funcionalidade vista de dois lugares.

## Legenda de estado

| | |
|---|---|
| **no ar** | existe na rota, verificado no código |
| **parcial** | existe em parte, e a parte que falta está dita |
| **falta** | sem implementação encontrada |
| **não sustentada** | o acervo não tem o dado que a funcionalidade exige — a ausência é declarada, não escondida |

O último estado é o que separa este catálogo de uma lista de desejos. **Ausência é
declarada, com denominador. Nunca escondida, nunca preenchida com valor plausível** — a
mesma regra que atravessa o produto. Quando uma funcionalidade do RFP não tem lastro no
acervo, o documento diz qual dado falta, e não promete a funcionalidade assim mesmo.

## Como o estado foi apurado

Leitura das rotas em `src/app/(app)/`, dos componentes em `src/componentes/` e dos
módulos de dados em `src/dados/`, mais os números medidos no acervo em 2026-08-25. Onde a
verificação não foi conclusiva, o texto diz que não foi.

## Os dez apps

| App | Rota | Documento |
|---|---|---|
| Play | `/play` | [play.md](play.md) |
| Cast | `/cast` | [cast.md](cast.md) |
| Museu virtual | `/museu` | [museu.md](museu.md) |
| Acontece | `/acontece` | [acontece.md](acontece.md) |
| Mapa | `/mapa` | [mapa.md](mapa.md) |
| Notícias | `/noticias` | [noticias.md](noticias.md) |
| Descobrir | `/descobrir` | [descobrir.md](descobrir.md) |
| Buscar | `/buscar` | [buscar.md](buscar.md) |
| Roteiros com IA | `/ia` | [ia.md](ia.md) |
| Cursos | `/cursos` | [cursos.md](cursos.md) |

**Cast, Museu, Notícias, Cursos e Roteiros com IA não estão no inventário de telas.** Eles
nasceram da reformulação de 2026-08, quando o cliente separou streaming, podcast e
editorial em portas próprias, e `telas.md` não foi atualizado desde então. Para esses
cinco, este é o primeiro documento de funcionalidade que existe.
