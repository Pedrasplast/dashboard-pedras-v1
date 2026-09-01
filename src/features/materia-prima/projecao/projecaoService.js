import {
  buscarComprasFuturas,
} from "../compras-futuras/comprasFuturasService";

import {
  buscarProgramacao,
} from "../programacao/programacaoService";

import {
  buscarSaldosIniciais,
} from "./saldo-inicial/saldoInicialService";


/* =========================================================
   NÚMEROS
========================================================= */

function numero(
  valor,
) {
  const convertido =
    Number(
      valor,
    );


  return Number.isFinite(
    convertido,
  )
    ? convertido
    : 0;
}


function arredondarKg(
  valor,
) {
  return Math.round(
    (
      numero(
        valor,
      ) +
      Number.EPSILON
    ) *
      1000000,
  ) /
    1000000;
}


/* =========================================================
   DATAS
========================================================= */

function converterDataUTC(
  valor,
) {
  if (!valor) {
    return null;
  }


  const [
    ano,
    mes,
    dia,
  ] =
    String(
      valor,
    )
      .split("-")
      .map(Number);


  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return null;
  }


  return new Date(
    Date.UTC(
      ano,
      mes - 1,
      dia,
    ),
  );
}


function formatarDataUTC(
  data,
) {
  return data
    .toISOString()
    .slice(
      0,
      10,
    );
}


function listarDatas(
  inicio,
  fim,
) {
  const dataInicio =
    converterDataUTC(
      inicio,
    );

  const dataFim =
    converterDataUTC(
      fim,
    );


  if (
    !dataInicio ||
    !dataFim ||
    dataFim <
      dataInicio
  ) {
    return [];
  }


  const datas = [];

  const atual =
    new Date(
      dataInicio,
    );


  while (
    atual <=
    dataFim
  ) {
    datas.push(
      formatarDataUTC(
        atual,
      ),
    );


    atual.setUTCDate(
      atual.getUTCDate() +
        1,
    );
  }


  return datas;
}


/* =========================================================
   NORMALIZAR RESULTADO DA PROGRAMAÇÃO
========================================================= */

function obterProgramacoes(
  resultado,
) {
  if (
    Array.isArray(
      resultado,
    )
  ) {
    return resultado;
  }


  if (
    Array.isArray(
      resultado
        ?.programacoes,
    )
  ) {
    return resultado
      .programacoes;
  }


  if (
    Array.isArray(
      resultado
        ?.programacao,
    )
  ) {
    return resultado
      .programacao;
  }


  return [];
}


/* =========================================================
   MOVIMENTOS
========================================================= */

function chaveMovimento(
  data,
  fornecedorId,
) {
  return `${data}|${fornecedorId}`;
}


function criarMovimento() {
  return {
    recebidoKg: 0,

    compraFuturaKg: 0,

    consumoKg: 0,
  };
}


function adicionarMovimento(
  mapa,
  data,
  fornecedorId,
  campo,
  quantidade,
) {
  if (
    !data ||
    fornecedorId ===
      null ||
    fornecedorId ===
      undefined
  ) {
    return;
  }


  const quantidadeFinal =
    numero(
      quantidade,
    );


  if (
    quantidadeFinal ===
    0
  ) {
    return;
  }


  const chave =
    chaveMovimento(
      data,
      fornecedorId,
    );


  const movimento =
    mapa.get(
      chave,
    ) ||
    criarMovimento();


  movimento[campo] =
    arredondarKg(
      numero(
        movimento[campo],
      ) +
        quantidadeFinal,
    );


  mapa.set(
    chave,
    movimento,
  );
}


/* =========================================================
   CONSUMO POR FORNECEDOR
========================================================= */

function obterConsumosFornecedores(
  programacao,
) {
  /*
   * Se programacaoService já trouxe
   * os consumos calculados pela receita,
   * usamos diretamente.
   */
  if (
    Array.isArray(
      programacao
        ?.consumosFornecedores,
    ) &&
    programacao
      .consumosFornecedores
      .length >
      0
  ) {
    return programacao
      .consumosFornecedores
      .map(
        (
          item,
        ) => ({
          fornecedorId:
            item
              ?.fornecedorId ??
            item
              ?.fornecedor_id ??
            null,

          fornecedorNome:
            item
              ?.fornecedorNome ??
            item
              ?.fornecedor_nome ??
            "",

          consumoDiarioKg:
            arredondarKg(
              item
                ?.consumoDiarioKg ??
              item
                ?.consumo_diario_kg ??
              0,
            ),
        }),
      )
      .filter(
        (
          item,
        ) =>
          item.fornecedorId !==
            null &&
          item.fornecedorId !==
            undefined &&
          item.consumoDiarioKg >
            0,
      );
  }


  /*
   * Fallback:
   * quantidade/dia x peso x percentual.
   */
  const quantidade =
    numero(
      programacao
        ?.quantidade,
    );

  const pesoKg =
    numero(
      programacao
        ?.pesoKg ??
      programacao
        ?.peso_kg,
    );


  const consumoDiarioKg =
    arredondarKg(
      quantidade *
        pesoKg,
    );


  const receitaItens =
    Array.isArray(
      programacao
        ?.receitaItens,
    )
      ? programacao
          .receitaItens
      : [];


  if (
    consumoDiarioKg <=
      0 ||
    receitaItens.length ===
      0
  ) {
    return [];
  }


  return receitaItens
    .filter(
      (
        item,
      ) =>
        item?.ativo !==
        false,
    )
    .map(
      (
        item,
      ) => {
        const fornecedorId =
          item
            ?.fornecedorId ??
          item
            ?.fornecedor_id ??
          null;

        const percentual =
          numero(
            item
              ?.percentual,
          );


        return {
          fornecedorId,

          fornecedorNome:
            item
              ?.fornecedorNome ??
            item
              ?.fornecedor_nome ??
            "",

          consumoDiarioKg:
            arredondarKg(
              consumoDiarioKg *
                percentual /
                100,
            ),
        };
      },
    )
    .filter(
      (
        item,
      ) =>
        item.fornecedorId !==
          null &&
        item.fornecedorId !==
          undefined &&
        item.consumoDiarioKg >
          0,
    );
}


/* =========================================================
   FORNECEDORES
========================================================= */

function registrarFornecedor(
  mapa,
  fornecedorId,
  nome = "",
  ativo = true,
) {
  if (
    fornecedorId ===
      null ||
    fornecedorId ===
      undefined
  ) {
    return;
  }


  const chave =
    String(
      fornecedorId,
    );

  const existente =
    mapa.get(
      chave,
    );


  mapa.set(
    chave,
    {
      id:
        fornecedorId,

      nome:
        nome ||
        existente
          ?.nome ||
        `Fornecedor ${fornecedorId}`,

      ativo:
        existente
          ?.ativo ??
        ativo,
    },
  );
}


/* =========================================================
   PROJEÇÃO
========================================================= */

export async function buscarProjecao({
  dataInicio,
  dataFim,
}) {
  if (!dataInicio) {
    throw new Error(
      "Informe a data inicial da projeção.",
    );
  }


  if (!dataFim) {
    throw new Error(
      "Informe a data final da projeção.",
    );
  }


  if (
    dataFim <
    dataInicio
  ) {
    throw new Error(
      "A data final não pode ser anterior à data inicial.",
    );
  }


  /* =======================================================
     FONTES
  ======================================================= */

  const [
    resultadoSaldos,
    resultadoCompras,
    resultadoProgramacao,
  ] =
    await Promise.all([
      buscarSaldosIniciais(),

      buscarComprasFuturas(),

      buscarProgramacao(),
    ]);


  const saldos =
    Array.isArray(
      resultadoSaldos
        ?.saldos,
    )
      ? resultadoSaldos
          .saldos
      : [];


  const compras =
    Array.isArray(
      resultadoCompras
        ?.compras,
    )
      ? resultadoCompras
          .compras
      : [];


  const programacoes =
    obterProgramacoes(
      resultadoProgramacao,
    );


  /* =======================================================
     MAPA DOS FORNECEDORES
  ======================================================= */

  const fornecedoresMapa =
    new Map();


  (
    resultadoSaldos
      ?.fornecedores ??
    []
  ).forEach(
    (
      fornecedor,
    ) => {
      registrarFornecedor(
        fornecedoresMapa,
        fornecedor.id,
        fornecedor.nome,
        fornecedor.ativo,
      );
    },
  );


  (
    resultadoCompras
      ?.fornecedores ??
    []
  ).forEach(
    (
      fornecedor,
    ) => {
      registrarFornecedor(
        fornecedoresMapa,
        fornecedor.id,
        fornecedor.nome,
        fornecedor.ativo,
      );
    },
  );


  saldos.forEach(
    (
      saldo,
    ) => {
      registrarFornecedor(
        fornecedoresMapa,
        saldo.fornecedorId,
        saldo.fornecedorNome,
        saldo.fornecedorAtivo,
      );
    },
  );


  compras.forEach(
    (
      compra,
    ) => {
      registrarFornecedor(
        fornecedoresMapa,
        compra.fornecedorId,
        compra.fornecedorNome,
        compra.fornecedorAtivo,
      );
    },
  );


  /* =======================================================
     SALDOS ATIVOS
  ======================================================= */

  const saldosAtivos =
    saldos
      .filter(
        (
          saldo,
        ) =>
          saldo.ativo ===
            true &&
          saldo.dataBase <=
            dataFim,
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.dataBase
            .localeCompare(
              b.dataBase,
            ),
      );


  /*
   * Para calcular corretamente o primeiro
   * dia solicitado, precisamos voltar até
   * o saldo-base mais recente de cada
   * fornecedor anterior ao início.
   */
  const ultimaBaseAntesInicio =
    new Map();


  saldosAtivos.forEach(
    (
      saldo,
    ) => {
      if (
        saldo.dataBase >
        dataInicio
      ) {
        return;
      }


      const chave =
        String(
          saldo.fornecedorId,
        );

      const atual =
        ultimaBaseAntesInicio.get(
          chave,
        );


      if (
        !atual ||
        saldo.dataBase >
          atual.dataBase ||
        (
          saldo.dataBase ===
            atual.dataBase &&
          Number(
            saldo.id,
          ) >
            Number(
              atual.id,
            )
        )
      ) {
        ultimaBaseAntesInicio.set(
          chave,
          saldo,
        );
      }
    },
  );


  let inicioCalculo =
    dataInicio;


  ultimaBaseAntesInicio.forEach(
    (
      saldo,
    ) => {
      if (
        saldo.dataBase <
        inicioCalculo
      ) {
        inicioCalculo =
          saldo.dataBase;
      }
    },
  );


  /* =======================================================
     SALDO POR DATA / FORNECEDOR
  ======================================================= */

  const basesMapa =
    new Map();


  saldosAtivos.forEach(
    (
      saldo,
    ) => {
      if (
        saldo.dataBase <
          inicioCalculo ||
        saldo.dataBase >
          dataFim
      ) {
        return;
      }


      basesMapa.set(
        chaveMovimento(
          saldo.dataBase,
          saldo.fornecedorId,
        ),
        saldo,
      );
    },
  );


  /* =======================================================
     COMPRAS
  ======================================================= */

  const movimentosMapa =
    new Map();


  compras.forEach(
    (
      compra,
    ) => {
      if (
        compra.ativo ===
          false ||
        compra.status ===
          "CANCELADA"
      ) {
        return;
      }


      registrarFornecedor(
        fornecedoresMapa,
        compra.fornecedorId,
        compra.fornecedorNome,
        compra.fornecedorAtivo,
      );


      if (
        compra.status ===
        "RECEBIDA"
      ) {
        if (
          compra.dataRecebimento &&
          compra.dataRecebimento >=
            inicioCalculo &&
          compra.dataRecebimento <=
            dataFim
        ) {
          adicionarMovimento(
            movimentosMapa,
            compra.dataRecebimento,
            compra.fornecedorId,
            "recebidoKg",
            compra.quantidadeKg,
          );
        }


        return;
      }


      if (
        (
          compra.status ===
            "PREVISTA" ||
          compra.status ===
            "CONFIRMADA"
        ) &&
        compra.dataPrevista &&
        compra.dataPrevista >=
          inicioCalculo &&
        compra.dataPrevista <=
          dataFim
      ) {
        adicionarMovimento(
          movimentosMapa,
          compra.dataPrevista,
          compra.fornecedorId,
          "compraFuturaKg",
          compra.quantidadeKg,
        );
      }
    },
  );


  /* =======================================================
     PROGRAMAÇÃO / CONSUMO
  ======================================================= */

  const programacoesSemReceita =
    [];


  programacoes.forEach(
    (
      programacao,
    ) => {
      if (
        programacao.ativo ===
          false
      ) {
        return;
      }


      const inicio =
        programacao
          .dataInicio ??
        programacao
          .data_inicio;

      const fim =
        programacao
          .dataFim ??
        programacao
          .data_fim;


      if (
        !inicio ||
        !fim ||
        fim <
          inicioCalculo ||
        inicio >
          dataFim
      ) {
        return;
      }


      const consumos =
        obterConsumosFornecedores(
          programacao,
        );


      if (
        consumos.length ===
        0
      ) {
        const consumoDiario =
          numero(
            programacao
              ?.consumoDiarioKg,
          ) ||
          (
            numero(
              programacao
                ?.quantidade,
            ) *
            numero(
              programacao
                ?.pesoKg,
            )
          );


        if (
          consumoDiario >
          0
        ) {
          programacoesSemReceita.push({
            id:
              programacao.id,

            codigoProduto:
              programacao
                .codigoProduto ??
              programacao
                .codigo_produto ??
              "",

            produto:
              programacao
                .produto ??
              programacao
                .descricaoProduto ??
              "",
          });
        }


        return;
      }


      consumos.forEach(
        (
          consumo,
        ) => {
          registrarFornecedor(
            fornecedoresMapa,
            consumo.fornecedorId,
            consumo.fornecedorNome,
            true,
          );
        },
      );


      const inicioAplicado =
        inicio <
          inicioCalculo
          ? inicioCalculo
          : inicio;

      const fimAplicado =
        fim >
          dataFim
          ? dataFim
          : fim;


      const datasProgramacao =
        listarDatas(
          inicioAplicado,
          fimAplicado,
        );


      datasProgramacao.forEach(
        (
          data,
        ) => {
          consumos.forEach(
            (
              consumo,
            ) => {
              adicionarMovimento(
                movimentosMapa,
                data,
                consumo.fornecedorId,
                "consumoKg",
                consumo.consumoDiarioKg,
              );
            },
          );
        },
      );
    },
  );


  /* =======================================================
     FORNECEDORES ENVOLVIDOS
  ======================================================= */

  const fornecedoresEnvolvidos =
    new Set();


  saldosAtivos.forEach(
    (
      saldo,
    ) => {
      fornecedoresEnvolvidos.add(
        String(
          saldo.fornecedorId,
        ),
      );
    },
  );


  movimentosMapa.forEach(
    (
      movimento,
      chave,
    ) => {
      void movimento;


      const partes =
        chave.split("|");


      if (
        partes.length ===
        2
      ) {
        fornecedoresEnvolvidos.add(
          partes[1],
        );
      }
    },
  );


  /* =======================================================
     DATAS DO CÁLCULO
  ======================================================= */

  const datasCalculo =
    listarDatas(
      inicioCalculo,
      dataFim,
    );


  const estadoFornecedores =
    new Map();

  const linhas = [];


  datasCalculo.forEach(
    (
      data,
    ) => {
      fornecedoresEnvolvidos.forEach(
        (
          fornecedorChave,
        ) => {
          const fornecedor =
            fornecedoresMapa.get(
              fornecedorChave,
            ) || {
              id:
                fornecedorChave,

              nome:
                `Fornecedor ${fornecedorChave}`,
            };


          const base =
            basesMapa.get(
              chaveMovimento(
                data,
                fornecedor.id,
              ),
            );


          const estadoAnterior =
            estadoFornecedores.get(
              fornecedorChave,
            );


          let possuiSaldoBase =
            estadoAnterior
              ?.possuiSaldoBase ===
            true;

          let saldoInicioKg =
            possuiSaldoBase
              ? numero(
                  estadoAnterior
                    ?.saldoFinalKg,
                )
              : null;

          let saldoBaseAplicado =
            null;


          /*
           * Quando existe uma nova contagem
           * física nessa data, ela passa a ser
           * o novo ponto de partida.
           */
          if (base) {
            possuiSaldoBase =
              true;

            saldoInicioKg =
              numero(
                base.quantidadeKg,
              );

            saldoBaseAplicado =
              base;
          }


          const movimento =
            movimentosMapa.get(
              chaveMovimento(
                data,
                fornecedor.id,
              ),
            ) ||
            criarMovimento();


          let saldoFinalKg =
            null;


          if (
            possuiSaldoBase
          ) {
            saldoFinalKg =
              arredondarKg(
                numero(
                  saldoInicioKg,
                ) +
                  numero(
                    movimento
                      .recebidoKg,
                  ) +
                  numero(
                    movimento
                      .compraFuturaKg,
                  ) -
                  numero(
                    movimento
                      .consumoKg,
                  ),
              );
          }


          estadoFornecedores.set(
            fornecedorChave,
            {
              possuiSaldoBase,

              saldoFinalKg,
            },
          );


          if (
            data <
            dataInicio
          ) {
            return;
          }


          linhas.push({
            data,

            fornecedorId:
              fornecedor.id,

            fornecedorNome:
              fornecedor.nome,

            possuiSaldoBase,

            saldoBaseAplicado:
              Boolean(
                saldoBaseAplicado,
              ),

            quantidadeSaldoBaseKg:
              saldoBaseAplicado
                ? numero(
                    saldoBaseAplicado
                      .quantidadeKg,
                  )
                : null,

            saldoInicioKg,

            recebidoKg:
              arredondarKg(
                movimento
                  .recebidoKg,
              ),

            compraFuturaKg:
              arredondarKg(
                movimento
                  .compraFuturaKg,
              ),

            consumoKg:
              arredondarKg(
                movimento
                  .consumoKg,
              ),

            saldoFinalKg,
          });
        },
      );
    },
  );


  /* =======================================================
     FORNECEDORES SEM SALDO
  ======================================================= */

  const fornecedoresSemSaldo =
    [];


  fornecedoresEnvolvidos.forEach(
    (
      chave,
    ) => {
      const existeSaldo =
        saldosAtivos.some(
          (
            saldo,
          ) =>
            String(
              saldo.fornecedorId,
            ) ===
              chave &&
            saldo.dataBase <=
              dataFim,
        );


      if (!existeSaldo) {
        const fornecedor =
          fornecedoresMapa.get(
            chave,
          );


        fornecedoresSemSaldo.push({
          id:
            fornecedor
              ?.id ??
            chave,

          nome:
            fornecedor
              ?.nome ??
            `Fornecedor ${chave}`,
        });
      }
    },
  );


  const fornecedores =
    Array.from(
      fornecedoresEnvolvidos,
    )
      .map(
        (
          chave,
        ) =>
          fornecedoresMapa.get(
            chave,
          ) || {
            id:
              chave,

            nome:
              `Fornecedor ${chave}`,
          },
      )
      .sort(
        (
          a,
          b,
        ) =>
          String(
            a.nome,
          ).localeCompare(
            String(
              b.nome,
            ),
            "pt-BR",
          ),
      );


  return {
    dataInicio,

    dataFim,

    inicioCalculo,

    linhas,

    fornecedores,

    fornecedoresSemSaldo,

    programacoesSemReceita,
  };
}