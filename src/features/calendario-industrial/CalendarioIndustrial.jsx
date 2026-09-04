import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { usePerfil } from "@/hooks/usePerfil";

import {
  listarCalendarioIndustrial,
  removerExcecaoCalendarioIndustrial,
  salvarExcecaoCalendarioIndustrial,
} from "./calendarioIndustrialService";

import CalendarioIndustrialModal from "./CalendarioIndustrialModal";

import "./CalendarioIndustrial.css";


/* =========================================================
   CONSTANTES
========================================================= */

const NOMES_MESES =
  Object.freeze([
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]);


const DIAS_SEMANA =
  Object.freeze([
    "Seg",
    "Ter",
    "Qua",
    "Qui",
    "Sex",
    "Sáb",
    "Dom",
  ]);


/* =========================================================
   UTILITÁRIOS DE DATA
========================================================= */

function formatarDataISO(
  data,
) {
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


  return `${ano}-${mes}-${dia}`;
}


function obterInicioMes(
  referencia,
) {
  return new Date(
    referencia.getFullYear(),
    referencia.getMonth(),
    1,
    12,
    0,
    0,
  );
}


function obterFimMes(
  referencia,
) {
  return new Date(
    referencia.getFullYear(),
    referencia.getMonth() + 1,
    0,
    12,
    0,
    0,
  );
}


function adicionarMeses(
  referencia,
  quantidade,
) {
  return new Date(
    referencia.getFullYear(),
    referencia.getMonth() + quantidade,
    1,
    12,
    0,
    0,
  );
}


function criarDiasGrade(
  referencia,
) {
  const primeiroDiaMes =
    obterInicioMes(
      referencia,
    );

  const ultimoDiaMes =
    obterFimMes(
      referencia,
    );


  const deslocamentoInicio =
    (
      primeiroDiaMes.getDay() +
      6
    ) % 7;


  const inicioGrade =
    new Date(
      primeiroDiaMes,
    );


  inicioGrade.setDate(
    primeiroDiaMes.getDate() -
      deslocamentoInicio,
  );


  const deslocamentoFim =
    (
      7 -
      (
        (
          ultimoDiaMes.getDay() +
          6
        ) % 7
      ) -
      1
    ) % 7;


  const fimGrade =
    new Date(
      ultimoDiaMes,
    );


  fimGrade.setDate(
    ultimoDiaMes.getDate() +
      deslocamentoFim,
  );


  const dias = [];


  const atual =
    new Date(
      inicioGrade,
    );


  while (
    atual <= fimGrade
  ) {
    dias.push(
      new Date(
        atual,
      ),
    );


    atual.setDate(
      atual.getDate() + 1,
    );
  }


  return dias;
}


function formatarHoras(
  minutos,
) {
  const total =
    Number(
      minutos ?? 0,
    );


  if (
    !Number.isFinite(
      total,
    ) ||
    total <= 0
  ) {
    return "0h";
  }


  const horas =
    Math.floor(
      total / 60,
    );

  const minutosRestantes =
    total % 60;


  if (
    minutosRestantes === 0
  ) {
    return `${horas}h`;
  }


  return `${horas}h${String(
    minutosRestantes,
  ).padStart(
    2,
    "0",
  )}`;
}


function obterClassePerfil(
  perfilCodigo,
) {
  const codigo =
    String(
      perfilCodigo ?? "",
    ).trim();


  switch (codigo) {
    case "5H":
      return "cinco-horas";

    case "17H":
      return "dezessete-horas";

    case "22H":
      return "vinte-duas-horas";

    case "24H":
      return "vinte-quatro-horas";

    case "SEM_PRODUCAO":
      return "sem-producao";

    case "PERSONALIZADO":
      return "personalizado";

    default:
      return "padrao";
  }
}


/* =========================================================
   COMPONENTE
========================================================= */

export default function CalendarioIndustrial({
  onSelecionarData,
}) {
  const {
    isAdmin,
  } =
    usePerfil();


  const hoje =
    useMemo(
      () =>
        new Date(),
      [],
    );


  const hojeISO =
    useMemo(
      () =>
        formatarDataISO(
          hoje,
        ),
      [
        hoje,
      ],
    );


  const [
    mesReferencia,
    setMesReferencia,
  ] = useState(
    () =>
      obterInicioMes(
        hoje,
      ),
  );


  const [
    diasCalendario,
    setDiasCalendario,
  ] = useState([]);


  const [
    carregando,
    setCarregando,
  ] = useState(false);


  const [
    erro,
    setErro,
  ] = useState("");


  const [
    dataSelecionada,
    setDataSelecionada,
  ] = useState(
    hojeISO,
  );


  const [
    diaEditando,
    setDiaEditando,
  ] = useState(
    null,
  );


  const [
    salvando,
    setSalvando,
  ] = useState(false);


  const [
    erroModal,
    setErroModal,
  ] = useState("");


  /* =======================================================
     GRADE
  ======================================================= */

  const diasGrade =
    useMemo(
      () =>
        criarDiasGrade(
          mesReferencia,
        ),
      [
        mesReferencia,
      ],
    );


  const periodoConsulta =
    useMemo(
      () => {
        if (
          diasGrade.length ===
          0
        ) {
          return {
            dataInicio:
              "",

            dataFim:
              "",
          };
        }


        return {
          dataInicio:
            formatarDataISO(
              diasGrade[0],
            ),

          dataFim:
            formatarDataISO(
              diasGrade[
                diasGrade.length -
                  1
              ],
            ),
        };
      },
      [
        diasGrade,
      ],
    );


  const calendarioPorData =
    useMemo(
      () =>
        new Map(
          diasCalendario.map(
            (
              item,
            ) => [
              item.data,
              item,
            ],
          ),
        ),
      [
        diasCalendario,
      ],
    );


  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregarCalendario =
    useCallback(
      async () => {
        if (
          !periodoConsulta
            .dataInicio ||
          !periodoConsulta
            .dataFim
        ) {
          return;
        }


        setCarregando(
          true,
        );

        setErro(
          "",
        );


        try {
          const resultado =
            await listarCalendarioIndustrial({
              dataInicio:
                periodoConsulta
                  .dataInicio,

              dataFim:
                periodoConsulta
                  .dataFim,
            });


          setDiasCalendario(
            resultado,
          );
        } catch (error) {
          console.error(
            "Erro ao carregar calendário industrial:",
            error,
          );


          setDiasCalendario(
            [],
          );


          setErro(
            error?.message ||
              "Não foi possível carregar o calendário industrial.",
          );
        } finally {
          setCarregando(
            false,
          );
        }
      },
      [
        periodoConsulta
          .dataFim,
        periodoConsulta
          .dataInicio,
      ],
    );


  useEffect(
    () => {
      void carregarCalendario();
    },
    [
      carregarCalendario,
    ],
  );


  /* =======================================================
     SELECIONAR DIA
  ======================================================= */

  function selecionarDia(
    data,
  ) {
    const dataISO =
      formatarDataISO(
        data,
      );


    const configuracao =
      calendarioPorData.get(
        dataISO,
      );


    setDataSelecionada(
      dataISO,
    );


    if (
      typeof onSelecionarData ===
      "function"
    ) {
      onSelecionarData(
        dataISO,
      );
    }


    if (
      isAdmin &&
      configuracao
    ) {
      setErroModal(
        "",
      );


      setDiaEditando(
        configuracao,
      );
    }
  }


  /* =======================================================
     SALVAR EXCEÇÃO
  ======================================================= */

  async function salvarAlteracao(
    valores,
  ) {
    if (
      salvando
    ) {
      return;
    }


    setSalvando(
      true,
    );

    setErroModal(
      "",
    );


    try {
      await salvarExcecaoCalendarioIndustrial(
        valores,
      );


      await carregarCalendario();


      setDiaEditando(
        null,
      );
    } catch (error) {
      console.error(
        "Erro ao salvar calendário industrial:",
        error,
      );


      setErroModal(
        error?.message ||
          "Não foi possível salvar a alteração.",
      );
    } finally {
      setSalvando(
        false,
      );
    }
  }


  /* =======================================================
     RESTAURAR REGRA SEMANAL
  ======================================================= */

  async function restaurarRegraSemanal(
    data,
  ) {
    if (
      salvando
    ) {
      return;
    }


    setSalvando(
      true,
    );

    setErroModal(
      "",
    );


    try {
      await removerExcecaoCalendarioIndustrial(
        data,
      );


      await carregarCalendario();


      setDiaEditando(
        null,
      );
    } catch (error) {
      console.error(
        "Erro ao restaurar calendário industrial:",
        error,
      );


      setErroModal(
        error?.message ||
          "Não foi possível restaurar a regra semanal.",
      );
    } finally {
      setSalvando(
        false,
      );
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>

      <section className="calendario-industrial">

        <div className="calendario-industrial-header">

          <div className="calendario-industrial-titulo">

            <div className="calendario-industrial-icone">

              <CalendarDays
                size={20}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>


            <div>

              <span>
                Programação
              </span>

              <h3>
                Calendário Industrial
              </h3>

              <p>
                Disponibilidade oficial
                de produção definida
                no banco.
              </p>

            </div>

          </div>


          <div className="calendario-industrial-header-acoes">

            {isAdmin && (

              <span className="calendario-industrial-admin">

                <ShieldCheck
                  size={14}
                  strokeWidth={2}
                />

                Administrador

              </span>

            )}


            <button
              type="button"
              className="calendario-industrial-atualizar"
              onClick={
                carregarCalendario
              }
              disabled={
                carregando
              }
            >

              <RefreshCw
                size={15}
                strokeWidth={2}
                className={
                  carregando
                    ? "girando"
                    : ""
                }
              />

              Atualizar

            </button>

          </div>

        </div>


        <div className="calendario-industrial-controles">

          <button
            type="button"
            className="calendario-industrial-navegar"
            onClick={
              () =>
                setMesReferencia(
                  (
                    atual,
                  ) =>
                    adicionarMeses(
                      atual,
                      -1,
                    ),
                )
            }
            aria-label="Mês anterior"
          >

            <ChevronLeft
              size={18}
            />

          </button>


          <strong>

            {
              NOMES_MESES[
                mesReferencia
                  .getMonth()
              ]
            }

            {" "}

            {
              mesReferencia
                .getFullYear()
            }

          </strong>


          <button
            type="button"
            className="calendario-industrial-navegar"
            onClick={
              () =>
                setMesReferencia(
                  (
                    atual,
                  ) =>
                    adicionarMeses(
                      atual,
                      1,
                    ),
                )
            }
            aria-label="Próximo mês"
          >

            <ChevronRight
              size={18}
            />

          </button>

        </div>


        {erro && (

          <div className="calendario-industrial-erro">

            <AlertTriangle
              size={17}
            />

            <span>
              {erro}
            </span>

          </div>

        )}


        <div className="calendario-industrial-grade">

          {DIAS_SEMANA.map(
            (
              dia,
            ) => (

              <div
                key={
                  dia
                }
                className="calendario-industrial-dia-semana"
              >

                {dia}

              </div>

            ),
          )}


          {diasGrade.map(
            (
              data,
            ) => {
              const dataISO =
                formatarDataISO(
                  data,
                );


              const configuracao =
                calendarioPorData.get(
                  dataISO,
                );


              const foraMes =
                data.getMonth() !==
                mesReferencia
                  .getMonth();


              const hojeDia =
                dataISO ===
                hojeISO;


              const selecionado =
                dataISO ===
                dataSelecionada;


              const classePerfil =
                obterClassePerfil(
                  configuracao
                    ?.perfilCodigo,
                );


              return (
                <button
                  key={
                    dataISO
                  }
                  type="button"
                  className={[
                    "calendario-industrial-dia",

                    classePerfil,

                    foraMes
                      ? "fora-mes"
                      : "",

                    hojeDia
                      ? "hoje"
                      : "",

                    selecionado
                      ? "selecionado"
                      : "",

                    isAdmin
                      ? "editavel"
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
                      selecionarDia(
                        data,
                      )
                  }
                >

                  <div className="calendario-industrial-dia-topo">

                    <strong>
                      {
                        data.getDate()
                      }
                    </strong>


                    {configuracao
                      ?.origem ===
                      "EXCECAO" && (

                      <span>
                        Exceção
                      </span>

                    )}

                  </div>


                  <div className="calendario-industrial-dia-horas">

                    {carregando
                      ? "..."
                      : formatarHoras(
                          configuracao
                            ?.minutosProgramados,
                        )}

                  </div>


                  <small>

                    {configuracao
                      ?.perfilNome ||
                      "Sem configuração"}

                  </small>


                  {configuracao
                    ?.observacao && (

                    <p>
                      {
                        configuracao
                          .observacao
                      }
                    </p>

                  )}

                </button>
              );
            },
          )}

        </div>


        <div className="calendario-industrial-legenda">

          <span>
            <i className="cinco-horas" />
            5h
          </span>

          <span>
            <i className="dezessete-horas" />
            17h
          </span>

          <span>
            <i className="vinte-duas-horas" />
            22h
          </span>

          <span>
            <i className="vinte-quatro-horas" />
            24h
          </span>

          <span>
            <i className="sem-producao" />
            Sem produção
          </span>

          <span>
            <i className="personalizado" />
            Personalizado
          </span>

        </div>


        {isAdmin && (

          <p className="calendario-industrial-admin-aviso">

            Como administrador,
            clique em qualquer dia
            para alterar a disponibilidade.
            A alteração será salva
            como exceção e não modificará
            a regra semanal dos demais dias.

          </p>

        )}

      </section>


      <CalendarioIndustrialModal
        aberto={
          Boolean(
            diaEditando,
          )
        }
        dia={
          diaEditando
        }
        salvando={
          salvando
        }
        erro={
          erroModal
        }
        onFechar={
          () => {
            if (
              !salvando
            ) {
              setDiaEditando(
                null,
              );

              setErroModal(
                "",
              );
            }
          }
        }
        onSalvar={
          salvarAlteracao
        }
        onRestaurar={
          restaurarRegraSemanal
        }
      />

    </>
  );
}