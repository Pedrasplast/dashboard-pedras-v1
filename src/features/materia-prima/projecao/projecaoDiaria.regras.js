/* =========================================================
   PROJEÇÃO DIÁRIA — REGRAS DA TELA
   ---------------------------------------------------------
   Funções puras e constantes usadas pela tela; movidas do
   componente sem alteração.
========================================================= */

import { formatarDuasCasas } from "@/shared/lib/formatar";
import { paraNumero } from "@/shared/lib/numeros";

/* =========================================================
   HELPERS
========================================================= */

export function dataLocal(offsetDias = 0) {
  const data = new Date();

  data.setDate(data.getDate() + offsetDias);

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export function formatarKg(valor) {
  if (valor === null || valor === undefined) {
    return "-";
  }

  return `${formatarDuasCasas(Number(valor))} kg`;
}

/* =========================================================
   AGRUPAR FORNECEDORES
========================================================= */

export function agruparPorFornecedor(linhas = []) {
  const mapa = new Map();

  for (const linha of linhas) {
    const id = String(linha?.fornecedorId ?? "");

    if (!id) {
      continue;
    }

    if (!mapa.has(id)) {
      mapa.set(id, {
        fornecedorId: linha.fornecedorId,
        fornecedorNome: linha.fornecedorNome || `Fornecedor ${linha.fornecedorId}`,
        linhas: [],
      });
    }

    mapa.get(id).linhas.push(linha);
  }

  return [...mapa.values()]
    .map((grupo) => {
      const linhasOrdenadas = [...grupo.linhas].sort((a, b) =>
        String(a.data ?? "").localeCompare(String(b.data ?? "")),
      );

      const ultima = linhasOrdenadas.at(-1);

      return {
        ...grupo,

        linhas: linhasOrdenadas,

        possuiSaldoBase: linhasOrdenadas.some((linha) => linha.possuiSaldoBase === true),

        recebidoKg: linhasOrdenadas.reduce(
          (total, linha) => total + paraNumero(linha.recebidoKg),
          0,
        ),

        compraFuturaKg: linhasOrdenadas.reduce(
          (total, linha) => total + paraNumero(linha.compraFuturaKg),
          0,
        ),

        consumoKg: linhasOrdenadas.reduce((total, linha) => total + paraNumero(linha.consumoKg), 0),

        saldoFinalKg: ultima?.saldoFinalKg == null ? null : paraNumero(ultima.saldoFinalKg),
      };
    })
    .sort((a, b) =>
      a.fornecedorNome.localeCompare(b.fornecedorNome, "pt-BR", {
        sensitivity: "base",
        numeric: true,
      }),
    );
}
