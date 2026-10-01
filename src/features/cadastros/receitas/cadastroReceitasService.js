import { supabase } from "@/lib/supabaseClient";

const TOLERANCIA_PERCENTUAL = 0.0001;

function texto(valor) {
  return String(valor ?? "").trim();
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const convertido = Number(String(valor).replace(",", "."));

  return Number.isFinite(convertido) ? convertido : null;
}

function arredondarPercentual(valor) {
  const convertido = Number(valor);

  if (!Number.isFinite(convertido)) {
    return 0;
  }

  return Math.round((convertido + Number.EPSILON) * 10000) / 10000;
}

function montarReceitas(receitas, componentes, fornecedores) {
  const fornecedoresPorId = new Map(
    fornecedores.map((fornecedor) => [String(fornecedor.id), fornecedor]),
  );

  const componentesPorReceita = new Map();

  for (const componente of componentes) {
    const chave = String(componente.receita_id);

    if (!componentesPorReceita.has(chave)) {
      componentesPorReceita.set(chave, []);
    }

    const fornecedor = fornecedoresPorId.get(String(componente.fornecedor_id));

    componentesPorReceita.get(chave).push({
      id: componente.id,
      fornecedorId: componente.fornecedor_id,
      fornecedorNome:
        fornecedor?.nome || `Fornecedor ${componente.fornecedor_id}`,
      fornecedorAtivo: fornecedor?.ativo !== false,
      percentual: arredondarPercentual(componente.percentual),
      criadoEm: componente.criado_em ?? null,
      atualizadoEm: componente.atualizado_em ?? null,
    });
  }

  return receitas.map((receita) => {
    const itens = (componentesPorReceita.get(String(receita.id)) ?? []).sort(
      (itemA, itemB) =>
        itemA.fornecedorNome.localeCompare(itemB.fornecedorNome, "pt-BR", {
          sensitivity: "base",
        }),
    );

    const percentualTotal = arredondarPercentual(
      itens.reduce((total, item) => total + Number(item.percentual || 0), 0),
    );

    return {
      id: receita.id,
      nome: texto(receita.nome),
      descricao: texto(receita.descricao),
      ativo: receita.ativo === true,
      criadoEm: receita.criado_em ?? null,
      atualizadoEm: receita.atualizado_em ?? null,
      itens,
      percentualTotal,
      quantidadeComponentes: itens.length,
      configurada:
        itens.length > 0 &&
        Math.abs(percentualTotal - 100) <= TOLERANCIA_PERCENTUAL,
    };
  });
}

export async function buscarCadastroReceitas() {
  const [receitasResultado, componentesResultado, fornecedoresResultado] =
    await Promise.all([
      supabase
        .from("materia_prima_receitas")
        .select(
          `
            id,
            nome,
            descricao,
            ativo,
            criado_em,
            atualizado_em
          `,
        )
        .order("nome", { ascending: true }),

      supabase
        .from("materia_prima_receitas_componentes")
        .select(
          `
            id,
            receita_id,
            fornecedor_id,
            percentual,
            criado_em,
            atualizado_em
          `,
        )
        .order("id", { ascending: true }),

      supabase
        .from("materia_prima_fornecedores")
        .select(
          `
            id,
            nome,
            ativo,
            criado_em,
            atualizado_em
          `,
        )
        .order("nome", { ascending: true }),
    ]);

  if (receitasResultado.error) {
    throw new Error(
      receitasResultado.error.message || "Erro ao carregar as receitas.",
    );
  }

  if (componentesResultado.error) {
    throw new Error(
      componentesResultado.error.message ||
        "Erro ao carregar os componentes das receitas.",
    );
  }

  if (fornecedoresResultado.error) {
    throw new Error(
      fornecedoresResultado.error.message || "Erro ao carregar fornecedores.",
    );
  }

  const receitas = Array.isArray(receitasResultado.data)
    ? receitasResultado.data
    : [];

  const componentes = Array.isArray(componentesResultado.data)
    ? componentesResultado.data
    : [];

  const fornecedores = (Array.isArray(fornecedoresResultado.data)
    ? fornecedoresResultado.data
    : []
  ).map((fornecedor) => ({
    id: fornecedor.id,
    nome: texto(fornecedor.nome),
    ativo: fornecedor.ativo === true,
    criadoEm: fornecedor.criado_em ?? null,
    atualizadoEm: fornecedor.atualizado_em ?? null,
  }));

  return {
    receitas: montarReceitas(receitas, componentes, fornecedores),
    fornecedores,
  };
}

export async function salvarCadastroReceita({
  id = null,
  nome,
  descricao,
  itens,
}) {
  const nomeFinal = texto(nome);
  const descricaoFinal = texto(descricao);

  if (!nomeFinal) {
    throw new Error("Informe o nome da receita.");
  }

  const itensValidos = Array.isArray(itens) ? itens : [];

  if (itensValidos.length === 0) {
    throw new Error("Adicione pelo menos um fornecedor à receita.");
  }

  const payloadItens = itensValidos.map((item) => {
    const fornecedorId = Number(item?.fornecedorId);
    const percentual = numero(item?.percentual);

    if (!Number.isFinite(fornecedorId) || fornecedorId <= 0) {
      throw new Error("Existe um fornecedor inválido na receita.");
    }

    if (percentual === null || percentual <= 0 || percentual > 100) {
      throw new Error(
        "Os percentuais devem ser maiores que zero e menores ou iguais a 100.",
      );
    }

    return {
      fornecedor_id: fornecedorId,
      percentual,
    };
  });

  const fornecedoresUnicos = new Set(
    payloadItens.map((item) => String(item.fornecedor_id)),
  );

  if (fornecedoresUnicos.size !== payloadItens.length) {
    throw new Error("Não repita o mesmo fornecedor na receita.");
  }

  const total = arredondarPercentual(
    payloadItens.reduce((soma, item) => soma + item.percentual, 0),
  );

  if (Math.abs(total - 100) > TOLERANCIA_PERCENTUAL) {
    throw new Error(
      `A receita deve totalizar exatamente 100%. Total informado: ${total.toLocaleString(
        "pt-BR",
        { maximumFractionDigits: 4 },
      )}%.`,
    );
  }

  const { data, error } = await supabase.rpc(
    "salvar_receita_materia_prima_v3",
    {
      p_id: id || null,
      p_nome: nomeFinal,
      p_descricao: descricaoFinal || null,
      p_itens: payloadItens,
    },
  );

  if (error) {
    throw new Error(error.message || "Erro ao salvar a receita.");
  }

  return {
    id: data,
    acao: id ? "atualizada" : "criada",
  };
}

export async function alterarStatusCadastroReceita({
  id,
  ativo,
}) {
  const receitaId = Number(id);

  if (!Number.isFinite(receitaId) || receitaId <= 0) {
    throw new Error("Receita inválida.");
  }

  const { data, error } = await supabase.rpc(
    "alterar_status_receita_materia_prima",
    {
      p_id: receitaId,
      p_ativo: ativo === true,
    },
  );

  if (error) {
    throw new Error(
      error.message || "Erro ao alterar o status da receita.",
    );
  }

  return data;
}