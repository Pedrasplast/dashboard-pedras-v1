import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CirclePause,
  Search,
  X,
} from "lucide-react";

import {
  formatarDuracaoResumida,
} from "../dashboardParadas.utils";

import {
  formatarDataRegistro,
  formatarHorarioRegistro,
  normalizarTextoOcorrencia,
  obterDuracaoSegundos,
  obterInjetoraRegistro,
  obterMotivoRegistro,
} from "../ocorrenciasParadas.utils";

/* =========================================================
   FORMATAÇÕES
========================================================= */

function formatarNumero(valor) {
  return Number(
    valor || 0,
  ).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 0,
    },
  );
}

/* =========================================================
   MODAL REUTILIZÁVEL
========================================================= */

function ModalOcorrenciasParadas({
  aberto = false,
  titulo = "",
  subtitulo =
    "Dados conforme os filtros atuais",
  eyebrow =
    "Análise detalhada",
  ocorrencias = [],
  onFechar,
  icone,
}) {
  const [
    busca,
    setBusca,
  ] = useState("");

  const Icone =
    icone || CirclePause;

  /* =======================================================
     FECHAR
  ======================================================= */

  const fechar =
    useCallback(() => {
      if (
        typeof onFechar ===
        "function"
      ) {
        onFechar();
      }
    }, [onFechar]);

  /* =======================================================
     REINICIAR BUSCA
  ======================================================= */

  useEffect(() => {
    if (aberto) {
      setBusca("");
    }
  }, [
    aberto,
    titulo,
  ]);

  /* =======================================================
     MODAL ABERTO

     - ESC fecha
     - bloqueia scroll da página
  ======================================================= */

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function aoPressionarTecla(
      event,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        fechar();
      }
    }

    window.addEventListener(
      "keydown",
      aoPressionarTecla,
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        aoPressionarTecla,
      );
    };
  }, [
    aberto,
    fechar,
  ]);

  /* =======================================================
     BASE
  ======================================================= */

  const lista =
    useMemo(
      () =>
        Array.isArray(
          ocorrencias,
        )
          ? ocorrencias
          : [],
      [ocorrencias],
    );

  /* =======================================================
     RESUMO
  ======================================================= */

  const resumo =
    useMemo(() => {
      let totalSegundos = 0;

      const injetoras =
        new Set();

      for (
        const registro of
        lista
      ) {
        totalSegundos +=
          obterDuracaoSegundos(
            registro,
          );

        const injetora =
          obterInjetoraRegistro(
            registro,
          );

        if (injetora) {
          injetoras.add(
            injetora,
          );
        }
      }

      return {
        total:
          lista.length,

        totalSegundos,

        mediaSegundos:
          lista.length > 0
            ? totalSegundos /
              lista.length
            : 0,

        injetoras:
          injetoras.size,
      };
    }, [lista]);

  /* =======================================================
     PESQUISA

     Preserva a ordem original dos registros.
  ======================================================= */

  const ocorrenciasPesquisadas =
    useMemo(() => {
      const termo =
        normalizarTextoOcorrencia(
          busca,
        );

      if (!termo) {
        return lista;
      }

      return lista.filter(
        (registro) => {
          const campos = [
            registro?.injetora,
            registro?.no_injetora,
            registro?.motivo,
            registro?.justificativa,
            registro?.descricao,
            registro?.op,
            registro?.operador,
            registro?.cod_prod,
            registro?.material,
            registro?.cliente,
          ];

          return campos.some(
            (campo) =>
              normalizarTextoOcorrencia(
                campo,
              ).includes(
                termo,
              ),
          );
        },
      );
    }, [
      lista,
      busca,
    ]);

  if (!aberto) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="dp-ocorrencias-overlay"
      onMouseDown={fechar}
    >
      <section
        className="dp-ocorrencias-modal dp-ocorrencias-modal--novo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-ocorrencias-titulo"
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >
        {/* ===============================================
            CABEÇALHO
        =============================================== */}

        <header className="dp-ocorrencias-header dp-ocorrencias-header--novo">
          <div className="dp-ocorrencias-header-conteudo">
            <div className="dp-ocorrencias-header-icon">
              <Icone
                size={20}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>

            <div>
              <span className="dp-ocorrencias-eyebrow">
                {eyebrow}
              </span>

              <h3 id="dp-ocorrencias-titulo">
                {titulo}
              </h3>

              <div className="dp-ocorrencias-header-meta">
                <span>
                  {formatarNumero(
                    resumo.total,
                  )}{" "}
                  ocorrência(s)
                </span>

                <i />

                <span>
                  {subtitulo}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="dp-ocorrencias-fechar"
            onClick={fechar}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </header>

        {/* ===============================================
            INDICADORES
        =============================================== */}

        <div className="dp-ocorrencias-resumo dp-ocorrencias-resumo--novo">
          <article>
            <span>
              Total de ocorrências
            </span>

            <strong>
              {formatarNumero(
                resumo.total,
              )}
            </strong>

            <small>
              registros encontrados
            </small>
          </article>

          <article>
            <span>
              Tempo total parado
            </span>

            <strong>
              {formatarDuracaoResumida(
                resumo.totalSegundos,
              )}
            </strong>

            <small>
              soma das ocorrências
            </small>
          </article>

          <article>
            <span>
              Tempo médio
            </span>

            <strong>
              {formatarDuracaoResumida(
                resumo.mediaSegundos,
              )}
            </strong>

            <small>
              por ocorrência
            </small>
          </article>

          <article>
            <span>
              Injetoras afetadas
            </span>

            <strong>
              {resumo.injetoras}
            </strong>

            <small>
              máquinas diferentes
            </small>
          </article>
        </div>

        {/* ===============================================
            BUSCA
        =============================================== */}

        <div className="dp-ocorrencias-toolbar dp-ocorrencias-toolbar--novo">
          <label className="dp-ocorrencias-busca">
            <Search size={16} />

            <input
              type="search"
              value={busca}
              onChange={(
                event,
              ) =>
                setBusca(
                  event.target
                    .value,
                )
              }
              placeholder="Pesquisar injetora, justificativa, OP, operador ou produto..."
            />

            {busca && (
              <button
                type="button"
                className="dp-ocorrencias-limpar-busca"
                onClick={() =>
                  setBusca("")
                }
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </label>

          <div className="dp-ocorrencias-total-encontrado">
            <strong>
              {formatarNumero(
                ocorrenciasPesquisadas.length,
              )}
            </strong>

            <span>
              resultado(s)
            </span>
          </div>
        </div>

        {/* ===============================================
            TABELA COMPLETA COM ROLAGEM
        =============================================== */}

        <div className="dp-ocorrencias-tabela-wrap">
          <table className="dp-ocorrencias-tabela dp-ocorrencias-tabela--novo">
            <thead>
              <tr>
                <th className="dp-ocorrencias-col-numero">
                  #
                </th>

                <th>Data</th>
                <th>Injetora</th>
                <th>Motivo</th>
                <th>
                  Descrição /
                  justificativa
                </th>
                <th>OP</th>
                <th>Operador</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Duração</th>
              </tr>
            </thead>

            <tbody>
              {ocorrenciasPesquisadas.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="dp-ocorrencias-vazio"
                  >
                    <Search
                      size={22}
                    />

                    <strong>
                      Nenhum registro encontrado
                    </strong>

                    <span>
                      Tente alterar o termo da pesquisa.
                    </span>
                  </td>
                </tr>
              ) : (
                ocorrenciasPesquisadas.map(
                  (
                    registro,
                    indice,
                  ) => {
                    const justificativa =
                      String(
                        registro
                          ?.justificativa ||
                          registro
                            ?.descricao ||
                          "",
                      ).trim();

                    const injetora =
                      obterInjetoraRegistro(
                        registro,
                      );

                    const duracao =
                      obterDuracaoSegundos(
                        registro,
                      );

                    return (
                      <tr
                        key={
                          registro?.id ??
                          `${titulo}-${indice}`
                        }
                      >
                        <td className="dp-ocorrencias-col-numero">
                          {indice + 1}
                        </td>

                        <td>
                          {formatarDataRegistro(
                            registro,
                          )}
                        </td>

                        <td>
                          <span className="dp-ocorrencias-injetora">
                            {injetora ||
                              "—"}
                          </span>
                        </td>

                        <td className="dp-ocorrencias-motivo">
                          {obterMotivoRegistro(
                            registro,
                          )}
                        </td>

                        <td className="dp-ocorrencias-descricao">
                          {justificativa ||
                            "—"}
                        </td>

                        <td>
                          {registro?.op ||
                            "—"}
                        </td>

                        <td>
                          {registro
                            ?.operador ||
                            "—"}
                        </td>

                        <td>
                          {formatarHorarioRegistro(
                            registro?.inicio ||
                              registro
                                ?.inicio_dia,
                          )}
                        </td>

                        <td>
                          {formatarHorarioRegistro(
                            registro?.fim ||
                              registro
                                ?.fim_dia,
                          )}
                        </td>

                        <td>
                          <strong className="dp-ocorrencias-duracao">
                            {duracao > 0
                              ? formatarDuracaoResumida(
                                  duracao,
                                )
                              : "—"}
                          </strong>
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default memo(
  ModalOcorrenciasParadas,
);
