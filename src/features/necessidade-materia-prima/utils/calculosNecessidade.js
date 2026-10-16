
export function numero(valor) {
  const convertido = Number(valor ?? 0);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

export function formatarKg(valor) {
  return numero(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatarMoeda(valor) {
  if (valor == null) return "—";

  return numero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function calcularNecessidade({
  consumo,
  percentual,
  estoque,
  comprasFuturas,
  teto,
  preco,
}) {
  const consumoConsiderado =
    numero(consumo) * (numero(percentual) / 100);

  const saldoProjetado =
    numero(estoque) +
    numero(comprasFuturas) -
    consumoConsiderado;

  const necessidade = Math.max(
    0,
    numero(teto) - saldoProjetado
  );

  return {
    consumoConsiderado,
    saldoProjetado,
    necessidade,
    valorEstimado: necessidade * numero(preco),
  };
}

export function consolidarNecessidade(
  dados,
  ajustes = {}
) {
  if (!dados) return [];

  const consumos = new Map(
    dados.consumos.map((item) => [
      String(item.material_id),
      item,
    ])
  );

  const estoquePorCodigo = new Map(
    dados.estoques.map((item) => [
      String(item.codigo_produto_omie),
      item,
    ])
  );

  const comprasPorCodigo = new Map(
    dados.comprasFuturas.map((item) => [
      String(item.codigo_produto_omie),
      item,
    ])
  );

  const precosPorCodigo = new Map(
    dados.precos.map((item) => [
      String(item.codigo_produto_omie),
      item,
    ])
  );

  return dados.materiais
    .filter((material) => material.ativo)
    .map((material) => {
      const id = String(material.id);

      const codigos = [
        ...new Set(
          dados.vinculos
            .filter(
              (vinculo) =>
                vinculo.ativo &&
                String(vinculo.material_id) === id
            )
            .map((vinculo) =>
              String(vinculo.codigo_produto_omie)
            )
        ),
      ];

      const posicoes = codigos
        .map((codigo) =>
          estoquePorCodigo.get(codigo)
        )
        .filter(Boolean);

      const estoqueApi = posicoes.reduce(
        (total, item) =>
          total + numero(item.fisico),
        0
      );

      const comprasFuturas = codigos.reduce(
        (total, codigo) =>
          total +
          numero(
            comprasPorCodigo.get(codigo)
              ?.quantidade_futura
          ),
        0
      );

      const historico = codigos
        .map((codigo) =>
          precosPorCodigo.get(codigo)
        )
        .filter(Boolean)
        .sort((a, b) =>
          String(b.ultima_compra ?? "")
            .localeCompare(
              String(a.ultima_compra ?? "")
            )
        );

      const preco = numero(
        historico[0]?.ultimo_preco
      );

      const ajuste = ajustes[id] ?? {};

      const consumo = numero(
        consumos.get(id)?.consumo_total_kg
      );

      const percentual =
        ajuste.percentual ?? 100;

      const estoque =
        ajuste.estoque ?? estoqueApi;

      const teto = ajuste.teto ?? 0;

      const estoqueDisponivel =
        posicoes.length > 0 ||
        ajuste.estoque !== undefined;

      const calculo = calcularNecessidade({
        consumo,
        percentual,
        estoque,
        comprasFuturas,
        teto,
        preco,
      });

      return {
        id: material.id,
        material: material.nome,
        consumo,
        percentual,
        estoqueApi,
        estoque,
        estoqueDisponivel,
        comprasFuturas,
        teto,
        preco,
        ...calculo,
      };
    })
    .sort((a, b) =>
      a.material.localeCompare(
        b.material,
        "pt-BR"
      )
    );
}
