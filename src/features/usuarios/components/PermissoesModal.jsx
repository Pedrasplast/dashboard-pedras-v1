import {
  FiFileText,
  FiSettings,
  FiX,
} from "react-icons/fi";


function SwitchPermissao({
  marcado,
  onChange,
  disabled,
  tipo = "tela",
}) {
  return (
    <span
      className={
        tipo ===
        "relatorio"
          ? "permissao-switch permissao-switch-relatorio"
          : "permissao-switch"
      }
    >

      <input
        type="checkbox"
        checked={
          marcado
        }
        onChange={
          onChange
        }
        disabled={
          disabled
        }
      />


      <span
        className="permissao-switch-trilho"
        aria-hidden="true"
      >
        <span />
      </span>

    </span>
  );
}


function RelatoriosDentroModulo({
  relatoriosPorCategoria,
  permissoesRelatorios,
  salvando,
  onToggleRelatorio,
  onMarcarTodos,
  onDesmarcarTodos,
}) {
  return (
    <div className="bloco-permissoes-relatorios bloco-relatorios-dentro-modulo bloco-relatorios-v2">

      <div className="cabecalho-permissoes-relatorios">

        <div>

          <div className="titulo-relatorios-permissoes">

            <FiFileText />

            Relatórios permitidos

          </div>


          <p>
            Libere somente os relatórios que este usuário
            realmente precisa consultar.
          </p>

        </div>


        <div className="acoes-relatorios-permissoes">

          <button
            type="button"
            className="acao-permissao-liberar"
            onClick={
              onMarcarTodos
            }
            disabled={
              salvando
            }
          >
            Liberar todos
          </button>


          <button
            type="button"
            className="acao-permissao-bloquear"
            onClick={
              onDesmarcarTodos
            }
            disabled={
              salvando
            }
          >
            Bloquear todos
          </button>

        </div>

      </div>


      <div className="relatorios-permissoes-grid">

        {Object.entries(
          relatoriosPorCategoria,
        ).map(
          ([
            categoria,
            itens,
          ]) => {

            const permitidos =
              itens.filter(
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
              <div
                key={
                  categoria
                }
                className="grupo-relatorios-permissoes grupo-relatorios-permissoes-v2"
              >

                <div className="categoria-relatorios-permissoes">

                  <span>
                    {categoria}
                  </span>

                  <small>
                    {permitidos}/{itens.length}
                  </small>

                </div>


                <div className="grupo-relatorios-itens">

                  {itens.map(
                    (
                      relatorio,
                    ) => {

                      const marcado =
                        Boolean(
                          permissoesRelatorios[
                            String(
                              relatorio.id,
                            )
                          ],
                        );


                      return (
                        <label
                          key={
                            relatorio.id
                          }
                          className={
                            `item-permissao item-permissao-relatorio item-permissao-v2 ${
                              marcado
                                ? "ativo"
                                : ""
                            }`
                          }
                        >

                          <div className="item-permissao-info">

                            <strong>
                              {relatorio.nome}
                            </strong>

                          </div>


                          <SwitchPermissao
                            marcado={
                              marcado
                            }
                            disabled={
                              salvando
                            }
                            tipo="relatorio"
                            onChange={
                              () =>
                                onToggleRelatorio(
                                  relatorio.id,
                                )
                            }
                          />

                        </label>
                      );
                    },
                  )}

                </div>

              </div>
            );
          },
        )}

      </div>

    </div>
  );
}


function ModuloPermissaoCard({
  modulo,
  status,
  permissoesTelas,
  relatoriosLiberados,
  relatoriosPorCategoria,
  permissoesRelatorios,
  salvando,
  onDefinirModulo,
  onToggleTela,
  onToggleRelatorio,
  onMarcarTodosRelatorios,
  onDesmarcarTodosRelatorios,
}) {
  const classeCard =
    [
      "permissao-modulo-card",
      "permissao-modulo-card-v2",

      modulo.id ===
        "relatorios"
        ? "permissao-modulo-card-relatorios"
        : "",

      status.completo
        ? "ativo"
        : status.parcial
          ? "parcial"
          : "",
    ]
      .filter(
        Boolean,
      )
      .join(
        " ",
      );


  const classeStatus =
    [
      "permissao-modulo-status",

      status.completo
        ? "completo"
        : status.parcial
          ? "parcial"
          : "bloqueado",
    ].join(
      " ",
    );


  return (
    <section className={classeCard}>

      <div className="permissao-modulo-header">

        <div className="permissao-modulo-titulo">

          <div className="permissao-modulo-titulo-linha">

            <strong>
              {modulo.nome}
            </strong>


            <span className={classeStatus}>

              {status.completo
                ? "Liberado"
                : status.parcial
                  ? "Parcial"
                  : "Bloqueado"}

            </span>

          </div>


          <span>
            {modulo.descricao}
          </span>

        </div>


        <div className="permissao-modulo-acoes">

          <span className="permissao-modulo-contador">
            {status.permitidas}/{status.total}
          </span>


          <button
            type="button"
            className={
              status.completo
                ? "btn-modulo-bloquear"
                : "btn-modulo-liberar"
            }
            onClick={
              () =>
                onDefinirModulo(
                  modulo,
                  !status.completo,
                )
            }
            disabled={
              salvando
            }
          >
            {status.completo
              ? "Bloquear"
              : "Liberar módulo"}
          </button>

        </div>

      </div>


      <div className="permissao-modulo-telas">

        {modulo.telas.map(
          (
            tela,
          ) => {

            const marcado =
              Boolean(
                permissoesTelas[
                  String(
                    tela.id,
                  )
                ],
              );


            return (
              <label
                key={
                  tela.id
                }
                className={
                  `item-permissao item-permissao-modulo item-permissao-v2 ${
                    marcado
                      ? "ativo"
                      : ""
                  }`
                }
              >

                <div className="item-permissao-info">

                  <strong>
                    {tela.nome}
                  </strong>

                  <span>
                    {tela.rota}
                  </span>

                </div>


                <SwitchPermissao
                  marcado={
                    marcado
                  }
                  disabled={
                    salvando
                  }
                  onChange={
                    () =>
                      onToggleTela(
                        tela.id,
                      )
                  }
                />

              </label>
            );
          },
        )}

      </div>


      {modulo.id ===
        "relatorios" &&
        relatoriosLiberados && (

          <RelatoriosDentroModulo
            relatoriosPorCategoria={
              relatoriosPorCategoria
            }
            permissoesRelatorios={
              permissoesRelatorios
            }
            salvando={
              salvando
            }
            onToggleRelatorio={
              onToggleRelatorio
            }
            onMarcarTodos={
              onMarcarTodosRelatorios
            }
            onDesmarcarTodos={
              onDesmarcarTodosRelatorios
            }
          />

        )}

    </section>
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
  onMarcarTodasTelas,
  onDesmarcarTodasTelas,
  onObterStatusModulo,
  onDefinirModulo,
  onToggleTela,
  onToggleRelatorio,
  onMarcarTodosRelatorios,
  onDesmarcarTodosRelatorios,
  onSalvar,
}) {
  if (
    !usuario
  ) {
    return null;
  }


  return (
    <div className="modal-overlay modal-overlay-permissoes">

      <div
        className="modal-content modal-permissoes modal-permissoes-v2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-permissoes"
      >

        <div className="modal-permissoes-header modal-permissoes-header-v2">

          <div className="modal-permissoes-header-principal">

            <div className="modal-permissoes-icon">
              <FiSettings />
            </div>


            <div className="modal-permissoes-identificacao">

              <span className="modal-permissoes-eyebrow">
                Controle de acesso
              </span>

              <h3 id="titulo-modal-permissoes">
                Permissões do usuário
              </h3>

              <p>
                {usuario.email}
              </p>

            </div>

          </div>


          <button
            type="button"
            className="modal-permissoes-fechar"
            onClick={
              onFechar
            }
            disabled={
              salvando
            }
            aria-label="Fechar permissões"
          >
            <FiX />
          </button>

        </div>


        <div className="modal-permissoes-resumo">

          <div className="modal-permissoes-resumo-card">

            <span>
              Acessos liberados
            </span>

            <strong>
              {resumo.telasLiberadas}

              <small>
                /{resumo.totalTelas}
              </small>
            </strong>

            <p>
              Telas e módulos do sistema
            </p>

          </div>


          <div className="modal-permissoes-resumo-card">

            <span>
              Relatórios liberados
            </span>

            <strong>
              {resumo.relatoriosPermitidos}

              <small>
                /{resumo.totalRelatorios}
              </small>
            </strong>

            <p>
              Permissões individuais de relatório
            </p>

          </div>


          <div
            className={
              `modal-permissoes-resumo-card ${
                relatoriosLiberados
                  ? "resumo-liberado"
                  : "resumo-bloqueado"
              }`
            }
          >

            <span>
              Central de relatórios
            </span>

            <strong className="modal-permissoes-resumo-status">
              {relatoriosLiberados
                ? "Liberada"
                : "Bloqueada"}
            </strong>

            <p>
              {relatoriosLiberados
                ? "Escolha os relatórios abaixo"
                : "Libere o módulo Relatórios para configurar"}
            </p>

          </div>

        </div>


        <div className="acoes-permissoes-rapidas acoes-permissoes-rapidas-v2">

          <div>

            <strong>
              Ações rápidas
            </strong>

            <span>
              Aplique uma regra geral e ajuste os itens individualmente.
            </span>

          </div>


          <div className="acoes-permissoes-rapidas-botoes">

            <button
              type="button"
              className="acao-permissao-liberar"
              onClick={
                onMarcarTodasTelas
              }
              disabled={
                salvando
              }
            >
              Liberar todos os acessos
            </button>


            <button
              type="button"
              className="acao-permissao-bloquear"
              onClick={
                onDesmarcarTodasTelas
              }
              disabled={
                salvando
              }
            >
              Bloquear todos
            </button>

          </div>

        </div>


        <div className="lista-permissoes lista-permissoes-v2">

          <div className="titulo-grupo-permissoes titulo-grupo-permissoes-v2">

            <div>

              <strong>
                Acesso por módulo
              </strong>

              <span>
                Clique no módulo inteiro ou escolha cada tela separadamente.
              </span>

            </div>

          </div>


          <div className="permissoes-modulos-lista permissoes-modulos-grid">

            {telasPorModulo.map(
              (
                modulo,
              ) => (

                <ModuloPermissaoCard
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
                  relatoriosLiberados={
                    relatoriosLiberados
                  }
                  relatoriosPorCategoria={
                    relatoriosPorCategoria
                  }
                  permissoesRelatorios={
                    permissoesRelatorios
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
                  onToggleRelatorio={
                    onToggleRelatorio
                  }
                  onMarcarTodosRelatorios={
                    onMarcarTodosRelatorios
                  }
                  onDesmarcarTodosRelatorios={
                    onDesmarcarTodosRelatorios
                  }
                />

              ),
            )}

          </div>

        </div>


        <div className="modal-actions modal-permissoes-actions-v2">

          <div className="modal-permissoes-actions-info">

            <strong>
              {resumo.telasLiberadas}
            </strong>

            <span>
              acesso(s) selecionado(s)
            </span>

          </div>


          <div className="modal-permissoes-actions-botoes">

            <button
              type="button"
              className="btn-modal-cancelar"
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
              className="btn-modal-salvar-permissoes"
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

        </div>

      </div>

    </div>
  );
}