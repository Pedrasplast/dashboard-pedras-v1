import {
  CalendarDays,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";


/* =========================================================
   OPÇÕES DISPONÍVEIS
========================================================= */

const OPCOES_DISPONIBILIDADE =
  Object.freeze([
    {
      codigo:
        "SEM_PRODUCAO",

      titulo:
        "Sem produção",

      descricao:
        "A fábrica não terá horas produtivas neste dia.",

      horas:
        "0h",
    },

    {
      codigo:
        "5H",

      titulo:
        "5 horas",

      descricao:
        "Utiliza a jornada equivalente ao Turno III.",

      horas:
        "5h",
    },

    {
      codigo:
        "17H",

      titulo:
        "17 horas",

      descricao:
        "Utiliza Turno I + Turno II.",

      horas:
        "17h",
    },

    {
      codigo:
        "22H",

      titulo:
        "22 horas",

      descricao:
        "Utiliza Turnos I + II + III.",

      horas:
        "22h",
    },

    {
      codigo:
        "24H",

      titulo:
        "24 horas",

      descricao:
        "Máquina trabalhando continuamente durante 24 horas.",

      horas:
        "24h",
    },
  ]);


/* =========================================================
   FORMATAR DATA
========================================================= */

function formatarDataVisual(
  valor,
) {
  if (
    !valor ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      valor,
    )
  ) {
    return "";
  }


  const [
    ano,
    mes,
    dia,
  ] =
    valor
      .split("-")
      .map(Number);


  const data =
    new Date(
      ano,
      mes - 1,
      dia,
      12,
      0,
      0,
    );


  return data.toLocaleDateString(
    "pt-BR",
    {
      weekday:
        "long",

      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",
    },
  );
}


/* =========================================================
   MODAL
========================================================= */

export default function CalendarioIndustrialModal({
  aberto,
  dia,
  salvando,
  erro,
  onFechar,
  onSalvar,
  onRestaurar,
}) {
  const [
    perfilCodigo,
    setPerfilCodigo,
  ] = useState(
    "22H",
  );


  const [
    observacao,
    setObservacao,
  ] = useState(
    "",
  );


  useEffect(
    () => {
      if (
        !aberto ||
        !dia
      ) {
        return;
      }


      setPerfilCodigo(
        dia.perfilCodigo ||
          "22H",
      );


      setObservacao(
        dia.observacao ||
          "",
      );
    },
    [
      aberto,
      dia,
    ],
  );


  const dataVisual =
    useMemo(
      () =>
        formatarDataVisual(
          dia?.data,
        ),
      [
        dia?.data,
      ],
    );


  const possuiExcecao =
    dia?.origem ===
    "EXCECAO";


  if (!aberto) {
    return null;
  }


  function enviarFormulario(
    event,
  ) {
    event.preventDefault();


    if (
      salvando ||
      !dia
    ) {
      return;
    }


    onSalvar?.({
      data:
        dia.data,

      perfilCodigo,

      observacao,
    });
  }


  return (
    <div
      className="calendario-industrial-modal-backdrop"
      role="presentation"
      onMouseDown={
        (event) => {
          if (
            event.target ===
            event.currentTarget &&
            !salvando
          ) {
            onFechar?.();
          }
        }
      }
    >

      <div
        className="calendario-industrial-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendario-industrial-modal-titulo"
      >

        <div className="calendario-industrial-modal-header">

          <div className="calendario-industrial-modal-header-info">

            <div className="calendario-industrial-modal-header-icone">

              <CalendarDays
                size={20}
                strokeWidth={2}
              />

            </div>


            <div>

              <span>
                Calendário Industrial
              </span>

              <h3 id="calendario-industrial-modal-titulo">
                Alterar disponibilidade
              </h3>

              <p>
                {dataVisual}
              </p>

            </div>

          </div>


          <button
            type="button"
            className="calendario-industrial-modal-fechar"
            onClick={
              onFechar
            }
            disabled={
              salvando
            }
            aria-label="Fechar"
          >

            <X
              size={18}
            />

          </button>

        </div>


        <form
          onSubmit={
            enviarFormulario
          }
        >

          <div className="calendario-industrial-modal-corpo">

            <div className="calendario-industrial-modal-regra-atual">

              <span>
                Regra atual
              </span>

              <strong>
                {
                  dia?.perfilNome ||
                  "Sem configuração"
                }
              </strong>

              <small>

                {possuiExcecao
                  ? "Este dia possui uma exceção cadastrada."
                  : "Este dia está usando a regra semanal padrão."}

              </small>

            </div>


            <div className="calendario-industrial-modal-campo">

              <label>
                Disponibilidade do dia
              </label>


              <div className="calendario-industrial-modal-opcoes">

                {OPCOES_DISPONIBILIDADE.map(
                  (
                    opcao,
                  ) => {
                    const selecionada =
                      perfilCodigo ===
                      opcao.codigo;


                    return (
                      <button
                        key={
                          opcao.codigo
                        }
                        type="button"
                        className={[
                          "calendario-industrial-modal-opcao",

                          selecionada
                            ? "selecionada"
                            : "",
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            " ",
                          )}
                        onClick={
                          () =>
                            setPerfilCodigo(
                              opcao.codigo,
                            )
                        }
                        disabled={
                          salvando
                        }
                      >

                        <div>

                          <strong>
                            {opcao.titulo}
                          </strong>

                          <small>
                            {opcao.descricao}
                          </small>

                        </div>


                        <span>
                          {opcao.horas}
                        </span>

                      </button>
                    );
                  },
                )}

              </div>

            </div>


            <div className="calendario-industrial-modal-campo">

              <label htmlFor="calendario-industrial-observacao">
                Observação
              </label>


              <textarea
                id="calendario-industrial-observacao"
                value={
                  observacao
                }
                onChange={
                  (event) =>
                    setObservacao(
                      event.target.value,
                    )
                }
                placeholder="Ex.: feriado, manutenção, produção especial..."
                rows={3}
                maxLength={300}
                disabled={
                  salvando
                }
              />


              <small className="calendario-industrial-modal-contador">

                {
                  observacao.length
                }

                /300

              </small>

            </div>


            {erro && (

              <div className="calendario-industrial-modal-erro">

                {erro}

              </div>

            )}

          </div>


          <div className="calendario-industrial-modal-footer">

            <div>

              {possuiExcecao && (

                <button
                  type="button"
                  className="calendario-industrial-modal-restaurar"
                  onClick={
                    () =>
                      onRestaurar?.(
                        dia.data,
                      )
                  }
                  disabled={
                    salvando
                  }
                >

                  <RotateCcw
                    size={15}
                  />

                  Restaurar regra semanal

                </button>

              )}

            </div>


            <div className="calendario-industrial-modal-footer-acoes">

              <button
                type="button"
                className="calendario-industrial-modal-cancelar"
                onClick={
                  onFechar
                }
                disabled={
                  salvando
                }
              >

                Cancelar

              </button>


              <button
                type="submit"
                className="calendario-industrial-modal-salvar"
                disabled={
                  salvando
                }
              >

                <Save
                  size={15}
                />

                {salvando
                  ? "Salvando..."
                  : "Salvar alteração"}

              </button>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}