import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Clock3,
} from "lucide-react";

/* =========================================================
   ATUALIZACAO AUTOMATICA
   ---------------------------------------------------------
   Sincronizacao principal de pedidos:
   a cada 5 minutos.

   Horarios:
   00, 05, 10, 15, 20, 25,
   30, 35, 40, 45, 50, 55.
========================================================= */

const INTERVALO_ATUALIZACAO_MINUTOS =
  5;

const INTERVALO_RELOGIO =
  1000;


/* =========================================================
   PROXIMA ATUALIZACAO
========================================================= */

function obterProximaAtualizacao(
  dataAtual,
) {
  const agora =
    dataAtual instanceof Date
      ? dataAtual
      : new Date();

  const proxima =
    new Date(
      agora,
    );

  proxima.setSeconds(
    0,
    0,
  );

  const minutoAtual =
    agora.getMinutes();

  const proximoMinuto =
    (
      Math.floor(
        minutoAtual /
          INTERVALO_ATUALIZACAO_MINUTOS,
      ) + 1
    ) *
    INTERVALO_ATUALIZACAO_MINUTOS;

  if (
    proximoMinuto >= 60
  ) {
    proxima.setHours(
      proxima.getHours() + 1,
      0,
      0,
      0,
    );

    return proxima;
  }

  proxima.setMinutes(
    proximoMinuto,
    0,
    0,
  );

  return proxima;
}


/* =========================================================
   FORMATAR HORARIO
========================================================= */

function formatarHorario(
  valor,
) {
  if (!valor) {
    return "-";
  }

  const data =
    valor instanceof Date
      ? valor
      : new Date(
          valor,
        );

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }

  return data.toLocaleTimeString(
    "pt-BR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


/* =========================================================
   FORMATAR DATA E HORA
========================================================= */

function formatarDataHora(
  valor,
) {
  if (!valor) {
    return "-";
  }

  const data =
    valor instanceof Date
      ? valor
      : new Date(
          valor,
        );

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }

  return data.toLocaleString(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


/* =========================================================
   COMPONENTE
========================================================= */

export default function AtualizacaoAutomatica({
  atualizadoEm,
}) {
  /* =======================================================
     RELOGIO LOCAL

     Serve apenas para atualizar visualmente
     o horario da proxima sincronizacao.

     Nao consulta:
     - Omie
     - Supabase
     - Edge Function
  ======================================================= */

  const [
    agora,
    setAgora,
  ] =
    useState(
      () =>
        new Date(),
    );


  useEffect(
    () => {
      const intervalo =
        window.setInterval(
          () => {
            setAgora(
              new Date(),
            );
          },
          INTERVALO_RELOGIO,
        );

      return () => {
        window.clearInterval(
          intervalo,
        );
      };
    },
    [],
  );


  /* =======================================================
     PROXIMA EXECUCAO
  ======================================================= */

  const proximaAtualizacao =
    useMemo(
      () =>
        obterProximaAtualizacao(
          agora,
        ),
      [
        agora,
      ],
    );


  /* =======================================================
     TOOLTIP
  ======================================================= */

  const tooltip =
    atualizadoEm
      ? (
          `Última sincronização: ${formatarDataHora(
            atualizadoEm,
          )} | Próxima execução automática: ${formatarDataHora(
            proximaAtualizacao,
          )}`
        )
      : (
          `Aguardando primeira sincronização. Próxima execução automática: ${formatarDataHora(
            proximaAtualizacao,
          )}`
        );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="pedidos-atualizacao-minimal"
      title={
        tooltip
      }
    >
      {/* ICONE */}

      <div className="pedidos-atualizacao-minimal-icone">
        <Clock3
          size={15}
          strokeWidth={2}
        />
      </div>


      {/* CONTEUDO */}

      <div className="pedidos-atualizacao-minimal-conteudo">
        {/* STATUS */}

        <div className="pedidos-atualizacao-minimal-topo">
          <span className="pedidos-atualizacao-minimal-status">
            <span className="pedidos-atualizacao-minimal-ponto" />

            Atualização automática
          </span>
        </div>


        {/* HORARIOS */}

        <div className="pedidos-atualizacao-minimal-horarios">
          <span>
            <span className="pedidos-atualizacao-minimal-label">
              Última
            </span>

            <strong>
              {formatarHorario(
                atualizadoEm,
              )}
            </strong>
          </span>


          <span className="pedidos-atualizacao-minimal-divisor">
            •
          </span>


          <span>
            <span className="pedidos-atualizacao-minimal-label">
              Próxima
            </span>

            <strong className="pedidos-atualizacao-minimal-proxima">
              {formatarHorario(
                proximaAtualizacao,
              )}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}