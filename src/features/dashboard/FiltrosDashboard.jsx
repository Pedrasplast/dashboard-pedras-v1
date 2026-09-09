import { memo, useCallback, useMemo, useState } from "react";

import CampoDataCalendario from "@/components/filtros/CampoDataCalendario";
import Filtros from "@/components/filtros/Filtros";
import { valoresUnicosOrdenados } from "@/lib/colecoes";

import {
  TURNOS_DISPONIVEIS,
  VALORES_PADRAO_FILTROS_PRODUCAO,
  converterISOParaData,
  extrairDataRegistro,
  formatarDataISO,
  formatarDataVisual,
  obterDescricaoTipo,
} from "./dashboard.utils";

import "./FiltrosDashboard.css";

/* =========================================================
   FILTROS DO DASHBOARD
========================================================= */

function FiltrosDashboard({
  filtros,
  setFiltros,

  rawDados = [],

  /* =======================================================
     EXIBIÇÃO DOS CAMPOS
  ======================================================= */

  exibirPeriodo = true,
  exibirInjetora = true,
  exibirTurno = false,
  exibirProduto = true,
  exibirMp = true,
  exibirTipo = true,
  exibirMotivo = false,

  /*
   * Permite mover o campo MOTIVO para logo abaixo
   * do TURNO sem alterar a ordem dos demais dashboards.
   */
  motivoAbaixoTurno = false,

  /* =======================================================
     OPÇÕES DISPONÍVEIS
  ======================================================= */

  tiposDisponiveis = [],
  produtosDisponiveis = [],
  mpsDisponiveis = [],
  motivosDisponiveis = [],

  /* =======================================================
     CONFIGURAÇÕES
  ======================================================= */

  modoRelatorio = false,

  /*
   * Cada tela pode fornecer seus próprios valores padrão.
   *
   * Se não fornecer, continua utilizando exatamente os
   * valores do Dashboard de Produção.
   *
   * Isso mantém compatibilidade com todas as telas atuais.
   */
  valoresPadrao = VALORES_PADRAO_FILTROS_PRODUCAO,
}) {
  const [calendarioAberto, setCalendarioAberto] = useState(null);

  /* =======================================================
     DATAS EXISTENTES NA BASE
  ======================================================= */

  const datasComDados = useMemo(
    () => new Set(rawDados.map(extrairDataRegistro).filter(Boolean)),
    [rawDados],
  );

  const datasOrdenadas = useMemo(
    () => [...datasComDados].sort(),
    [datasComDados],
  );

  const primeiraDataDisponivel = datasOrdenadas[0] || null;

  const ultimaDataDisponivel = datasOrdenadas.at(-1) || null;

  /* =======================================================
     DATAS DO CALENDÁRIO
  ======================================================= */

  const primeiraDataCalendario = useMemo(
    () => converterISOParaData(primeiraDataDisponivel),
    [primeiraDataDisponivel],
  );

  const ultimaDataCalendario = useMemo(
    () => converterISOParaData(ultimaDataDisponivel),
    [ultimaDataDisponivel],
  );

  const dataInicioSelecionada = useMemo(
    () => converterISOParaData(filtros.dataInicio),
    [filtros.dataInicio],
  );

  const dataFimSelecionada = useMemo(
    () => converterISOParaData(filtros.dataFim),
    [filtros.dataFim],
  );

  const mesInicialCalendario = useMemo(
    () =>
      dataInicioSelecionada ||
      dataFimSelecionada ||
      ultimaDataCalendario ||
      new Date(),
    [
      dataInicioSelecionada,
      dataFimSelecionada,
      ultimaDataCalendario,
    ],
  );

  /* =======================================================
     INJETORAS DISPONÍVEIS
  ======================================================= */

  const injetorasDisponiveis = useMemo(
    () =>
      valoresUnicosOrdenados(
        rawDados.map((registro) => registro.injetora),
      ),
    [rawDados],
  );

  /* =======================================================
     TIPO
  ======================================================= */

  const toggleTipo = useCallback(
    (tipo) => {
      setFiltros((anterior) => {
        const tiposAtuais = Array.isArray(anterior.tipo)
          ? anterior.tipo
          : [];

        return {
          ...anterior,

          tipo: tiposAtuais.includes(tipo)
            ? tiposAtuais.filter(
                (tipoAtual) => tipoAtual !== tipo,
              )
            : [...tiposAtuais, tipo],
        };
      });
    },
    [setFiltros],
  );

  /* =======================================================
     VERIFICAR DATA COM REGISTRO
  ======================================================= */

  const dataPossuiRegistro = useCallback(
    (data) => {
      const dataISO = formatarDataISO(data);

      return dataISO !== "" && datasComDados.has(dataISO);
    },
    [datasComDados],
  );

  /* =======================================================
     REGRAS DO CALENDÁRIO
  ======================================================= */

  const desabilitarDataInicio = useCallback(
    (data) =>
      !dataPossuiRegistro(data) ||
      Boolean(
        dataFimSelecionada &&
          data > dataFimSelecionada,
      ),
    [
      dataPossuiRegistro,
      dataFimSelecionada,
    ],
  );

  const desabilitarDataFim = useCallback(
    (data) =>
      !dataPossuiRegistro(data) ||
      Boolean(
        dataInicioSelecionada &&
          data < dataInicioSelecionada,
      ),
    [
      dataPossuiRegistro,
      dataInicioSelecionada,
    ],
  );

  /* =======================================================
     SELECIONAR DATA INICIAL
  ======================================================= */

  const selecionarDataInicio = useCallback(
    (data) => {
      if (!data || !dataPossuiRegistro(data)) {
        return;
      }

      const novaDataInicio = formatarDataISO(data);

      setFiltros((anterior) => ({
        ...anterior,

        dataInicio: novaDataInicio,

        dataFim:
          anterior.dataFim &&
          anterior.dataFim < novaDataInicio
            ? ""
            : anterior.dataFim,
      }));

      setCalendarioAberto(null);
    },
    [
      dataPossuiRegistro,
      setFiltros,
    ],
  );

  /* =======================================================
     SELECIONAR DATA FINAL
  ======================================================= */

  const selecionarDataFim = useCallback(
    (data) => {
      if (!data || !dataPossuiRegistro(data)) {
        return;
      }

      const novaDataFim = formatarDataISO(data);

      if (
        filtros.dataInicio &&
        novaDataFim < filtros.dataInicio
      ) {
        return;
      }

      setFiltros((anterior) => ({
        ...anterior,

        dataFim: novaDataFim,
      }));

      setCalendarioAberto(null);
    },
    [
      dataPossuiRegistro,
      filtros.dataInicio,
      setFiltros,
    ],
  );

  /* =======================================================
     ESTADO DA BASE
  ======================================================= */

  const semDatas = datasOrdenadas.length === 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Filtros
      filtros={filtros}
      setFiltros={setFiltros}
      valoresPadrao={valoresPadrao}
      className="filter-section"
      onDepoisLimpar={() => setCalendarioAberto(null)}
    >
      {({ alterar, limpar, possuiFiltroAtivo }) => (
        <>
          {/* =================================================
              PERÍODO - MODO RELATÓRIO
          ================================================= */}

          {exibirPeriodo && modoRelatorio && (
            <div className="periodo-relatorio-area">
              <label className="periodo-relatorio-label">
                PERÍODO
              </label>

              <div className="periodo-relatorio-linha">
                <div className="date-inputs-container">
                  <CampoDataCalendario
                    titulo="Data inicial"
                    valorVisual={formatarDataVisual(
                      filtros.dataInicio,
                    )}
                    aberto={calendarioAberto === "inicio"}
                    desabilitado={semDatas}
                    onAlternar={() =>
                      setCalendarioAberto((atual) =>
                        atual === "inicio"
                          ? null
                          : "inicio",
                      )
                    }
                    dataSelecionada={dataInicioSelecionada}
                    onSelecionar={selecionarDataInicio}
                    desabilitarData={desabilitarDataInicio}
                    dataPossuiRegistro={dataPossuiRegistro}
                    mesInicial={mesInicialCalendario}
                    primeiraData={primeiraDataCalendario}
                    ultimaData={ultimaDataCalendario}
                  />

                  <CampoDataCalendario
                    titulo="Data final"
                    valorVisual={formatarDataVisual(
                      filtros.dataFim,
                    )}
                    aberto={calendarioAberto === "fim"}
                    desabilitado={semDatas}
                    onAlternar={() =>
                      setCalendarioAberto((atual) =>
                        atual === "fim"
                          ? null
                          : "fim",
                      )
                    }
                    dataSelecionada={dataFimSelecionada}
                    onSelecionar={selecionarDataFim}
                    desabilitarData={desabilitarDataFim}
                    dataPossuiRegistro={dataPossuiRegistro}
                    mesInicial={mesInicialCalendario}
                    primeiraData={primeiraDataCalendario}
                    ultimaData={ultimaDataCalendario}
                  />
                </div>

                <button
                  type="button"
                  className="clear-date-btn clear-date-btn-relatorio"
                  onClick={limpar}
                  disabled={!possuiFiltroAtivo}
                  title="Limpar todos os filtros"
                >
                  ✕ LIMPAR
                </button>
              </div>

              {semDatas && (
                <small className="calendar-empty">
                  Nenhuma data encontrada na base.
                </small>
              )}
            </div>
          )}

          {/* =================================================
              PERÍODO - DASHBOARD
          ================================================= */}

          {exibirPeriodo && !modoRelatorio && (
            <>
              <div className="filter-header-row">
                <label>PERÍODO</label>

                <button
                  type="button"
                  className="clear-date-btn"
                  onClick={limpar}
                  disabled={!possuiFiltroAtivo}
                  title="Limpar todos os filtros"
                >
                  ✕ LIMPAR
                </button>
              </div>

              <div className="date-inputs-container">
                <CampoDataCalendario
                  titulo="Data inicial"
                  valorVisual={formatarDataVisual(
                    filtros.dataInicio,
                  )}
                  aberto={calendarioAberto === "inicio"}
                  desabilitado={semDatas}
                  onAlternar={() =>
                    setCalendarioAberto((atual) =>
                      atual === "inicio"
                        ? null
                        : "inicio",
                    )
                  }
                  dataSelecionada={dataInicioSelecionada}
                  onSelecionar={selecionarDataInicio}
                  desabilitarData={desabilitarDataInicio}
                  dataPossuiRegistro={dataPossuiRegistro}
                  mesInicial={mesInicialCalendario}
                  primeiraData={primeiraDataCalendario}
                  ultimaData={ultimaDataCalendario}
                />

                <CampoDataCalendario
                  titulo="Data final"
                  valorVisual={formatarDataVisual(
                    filtros.dataFim,
                  )}
                  aberto={calendarioAberto === "fim"}
                  desabilitado={semDatas}
                  onAlternar={() =>
                    setCalendarioAberto((atual) =>
                      atual === "fim"
                        ? null
                        : "fim",
                    )
                  }
                  dataSelecionada={dataFimSelecionada}
                  onSelecionar={selecionarDataFim}
                  desabilitarData={desabilitarDataFim}
                  dataPossuiRegistro={dataPossuiRegistro}
                  mesInicial={mesInicialCalendario}
                  primeiraData={primeiraDataCalendario}
                  ultimaData={ultimaDataCalendario}
                />
              </div>

              {semDatas && (
                <small className="calendar-empty">
                  Nenhuma data encontrada na base.
                </small>
              )}
            </>
          )}

          {/* =================================================
              INJETORA
          ================================================= */}

          {exibirInjetora && (
            <>
              <label>INJETORA</label>

              <select
                value={filtros.injetora || "Todos"}
                onChange={(evento) =>
                  alterar(
                    "injetora",
                    evento.target.value,
                    {
                      cod_prod: "Todos",
                    },
                  )
                }
              >
                <option value="Todos">
                  Todas
                </option>

                {injetorasDisponiveis.map((injetora) => (
                  <option
                    key={injetora}
                    value={injetora}
                  >
                    {injetora}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* =================================================
              TURNO
          ================================================= */}

          {exibirTurno && (
            <>
              <label>TURNO</label>

              <select
                value={filtros.turno || "Todos"}
                onChange={(evento) =>
                  alterar(
                    "turno",
                    evento.target.value,
                  )
                }
              >
                <option value="Todos">
                  Todos os turnos
                </option>

                {TURNOS_DISPONIVEIS.map((turno) => (
                  <option
                    key={turno}
                    value={turno}
                  >
                    {turno}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* =================================================
              MOTIVO — POSIÇÃO ALTERNATIVA
              Usado no Dashboard de Paradas para manter:
              Injetora → Turno → Motivo → Tipo
          ================================================= */}

          {exibirMotivo && motivoAbaixoTurno && (
            <>
              <label>MOTIVO</label>

              <select
                value={filtros.motivo || "Todos"}
                onChange={(evento) =>
                  alterar(
                    "motivo",
                    evento.target.value,
                  )
                }
              >
                <option value="Todos">
                  Todos os motivos
                </option>

                {motivosDisponiveis.map((motivo) => (
                  <option
                    key={motivo}
                    value={motivo}
                  >
                    {motivo}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* =================================================
              PRODUTO
          ================================================= */}

          {exibirProduto && (
            <>
              <label>CÓD. PROD</label>

              <select
                value={filtros.cod_prod || "Todos"}
                disabled={
                  exibirInjetora &&
                  filtros.injetora === "Todos"
                }
                onChange={(evento) =>
                  alterar(
                    "cod_prod",
                    evento.target.value,
                  )
                }
              >
                <option value="Todos">
                  Todos
                </option>

                {produtosDisponiveis.map((produto) => (
                  <option
                    key={produto}
                    value={produto}
                  >
                    {produto}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* =================================================
              MATÉRIA-PRIMA
          ================================================= */}

          {exibirMp && (
            <>
              <label>MATÉRIA-PRIMA</label>

              <select
                value={filtros.mp || "Todos"}
                onChange={(evento) =>
                  alterar(
                    "mp",
                    evento.target.value,
                  )
                }
              >
                <option value="Todos">
                  Todas
                </option>

                {mpsDisponiveis.map((mp) => (
                  <option
                    key={mp}
                    value={mp}
                  >
                    {mp}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* =================================================
              TIPO
          ================================================= */}

          {exibirTipo &&
            tiposDisponiveis.length > 0 && (
              <>
                <label>TIPO</label>

                <div className="checkbox-group tipo-checkbox-group">
                  {tiposDisponiveis.map((tipo) => (
                    <label
                      key={tipo}
                      className="checkbox-label tipo-checkbox-label"
                    >
                      <input
                        type="checkbox"
                        checked={(
                          filtros.tipo || []
                        ).includes(tipo)}
                        onChange={() =>
                          toggleTipo(tipo)
                        }
                      />

                      <div className="tipo-label-conteudo">
                        <strong className="tipo-label-numero">
                          {tipo}
                        </strong>

                        <span className="tipo-label-descricao">
                          {obterDescricaoTipo(tipo)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

          {/* =================================================
              MOTIVO
          ================================================= */}

          {exibirMotivo && !motivoAbaixoTurno && (
            <>
              <label>MOTIVO</label>

              <select
                value={filtros.motivo || "Todos"}
                onChange={(evento) =>
                  alterar(
                    "motivo",
                    evento.target.value,
                  )
                }
              >
                <option value="Todos">
                  Todos os motivos
                </option>

                {motivosDisponiveis.map((motivo) => (
                  <option
                    key={motivo}
                    value={motivo}
                  >
                    {motivo}
                  </option>
                ))}
              </select>
            </>
          )}
        </>
      )}
    </Filtros>
  );
}

export default memo(FiltrosDashboard);