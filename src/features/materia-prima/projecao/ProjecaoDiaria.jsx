import {
  AlertTriangle,
  CalendarDays,
  RefreshCw,
  TrendingDown,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import useProjecao from "./useProjecao";

import "./ProjecaoDiaria.css";


/* =========================================================
   DATAS
========================================================= */

function dataHojeLocal() {
  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const dia =
    String(
      agora.getDate(),
    ).padStart(
      2,
      "0",
    );


  return `${ano}-${mes}-${dia}`;
}


function somarDias(
  data,
  quantidade,
) {
  const [
    ano,
    mes,
    dia,
  ] =
    data
      .split("-")
      .map(Number);


  const resultado =
    new Date(
      ano,
      mes - 1,
      dia,
    );


  resultado.setDate(
    resultado.getDate() +
      quantidade,
  );


  const anoFinal =
    resultado.getFullYear();

  const mesFinal =
    String(
      resultado.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const diaFinal =
    String(
      resultado.getDate(),
    ).padStart(
      2,
      "0",
    );


  return `${anoFinal}-${mesFinal}-${diaFinal}`;
}


/* =========================================================
   FORMATADORES
========================================================= */

function formatarData(
  valor,
) {
  if (!valor) {
    return "-";
  }


  const [
    ano,
    mes,
    dia,
  ] =
    valor.split("-");


  return `${dia}/${mes}/${ano}`;
}


function formatarKg(
  valor,
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "-";
  }


  return `${Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    },
  )} kg`;
}


/* =========================================================
   PROJEÇÃO DIÁRIA
========================================================= */

export default function ProjecaoDiaria() {
  const hoje =
    dataHojeLocal();


  const [
    dataInicio,
    setDataInicio,
  ] = useState(
    hoje,
  );

  const [
    dataFim,
    setDataFim,
  ] = useState(
    somarDias(
      hoje,
      30,
    ),
  );

  const [
    fornecedorFiltro,
    setFornecedorFiltro,
  ] = useState("");


  const {
    linhas,
    fornecedores,
    fornecedoresSemSaldo,
    programacoesSemReceita,
    carregando,
    carregado,
    erro,
    recarregar,
  } =
    useProjecao({
      dataInicio,
      dataFim,
    });


  /* =======================================================
     FILTRO
  ======================================================= */

  const linhasFiltradas =
    useMemo(
      () =>
        linhas.filter(
          (
            linha,
          ) =>
            !fornecedorFiltro ||
            String(
              linha.fornecedorId,
            ) ===
              String(
                fornecedorFiltro,
              ),
        ),
      [
        linhas,
        fornecedorFiltro,
      ],
    );


  /* =======================================================
     ÚLTIMA LINHA DE CADA FORNECEDOR
  ======================================================= */

  const ultimasLinhas =
    useMemo(
      () => {
        const mapa =
          new Map();


        linhasFiltradas.forEach(
          (
            linha,
          ) => {
            mapa.set(
              String(
                linha.fornecedorId,
              ),
              linha,
            );
          },
        );


        return Array.from(
          mapa.values(),
        );
      },
      [
        linhasFiltradas,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(
      () => ({
        saldoFinalKg:
          ultimasLinhas.reduce(
            (
              total,
              linha,
            ) =>
              total +
              (
                linha.saldoFinalKg ===
                  null
                  ? 0
                  : Number(
                      linha.saldoFinalKg,
                    )
              ),
            0,
          ),

        recebidoKg:
          linhasFiltradas.reduce(
            (
              total,
              linha,
            ) =>
              total +
              Number(
                linha.recebidoKg ??
                  0,
              ),
            0,
          ),

        compraFuturaKg:
          linhasFiltradas.reduce(
            (
              total,
              linha,
            ) =>
              total +
              Number(
                linha.compraFuturaKg ??
                  0,
              ),
            0,
          ),

        consumoKg:
          linhasFiltradas.reduce(
            (
              total,
              linha,
            ) =>
              total +
              Number(
                linha.consumoKg ??
                  0,
              ),
            0,
          ),

        negativos:
          ultimasLinhas.filter(
            (
              linha,
            ) =>
              linha.saldoFinalKg !==
                null &&
              Number(
                linha.saldoFinalKg,
              ) <
                0,
          ).length,
      }),
      [
        linhasFiltradas,
        ultimasLinhas,
      ],
    );


  return (
    <div className="projecao-diaria">

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="projecao-diaria-filtros">

        <div className="projecao-diaria-periodo">

          <CalendarDays
            size={17}
            aria-hidden="true"
          />


          <label>

            <span>
              Início
            </span>

            <input
              type="date"
              value={
                dataInicio
              }
              onChange={
                (
                  event,
                ) => {
                  const valor =
                    event.target.value;


                  setDataInicio(
                    valor,
                  );


                  if (
                    dataFim <
                    valor
                  ) {
                    setDataFim(
                      valor,
                    );
                  }
                }
              }
            />

          </label>


          <label>

            <span>
              Fim
            </span>

            <input
              type="date"
              min={
                dataInicio
              }
              value={
                dataFim
              }
              onChange={
                (
                  event,
                ) =>
                  setDataFim(
                    event.target.value,
                  )
              }
            />

          </label>

        </div>


        <select
          value={
            fornecedorFiltro
          }
          onChange={
            (
              event,
            ) =>
              setFornecedorFiltro(
                event.target.value,
              )
          }
        >

          <option value="">
            Todos os fornecedores
          </option>


          {fornecedores.map(
            (
              fornecedor,
            ) => (

              <option
                key={
                  fornecedor.id
                }
                value={
                  fornecedor.id
                }
              >
                {fornecedor.nome}
              </option>

            ),
          )}

        </select>


        <button
          type="button"
          className="projecao-diaria-atualizar"
          onClick={
            recarregar
          }
          disabled={
            carregando
          }
        >

          <RefreshCw
            size={16}
            className={
              carregando
                ? "girando"
                : ""
            }
          />

          Atualizar

        </button>

      </div>


      {/* =================================================
          INDICADORES
      ================================================= */}

      <div className="projecao-diaria-indicadores">

        <div>

          <span>
            Saldo no final do período
          </span>

          <strong
            className={
              indicadores.saldoFinalKg <
                0
                ? "negativo"
                : ""
            }
          >
            {formatarKg(
              indicadores.saldoFinalKg,
            )}
          </strong>

        </div>


        <div>

          <span>
            Recebido no período
          </span>

          <strong>
            {formatarKg(
              indicadores.recebidoKg,
            )}
          </strong>

        </div>


        <div>

          <span>
            Compras futuras
          </span>

          <strong>
            {formatarKg(
              indicadores.compraFuturaKg,
            )}
          </strong>

        </div>


        <div>

          <span>
            Consumo programado
          </span>

          <strong>
            {formatarKg(
              indicadores.consumoKg,
            )}
          </strong>

        </div>

      </div>


      {/* =================================================
          ALERTAS
      ================================================= */}

      {indicadores.negativos >
        0 && (

        <div className="projecao-diaria-alerta negativo">

          <TrendingDown
            size={18}
          />

          <div>

            <strong>
              Estoque negativo previsto
            </strong>

            <p>
              {
                indicadores.negativos
              } fornecedor(es) terminarão
              o período selecionado com
              saldo projetado negativo.
            </p>

          </div>

        </div>

      )}


      {fornecedoresSemSaldo.length >
        0 && (

        <div className="projecao-diaria-alerta">

          <AlertTriangle
            size={18}
          />

          <div>

            <strong>
              Fornecedor sem saldo-base
            </strong>

            <p>
              {fornecedoresSemSaldo
                .map(
                  (
                    fornecedor,
                  ) =>
                    fornecedor.nome,
                )
                .join(", ")}
            </p>

          </div>

        </div>

      )}


      {programacoesSemReceita.length >
        0 && (

        <div className="projecao-diaria-alerta">

          <AlertTriangle
            size={18}
          />

          <div>

            <strong>
              Programação sem receita de PP
            </strong>

            <p>
              Existem produtos programados
              cujo consumo não pôde ser
              distribuído entre os
              fornecedores. Revise a aba
              Receitas.
            </p>

          </div>

        </div>

      )}


      {/* =================================================
          CARREGANDO
      ================================================= */}

      {carregando && (

        <div className="projecao-diaria-estado">

          <span className="projecao-diaria-loading" />

          <strong>
            Calculando projeção
          </strong>

          <p>
            Cruzando estoque, compras,
            programação e receitas.
          </p>

        </div>

      )}


      {/* =================================================
          ERRO
      ================================================= */}

      {!carregando &&
        erro && (

        <div className="projecao-diaria-estado projecao-diaria-erro">

          <AlertTriangle
            size={30}
          />

          <strong>
            Não foi possível calcular
            a projeção
          </strong>

          <p>
            {erro}
          </p>

        </div>

      )}


      {/* =================================================
          TABELA
      ================================================= */}

      {!carregando &&
        !erro &&
        carregado &&
        linhasFiltradas.length >
          0 && (

        <div className="projecao-diaria-tabela-container">

          <table className="projecao-diaria-tabela">

            <thead>

              <tr>
                <th>Data</th>
                <th>Fornecedor</th>
                <th>Saldo início</th>
                <th>Recebido</th>
                <th>Compra futura</th>
                <th>Consumo</th>
                <th>Saldo final</th>
              </tr>

            </thead>


            <tbody>

              {linhasFiltradas.map(
                (
                  linha,
                ) => (

                <tr
                  key={
                    `${linha.data}-${linha.fornecedorId}`
                  }
                >

                  <td className="projecao-diaria-data">

                    <strong>
                      {formatarData(
                        linha.data,
                      )}
                    </strong>


                    {linha.saldoBaseAplicado && (

                      <small>
                        Nova base
                      </small>

                    )}

                  </td>


                  <td className="projecao-diaria-fornecedor">
                    {linha.fornecedorNome}
                  </td>


                  <td>
                    {linha.possuiSaldoBase
                      ? formatarKg(
                          linha.saldoInicioKg,
                        )
                      : "Sem saldo-base"}
                  </td>


                  <td className="projecao-diaria-entrada">
                    {linha.recebidoKg >
                      0
                      ? `+ ${formatarKg(
                          linha.recebidoKg,
                        )}`
                      : "-"}
                  </td>


                  <td className="projecao-diaria-futura">
                    {linha.compraFuturaKg >
                      0
                      ? `+ ${formatarKg(
                          linha.compraFuturaKg,
                        )}`
                      : "-"}
                  </td>


                  <td className="projecao-diaria-consumo">
                    {linha.consumoKg >
                      0
                      ? `- ${formatarKg(
                          linha.consumoKg,
                        )}`
                      : "-"}
                  </td>


                  <td
                    className={
                      linha.saldoFinalKg !==
                        null &&
                      linha.saldoFinalKg <
                        0
                        ? "projecao-diaria-saldo negativo"
                        : "projecao-diaria-saldo"
                    }
                  >
                    {linha.saldoFinalKg ===
                      null
                      ? "-"
                      : formatarKg(
                          linha.saldoFinalKg,
                        )}
                  </td>

                </tr>

                ),
              )}

            </tbody>

          </table>

        </div>

      )}


      {!carregando &&
        !erro &&
        carregado &&
        linhasFiltradas.length ===
          0 && (

        <div className="projecao-diaria-estado">

          <CalendarDays
            size={32}
          />

          <strong>
            Nenhum dado para projetar
          </strong>

          <p>
            Verifique o período,
            saldo-base, programação,
            receitas e compras.
          </p>

        </div>

      )}

    </div>
  );
}