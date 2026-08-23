"use client";

import { useEffect, useState } from "react";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";

/**
 * seletor-tema.tsx — sistema, claro ou escuro, no menu da conta.
 *
 * O TEMA SEGUIA SÓ O SISTEMA até 23/08, quando o cliente pediu a escolha de
 * volta. O padrão continua sendo o sistema operacional: sem nada guardado,
 * nenhum atributo é escrito na raiz e quem decide é a media query
 * `prefers-color-scheme` de `tokens.css`. A escolha manual é um ATRIBUTO na
 * raiz, e ela existe só quando alguém a fez.
 *
 * QUEM APLICA NA PRIMEIRA PINTURA É `public/antes-da-pintura.js`, não este
 * componente: ele roda antes do React e evita o lampejo de tema errado entre a
 * pintura e a hidratação. Aqui mora a ESCOLHA; lá, a aplicação no boot.
 *
 * `Segmento` e não três chips: é escolha exclusiva e obrigatória — sempre
 * exatamente um tema está valendo, e «nenhum» não é estado (base/segmento.tsx).
 */

/** A chave no espaço `agenda-cultural:`. Espelhada em `antes-da-pintura.js`. */
export const CHAVE_DO_TEMA = "agenda-cultural:tema";

const TEMAS = [
  { valor: "sistema", rotulo: "Sistema" },
  { valor: "claro", rotulo: "Claro" },
  { valor: "escuro", rotulo: "Escuro" },
] as const;

type Tema = (typeof TEMAS)[number]["valor"];

function lerTema(): Tema {
  try {
    const guardado = window.localStorage.getItem(CHAVE_DO_TEMA);
    return guardado === "claro" || guardado === "escuro" ? guardado : "sistema";
  } catch {
    // Storage bloqueado (modo privado, iframe): o tema é o do sistema, que é o
    // padrão. Ler preferência é conveniência, nunca requisito.
    return "sistema";
  }
}

function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "sistema") raiz.removeAttribute("data-tema");
  else raiz.setAttribute("data-tema", tema);
  try {
    if (tema === "sistema") window.localStorage.removeItem(CHAVE_DO_TEMA);
    else window.localStorage.setItem(CHAVE_DO_TEMA, tema);
  } catch (erro) {
    // smaug-ignore empty-catch: sem storage a escolha vale para esta sessão e
    // não sobrevive ao recarregar. Perder a preferência é aceitável; travar a
    // troca de tema por causa disso não seria.
    void erro;
  }
}

export function SeletorDeTema() {
  const [tema, setTema] = useState<Tema>("sistema");

  // A leitura mora no efeito, nunca no primeiro render: sob `output: "export"` o
  // HTML é gerado no build, e ler `localStorage` no render divergiria da
  // hidratação. O atributo já está aplicado desde antes da pintura.
  useEffect(() => setTema(lerTema()), []);

  return (
    <div className="seletor-tema">
      <p className="tipo-micro text-tinta-3">Tema</p>
      <Segmento rotulo="Tema da interface">
        {TEMAS.map((t) => (
          <OpcaoDeSegmento
            key={t.valor}
            data-tema-opcao={t.valor}
            selecionado={tema === t.valor}
            onClick={() => {
              setTema(t.valor);
              aplicarTema(t.valor);
            }}
          >
            {t.rotulo}
          </OpcaoDeSegmento>
        ))}
      </Segmento>
    </div>
  );
}
