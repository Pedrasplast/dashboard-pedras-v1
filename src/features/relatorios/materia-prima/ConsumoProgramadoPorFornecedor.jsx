import {
  useMemo,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiDownload,
  FiEye,
  FiFileText,
  FiPackage,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import useConsumoProgramado
  from "./useConsumoProgramado";

import {
  formatarData,
  formatarKg,
  formatarNumero,
  periodoInicial,
} from "./relatorioConsumo.utils";

import "./RelatorioConsumo.css";


/* =========================================================
   TABELA
============================================================ */

function TabelaFornecedores({
  dados,
}) {
  return (
    <div className="rmp-tabela-container">

      <table className="rmp-tabela">

        <thead>

          <tr>
            <th>Fornecedor</th>
            <th>Injetoras</th>
            <th>Produtos</th>
            <th>Programações</th>
            <th>Consumo PP</th>
          </tr>

        </thead>


        <tbody>

          {dados
            .porFornecedor
            .map(
              (
                grupo,
              ) => (

                <tr
                  className="rmp-linha"
                  key={
                    grupo
                      .fornecedorId
                  }
                >

                  <td>

                    <strong>
                      {grupo
                        .fornecedorNome}
                    </strong>

                  </td>


                  <td>
                    {formatarNumero(
                      grupo
                        .quantidadeInjetoras,
                    )}
                  </td>


                  <td>
                    {formatarNumero(
                      grupo
                        .quantidadeProdutos,
                    )}
                  </td>


                  <td>
                    {formatarNumero(
                      grupo
                        .quantidadeProgramacoes,
                    )}
                  </td>


                  <td className="rmp-consumo">
                    {formatarKg(
                      grupo
                        .consumoKg,
                    )}
                  </td>

                </tr>

              ),
            )}

        </tbody>

      </table>

    </div>
  );
}


/* =========================================================
   RELATÓRIO
========================================================= */

export default function ConsumoProgramadoPorFornecedor({
  relatorio,
}) {
  const inicial =
    useMemo(
      () =>
        periodoInicial(),
      [],
    );


  const [
    dataInicial,
    setDataInicial,
  ] =
    useState(
      inicial.inicio,
    );


  const [
    dataFinal,
    setDataFinal,
  ] =
    useState(
      inicial.fim,
    );


  const [
    visualizacaoAberta,
    setVisualizacaoAberta,
  ] =
    useState(
      false,
    );


  const [
    exportando,
    setExportando,
  ] =
    useState(
      null,
    );


  const periodoInvalido =
    Boolean(
      dataInicial &&
      dataFinal &&
      dataFinal <
        dataInicial,
    );


  const {
    dados,
    carregando,
    atualizando,
    erro,
    recarregar,
  } =
    useConsumoProgramado({
      dataInicial,

      dataFinal,

      habilitado:
        !periodoInvalido,
    });


  const possuiDados =
    dados
      .porFornecedor
      .length >
    0;


  /* =======================================================
     PDF
  ======================================================= */

  async function exportarPDF() {
    if (
      !possuiDados ||
      exportando
    ) {
      return;
    }


    try {
      setExportando(
        "pdf",
      );


      const {
        exportarPdfConsumoFornecedor,
      } =
        await import(
          "./ExportarConsumoProgramado.js"
        );


      await exportarPdfConsumoFornecedor({
        relatorio,

        dados,

        dataInicial,

        dataFinal,
      });
    } catch (
      error
    ) {
      console.error(
        "Erro ao gerar PDF do consumo por fornecedor:",
        error,
      );


      window.alert(
        "Não foi possível gerar o PDF.",
      );
    } finally {
      setExportando(
        null,
      );
    }
  }


  /* =======================================================
     EXCEL
  ======================================================= */

  async function exportarExcel() {
    if (
      !possuiDados ||
      exportando
    ) {
      return;
    }


    try {
      setExportando(
        "excel",
      );


      const {
        exportarExcelConsumoFornecedor,
      } =
        await import(
          "./ExportarConsumoProgramado.js"
        );


      await exportarExcelConsumoFornecedor({
        relatorio,

        dados,

        dataInicial,

        dataFinal,
      });
    } catch (
      error
    ) {
      console.error(
        "Erro ao gerar Excel do consumo por fornecedor:",
        error,
      );


      window.alert(
        "Não foi possível gerar o Excel.",
      );
    } finally {
      setExportando(
        null,
      );
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>

      <div className="relatorio-selecionado-header">

        <div className="relatorio-selecionado-icone">
          <FiPackage />
        </div>


        <div>

          <span className="relatorio-selecionado-categoria">
            Matéria-Prima
          </span>

          <h2>
            {relatorio
              ?.titulo ||
              "Consumo Programado por Fornecedor"}
          </h2>

          <p>
            {relatorio
              ?.descricao ||
              "Necessidade prevista de PP por fornecedor conforme as receitas e a programação das injetoras."}
          </p>

        </div>

      </div>


      {/* =================================================
          AÇÕES
      ================================================= */}

      <div className="relatorio-acoes">

        <button
          type="button"
          className="btn-relatorio"
          onClick={
            () =>
              setVisualizacaoAberta(
                true,
              )
          }
          disabled={
            !possuiDados
          }
        >

          <FiEye />

          <div>
            <strong>
              Visualizar
            </strong>

            <span>
              Conferir totais por fornecedor
            </span>
          </div>

        </button>


        <button
          type="button"
          className="btn-relatorio btn-relatorio-pdf"
          onClick={
            exportarPDF
          }
          disabled={
            !possuiDados ||
            Boolean(
              exportando,
            )
          }
        >

          {exportando ===
          "pdf"
            ? (
              <FiRefreshCw className="rmp-girando" />
            )
            : (
              <FiFileText />
            )}

          <div>

            <strong>
              Baixar PDF
            </strong>

            <span>
              Totais por fornecedor
            </span>

          </div>

        </button>


        <button
          type="button"
          className="btn-relatorio btn-relatorio-csv"
          onClick={
            exportarExcel
          }
          disabled={
            !possuiDados ||
            Boolean(
              exportando,
            )
          }
        >

          {exportando ===
          "excel"
            ? (
              <FiRefreshCw className="rmp-girando" />
            )
            : (
              <FiDownload />
            )}

          <div>

            <strong>
              Exportar Excel
            </strong>

            <span>
              Totais por fornecedor
            </span>

          </div>

        </button>

      </div>


      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="relatorio-filtros-card">

        <div className="relatorio-filtros-header">

          <div>

            <h3>
              Parâmetros do relatório
            </h3>

            <p>
              O consumo é consolidado por fornecedor dentro do período informado.
            </p>

          </div>

        </div>


        <div className="rmp-filtros">

          <label>

            <span>
              De
            </span>

            <input
              type="date"
              value={
                dataInicial
              }
              max={
                dataFinal ||
                undefined
              }
              onChange={
                (
                  event,
                ) =>
                  setDataInicial(
                    event
                      .target
                      .value,
                  )
              }
            />

          </label>


          <label>

            <span>
              Até
            </span>

            <input
              type="date"
              value={
                dataFinal
              }
              min={
                dataInicial ||
                undefined
              }
              onChange={
                (
                  event,
                ) =>
                  setDataFinal(
                    event
                      .target
                      .value,
                  )
              }
            />

          </label>


          <button
            type="button"
            className="rmp-atualizar"
            onClick={
              () =>
                recarregar()
            }
            disabled={
              carregando ||
              atualizando ||
              periodoInvalido
            }
          >

            <FiRefreshCw
              className={
                atualizando
                  ? "rmp-girando"
                  : ""
              }
            />

            Atualizar

          </button>

        </div>

      </div>


      {periodoInvalido && (

        <div className="rmp-mensagem erro">

          <FiAlertTriangle />

          <span>
            A data final não pode ser anterior à data inicial.
          </span>

        </div>

      )}


      {erro && (

        <div className="rmp-mensagem erro">

          <FiAlertTriangle />

          <span>
            {erro}
          </span>

        </div>

      )}


      {!carregando &&
        possuiDados && (

        <>

          <div className="rmp-resumo">

            <article>

              <span>
                Fornecedores envolvidos
              </span>

              <strong>
                {dados
                  .resumo
                  .fornecedoresEnvolvidos}
              </strong>

            </article>


            <article>

              <span>
                Programações
              </span>

              <strong>
                {dados
                  .resumo
                  .programacoes}
              </strong>

            </article>


            <article>

              <span>
                PP distribuído
              </span>

              <strong>
                {formatarKg(
                  dados
                    .resumo
                    .consumoDistribuidoKg,
                )}
              </strong>

            </article>


            <article
              className={
                dados
                  .resumo
                  .consumoSemReceitaKg >
                  0
                  ? "aviso"
                  : ""
              }
            >

              <span>
                Sem receita
              </span>

              <strong>
                {formatarKg(
                  dados
                    .resumo
                    .consumoSemReceitaKg,
                )}
              </strong>

            </article>


            <article className="destaque">

              <span>
                Consumo total
              </span>

              <strong>
                {formatarKg(
                  dados
                    .resumo
                    .consumoTotalKg,
                )}
              </strong>

            </article>

          </div>


          <TabelaFornecedores
            dados={
              dados
            }
          />

        </>

      )}


      {carregando && (

        <div className="rmp-estado">

          <FiRefreshCw className="rmp-girando" />

          <strong>
            Calculando necessidade por fornecedor
          </strong>

          <span>
            Aguarde enquanto as receitas são consolidadas.
          </span>

        </div>

      )}


      {!carregando &&
        !erro &&
        !periodoInvalido &&
        !possuiDados && (

        <div className="rmp-estado">

          <FiPackage />

          <strong>
            Nenhum consumo programado
          </strong>

          <span>
            Não existem programações ativas dentro do período selecionado.
          </span>

        </div>

      )}


      {/* =================================================
          VISUALIZAÇÃO
      ================================================= */}

      {visualizacaoAberta && (

        <section className="relatorio-visualizacao">

          <div className="relatorio-visualizacao-header">

            <div>

              <span className="relatorio-visualizacao-eyebrow">
                Pré-visualização
              </span>

              <h3>
                Consumo Programado por Fornecedor
              </h3>

            </div>


            <button
              type="button"
              className="relatorio-visualizacao-fechar"
              onClick={
                () =>
                  setVisualizacaoAberta(
                    false,
                  )
              }
              aria-label="Fechar visualização"
            >
              <FiX />
            </button>

          </div>


          <div className="relatorio-visualizacao-info">

            <div className="relatorio-visualizacao-info-item">

              <span>
                Período
              </span>

              <strong>
                {formatarData(
                  dataInicial,
                )} até{" "}
                {formatarData(
                  dataFinal,
                )}
              </strong>

            </div>


            <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">

              <span>
                Fornecedores
              </span>

              <strong>
                {dados
                  .resumo
                  .fornecedoresEnvolvidos}
              </strong>

            </div>

          </div>


          {possuiDados ? (

            <TabelaFornecedores
              dados={
                dados
              }
            />

          ) : (

            <div className="relatorio-visualizacao-vazia">

              <FiFileText />

              <strong>
                Nenhum registro encontrado
              </strong>

              <span>
                Ajuste o período para visualizar os dados.
              </span>

            </div>

          )}


          <div className="relatorio-visualizacao-footer">

            <span>
              {dados
                .resumo
                .fornecedoresEnvolvidos}{" "}
              fornecedor(es) exibido(s)
            </span>

            <span>
              Consumo total:{" "}
              {formatarKg(
                dados
                  .resumo
                  .consumoTotalKg,
              )}
            </span>

          </div>

        </section>

      )}

    </>
  );
}
