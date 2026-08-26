/**
 * studio-literal.tsx — o valor literal que quebra onde a estrutura permite.
 *
 * POR QUE ELE EXISTE. `.studio-literal` é monoespaçado porque quem confere uma chave de
 * identidade compara CARACTERE a caractere, e fonte proporcional esconde exatamente a
 * diferença que a tela existe para mostrar. Mas `overflow-wrap: anywhere` — que a folha
 * precisa ter para o valor não estourar a coluna — deixa o navegador quebrar em qualquer
 * ponto, e ele escolhe o hífen mais próximo do fim da linha. Medido em 25.08, numa coluna
 * de 352 px:
 *
 *     ocorrencia|…|espaco:derivado:sesc-piracicaba|2026-
 *     07-16T20:00
 *
 * A data foi partida ao meio. Não é ilegal tipograficamente, e é péssimo aqui: `2026-` numa
 * linha e `07-16` na outra fazem duas chaves iguais parecerem diferentes e duas diferentes
 * parecerem iguais — que é o inverso do trabalho desta tela.
 *
 * A SAÍDA É DAR AO NAVEGADOR PONTOS MELHORES, não proibi-lo de quebrar. `<wbr>` depois de
 * cada separador estrutural (`|`, `:`, `/`) é uma oportunidade de quebra de custo zero: o
 * navegador prefere essas, e só cai no `anywhere` se um segmento inteiro não couber
 * sozinho. O valor passa a quebrar por SEGMENTO, que é como ele se lê.
 *
 * Ele não é `"use client"`: é uma função pura de string para JSX, e serve tanto ao
 * componente de servidor quanto ao de cliente que o importar.
 */

/** Os separadores estruturais das chaves e dos ids da ontologia. */
const SEPARADORES = new Set(["|", ":", "/"]);

/**
 * Fatia o valor em pedaços que TERMINAM em separador.
 *
 * Sem regex: `String.split` com grupo de captura devolveria os separadores como itens
 * próprios e exigiria recolá-los, e um `RegExp` com flag `g` reusado em `.test()` carrega
 * `lastIndex` entre chamadas — alternaria verdadeiro e falso para a mesma entrada, que é o
 * tipo de defeito que só aparece no segundo valor da lista.
 */
function emSegmentos(valor: string): string[] {
  const partes: string[] = [];
  let atual = "";
  for (const c of valor) {
    atual += c;
    if (SEPARADORES.has(c)) {
      partes.push(atual);
      atual = "";
    }
  }
  if (atual !== "") partes.push(atual);
  return partes;
}

export function Literal({ valor, className }: { valor: string; className?: string }) {
  const partes = emSegmentos(valor);

  return (
    <span className={className ? `studio-literal ${className}` : "studio-literal"}>
      {partes.map((parte, i) => (
        <span key={i}>
          {parte}
          {/* Nenhum `<wbr>` no último pedaço: ele ofereceria uma quebra que só produz
              linha vazia. */}
          {i < partes.length - 1 ? <wbr /> : null}
        </span>
      ))}
    </span>
  );
}
