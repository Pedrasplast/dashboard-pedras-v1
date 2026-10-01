import {
  AlertTriangle,
  CalendarDays,
  TrendingDown,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import useProjecao from "./useProjecao";

import "./ProjecaoDiaria.css";


/* =========================================================
   HELPERS
========================================================= */

function dataLocal(offsetDias = 0) {
  const data = new Date();

  data.setDate(
    data.getDate() + offsetDias,
  );

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const [ano, mes, dia] =
    String(valor).split("-");

  return ano && mes && dia
    ? `${dia}/${mes}/${ano}`
    : valor;
}


function formatarKg(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "-";
  }

  return `${Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} kg`;
}


function numero(valor) {
  const resultado = Number(valor);

  return Number.isFinite(resultado)
    ? resultado
    : 0;
}


/* =========================================================
   AGRUPAR FORNECEDORES
========================================================= */

function agruparPorFornecedor(linhas = []) {
  const mapa = new Map();

  for (const linha of linhas) {
    const id = String(
      linha?.fornecedorId ?? "",
    );

    if (!id) {
      continue;
    }

    if (!mapa.has(id)) {
      mapa.set(id, {
        fornecedorId: linha.fornecedorId,
        fornecedorNome:
          linha.fornecedorNome ||
          `Fornecedor ${linha.fornecedorId}`,
        linhas: [],
      });
    }

    mapa.get(id).linhas.push(linha);
  }


  return [...mapa.values()]
    .map((grupo) => {
      const linhasOrdenadas =
        [...grupo.linhas].sort((a, b) =>
          String(a.data ?? "")
            .localeCompare(
              String(b.data ?? ""),
            ),
        );

      const ultima =
        linhasOrdenadas.at(-1);


      return {
        ...grupo,

        linhas:
          linhasOrdenadas,

        possuiSaldoBase:
          linhasOrdenadas.some(
            (linha) =>
              linha.possuiSaldoBase === true,
          ),

        recebidoKg:
          linhasOrdenadas.reduce(
            (total, linha) =>
              total +
              numero(linha.recebidoKg),
            0,
          ),

        compraFuturaKg:
          linhasOrdenadas.reduce(
            (total, linha) =>
              total +
              numero(linha.compraFuturaKg),
            0,
          ),

        consumoKg:
          linhasOrdenadas.reduce(
            (total, linha) =>
              total +
              numero(linha.consumoKg),
            0,
          ),

        saldoFinalKg:
          ultima?.saldoFinalKg == null
            ? null
            : numero(
                ultima.saldoFinalKg,
              ),
      };
    })
    .sort((a, b) =>
      a.fornecedorNome.localeCompare(
        b.fornecedorNome,
        "pt-BR",
        {
          sensitivity: "base",
          numeric: true,
        },
      ),
    );
}


/* =========================================================
   CARD FORNECEDOR
========================================================= */

function FornecedorCard({
  grupo,
  ativo,
  onClick,
}) {
  const negativo =
    grupo.saldoFinalKg !== null &&
    grupo.saldoFinalKg < 0;


  return (
    <button
      type="button"
      className={[
        "projecao-diaria-fornecedor-aba",
        ativo ? "ativo" : "",
        negativo ? "negativo" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <span>
        {grupo.fornecedorNome}
      </span>

      <strong>
        {grupo.saldoFinalKg === null
          ? "Sem saldo-base"
          : formatarKg(
              grupo.saldoFinalKg,
            )}
      </strong>

      <small>
        Consumo{" "}
        {formatarKg(
          grupo.consumoKg,
        )}
      </small>
    </button>
  );
}


/* =========================================================
   DETALHE DO FORNECEDOR
========================================================= */

function FornecedorDetalhe({
  grupo,
}) {
  const negativo =
    grupo.saldoFinalKg !== null &&
    grupo.saldoFinalKg < 0;


  return (
    <section
      className={[
        "projecao-diaria-fornecedor-bloco",
        negativo ? "negativo" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="projecao-diaria-fornecedor-header">

        <div className="projecao-diaria-fornecedor-identificacao">
          <span>
            Fornecedor selecionado
          </span>

          <strong>
            {grupo.fornecedorNome}
          </strong>

          <small>
            {grupo.linhas.length} dia(s) projetado(s)
          </small>
        </div>


        <div className="projecao-diaria-fornecedor-resumo">

          <div>
            <span>Recebido</span>

            <strong className="entrada">
              {formatarKg(
                grupo.recebidoKg,
              )}
            </strong>
          </div>


          <div>
            <span>Compra futura</span>

            <strong className="futura">
              {formatarKg(
                grupo.compraFuturaKg,
              )}
            </strong>
          </div>


          <div>
            <span>Consumo</span>

            <strong className="consumo">
              {formatarKg(
                grupo.consumoKg,
              )}
            </strong>
          </div>


          <div className="saldo-final">
            <span>Saldo final</span>

            <strong
              className={
                negativo
                  ? "negativo"
                  : ""
              }
            >
              {grupo.saldoFinalKg === null
                ? "-"
                : formatarKg(
                    grupo.saldoFinalKg,
                  )}
            </strong>
          </div>

        </div>

      </div>


      {!grupo.possuiSaldoBase && (
        <div className="projecao-diaria-fornecedor-sem-base">
          <AlertTriangle size={14} />

          Este fornecedor ainda não possui
          saldo-base para o material selecionado.
        </div>
      )}


      <div className="projecao-diaria-tabela-container">

        <table className="projecao-diaria-tabela">

          <thead>
            <tr>
              <th>Data</th>
              <th>Saldo início</th>
              <th>Recebido</th>
              <th>Compra futura</th>
              <th>Consumo</th>
              <th>Saldo final</th>
            </tr>
          </thead>


          <tbody>

            {grupo.linhas.map((linha) => (
              <tr
                key={`${linha.data}-${linha.fornecedorId}`}
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


                <td>
                  {linha.possuiSaldoBase
                    ? formatarKg(
                        linha.saldoInicioKg,
                      )
                    : "Sem saldo-base"}
                </td>


                <td className="projecao-diaria-entrada">
                  {linha.recebidoKg > 0
                    ? `+ ${formatarKg(
                        linha.recebidoKg,
                      )}`
                    : "-"}
                </td>


                <td className="projecao-diaria-futura">
                  {linha.compraFuturaKg > 0
                    ? `+ ${formatarKg(
                        linha.compraFuturaKg,
                      )}`
                    : "-"}
                </td>


                <td className="projecao-diaria-consumo">
                  {linha.consumoKg > 0
                    ? `- ${formatarKg(
                        linha.consumoKg,
                      )}`
                    : "-"}
                </td>


                <td
                  className={[
                    "projecao-diaria-saldo",

                    linha.saldoFinalKg !== null &&
                    linha.saldoFinalKg < 0
                      ? "negativo"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {linha.saldoFinalKg === null
                    ? "-"
                    : formatarKg(
                        linha.saldoFinalKg,
                      )}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </section>
  );
}


/* =========================================================
   PROJEÇÃO DIÁRIA
========================================================= */

export default function ProjecaoDiaria() {
  const [dataInicio, setDataInicio] =
    useState(() => dataLocal());

  const [dataFim, setDataFim] =
    useState(() => dataLocal(10));

  const [materialId, setMaterialId] =
    useState("1");

  const [
    fornecedorSelecionadoId,
    setFornecedorSelecionadoId,
  ] = useState("");


  const {
    linhas,
    materiais,
    fornecedoresSemSaldo,
    consumoProgramadoDisponivel,
    programacoesSemReceita,
    carregando,
    carregado,
    erro,
  } = useProjecao({
    dataInicio,
    dataFim,
    materialId,
  });


  /* =======================================================
     FORNECEDORES
  ======================================================= */

  const grupos =
    useMemo(
      () =>
        agruparPorFornecedor(
          linhas,
        ),
      [
        linhas,
      ],
    );


  useEffect(() => {
    if (!grupos.length) {
      setFornecedorSelecionadoId("");
      return;
    }

    const existe =
      grupos.some(
        (grupo) =>
          String(grupo.fornecedorId) ===
          String(fornecedorSelecionadoId),
      );

    if (!existe) {
      setFornecedorSelecionadoId(
        String(
          grupos[0].fornecedorId,
        ),
      );
    }
  }, [
    grupos,
    fornecedorSelecionadoId,
  ]);


  const fornecedorSelecionado =
    useMemo(
      () =>
        grupos.find(
          (grupo) =>
            String(grupo.fornecedorId) ===
            String(
              fornecedorSelecionadoId,
            ),
        ) ??
        grupos[0] ??
        null,
      [
        grupos,
        fornecedorSelecionadoId,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(
      () => ({
        saldoFinalKg:
          grupos.reduce(
            (total, grupo) =>
              total +
              numero(
                grupo.saldoFinalKg,
              ),
            0,
          ),

        recebidoKg:
          grupos.reduce(
            (total, grupo) =>
              total +
              grupo.recebidoKg,
            0,
          ),

        compraFuturaKg:
          grupos.reduce(
            (total, grupo) =>
              total +
              grupo.compraFuturaKg,
            0,
          ),

        consumoKg:
          grupos.reduce(
            (total, grupo) =>
              total +
              grupo.consumoKg,
            0,
          ),

        negativos:
          grupos.filter(
            (grupo) =>
              grupo.saldoFinalKg !== null &&
              grupo.saldoFinalKg < 0,
          ).length,
      }),
      [
        grupos,
      ],
    );


  return (
    <div className="projecao-diaria">

      {/* FILTROS */}

      <div className="projecao-diaria-filtros">

        <div className="projecao-diaria-periodo">

          <CalendarDays
            size={17}
            aria-hidden="true"
          />


          <label>
            <span>Início</span>

            <input
              type="date"
              value={dataInicio}
              onChange={(event) => {
                const valor =
                  event.target.value;

                setDataInicio(
                  valor,
                );

                if (
                  valor &&
                  dataFim < valor
                ) {
                  const data =
                    new Date(
                      `${valor}T12:00:00`,
                    );

                  data.setDate(
                    data.getDate() + 10,
                  );

                  const ano =
                    data.getFullYear();

                  const mes =
                    String(
                      data.getMonth() + 1,
                    ).padStart(
                      2,
                      "0",
                    );

                  const dia =
                    String(
                      data.getDate(),
                    ).padStart(
                      2,
                      "0",
                    );

                  setDataFim(
                    `${ano}-${mes}-${dia}`,
                  );
                }
              }}
            />
          </label>


          <label>
            <span>Fim</span>

            <input
              type="date"
              min={dataInicio}
              value={dataFim}
              onChange={(event) =>
                setDataFim(
                  event.target.value,
                )
              }
            />
          </label>

        </div>


        <label className="projecao-diaria-material">

          <span>
            Material
          </span>

          <select
            value={materialId}
            onChange={(event) =>
              setMaterialId(
                event.target.value,
              )
            }
          >
            {materiais
              .filter(
                (material) =>
                  material.ativo !== false,
              )
              .map(
                (material) => (
                  <option
                    key={material.id}
                    value={material.id}
                  >
                    {material.nome}
                  </option>
                ),
              )}
          </select>


          <small>
            {carregando
              ? "Atualizando projeção automaticamente..."
              : "A atualização é automática ao alterar período ou material."}
          </small>

        </label>

      </div>


      {/* INDICADORES */}

      <div className="projecao-diaria-indicadores">

        <div>
          <span>Saldo final total</span>

          <strong
            className={
              indicadores.saldoFinalKg < 0
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


      {/* ALERTAS */}

      {indicadores.negativos > 0 && (
        <div className="projecao-diaria-alerta negativo">
          <TrendingDown size={18} />

          <div>
            <strong>
              Estoque negativo previsto
            </strong>

            <p>
              {indicadores.negativos} fornecedor(es)
              terminarão o período selecionado com
              saldo projetado negativo.
            </p>
          </div>
        </div>
      )}


      {fornecedoresSemSaldo.length > 0 && (
        <div className="projecao-diaria-alerta">
          <AlertTriangle size={18} />

          <div>
            <strong>
              Fornecedor sem saldo-base
            </strong>

            <p>
              {fornecedoresSemSaldo
                .map(
                  (fornecedor) =>
                    fornecedor.nome,
                )
                .join(", ")}
            </p>
          </div>
        </div>
      )}


      {!consumoProgramadoDisponivel && (
        <div className="projecao-diaria-alerta">
          <AlertTriangle size={18} />

          <div>
            <strong>
              Consumo programado disponível para PP
            </strong>

            <p>
              O consumo permanece zerado enquanto
              não houver receita configurada para
              o material selecionado.
            </p>
          </div>
        </div>
      )}


      {programacoesSemReceita.length > 0 && (
        <div className="projecao-diaria-alerta">
          <AlertTriangle size={18} />

          <div>
            <strong>
              Programação sem receita de PP
            </strong>

            <p>
              Existem dias programados sem receita.
              Revise Cadastro → Receita e Programação.
            </p>
          </div>
        </div>
      )}


      {/* CARREGAMENTO */}

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


      {/* ERRO */}

      {!carregando && erro && (
        <div className="projecao-diaria-estado projecao-diaria-erro">
          <AlertTriangle size={30} />

          <strong>
            Não foi possível calcular a projeção
          </strong>

          <p>
            {erro}
          </p>
        </div>
      )}


      {/* FORNECEDORES */}

      {!carregando &&
        !erro &&
        carregado &&
        grupos.length > 0 &&
        fornecedorSelecionado && (

          <div className="projecao-diaria-fornecedores">

            <section className="projecao-diaria-fornecedor-navegador">

              <div className="projecao-diaria-fornecedor-navegador-topo">

                <div>
                  <span>
                    Fornecedores
                  </span>

                  <strong>
                    Escolha um fornecedor para analisar
                  </strong>

                  <small>
                    A tabela mostra apenas o fornecedor selecionado.
                  </small>
                </div>


                <label className="projecao-diaria-fornecedor-select">

                  <span>
                    Ir para fornecedor
                  </span>

                  <select
                    value={
                      String(
                        fornecedorSelecionado
                          .fornecedorId,
                      )
                    }
                    onChange={(event) =>
                      setFornecedorSelecionadoId(
                        event.target.value,
                      )
                    }
                  >
                    {grupos.map(
                      (grupo) => (
                        <option
                          key={
                            grupo.fornecedorId
                          }
                          value={
                            grupo.fornecedorId
                          }
                        >
                          {
                            grupo.fornecedorNome
                          }
                        </option>
                      ),
                    )}
                  </select>

                </label>

              </div>


              <div className="projecao-diaria-fornecedor-abas">

                {grupos.map(
                  (grupo) => (
                    <FornecedorCard
                      key={
                        grupo.fornecedorId
                      }
                      grupo={
                        grupo
                      }
                      ativo={
                        String(
                          grupo.fornecedorId,
                        ) ===
                        String(
                          fornecedorSelecionado
                            .fornecedorId,
                        )
                      }
                      onClick={() =>
                        setFornecedorSelecionadoId(
                          String(
                            grupo.fornecedorId,
                          ),
                        )
                      }
                    />
                  ),
                )}

              </div>

            </section>


            <FornecedorDetalhe
              grupo={
                fornecedorSelecionado
              }
            />

          </div>
        )}


      {/* SEM DADOS */}

      {!carregando &&
        !erro &&
        carregado &&
        grupos.length === 0 && (

          <div className="projecao-diaria-estado">

            <CalendarDays size={32} />

            <strong>
              Nenhum dado para projetar
            </strong>

            <p>
              Verifique saldo-base, programação,
              receitas e compras.
            </p>

          </div>
        )}

    </div>
  );
}