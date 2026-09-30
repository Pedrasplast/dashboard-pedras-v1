import {
  BadgeDollarSign,
  Building2,
} from "lucide-react";

import {
  formatarKg,
  formatarMoeda,
  formatarMoedaKg,
} from "../dashboardMateriaPrimaUtils.js";

import {
  formatarDias,
  formatarPercentual,
} from "./materiaPrimaFormatters.js";


/* =========================================================
   TABELA MATERIAL
========================================================= */

function TabelaMaterial({
  dados,
}) {
  return (
    <section className="dmp-card dmp-tabela-card">

      <div className="dmp-card-header">

        <div>
          <span>
            Materiais
          </span>

          <h2>
            Análise por Material
          </h2>

          <p>
            Preço e custo por kg, subtotal do material,
            custos adicionais, dispersão de preço e total efetivo.
          </p>
        </div>

        <BadgeDollarSign
          size={21}
        />

      </div>


      <div className="dmp-tabela-wrapper">

        <table className="dmp-tabela dmp-tabela-material">

          <thead>
            <tr>
              <th>
                Material
              </th>

              <th className="numero">
                Fornec.
              </th>

              <th className="numero">
                Compras
              </th>

              <th className="numero">
                Quantidade
              </th>

              <th className="numero">
                Preço médio/kg
              </th>

              <th className="numero">
                Custo médio/kg
              </th>

              <th className="numero">
                Acréscimo/kg
              </th>

              <th className="numero">
                Impacto
              </th>

              <th className="numero">
                Menor preço
              </th>

              <th className="numero">
                Maior preço
              </th>

              <th className="numero">
                Variação mín.–máx.
              </th>

              <th className="numero">
                Último preço
              </th>

              <th className="numero">
                Var. última
              </th>

              <th className="numero">
                Participação
              </th>

              <th className="numero">
                Subtotal
              </th>

              <th className="numero">
                Total
              </th>
            </tr>
          </thead>


          <tbody>

            {dados.map(
              (
                item,
              ) => (

                <tr
                  key={
                    item.materialId
                  }
                >

                  <td>
                    <strong>
                      {item.material}
                    </strong>
                  </td>


                  <td className="numero">
                    {item.fornecedores}
                  </td>


                  <td className="numero">
                    {item.compras}
                  </td>


                  <td className="numero">
                    {formatarKg(
                      item.quantidadeKg,
                      0,
                    )}
                  </td>


                  <td className="numero">
                    {formatarMoedaKg(
                      item.precoMedioKg,
                      3,
                    )}
                  </td>


                  <td className="numero dmp-custo">
                    {formatarMoedaKg(
                      item.custoMedioKg,
                      3,
                    )}
                  </td>


                  <td className="numero">
                    {formatarMoedaKg(
                      item.custoAdicionalKg,
                      3,
                    )}
                  </td>


                  <td className="numero">
                    {formatarPercentual(
                      item.impactoCustoPercentual,
                      1,
                    )}
                  </td>


                  <td className="numero">
                    {formatarMoedaKg(
                      item.precoMinimoKg,
                      2,
                    )}
                  </td>


                  <td className="numero">
                    {formatarMoedaKg(
                      item.precoMaximoKg,
                      2,
                    )}
                  </td>


                  <td className="numero">
                    {formatarPercentual(
                      item.amplitudePrecoPercentual,
                      1,
                    )}
                  </td>


                  <td className="numero">
                    {formatarMoedaKg(
                      item.ultimoPrecoKg,
                      2,
                    )}
                  </td>


                  <td
                    className={
                      [
                        "numero",

                        item.variacaoUltimaCompraPercentual >
                          0
                          ? "dmp-variacao-alta"
                          : item.variacaoUltimaCompraPercentual <
                              0
                            ? "dmp-variacao-baixa"
                            : "",
                      ].join(
                        " ",
                      )
                    }
                  >
                    {formatarPercentual(
                      item.variacaoUltimaCompraPercentual,
                      1,
                    )}
                  </td>


                  <td className="numero">
                    {formatarPercentual(
                      item.participacaoValorPercentual,
                      1,
                    )}
                  </td>


                  <td className="numero dmp-subtotal">
                    {formatarMoeda(
                      item.subtotal,
                      2,
                    )}
                  </td>


                  <td className="numero dmp-total">
                    {formatarMoeda(
                      item.total,
                      2,
                    )}
                  </td>

                </tr>

              ),
            )}

          </tbody>

        </table>

      </div>

    </section>
  );
}


/* =========================================================
   TABELA FORNECEDOR
========================================================= */

function TabelaFornecedor({
  dados,
}) {
  return (
    <section className="dmp-card dmp-tabela-card">

      <div className="dmp-card-header">

        <div>
          <span>
            Fornecedores
          </span>

          <h2>
            Comparativo por material e fornecedor
          </h2>

          <p>
            Preço, custo, subtotal, total efetivo,
            participação e desempenho de entrega por fornecedor.
          </p>
        </div>

        <Building2
          size={21}
        />

      </div>


      <div className="dmp-tabela-wrapper">

        <table className="dmp-tabela dmp-tabela-fornecedor">

          <thead>
            <tr>
              <th>
                Material
              </th>

              <th>
                Fornecedor
              </th>

              <th className="numero">
                Compras
              </th>

              <th className="numero">
                Quantidade
              </th>

              <th className="numero">
                Preço médio/kg
              </th>

              <th className="numero">
                Custo médio/kg
              </th>

              <th className="numero">
                Último preço
              </th>

              <th className="numero">
                Menor preço
              </th>

              <th className="numero">
                Maior preço
              </th>

              <th className="numero">
                Participação
              </th>

              <th className="numero">
                Prazo médio entrega
              </th>

              <th className="numero">
                Subtotal
              </th>

              <th className="numero">
                Total
              </th>
            </tr>
          </thead>


          <tbody>

            {dados.map(
              (
                item,
              ) => (

                <tr
                  key={
                    `${item.materialId}_${item.fornecedorId}`
                  }
                >

                  <td>
                    <strong>
                      {item.material}
                    </strong>
                  </td>


                  <td>
                    <strong>
                      {item.fornecedor}
                    </strong>
                  </td>


                  <td className="numero">
                    {item.compras}
                  </td>


                  <td className="numero">
                    {formatarKg(
                      item.quantidadeKg,
                      0,
                    )}
                  </td>


                  <td className="numero">
                    {formatarMoedaKg(
                      item.precoMedioKg,
                      3,
                    )}
                  </td>


                  <td className="numero dmp-custo">
                    {formatarMoedaKg(
                      item.custoMedioKg,
                      3,
                    )}
                  </td>


                  <td className="numero">
                    {formatarMoedaKg(
                      item.ultimoPrecoKg,
                      2,
                    )}
                  </td>


                  <td className="numero">
                    {formatarMoedaKg(
                      item.precoMinimoKg,
                      2,
                    )}
                  </td>


                  <td className="numero">
                    {formatarMoedaKg(
                      item.precoMaximoKg,
                      2,
                    )}
                  </td>


                  <td className="numero">
                    {formatarPercentual(
                      item.participacaoMaterialPercentual,
                      1,
                    )}
                  </td>


                  <td className="numero">
                    {formatarDias(
                      item.prazoMedioEntregaDias,
                    )}
                  </td>


                  <td className="numero dmp-subtotal">
                    {formatarMoeda(
                      item.subtotal,
                      2,
                    )}
                  </td>


                  <td className="numero dmp-total">
                    {formatarMoeda(
                      item.total,
                      2,
                    )}
                  </td>

                </tr>

              ),
            )}

          </tbody>

        </table>

      </div>

    </section>
  );
}


/* =========================================================
   TABELAS
========================================================= */

export default function TabelasMateriaPrima({
  porMaterial,
  porFornecedor,
}) {
  return (
    <>
      <TabelaMaterial
        dados={
          porMaterial ||
          []
        }
      />

      <TabelaFornecedor
        dados={
          porFornecedor ||
          []
        }
      />
    </>
  );
}