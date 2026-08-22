# Funcionalidades — Agenda Cultural BR

86 funcionalidades, organizadas por operação sobre o grafo (não por tela).
**★ = MVP** (57 itens).

Documento de apoio ao [PRD](PRD.md).

---

## 1. Descobrir

1. ★ Feed de descoberta montado por caminhada no grafo, não por popularidade
2. ★ Entrada por disposição, não por categoria ("tenho 2h", "com criança", "de graça e perto", "quero algo que eu nunca vi")
3. ★ Trilha de primeira vez — sequência guiada para quem nunca experimentou aquela linguagem
4. Fios de conexão navegáveis ("isto vem daquilo")
5. Serendipidade dosada — injeção controlada de itens fora do perfil
6. ★ Explicação de toda recomendação ("por que isto apareceu para mim")
7. ★ Destaque curado capaz de sobrepor o algoritmo
8. Descoberta por adjacência de repertório — um passo além do conhecido, nunca dez

## 2. Acontece (agenda)

9. ★ Página de Evento como entidade única, com N ocorrências
10. ★ Lista de ocorrências: data, hora, espaço, preço
11. ★ Filtros ontológicos: linguagem, gratuidade, acessibilidade, faixa etária, território
12. ★ Salvar ocorrência e criar lembrete
13. ★ Alerta de alteração de horário ou cancelamento
14. ★ "Eu fui" — registro de repertório
15. ★ Ficha de acessibilidade do evento e do espaço
16. Ingresso ou inscrição via produtor ou agendamento IC
17. Evento de longa duração (exposição, ocupação) com regra própria de vigência
18. Compartilhar evento ou trilha

## 3. Mapa & Território

19. ★ Mapa como lente sobre qualquer resultado, nunca como home
20. ★ Modo Cidade — planejar estadia de N dias em território desconhecido
21. ★ Roteiro do dia equilibrando deslocamento e densidade
22. Recorte por bairro e região, não só município
23. Camada de desertos culturais — onde não há oferta
24. "Perto de mim agora", por raio e por tempo

## 4. Play

25. ★ Catálogo unificado: vídeo, podcast, série, playlist
26. ★ Player com retomada de onde parou
27. Exposição virtual e tour virtual como item navegável
28. ★ Play conectado ao evento ("não pode ir? veja isto")
29. Legenda, libras e audiodescrição como filtro
30. Download e modo offline — baixa banda, escala nacional

## 5. Enciclopédia & Acervo

31. ★ Página de Artista: papéis, obras, movimentos, eventos vinculados
32. ★ Página de Obra com suas expressões e montagens
33. Página de Movimento e Linguagem
34. ★ Verbete embutido no fluxo, não link para fora
35. Acervo e coleção com mídia
36. Linha do tempo e mapa de influências
37. ★ Reconciliação de artista ingerido com verbete (controle de autoridade)

## 6. Leituras

38. ★ Matéria, coluna e entrevista ligadas a entidades do grafo
39. Especiais como trilha curada (Ancestralidade, Arte e Acesso, Mekukradjá)
40. ★ "Aprofunda isto" a partir de qualquer evento ou obra
41. Publicações e pesquisas com leitor próprio

## 7. Formação

42. Cursos e formações
43. Biblioteca — consulta ao acervo bibliográfico
44. ★ Agendamento de visita e visita educativa
45. Área do educador com material didático

## 8. Oportunidades

46. ★ Editais, prêmios e convocatórias filtrados por perfil
47. Inscrição e acompanhamento
48. ★ Alerta de edital compatível com o perfil do artista ou produtor
49. ★ Onboarding de produtor a partir do edital — vira agente no grafo

## 9. Meu Repertório

50. ★ Identidade única em todo o ecossistema
51. ★ Onboarding por disposição, não formulário de gostos
52. ★ Salvos, agenda pessoal e histórico
53. ★ Mapa de repertório — o que atravessou e o que fica adjacente
54. Trilhas próprias e compartilháveis
55. ★ Preferências de acessibilidade aplicadas a todo o app
56. Notificações e newsletter
57. ★ Privacidade LGPD: consentimento, exportação, exclusão

## 10. Studio — produtor e instituição

58. ★ Cadastro e verificação de agente
59. ★ Publicação de evento com validação em tempo real
60. ★ Gestão de ocorrências — alterar horário dispara o item 13
61. ★ Resolução de duplicata sugerida pelo sistema
62. Painel de alcance e público, devolvido ao produtor
63. Importação em lote por API ou feed (iCal, JSON)
64. ★ Score de qualidade do cadastro

## 11. Redação — curador e editor

65. ★ Fila de moderação e aprovação
66. ★ Editor de trilha curada
67. ★ Destaque e veto editorial com registro de autoria
68. Curadoria territorial delegada a curador regional
69. ★ Revisão das sugestões da IA — human-in-the-loop
70. Calendário editorial

## 12. Observatório & Dados

71. ★ Dashboards por público: editorial, produto, parceiro, institucional
72. ★ KPIs de produto — aquisição, engajamento, descoberta, retenção
73. ★ Indicadores de impacto cultural — ampliação de repertório, novos artistas, diversidade
74. ★ Indicadores territoriais e institucionais
75. API pública e dados abertos versionados
76. ★ Anonimização e governança LGPD
77. ★ Observabilidade de dados — proveniência, cobertura, frescor

## Transversais

78. ★ Busca unificada sobre o grafo — agenda, acervo, editorial e verbetes num só índice
79. ★ Busca em linguagem natural traduzida em consulta estruturada e explicada
80. ★ Facetas derivadas da ontologia
81. ★ Zero-resultado vira descoberta, não beco sem saída
82. ★ Ingestão com extração assistida por IA e score de confiança
83. ★ Deduplicação em dois estágios: chave determinística e casamento probabilístico
84. ★ Similaridade sempre com justificativa legível
85. Feedback do curador retroalimentando o modelo
86. ★ Limites explícitos da IA: não publica, não define destaque, não escreve verbete

---

## Cobertura dos fluxos obrigatórios do RFP

| Fluxo exigido | Funcionalidades |
|---|---|
| Onboarding | 51, 55, 2 |
| Descoberta | 1–8 |
| Busca | 78–81 |
| Mapa | 19–24 |
| Página do evento | 9–18 |
| Perfil | 50–57 |
| Recomendações | 1, 6, 8, 84 |
| Área editorial | 65–70 |
| Página do produtor/instituição | 58–64 |
| **Cobertura** | **completa** |
