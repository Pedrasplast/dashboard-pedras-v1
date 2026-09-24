import {
  AlertTriangle,
  PackageCheck,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import useEntradas from "./useEntradas";

import "./Entradas.css";


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
    valor.split(
      "-",
    );


  return `${dia}/${mes}/${ano}`;
}


function formatarKg(
  valor,
) {
  return `${Number(
    valor ?? 0,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    },
  )} kg`;
}


function formatarMoeda(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(
        valor,
      ),
    )
  ) {
    return "-";
  }


  return Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}


function formatarPrecoKg(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(
        valor,
      ),
    )
  ) {
    return "-";
  }


  return `${Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    },
  )}/kg`;
}


function formatarPercentual(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(
        valor,
      ),
    )
  ) {
    return "-";
  }


  return `${Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    },
  )}%`;
}


function normalizarTexto(
  valor,
) {
  return String(
    valor ?? "",
  )
    .toLowerCase()
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


/* =========================================================
   ENTRADAS
========================================================= */

export default function Entradas() {
  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    dataInicio,
    setDataInicio,
  ] = useState("");

  const [
    dataFim,
    setDataFim,
  ] = useState("");


  const {
    entradas,
    carregando,
    carregado,
    erro,
    recarregar,
  } =
    useEntradas();


  /* =======================================================
     FILTROS
  ======================================================= */

  const filtradas =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            busca,
          );


        return entradas.filter(
          (
            entrada,
          ) =>
            (
              !termo ||
              normalizarTexto(
                entrada
                  .fornecedorNome,
              ).includes(
                termo,
              ) ||
              normalizarTexto(
                entrada
                  .numeroPedido,
              ).includes(
                termo,
              )
            ) &&
            (
              !dataInicio ||
              entrada.data >=
                dataInicio
            ) &&
            (
              !dataFim ||
              entrada.data <=
                dataFim
            ),
        );
      },
      [
        entradas,
        busca,
        dataInicio,
        dataFim,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(
      () => {
        const entradasAtivas =
          filtradas.filter(
            (
              entrada,
            ) =>
              entrada.ativo,
          );


        return {
          recebimentos:
            filtradas.length,

          totalKg:
            entradasAtivas.reduce(
              (
                total,
                entrada,
              ) =>
                total +
                Number(
                  entrada.quantidadeKg ??
                  0,
                ),
              0,
            ),

        };
      },
      [
        filtradas,
      ],
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="entradas-pp">

      <div className="entradas-pp-toolbar">

        <div className="entradas-pp-indicadores">

          <div>
            <span>
              Recebimentos
            </span>

            <strong>
              {indicadores.recebimentos}
            </strong>
          </div>


          <div>
            <span>
              PP recebido
            </span>

            <strong>
              {formatarKg(
                indicadores.totalKg,
              )}
            </strong>
          </div>

        </div>

      </div>


      <div className="entradas-pp-filtros">

        <label className="entradas-pp-busca">

          <Search size={16} />

          <input
            value={
              busca
            }
            onChange={
              (
                event,
              ) =>
                setBusca(
                  event
                    .target
                    .value,
                )
            }
            placeholder="Buscar fornecedor ou pedido..."
          />

        </label>


        <input
          type="date"
          value={
            dataInicio
          }
          onChange={
            (
              event,
            ) =>
              setDataInicio(
                event
                  .target
                  .value,
              )
          }
        />


        <input
          type="date"
          value={
            dataFim
          }
          onChange={
            (
              event,
            ) =>
              setDataFim(
                event
                  .target
                  .value,
              )
          }
        />


        <button
          type="button"
          className="entradas-pp-atualizar"
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


      {carregando && (

        <div className="entradas-pp-estado">

          <span className="entradas-pp-loading" />

          <strong>
            Carregando recebimentos
          </strong>

        </div>

      )}


      {!carregando &&
        erro && (

        <div className="entradas-pp-estado entradas-pp-erro">

          <AlertTriangle size={30} />

          <strong>
            Erro ao carregar entradas
          </strong>

          <p>
            {erro}
          </p>

        </div>

      )}


      {!carregando &&
        !erro &&
        carregado &&
        entradas.length ===
          0 && (

        <div className="entradas-pp-estado">

          <PackageCheck size={34} />

          <strong>
            Nenhum material recebido
          </strong>

          <p>
            Quando uma compra for alterada
            para Recebida, ela aparecerá
            automaticamente aqui.
          </p>

        </div>

      )}


      {!carregando &&
        !erro &&
        entradas.length >
          0 && (

        <div className="entradas-pp-tabela-container">

          <table className="entradas-pp-tabela">

            <thead>
              <tr>
                <th>Recebimento</th>
                <th>Compra</th>
                <th>Previsão</th>
                <th>Fornecedor</th>
                <th>Quantidade</th>
                <th>Preço/kg</th>
                <th>IPI</th>
                <th>Total</th>
                <th>Custo/kg</th>
                <th>Pedido</th>
                <th>Observação</th>
              </tr>
            </thead>


            <tbody>

              {filtradas.map(
                (
                  entrada,
                ) => (

                <tr key={entrada.id}>

                  <td className="entradas-pp-data">
                    {formatarData(
                      entrada.data,
                    )}
                  </td>


                  <td>
                    {formatarData(
                      entrada.dataCompra,
                    )}
                  </td>


                  <td>
                    {formatarData(
                      entrada.dataPrevista,
                    )}
                  </td>


                  <td className="entradas-pp-fornecedor">
                    <strong>
                      {entrada.fornecedorNome}
                    </strong>
                  </td>


                  <td className="entradas-pp-quantidade">
                    {formatarKg(
                      entrada.quantidadeKg,
                    )}
                  </td>


                  <td className="entradas-pp-financeiro">
                    {formatarPrecoKg(
                      entrada.precoUnitario,
                    )}
                  </td>


                  <td className="entradas-pp-financeiro">
                    <span>
                      {formatarPercentual(
                        entrada.ipiPercentual,
                      )}
                    </span>

                    {entrada.valorIpi !==
                      null && (

                      <small>
                        {formatarMoeda(
                          entrada.valorIpi,
                        )}
                      </small>

                    )}
                  </td>


                  <td className="entradas-pp-total">
                    {formatarMoeda(
                      entrada.valorTotal,
                    )}
                  </td>


                  <td className="entradas-pp-financeiro">
                    {formatarPrecoKg(
                      entrada.custoEfetivoKg,
                    )}
                  </td>


                  <td>
                    {entrada.numeroPedido ||
                      "-"}
                  </td>


                  <td className="entradas-pp-observacao">
                    {entrada.observacao ||
                      "-"}
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
        entradas.length >
          0 &&
        filtradas.length ===
          0 && (

        <div className="entradas-pp-estado">

          <Search size={27} />

          <strong>
            Nenhum recebimento encontrado
          </strong>

          <p>
            Altere os filtros para visualizar
            outros recebimentos.
          </p>

        </div>

      )}

    </div>
  );
}
