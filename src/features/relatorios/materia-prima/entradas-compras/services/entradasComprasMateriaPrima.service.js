import { supabase } from "@/lib/supabaseClient";
import { paraNumeroOu, paraNumeroOuNull } from "@/shared/lib/numeros";
import { paraTexto } from "@/shared/lib/texto";

export const SITUACOES_ENTRADAS_COMPRAS = [
  {
    valor: "TODAS",
    nome: "Todas",
  },
  {
    valor: "RECEBIDAS",
    nome: "Recebidas",
  },
  {
    valor: "FUTURAS",
    nome: "Futuras",
  },
  {
    valor: "ENCERRADAS",
    nome: "Encerradas",
  },
];

export const DATAS_REFERENCIA_ENTRADAS_COMPRAS = [
  {
    valor: "EMISSAO",
    nome: "Emissão",
  },
  {
    valor: "PREVISAO",
    nome: "Previsão de recebimento",
  },
  {
    valor: "RECEBIMENTO",
    nome: "Recebimento",
  },
];

/* =========================================================
   ORIGEM: OMIE (23/10)
   Mesma base do Dashboard de Matéria-Prima: pedidos de compra do
   departamento 11 — Suprimentos PP, etapa 15, sem cancelados,
   com as NF-e de entrada. Coluna Tipo removida (era só manual).
========================================================= */
const VIEW_OMIE = "dashboard_mp_compras_omie";
const TAMANHO_PAGINA = 1000;

const CAMPOS_OMIE = [
  "cod_ped_compra",
  "codigo_item",
  "numero_pedido",
  "data_inclusao",
  "data_previsao",
  "codigo_fornecedor",
  "fornecedor_nome",
  "codigo_produto",
  "descricao",
  "material_id",
  "material_nome",
  "quantidade",
  "quantidade_recebida",
  "preco_unitario",
  "ipi_percentual",
  "valor_total",
  "data_recebimento",
  "numeros_nf",
  "encerrado",
].join(",");

/**
 * Converte um item de pedido do Omie em linhas do relatório:
 * - parte recebida → RECEBIDA (data = "Recebido em" da NF; sem NF, previsão);
 * - saldo a receber → FUTURA;
 * - saldo de pedido encerrado no Omie → ENCERRADA (não vai mais chegar
 *   pelo pedido; muitos foram recebidos com NF sem vínculo ao pedido).
 * Valores proporcionais à quantidade de cada parte.
 */
export function normalizarItemOmie(registro) {
  if (!registro) return [];
  const quantidade = paraNumeroOu(registro.quantidade);
  if (!(quantidade > 0)) return [];
  const recebida = Math.min(Math.max(paraNumeroOu(registro.quantidade_recebida), 0), quantidade);
  const saldo = quantidade - recebida;
  const total = paraNumeroOu(registro.valor_total);
  const chave = `${registro.cod_ped_compra}-${registro.codigo_item}`;
  const fornecedorId = paraTexto(registro.codigo_fornecedor) || "sem-fornecedor";
  const materialId =
    registro.material_id != null
      ? String(registro.material_id)
      : `omie-${paraTexto(registro.codigo_produto) || "sem-codigo"}`;

  const base = {
    pedido: paraTexto(registro.numero_pedido),
    emissao: paraTexto(registro.data_inclusao),
    previsaoRecebimento: paraTexto(registro.data_previsao),
    fornecedorId,
    fornecedor: paraTexto(registro.fornecedor_nome) || "Fornecedor não encontrado",
    materialId,
    material:
      paraTexto(registro.material_nome) ||
      paraTexto(registro.descricao) ||
      "Material não encontrado",
    preco: paraNumeroOuNull(registro.preco_unitario),
    ipiPercentual: paraNumeroOuNull(registro.ipi_percentual),
  };

  const linhas = [];
  if (recebida > 0) {
    linhas.push({
      ...base,
      id: `${chave}-R`,
      recebido: paraTexto(registro.data_recebimento) || paraTexto(registro.data_previsao),
      quantidadeKg: recebida,
      total: total * (recebida / quantidade),
      numeroNf: paraTexto(registro.numeros_nf),
      statusOriginal: saldo > 0 ? "PARCIAL" : "RECEBIDA",
      situacao: "RECEBIDA",
    });
  }
  if (saldo > 0) {
    const encerrado = registro.encerrado === true;
    linhas.push({
      ...base,
      id: `${chave}-${encerrado ? "E" : "F"}`,
      recebido: "",
      quantidadeKg: saldo,
      total: total * (saldo / quantidade),
      numeroNf: "",
      statusOriginal: encerrado ? "ENCERRADO" : recebida > 0 ? "PARCIAL" : "PENDENTE",
      situacao: encerrado ? "ENCERRADA" : "FUTURA",
    });
  }
  return linhas;
}

function criarOpcoesUnicas(registros, campoId, campoNome) {
  const mapa = new Map();

  registros.forEach((registro) => {
    const id = registro?.[campoId];
    const nome = paraTexto(registro?.[campoNome]);

    if (id === null || id === undefined || id === "" || !nome) {
      return;
    }

    mapa.set(String(id), {
      id,
      nome,
    });
  });

  return [...mapa.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", {
      sensitivity: "base",
    }),
  );
}

export function criarResultadoEntradasComprasVazio() {
  return {
    registros: [],
    fornecedores: [],
    materiais: [],
  };
}

/* =========================================================
   CONSULTA

   Não cria dados novos.
   Apenas lê as tabelas já existentes do módulo de matéria-prima.
========================================================= */

export async function buscarRelatorioEntradasComprasMateriaPrima() {
  const itens = [];
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await supabase
      .from(VIEW_OMIE)
      .select(CAMPOS_OMIE)
      .order("data_inclusao", { ascending: false })
      .order("cod_ped_compra", { ascending: false })
      .order("codigo_item", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;
    const pagina = Array.isArray(data) ? data : [];
    itens.push(...pagina);
    if (pagina.length < TAMANHO_PAGINA) break;
  }

  const registros = itens.flatMap(normalizarItemOmie).sort((a, b) => {
    const dataA = a.recebido || a.previsaoRecebimento || a.emissao || "";
    const dataB = b.recebido || b.previsaoRecebimento || b.emissao || "";
    return dataB.localeCompare(dataA) || String(b.id).localeCompare(String(a.id));
  });

  const fornecedoresFiltro = criarOpcoesUnicas(registros, "fornecedorId", "fornecedor");

  const materiaisFiltro = criarOpcoesUnicas(registros, "materialId", "material");

  return {
    registros,
    fornecedores: fornecedoresFiltro,
    materiais: materiaisFiltro,
  };
}
