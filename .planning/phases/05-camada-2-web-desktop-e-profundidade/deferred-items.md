# Itens adiados — fase 5

Registrados por 05-08, e deliberadamente NÃO consertados aqui.

## 1. O `<title>` de `src/componentes/desertos.tsx` (herdado da fase 3)

**Diagnóstico de 05-05, confirmado:** `desertos.tsx` dá ao `<title>` de cada estado uma LISTA
de filhos, e React 19 exige `children` string única. No HTML exportado as 27 `<title>` saem
vazias, e a diferença derruba a hidratação de qualquer rota que renderize `CamadaDesertos` no
servidor. 05-05 contornou montando a camada só depois da hidratação.

**Por que não foi consertado em 05-08:** `desertos.tsx` é arquivo de produto e está fora do
`files_modified` deste plano, cujo trabalho é MEDIR sem alterar. Consertá-lo mudaria o
artefato e exigiria refazer as cinco suítes sobre outro `out/`.

**O conserto:** uma template string única em `desertos.tsx`, mais a remoção do
`useState/useEffect` de `observatorio.tsx`. Depois disso, `npm run verificar-fase5` precisa
rodar de novo — o gate do mapa de desertos mede os 27 retângulos.

**Custo hoje, medido:** 0 erro de console em 85 navegações; o texto da leitura («Sergipe»,
«Tocantins» e a frase que distingue registro de oferta cultural) está no HTML estático. O que
espera a hidratação são os 27 polígonos pintados.

## 2. A leitura de fonte sem comentários, duplicada pela quarta vez

`semComentarios`, `arquivosDe`, `importsDe` e `resolverModulo` são idênticos em
`verificar-fase2/3/4/5.mjs`. Extrair para um `fonte.mjs` exige tocar as quatro suítes na mesma
fase — nenhuma fase pôde fazer isso ainda sem invalidar a própria linha de base que compara.

## 3. Os 8 slugs malformados do gerador (registrado por 05-07)

8 das 529 mídias têm slug com acento, travessão, aspas curvas, espaço de largura zero ou o
título inteiro enxertado no meio. `resolverParametro` alcança as 8 pela chave, e as 529 rotas
resolvem — mas o defeito é do gerador do grafo, e `dados/` é somente-leitura desde a fase 3.
Fica registrado para quem for regerar o grafo.
