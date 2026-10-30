import { converterNumeroBrOuNull, numeroParaCampo } from "@/shared/lib/numeros";

export const FORMULARIO_VAZIO = {
  dataCompra: "",
  dataPrevista: "",
  fornecedorId: "",
  materialId: "",
  quantidadeKg: "",
  numeroPedido: "",
  tipoClassificacao: "",
  observacao: "",
  ativo: true,
  precoUnitario: "",
  ipiPercentual: "",
  valorFrete: "",
  tipoFrete: "",
  valorDesconto: "",
  outrasDespesas: "",
  numeroNf: "",
  condicaoPagamento: "",
  observacaoFinanceira: "",
};

export function criarFormulario(item, hoje) {
  if (!item) {
    return { ...FORMULARIO_VAZIO, dataCompra: hoje, dataPrevista: hoje };
  }

  return {
    dataCompra: item.dataCompra || hoje,
    dataPrevista: item.dataPrevista || hoje,
    fornecedorId: String(item.fornecedorId ?? ""),
    materialId: String(item.materialId ?? ""),
    quantidadeKg: numeroParaCampo(item.quantidadeKg),
    numeroPedido: item.numeroPedido || "",
    tipoClassificacao: item.tipoClassificacao || "",
    observacao: item.observacao || "",
    ativo: item.ativo !== false,
    precoUnitario: numeroParaCampo(item.precoUnitario),
    ipiPercentual: numeroParaCampo(item.ipiPercentual),
    valorFrete: numeroParaCampo(item.valorFrete),
    tipoFrete: item.tipoFrete || "",
    valorDesconto: numeroParaCampo(item.valorDesconto),
    outrasDespesas: numeroParaCampo(item.outrasDespesas),
    numeroNf: item.numeroNf || "",
    condicaoPagamento: item.condicaoPagamento || "",
    observacaoFinanceira: item.observacaoFinanceira || "",
  };
}

export function filtrarVinculosDoFornecedor(fornecedorMateriais, fornecedorId) {
  return fornecedorMateriais.filter(
    (vinculo) => vinculo.ativo !== false && String(vinculo.fornecedorId) === String(fornecedorId),
  );
}

// Material inativo só continua na lista se já for o selecionado na compra.
export function listarMateriaisDisponiveis(vinculos, materiais, materialId) {
  return vinculos
    .map((vinculo) => {
      const material = materiais.find(
        (itemMaterial) => String(itemMaterial.id) === String(vinculo.materialId),
      );

      if (!material) {
        return null;
      }

      if (material.ativo === false && String(material.id) !== String(materialId)) {
        return null;
      }

      return {
        ...material,
        padrao: vinculo.padrao === true,
      };
    })
    .filter(Boolean);
}

export function obterMaterialInicial(vinculos) {
  if (vinculos.length === 0) {
    return "";
  }

  const vinculoPadrao = vinculos.find((vinculo) => vinculo.padrao === true) ?? vinculos[0];

  return String(vinculoPadrao.materialId);
}

function validarFinanceiro(formulario, resumoFinanceiro) {
  const campos = [
    ["Preço unitário", formulario.precoUnitario, { minimo: 0 }],
    ["IPI", formulario.ipiPercentual, { minimo: 0, maximo: 100 }],
    ["Frete", formulario.valorFrete, { minimo: 0 }],
    ["Desconto", formulario.valorDesconto, { minimo: 0 }],
    ["Outras despesas", formulario.outrasDespesas, { minimo: 0 }],
  ];

  for (const [nome, valor, regra] of campos) {
    if (String(valor ?? "").trim() === "") continue;

    const numero = converterNumeroBrOuNull(valor);

    if (numero === null) {
      return `${nome}: informe um valor numérico válido.`;
    }

    if (numero < regra.minimo) {
      return `${nome}: o valor não pode ser negativo.`;
    }

    if (regra.maximo !== undefined && numero > regra.maximo) {
      return `${nome}: o valor máximo é ${regra.maximo}.`;
    }
  }

  if (resumoFinanceiro.valorTotal !== null && resumoFinanceiro.valorTotal < 0) {
    return "O valor total ficou negativo. Revise o desconto informado.";
  }

  return "";
}

// Devolve a primeira mensagem de erro do formulário, ou "" quando está tudo certo.
export function validarFormulario(formulario, resumoFinanceiro) {
  const { dataCompra, dataPrevista, fornecedorId, materialId, tipoClassificacao } = formulario;
  const quantidade = converterNumeroBrOuNull(formulario.quantidadeKg);

  if (!dataCompra) return "Informe a data da compra.";
  if (!dataPrevista) return "Informe a previsão de chegada.";
  if (dataPrevista < dataCompra) return "A previsão não pode ser anterior à data da compra.";
  if (!fornecedorId) return "Selecione o fornecedor.";
  if (!materialId) return "Selecione o material.";
  if (!tipoClassificacao) return "Selecione o tipo do material.";
  if (quantidade === null || quantidade <= 0) return "Informe uma quantidade maior que zero.";

  return validarFinanceiro(formulario, resumoFinanceiro);
}

export function montarCompraDoFormulario(formulario, item) {
  return {
    id: item?.id ?? null,
    dataCompra: formulario.dataCompra,
    dataPrevista: formulario.dataPrevista,
    dataRecebimento: item?.dataRecebimento ?? null,
    fornecedorId: formulario.fornecedorId,
    materialId: formulario.materialId,
    quantidadeKg: converterNumeroBrOuNull(formulario.quantidadeKg),
    numeroPedido: formulario.numeroPedido,
    tipoClassificacao: formulario.tipoClassificacao,
    status:
      item?.status === "RECEBIDA" || item?.status === "CANCELADA" ? item.status : "CONFIRMADA",
    observacao: formulario.observacao,
    ativo: formulario.ativo,
    precoUnitario: converterNumeroBrOuNull(formulario.precoUnitario),
    ipiPercentual: converterNumeroBrOuNull(formulario.ipiPercentual),
    valorFrete: converterNumeroBrOuNull(formulario.valorFrete),
    tipoFrete: formulario.tipoFrete,
    valorDesconto: converterNumeroBrOuNull(formulario.valorDesconto),
    outrasDespesas: converterNumeroBrOuNull(formulario.outrasDespesas),
    numeroNf: formulario.numeroNf,
    condicaoPagamento: formulario.condicaoPagamento,
    observacaoFinanceira: formulario.observacaoFinanceira,
  };
}

export function descreverStatusCompra(status) {
  if (status === "RECEBIDA") {
    return {
      nome: "Recebida",
      descricao:
        "A chegada desta compra já foi confirmada. O recebimento não é alterado nesta edição.",
    };
  }

  if (status === "CANCELADA") {
    return {
      nome: "Cancelada",
      descricao: "A compra está cancelada e o status não é alterado nesta edição.",
    };
  }

  return {
    nome: "Confirmada",
    descricao:
      "A compra permanece confirmada. Para registrar a chegada, use o botão Confirmar chegada na tabela.",
  };
}
