"use client";

import { useMemo, useState } from "react";
import { normalizar } from "@/dados/indice";

/**
 * studio-publicar.tsx — o formulário da tela 33 (Parte 6 do feedback): cadastro
 * de evento com validação ao vivo, score de qualidade e aviso de possível
 * duplicata ANTES de salvar.
 *
 * SEM PERSISTÊNCIA, E DECLARADO: o protótipo é estático — «publicar» mostra o
 * registro que o Studio enviaria ao acervo, com a procedência que ele teria.
 * A checagem de duplicata roda sobre os títulos normalizados dos eventos REAIS
 * do grafo, que chegam por props do componente de servidor (DP-F) — a mesma
 * normalização do índice de busca, e o critério de identidade citado é o de
 * `duplicatas.ts`, não uma frase nova.
 */

export interface EventoExistente {
  slug: string;
  titulo: string;
  normalizado: string;
}

interface Props {
  eventos: EventoExistente[];
  criterioDeIdentidade: string;
}

const DIMENSOES = [
  "audiodescrição",
  "Libras",
  "legenda descritiva",
  "closed caption",
  "legenda aberta",
  "tradução simultânea",
  "estenotipia",
  "legenda",
] as const;

/** Campos que contam no score, com o rótulo do que falta. */
const CAMPOS_DO_SCORE: readonly { chave: string; rotulo: string; obrigatorio: boolean }[] = [
  { chave: "titulo", rotulo: "título", obrigatorio: true },
  { chave: "espaco", rotulo: "espaço", obrigatorio: false },
  { chave: "inicio", rotulo: "data de início", obrigatorio: true },
  { chave: "fim", rotulo: "data de fim", obrigatorio: false },
  { chave: "descricao", rotulo: "descrição", obrigatorio: false },
  { chave: "imagemAlt", rotulo: "descrição alternativa da imagem", obrigatorio: true },
  { chave: "acessibilidade", rotulo: "ficha de acessibilidade", obrigatorio: false },
];

export function FormularioPublicar({ eventos, criterioDeIdentidade }: Props) {
  const [titulo, setTitulo] = useState("");
  const [espaco, setEspaco] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagemAlt, setImagemAlt] = useState("");
  const [dimensoes, setDimensoes] = useState<string[]>([]);
  const [publicado, setPublicado] = useState(false);

  // Chaves de CÓDIGO (espelham CAMPOS_DO_SCORE), não texto de interface.
  const valores: Record<string, boolean> = {
    titulo: titulo.trim().length >= 3, // smaug-ignore ui-strings: chave de objeto, não string de UI
    espaco: espaco.trim().length > 0,
    inicio: /^\d{4}-\d{2}-\d{2}$/.test(inicio), // smaug-ignore ui-strings: chave de objeto, não string de UI
    fim: fim === "" || (/^\d{4}-\d{2}-\d{2}$/.test(fim) && fim >= inicio),
    descricao: descricao.trim().length >= 20,
    imagemAlt: imagemAlt.trim().length >= 10,
    acessibilidade: dimensoes.length > 0,
  };

  const problemas: string[] = [];
  if (titulo.trim() !== "" && !valores.titulo) problemas.push("o título precisa de ao menos 3 caracteres"); // smaug-ignore ui-strings: valores.titulo é acesso a chave de código
  if (inicio !== "" && !valores.inicio) problemas.push("a data de início precisa ser uma data completa"); // smaug-ignore ui-strings: valores.inicio é acesso a chave de código
  if (fim !== "" && !valores.fim) problemas.push("a data de fim precisa ser igual ou posterior ao início");
  if (imagemAlt.trim() !== "" && !valores.imagemAlt)
    problemas.push("a descrição alternativa precisa dizer o que há na imagem (10+ caracteres)");

  const obrigatoriosOk = CAMPOS_DO_SCORE.filter((c) => c.obrigatorio).every((c) => valores[c.chave]);
  const preenchidos = CAMPOS_DO_SCORE.filter((c) => valores[c.chave]);
  const score = Math.round((preenchidos.length / CAMPOS_DO_SCORE.length) * 100);
  const faltando = CAMPOS_DO_SCORE.filter((c) => !valores[c.chave]).map((c) => c.rotulo);

  // A duplicata, ANTES de salvar: título normalizado contra os eventos reais.
  const duplicatas = useMemo(() => {
    const n = normalizar(titulo);
    if (n.length < 4) return [];
    return eventos.filter((e) => e.normalizado === n || e.normalizado.startsWith(n)).slice(0, 3);
  }, [titulo, eventos]);

  const alternarDimensao = (d: string) =>
    setDimensoes((atual) => (atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d]));

  const campo =
    "rounded-m border border-borda-forte bg-superficie px-3 py-2 text-sm focus:border-acao focus:outline-none"; // smaug-ignore ui-strings: «acao» é nome de classe CSS, não texto de interface

  return (
    <form
      className="flex max-w-2xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (obrigatoriosOk) setPublicado(true);
      }}
    >
      {/* -------- score de qualidade, apontando o que falta -------- */}
      <section
        className="flex flex-col gap-1.5 rounded-g border border-borda bg-superficie-2 p-3"
        data-score={score}
      >
        <div className="flex items-baseline gap-2">
          <span className="tipo-detalhe font-bold">Qualidade do registro</span>
          <span className="tipo-destaque font-bold text-acao-tinta">{score}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-pilula bg-borda" aria-hidden>
          <div className="h-full rounded-pilula bg-acao transition-all" style={{ width: `${score}%` }} />
        </div>
        <p className="tipo-legenda text-tinta-2">
          {faltando.length === 0
            ? "Registro completo — os sete campos que o score mede estão preenchidos."
            : `Falta: ${faltando.join(", ")}.`}
        </p>
      </section>

      {/* -------- os campos -------- */}
      <label className="flex flex-col gap-1">
        <span className="tipo-detalhe font-bold">
          Título do evento <span className="text-acao-tinta">*</span>
        </span>
        <input
          type="text"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            setPublicado(false);
          }}
          className={campo}
          placeholder="Ocupação Fulana de Tal"
        />
      </label>

      {/* -------- aviso de duplicata ANTES de salvar -------- */}
      {duplicatas.length > 0 ? (
        <section
          className="flex flex-col gap-1.5 rounded-m border-2 border-acao bg-superficie-2 p-3"
          data-aviso-duplicata={duplicatas.length}
        >
          <p className="tipo-detalhe font-bold text-acao-tinta">
            Possível duplicata — {duplicatas.length === 1 ? "1 evento existente casa" : `${duplicatas.length} eventos existentes casam`}{" "}
            com este título:
          </p>
          <ul className="flex list-disc flex-col gap-0.5 pl-5">
            {duplicatas.map((d) => (
              <li key={d.slug} className="tipo-legenda">
                <a href={`/evento/${d.slug}/`} target="_blank" rel="noreferrer" className="font-semibold text-acao-tinta">
                  {d.titulo} ↗
                </a>
              </li>
            ))}
          </ul>
          <p className="tipo-legenda leading-snug text-tinta-2">{criterioDeIdentidade}</p>
        </section>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="tipo-detalhe font-bold">Espaço</span>
        <input type="text" value={espaco} onChange={(e) => setEspaco(e.target.value)} className={campo} placeholder="Auditório Itaú Cultural" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="tipo-detalhe font-bold">
            Início <span className="text-acao-tinta">*</span>
          </span>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={campo} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="tipo-detalhe font-bold">Fim</span>
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className={campo} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="tipo-detalhe font-bold">Descrição</span>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className={campo} placeholder="O que acontece, para quem, por quê — 20 caracteres ou mais contam no score." />
      </label>

      <label className="flex flex-col gap-1">
        <span className="tipo-detalhe font-bold">
          Descrição alternativa da imagem <span className="text-acao-tinta">*</span>
        </span>
        <input
          type="text"
          value={imagemAlt}
          onChange={(e) => setImagemAlt(e.target.value)}
          className={campo}
          placeholder="O que uma pessoa que não vê a imagem precisa saber dela"
        />
        <span className="tipo-legenda text-tinta-3">
          Obrigatória: imagem sem descrição alternativa não entra no acervo.
        </span>
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="tipo-detalhe font-bold">Ficha de acessibilidade</legend>
        <div className="flex flex-wrap gap-1.5">
          {DIMENSOES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={dimensoes.includes(d)}
              onClick={() => alternarDimensao(d)}
              className={
                dimensoes.includes(d)
                  ? "rounded-pilula bg-tinta px-2.5 py-1 text-xs font-bold text-fundo"
                  : "rounded-pilula border border-borda-forte px-2.5 py-1 text-xs font-semibold text-tinta-2"
              }
            >
              {d}
            </button>
          ))}
        </div>
        <p className="tipo-legenda text-tinta-3">
          O que não for marcado entra como «não declarado» — nunca como «não tem».
        </p>
      </fieldset>

      {problemas.length > 0 ? (
        <ul className="flex list-disc flex-col gap-0.5 pl-5" data-problemas={problemas.length}>
          {problemas.map((p) => (
            <li key={p} className="tipo-legenda text-acao-tinta">
              {p}
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="submit"
        disabled={!obrigatoriosOk}
        className="w-fit rounded-pilula bg-acao px-5 py-2.5 text-sm font-bold text-sobre-acao transition-opacity disabled:opacity-40"
      >
        Publicar no acervo
      </button>
      {!obrigatoriosOk ? (
        <p className="tipo-legenda text-tinta-3">
          O botão libera com título, data de início e descrição alternativa da imagem
          válidos.
        </p>
      ) : null}

      {/* -------- o registro que SERIA publicado, declarado -------- */}
      {publicado ? (
        <section className="flex flex-col gap-1.5 rounded-g border border-borda bg-superficie-2 p-4" data-registro-simulado>
          {/* O AVISO FICA — quem apertou «publicar» precisa saber que nada foi
              gravado, senão o botão mente. O que mudou é de onde ele fala: antes
              era «este protótipo é estático e não persiste nada», que explica o
              MECANISMO; agora diz a consequência, que é o que muda a decisão de
              quem está na tela. */}
          <p className="tipo-detalhe font-bold">✓ Registro pronto — mas nada foi gravado</p>
          <p className="tipo-legenda leading-snug text-tinta-2">
            Nesta demonstração o envio não é salvo. Abaixo está exatamente o que iria para o
            acervo, com procedência «produtor» e score {score}%.
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 tipo-legenda">
            <dt className="font-bold">título</dt>
            <dd>{titulo}</dd>
            <dt className="font-bold">espaço</dt>
            <dd>{espaco || "— não informado"}</dd>
            <dt className="font-bold">período</dt>
            <dd>
              {inicio}
              {fim ? ` → ${fim}` : ""}
            </dd>
            <dt className="font-bold">acessibilidade</dt>
            <dd>{dimensoes.length ? dimensoes.join(", ") : "nenhuma dimensão declarada"}</dd>
          </dl>
        </section>
      ) : null}
    </form>
  );
}
