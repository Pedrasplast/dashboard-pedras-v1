export default function DashboardMateriaPrimaFiltros({
  dataInicial,
  dataFinal,
  tipoData,
  fornecedorSelecionado,
  materialSelecionado,
  fornecedores,
  materiais,
  onDataInicialChange,
  onDataFinalChange,
  onTipoDataChange,
  onFornecedorChange,
  onMaterialChange,
  onPeriodoRapido,
}) {
  const descricaoPeriodo =
    tipoData ===
      "recebimento"
      ? "O período considera a data de recebimento efetivo do material."
      : "O período considera a data em que a compra foi realizada.";

  return (
    <section className="dmp-filtros-card">

      <div
        style={{
          display:
            "flex",

          alignItems:
            "flex-end",

          justifyContent:
            "flex-start",

          gap:
            24,

          flexWrap:
            "wrap",

          marginBottom:
            14,
        }}
      >

        <label
          style={{
            width:
              270,

            maxWidth:
              "100%",

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              6,
          }}
        >

          <span
            style={{
              color:
                "#64748b",

              fontSize:
                11.5,

              fontWeight:
                750,
            }}
          >
            Filtrar período por
          </span>

          <select
            value={
              tipoData
            }
            onChange={
              (
                event,
              ) =>
                onTipoDataChange(
                  event.target.value,
                )
            }
            style={{
              width:
                "100%",

              minHeight:
                40,

              boxSizing:
                "border-box",

              padding:
                "0 11px",

              border:
                "1px solid #cbd5e1",

              borderRadius:
                9,

              outline:
                0,

              background:
                "#ffffff",

              color:
                "#334155",

              font:
                "inherit",

              fontSize:
                13,

              fontWeight:
                650,
            }}
          >

            <option value="compra">
              Data da compra
            </option>

            <option value="recebimento">
              Data de recebimento (entrega)
            </option>

          </select>

        </label>


        <div
          style={{
            display:
              "flex",

            flexDirection:
              "column",

            gap:
              6,

            minWidth:
              0,
          }}
        >

          <span
            style={{
              color:
                "#64748b",

              fontSize:
                11.5,

              fontWeight:
                750,
            }}
          >
            Período rápido
          </span>

          <div
            className="dmp-filtros-rapidos"
            style={{
              marginBottom:
                0,
            }}
          >

            {[7, 15, 30, 60].map(
              (
                dias,
              ) => (

                <button
                  type="button"
                  key={
                    dias
                  }
                  onClick={
                    () =>
                      onPeriodoRapido(
                        dias,
                      )
                  }
                >
                  Últimos {dias} dias
                </button>

              ),
            )}

          </div>

        </div>

      </div>


      <div
        style={{
          marginBottom:
            13,

          padding:
            "9px 11px",

          maxWidth:
            560,

          border:
            "1px solid #e2e8f0",

          borderRadius:
            8,

          background:
            "#f8fafc",

          color:
            "#64748b",

          fontSize:
            11.5,

          fontWeight:
            600,

          lineHeight:
            1.4,
        }}
      >
        {descricaoPeriodo}
      </div>


      <div
        className="dmp-filtros"
        style={{
          display:
            "flex",

          flexWrap:
            "wrap",

          alignItems:
            "flex-end",

          justifyContent:
            "flex-start",

          gap:
            10,
        }}
      >

        <label
          style={{
            flex:
              "0 1 160px",

            minWidth:
              150,

            maxWidth:
              175,
          }}
        >

          <span>
            De
          </span>

          <input
            type="date"
            value={
              dataInicial
            }
            onChange={
              (
                event,
              ) =>
                onDataInicialChange(
                  event.target.value,
                )
            }
          />

        </label>


        <label
          style={{
            flex:
              "0 1 160px",

            minWidth:
              150,

            maxWidth:
              175,
          }}
        >

          <span>
            Até
          </span>

          <input
            type="date"
            value={
              dataFinal
            }
            onChange={
              (
                event,
              ) =>
                onDataFinalChange(
                  event.target.value,
                )
            }
          />

        </label>


        <label
          style={{
            flex:
              "1 1 250px",

            minWidth:
              220,

            maxWidth:
              360,
          }}
        >

          <span>
            Material
          </span>

          <select
            value={
              materialSelecionado
            }
            onChange={
              (
                event,
              ) =>
                onMaterialChange(
                  event.target.value,
                )
            }
          >

            <option value="todos">
              Todos os materiais
            </option>

            {materiais.map(
              (
                item,
              ) => (

                <option
                  key={
                    item.materialId
                  }
                  value={
                    item.materialId
                  }
                >
                  {item.tipoMaterial}
                </option>

              ),
            )}

          </select>

        </label>


        <label
          style={{
            flex:
              "1 1 300px",

            minWidth:
              260,

            maxWidth:
              430,
          }}
        >

          <span>
            Fornecedor
          </span>

          <select
            value={
              fornecedorSelecionado
            }
            onChange={
              (
                event,
              ) =>
                onFornecedorChange(
                  event.target.value,
                )
            }
          >

            <option value="todos">
              Todos os fornecedores
            </option>

            {fornecedores.map(
              (
                item,
              ) => (

                <option
                  key={
                    item.fornecedorId
                  }
                  value={
                    item.fornecedorId
                  }
                >
                  {item.fornecedorNome}
                </option>

              ),
            )}

          </select>

        </label>

      </div>

    </section>
  );
}