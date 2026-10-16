
import { supabase } from "@/lib/supabaseClient";

import {
  TABELA_PRECOS,
  CAMPOS_TABELA_PRECOS,
} from "../constants/tabelaPrecos.constants";

/* =========================================================
   BUSCAR UMA PÁGINA
========================================================= */

async function buscarPagina(inicio, fim) {
  const { data, error } = await supabase
    .from(TABELA_PRECOS.VIEW_SUPABASE)
    .select(CAMPOS_TABELA_PRECOS)
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

   Paginação de 500 registros por chamada.
========================================================= */

export async function buscarTabelaPrecos() {
  const todos = [];

  const tamanho =
    TABELA_PRECOS.REGISTROS_POR_PAGINA;

  let inicio = 0;

  while (true) {
    const fim = inicio + tamanho - 1;

    const pagina = await buscarPagina(
      inicio,
      fim
    );

    todos.push(...pagina);

    if (pagina.length < tamanho) {
      break;
    }

    inicio += tamanho;
  }

  return todos;
}
