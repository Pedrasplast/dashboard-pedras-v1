import {
  useMemo,
  useState,
} from "react";

import {
  FiActivity,
  FiAlertTriangle,
  FiDownload,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import useConsumoProgramado
  from "./useConsumoProgramado";

import {
  formatarData,
  formatarHoras,
  formatarKg,
  formatarNumero,
  periodoInicial,
} from "./relatorioConsumo.utils";

import "./RelatorioConsumo.css";


/* =========================================================
   TABELA
========================================================= */

function TabelaInjetoras({
  dados,
}) {
  return (
    <div className="rmp-tabela-container">

      <table className="rmp-tabela">

        <thead>

          <tr>
            <th>Injetora</th>
            <th>Programações</th>
            <th>Horas</th>
            <th>Ciclos</th>
            <th>Peças</th>
            <th>Consumo PP</th>
          </tr>

        </thead>


        <tbody>

          {dados
            .porInjetora
            .map(
              (
                grupo,
              ) => (

                <tr
                  className="rmp-linha"
                  key={
                    grupo
                      .injetora
                  }
                >

                  <td>

                    <strong>
                      Injetora{" "}
                      {grupo
                        .injetora}
                    </strong>

                  </td>


                  <td>
                    {formatarNumero(
                      grupo
                        .quantidadeProgramacoes,
                    )}
                  </td>


                  <td>
                    {formatarHoras(
                      grupo
                        .horasProgramadas,
                    )}
                  </td>


                  <td>
                    {formatarNumero(
                      grupo
                        .ciclosCompletos,
                    )}
                  </td>


                  <td>
                    {formatarNumero(
                      grupo
                        .pecasPrevistas,
                    )}
                  </td>


                  <td className="rmp-consumo">
                    {formatarKg(
                      grupo
                        .consumoTotalKg,
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

export default function ConsumoProgramadoPorInjetora({
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
      .porInjetora
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
        exportarPdfConsumoInjetora,
      } =
        await import(
          "./ExportarConsumoProgramado.js"
        );


      await exportarPdfConsumoInjetora({
        relatorio,

        dados,

        dataInicial,

        dataFinal,
      });
    } catch (
      error
    ) {
      console.error(
        "Erro ao gerar PDF do consumo por injetora:",
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
        exportarExcelConsumoInjetora,
      } =
        await import(
          "./ExportarConsumoProgramado.js"
        );


      await exportarExcelConsumoInjetora({
        relatorio,

        dados,

        dataInicial,

        dataFinal,
      });
    } catch (
      error
    ) {
      console.error(
        "Erro ao gerar Excel do consumo por injetora:",
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
          <FiActivity />
        </div>


        <div>

          <span className="relatorio-selecionado-categoria">
            Matéria-Prima
          </span>

          <h2>
            {relatorio
              ?.titulo ||
              "Consumo Programado por Injetora"}
          </h2>

          <p>
            {relatorio
              ?.descricao ||
              "Consumo previsto de PP por injetora no período selecionado."}
          </p>

        </div>

      </div>


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
              Conferir totais por injetora
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
              Totais por injetora
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
              Totais por injetora
            </span>

          </div>

        </button>

      </div>


      <div className="relatorio-filtros-card">

        <div className="relatorio-filtros-header">

          <div>

            <h3>
              Parâmetros do relatório
            </h3>

            <p>
              O consumo considera somente o trecho da programação dentro do período.
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
                Injetoras programadas
              </span>

              <strong>
                {dados
                  .resumo
                  .injetorasProgramadas}
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
                Horas programadas
              </span>

              <strong>
                {formatarHoras(
                  dados
                    .resumo
                    .horasProgramadas,
                )}
              </strong>

            </article>


            <article>

              <span>
                Peças previstas
              </span>

              <strong>
                {formatarNumero(
                  dados
                    .resumo
                    .pecasPrevistas,
                )}
              </strong>

            </article>


            <article className="destaque">

              <span>
                Consumo PP
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


          {dados
            .resumo
            .programacoesSemReceita >
            0 && (

            <div className="rmp-mensagem aviso">

              <FiAlertTriangle />

              <span>
                {dados
                  .resumo
                  .programacoesSemReceita}{" "}
                programação(ões) possuem receita pendente.{" "}

                {formatarKg(
                  dados
                    .resumo
                    .consumoSemReceitaKg,
                )} ainda não está distribuído entre fornecedores.
              </span>

            </div>

          )}


          <TabelaInjetoras
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
            Calculando consumo programado
          </strong>

          <span>
            Aguarde enquanto as programações e receitas são consolidadas.
          </span>

        </div>

      )}


      {!carregando &&
        !erro &&
        !periodoInvalido &&
        !possuiDados && (

        <div className="rmp-estado">

          <FiActivity />

          <strong>
            Nenhuma injetora programada
          </strong>

          <span>
            Não existem programações ativas dentro do período selecionado.
          </span>

        </div>

      )}


      {visualizacaoAberta && (

        <section className="relatorio-visualizacao">

          <div className="relatorio-visualizacao-header">

            <div>

              <span className="relatorio-visualizacao-eyebrow">
                Pré-visualização
              </span>

              <h3>
                Consumo Programado por Injetora
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
                Injetoras
              </span>

              <strong>
                {dados
                  .resumo
                  .injetorasProgramadas}
              </strong>

            </div>

          </div>


          {possuiDados ? (

            <TabelaInjetoras
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
                .injetorasProgramadas}{" "}
              injetora(s) exibida(s)
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
