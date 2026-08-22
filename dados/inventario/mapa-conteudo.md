# Varredura do acervo digital do Itaú Cultural

Levantamento técnico feito para embasar a proposta ao RFP **Agenda Cultural BR**.
Data da coleta: 21/08/2026. Fonte: conteúdo público de `www.itaucultural.org.br`.

---

## 1. Método

O site é uma aplicação **Next.js**. Cada página carrega seus dados de
`/_next/data/<buildId>/<rota>.json` — a mesma fonte que o navegador consome. A coleta
usou esse endpoint, com pausa de 250 ms entre requisições.

| Etapa | Resultado |
|---|---|
| `robots.txt` e `sitemap.xml` | 138 URLs declaradas |
| Seções principais | 26 coletadas, 7 falhas |
| Subcategorias | 43 coletadas |
| Matérias individuais | 53 coletadas |
| **Entidades únicas normalizadas** | **2.534** |
| **Pessoas cadastradas** | **152** |

Scripts: [`dados/coletar.py`](../coletar.py) e [`dados/normalizar.py`](../normalizar.py).
Ambos são idempotentes e podem ser rodados de novo para atualizar a base.

---

## 2. Infraestrutura descoberta

| Camada | Endereço | Observação |
|---|---|---|
| Frontend | `prd.itau-cultural.frontend.fundacaoitau.org.br` | Next.js. O site do IC **já roda na infra da Fundação Itaú** |
| CMS / editor | `prd.editor.fundacaoitau.org.br/editor/v1/` | Editor compartilhado da Fundação |
| Mídia | `s3.sa-east-1.amazonaws.com/prd.editor.fundacaoitau.org.br` | S3, região São Paulo |
| Analytics | Google Tag Manager | Sem camada de produto própria |
| Tipografia em produção | Open Sans (Google Fonts) | **Diverge do manual de marca**, que especifica Itaú Text / Itaú Display |

A consolidação do ecossistema, portanto, **já começou pela infraestrutura**. O que não
foi consolidado é o modelo de dados.

### Subdomínios — situação verificada

| Subdomínio | Status | Natureza |
|---|---|---|
| `enciclopedia` | 200 | Aplicação própria, separada |
| `agendamento` | 200 | Agendamento de visitas |
| `anamae` | 200 | Projeto Ana Mãe |
| `jabuti` | 200 | Prêmio Jabuti |
| `livrosdeartista` | 200 | Coleção Livros de Artista |
| `transversalidade` | 200 | Exige login |
| `resourcespace` | 200 | DAM — exige login |
| `ehp` | 200 | **Não estava no mapa inicial** |
| `tourvirtual` | 404 | Fora do ar |
| `collective-access` | sem resposta | Gestão de acervo |
| `observatorio` | sem resposta | Host separado |
| `editais` | sem resposta | Portal de editais |
| `comunica` | sem resposta | E-mail marketing |

Onze sistemas distintos, com autenticação, modelo de dados e ciclo de vida próprios.
Nenhum deles compartilha identidade de usuário com os outros.

---

## 3. O modelo de dados real

**Todos os tipos de conteúdo compartilham exatamente o mesmo schema.** Notícia, coluna,
entrevista, vídeo, podcast, série, publicação, curso, exposição e evento de agenda são,
no CMS, o mesmo objeto — diferenciados apenas por um campo `category` de texto.

Campos observados (44):

```
id · title · shortDescription · slug · metaTitle · metaDescription
publicationDate · publishedAt · updatedDate
image · cover · rights · image_description · cover_position · miniature_position
mainCategory · category · section · subcategory · tags · participants · program
exhibition · occupation · presential · online
accessibility{8 flags} · hasAudioDescription · hasSubtitle · hasLibras · ...
startDate · endDate · initDate · initHour · endHour · schedules
ticket · hideTicket · soldOut · hideOnlineAccess
page{uuid, pageType, sections[]} · template_type · observatorio_require_login
```

O corpo editorial vive em `page.sections[].contentHtml` — HTML colado do Word, com
resíduos de `mso-` e entidades escapadas.

### Preenchimento efetivo

| Campo | Preenchido | Leitura |
|---|---|---|
| `tags` | 85% | Vocabulário melhor do que se esperava |
| `rights` (crédito) | 83% | Boa disciplina editorial |
| `image_description` (alt) | 79% | Acessibilidade parcial |
| `participants` | 3% | **E só contém colunistas** |
| `startDate` | 3% | Quase nenhum conteúdo é datado como evento |
| `schedules` (ocorrências) | **0%** | O campo existe e **nunca foi usado** |
| Lugar, espaço, geolocalização | **não existe** | Não há campo algum |
| Preço | **não existe** | Apenas o booleano `ticket` |

---

## 4. As quatro lacunas estruturais

**1. Não existe entidade "artista".**
O campo `participants` aparece 488 vezes e em 100% delas contém uma pessoa com
`columnist: true` — ou seja, **autores de texto, não artistas**. Os artistas existem
apenas como texto corrido dentro do HTML. Em `a-carnauba-como-testemunha`, o fotógrafo
Maurício Pokémon e a artesã Fátima Santos são citados, descritos e entrevistados — e
nenhum dos dois é uma entidade consultável. O acervo tem 490 mil caracteres de texto
editorial só nas 53 matérias amostradas; o conhecimento está lá, preso em prosa.

**2. Não existe ocorrência.**
`schedules` está vazio em 100 de 100 eventos. Um evento é um intervalo `startDate →
endDate` com hora `00:00`. Uma visita mediada mensal aparece como um único registro de
31/05 a 13/12. Não há como saber que sessões existem, nem notificar mudança de horário.

**3. Não existe território.**
Nenhum campo de local, endereço, cidade ou coordenada em todo o modelo. Um mapa é
tecnicamente impossível hoje, e qualquer indicador territorial teria de ser inventado.

**4. Não existe pessoa-usuária.**
Onze sistemas, onze logins, nenhum repertório. Não há como saber que quem assistiu a um
documentário no IC Play é quem agendou uma visita.

---

## 5. O que já existe e é forte

Estes ativos são a vantagem competitiva da proposta — e são reais, não hipotéticos.

**Vocabulário controlado de linguagens artísticas.**
O programa Rumos mantém 29 expressões cadastradas: *acervo, animação, arquitetura, arte
e tecnologia, artes visuais, audiovisual, cidade, cinema, circo, culinária, cultura
popular, curta-metragem, dança, dança contemporânea, documentário, feminismo,
fotografia, instalação, jornalismo, lgbtqia+, literatura, memória, música, oficinas,
patrimônio, performance, pesquisa, poesia, teatro.*
**As 29 aparecem no acervo.** É uma ontologia de linguagem pronta, mantida pela casa.

**Vocabulário de temas com uso consistente.**
123 tags distintas em 4.777 usos. Apenas 7% aparecem uma única vez — sinal de disciplina
editorial, não de tagueamento caótico. As mais usadas são exatamente linguagens
artísticas: literatura (319), música (307), audiovisual (280), cinema (276), artes
visuais (267), teatro (205).

**Acessibilidade modelada em 8 dimensões.**
`audio_description`, `libras`, `descriptive_subtitle`, `closed_caption`, `open_caption`,
`simultaneous_translation`, `stenotypy`, `subtitle`. Poucas instituições brasileiras
modelam acessibilidade com essa granularidade. É um diferencial da casa e deve virar
filtro de primeira classe no produto.

**Profundidade temporal.**
Acervo coletado cobre 2013–2026; exposições catalogadas desde 2012. Volume por ano:

| 2013 | 2014 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 84 | 88 | 102 | 177 | 224 | 321 | 1017 | 2377 | 1618 | 1348 | 1177 | 730 | 340 | 624 |

**Base editorial viva.**
152 pessoas cadastradas com bio, 23 colunas ativas, 14 podcasts, 4 séries, 49 formações
do Observatório, 15 anos de exposições e ocupações.

---

## 6. Identidade visual

Extraída de [`referencias/manual-marca-itau-cultural-2018.pdf`](../../referencias/manual-marca-itau-cultural-2018.pdf).

**Atributos da marca:** sólido, plural, digital.

**Cores principais**

| Cor | Hex | Pantone |
|---|---|---|
| Branco | `#ffffff` | — |
| Laranja | `#ff7800` | 158C |
| Preto | `#000000` | Black |

**Cores de apoio**

| Cor | Hex | Pantone |
|---|---|---|
| Lilás | `#7f3e98` | 266C |
| Azul | `#30c5f4` | 312C |
| Amarelo | `#f9df4d` | Yellow C |
| Rosa | `#e04b9b` | 232C |
| Verde | `#a6ce39` | 2292C |
| Verde-água | `#69c4a4` | 7465C |

Palavras associadas à paleta no manual: solidez, diversidade, informação, movimento,
atualidade, acessível, conexão.

**Tipografia:** Itaú Text (≤ 12 pt) e Itaú Display (≥ 13 pt); Myriad e Arial como
substitutas. Em produção o site usa **Open Sans** — divergência a resolver no protótipo.

**Grafismo:** a barra invertida `\`, em três variações — `\C` completo, apenas `\`, e
`\C` espaçado. Aparece no próprio manual como marcador de seção (`\Sólido`, `\Plural`,
`\Digital`).

**Chancela Fundação Itaú:** obrigatória em materiais apoiados. Azul Fit `#0C2D78`,
Laranja Fit `#EC7000`, Cyan Fit `#4DAFFF`.

---

## 7. Conclusão para a proposta

O Itaú Cultural não precisa de um site novo. Ele tem um acervo de valor raro —
2.534 entidades, 14 anos de curadoria, vocabulário próprio, acessibilidade modelada —
guardado num CMS que trata tudo como página de texto.

A proposta não é migrar conteúdo. É **dar estrutura ao que já existe**: transformar
prosa em entidades, intervalo em ocorrência, tag em conceito, leitor em repertório.
É isso que separa um site institucional de uma infraestrutura de descoberta.
