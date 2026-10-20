
import { supabase } from "@/lib/supabaseClient";

import {
  TABELA_PRECOS,
  CAMPOS_TABELA_PRECOS,
} from "../constants/tabelaPrecos.constants";

/* =========================================================
   TABELA DE PREÇOS — SERVIÇO

   Os materiais exibidos são definidos pelo campo:
   materia_prima_materiais.exibir_tabela_precos

   Regras:
   - Somente materiais ativos e selecionados.
   - Sempre usar o código Omie atual.
   - Filtrar preços diretamente no Supabase.
   - Não modificar históricos.
========================================================= */

const TABELA_MATERIAIS = "materia_prima_materiais";

function normalizarCodigo(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

/* =========================================================
   CONSULTAR MATERIAIS HABILITADOS
========================================================= */

async function buscarCodigosHabilitados() {
  const { data, error } = await supabase
    .from(TABELA_MATERIAIS)
    .select("id,nome,codigo_omie")
    .eq("ativo", true)
    .eq("exibir_tabela_precos", true)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(
      "Erro ao consultar materiais habilitados " +
      `para a Tabela de Preços: ${error.message}`
    );
  }

  const codigos = (data ?? [])
    .map((material) =>
      normalizarCodigo(material.codigo_omie)
    )
    .filter(Boolean);

  return [...new Set(codigos)];
}

/* =========================================================
   CONSULTAR UMA PÁGINA DE PREÇOS
========================================================= */

async function buscarPagina(inicio, fim, codigos) {
  const { data, error } = await supabase
    .from(TABELA_PRECOS.VIEW_SUPABASE)
    .select(CAMPOS_TABELA_PRECOS)
    .in("codigo_produto", codigos)
    .order("codigo_produto_omie", {
      ascending: true,
    })
    .range(inicio, fim);

  if (error) {
    throw new Error(
      `Erro ao consultar a Tabela de Preços: ${error.message}`
    );
  }

  return data ?? [];
}

/* =========================================================
   CONSULTA COMPLETA

   Os códigos permitidos vêm do Cadastro
   de Material.

   Nenhum ID de material fica fixo no código.
========================================================= */

export async function buscarTabelaPrecos() {
  const codigos = await buscarCodigosHabilitados();

  if (codigos.length === 0) {
    return [];
  }

  const tamanho = Math.max(
    1,
    Number(TABELA_PRECOS.REGISTROS_POR_PAGINA) || 500
  );

  const registros = [];
  let inicio = 0;

  while (true) {
    const pagina = await buscarPagina(
      inicio,
      inicio + tamanho - 1,
      codigos
    );

    registros.push(...pagina);

    if (pagina.length < tamanho) {
      break;
    }

    inicio += tamanho;
  }

  const permitidos = new Set(codigos);

  return registros.filter((registro) =>
    permitidos.has(
      normalizarCodigo(registro.codigo_produto)
    )
  );
}
