import {
  CheckCircle2,
  Clock3,
  TriangleAlert,
} from "lucide-react";

import {
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";


const FUSO_HORARIO =
  "America/Sao_Paulo";


/* =========================================================
   OBTÉM DATA/HORA NO FUSO DE SÃO PAULO
========================================================= */

function obterPartesData(data) {
  if (!data) {
    return null;
  }

  const valor =
    data instanceof Date
      ? data
      : new Date(data);

  if (
    Number.isNaN(
      valor.getTime(),
    )
  ) {
    return null;
  }

  const partes =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          FUSO_HORARIO,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hourCycle:
          "h23",
      },
    ).formatToParts(valor);

  const mapa =
    Object.fromEntries(
      partes.map(
        (parte) => [
          parte.type,
          parte.value,
        ],
      ),
    );

  return {
    ano:
      Number(mapa.year),

    mes:
      Number(mapa.month),

    dia:
      Number(mapa.day),

    hora:
      Number(mapa.hour),

    minuto:
      Number(mapa.minute),

    segundo:
      Number(mapa.second),
  };
}


/* =========================================================
   CHAVE DA DATA
========================================================= */

function chaveData(partes) {
  if (!partes) {
    return "";
  }

  return [
    partes.ano,

    String(
      partes.mes,
    ).padStart(
      2,
      "0",
    ),

    String(
      partes.dia,
    ).padStart(
      2,
      "0",
    ),
  ].join("-");
}


/* =========================================================
   MINUTOS DO DIA
========================================================= */

function minutosDoDia(partes) {
  if (!partes) {
    return 0;
  }

  return (
    partes.hora * 60 +
    partes.minuto
  );
}


/* =========================================================
   FORMATA DATA/HORA
========================================================= */

function formatarDataHora(valor) {
  if (!valor) {
    return "Nunca sincronizado";
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        FUSO_HORARIO,

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
  ).format(data);
}


/* =========================================================
   ANALISA STATUS DA SINCRONIZAÇÃO

   JANELA DA MANHÃ
   05:00
   05:10
   05:20
   05:30

   JANELA DO MEIO-DIA
   12:00
   12:10
   12:20
   12:30
========================================================= */

function analisarSincronizacao({
  agora,
  ultimaSincronizacao,
}) {
  const partesAgora =
    obterPartesData(agora);

  const partesUltima =
    obterPartesData(
      ultimaSincronizacao,
    );


  if (!partesAgora) {
    return {
      tipo:
        "neutro",

      titulo:
        "Status indisponível",

      descricao:
        "Não foi possível verificar o horário atual.",
    };
  }


  if (!partesUltima) {
    return {
      tipo:
        "erro",

      titulo:
        "Dados não atualizados",

      descricao:
        "Nenhuma sincronização bem-sucedida foi encontrada.",
    };
  }


  const hoje =
    chaveData(partesAgora);

  const dataUltima =
    chaveData(partesUltima);

  const minutosAgora =
    minutosDoDia(
      partesAgora,
    );

  const minutosUltima =
    minutosDoDia(
      partesUltima,
    );


  const sincronizouHoje =
    hoje === dataUltima;


  /* =======================================================
     HORÁRIOS
  ======================================================= */

  const INICIO_MANHA =
    5 * 60;

  const LIMITE_MANHA =
    5 * 60 + 40;

  const INICIO_MEIO_DIA =
    12 * 60;

  const LIMITE_MEIO_DIA =
    12 * 60 + 40;


  const sincronizouManha =
    sincronizouHoje &&
    minutosUltima >=
      INICIO_MANHA;


  const sincronizouMeioDia =
    sincronizouHoje &&
    minutosUltima >=
      INICIO_MEIO_DIA;


  /* =======================================================
     ANTES DAS 05:00
  ======================================================= */

  if (
    minutosAgora <
    INICIO_MANHA
  ) {
    return {
      tipo:
        "sucesso",

      titulo:
        "Dados disponíveis",

      descricao:
        "Próxima atualização automática às 05:00.",
    };
  }


  /* =======================================================
     ENTRE 05:00 E 05:40
  ======================================================= */

  if (
    minutosAgora <
    LIMITE_MANHA
  ) {
    if (
      sincronizouManha
    ) {
      return {
        tipo:
          "sucesso",

        titulo:
          "Dados atualizados",

        descricao:
          "Atualização da manhã concluída.",
      };
    }


    return {
      tipo:
        "aguardando",

      titulo:
        "Atualizando dados",

      descricao:
        "Tentativas automáticas em andamento.",
    };
  }


  /* =======================================================
     ENTRE 05:40 E 12:00
  ======================================================= */

  if (
    minutosAgora <
    INICIO_MEIO_DIA
  ) {
    if (
      sincronizouManha
    ) {
      return {
        tipo:
          "sucesso",

        titulo:
          "Dados atualizados",

        descricao:
          "Atualização da manhã concluída.",
      };
    }


    return {
      tipo:
        "erro",

      titulo:
        "Dados desatualizados",

      descricao:
        "A atualização automática das 05:00 não foi concluída.",
    };
  }


  /* =======================================================
     ENTRE 12:00 E 12:40
  ======================================================= */

  if (
    minutosAgora <
    LIMITE_MEIO_DIA
  ) {
    if (
      sincronizouMeioDia
    ) {
      return {
        tipo:
          "sucesso",

        titulo:
          "Dados atualizados",

        descricao:
          "Atualização das 12:00 concluída.",
      };
    }


    return {
      tipo:
        "aguardando",

      titulo:
        "Atualizando dados",

      descricao:
        "Tentativas automáticas em andamento.",
    };
  }


  /* =======================================================
     DEPOIS DAS 12:40
  ======================================================= */

  if (
    sincronizouMeioDia
  ) {
    return {
      tipo:
        "sucesso",

      titulo:
        "Dados atualizados",

      descricao:
        "Atualização das 12:00 concluída.",
    };
  }


  return {
    tipo:
      "erro",

    titulo:
      "Dados desatualizados",

    descricao:
      "A atualização automática das 12:00 não foi concluída.",
  };
}


/* =========================================================
   COMPONENTE
========================================================= */

function FinanceiroStatusSincronizacao({
  sincronizacao,
  carregando = false,
}) {
  const [
    agora,
    definirAgora,
  ] =
    useState(
      () =>
        new Date(),
    );


  /* =======================================================
     ATUALIZA STATUS A CADA MINUTO
  ======================================================= */

  useEffect(
    () => {
      const intervalo =
        window.setInterval(
          () => {
            definirAgora(
              new Date(),
            );
          },
          60_000,
        );


      return () => {
        window.clearInterval(
          intervalo,
        );
      };
    },
    [],
  );


  const ultimaSincronizacao =
    sincronizacao
      ?.ultima_sincronizacao ??
    null;


  const analise =
    useMemo(
      () =>
        analisarSincronizacao({
          agora,
          ultimaSincronizacao,
        }),
      [
        agora,
        ultimaSincronizacao,
      ],
    );


  /* =======================================================
     CARREGANDO
  ======================================================= */

  if (carregando) {
    return (
      <div className="financeiro-sync financeiro-sync-neutro">

        <div className="financeiro-sync-icone">
          <Clock3
            size={16}
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </div>


        <div className="financeiro-sync-conteudo">

          <strong>
            Verificando atualização
          </strong>

          <span>
            Consultando status...
          </span>

        </div>

      </div>
    );
  }


  /* =======================================================
     ÍCONE
  ======================================================= */

  let Icone =
    CheckCircle2;


  if (
    analise.tipo ===
    "aguardando"
  ) {
    Icone =
      Clock3;
  }


  if (
    analise.tipo ===
    "erro"
  ) {
    Icone =
      TriangleAlert;
  }


  /* =======================================================
     VISUAL
  ======================================================= */

  return (
    <div
      className={[
        "financeiro-sync",
        `financeiro-sync-${analise.tipo}`,
      ].join(" ")}
      title={
        analise.descricao
      }
    >

      <div className="financeiro-sync-icone">

        <Icone
          size={16}
          strokeWidth={2.2}
          aria-hidden="true"
        />

      </div>


      <div className="financeiro-sync-conteudo">

        <strong>
          {analise.titulo}
        </strong>


        <span>
          Última atualização:{" "}
          {formatarDataHora(
            ultimaSincronizacao,
          )}
        </span>

      </div>

    </div>
  );
}


export default memo(
  FinanceiroStatusSincronizacao,
);