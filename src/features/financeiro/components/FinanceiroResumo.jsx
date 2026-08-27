import { memo } from "react";

import {
  formatarMoeda,
  formatarPercentual,
} from "../utils/financeiro.utils";


/* =========================================================
   CARD INDIVIDUAL
========================================================= */

function CardFinanceiro({
  titulo,
  dados,
  tipo,
}) {
  const previsto =
    Number(
      dados?.previsto ??
        0,
    );

  const realizado =
    Number(
      dados?.realizado ??
        0,
    );

  const variacao =
    Number(
      dados?.variacao ??
        0,
    );

  const percentual =
    dados?.percentual ??
    null;


  /* =======================================================
     SITUAÇÃO DA VARIAÇÃO
  ======================================================= */

  let classeVariacao =
    "neutra";


  if (
    variacao > 0
  ) {
    classeVariacao =
      "positiva";
  }


  if (
    variacao < 0
  ) {
    classeVariacao =
      "negativa";
  }


  return (
    <section
      className={[
        "financeiro-card",
        `financeiro-card-${tipo}`,
      ].join(" ")}
    >
      {/* ===================================================
          TÍTULO
      =================================================== */}

      <div className="financeiro-card-cabecalho">

        <h3 className="financeiro-card-titulo">
          {titulo}
        </h3>

      </div>


      {/* ===================================================
          PREVISTO / REALIZADO
      =================================================== */}

      <div className="financeiro-card-valores">

        <div className="financeiro-card-valor">

          <span className="financeiro-card-label">
            Previsto
          </span>

          <strong className="financeiro-card-numero">
            {formatarMoeda(
              previsto,
            )}
          </strong>

        </div>


        <div className="financeiro-card-valor">

          <span className="financeiro-card-label">
            Realizado / a realizar
          </span>

          <strong className="financeiro-card-numero">
            {formatarMoeda(
              realizado,
            )}
          </strong>

        </div>

      </div>


      {/* ===================================================
          VARIAÇÃO
      =================================================== */}

      <div
        className={[
          "financeiro-card-variacao",
          `financeiro-card-variacao-${classeVariacao}`,
        ].join(" ")}
      >

        <span>
          Variação
        </span>

        <strong>
          {formatarMoeda(
            variacao,
          )}
        </strong>

        <span className="financeiro-card-percentual">
          {formatarPercentual(
            percentual,
          )}
        </span>

      </div>

    </section>
  );
}


/* =========================================================
   RESUMO FINANCEIRO
========================================================= */

function FinanceiroResumo({
  resumo,
}) {
  return (
    <div className="financeiro-resumo">

      <CardFinanceiro
        titulo="Receitas"
        tipo="receitas"
        dados={
          resumo?.receitas
        }
      />


      <CardFinanceiro
        titulo="Despesas"
        tipo="despesas"
        dados={
          resumo?.despesas
        }
      />


      <CardFinanceiro
        titulo="Saldo"
        tipo="saldo"
        dados={
          resumo?.saldo
        }
      />

    </div>
  );
}


/* =========================================================
   MEMO
========================================================= */

export default memo(
  FinanceiroResumo,
);