import {
  buscarComprasFuturas,
} from "../compras-futuras/comprasFuturasService";

import {
  buscarProjecao,
} from "../projecao/projecaoService";


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


/* =========================================================
   DATAS
========================================================= */

function dataLocalParaTexto(
  data,
) {
  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() +
        1,
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


function somarDias(
  dataTexto,
  quantidade,
) {
  const [
    ano,
    mes,
    dia,
  ] =
    String(
      dataTexto,
    )
      .split("-")
      .map(Number);


  const data =
    new Date(
      ano,
      mes - 1,
      dia,
    );


  data.setDate(
    data.getDate() +
      quantidade,
  );


  return dataLocalParaTexto(
    data,
  );
}


/* =========================================================
   ÚLTIMA LINHA POR FORNECEDOR
========================================================= */

function obterUltimasLinhas(
  linhas = [],
) {
  const mapa =
    new Map();


  linhas.forEach(
    (
      linha,
    ) => {
      mapa.set(
        String(
          linha.fornecedorId,
        ),
        linha,
      );
    },
  );


  return Array.from(
    mapa.values(),
  );
}


/* =========================================================
   PRIMEIRA RUPTURA
========================================================= */

function obterPrimeiraRuptura(
  linhas = [],
) {
  const linhasNegativas =
    linhas
      .filter(
        (
          linha,
        ) =>
          linha.saldoFinalKg !==
            null &&
          numero(
            linha.saldoFinalKg,
          ) <
            0,
      )
      .sort(
        (
          a,
          b,
        ) =>
          String(
            a.data,
          ).localeCompare(
            String(
              b.data,
            ),
          ),
      );


  return (
    linhasNegativas[0] ??
    null
  );
}


/* =========================================================
   PRIMEIRA RUPTURA POR FORNECEDOR
========================================================= */

function obterRupturasPorFornecedor(
  linhas = [],
) {
  const mapa =
    new Map();


  linhas
    .filter(
      (
        linha,
      ) =>
        linha.saldoFinalKg !==
          null &&
        numero(
          linha.saldoFinalKg,
        ) <
          0,
    )
    .sort(
      (
        a,
        b,
      ) =>
        String(
          a.data,
        ).localeCompare(
          String(
            b.data,
          ),
        ),
    )
    .forEach(
      (
        linha,
      ) => {
        const chave =
          String(
            linha.fornecedorId,
          );


        if (
          !mapa.has(
            chave,
          )
        ) {
          mapa.set(
            chave,
            linha,
          );
        }
      },
    );


  return mapa;
}


/* =========================================================
   COMPRAS EM ABERTO
========================================================= */

function calcularComprasAbertas(
  compras = [],
) {
  const abertas =
    compras.filter(
      (
        compra,
      ) =>
        compra.ativo !==
          false &&
        (
          compra.status ===
            "PREVISTA" ||
          compra.status ===
            "CONFIRMADA"
        ),
    );


  return {
    quantidade:
      abertas.length,

    quantidadeKg:
      abertas.reduce(
        (
          total,
          compra,
        ) =>
          total +
          numero(
            compra.quantidadeKg,
          ),
        0,
      ),

    compras:
      abertas,
  };
}


/* =========================================================
   COMPRAS POR FORNECEDOR
========================================================= */

function obterComprasAbertasPorFornecedor(
  compras = [],
) {
  const mapa =
    new Map();


  compras
    .filter(
      (
        compra,
      ) =>
        compra.ativo !==
          false &&
        (
          compra.status ===
            "PREVISTA" ||
          compra.status ===
            "CONFIRMADA"
        ),
    )
    .forEach(
      (
        compra,
      ) => {
        const chave =
          String(
            compra.fornecedorId,
          );


        const atual =
          mapa.get(
            chave,
          ) ?? {
            quantidade: 0,
            quantidadeKg: 0,
            proximaEntrega: null,
          };


        atual.quantidade +=
          1;

        atual.quantidadeKg +=
          numero(
            compra.quantidadeKg,
          );


        if (
          compra.dataPrevista &&
          (
            !atual.proximaEntrega ||
            compra.dataPrevista <
              atual.proximaEntrega
          )
        ) {
          atual.proximaEntrega =
            compra.dataPrevista;
        }


        mapa.set(
          chave,
          atual,
        );
      },
    );


  return mapa;
}


/* =========================================================
   VISÃO GERAL
========================================================= */

export async function buscarVisaoGeral() {
  const hoje =
    dataLocalParaTexto(
      new Date(),
    );

  const dataFim =
    somarDias(
      hoje,
      30,
    );


  const [
    projecao,
    resultadoCompras,
  ] =
    await Promise.all([
      buscarProjecao({
        dataInicio:
          hoje,

        dataFim,
      }),

      buscarComprasFuturas(),
    ]);


  const linhas =
    Array.isArray(
      projecao?.linhas,
    )
      ? projecao.linhas
      : [];


  const fornecedores =
    Array.isArray(
      projecao?.fornecedores,
    )
      ? projecao.fornecedores
      : [];


  const compras =
    Array.isArray(
      resultadoCompras
        ?.compras,
    )
      ? resultadoCompras.compras
      : [];


  /* =======================================================
     LINHAS DE HOJE
  ======================================================= */

  const linhasHoje =
    linhas.filter(
      (
        linha,
      ) =>
        linha.data ===
        hoje,
    );


  /* =======================================================
     ÚLTIMAS LINHAS DO PERÍODO
  ======================================================= */

  const ultimasLinhas =
    obterUltimasLinhas(
      linhas,
    );


  /* =======================================================
     COMPRAS
  ======================================================= */

  const comprasAbertas =
    calcularComprasAbertas(
      compras,
    );


  const comprasPorFornecedor =
    obterComprasAbertasPorFornecedor(
      compras,
    );


  /* =======================================================
     RUPTURAS
  ======================================================= */

  const primeiraRuptura =
    obterPrimeiraRuptura(
      linhas,
    );


  const rupturasPorFornecedor =
    obterRupturasPorFornecedor(
      linhas,
    );


  /* =======================================================
     SALDO HOJE
  ======================================================= */

  const saldoHojeKg =
    linhasHoje.reduce(
      (
        total,
        linha,
      ) =>
        total +
        (
          linha.saldoFinalKg ===
            null
            ? 0
            : numero(
                linha.saldoFinalKg,
              )
        ),
      0,
    );


  /* =======================================================
     CONSUMO HOJE
  ======================================================= */

  const consumoHojeKg =
    linhasHoje.reduce(
      (
        total,
        linha,
      ) =>
        total +
        numero(
          linha.consumoKg,
        ),
      0,
    );


  /* =======================================================
     SALDO FINAL 30 DIAS
  ======================================================= */

  const saldoFimPeriodoKg =
    ultimasLinhas.reduce(
      (
        total,
        linha,
      ) =>
        total +
        (
          linha.saldoFinalKg ===
            null
            ? 0
            : numero(
                linha.saldoFinalKg,
              )
        ),
      0,
    );


  /* =======================================================
     CONSUMO 30 DIAS
  ======================================================= */

  const consumoPeriodoKg =
    linhas.reduce(
      (
        total,
        linha,
      ) =>
        total +
        numero(
          linha.consumoKg,
        ),
      0,
    );


  /* =======================================================
     RECEBIMENTOS REALIZADOS NO PERÍODO
  ======================================================= */

  const recebidoPeriodoKg =
    linhas.reduce(
      (
        total,
        linha,
      ) =>
        total +
        numero(
          linha.recebidoKg,
        ),
      0,
    );


  /* =======================================================
     FORNECEDORES EM RISCO
  ======================================================= */

  const fornecedoresEmRisco =
    Array.from(
      rupturasPorFornecedor
        .values(),
    );


  /* =======================================================
     RESUMO POR FORNECEDOR
  ======================================================= */

  const resumoFornecedores =
    fornecedores
      .map(
        (
          fornecedor,
        ) => {
          const chave =
            String(
              fornecedor.id,
            );


          const linhaHoje =
            linhasHoje.find(
              (
                linha,
              ) =>
                String(
                  linha.fornecedorId,
                ) ===
                chave,
            ) ??
            null;


          const linhaFim =
            ultimasLinhas.find(
              (
                linha,
              ) =>
                String(
                  linha.fornecedorId,
                ) ===
                chave,
            ) ??
            null;


          const ruptura =
            rupturasPorFornecedor.get(
              chave,
            ) ??
            null;


          const compra =
            comprasPorFornecedor.get(
              chave,
            ) ?? {
              quantidade: 0,
              quantidadeKg: 0,
              proximaEntrega: null,
            };


          return {
            id:
              fornecedor.id,

            nome:
              fornecedor.nome,

            saldoHojeKg:
              linhaHoje
                ?.saldoFinalKg ??
              null,

            saldoFimPeriodoKg:
              linhaFim
                ?.saldoFinalKg ??
              null,

            consumoHojeKg:
              numero(
                linhaHoje
                  ?.consumoKg,
              ),

            comprasAbertas:
              compra.quantidade,

            comprasAbertasKg:
              compra.quantidadeKg,

            proximaEntrega:
              compra.proximaEntrega,

            dataRuptura:
              ruptura?.data ??
              null,

            saldoRupturaKg:
              ruptura?.saldoFinalKg ??
              null,

            possuiSaldoBase:
              linhaHoje
                ?.possuiSaldoBase ===
              true,
          };
        },
      )
      .sort(
        (
          a,
          b,
        ) => {
          if (
            a.dataRuptura &&
            !b.dataRuptura
          ) {
            return -1;
          }


          if (
            !a.dataRuptura &&
            b.dataRuptura
          ) {
            return 1;
          }


          if (
            a.dataRuptura &&
            b.dataRuptura
          ) {
            return a.dataRuptura.localeCompare(
              b.dataRuptura,
            );
          }


          return String(
            a.nome,
          ).localeCompare(
            String(
              b.nome,
            ),
            "pt-BR",
          );
        },
      );


  return {
    hoje,

    dataFim,

    saldoHojeKg,

    consumoHojeKg,

    saldoFimPeriodoKg,

    consumoPeriodoKg,

    recebidoPeriodoKg,

    comprasAbertasQuantidade:
      comprasAbertas.quantidade,

    comprasAbertasKg:
      comprasAbertas.quantidadeKg,

    fornecedoresEmRiscoQuantidade:
      fornecedoresEmRisco.length,

    primeiraRupturaData:
      primeiraRuptura
        ?.data ??
      null,

    primeiraRupturaFornecedor:
      primeiraRuptura
        ?.fornecedorNome ??
      null,

    resumoFornecedores,

    fornecedoresSemSaldo:
      Array.isArray(
        projecao
          ?.fornecedoresSemSaldo,
      )
        ? projecao.fornecedoresSemSaldo
        : [],

    programacoesSemReceita:
      Array.isArray(
        projecao
          ?.programacoesSemReceita,
      )
        ? projecao.programacoesSemReceita
        : [],
  };
}