import React, {
  useMemo,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiFileText,
  FiDownload,
  FiChevronRight,
  FiEye,
  FiX,
} from "react-icons/fi";

import {
  useCargaMaquina,
  useDescricoesProdutos,
  normalizarCodigoProduto,
} from "@/lib/cargaMaquina";

import FiltrosDashboard
  from "@/features/dashboard/FiltrosDashboard";

import {
  RELATORIOS,
} from "./config/Relatorio.config";

import {
  obterDataDoRegistro,
} from "./utils/Data";

import {
  gerarPdfRelatorio,
} from "./exportacao/GerarPDF";

import {
  gerarExcelRelatorio,
} from "./exportacao/GerarExcel";

import "./TelaRelatorios.css";


/* =====================================================
   ESTADO INICIAL DOS FILTROS
===================================================== */

const criarFiltrosIniciais = () => ({
  dataInicio: "",
  dataFim: "",
  injetora: "Todos",
  cod_prod: "Todos",
  mp: "Todos",
  tipo: [],
  status: "todos",
});


/* =====================================================
   TÍTULOS DA VISUALIZAÇÃO
===================================================== */

const TITULOS_COLUNAS_VISUALIZACAO = {
  data: "Data",

  injetora: "Injetora",

  produto: "Produto",

  descricao_produto:
    "Descrição do Produto",

  mp: "Matéria-Prima",

  tipo: "Tipo",

  conforme: "Conforme",

  danificada: "Danificada",

  total_produzido:
    "Total Produzido",

  duracao: "Duração",

  produtividade_hora:
    "UN/H",

  qualidade:
    "Qualidade",

  motivo:
    "Motivo",

  ocorrencias:
    "Ocorrências",

  tempo_total:
    "Tempo Total",

  tempo_medio:
    "Tempo Médio",

  percentual_impacto:
    "Percentual Impacto",

  op:
    "OP",

  descricao:
    "Descrição",

  quantidade_mp:
    "Qtd. MP",

  peso_unitario:
    "Peso Unitário",

  consumo_total:
    "Consumo Total",

  gasto_unidade:
    "Gasto por Unidade",
};


/* =====================================================
   COLUNAS NUMÉRICAS
===================================================== */

const COLUNAS_NUMERICAS =
  new Set([
    "conforme",
    "danificada",
    "total_produzido",

    "produtividade_hora",
    "qualidade",

    "ocorrencias",
    "tempo_total",
    "tempo_medio",
    "percentual_impacto",

    "quantidade_mp",
    "peso_unitario",
    "consumo_total",
    "gasto_unidade",
  ]);


/* =====================================================
   CONVERSÃO NUMÉRICA
===================================================== */

const converterNumeroVisualizacao = (
  valor,
) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  if (
    typeof valor ===
    "number"
  ) {
    return Number.isFinite(
      valor,
    )
      ? valor
      : 0;
  }

  let texto =
    String(valor)
      .trim()
      .replace(
        /\s/g,
        "",
      );

  if (
    texto.includes(",") &&
    texto.includes(".")
  ) {
    texto =
      texto
        .replace(
          /\./g,
          "",
        )
        .replace(
          ",",
          ".",
        );
  } else {
    texto =
      texto.replace(
        ",",
        ".",
      );
  }

  const numero =
    Number(
      texto,
    );

  return Number.isFinite(
    numero,
  )
    ? numero
    : 0;
};


/* =====================================================
   DATA DA VISUALIZAÇÃO
===================================================== */

const formatarDataVisualizacao = (
  valor,
) => {
  if (!valor) {
    return "-";
  }

  const texto =
    String(
      valor,
    ).trim();

  const correspondencia =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (
    correspondencia
  ) {
    return [
      correspondencia[3],
      correspondencia[2],
      correspondencia[1],
    ].join("/");
  }

  return texto;
};


/* =====================================================
   TEMPO COM SEPARADOR DE MILHAR NAS HORAS
===================================================== */

const formatarTempoComMilhar = (
  valor,
) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "-";
  }

  const texto =
    String(
      valor,
    ).trim();

  const partes =
    texto.split(":");

  if (
    partes.length <
    2
  ) {
    return texto;
  }

  const horas =
    Number(
      partes[0],
    );

  if (
    !Number.isFinite(
      horas,
    )
  ) {
    return texto;
  }

  const horasFormatadas =
    horas.toLocaleString(
      "pt-BR",
      {
        maximumFractionDigits:
          0,
      },
    );

  return [
    horasFormatadas,
    ...partes.slice(1),
  ].join(":");
};


/* =====================================================
   TÍTULO AUTOMÁTICO PARA COLUNAS FUTURAS
===================================================== */

const criarTituloAutomatico = (
  chave,
) => {
  return String(
    chave ||
      "",
  )
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        letra,
      ) =>
        letra.toUpperCase(),
    );
};


/* =====================================================
   FORMATAÇÃO DOS VALORES DA VISUALIZAÇÃO
===================================================== */

const obterValorVisualizacao = (
  item,
  chave,
) => {
  switch (chave) {

    /* =================================================
       DATA
    ================================================= */

    case "data":
      return formatarDataVisualizacao(
        item.inicio_dia ||
          item.inicio ||
          item.data,
      );


    /* =================================================
       TEXTO
    ================================================= */

    case "injetora":
      return (
        item.injetora ||
        "-"
      );


    case "produto":
      return (
        item.cod_prod ||
        item.produto ||
        "-"
      );


    case "descricao_produto":
      return (
        item.descricao_produto ||
        "-"
      );


    case "mp":
      return (
        item.mp ||
        item.materia_prima ||
        "-"
      );


    case "tipo":
      return (
        item.tipo ||
        "-"
      );


    case "motivo":
      return (
        item.motivo ||
        item.descricao ||
        item.justificativa ||
        "-"
      );


    /* =================================================
       PRODUÇÃO
    ================================================= */

    case "conforme":
      return converterNumeroVisualizacao(
        item.conforme,
      ).toLocaleString(
        "pt-BR",
        {
          maximumFractionDigits:
            2,
        },
      );


    case "danificada":
      return converterNumeroVisualizacao(
        item.danificada,
      ).toLocaleString(
        "pt-BR",
        {
          maximumFractionDigits:
            2,
        },
      );


    case "total_produzido":
      return converterNumeroVisualizacao(
        item.total_produzido,
      ).toLocaleString(
        "pt-BR",
        {
          maximumFractionDigits:
            2,
        },
      );


    /* =================================================
       DURAÇÃO
    ================================================= */

    case "duracao":
      return formatarTempoComMilhar(
        item.duracao ||
          item.tempo,
      );


    /* =================================================
       PRODUTIVIDADE
    ================================================= */

    case "produtividade_hora":
      return Math.round(
        converterNumeroVisualizacao(
          item.produtividade_hora,
        ),
      ).toLocaleString(
        "pt-BR",
      );


    /* =================================================
       QUALIDADE
    ================================================= */

    case "qualidade":
      return `${converterNumeroVisualizacao(
        item.qualidade,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        },
      )}%`;


    /* =================================================
       OCORRÊNCIAS
    ================================================= */

    case "ocorrencias":
      return converterNumeroVisualizacao(
        item.ocorrencias,
      ).toLocaleString(
        "pt-BR",
        {
          maximumFractionDigits:
            0,
        },
      );


    /* =================================================
       TEMPO TOTAL
    ================================================= */

    case "tempo_total":
      return formatarTempoComMilhar(
        item.tempo_total,
      );


    /* =================================================
       TEMPO MÉDIO
    ================================================= */

    case "tempo_medio":
      return formatarTempoComMilhar(
        item.tempo_medio,
      );


    /* =================================================
       PERCENTUAL DE IMPACTO
    ================================================= */

    case "percentual_impacto":
      return `${converterNumeroVisualizacao(
        item.percentual_impacto,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        },
      )}%`;


    /* =================================================
       OUTROS CAMPOS
    ================================================= */

    case "op":
      return (
        item.op ||
        "-"
      );


    case "descricao":
      return (
        item.descricao ||
        item.justificativa ||
        item.natureza ||
        item.motivo ||
        "-"
      );


    /* =================================================
       MATÉRIA-PRIMA
    ================================================= */

    case "quantidade_mp":
      return converterNumeroVisualizacao(
        item.quantidade_mp,
      ).toLocaleString(
        "pt-BR",
        {
          maximumFractionDigits:
            2,
        },
      );


    case "peso_unitario":
      return converterNumeroVisualizacao(
        item.peso_unitario,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            4,

          maximumFractionDigits:
            4,
        },
      );


    case "consumo_total":
      return converterNumeroVisualizacao(
        item.consumo_total,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            4,

          maximumFractionDigits:
            4,
        },
      );


    case "gasto_unidade":
      return converterNumeroVisualizacao(
        item.gasto_unidade,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            4,

          maximumFractionDigits:
            6,
        },
      );


    /* =================================================
       PADRÃO
    ================================================= */

    default: {
      const valor =
        item?.[
          chave
        ];

      if (
        valor === null ||
        valor === undefined ||
        valor === ""
      ) {
        return "-";
      }

      return String(
        valor,
      );
    }
  }
};


/* =====================================================
   COMPONENTE
===================================================== */

function TelaRelatorios({
  dadosBrutos:
    dadosExternos,
}) {

  /* =====================================================
     DADOS
  ===================================================== */

  const temDadosExternos =
    Array.isArray(
      dadosExternos,
    ) &&
    dadosExternos.length >
      0;


  const {
    dados,
    loading:
      carregando,
  } =
    useCargaMaquina({
      enabled:
        !temDadosExternos,
    });


  const dadosBrutos =
    temDadosExternos
      ? dadosExternos
      : dados;


  const loading =
    temDadosExternos
      ? false
      : carregando;


  /* =====================================================
     ESTADOS
  ===================================================== */

  const [
    relatorioSelecionadoId,
    setRelatorioSelecionadoId,
  ] =
    useState(
      null,
    );


  const [
    filtros,
    setFiltros,
  ] =
    useState(
      criarFiltrosIniciais,
    );


  /* =====================================================
     DESCRIÇÕES DOS PRODUTOS

     Fonte:
     parametros_produto
  ===================================================== */

  const {
    descricoesProdutos,
  } =
    useDescricoesProdutos({
      enabled:
        relatorioSelecionadoId ===
        "producao-produto",
    });


  /* =====================================================
     VISUALIZAÇÃO
  ===================================================== */

  const [
    visualizacaoAberta,
    setVisualizacaoAberta,
  ] =
    useState(
      false,
    );


  /* =====================================================
     RELATÓRIO SELECIONADO
  ===================================================== */

  const relatorioSelecionado =
    useMemo(
      () =>
        RELATORIOS.find(
          (
            relatorio,
          ) =>
            relatorio.id ===
            relatorioSelecionadoId,
        ) ||
        null,
      [
        relatorioSelecionadoId,
      ],
    );


  /* =====================================================
     COLUNAS DA VISUALIZAÇÃO
  ===================================================== */

  const colunasVisualizacao =
    useMemo(
      () => {
        if (
          !relatorioSelecionado ||
          !Array.isArray(
            relatorioSelecionado
              .colunas,
          )
        ) {
          return [];
        }


        const chaves =
          [
            ...relatorioSelecionado
              .colunas,
          ];


        /* ===============================================
           PRODUÇÃO POR PRODUTO

           Adiciona somente na visualização:

           Produto
           Descrição do Produto
           Injetora
           ...
        =============================================== */

        if (
          relatorioSelecionado.id ===
          "producao-produto"
        ) {
          const indiceProduto =
            chaves.indexOf(
              "produto",
            );


          if (
            indiceProduto !==
              -1 &&
            !chaves.includes(
              "descricao_produto",
            )
          ) {
            chaves.splice(
              indiceProduto +
                1,

              0,

              "descricao_produto",
            );
          }
        }


        return chaves.map(
          (
            chave,
          ) => ({
            chave,

            titulo:
              TITULOS_COLUNAS_VISUALIZACAO[
                chave
              ] ||
              criarTituloAutomatico(
                chave,
              ),

            numerica:
              COLUNAS_NUMERICAS.has(
                chave,
              ),
          }),
        );
      },
      [
        relatorioSelecionado,
      ],
    );


  /* =====================================================
     CATEGORIAS
  ===================================================== */

  const categorias =
    useMemo(
      () => [
        ...new Set(
          RELATORIOS.map(
            (
              item,
            ) =>
              item.categoria,
          ),
        ),
      ],
      [],
    );


  /* =====================================================
     PRODUTOS DISPONÍVEIS
  ===================================================== */

  const produtosDisponiveis =
    useMemo(
      () => {
        let lista =
          Array.isArray(
            dadosBrutos,
          )
            ? dadosBrutos
            : [];


        if (
          filtros.injetora &&
          filtros.injetora !==
            "Todos"
        ) {
          lista =
            lista.filter(
              (
                item,
              ) =>
                String(
                  item.injetora ||
                    "",
                ).trim() ===
                String(
                  filtros.injetora,
                ).trim(),
            );
        }


        return [
          ...new Set(
            lista.map(
              (
                item,
              ) =>
                item.cod_prod ||
                item.produto,
            ),
          ),
        ].filter(
          Boolean,
        );
      },
      [
        dadosBrutos,
        filtros.injetora,
      ],
    );


  /* =====================================================
     MATÉRIAS-PRIMAS
  ===================================================== */

  const mpsDisponiveis =
    useMemo(
      () => {
        if (
          !Array.isArray(
            dadosBrutos,
          )
        ) {
          return [];
        }


        return [
          ...new Set(
            dadosBrutos.map(
              (
                item,
              ) =>
                item.mp ||
                item.materia_prima,
            ),
          ),
        ].filter(
          Boolean,
        );
      },
      [
        dadosBrutos,
      ],
    );


  /* =====================================================
     TIPOS
  ===================================================== */

  const tiposDisponiveis =
    useMemo(
      () => {
        if (
          !Array.isArray(
            dadosBrutos,
          )
        ) {
          return [];
        }


        return [
          ...new Set(
            dadosBrutos
              .map(
                (
                  item,
                ) =>
                  String(
                    item.tipo ??
                      "",
                  ).trim(),
              )
              .filter(
                (
                  tipo,
                ) =>
                  [
                    "1",
                    "2",
                    "3",
                  ].includes(
                    tipo,
                  ),
              ),
          ),
        ].sort(
          (
            a,
            b,
          ) =>
            Number(
              a,
            ) -
            Number(
              b,
            ),
        );
      },
      [
        dadosBrutos,
      ],
    );


  /* =====================================================
     FILTRO DOS DADOS
  ===================================================== */

  const dadosFiltrados =
    useMemo(
      () => {
        if (
          !Array.isArray(
            dadosBrutos,
          ) ||
          !relatorioSelecionado
        ) {
          return [];
        }


        return dadosBrutos.filter(
          (
            item,
          ) => {

            /* FILTRO FIXO */

            if (
              relatorioSelecionado
                .filtroFixo &&
              !relatorioSelecionado
                .filtroFixo(
                  item,
                )
            ) {
              return false;
            }


            /* STATUS */

            const statusItem =
              String(
                item.status ||
                  "",
              )
                .trim()
                .toLowerCase();


            if (
              filtros.status &&
              filtros.status !==
                "todos" &&
              statusItem !==
                filtros.status
            ) {
              return false;
            }


            /* PERÍODO */

            if (
              relatorioSelecionado
                .filtros.periodo
            ) {
              const dataRegistro =
                obterDataDoRegistro(
                  item,
                );


              if (
                (
                  filtros.dataInicio ||
                  filtros.dataFim
                ) &&
                !dataRegistro
              ) {
                return false;
              }


              if (
                filtros.dataInicio &&
                dataRegistro <
                  filtros.dataInicio
              ) {
                return false;
              }


              if (
                filtros.dataFim &&
                dataRegistro >
                  filtros.dataFim
              ) {
                return false;
              }
            }


            /* INJETORA */

            if (
              relatorioSelecionado
                .filtros.injetora &&
              filtros.injetora &&
              filtros.injetora !==
                "Todos"
            ) {
              if (
                String(
                  item.injetora ||
                    "",
                ).trim() !==
                String(
                  filtros.injetora,
                ).trim()
              ) {
                return false;
              }
            }


            /* PRODUTO */

            if (
              relatorioSelecionado
                .filtros.produto &&
              filtros.cod_prod &&
              filtros.cod_prod !==
                "Todos"
            ) {
              const produto =
                String(
                  item.cod_prod ||
                    item.produto ||
                    "",
                ).trim();


              if (
                produto !==
                String(
                  filtros.cod_prod,
                ).trim()
              ) {
                return false;
              }
            }


            /* MATÉRIA-PRIMA */

            if (
              relatorioSelecionado
                .filtros.mp &&
              filtros.mp &&
              filtros.mp !==
                "Todos"
            ) {
              const mp =
                String(
                  item.mp ||
                    item.materia_prima ||
                    "",
                ).trim();


              if (
                mp !==
                String(
                  filtros.mp,
                ).trim()
              ) {
                return false;
              }
            }


            /* TIPO */

            if (
              relatorioSelecionado
                .filtros.tipo &&
              Array.isArray(
                filtros.tipo,
              ) &&
              filtros.tipo.length >
                0
            ) {
              const tipo =
                String(
                  item.tipo ||
                    "",
                ).trim();


              const selecionados =
                filtros.tipo.map(
                  (
                    valor,
                  ) =>
                    String(
                      valor,
                    ).trim(),
                );


              if (
                !selecionados.includes(
                  tipo,
                )
              ) {
                return false;
              }
            }


            return true;
          },
        );
      },
      [
        dadosBrutos,
        filtros,
        relatorioSelecionado,
      ],
    );


  /* =====================================================
     TRANSFORMAÇÃO
  ===================================================== */

  const dadosRelatorio =
    useMemo(
      () => {
        if (
          !relatorioSelecionado
        ) {
          return [];
        }


        if (
          typeof relatorioSelecionado
            .transformarDados ===
          "function"
        ) {
          return relatorioSelecionado
            .transformarDados(
              dadosFiltrados,
            );
        }


        return dadosFiltrados;
      },
      [
        dadosFiltrados,
        relatorioSelecionado,
      ],
    );


  /* =====================================================
     DADOS EXCLUSIVOS DA VISUALIZAÇÃO

     SOMENTE PARA PRODUÇÃO POR PRODUTO:

     carga_maquina.cod_prod
            ↓
     parametros_produto.cod_prod
            ↓
     parametros_produto.descricao
  ===================================================== */

  const dadosRelatorioVisualizacao =
    useMemo(
      () => {

        /*
         * Para os demais relatórios,
         * não altera absolutamente nada.
         */
        if (
          relatorioSelecionado?.id !==
          "producao-produto"
        ) {
          return dadosRelatorio;
        }


        return dadosRelatorio.map(
          (
            item,
          ) => {

            /* ===========================================
               CÓDIGO DO PRODUTO DO RELATÓRIO
            =========================================== */

            const codigoOriginal =
              String(
                item.cod_prod ||
                  item.produto ||
                  "",
              ).trim();


            /* ===========================================
               NORMALIZA PARA COMPARAÇÃO
            =========================================== */

            const codigoNormalizado =
              normalizarCodigoProduto(
                codigoOriginal,
              );


            /* ===========================================
               PROCURA A DESCRIÇÃO EM
               parametros_produto

               Primeiro:
               código normalizado.

               Depois:
               código original.

               Depois:
               código original em maiúsculas.
            =========================================== */

            const descricao =
              descricoesProdutos?.[
                codigoNormalizado
              ] ||
              descricoesProdutos?.[
                codigoOriginal
              ] ||
              descricoesProdutos?.[
                codigoOriginal.toUpperCase()
              ] ||
              "-";


            return {
              ...item,

              descricao_produto:
                descricao,
            };
          },
        );
      },
      [
        dadosRelatorio,
        descricoesProdutos,
        relatorioSelecionado,
      ],
    );


  /* =====================================================
     SELEÇÃO
  ===================================================== */

  const selecionarRelatorio =
    (
      id,
    ) => {
      setRelatorioSelecionadoId(
        id,
      );


      setFiltros(
        criarFiltrosIniciais(),
      );


      setVisualizacaoAberta(
        false,
      );
    };


  const voltarListaRelatorios =
    () => {
      setRelatorioSelecionadoId(
        null,
      );


      setFiltros(
        criarFiltrosIniciais(),
      );


      setVisualizacaoAberta(
        false,
      );
    };


  /* =====================================================
     TEXTO DOS FILTROS
  ===================================================== */

  const montarTextoFiltros =
    () => {
      const lista =
        [];


      if (
        filtros.injetora &&
        filtros.injetora !==
          "Todos"
      ) {
        lista.push(
          `Injetora: ${filtros.injetora}`,
        );
      }


      if (
        filtros.cod_prod &&
        filtros.cod_prod !==
          "Todos"
      ) {
        lista.push(
          `Produto: ${filtros.cod_prod}`,
        );
      }


      if (
        filtros.mp &&
        filtros.mp !==
          "Todos"
      ) {
        lista.push(
          `MP: ${filtros.mp}`,
        );
      }


      if (
        filtros.dataInicio
      ) {
        lista.push(
          `De: ${filtros.dataInicio
            .split("-")
            .reverse()
            .join("/")}`,
        );
      }


      if (
        filtros.dataFim
      ) {
        lista.push(
          `Até: ${filtros.dataFim
            .split("-")
            .reverse()
            .join("/")}`,
        );
      }


      return lista.length >
        0
        ? lista.join(
            " | ",
          )
        : "Sem filtros adicionais";
    };


  /* =====================================================
     VISUALIZAR
  ===================================================== */

  const handleVisualizarRelatorio =
    () => {
      if (
        dadosRelatorio.length ===
        0
      ) {
        return;
      }


      setVisualizacaoAberta(
        true,
      );
    };


  /* =====================================================
   EXPORTAÇÃO

   Produção por Produto utiliza os mesmos
   dados da visualização para que a descrição
   também seja enviada ao PDF e Excel.
===================================================== */

const handleGerarPDF =
  () => {
    const dadosParaExportacao =
      relatorioSelecionado?.id ===
      "producao-produto"
        ? dadosRelatorioVisualizacao
        : dadosRelatorio;

    gerarPdfRelatorio({
      relatorio:
        relatorioSelecionado,

      dados:
        dadosParaExportacao,

      textoFiltros:
        montarTextoFiltros(),
    });
  };


const handleGerarExcel =
  async () => {
    const dadosParaExportacao =
      relatorioSelecionado?.id ===
      "producao-produto"
        ? dadosRelatorioVisualizacao
        : dadosRelatorio;

    await gerarExcelRelatorio({
      relatorio:
        relatorioSelecionado,

      dados:
        dadosParaExportacao,
    });
  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (
    loading
  ) {
    return (
      <div className="relatorios-loading">

        <div className="relatorios-loading-card">

          <div className="relatorios-spinner" />


          <p>
            Carregando dados dos
            relatórios...
          </p>

        </div>

      </div>
    );
  }


  /* =====================================================
     TELA
  ===================================================== */

  return (
    <div className="relatorios-container">


      {/* =================================================
          VOLTAR
      ================================================= */}

      {relatorioSelecionado && (

        <div className="relatorios-navegacao-topo">

          <button
            type="button"
            className="btn-voltar-topo"
            onClick={
              voltarListaRelatorios
            }
          >

            <FiArrowLeft />


            <span>
              Painel de Relatórios
            </span>

          </button>

        </div>

      )}


      {/* =================================================
          CABEÇALHO PRINCIPAL
      ================================================= */}

      <div className="relatorios-header">

        <div>

          <span className="relatorios-eyebrow">
            Central de Relatórios
          </span>


          <h1>
            Relatórios
          </h1>


          <p>
            Selecione um relatório
            pré-definido e informe apenas
            os parâmetros necessários.
          </p>

        </div>

      </div>


      {/* =================================================
          LISTA
      ================================================= */}

      {!relatorioSelecionado && (

        <div className="relatorios-lista">

          {categorias.map(
            (
              categoria,
            ) => {

              const relatoriosCategoria =
                RELATORIOS.filter(
                  (
                    item,
                  ) =>
                    item.categoria ===
                    categoria,
                );


              return (
                <section
                  key={
                    categoria
                  }
                  className="relatorios-categoria"
                >

                  <div className="relatorios-categoria-header">

                    <h2>
                      {
                        categoria
                      }
                    </h2>


                    <span>
                      {
                        relatoriosCategoria.length
                      }{" "}
                      relatório(s)
                    </span>

                  </div>


                  <div className="relatorios-grid">

                    {relatoriosCategoria.map(
                      (
                        relatorio,
                      ) => {

                        const Icone =
                          relatorio.icone;


                        return (
                          <button
                            key={
                              relatorio.id
                            }
                            type="button"
                            className="relatorio-card"
                            onClick={() =>
                              selecionarRelatorio(
                                relatorio.id,
                              )
                            }
                          >

                            <div className="relatorio-card-icone">
                              <Icone />
                            </div>


                            <div className="relatorio-card-conteudo">

                              <h3>
                                {
                                  relatorio.titulo
                                }
                              </h3>


                              <p>
                                {
                                  relatorio.descricao
                                }
                              </p>

                            </div>


                            <div className="relatorio-card-seta">
                              <FiChevronRight />
                            </div>

                          </button>
                        );
                      },
                    )}

                  </div>

                </section>
              );
            },
          )}

        </div>

      )}


      {/* =================================================
          DETALHE
      ================================================= */}

      {relatorioSelecionado && (

        <div className="relatorio-detalhe">


          {/* CABEÇALHO DO RELATÓRIO */}

          <div className="relatorio-selecionado-header">

            <div className="relatorio-selecionado-icone">

              {React.createElement(
                relatorioSelecionado.icone,
              )}

            </div>


            <div className="relatorio-selecionado-conteudo">

              <span className="relatorio-selecionado-categoria">
                {
                  relatorioSelecionado.categoria
                }
              </span>


              <h2>
                {
                  relatorioSelecionado.titulo
                }
              </h2>


              <p>
                {
                  relatorioSelecionado.descricao
                }
              </p>

            </div>

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
                  Refine os dados antes
                  de gerar o arquivo.
                </p>

              </div>

            </div>


            <FiltrosDashboard
              filtros={
                filtros
              }

              setFiltros={
                setFiltros
              }

              rawDados={
                dadosBrutos
              }

              exibirPeriodo={
                relatorioSelecionado
                  .filtros.periodo
              }

              exibirInjetora={
                relatorioSelecionado
                  .filtros.injetora
              }

              exibirTurno={
                false
              }

              exibirProduto={
                relatorioSelecionado
                  .filtros.produto
              }

              exibirMp={
                relatorioSelecionado
                  .filtros.mp
              }

              exibirTipo={
                relatorioSelecionado
                  .filtros.tipo
              }

              tiposDisponiveis={
                tiposDisponiveis
              }

              produtosDisponiveis={
                produtosDisponiveis
              }

              mpsDisponiveis={
                mpsDisponiveis
              }

              modoRelatorio={
                true
              }
            />

          </div>


          {/* =================================================
              RESUMO
          ================================================= */}

          <div className="relatorio-resumo-grid">

            <div className="relatorio-resumo-card">

              <span>

                {relatorioSelecionado.id ===
                "producao-injetora"
                  ? "Injetoras no relatório"
                  : "Registros encontrados"}

              </span>


              <strong>
                {
                  dadosRelatorio.length
                }
              </strong>

            </div>


            <div className="relatorio-resumo-card">

              <span>
                Relatório selecionado
              </span>


              <strong className="relatorio-resumo-texto">
                {
                  relatorioSelecionado.titulo
                }
              </strong>

            </div>


            <div className="relatorio-resumo-card">

              <span>
                Filtros aplicados
              </span>


              <strong className="relatorio-resumo-texto">
                {
                  montarTextoFiltros()
                }
              </strong>

            </div>

          </div>


          {/* =================================================
              AÇÕES
          ================================================= */}

          <div className="relatorio-acoes">


            {/* VISUALIZAR */}

            <button
              type="button"
              className="btn-relatorio btn-relatorio-visualizar"
              onClick={
                handleVisualizarRelatorio
              }
              disabled={
                dadosRelatorio.length ===
                0
              }
            >

              <FiEye />


              <div>

                <strong>
                  Visualizar Relatório
                </strong>


                <span>
                  Ver na tela
                </span>

              </div>

            </button>


            {/* PDF */}

            <button
              type="button"
              className="btn-relatorio btn-relatorio-pdf"
              onClick={
                handleGerarPDF
              }
              disabled={
                dadosRelatorio.length ===
                0
              }
            >

              <FiFileText />


              <div>

                <strong>
                  Baixar PDF
                </strong>


                <span>
                  Relatório formatado
                </span>

              </div>

            </button>


            {/* EXCEL */}

            <button
              type="button"
              className="btn-relatorio btn-relatorio-csv"
              onClick={
                handleGerarExcel
              }
              disabled={
                dadosRelatorio.length ===
                0
              }
            >

              <FiDownload />


              <div>

                <strong>
                  Exportar Excel
                </strong>


                <span>
                  Tabela XLSX
                </span>

              </div>

            </button>

          </div>


          {/* =================================================
              VISUALIZAÇÃO DO RELATÓRIO
          ================================================= */}

          {visualizacaoAberta && (

            <section className="relatorio-visualizacao-card">


              {/* CABEÇALHO */}

              <div className="relatorio-visualizacao-header">

                <div className="relatorio-visualizacao-titulo-area">

                  <div className="relatorio-visualizacao-icone">
                    <FiEye />
                  </div>


                  <div>

                    <span className="relatorio-visualizacao-eyebrow">
                      Visualização do relatório
                    </span>


                    <h3>
                      {
                        relatorioSelecionado.titulo
                      }
                    </h3>


                    <p>
                      {
                        relatorioSelecionado.descricao
                      }
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="btn-fechar-visualizacao"
                  onClick={() =>
                    setVisualizacaoAberta(
                      false,
                    )
                  }
                  title="Fechar visualização"
                >

                  <FiX />


                  <span>
                    Fechar
                  </span>

                </button>

              </div>


              {/* =================================================
                  INFORMAÇÕES
              ================================================= */}

              <div className="relatorio-visualizacao-info">

                <div className="relatorio-visualizacao-info-item">

                  <span>
                    Parâmetros
                  </span>


                  <strong>
                    {
                      montarTextoFiltros()
                    }
                  </strong>

                </div>


                <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">

                  <span>
                    Registros
                  </span>


                  <strong>
                    {
                      dadosRelatorio.length
                    }
                  </strong>

                </div>

              </div>


              {/* =================================================
                  TABELA
              ================================================= */}

              {dadosRelatorio.length >
              0 ? (

                <div className="relatorio-visualizacao-tabela-wrapper">

                  <table className="relatorio-visualizacao-tabela">


                    <thead>

                      <tr>

                        {colunasVisualizacao.map(
                          (
                            coluna,
                          ) => (

                            <th
                              key={
                                coluna.chave
                              }
                              className={
                                coluna.numerica
                                  ? "coluna-numerica"
                                  : ""
                              }
                            >
                              {
                                coluna.titulo
                              }
                            </th>

                          ),
                        )}

                      </tr>

                    </thead>


                    <tbody>

                      {dadosRelatorioVisualizacao.map(
                        (
                          item,
                          indice,
                        ) => (

                          <tr
                            key={`${relatorioSelecionado.id}-${indice}`}
                          >

                            {colunasVisualizacao.map(
                              (
                                coluna,
                              ) => (

                                <td
                                  key={
                                    coluna.chave
                                  }
                                  className={
                                    coluna.numerica
                                      ? "coluna-numerica"
                                      : ""
                                  }
                                >

                                  {obterValorVisualizacao(
                                    item,
                                    coluna.chave,
                                  )}

                                </td>

                              ),
                            )}

                          </tr>

                        ),
                      )}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div className="relatorio-visualizacao-vazia">

                  <FiFileText />


                  <strong>
                    Nenhum registro encontrado
                  </strong>


                  <span>
                    Ajuste os filtros para visualizar os dados.
                  </span>

                </div>

              )}


              {/* =================================================
                  RODAPÉ
              ================================================= */}

              <div className="relatorio-visualizacao-footer">

                <span>
                  {
                    dadosRelatorio.length
                  }{" "}
                  registro(s) exibido(s)
                </span>


                <span>
                  Visualização atualizada conforme os filtros
                </span>

              </div>

            </section>

          )}

        </div>

      )}

    </div>
  );
}


export default TelaRelatorios;