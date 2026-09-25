import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiFileText,
  FiGrid,
  FiLock,
  FiSettings,
  FiUnlock,
  FiX,
} from "react-icons/fi";

import "./PermissoesModal.css";


function TogglePermissao({
  ativo,
  disabled = false,
  onChange,
  ariaLabel,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label={ariaLabel}
      className={`pu-switch ${ativo ? "is-active" : ""}`}
      disabled={disabled}
      onClick={onChange}
    >
      <span className="pu-switch-thumb" />
    </button>
  );
}


function BadgeStatus({
  completo,
  parcial,
}) {
  if (completo) {
    return (
      <span className="pu-status pu-status-active">
        <FiCheckCircle />
        Liberado
      </span>
    );
  }

  if (parcial) {
    return (
      <span className="pu-status pu-status-partial">
        Parcial
      </span>
    );
  }

  return (
    <span className="pu-status pu-status-blocked">
      Bloqueado
    </span>
  );
}


function TelaItem({
  tela,
  ativo,
  salvando,
  onToggle,
}) {
  return (
    <div
      className={`pu-item ${
        ativo
          ? "is-active"
          : ""
      }`}
    >
      <div className="pu-item-info">
        <strong>
          {tela.nome}
        </strong>

        <span>
          {tela.rota}
        </span>
      </div>

      <TogglePermissao
        ativo={ativo}
        disabled={salvando}
        ariaLabel={
          `${ativo ? "Bloquear" : "Liberar"} ${tela.nome}`
        }
        onChange={
          () =>
            onToggle(
              tela.id,
            )
        }
      />
    </div>
  );
}


function ModuloCard({
  modulo,
  status,
  permissoesTelas,
  salvando,
  onDefinirModulo,
  onToggleTela,
}) {
  const classeStatus =
    status.completo
      ? "is-active"
      : status.parcial
        ? "is-partial"
        : "";

  return (
    <section
      className={
        `pu-module-card ${classeStatus}`
      }
    >
      <header className="pu-module-header">
        <div className="pu-module-title">
          <div className="pu-module-title-row">
            <strong>
              {modulo.nome}
            </strong>

            <BadgeStatus
              completo={
                status.completo
              }
              parcial={
                status.parcial
              }
            />
          </div>

          <p>
            {modulo.descricao}
          </p>
        </div>

        <div className="pu-module-actions">
          <span className="pu-module-counter">
            {status.permitidas}/{status.total}
          </span>

          <button
            type="button"
            className={
              status.completo
                ? "pu-btn-module pu-btn-module-block"
                : "pu-btn-module"
            }
            disabled={
              salvando
            }
            onClick={
              () =>
                onDefinirModulo(
                  modulo,
                  !status.completo,
                )
            }
          >
            {status.completo
              ? "Bloquear"
              : "Liberar tudo"}
          </button>
        </div>
      </header>

      <div className="pu-module-items">
        {modulo.telas.map(
          (
            tela,
          ) => {
            const ativo =
              Boolean(
                permissoesTelas[
                  String(
                    tela.id,
                  )
                ],
              );

            return (
              <TelaItem
                key={
                  tela.id
                }
                tela={
                  tela
                }
                ativo={
                  ativo
                }
                salvando={
                  salvando
                }
                onToggle={
                  onToggleTela
                }
              />
            );
          },
        )}
      </div>
    </section>
  );
}


function RelatorioItem({
  relatorio,
  ativo,
  disabled,
  salvando,
  onToggle,
}) {
  return (
    <div
      className={
        `pu-report-item ${
          ativo
            ? "is-active"
            : ""
        } ${
          disabled
            ? "is-disabled"
            : ""
        }`
      }
    >
      <div className="pu-report-icon">
        <FiFileText />
      </div>

      <div className="pu-report-info">
        <strong>
          {relatorio.nome}
        </strong>
      </div>

      <TogglePermissao
        ativo={
          ativo
        }
        disabled={
          salvando ||
          disabled
        }
        ariaLabel={
          `${ativo ? "Bloquear" : "Liberar"} relatório ${relatorio.nome}`
        }
        onChange={
          () =>
            onToggle(
              relatorio.id,
            )
        }
      />
    </div>
  );
}


export default function PermissoesModal({
  usuario,

  telasPorModulo,

  permissoesTelas,

  permissoesRelatorios,

  relatoriosLiberados,

  relatoriosPorCategoria,

  resumo,

  salvando,

  onFechar,

  onObterStatusModulo,

  onDefinirModulo,

  onToggleTela,

  onToggleRelatorio,

  onMarcarTodosRelatorios,

  onDesmarcarTodosRelatorios,

  onSalvar,
}) {
  const [
    abaAtiva,
    setAbaAtiva,
  ] =
    useState(
      "telas",
    );


  useEffect(
    () => {
      if (
        usuario
      ) {
        setAbaAtiva(
          "telas",
        );
      }
    },
    [
      usuario,
    ],
  );


  const moduloRelatorios =
    useMemo(
      () =>
        telasPorModulo.find(
          (
            modulo,
          ) =>
            modulo.id ===
            "relatorios",
        ) ||
        null,
      [
        telasPorModulo,
      ],
    );


  const telaCentralRelatorios =
    useMemo(
      () =>
        moduloRelatorios
          ?.telas
          ?.find(
            (
              tela,
            ) =>
              tela.chave ===
              "relatorios",
          ) ||
        moduloRelatorios
          ?.telas
          ?.[0] ||
        null,
      [
        moduloRelatorios,
      ],
    );


  const modulosDeTelas =
    useMemo(
      () =>
        telasPorModulo.filter(
          (
            modulo,
          ) =>
            modulo.id !==
            "relatorios",
        ),
      [
        telasPorModulo,
      ],
    );


  const liberarTodasAsTelas =
    () => {
      for (
        const modulo of
        modulosDeTelas
      ) {
        onDefinirModulo(
          modulo,
          true,
        );
      }
    };


  const bloquearTodasAsTelas =
    () => {
      for (
        const modulo of
        modulosDeTelas
      ) {
        onDefinirModulo(
          modulo,
          false,
        );
      }
    };


  const alternarCentralRelatorios =
    () => {
      if (
        !telaCentralRelatorios
      ) {
        return;
      }

      onToggleTela(
        telaCentralRelatorios.id,
      );
    };


  if (
    !usuario
  ) {
    return null;
  }


  return (
    <div className="pu-overlay">

      <section
        className="pu-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pu-modal-title"
      >

        {/* =====================================================
            CABEÇALHO
        ===================================================== */}

        <header className="pu-header">

          <div className="pu-header-main">

            <div className="pu-header-icon">
              <FiSettings />
            </div>

            <div className="pu-header-text">

              <span className="pu-eyebrow">
                Controle de acesso
              </span>

              <h2 id="pu-modal-title">
                Permissões do usuário
              </h2>

              <p>
                {usuario.email}
              </p>

            </div>

          </div>


          <div className="pu-header-right">

            <div className="pu-header-stats">

              <div className="pu-stat">
                <span>
                  Telas
                </span>

                <strong>
                  {resumo.telasLiberadas}

                  <small>
                    /{resumo.totalTelas}
                  </small>
                </strong>
              </div>


              <div className="pu-stat">
                <span>
                  Relatórios
                </span>

                <strong>
                  {resumo.relatoriosPermitidos}

                  <small>
                    /{resumo.totalRelatorios}
                  </small>
                </strong>
              </div>

            </div>


            <button
              type="button"
              className="pu-close"
              disabled={
                salvando
              }
              onClick={
                onFechar
              }
              aria-label="Fechar"
            >
              <FiX />
            </button>

          </div>

        </header>


        {/* =====================================================
            ABAS
        ===================================================== */}

        <nav
          className="pu-tabs"
          aria-label="Tipos de permissões"
        >

          <button
            type="button"
            className={
              `pu-tab ${
                abaAtiva ===
                "telas"
                  ? "is-active"
                  : ""
              }`
            }
            onClick={
              () =>
                setAbaAtiva(
                  "telas",
                )
            }
          >
            <FiGrid />

            <span>
              Telas e módulos
            </span>

            <small>
              {resumo.telasLiberadas}/{resumo.totalTelas}
            </small>
          </button>


          <button
            type="button"
            className={
              `pu-tab ${
                abaAtiva ===
                "relatorios"
                  ? "is-active"
                  : ""
              }`
            }
            onClick={
              () =>
                setAbaAtiva(
                  "relatorios",
                )
            }
          >
            <FiFileText />

            <span>
              Relatórios
            </span>

            <small>
              {resumo.relatoriosPermitidos}/{resumo.totalRelatorios}
            </small>
          </button>

        </nav>


        {/* =====================================================
            CONTEÚDO
        ===================================================== */}

        <main className="pu-content">

          {abaAtiva ===
          "telas" ? (

            <div className="pu-tab-panel">

              <div className="pu-section-header">

                <div>
                  <h3>
                    Acessos ao sistema
                  </h3>

                  <p>
                    Escolha os módulos e telas que este usuário poderá acessar.
                  </p>
                </div>


                <div className="pu-bulk-actions">

                  <button
                    type="button"
                    className="pu-btn-secondary pu-btn-green"
                    disabled={
                      salvando
                    }
                    onClick={
                      liberarTodasAsTelas
                    }
                  >
                    <FiUnlock />

                    Liberar todas
                  </button>


                  <button
                    type="button"
                    className="pu-btn-secondary"
                    disabled={
                      salvando
                    }
                    onClick={
                      bloquearTodasAsTelas
                    }
                  >
                    <FiLock />

                    Bloquear todas
                  </button>

                </div>

              </div>


              <div className="pu-module-grid">

                {modulosDeTelas.map(
                  (
                    modulo,
                  ) => (

                    <ModuloCard
                      key={
                        modulo.id
                      }
                      modulo={
                        modulo
                      }
                      status={
                        onObterStatusModulo(
                          modulo,
                        )
                      }
                      permissoesTelas={
                        permissoesTelas
                      }
                      salvando={
                        salvando
                      }
                      onDefinirModulo={
                        onDefinirModulo
                      }
                      onToggleTela={
                        onToggleTela
                      }
                    />

                  ),
                )}

              </div>

            </div>

          ) : (

            <div className="pu-tab-panel">

              {/* ===============================================
                  CENTRAL DE RELATÓRIOS
              =============================================== */}

              <section
                className={
                  `pu-report-central ${
                    relatoriosLiberados
                      ? "is-active"
                      : ""
                  }`
                }
              >

                <div className="pu-report-central-icon">

                  {relatoriosLiberados
                    ? <FiUnlock />
                    : <FiLock />}

                </div>


                <div className="pu-report-central-info">

                  <span>
                    Acesso principal
                  </span>

                  <strong>
                    Central de Relatórios
                  </strong>

                  <p>
                    O usuário precisa deste acesso liberado para visualizar
                    qualquer relatório selecionado abaixo.
                  </p>

                </div>


                <div className="pu-report-central-control">

                  <span
                    className={
                      relatoriosLiberados
                        ? "is-active"
                        : ""
                    }
                  >
                    {relatoriosLiberados
                      ? "Liberada"
                      : "Bloqueada"}
                  </span>

                  <TogglePermissao
                    ativo={
                      relatoriosLiberados
                    }
                    disabled={
                      salvando ||
                      !telaCentralRelatorios
                    }
                    ariaLabel="Alterar acesso à Central de Relatórios"
                    onChange={
                      alternarCentralRelatorios
                    }
                  />

                </div>

              </section>


              <div className="pu-section-header pu-report-section-header">

                <div>
                  <h3>
                    Relatórios disponíveis
                  </h3>

                  <p>
                    Defina individualmente quais relatórios poderão ser consultados.
                  </p>
                </div>


                <div className="pu-bulk-actions">

                  <button
                    type="button"
                    className="pu-btn-secondary pu-btn-green"
                    disabled={
                      salvando ||
                      !relatoriosLiberados
                    }
                    onClick={
                      onMarcarTodosRelatorios
                    }
                  >
                    <FiUnlock />

                    Liberar todos
                  </button>


                  <button
                    type="button"
                    className="pu-btn-secondary"
                    disabled={
                      salvando ||
                      !relatoriosLiberados
                    }
                    onClick={
                      onDesmarcarTodosRelatorios
                    }
                  >
                    <FiLock />

                    Bloquear todos
                  </button>

                </div>

              </div>


              {!relatoriosLiberados && (
                <div className="pu-report-warning">
                  <FiLock />

                  <div>
                    <strong>
                      Central de Relatórios bloqueada
                    </strong>

                    <span>
                      Libere o acesso acima antes de configurar os relatórios.
                    </span>
                  </div>
                </div>
              )}


              <div
                className={
                  `pu-report-categories ${
                    !relatoriosLiberados
                      ? "is-disabled"
                      : ""
                  }`
                }
              >

                {Object.entries(
                  relatoriosPorCategoria,
                ).map(
                  ([
                    categoria,
                    relatorios,
                  ]) => {

                    const liberados =
                      relatorios.filter(
                        (
                          relatorio,
                        ) =>
                          Boolean(
                            permissoesRelatorios[
                              String(
                                relatorio.id,
                              )
                            ],
                          ),
                      ).length;


                    return (
                      <section
                        key={
                          categoria
                        }
                        className="pu-report-category"
                      >

                        <header className="pu-report-category-header">

                          <strong>
                            {categoria}
                          </strong>

                          <span>
                            {liberados}/{relatorios.length}
                          </span>

                        </header>


                        <div className="pu-report-grid">

                          {relatorios.map(
                            (
                              relatorio,
                            ) => (

                              <RelatorioItem
                                key={
                                  relatorio.id
                                }
                                relatorio={
                                  relatorio
                                }
                                ativo={
                                  Boolean(
                                    permissoesRelatorios[
                                      String(
                                        relatorio.id,
                                      )
                                    ],
                                  )
                                }
                                disabled={
                                  !relatoriosLiberados
                                }
                                salvando={
                                  salvando
                                }
                                onToggle={
                                  onToggleRelatorio
                                }
                              />

                            ),
                          )}

                        </div>

                      </section>
                    );
                  },
                )}

              </div>

            </div>

          )}

        </main>


        {/* =====================================================
            RODAPÉ
        ===================================================== */}

        <footer className="pu-footer">

          <div className="pu-footer-info">

            {abaAtiva ===
            "telas" ? (
              <>
                <strong>
                  {resumo.telasLiberadas}
                </strong>

                <span>
                  de {resumo.totalTelas} telas liberadas
                </span>
              </>
            ) : (
              <>
                <strong>
                  {resumo.relatoriosPermitidos}
                </strong>

                <span>
                  de {resumo.totalRelatorios} relatórios selecionados
                </span>
              </>
            )}

          </div>


          <div className="pu-footer-actions">

            <button
              type="button"
              className="pu-btn-cancel"
              disabled={
                salvando
              }
              onClick={
                onFechar
              }
            >
              Cancelar
            </button>


            <button
              type="button"
              className="pu-btn-save"
              disabled={
                salvando
              }
              onClick={
                onSalvar
              }
            >
              {salvando
                ? "Salvando..."
                : "Salvar permissões"}
            </button>

          </div>

        </footer>

      </section>

    </div>
  );
}