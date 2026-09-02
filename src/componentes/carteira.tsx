"use client";

import Link from "next/link";
import { useState } from "react";
import { BarraDeNivel, Fichas, Moeda, Painel, SeloDaSequencia, SemanaDaSequencia, Vazio } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { FASES_DE_ENTREGA, recompensaPorId } from "@/dados/recompensas";
import { CONFIG } from "@/dados/pontos";
import { extrato } from "@/lib/pontos/livro";
import type { Ativo, FaseDoResgate, Resgate } from "@/lib/pontos/tipos";

const ROTULO_DO_ATIVO: Record<Ativo, string> = {
  ficha: "Fichas",
  percurso: "Percurso",
  reputacao: "Reputação",
};

/**
 * UM RÓTULO, E NÃO CINCO.
 *
 * As cinco etapas vinham escritas embaixo dos cinco segmentos, em colunas de `1fr`. Numa
 * moldura de 390px isso dá ~66px por coluna, e «Processando» não cabe: as palavras
 * transbordavam a própria coluna e se sobrepunham às vizinhas — «ProcessandoSeparado»
 * saía impresso na tela. A barra continua com os cinco segmentos, porque é ela que mostra
 * o progresso; o texto virou uma linha só, dizendo onde a entrega está agora.
 */
function Esteira({ fase }: { fase: FaseDoResgate }) {
  const atual = FASES_DE_ENTREGA.findIndex((f) => f.id === fase);
  /* Confirmado e contestado ficam FORA da lista das cinco: os dois vêm depois de
     «entregue» e são resposta de quem recebeu, não etapa da logística. A barra deles
     aparece cheia, que é o que a entrega de fato ficou. */
  const passo = atual < 0 ? FASES_DE_ENTREGA.length - 1 : atual;

  return (
    <div className="esteira">
      <div className="esteira-barra" aria-hidden>
        {FASES_DE_ENTREGA.map((etapa, i) => (
          <span key={etapa.id} className="esteira-trilho" data-alcancada={i <= passo ? "sim" : "nao"} />
        ))}
      </div>
      <p className="esteira-rotulo tipo-legenda">
        Etapa {passo + 1} de {FASES_DE_ENTREGA.length} · {FASES_DE_ENTREGA[passo].rotulo}
      </p>
    </div>
  );
}

/**
 * O cartão de entrega, e a confirmação DENTRO dele.
 *
 * Ela já morava em `/meu/notificacoes/`, alcançada pelo sino. Mas quem quer saber de um
 * resgate abre a CARTEIRA — é onde a pergunta «e o meu ingresso?» é feita —, e encontrar
 * ali uma barra parada, sem nada para fazer, é o que faz o fluxo parecer morto. As duas
 * telas mostram a mesma decisão porque as duas são lugares legítimos de encontrá-la.
 */
function CartaoDeResgate({ resgate }: { resgate: Resgate }) {
  const { motor } = usePontos();
  const recompensa = recompensaPorId(resgate.recompensaId);
  if (!recompensa) return null;

  const aguardando = resgate.fase === "entregue";
  const emApuracao = resgate.fase === "contestado";
  const confirmado = resgate.fase === "confirmado";

  return (
    <li className="cartao" data-fase-do-resgate={resgate.fase}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="tipo-detalhe font-bold">{recompensa.titulo}</span>
        <span className="tipo-legenda text-tinta-2 saldo-linha">
          <Moeda /> {recompensa.custo}
        </span>
      </div>

      <Esteira fase={resgate.fase} />

      {aguardando ? (
        <div className="resgate-confirmacao">
          <p className="tipo-legenda">O produtor marcou como entregue. Chegou até você?</p>
          <div className="resgate-acoes">
            <button
              type="button"
              className="notif-primario"
              onClick={() => motor.confirmarRecebimento(resgate.id)}
            >
              Recebi
            </button>
            {/* «Não recebi» leva para a tela de avisos porque ali cabe o formulário — o
                relato é obrigatório e não entra num cartão de lista sem espremê-lo. */}
            <Link href="/meu/notificacoes/" className="notif-secundario no-underline">
              Não recebi
            </Link>
          </div>
        </div>
      ) : null}

      {emApuracao ? (
        <p className="resgate-estado tipo-legenda" data-estado="apuracao">
          Em apuração com o produtor · resposta em até 24 horas. Se a entrega não tiver
          acontecido, as {recompensa.custo} fichas voltam para a carteira.
        </p>
      ) : null}

      {confirmado ? (
        <p className="resgate-estado tipo-legenda" data-estado="confirmado">
          Você confirmou o recebimento.
        </p>
      ) : null}
    </li>
  );
}

export function Carteira() {
  const { motor, hidratado, persistido } = usePontos();
  const [aba, setAba] = useState<Ativo>("ficha");

  if (!hidratado) {
    return <div className="saldo-painel" aria-busy="true" style={{ minHeight: "12rem" }} />;
  }

  const fichas = motor.saldoDe("ficha");
  const nivel = motor.nivel();
  const sequencia = motor.atual.sequencia;
  const linhas = extrato(motor.atual, aba);
  const resgates = motor.atual.resgates;

  return (
    <div className="flex flex-col gap-5">
      <div className="saldo-painel">
        <div className="flex flex-col gap-1">
          <span className="tipo-legenda text-tinta-2">Suas {CONFIG.termos.fichaPlural}</span>
          <span className="saldo-numero">
            <Moeda />
            {fichas.toLocaleString("pt-BR")}
          </span>
        </div>

        <BarraDeNivel nivel={nivel} />

        <div className="saldo-grade">
          <div className="saldo-celula">
            <span className="saldo-celula-valor">{motor.saldoDe("percurso").toLocaleString("pt-BR")}</span>
            <span className="tipo-legenda text-tinta-2">de percurso</span>
          </div>
          <div className="saldo-celula">
            <span className="saldo-celula-valor">{motor.saldoDe("reputacao").toLocaleString("pt-BR")}</span>
            <span className="tipo-legenda text-tinta-2">de reputação</span>
          </div>
          <div className="saldo-celula">
            <span className="saldo-celula-valor">{motor.atual.linguagensAlcancadas.length}</span>
            <span className="tipo-legenda text-tinta-2">linguagens atravessadas</span>
          </div>
          <div className="saldo-celula">
            <span className="saldo-celula-valor">{motor.atual.ufsAlcancadas.length}</span>
            <span className="tipo-legenda text-tinta-2">estados alcançados</span>
          </div>
        </div>

        <Link href="/recompensas" className="botao-acao no-underline">
          Ver o que dá para resgatar
        </Link>
      </div>

      <Painel titulo="Sequência" acao={<SeloDaSequencia fase={sequencia.fase} />}>
        <div className="flex items-baseline gap-2">
          <span className="saldo-celula-valor">{sequencia.contagem}</span>
          <span className="tipo-detalhe text-tinta-2">
            semanas seguidas · melhor: {sequencia.melhor} · {sequencia.protecoes}{" "}
            {sequencia.protecoes === 1 ? "proteção" : "proteções"}
          </span>
        </div>
        <SemanaDaSequencia marcas={sequencia.marcas} />
        <p className="tipo-legenda text-tinta-2">
          Basta um gesto por semana: terminar algo, ler uma matéria inteira ou confirmar presença
          num evento.
        </p>
      </Painel>

      <Painel titulo="Entregas">
        {resgates.length === 0 ? (
          <Vazio>
            Nada resgatado ainda. Quando você resgatar, a entrega aparece aqui com as cinco etapas.
          </Vazio>
        ) : (
          <ul className="flex list-none flex-col gap-3 p-0">
            {resgates.map((r) => (
              <CartaoDeResgate key={r.id} resgate={r} />
            ))}
          </ul>
        )}
      </Painel>

      <Painel titulo="Extrato">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROTULO_DO_ATIVO) as Ativo[]).map((ativo) => (
            <button
              key={ativo}
              type="button"
              className="botao-discreto"
              data-ativo={aba === ativo ? "sim" : "nao"}
              aria-pressed={aba === ativo}
              onClick={() => setAba(ativo)}
            >
              {ROTULO_DO_ATIVO[ativo]}
            </button>
          ))}
        </div>

        {linhas.length === 0 ? (
          <Vazio>Nenhum movimento de {ROTULO_DO_ATIVO[aba].toLowerCase()} ainda.</Vazio>
        ) : (
          <ul className="extrato-lista">
            {linhas.map((linha) => (
              <li key={linha.id} className="extrato-linha">
                <span className="tipo-detalhe">{linha.motivo}</span>
                <span className="extrato-valor" data-sentido={linha.sentido}>
                  {linha.sentido === "credito" ? "+" : "−"}
                  {linha.valor.toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="tipo-legenda text-tinta-2">
          Cada linha aponta para o gesto que a originou. O saldo é a soma delas, nunca um número
          guardado à parte.
        </p>
      </Painel>

      {!persistido && (
        <p className="aviso" data-tom="acao">
          Este navegador não está guardando o seu saldo — ele vale só nesta aba.
        </p>
      )}
    </div>
  );
}
