import localFont from "next/font/local";

/**
 * Itaú Text e Itaú Display — as duas famílias do manual de marca (v1 2018).
 *
 * Os arquivos vêm do CDN de tokens do próprio Itaú
 * (`ids.cloud.itau.com.br/cdn/tokens/…/assets/fonts/`, família *Pro*).
 * A stack em `globals.css` aponta para as variáveis que o `next/font` escreve
 * no `<html>`; se o face não carregar, cai em Arial, a substituta que o
 * próprio manual autoriza.
 *
 * `preload` desligado de propósito: são oito arquivos e o primeiro paint já
 * tem Arial com métrica ajustada (`adjustFontFallback`). Trocar no `swap` é
 * o mesmo flash que o site institucional aceita.
 */

export const itauText = localFont({
  src: [
    { path: "./fontes/ItauTextPro_Lt.woff2", weight: "200", style: "normal" },
    { path: "./fontes/ItauTextPro_Rg.woff2", weight: "400", style: "normal" },
    { path: "./fontes/ItauTextPro_Bd.woff2", weight: "700", style: "normal" },
    { path: "./fontes/ItauTextPro_XBd.woff2", weight: "900", style: "normal" },
  ],
  variable: "--fonte-itau-text-face",
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
});

export const itauDisplay = localFont({
  src: [
    { path: "./fontes/ItauDisplayPro_Lt.woff2", weight: "200", style: "normal" },
    { path: "./fontes/ItauDisplayPro_Rg.woff2", weight: "400", style: "normal" },
    { path: "./fontes/ItauDisplayPro_Bd.woff2", weight: "700", style: "normal" },
    { path: "./fontes/ItauDisplayPro_XBd.woff2", weight: "900", style: "normal" },
  ],
  variable: "--fonte-itau-display-face",
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
});
