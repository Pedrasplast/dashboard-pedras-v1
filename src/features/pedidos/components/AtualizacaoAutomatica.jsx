import {
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Clock3,
} from "lucide-react";

import {
  formatarDataHora,
  formatarHorario,
  obterProximaAtualizacao,
} from "../pedidos.utils";

import "./AtualizacaoAutomatica.css";


const INTERVALO_RELOGIO =
  1000;


function AtualizacaoAutomatica({
  atualizadoEm,
}) {
  const [
    agora,
    setAgora,
  ] =
    useState(
      () =>
        new Date(),
    );


  /* =======================================================
     RELÓGIO
  ======================================================= */

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
     PRÓXIMA ATUALIZAÇÃO
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
     DESCRIÇÃO COMPLETA
  ======================================================= */

  const titulo =
    atualizadoEm
      ? `Atualização automática ativa. Última sincronização: ${formatarDataHora(
          atualizadoEm,
        )}. Próxima atualização: ${formatarDataHora(
          proximaAtualizacao,
        )}.`
      : `Atualização automática ativa. Aguardando primeira sincronização. Próxima atualização: ${formatarDataHora(
          proximaAtualizacao,
        )}.`;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="pedidos-atualizacao-minimal"
      title={
        titulo
      }
      aria-label={
        titulo
      }
    >

      <div
        className="pedidos-atualizacao-minimal-icone"
        aria-hidden="true"
      >
        <Clock3
          size={14}
          strokeWidth={2}
        />
      </div>


      <div className="pedidos-atualizacao-minimal-conteudo">

        <div className="pedidos-atualizacao-minimal-topo">

          <span className="pedidos-atualizacao-minimal-status">
            <span
              className="pedidos-atualizacao-minimal-ponto"
              aria-hidden="true"
            />

            Atualização automática
          </span>

        </div>


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


          <span
            className="pedidos-atualizacao-minimal-divisor"
            aria-hidden="true"
          >
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


export default memo(
  AtualizacaoAutomatica,
);