import {
  formatarDataCurta,
  numero,
  statusCompraAberta,
} from "./dashboardMateriaPrimaUtils.js";


function comprasValidas(
  financeiro,
) {
  return (
    Array.isArray(
      financeiro?.compras,
    )
      ? financeiro.compras
      : []
  ).filter(
    (
      item,
    ) =>
      item.status !==
      "CANCELADA",
  );
}


function recebimentosValidos(
  financeiro,
) {
  return Array.isArray(
    financeiro?.recebimentos,
  )
    ? financeiro.recebimentos
    : [];
}


function chaveMaterial(
  item,
) {
  return String(
    item?.materialId ??
    item?.tipoMaterial ??
    "sem-material",
  );
}


function diferencaDias(
  dataInicial,
  dataFinal,
) {
  if (
    !dataInicial ||
    !dataFinal
  ) {
    return null;
  }

  const [
    anoInicial,
    mesInicial,
    diaInicial,
  ] =
    String(
      dataInicial,
    )
      .split("-")
      .map(Number);

  const [
    anoFinal,
    mesFinal,
    diaFinal,
  ] =
    String(
      dataFinal,
    )
      .split("-")
      .map(Number);

  if (
    !anoInicial ||
    !mesInicial ||
    !diaInicial ||
    !anoFinal ||
    !mesFinal ||
    !diaFinal
  ) {
    return null;
  }

  const inicio =
    Date.UTC(
      anoInicial,
      mesInicial - 1,
      diaInicial,
    );

  const fim =
    Date.UTC(
      anoFinal,
      mesFinal - 1,
      diaFinal,
    );

  return Math.round(
    (
      fim -
      inicio
    ) /
    86400000,
  );
}


function percentual(
  numerador,
  denominador,
) {
  const base =
    numero(
      denominador,
    );

  if (
    base === 0
  ) {
    return null;
  }

  return (
    numero(
      numerador,
    ) /
    base
  ) *
  100;
}


function criarMetricasEntrega(
  lista,
) {
  const recebidos =
    (
      Array.isArray(
        lista,
      )
        ? lista
        : []
    ).filter(
      (
        item,
      ) =>
        Boolean(
          item.dataRecebimento,
        ),
    );

  const prazos =
    recebidos
      .map(
        (
          item,
        ) =>
          diferencaDias(
            item.dataCompra,
            item.dataRecebimento,
          ),
      )
      .filter(
        (
          valor,
        ) =>
          valor !== null &&
          Number.isFinite(
            valor,
          ) &&
          valor >= 0,
      );

  const avaliadosPontualidade =
    recebidos
      .map(
        (
          item,
        ) => {
          const atraso =
            diferencaDias(
              item.dataPrevista,
              item.dataRecebimento,
            );

          if (
            atraso === null
          ) {
            return null;
          }

          return {
            pontual:
              atraso <= 0,

            atrasoDias:
              Math.max(
                0,
                atraso,
              ),
          };
        },
      )
      .filter(
        Boolean,
      );

  const atrasados =
    avaliadosPontualidade.filter(
      (
        item,
      ) =>
        !item.pontual,
    );

  return {
    entregasAvaliadas:
      prazos.length,

    prazoMedioEntregaDias:
      prazos.length >
        0
        ? prazos.reduce(
            (
              soma,
              valor,
            ) =>
              soma +
              valor,
            0,
          ) /
          prazos.length
        : null,

    pontualidadePercentual:
      avaliadosPontualidade.length >
        0
        ? (
            avaliadosPontualidade.filter(
              (
                item,
              ) =>
                item.pontual,
            ).length /
            avaliadosPontualidade.length
          ) *
          100
        : null,

    atrasos:
      atrasados.length,

    atrasoMedioDias:
      atrasados.length >
        0
        ? atrasados.reduce(
            (
              soma,
              item,
            ) =>
              soma +
              item.atrasoDias,
            0,
          ) /
          atrasados.length
        : 0,
  };
}


export function criarMateriaisFiltro(
  financeiro,
) {
  const mapa =
    new Map();

  for (
    const item of comprasValidas(
      financeiro,
    )
  ) {
    const chave =
      chaveMaterial(
        item,
      );

    if (
      !mapa.has(
        chave,
      )
    ) {
      mapa.set(
        chave,
        {
          materialId:
            item.materialId ??
            chave,

          tipoMaterial:
            item.tipoMaterial ||
            "Material não informado",
        },
      );
    }
  }

  return [
    ...mapa.values(),
  ].sort(
    (
      a,
      b,
    ) =>
      String(
        a.tipoMaterial,
      ).localeCompare(
        String(
          b.tipoMaterial,
        ),
        "pt-BR",
      ),
  );
}


export function criarFornecedoresFiltro(
  financeiro,
) {
  const mapa =
    new Map();

  for (
    const lista of [
      financeiro?.compras || [],
      financeiro?.recebimentos || [],
    ]
  ) {
    for (
      const item of lista
    ) {
      if (
        item?.fornecedorId ===
          null ||
        item?.fornecedorId ===
          undefined
      ) {
        continue;
      }

      const chave =
        String(
          item.fornecedorId,
        );

      if (
        !mapa.has(
          chave,
        )
      ) {
        mapa.set(
          chave,
          {
            fornecedorId:
              item.fornecedorId,

            fornecedorNome:
              item.fornecedorNome ||
              "Fornecedor sem nome",
          },
        );
      }
    }
  }

  return [
    ...mapa.values(),
  ].sort(
    (
      a,
      b,
    ) =>
      String(
        a.fornecedorNome,
      ).localeCompare(
        String(
          b.fornecedorNome,
        ),
        "pt-BR",
      ),
  );
}


function filtrarLista({
  lista,
  fornecedorSelecionado,
  materialSelecionado,
}) {
  return (
    Array.isArray(
      lista,
    )
      ? lista
      : []
  ).filter(
    (
      item,
    ) => {
      if (
        fornecedorSelecionado !==
          "todos" &&
        String(
          item.fornecedorId,
        ) !==
          String(
            fornecedorSelecionado,
          )
      ) {
        return false;
      }

      if (
        materialSelecionado !==
          "todos" &&
        chaveMaterial(
          item,
        ) !==
          String(
            materialSelecionado,
          )
      ) {
        return false;
      }

      return true;
    },
  );
}


export function criarFinanceiroFiltrado({
  financeiro,
  fornecedorSelecionado,
  materialSelecionado,
}) {
  return {
    compras:
      filtrarLista({
        lista:
          financeiro?.compras,

        fornecedorSelecionado,

        materialSelecionado,
      }),

    recebimentos:
      filtrarLista({
        lista:
          financeiro?.recebimentos,

        fornecedorSelecionado,

        materialSelecionado,
      }),
  };
}


function agruparBase(
  compras,
  obterChave,
  criarInicial,
) {
  const mapa =
    new Map();

  for (
    const item of compras
  ) {
    const chave =
      obterChave(
        item,
      );

    const atual =
      mapa.get(
        chave,
      ) ||
      criarInicial(
        item,
      );

    atual.compras +=
      1;

    atual.quantidadeKg +=
      numero(
        item.quantidadeKg,
      );

    atual.fornecedoresSet?.add(
      String(
        item.fornecedorId,
      ),
    );

    if (
      item.precoUnitario !==
        null &&
      item.precoUnitario !==
        undefined
    ) {
      atual.precos.push(
        numero(
          item.precoUnitario,
        ),
      );

      atual.historicoPrecos.push({
        data:
          item.dataCompra ||
          "",

        id:
          numero(
            item.id,
          ),

        preco:
          numero(
            item.precoUnitario,
          ),

        fornecedor:
          item.fornecedorNome,
      });
    }

    if (
      item.precoUnitario !==
        null &&
      item.subtotalProdutos !==
        null
    ) {
      atual.quantidadeComPrecoKg +=
        numero(
          item.quantidadeKg,
        );

      atual.subtotal +=
        numero(
          item.subtotalProdutos,
        );
    }

    if (
      item.valorTotal !==
      null
    ) {
      atual.quantidadeComTotalKg +=
        numero(
          item.quantidadeKg,
        );

      atual.total +=
        numero(
          item.valorTotal,
        );
    }

    atual.ipi +=
      numero(
        item.valorIpi,
      );

    atual.frete +=
      numero(
        item.valorFrete,
      );

    atual.desconto +=
      numero(
        item.valorDesconto,
      );

    atual.outrasDespesas +=
      numero(
        item.outrasDespesas,
      );

    if (
      statusCompraAberta(
        item.status,
      )
    ) {
      atual.valorAberto +=
        numero(
          item.valorTotal,
        );

      atual.quantidadeAbertaKg +=
        numero(
          item.quantidadeKg,
        );
    }

    if (
      item.dataRecebimento
    ) {
      const diasEntrega =
        diferencaDias(
          item.dataCompra,
          item.dataRecebimento,
        );

      if (
        diasEntrega !== null &&
        diasEntrega >= 0
      ) {
        atual.prazosEntrega.push(
          diasEntrega,
        );
      }

      const atraso =
        diferencaDias(
          item.dataPrevista,
          item.dataRecebimento,
        );

      if (
        atraso !== null
      ) {
        atual.pontualidades.push(
          atraso <= 0,
        );
      }
    }

    mapa.set(
      chave,
      atual,
    );
  }

  return [
    ...mapa.values(),
  ].map(
    (
      item,
    ) => {
      const historico =
        [
          ...item.historicoPrecos,
        ].sort(
          (
            a,
            b,
          ) =>
            a.data.localeCompare(
              b.data,
            ) ||
            a.id -
            b.id,
        );

      const ultimo =
        historico[
          historico.length -
          1
        ] ||
        null;

      const anterior =
        historico[
          historico.length -
          2
        ] ||
        null;

      const precoMinimoKg =
        item.precos.length >
          0
          ? Math.min(
              ...item.precos,
            )
          : null;

      const precoMaximoKg =
        item.precos.length >
          0
          ? Math.max(
              ...item.precos,
            )
          : null;

      const precoMedioKg =
        item.quantidadeComPrecoKg >
          0
          ? item.subtotal /
            item.quantidadeComPrecoKg
          : null;

      const custoMedioKg =
        item.quantidadeComTotalKg >
          0
          ? item.total /
            item.quantidadeComTotalKg
          : null;

      return {
        ...item,

        fornecedores:
          item.fornecedoresSet
            ?.size ??
          0,

        precoMedioKg,

        custoMedioKg,

        custoAdicionalKg:
          precoMedioKg !==
            null &&
          custoMedioKg !==
            null
            ? custoMedioKg -
              precoMedioKg
            : null,

        impactoCustoPercentual:
          precoMedioKg !==
            null &&
          precoMedioKg >
            0 &&
          custoMedioKg !==
            null
            ? (
                (
                  custoMedioKg -
                  precoMedioKg
                ) /
                precoMedioKg
              ) *
              100
            : null,

        precoMinimoKg,

        precoMaximoKg,

        amplitudePrecoPercentual:
          precoMinimoKg !==
            null &&
          precoMinimoKg >
            0 &&
          precoMaximoKg !==
            null
            ? (
                (
                  precoMaximoKg -
                  precoMinimoKg
                ) /
                precoMinimoKg
              ) *
              100
            : null,

        ultimoPrecoKg:
          ultimo
            ?.preco ??
          null,

        ultimoFornecedor:
          ultimo
            ?.fornecedor ??
          "",

        variacaoUltimaCompraPercentual:
          ultimo &&
          anterior &&
          anterior.preco >
            0
            ? (
                (
                  ultimo.preco -
                  anterior.preco
                ) /
                anterior.preco
              ) *
              100
            : null,

        prazoMedioEntregaDias:
          item.prazosEntrega.length >
            0
            ? item.prazosEntrega.reduce(
                (
                  soma,
                  valor,
                ) =>
                  soma +
                  valor,
                0,
              ) /
              item.prazosEntrega.length
            : null,

        pontualidadePercentual:
          item.pontualidades.length >
            0
            ? (
                item.pontualidades.filter(
                  Boolean,
                ).length /
                item.pontualidades.length
              ) *
              100
            : null,
      };
    },
  );
}


function criarInicialBase(
  item,
) {
  return {
    materialId:
      item.materialId ??
      chaveMaterial(
        item,
      ),

    material:
      item.tipoMaterial ||
      "Material não informado",

    compras:
      0,

    quantidadeKg:
      0,

    quantidadeComPrecoKg:
      0,

    quantidadeComTotalKg:
      0,

    subtotal:
      0,

    ipi:
      0,

    frete:
      0,

    desconto:
      0,

    outrasDespesas:
      0,

    total:
      0,

    valorAberto:
      0,

    quantidadeAbertaKg:
      0,

    fornecedoresSet:
      new Set(),

    precos:
      [],

    historicoPrecos:
      [],

    prazosEntrega:
      [],

    pontualidades:
      [],
  };
}


export function criarResumoFinanceiro(
  financeiro,
) {
  const compras =
    comprasValidas(
      financeiro,
    );

  const recebimentos =
    recebimentosValidos(
      financeiro,
    );

  const materiais =
    new Set(
      compras.map(
        chaveMaterial,
      ),
    );

  const fornecedores =
    new Set(
      compras.map(
        (
          item,
        ) =>
          String(
            item.fornecedorId,
          ),
      ),
    );

  const comPreco =
    compras.filter(
      (
        item,
      ) =>
        item.precoUnitario !==
          null &&
        item.subtotalProdutos !==
          null,
    );

  const comTotal =
    compras.filter(
      (
        item,
      ) =>
        item.valorTotal !==
        null,
    );

  const quantidadeComPrecoKg =
    comPreco.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.quantidadeKg,
        ),
      0,
    );

  const quantidadeComTotalKg =
    comTotal.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.quantidadeKg,
        ),
      0,
    );

  const quantidadeCompradaKg =
    compras.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.quantidadeKg,
        ),
      0,
    );

  const subtotalProdutos =
    compras.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.subtotalProdutos,
        ),
      0,
    );

  const valorIpi =
    compras.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.valorIpi,
        ),
      0,
    );

  const valorFrete =
    compras.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.valorFrete,
        ),
      0,
    );

  const valorDesconto =
    compras.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.valorDesconto,
        ),
      0,
    );

  const outrasDespesas =
    compras.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.outrasDespesas,
        ),
      0,
    );

  const valorTotal =
    compras.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.valorTotal,
        ),
      0,
    );

  const acrescimosLiquidos =
    valorIpi +
    valorFrete +
    outrasDespesas -
    valorDesconto;

  const comprasAbertas =
    compras.filter(
      (
        item,
      ) =>
        statusCompraAberta(
          item.status,
        ),
    );

  const materiaisDistintos =
    materiais.size;

  const entregas =
    criarMetricasEntrega(
      recebimentos,
    );

  return {
    compras:
      compras.length,

    comprasComPreco:
      comPreco.length,

    comprasSemPreco:
      compras.length -
      comPreco.length,

    materiaisDistintos,

    fornecedoresDistintos:
      fornecedores.size,

    quantidadeCompradaKg,

    quantidadeMediaCompraKg:
      compras.length >
        0
        ? quantidadeCompradaKg /
          compras.length
        : null,

    subtotalProdutos,

    valorIpi,

    valorFrete,

    valorDesconto,

    outrasDespesas,

    acrescimosLiquidos,

    impactoAcrescimosPercentual:
      percentual(
        acrescimosLiquidos,
        subtotalProdutos,
      ),

    valorTotal,

    ticketMedio:
      compras.length >
        0
        ? valorTotal /
          compras.length
        : null,

    precoMedioKg:
      materiaisDistintos ===
        1 &&
      quantidadeComPrecoKg >
        0
        ? subtotalProdutos /
          quantidadeComPrecoKg
        : null,

    custoEfetivoMedioKg:
      materiaisDistintos ===
        1 &&
      quantidadeComTotalKg >
        0
        ? valorTotal /
          quantidadeComTotalKg
        : null,

    valorComprasAbertas:
      comprasAbertas.reduce(
        (
          soma,
          item,
        ) =>
          soma +
          numero(
            item.valorTotal,
          ),
        0,
      ),

    quantidadeComprasAbertasKg:
      comprasAbertas.reduce(
        (
          soma,
          item,
        ) =>
          soma +
          numero(
            item.quantidadeKg,
          ),
        0,
      ),

    comprasAbertas:
      comprasAbertas.length,

    valorRecebidoPeriodo:
      recebimentos.reduce(
        (
          soma,
          item,
        ) =>
          soma +
          numero(
            item.valorTotal,
          ),
        0,
      ),

    quantidadeRecebidaKg:
      recebimentos.reduce(
        (
          soma,
          item,
        ) =>
          soma +
          numero(
            item.quantidadeKg,
          ),
        0,
      ),

    recebimentosPeriodo:
      recebimentos.length,

    ...entregas,
  };
}


export function criarFinanceiroPorMaterial(
  financeiro,
) {
  const lista =
    agruparBase(
      comprasValidas(
        financeiro,
      ),
      chaveMaterial,
      criarInicialBase,
    );

  const totalGeral =
    lista.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        numero(
          item.total,
        ),
      0,
    );

  return lista
    .map(
      (
        item,
      ) => ({
        ...item,

        participacaoValorPercentual:
          percentual(
            item.total,
            totalGeral,
          ),
      }),
    )
    .sort(
      (
        a,
        b,
      ) =>
        b.total -
        a.total,
    );
}


export function criarFinanceiroPorFornecedor(
  financeiro,
) {
  const lista =
    agruparBase(
      comprasValidas(
        financeiro,
      ),
      (
        item,
      ) =>
        `${chaveMaterial(
          item,
        )}::${item.fornecedorId}`,
      (
        item,
      ) => ({
        ...criarInicialBase(
          item,
        ),

        fornecedorId:
          item.fornecedorId,

        fornecedor:
          item.fornecedorNome,
      }),
    );

  const totaisPorMaterial =
    new Map();

  for (
    const item of lista
  ) {
    const chave =
      String(
        item.materialId,
      );

    totaisPorMaterial.set(
      chave,
      (
        totaisPorMaterial.get(
          chave,
        ) ||
        0
      ) +
      numero(
        item.total,
      ),
    );
  }

  return lista
    .map(
      (
        item,
      ) => ({
        ...item,

        participacaoMaterialPercentual:
          percentual(
            item.total,
            totaisPorMaterial.get(
              String(
                item.materialId,
              ),
            ),
          ),
      }),
    )
    .sort(
      (
        a,
        b,
      ) =>
        a.material.localeCompare(
          b.material,
          "pt-BR",
        ) ||
        b.total -
        a.total,
    );
}


export function criarEvolucaoFinanceira(
  financeiro,
) {
  const compras =
    comprasValidas(
      financeiro,
    );

  const materiais =
    new Set(
      compras.map(
        chaveMaterial,
      ),
    );

  if (
    materiais.size !==
    1
  ) {
    return [];
  }

  const mapa =
    new Map();

  for (
    const item of compras
  ) {
    if (
      !item.dataCompra
    ) {
      continue;
    }

    const atual =
      mapa.get(
        item.dataCompra,
      ) ||
      {
        data:
          item.dataCompra,

        dataLabel:
          formatarDataCurta(
            item.dataCompra,
          ),

        quantidadeComPrecoKg:
          0,

        quantidadeComTotalKg:
          0,

        subtotal:
          0,

        total:
          0,
      };

    if (
      item.precoUnitario !==
        null &&
      item.subtotalProdutos !==
        null
    ) {
      atual.quantidadeComPrecoKg +=
        numero(
          item.quantidadeKg,
        );

      atual.subtotal +=
        numero(
          item.subtotalProdutos,
        );
    }

    if (
      item.valorTotal !==
      null
    ) {
      atual.quantidadeComTotalKg +=
        numero(
          item.quantidadeKg,
        );

      atual.total +=
        numero(
          item.valorTotal,
        );
    }

    mapa.set(
      item.dataCompra,
      atual,
    );
  }

  return [
    ...mapa.values(),
  ]
    .sort(
      (
        a,
        b,
      ) =>
        a.data.localeCompare(
          b.data,
        ),
    )
    .map(
      (
        item,
      ) => ({
        ...item,

        precoMedioKg:
          item.quantidadeComPrecoKg >
            0
            ? item.subtotal /
              item.quantidadeComPrecoKg
            : null,

        custoMedioKg:
          item.quantidadeComTotalKg >
            0
            ? item.total /
              item.quantidadeComTotalKg
            : null,
      }),
    );
}


export function criarInsightsGerenciais({
  resumo,
  porMaterial,
  porFornecedor,
}) {
  const insights =
    [];

  const maiorMaterial =
    porMaterial?.[0] ||
    null;

  if (
    maiorMaterial
  ) {
    insights.push({
      titulo:
        "Maior participação no gasto",

      valor:
        maiorMaterial.material,

      detalhe:
        maiorMaterial.participacaoValorPercentual !==
          null
          ? `${maiorMaterial.participacaoValorPercentual.toFixed(
              1,
            )}% do valor comprado no filtro`
          : "Material com maior valor comprado",
    });
  }

  const maiorAmplitude =
    [
      ...(porMaterial ||
      []),
    ]
      .filter(
        (
          item,
        ) =>
          item.amplitudePrecoPercentual !==
            null,
      )
      .sort(
        (
          a,
          b,
        ) =>
          numero(
            b.amplitudePrecoPercentual,
          ) -
          numero(
            a.amplitudePrecoPercentual,
          ),
      )[0] ||
    null;

  if (
    maiorAmplitude
  ) {
    insights.push({
      titulo:
        "Maior variação de preço",

      valor:
        maiorAmplitude.material,

      detalhe:
        `${maiorAmplitude.amplitudePrecoPercentual.toFixed(
          1,
        )}% entre menor e maior preço do período`,
    });
  }

  const maiorConcentracao =
    [
      ...(porFornecedor ||
      []),
    ]
      .filter(
        (
          item,
        ) =>
          item.participacaoMaterialPercentual !==
            null,
      )
      .sort(
        (
          a,
          b,
        ) =>
          numero(
            b.participacaoMaterialPercentual,
          ) -
          numero(
            a.participacaoMaterialPercentual,
          ),
      )[0] ||
    null;

  if (
    maiorConcentracao
  ) {
    insights.push({
      titulo:
        "Maior concentração por fornecedor",

      valor:
        maiorConcentracao.fornecedor,

      detalhe:
        `${maiorConcentracao.participacaoMaterialPercentual.toFixed(
          1,
        )}% das compras de ${maiorConcentracao.material}`,
    });
  }

  const maiorImpactoCustos =
    [
      ...(porMaterial ||
      []),
    ]
      .filter(
        (
          item,
        ) =>
          item.impactoCustoPercentual !==
            null &&
          Number.isFinite(
            Number(
              item.impactoCustoPercentual,
            ),
          ),
      )
      .sort(
        (
          a,
          b,
        ) =>
          numero(
            b.impactoCustoPercentual,
          ) -
          numero(
            a.impactoCustoPercentual,
          ),
      )[0] ||
    null;

  if (
    maiorImpactoCustos
  ) {
    const acrescimoKg =
      numero(
        maiorImpactoCustos.custoAdicionalKg,
      ).toLocaleString(
        "pt-BR",
        {
          style:
            "currency",

          currency:
            "BRL",

          minimumFractionDigits:
            3,

          maximumFractionDigits:
            3,
        },
      );

    insights.push({
      titulo:
        "Maior impacto de custos adicionais",

      valor:
        maiorImpactoCustos.material,

      detalhe:
        `${maiorImpactoCustos.impactoCustoPercentual.toFixed(
          1,
        )}% sobre o preço base • +${acrescimoKg}/kg`,
    });
  }

  return insights.slice(
    0,
    4,
  );
}


export function criarUltimasCompras(
  financeiro,
) {
  return comprasValidas(
    financeiro,
  )
    .sort(
      (
        a,
        b,
      ) =>
        String(
          b.dataCompra ||
          "",
        ).localeCompare(
          String(
            a.dataCompra ||
            "",
          ),
        ) ||
        numero(
          b.id,
        ) -
        numero(
          a.id,
        ),
    )
    .slice(
      0,
      20,
    );
}